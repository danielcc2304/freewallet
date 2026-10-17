-- Administrative, one-case repair for a fully transferred source and a NEW
-- destination, followed only by one erroneous manual edit. Not an RPC and never
-- executable by clients. Caller sets LOCAL freewallet.transfer_repair to JSON
-- inside a transaction, then runs this block. See docs/fund-transfer-repair.md.
do $repair$
declare
    p jsonb := current_setting('freewallet.transfer_repair',true)::jsonb;
    owner_id uuid; repair_id uuid; revision_before bigint; previous_data jsonb; portfolio jsonb;
    operation jsonb; correction jsonb; destination jsonb; patched jsonb; next_assets jsonb; next_ledger jsonb;
    source_id text; destination_id text; basis numeric; units numeric; unit_cost numeric; gross numeric;
    before_state jsonb; snapshot_before jsonb; reference_date date; snapshots_changed integer;
begin
    if p is null then raise exception 'Repair input required'; end if;
    owner_id := (p->>'userId')::uuid; repair_id := (p->>'repairId')::uuid;
    select revision into revision_before from public.user_portfolios where user_id=owner_id for update;
    if exists(select 1 from portfolio_private.support_repairs where id=repair_id and user_id=owner_id) then return; end if;
    if revision_before is distinct from (p->>'expectedRevision')::bigint then
        raise exception 'Portfolio changed; inspect again before repairing' using errcode='40001'; end if;
    select data into previous_data from portfolio_private.documents where user_id=owner_id for update;
    portfolio := (previous_data->>'freewallet_portfolio_v1')::jsonb;
    select t into operation from jsonb_array_elements(portfolio->'transactions') t where t->>'id'=p->>'transferId';
    select t into correction from jsonb_array_elements(portfolio->'transactions') t where t->>'id'=p->>'correctionId';
    if operation is null or operation->>'type' is distinct from 'transfer' or correction is null
        or correction->>'type' is distinct from 'edit' or correction->>'assetId' is distinct from operation->>'transferToAssetId' then
        raise exception 'Expected transfer and manual correction not found'; end if;
    source_id:=operation->>'assetId'; destination_id:=operation->>'transferToAssetId';
    basis:=(operation->>'transferBasis')::numeric; units:=(p->>'destinationUnits')::numeric; gross:=(p->>'gross')::numeric;
    reference_date:=(p->>'destinationDate')::date;
    if units is null or units<=0 or units in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric)
        or gross is null or gross<=0 or gross in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric)
        or basis is null or basis<0 or basis in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric)
        or (operation->>'quantity')::numeric is distinct from (p->>'sourceUnits')::numeric
        or (operation->>'price')::numeric is distinct from (p->>'sourcePrice')::numeric
        or (operation->>'transferToPrice')::numeric is distinct from (p->>'destinationPrice')::numeric
        or abs(gross-(p->>'sourceUnits')::numeric*(p->>'sourcePrice')::numeric)>.02
        or abs(gross-units*(p->>'destinationPrice')::numeric)>.02
        or (p->>'sourceDate')::date>reference_date then
        raise exception 'Invalid confirmation amounts or dates'; end if;
    select a into destination from jsonb_array_elements(portfolio->'assets') a where a->>'id'=destination_id;
    if destination is null or destination->>'isin' is distinct from p->>'destinationIsin'
        or operation->>'assetSymbol' is distinct from p->>'sourceIsin'
        or (destination->>'quantity')::numeric is distinct from units
        or (destination->>'purchasePrice')::numeric is distinct from (p->>'expectedCurrentCost')::numeric
        or exists(select 1 from jsonb_array_elements(portfolio->'assets') a where a->>'id'=source_id)
        or exists(select 1 from jsonb_array_elements(portfolio->'transactions') t
            where (t->>'assetId'=destination_id or t->>'transferToAssetId'=destination_id)
                and t->>'id' not in (operation->>'id',correction->>'id')) then
        raise exception 'Unexpected destination history; manual review required'; end if;
    -- Prove the carried cost against the closed source ledger. This narrow
    -- repair deliberately refuses prior sales, edits or earlier transfers.
    if exists(select 1 from jsonb_array_elements(portfolio->'transactions') t
            where (t->>'assetId'=source_id or t->>'transferToAssetId'=source_id)
                and t->>'id'<>operation->>'id' and (t->>'type' is distinct from 'buy' or t->>'assetId'<>source_id))
        or (select sum((t->>'quantity')::numeric) from jsonb_array_elements(portfolio->'transactions') t
            where t->>'assetId'=source_id and t->>'type'='buy') is distinct from (p->>'sourceUnits')::numeric
        or (select sum((t->>'total')::numeric) from jsonb_array_elements(portfolio->'transactions') t
            where t->>'assetId'=source_id and t->>'type'='buy') is distinct from basis then
        raise exception 'Source units or acquisition cost cannot be independently reconciled'; end if;
    if not exists(select 1 from public.portfolio_transactions where user_id=owner_id and id=operation->>'id'
        and transfer_basis_eur=basis and transfer_quantity=(operation->>'transferQuantity')::numeric)
        or not exists(select 1 from public.portfolio_transactions where user_id=owner_id and id=correction->>'id' and operation_type='edit') then
        raise exception 'Relational ledger and document differ'; end if;
    unit_cost:=round(basis/units,12);
    patched:=operation||jsonb_build_object('quantity',(p->>'sourceUnits')::numeric,'price',(p->>'sourcePrice')::numeric,
        'total',gross,'transferQuantity',units,'transferToPrice',(p->>'destinationPrice')::numeric,'estimated',false,
        'date',reference_date::text,'transferSourceDate',p->>'sourceDate','transferDestinationDate',reference_date::text,
        'transferSourceOrder',p->>'sourceOrder','transferDestinationOrder',p->>'destinationOrder',
        'notes',format('Traspaso confirmado con justificantes de la entidad. Reembolso %s (%s); suscripción %s (%s). Participaciones y efectivo ejecutados; coste de adquisición heredado. Fechas fiscales originales conservadas.',
            p->>'sourceOrder',p->>'sourceDate',p->>'destinationOrder',reference_date));
    select jsonb_agg(case when a->>'id'=destination_id then a||jsonb_build_object('quantity',units,'purchasePrice',unit_cost) else a end order by n)
        into next_assets from jsonb_array_elements(portfolio->'assets') with ordinality as x(a,n);
    select jsonb_agg(case when t->>'id'=operation->>'id' then patched else t end order by n)
        into next_ledger from jsonb_array_elements(portfolio->'transactions') with ordinality as x(t,n) where t->>'id'<>correction->>'id';
    select coalesce(jsonb_agg(to_jsonb(s)),'[]') into snapshot_before from portfolio_private.daily_snapshots s
        where user_id=owner_id and (exists(select 1 from jsonb_array_elements(s.assets) a where a->>'id'=destination_id)
            or s.legacy_ledger_ids ? (correction->>'id') or exists(select 1 from jsonb_array_elements(s.transactions) t where t->>'id'=correction->>'id'));
    if exists(select 1 from jsonb_array_elements(snapshot_before) s cross join lateral jsonb_array_elements(s->'assets') a
        where a->>'id'=destination_id and ((a->>'quantity')::numeric<>units or (s->>'snapshot_date')::date<reference_date)) then
        raise exception 'Unexpected snapshot position or date'; end if;
    before_state:=jsonb_build_object('document',previous_data,'revision',revision_before,'snapshots',snapshot_before,
        'positions',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from public.portfolio_positions a where user_id=owner_id and id in(source_id,destination_id)),
        'transactions',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.portfolio_transactions t where user_id=owner_id and id in(operation->>'id',correction->>'id')),
        'snapshotLedger',(select coalesce(jsonb_agg(to_jsonb(l)),'[]') from portfolio_private.snapshot_ledger l where user_id=owner_id and transaction_id in(operation->>'id',correction->>'id')));
    insert into portfolio_private.support_repairs(id,user_id,reason,before_state,after_summary)
        values(repair_id,owner_id,'User-authorized broker-confirmed fund transfer reconciliation',before_state,'{}');
    update portfolio_private.documents set data=jsonb_set(previous_data,'{freewallet_portfolio_v1}',
        to_jsonb((portfolio||jsonb_build_object('assets',next_assets,'transactions',next_ledger))::text)) where user_id=owner_id;
    update public.portfolio_positions set quantity=units,purchase_price_eur=unit_cost where user_id=owner_id and id=destination_id;
    update public.portfolio_transactions set quantity=(p->>'sourceUnits')::numeric,price_eur=(p->>'sourcePrice')::numeric,total_eur=gross,
        transfer_quantity=units,transfer_to_price_eur=(p->>'destinationPrice')::numeric,operation_date=reference_date,notes=patched->>'notes'
        where user_id=owner_id and id=operation->>'id';
    -- The mistaken edit is archived above, not treated as an investment event.
    delete from public.portfolio_transactions where user_id=owner_id and id=correction->>'id';
    update portfolio_private.snapshot_ledger set payload=patched where user_id=owner_id and transaction_id=operation->>'id';
    delete from portfolio_private.snapshot_ledger where user_id=owner_id and transaction_id=correction->>'id';
    update portfolio_private.daily_snapshots s set
        assets=(select jsonb_agg(case when a->>'id'=destination_id then a||jsonb_build_object('quantity',units,'purchasePrice',unit_cost) else a end order by n) from jsonb_array_elements(s.assets) with ordinality as x(a,n)),
        transactions=(select coalesce(jsonb_agg(case when t->>'id'=operation->>'id' then patched else t end order by n),'[]') from jsonb_array_elements(s.transactions) with ordinality as x(t,n) where t->>'id'<>correction->>'id'),
        legacy_ledger_ids=case when s.legacy_ledger_ids is null then null else s.legacy_ledger_ids-(correction->>'id') end
        where user_id=owner_id and snapshot_date in(select (x->>'snapshot_date')::date from jsonb_array_elements(snapshot_before) x);
    get diagnostics snapshots_changed=row_count;
    update public.user_portfolios set revision=revision_before+1,updated_at=clock_timestamp() where user_id=owner_id;
    update portfolio_private.support_repairs set after_summary=jsonb_build_object('revision',revision_before+1,'transfer',patched,
        'destinationUnits',units,'carriedCost',basis,'destinationUnitCost',unit_cost,'snapshotsRestated',snapshots_changed,
        'documentHash',encode(sha256(convert_to((select data::text from portfolio_private.documents where user_id=owner_id),'UTF8')),'hex')) where id=repair_id;
end $repair$;
