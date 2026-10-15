begin;

alter table public.portfolio_transactions
    drop constraint portfolio_transactions_operation_type_check;
alter table public.portfolio_transactions
    add constraint portfolio_transactions_operation_type_check
    check (operation_type in ('buy','sell','transfer','edit','delete'));

alter table public.portfolio_transactions
    add column transfer_to_asset_id text,
    add column transfer_to_asset_symbol text,
    add column transfer_to_asset_name text,
    add column transfer_to_asset_type text,
    add column transfer_quantity numeric(30,12),
    add column transfer_to_price_eur numeric(30,12),
    add column transfer_basis_eur numeric(38,12);

alter table public.portfolio_transactions
    add constraint portfolio_transactions_transfer_fields_check check (
        (operation_type = 'transfer'
            and asset_type = 'fund'
            and transfer_to_asset_id is not null
            and transfer_to_asset_id <> asset_id
            and transfer_to_asset_symbol is not null
            and transfer_to_asset_name is not null
            and transfer_to_asset_type = 'fund'
            and transfer_quantity is not null and transfer_quantity > 0 and transfer_quantity <> 'NaN'::numeric
            and transfer_to_price_eur is not null and transfer_to_price_eur > 0 and transfer_to_price_eur <> 'NaN'::numeric
            and transfer_basis_eur is not null and transfer_basis_eur >= 0 and transfer_basis_eur <> 'NaN'::numeric)
        or
        (operation_type <> 'transfer'
            and transfer_to_asset_id is null
            and transfer_to_asset_symbol is null
            and transfer_to_asset_name is null
            and transfer_to_asset_type is null
            and transfer_quantity is null
            and transfer_to_price_eur is null
            and transfer_basis_eur is null)
    );

do $migration$
declare
    definition text;
    marker text;
    replacement text;
    insert_marker text;
    insert_replacement text;
