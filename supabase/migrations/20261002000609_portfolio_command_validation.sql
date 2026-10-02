begin;

-- Validate bounded requests before hashing, avoid quadratic duplicate scans,
-- and allow removing an imported zero-quantity position.
create or replace function portfolio_private.write_state(expected_revision bigint, request_id uuid, mode text, data jsonb) returns jsonb
language plpgsql security definer set search_path = '' set statement_timeout = '10s' as $$
declare
    owner_id uuid := portfolio_private.require_user(); current_revision bigint;
    fingerprint text;
    receipt portfolio_private.command_receipts%rowtype; inserted integer;
    key text; value jsonb; portfolio jsonb; previous jsonb; assets jsonb; ledger jsonb;
    item jsonb; operation jsonb; old_asset jsonb; new_asset jsonb;
    qty numeric; price numeric; old_qty numeric; old_price numeric; remaining numeric;
    additions integer; asset_id text;
begin
    if expected_revision is null or expected_revision < -1 or request_id is null
        or mode not in ('import','save') or mode is null or data is null
        or jsonb_typeof(data) <> 'object' or octet_length(data::text) > 8388608 then
        raise exception 'Invalid request' using errcode = '22023';
    end if;
    fingerprint := encode(sha256(convert_to(jsonb_build_array(expected_revision, mode, data)::text, 'UTF8')), 'hex');
    for key, value in select * from jsonb_each(data) loop
        if jsonb_typeof(value) <> 'string' or key not in (
            'freewallet_portfolio_v1','freewallet_history','freewallet_goals','freewallet_watchlist','freewallet_settings',
            'freewallet_theme_mode','freewallet_appearance_mode','freewallet_live_targets_v2','freewallet_live_targets',
            'freewallet_workbook_link','freewallet_portfolio_csv_holdings_raw','freewallet_portfolio_csv_evolution_raw',
            'freewallet_portfolio_csv_comparison_raw','freewallet_portfolio_csv_advanced_raw','freewallet_portfolio_csv_daily_raw',
            'freewallet_portfolio_csv_movements_raw','freewallet_portfolio_csv_objectives_raw','freewallet_portfolio_csv_control_raw',
            'freewallet_portfolio_csv_workbook_file','freewallet_portfolio_csv_updated_at',
            'freewallet_portfolio_csv_category_overrides','freewallet_portfolio_csv_bucket_targets'
        ) then raise exception 'Unsupported backup field' using errcode = '22023'; end if;
    end loop;
    portfolio := (data->>'freewallet_portfolio_v1')::jsonb;
    assets := portfolio->'assets'; ledger := portfolio->'transactions';
    if portfolio is null or portfolio->>'version' is distinct from '1'
        or jsonb_typeof(assets) is distinct from 'array' or jsonb_typeof(ledger) is distinct from 'array'
        or jsonb_array_length(assets) > 1000 or jsonb_array_length(ledger) > 20000 then
        raise exception 'Invalid portfolio' using errcode = '22023';
    end if;
    if (select count(distinct a->>'id') from jsonb_array_elements(assets) a) <> jsonb_array_length(assets) then
        raise exception 'Duplicate or missing position identifiers' using errcode='22023'; end if;
    if mode = 'import' and expected_revision <> -1 or mode = 'save' and expected_revision < 0 then
        raise exception 'Invalid mode' using errcode = '22023';
    end if;
    if mode = 'import' then
        insert into public.user_portfolios(user_id) values (owner_id) on conflict do nothing;
        get diagnostics inserted = row_count;
    end if;
    select revision into current_revision from public.user_portfolios where user_id = owner_id for update;
    if current_revision is null then raise exception 'Import required' using errcode = '22023'; end if;
    select * into receipt from portfolio_private.command_receipts r where r.user_id = owner_id and r.request_id = write_state.request_id;
    if found then
        if receipt.request_hash <> fingerprint then raise exception 'Request identifier reused' using errcode = '22023'; end if;
        return portfolio_private.read_state(null);
    end if;
    if mode = 'import' and inserted = 0 or mode = 'save' and current_revision <> expected_revision then
        raise exception 'Portfolio changed on another device' using errcode = '40001';
    end if;
    if (select count(*) from portfolio_private.command_receipts where user_id=owner_id and created_at>now()-interval '1 minute') >= 120 then
        raise exception 'Too many portfolio writes; wait one minute' using errcode='54000'; end if;
    for key,value in select * from jsonb_each(data) loop
        if key in ('freewallet_history','freewallet_goals','freewallet_watchlist') then
            item := (value#>>'{}')::jsonb;
            if jsonb_typeof(item) is distinct from 'array' or jsonb_array_length(item)>50000 then
                raise exception 'Invalid collection' using errcode='22023'; end if;
        elsif key in ('freewallet_settings','freewallet_live_targets_v2','freewallet_live_targets','freewallet_workbook_link',
            'freewallet_portfolio_csv_category_overrides','freewallet_portfolio_csv_bucket_targets') then
            if jsonb_typeof((value#>>'{}')::jsonb) is distinct from 'object' then
                raise exception 'Invalid preferences' using errcode='22023'; end if;
        elsif key='freewallet_theme_mode' and value#>>'{}' not in ('light','dark','system')
            or key='freewallet_appearance_mode' and value#>>'{}' not in ('standard','liquid-glass') then
            raise exception 'Invalid appearance' using errcode='22023';
        end if;
    end loop;
    if mode = 'save' then
        select (d.data->>'freewallet_portfolio_v1')::jsonb into previous from portfolio_private.documents d where d.user_id = owner_id;
        -- An existing ledger is append-only. Corrections use a new explicit edit.
        if exists (select 1 from jsonb_array_elements(previous->'transactions') old
            left join jsonb_array_elements(ledger) t on t->>'id'=old->>'id' where t is null or t<>old) then
            raise exception 'Existing ledger cannot be rewritten' using errcode = '22023'; end if;
        select count(*), jsonb_agg(t)->0 into additions, operation from jsonb_array_elements(ledger) t
        where not exists (select 1 from jsonb_array_elements(previous->'transactions') old where old->>'id' = t->>'id');
        if additions > 1 then raise exception 'One operation per command' using errcode = '22023'; end if;
        if additions = 0 and assets <> previous->'assets' then
            raise exception 'Position changes require a ledger operation' using errcode = '22023'; end if;
        if additions = 1 then
            asset_id := operation->>'assetId';
            select a into old_asset from jsonb_array_elements(previous->'assets') a where a->>'id' = asset_id;
            select a into new_asset from jsonb_array_elements(assets) a where a->>'id' = asset_id;
            if (select coalesce(jsonb_agg(a order by a->>'id'),'[]') from jsonb_array_elements(assets) a where a->>'id' <> asset_id)
                <> (select coalesce(jsonb_agg(a order by a->>'id'),'[]') from jsonb_array_elements(previous->'assets') a where a->>'id' <> asset_id) then
                raise exception 'Unrelated positions changed' using errcode = '22023'; end if;
            qty := (operation->>'quantity')::numeric; price := (operation->>'price')::numeric;
            if qty is null or price is null or qty < 0 or (operation->>'type' in ('buy','sell') and qty = 0) or price < 0 or qty = 'NaN'::numeric or price = 'NaN'::numeric then
                raise exception 'Invalid operation amount' using errcode = '22023'; end if;
            old_qty := coalesce((old_asset->>'quantity')::numeric,0);
            old_price := coalesce((old_asset->>'purchasePrice')::numeric,0);
            case operation->>'type'
            when 'buy' then
                if new_asset is null then raise exception 'Missing position' using errcode='22023'; end if;
                if old_asset is not null then new_asset := old_asset; end if;
                new_asset := jsonb_set(new_asset,'{quantity}',to_jsonb(old_qty + qty));
                new_asset := jsonb_set(new_asset,'{purchasePrice}',to_jsonb(round((old_qty * old_price + qty * price) / (old_qty + qty),12)));
                if old_asset is not null then new_asset := jsonb_set(new_asset,'{purchaseDate}',old_asset->'purchaseDate'); end if;
            when 'sell' then
                if old_asset is null or qty > old_qty then raise exception 'Invalid sale' using errcode='22023'; end if;
                remaining := old_qty - qty;
                if remaining > 0 then
                    if new_asset is null then raise exception 'Missing remaining position' using errcode='22023'; end if;
                    new_asset := old_asset || jsonb_build_object('quantity',remaining);
                else new_asset := null; end if;
            when 'delete' then
                if old_asset is null or new_asset is not null or qty <> old_qty then raise exception 'Invalid deletion' using errcode='22023'; end if;
                price := old_price;
                operation := jsonb_set(operation,'{price}',to_jsonb(price));
            when 'edit' then
                if old_asset is null or new_asset is null or (new_asset->>'quantity')::numeric <> qty or (new_asset->>'purchasePrice')::numeric <> price then
                    raise exception 'Invalid correction' using errcode='22023'; end if;
            else raise exception 'Unsupported operation' using errcode='22023';
            end case;
            item := coalesce(new_asset,old_asset);
            if operation->>'assetSymbol' is distinct from item->>'symbol' or operation->>'assetName' is distinct from item->>'name'
                or operation->>'assetType' is distinct from item->>'type' then
                raise exception 'Operation does not identify its position' using errcode='22023'; end if;
            select coalesce(jsonb_agg(case when a->>'id'=asset_id then new_asset else a end),'[]') into assets
            from jsonb_array_elements(assets) a where a->>'id' <> asset_id or new_asset is not null;
            operation := jsonb_set(operation,'{total}',to_jsonb(round(qty * price,12)));
            select jsonb_agg(case when t->>'id'=operation->>'id' then operation else t end) into ledger from jsonb_array_elements(ledger) t;
            portfolio := jsonb_set(jsonb_set(portfolio,'{assets}',assets),'{transactions}',ledger);
            data := jsonb_set(data,'{freewallet_portfolio_v1}',to_jsonb(portfolio::text));
        end if;
    end if;
    -- Numeric constraints, unique identifiers and dates apply to imports too.
    delete from public.portfolio_positions p where p.user_id = owner_id
        and not exists (select 1 from jsonb_array_elements(assets) a where a->>'id'=p.id);
    if mode='import' or assets<>previous->'assets' then
    for item in select * from jsonb_array_elements(assets) loop
        if (item->>'quantity')::numeric <> round((item->>'quantity')::numeric,12)
            or (item->>'purchasePrice')::numeric <> round((item->>'purchasePrice')::numeric,12) then
            raise exception 'At most twelve decimal places are supported' using errcode='22023'; end if;
        if item->>'currency' is not null and item->>'currency' <> 'EUR' then
            raise exception 'Positions must use EUR accounting prices' using errcode='22023'; end if;
        insert into public.portfolio_positions values (owner_id,item->>'id',item->>'symbol',item->>'name',item->>'type',
            nullif(item->>'isin',''),(item->>'quantity')::numeric,(item->>'purchasePrice')::numeric,(item->>'purchaseDate')::date)
        on conflict (user_id,id) do update set symbol=excluded.symbol,name=excluded.name,asset_type=excluded.asset_type,
            isin=excluded.isin,quantity=excluded.quantity,purchase_price_eur=excluded.purchase_price_eur,purchase_date=excluded.purchase_date;
    end loop;
    end if;
    for item in select t from jsonb_array_elements(ledger) t
        where not exists (select 1 from public.portfolio_transactions p where p.user_id=owner_id and p.id=t->>'id') loop
        insert into public.portfolio_transactions(user_id,id,asset_id,asset_symbol,asset_name,asset_type,operation_type,operation_date,
            quantity,price_eur,total_eur,provenance,notes,recorded_at)
        values (owner_id,item->>'id',item->>'assetId',item->>'assetSymbol',item->>'assetName',item->>'assetType',item->>'type',
            (item->>'date')::date,(item->>'quantity')::numeric,(item->>'price')::numeric,(item->>'total')::numeric,
            coalesce(item->>'provenance','legacy-import'),item->>'notes',(item->>'createdAt')::timestamptz)
        on conflict (user_id,id) do nothing;
    end loop;
    if (select count(*) from public.portfolio_transactions where user_id = owner_id) <> jsonb_array_length(ledger) then
        raise exception 'Duplicate ledger identifiers' using errcode='22023'; end if;
    insert into portfolio_private.documents values (owner_id,data) on conflict (user_id) do update set data=excluded.data;
    if mode = 'import' then
        insert into public.portfolio_imports(user_id,source,format_version,payload)
        values (owner_id,'local-migration',1,jsonb_build_object('positions',jsonb_array_length(assets),'operations',jsonb_array_length(ledger)));
    end if;
    update public.user_portfolios set revision=revision+1, updated_at=clock_timestamp() where user_id=owner_id;
    insert into portfolio_private.command_receipts values (owner_id,request_id,fingerprint,current_revision+1,now());
    delete from portfolio_private.command_receipts r where r.user_id=owner_id and (r.created_at < now()-interval '90 days'
        or r.result_revision < current_revision-4999);
    return portfolio_private.read_state(null);
end $$;

commit;
