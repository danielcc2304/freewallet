begin;
-- Keep the existing full-document RPC for older clients and first-time imports.
create table portfolio_private.delta_receipts (
    user_id uuid not null references public.user_portfolios(user_id) on delete cascade,
    request_id uuid not null, request_hash text not null, created_at timestamptz not null default now(),
    primary key(user_id,request_id)
);
alter table portfolio_private.delta_receipts enable row level security;
revoke all on portfolio_private.delta_receipts from public,anon,authenticated;
create function portfolio_private.patch_state(expected_revision bigint,request_id uuid,changes jsonb,removed text[]) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='10s' as $$
declare uid uuid:=portfolio_private.require_user(); rev bigint; fingerprint text; existing_hash text; original jsonb; merged jsonb; result jsonb; response_changes jsonb; key text; value jsonb; item jsonb;
begin
    if expected_revision is null or expected_revision<0 or request_id is null or changes is null or jsonb_typeof(changes)<>'object' or removed is null
        or array_position(removed,null) is not null or cardinality(removed)>30 or octet_length(changes::text)>8388608 then raise exception 'Invalid patch' using errcode='22023'; end if;
    fingerprint:=encode(sha256(convert_to(jsonb_build_array(expected_revision,changes,removed)::text,'UTF8')),'hex');
    select revision into rev from public.user_portfolios where user_id=uid for update;
    select request_hash into existing_hash from portfolio_private.delta_receipts r where r.user_id=uid and r.request_id=patch_state.request_id;
    if found then
        if existing_hash<>fingerprint then raise exception 'Request identifier reused' using errcode='22023'; end if;
        return portfolio_private.read_state(null);
    end if;
    if exists(select 1 from portfolio_private.command_receipts r where r.user_id=uid and r.request_id=patch_state.request_id) then raise exception 'Request identifier reused' using errcode='22023'; end if;
    if rev is null or rev<>expected_revision then raise exception 'Portfolio changed on another device' using errcode='40001'; end if;
    select data into original from portfolio_private.documents where user_id=uid;
    for key in select jsonb_object_keys(changes) union select unnest(removed) loop
        if key is null or key not in ('freewallet_portfolio_v1','freewallet_history','freewallet_goals','freewallet_watchlist','freewallet_settings','freewallet_theme_mode','freewallet_appearance_mode','freewallet_live_targets_v2','freewallet_live_targets','freewallet_workbook_link','freewallet_portfolio_csv_holdings_raw','freewallet_portfolio_csv_evolution_raw','freewallet_portfolio_csv_comparison_raw','freewallet_portfolio_csv_advanced_raw','freewallet_portfolio_csv_daily_raw','freewallet_portfolio_csv_movements_raw','freewallet_portfolio_csv_objectives_raw','freewallet_portfolio_csv_control_raw','freewallet_portfolio_csv_workbook_file','freewallet_portfolio_csv_updated_at','freewallet_portfolio_csv_category_overrides','freewallet_portfolio_csv_bucket_targets') then raise exception 'Unsupported backup field' using errcode='22023'; end if;
    end loop;
    if 'freewallet_portfolio_v1'=any(removed) then raise exception 'Cannot remove portfolio' using errcode='22023'; end if;
    for key,value in select * from jsonb_each(changes) loop
        if jsonb_typeof(value)<>'string' then raise exception 'Invalid field type' using errcode='22023'; end if;
        if key in ('freewallet_history','freewallet_goals','freewallet_watchlist') then
            item:=(value#>>'{}')::jsonb;
            if jsonb_typeof(item)<>'array' or jsonb_array_length(item)>50000 then raise exception 'Invalid collection' using errcode='22023'; end if;
        elsif key in ('freewallet_settings','freewallet_live_targets_v2','freewallet_live_targets','freewallet_workbook_link','freewallet_portfolio_csv_category_overrides','freewallet_portfolio_csv_bucket_targets') then
            if jsonb_typeof((value#>>'{}')::jsonb)<>'object' then raise exception 'Invalid preferences' using errcode='22023'; end if;
        elsif key='freewallet_theme_mode' and value#>>'{}' not in ('light','dark','system') or key='freewallet_appearance_mode' and value#>>'{}' not in ('standard','liquid-glass') then raise exception 'Invalid appearance' using errcode='22023'; end if;
    end loop;
    merged:=(original-removed)||changes;
    if octet_length(merged::text)>8388608 then raise exception 'Document too large' using errcode='22023'; end if;
    if not changes ? 'freewallet_portfolio_v1' then
        -- A preference-only change cannot touch units, costs or the ledger.
        -- Avoid the expensive financial revalidation and ledger scan entirely.
        if (select count(*) from portfolio_private.command_receipts where user_id=uid and created_at>now()-interval '1 minute')>=120 then raise exception 'Too many writes' using errcode='54000'; end if;
        update portfolio_private.documents set data=merged where user_id=uid;
        update public.user_portfolios set revision=revision+1,updated_at=clock_timestamp() where user_id=uid;
        insert into portfolio_private.command_receipts values(uid,request_id,fingerprint,rev+1,now());
        result:=jsonb_build_object('revision',rev+1,'data',merged);
    else
        result:=portfolio_private.write_state(expected_revision,request_id,'save',merged);
    end if;
    insert into portfolio_private.delta_receipts values(uid,request_id,fingerprint,now());
    delete from portfolio_private.delta_receipts where user_id=uid and created_at<now()-interval '90 days';
    delete from portfolio_private.command_receipts r where r.user_id=uid and (r.created_at<now()-interval '90 days' or r.result_revision<rev-4999);
    select coalesce(jsonb_object_agg(k,v),'{}') into response_changes from jsonb_each(result->'data') e(k,v) where v is distinct from original->k;
    return jsonb_build_object('revision',result->'revision','data',response_changes,'patch',true,'removed',to_jsonb(removed));
end $$;
create function public.patch_portfolio(expected_revision bigint,request_id uuid,changes jsonb,removed text[] default '{}') returns jsonb
language sql security invoker set search_path='' as $$select portfolio_private.patch_state(expected_revision,request_id,changes,removed)$$;
revoke all on function public.patch_portfolio(bigint,uuid,jsonb,text[]),portfolio_private.patch_state(bigint,uuid,jsonb,text[]) from public,anon,authenticated;
grant execute on function public.patch_portfolio(bigint,uuid,jsonb,text[]),portfolio_private.patch_state(bigint,uuid,jsonb,text[]) to authenticated;
commit;
