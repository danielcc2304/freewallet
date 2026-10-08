begin;

-- Pure ledger calculation, called only from the authenticated, row-locked
-- command. It reads no tables and has no externally callable privilege.
create function portfolio_private.replay_trade_position(old_asset jsonb, ledger jsonb, operation jsonb) returns jsonb
language plpgsql immutable security invoker set search_path='' as $$
declare
    entries jsonb; item jsonb; retroactive boolean; baseline_valid boolean:=true;
    units numeric; amount numeric; held numeric:=0; cost numeric:=0; remaining numeric;
    first_purchase text;
begin
    select coalesce(jsonb_agg(t order by left(t->>'date',10) collate "C",coalesce(t->>'createdAt','') collate "C",t->>'id' collate "C"),'[]')
    into entries from jsonb_array_elements(ledger) t where t->>'assetId'=operation->>'assetId';
    select coalesce(bool_or(left(t->>'date',10)>left(operation->>'date',10)),false) into retroactive
    from jsonb_array_elements(entries) t where t->>'id'<>operation->>'id';
    -- Do not manufacture the missing history of an imported/manual position.
    for item in select t from jsonb_array_elements(entries) t where t->>'id'<>operation->>'id' loop
        if item->>'type' not in ('buy','sell') or item->>'type' is null then baseline_valid:=false; exit; end if;
        units:=(item->>'quantity')::numeric;
        amount:=coalesce((item->>'total')::numeric,units*(item->>'price')::numeric);
        if item->>'provenance'='initial-position' and units=0 and amount=0 then continue; end if;
        if units is null or amount is null or units<=0 or amount<0
            or units in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric)
            or amount in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) then baseline_valid:=false; exit; end if;
        if item->>'type'='buy' then held:=held+units; cost:=cost+amount;
        else
            if held<=0 or units>held+0.00000001 then baseline_valid:=false; exit; end if;
            remaining:=greatest(0,held-units);cost:=cost*remaining/held;held:=remaining;
        end if;
    end loop;
    if not baseline_valid or abs(held-coalesce((old_asset->>'quantity')::numeric,0))>0.00000001 then
        if retroactive then raise exception 'A retroactive trade requires a complete uncorrected opening ledger' using errcode='22023'; end if;
        return null;
    end if;
    held:=0;cost:=0;
    for item in select * from jsonb_array_elements(entries) loop
        units:=(item->>'quantity')::numeric;
        amount:=coalesce((item->>'total')::numeric,units*(item->>'price')::numeric);
        if item->>'provenance'='initial-position' and units=0 and amount=0 then continue; end if;
        if units is null or amount is null or units<=0 or amount<0
            or units in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric)
            or amount in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) then
            raise exception 'Invalid historical trade amount' using errcode='22023';
        end if;
        if item->>'type'='buy' then
            first_purchase:=coalesce(first_purchase,left(item->>'date',10));held:=held+units;cost:=cost+amount;
        else
            if held<=0 or units>held+0.00000001 then
                raise exception 'Historical sale exceeds units owned on that date' using errcode='22023';
            end if;
            remaining:=greatest(0,held-units);cost:=cost*remaining/held;held:=remaining;
        end if;
    end loop;
    return jsonb_build_object('quantity',round(held,12),'purchasePrice',case when held>0 then round(cost/held,12) else 0 end,
        'purchaseDate',coalesce(first_purchase,old_asset->>'purchaseDate'));
end $$;
revoke all on function portfolio_private.replay_trade_position(jsonb,jsonb,jsonb) from public,anon,authenticated;

-- Extend the existing command after its immutable-ledger, operation identity
-- and amount validation. Keep session/MFA guards, locking, receipts and quote
-- stripping unchanged; both full-document and incremental RPCs share this path.
do $migration$
declare definition text; original text; marker text; replacement text;
begin
    select pg_get_functiondef('portfolio_private.write_state(bigint,uuid,text,jsonb)'::regprocedure) into original;
    marker:=$marker$            select jsonb_agg(case when t->>'id'=operation->>'id' then operation else t end) into ledger from jsonb_array_elements(ledger) t;
            portfolio := jsonb_set(jsonb_set(portfolio,'{assets}',assets),'{transactions}',ledger);$marker$;
    replacement:=$replacement$            select jsonb_agg(case when t->>'id'=operation->>'id' then operation else t end) into ledger from jsonb_array_elements(ledger) t;
            if operation->>'type' in ('buy','sell') then
                replayed := portfolio_private.replay_trade_position(old_asset,ledger,operation);
                if replayed is not null then
                    if (replayed->>'quantity')::numeric>0 then new_asset:=coalesce(new_asset,old_asset)||replayed;
                    else new_asset:=null; end if;
                    select coalesce(jsonb_agg(case when a->>'id'=asset_id then new_asset else a end),'[]') into assets
                    from jsonb_array_elements(assets) a where a->>'id'<>asset_id or new_asset is not null;
                    if new_asset is not null and not exists(select 1 from jsonb_array_elements(assets) a where a->>'id'=asset_id) then
                        assets:=assets||jsonb_build_array(new_asset);
                    end if;
                end if;
            end if;
            portfolio := jsonb_set(jsonb_set(portfolio,'{assets}',assets),'{transactions}',ledger);$replacement$;
    if strpos(original,marker)=0 or strpos(original,'additions integer; asset_id text;')=0
        or strpos(original,'replay_trade_position')>0 then
        raise exception 'Portfolio command changed; review chronological trade migration';
    end if;
    definition:=replace(original,'additions integer; asset_id text;','additions integer; asset_id text; replayed jsonb;');
    definition:=replace(definition,marker,replacement);
    execute definition;
end $migration$;

commit;