begin
    select pg_get_functiondef('portfolio_private.write_state(bigint,uuid,text,jsonb)'::regprocedure)
    into definition;

    definition := replace(
        definition,
        'additions integer; asset_id text; replayed jsonb;',
        'additions integer; asset_id text; replayed jsonb; target_id text; old_target jsonb; target_asset jsonb; target_new jsonb; target_qty numeric; target_price numeric; target_old_qty numeric; target_old_price numeric; target_basis numeric; target_total_qty numeric; transfer_total numeric;'
    );

    marker := $marker$
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
            select coalesce(jsonb_agg(case when a->>'id'=asset_id then new_asset else a end),'[]') into assets
            from jsonb_array_elements(assets) a where a->>'id' <> asset_id or new_asset is not null;
    $marker$;

    replacement := $replacement$
            asset_id := operation->>'assetId';
            select a into old_asset from jsonb_array_elements(previous->'assets') a where a->>'id' = asset_id;
            select a into new_asset from jsonb_array_elements(assets) a where a->>'id' = asset_id;
            qty := (operation->>'quantity')::numeric; price := (operation->>'price')::numeric;
            if qty is null or price is null or qty < 0 or (operation->>'type' in ('buy','sell') and qty = 0)
                or price < 0 or qty in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric)
                or price in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) then
                raise exception 'Invalid operation amount' using errcode = '22023'; end if;
            old_qty := coalesce((old_asset->>'quantity')::numeric,0);
            old_price := coalesce((old_asset->>'purchasePrice')::numeric,0);
            if operation->>'type' = 'transfer' then
                target_id := operation->>'transferToAssetId';
                select a into old_target from jsonb_array_elements(previous->'assets') a where a->>'id' = target_id;
                select a into target_asset from jsonb_array_elements(assets) a where a->>'id' = target_id;
                if target_id is null or target_id = asset_id or old_asset is null or old_target is null or target_asset is null
                    or old_asset->>'type' <> 'fund' or old_target->>'type' <> 'fund'
                    or operation->>'transferToAssetType' is distinct from 'fund'
                    or operation->>'transferToAssetSymbol' is distinct from old_target->>'symbol'
                    or operation->>'transferToAssetName' is distinct from old_target->>'name'
                    or operation->>'assetSymbol' is distinct from old_asset->>'symbol'
                    or operation->>'assetName' is distinct from old_asset->>'name'
                    or operation->>'assetType' is distinct from old_asset->>'type' then
                    raise exception 'Invalid transfer positions' using errcode='22023'; end if;
                if case when nullif(old_asset->>'isin','') is not null and nullif(old_target->>'isin','') is not null
                    then upper(old_asset->>'isin') = upper(old_target->>'isin')
                    else upper(old_asset->>'symbol') = upper(old_target->>'symbol') end then
                    raise exception 'Transfer destination must be another fund' using errcode='22023'; end if;
                if (select coalesce(jsonb_agg(a order by a->>'id'),'[]') from jsonb_array_elements(assets) a where a->>'id' not in (asset_id,target_id))
                    <> (select coalesce(jsonb_agg(a order by a->>'id'),'[]') from jsonb_array_elements(previous->'assets') a where a->>'id' not in (asset_id,target_id)) then
                    raise exception 'Unrelated positions changed' using errcode='22023'; end if;
                target_qty := (operation->>'transferQuantity')::numeric;
                target_basis := (operation->>'transferBasis')::numeric;
                transfer_total := (operation->>'total')::numeric;
                target_price := coalesce((operation->>'transferToPrice')::numeric, transfer_total / nullif(target_qty,0));
                target_old_qty := coalesce((old_target->>'quantity')::numeric,0);
                target_old_price := coalesce((old_target->>'purchasePrice')::numeric,0);
                target_total_qty := target_old_qty + target_qty;
                if qty <= 0 or price <= 0 or old_qty <= 0 or qty > old_qty + 0.00000001
                    or target_qty is null or target_qty <= 0 or target_price is null or target_price <= 0
                    or target_basis is null or target_basis < 0 or transfer_total is null or transfer_total <= 0
                    or target_total_qty <= 0
                    or target_qty in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric)
                    or target_price in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric)
                    or target_basis in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric)
                    or transfer_total in ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric)
                    or abs(transfer_total - qty * price) > greatest(0.01,abs(transfer_total)*0.000000001)
                    or abs(target_qty - transfer_total / target_price) > 0.00000001
                    or abs(target_basis - qty * old_price) > greatest(0.01,abs(target_basis)*0.0000001)
                    or target_basis > old_qty * old_price + greatest(0.01,old_qty * old_price * 0.0000001) then
                    raise exception 'Invalid transfer amounts' using errcode='22023'; end if;
                remaining := greatest(0,old_qty-qty);
                if remaining > 0.0000000001 then
                    new_asset := old_asset || jsonb_build_object('quantity',round(remaining,12));
                else new_asset := null; end if;
                target_new := old_target || jsonb_build_object(
                    'quantity',round(target_total_qty,12),
                    'purchasePrice',round((target_old_qty * target_old_price + target_basis) / target_total_qty,12),
                    'purchaseDate',least((old_target->>'purchaseDate')::date,(old_asset->>'purchaseDate')::date)::text
                );
                select coalesce(jsonb_agg(position order by ordinal),'[]') into assets
                from (
                    select case when old_position->>'id'=asset_id then new_asset
                        when old_position->>'id'=target_id then target_new else old_position end as position, ordinal
                    from jsonb_array_elements(previous->'assets') with ordinality as old_positions(old_position,ordinal)
                ) positions where position is not null;
            else
                if (select coalesce(jsonb_agg(a order by a->>'id'),'[]') from jsonb_array_elements(assets) a where a->>'id' <> asset_id)
                    <> (select coalesce(jsonb_agg(a order by a->>'id'),'[]') from jsonb_array_elements(previous->'assets') a where a->>'id' <> asset_id) then
                    raise exception 'Unrelated positions changed' using errcode = '22023'; end if;
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
                select coalesce(jsonb_agg(case when a->>'id'=asset_id then new_asset else a end),'[]') into assets
                from jsonb_array_elements(assets) a where a->>'id' <> asset_id or new_asset is not null;
            end if;
    $replacement$;

    if strpos(definition,'target_id text; old_target jsonb;') = 0
        or strpos(definition,marker) = 0 then
        raise exception 'Portfolio command changed; review fund transfer support';
    end if;
    definition := replace(definition,marker,replacement);

    insert_marker := $insert_marker$
        insert into public.portfolio_transactions(user_id,id,asset_id,asset_symbol,asset_name,asset_type,operation_type,operation_date,
            quantity,price_eur,total_eur,provenance,notes,recorded_at)
        values (owner_id,item->>'id',item->>'assetId',item->>'assetSymbol',item->>'assetName',item->>'assetType',item->>'type',
            (item->>'date')::date,(item->>'quantity')::numeric,(item->>'price')::numeric,(item->>'total')::numeric,
            coalesce(item->>'provenance','legacy-import'),item->>'notes',(item->>'createdAt')::timestamptz)
    $insert_marker$;
    insert_replacement := $insert_replacement$
        insert into public.portfolio_transactions(user_id,id,asset_id,asset_symbol,asset_name,asset_type,operation_type,operation_date,
            quantity,price_eur,total_eur,provenance,notes,recorded_at,transfer_to_asset_id,transfer_to_asset_symbol,
            transfer_to_asset_name,transfer_to_asset_type,transfer_quantity,transfer_to_price_eur,transfer_basis_eur)
        values (owner_id,item->>'id',item->>'assetId',item->>'assetSymbol',item->>'assetName',item->>'assetType',item->>'type',
            (item->>'date')::date,(item->>'quantity')::numeric,(item->>'price')::numeric,(item->>'total')::numeric,
            coalesce(item->>'provenance','legacy-import'),item->>'notes',(item->>'createdAt')::timestamptz,
            nullif(item->>'transferToAssetId',''),nullif(item->>'transferToAssetSymbol',''),nullif(item->>'transferToAssetName',''),
            nullif(item->>'transferToAssetType',''),(item->>'transferQuantity')::numeric,
            case when item->>'type'='transfer' then coalesce((item->>'transferToPrice')::numeric,
                (item->>'total')::numeric/nullif((item->>'transferQuantity')::numeric,0)) end,
            (item->>'transferBasis')::numeric)
    $insert_replacement$;
    if strpos(definition,insert_marker) = 0 then
        raise exception 'Portfolio ledger insert changed; review transfer storage';
    end if;
    definition := replace(definition,insert_marker,insert_replacement);
    execute definition;
end;
$migration$;

commit;
