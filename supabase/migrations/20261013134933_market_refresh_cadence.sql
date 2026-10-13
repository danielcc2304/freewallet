begin;

-- Audit which instruments were actually requested. NULL preserves the strict
-- same-run rule for legacy runs and workers already executing at deployment.
alter table portfolio_private.market_runs add column requested_instruments text[];

-- Four Madrid publication checkpoints, automatically respecting CET/CEST.
create function portfolio_private.latest_fund_refresh_slot(at_time timestamptz) returns timestamptz
language sql stable strict security invoker set search_path='' as $$
    select max(slot)
    from (
        select (((at_time at time zone 'Europe/Madrid')::date-day_offset)+make_time(hour,0,0))
            at time zone 'Europe/Madrid' as slot
        from generate_series(0,1) day_offset
        cross join (values (8),(12),(16),(22)) hours(hour)
    ) candidates where slot<=at_time;
$$;
revoke all on function portfolio_private.latest_fund_refresh_slot(timestamptz) from public,anon,authenticated,service_role;

-- Stock/crypto observations remain per-run. Funds are due after each
-- checkpoint, on first appearance or when their usable NAV has expired.
-- A failed fund stays due, so the existing 30-minute worker retries it.
create or replace function public.begin_daily_market_refresh(job_secret text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare run_id uuid; instruments jsonb; fund_slot timestamptz:=portfolio_private.latest_fund_refresh_slot(now());
begin
    if job_secret is null or not exists(select 1 from vault.decrypted_secrets where name='daily_market_job_secret' and decrypted_secret=job_secret)
    then raise exception 'Invalid job credential' using errcode='42501'; end if;
    perform pg_advisory_xact_lock(640610);
    if exists(select 1 from portfolio_private.market_runs where status='running' and started_at>now()-interval '5 minutes') then return null; end if;
    update portfolio_private.market_runs set status='failed',finished_at=now(),failures='[{"reason":"Worker lease expired"}]' where status='running';
    insert into portfolio_private.market_runs default values returning id into run_id;
    select coalesce(jsonb_agg(jsonb_build_object('instrument',typed.instrument,'type',typed.kind,'symbol',typed.symbol,'isin',typed.isin) order by typed.instrument),'[]') into instruments from (
        select distinct on(instrument) * from (
            select portfolio_private.instrument_key(asset_type,symbol,isin) instrument,asset_type kind,upper(btrim(symbol)) symbol,isin
            from public.portfolio_positions where asset_type<>'cash' and quantity>0
            union select benchmark_isin,'fund',benchmark_isin,benchmark_isin from portfolio_private.market_settings
        ) i order by instrument,kind
    ) typed
    left join lateral (
        select q.instrument,q.checked_at,q.quoted_at from portfolio_private.market_prices q
        where q.instrument=typed.instrument order by q.quoted_at desc limit 1
    ) previous on true
    where typed.kind<>'fund' or previous.instrument is null
        or previous.checked_at<fund_slot or previous.checked_at>now()+interval '5 minutes'
        or previous.quoted_at<now()-interval '7 days';
    update portfolio_private.market_runs set requested_instruments=(
        select coalesce(array_agg(i->>'instrument'),array[]::text[]) from jsonb_array_elements(instruments) i
    ) where id=run_id;
    return jsonb_build_object('id',run_id,'instruments',(select coalesce(jsonb_agg(i->>'instrument'),'[]') from jsonb_array_elements(instruments) i),
        'instrumentsV2',instruments,'portfolioIds',(select coalesce(jsonb_agg(user_id),'[]') from public.user_portfolios));
end $$;


-- Only intentionally skipped, still-current funds may reuse their NAV.
create or replace function portfolio_private.capture_snapshot(run_id uuid, portfolio_id uuid) returns text
language plpgsql security definer set search_path='' set lock_timeout='500ms' set statement_timeout='5s' as $$
declare rev bigint; document jsonb; priced_assets jsonb; stamp timestamptz; highwater bigint; from_at timestamptz; to_at timestamptz; plan text[]; fund_slot timestamptz;
begin
    select r.finished_at,r.requested_instruments,portfolio_private.latest_fund_refresh_slot(r.started_at) into stamp,plan,fund_slot from portfolio_private.market_runs r where r.id=run_id and r.status in ('success','partial');
    if stamp is null or stamp<now()-interval '5 minutes' then return 'expired'; end if;
    select revision into rev from public.user_portfolios where user_id=portfolio_id for update;
    select (d.data->>'freewallet_portfolio_v1')::jsonb into document from portfolio_private.documents d where d.user_id=portfolio_id;
    if document is null then return 'empty'; end if;
    select jsonb_agg((a.asset-'quoteOrigin'-'lastReadAt') || case when a.asset->>'type'='cash' then jsonb_build_object('currentPrice',1,'previousClose',1,'currency','EUR','quotedAt',stamp,'lastCheckedAt',stamp,'quoteSource','Saldo')
        else jsonb_build_object('currentPrice',q.price_eur,'previousClose',q.previous_close_eur,'currency','EUR','quotedAt',q.quoted_at,'lastQuoteAt',q.quoted_at,'lastCheckedAt',q.checked_at,'quoteSource',q.source,
            'originalPrice',q.original_price,'originalCurrency',q.original_currency,'originalUnit',q.original_unit,'unitScale',q.unit_scale,'fxRate',q.fx_rate,'fxAt',q.fx_at,'valuationBasis','quote-date-fx') end),
        min(q.quoted_at),max(q.quoted_at)
    into priced_assets,from_at,to_at from jsonb_array_elements(document->'assets') a(asset)
    left join lateral (select * from portfolio_private.market_prices q where q.instrument=portfolio_private.instrument_key(a.asset->>'type',a.asset->>'symbol',a.asset->>'isin') order by quoted_at desc limit 1) q on true
    having count(*)>0 and bool_and(a.asset->>'type'='cash' or coalesce(
        (q.run_id=capture_snapshot.run_id or (
            a.asset->>'type'='fund' and plan is not null and not (q.instrument=any(plan))
            and q.checked_at>=fund_slot and q.checked_at<=stamp+interval '5 minutes'
        )) and q.quoted_at>=stamp-case when a.asset->>'type'='fund' then interval '7 days' when a.asset->>'type'='crypto' then interval '2 days' else interval '4 days' end,
        false));
    if priced_assets is null then return 'incomplete'; end if;
    if exists(select 1 from jsonb_array_elements(document->'transactions') t join portfolio_private.snapshot_ledger l on l.user_id=portfolio_id and l.transaction_id=t->>'id' where l.payload<>t) then raise exception 'Immutable snapshot ledger changed'; end if;
    insert into portfolio_private.snapshot_ledger(user_id,transaction_id,payload)
    select portfolio_id,t->>'id',t from jsonb_array_elements(document->'transactions') t on conflict(user_id,transaction_id) do nothing;
    select coalesce(max(entry_no),0) into highwater from portfolio_private.snapshot_ledger where user_id=portfolio_id;
    insert into portfolio_private.daily_snapshots(user_id,snapshot_date,revision,collected_at,assets,transactions,ledger_version,observation_from,observation_to,run_id)
    values(portfolio_id,(stamp at time zone 'Europe/Madrid')::date,rev,stamp,priced_assets,'[]',highwater,coalesce(from_at,stamp),coalesce(to_at,stamp),run_id)
    on conflict(user_id,snapshot_date) do update set revision=excluded.revision,collected_at=excluded.collected_at,assets=excluded.assets,transactions='[]',ledger_version=excluded.ledger_version,legacy_ledger_ids=null,
        observation_from=excluded.observation_from,observation_to=excluded.observation_to,run_id=excluded.run_id where excluded.collected_at>=daily_snapshots.collected_at;
    return 'captured';
exception when lock_not_available then return 'busy';
end $$;


-- Keep existing privileged entry points and deny direct client invocation.
revoke all on function public.begin_daily_market_refresh(text) from public,anon,authenticated;
grant execute on function public.begin_daily_market_refresh(text) to service_role;
revoke all on function portfolio_private.capture_snapshot(uuid,uuid) from public,anon,authenticated,service_role;

commit;
