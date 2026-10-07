begin;
alter table portfolio_private.market_prices add column original_unit text;
alter table portfolio_private.market_prices add column unit_scale numeric not null default 1 check(unit_scale in (1,0.01));
alter table portfolio_private.market_prices add column run_id uuid references portfolio_private.market_runs(id);
update portfolio_private.market_prices set original_unit=original_currency;
alter table portfolio_private.market_prices alter column original_unit set not null;
create index market_prices_run_idx on portfolio_private.market_prices(run_id);
create index market_prices_latest_idx on portfolio_private.market_prices(instrument,quoted_at desc);

create function portfolio_private.instrument_key(kind text, symbol text, isin text) returns text
language sql immutable security invoker set search_path='' as $$select case when kind='fund' then coalesce(nullif(upper(btrim(isin)),''),upper(btrim(symbol))) else upper(btrim(symbol)) end$$;
revoke all on function portfolio_private.instrument_key(text,text,text) from public,anon,authenticated;

create or replace function public.begin_daily_market_refresh(job_secret text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare run_id uuid; instruments jsonb;
begin
    if job_secret is null or not exists(select 1 from vault.decrypted_secrets where name='daily_market_job_secret' and decrypted_secret=job_secret)
    then raise exception 'Invalid job credential' using errcode='42501'; end if;
    perform pg_advisory_xact_lock(640610);
    if exists(select 1 from portfolio_private.market_runs where status='running' and started_at>now()-interval '5 minutes') then return null; end if;
    update portfolio_private.market_runs set status='failed',finished_at=now(),failures='[{"reason":"Worker lease expired"}]' where status='running';
    insert into portfolio_private.market_runs default values returning id into run_id;
    select coalesce(jsonb_agg(jsonb_build_object('instrument',instrument,'type',kind,'symbol',symbol,'isin',isin) order by instrument),'[]') into instruments from (
        select distinct on(instrument) * from (
            select portfolio_private.instrument_key(asset_type,symbol,isin) instrument,asset_type kind,upper(btrim(symbol)) symbol,isin
            from public.portfolio_positions where asset_type<>'cash' and quantity>0
            union select benchmark_isin,'fund',benchmark_isin,benchmark_isin from portfolio_private.market_settings
        ) i order by instrument,kind
    ) typed;
    return jsonb_build_object('id',run_id,'instruments',(select coalesce(jsonb_agg(i->>'instrument'),'[]') from jsonb_array_elements(instruments) i),
        'instrumentsV2',instruments,'portfolioIds',(select coalesce(jsonb_agg(user_id),'[]') from public.user_portfolios));
end $$;

-- Publish market data in one short transaction. No portfolio row is locked here.
create or replace function public.finish_daily_market_refresh(run_id uuid, prices jsonb, failures jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare stamp timestamptz:=now();
begin
    perform pg_advisory_xact_lock(640610);
    if not exists(select 1 from portfolio_private.market_runs where id=run_id and status='running' and started_at>stamp-interval '5 minutes') then raise exception 'Expired market run'; end if;
    if jsonb_typeof(prices)<>'array' or jsonb_typeof(failures)<>'array' or jsonb_array_length(prices)>10000 then raise exception 'Invalid batch'; end if;
    if exists(select 1 from jsonb_array_elements(prices) p where (p->>'quoted_at')::timestamptz>stamp+interval '5 minutes' or (p->>'checked_at')::timestamptz not between stamp-interval '5 minutes' and stamp+interval '5 minutes') then raise exception 'Invalid batch dates'; end if;
    if exists(select 1 from jsonb_to_recordset(prices) p(original_currency text,original_unit text,unit_scale numeric,fx_rate numeric,fx_at timestamptz,quoted_at timestamptz) where
        (p.original_currency='EUR' and (p.fx_rate<>1 or p.fx_at is not null)) or
        (p.original_currency<>'EUR' and (p.fx_at is null or (p.fx_at at time zone 'UTC')::date>(p.quoted_at at time zone 'UTC')::date or (p.quoted_at at time zone 'UTC')::date-(p.fx_at at time zone 'UTC')::date>4)) or
        coalesce(p.original_unit,p.original_currency)<>p.original_currency and not (
            p.unit_scale=0.01 and (p.original_unit in ('GBp','GBX') and p.original_currency='GBP' or p.original_unit='ZAc' and p.original_currency='ZAR' or p.original_unit='ILA' and p.original_currency='ILS')) or
        coalesce(p.original_unit,p.original_currency)=p.original_currency and coalesce(p.unit_scale,1)<>1)
    then raise exception 'Invalid quote unit or FX date'; end if;
    insert into portfolio_private.market_prices(instrument,quote_date,quoted_at,price_eur,previous_close_eur,original_price,original_currency,fx_rate,fx_at,source,checked_at,original_unit,unit_scale,run_id)
    select p.instrument,(p.quoted_at at time zone 'UTC')::date,p.quoted_at,p.price_eur,p.previous_close_eur,p.original_price,p.original_currency,p.fx_rate,p.fx_at,p.source,p.checked_at,coalesce(p.original_unit,p.original_currency),coalesce(p.unit_scale,1),run_id
    from jsonb_to_recordset(prices) p(instrument text,quoted_at timestamptz,price_eur numeric,previous_close_eur numeric,original_price numeric,original_currency text,fx_rate numeric,fx_at timestamptz,source text,checked_at timestamptz,original_unit text,unit_scale numeric)
    where abs(p.price_eur-p.original_price*coalesce(p.unit_scale,1)*p.fx_rate)<=greatest(0.0000000001,abs(p.price_eur)*0.000000000001)
    on conflict(instrument,quote_date) do update set quoted_at=excluded.quoted_at,price_eur=excluded.price_eur,previous_close_eur=excluded.previous_close_eur,
        original_price=excluded.original_price,original_currency=excluded.original_currency,fx_rate=excluded.fx_rate,fx_at=excluded.fx_at,source=excluded.source,checked_at=excluded.checked_at,
        original_unit=excluded.original_unit,unit_scale=excluded.unit_scale,run_id=excluded.run_id where excluded.quoted_at>=market_prices.quoted_at;
    if exists(select 1 from jsonb_to_recordset(prices) p(price_eur numeric,original_price numeric,fx_rate numeric,unit_scale numeric) where p.price_eur is null or p.original_price is null or p.fx_rate is null or abs(p.price_eur-p.original_price*coalesce(p.unit_scale,1)*p.fx_rate)>greatest(0.0000000001,abs(p.price_eur)*0.000000000001)) then raise exception 'Invalid currency conversion'; end if;
    update portfolio_private.market_runs set finished_at=stamp,status=case when jsonb_array_length(prices)=0 and jsonb_array_length(finish_daily_market_refresh.failures)>0 then 'failed' when jsonb_array_length(finish_daily_market_refresh.failures)>0 then 'partial' else 'success' end,
        success_count=jsonb_array_length(prices),failures=finish_daily_market_refresh.failures where id=run_id;
end $$;

-- Store each immutable ledger operation once. Snapshots refer to a high-water
-- mark; a later backdated trade cannot silently enter an older snapshot's book.
create table portfolio_private.snapshot_ledger (
    entry_no bigint generated always as identity primary key,
    user_id uuid not null references public.user_portfolios(user_id) on delete cascade,
    transaction_id text not null, payload jsonb not null, unique(user_id,transaction_id)
);
create index snapshot_ledger_owner_idx on portfolio_private.snapshot_ledger(user_id,entry_no);
alter table portfolio_private.snapshot_ledger enable row level security;
revoke all on portfolio_private.snapshot_ledger from public,anon,authenticated;
alter table portfolio_private.daily_snapshots add column ledger_version bigint;
alter table portfolio_private.daily_snapshots add column legacy_ledger_ids jsonb;
alter table portfolio_private.daily_snapshots add column valuation_kind text not null default 'mixed-observations' check(valuation_kind='mixed-observations');
alter table portfolio_private.daily_snapshots add column observation_from timestamptz;
alter table portfolio_private.daily_snapshots add column observation_to timestamptz;
alter table portfolio_private.daily_snapshots add column run_id uuid references portfolio_private.market_runs(id);
create index daily_snapshots_run_idx on portfolio_private.daily_snapshots(run_id);
-- Preserve the exact legacy book by identifiers, including closed positions.
insert into portfolio_private.snapshot_ledger(user_id,transaction_id,payload)
select distinct on(s.user_id,t->>'id') s.user_id,t->>'id',t from portfolio_private.daily_snapshots s cross join lateral jsonb_array_elements(s.transactions) t
order by s.user_id,t->>'id',s.collected_at desc;
update portfolio_private.daily_snapshots s set legacy_ledger_ids=(select coalesce(jsonb_agg(t->>'id'),'[]') from jsonb_array_elements(s.transactions) t),transactions='[]';

create function portfolio_private.capture_snapshot(run_id uuid, portfolio_id uuid) returns text
language plpgsql security definer set search_path='' set lock_timeout='500ms' set statement_timeout='5s' as $$
declare rev bigint; document jsonb; priced_assets jsonb; stamp timestamptz; highwater bigint; from_at timestamptz; to_at timestamptz;
begin
    select finished_at into stamp from portfolio_private.market_runs r where r.id=run_id and r.status in ('success','partial');
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
    having count(*)>0 and bool_and(a.asset->>'type'='cash' or (q.run_id=capture_snapshot.run_id and q.quoted_at>=stamp-case when a.asset->>'type'='fund' then interval '7 days' when a.asset->>'type'='crypto' then interval '2 days' else interval '4 days' end));
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
create table portfolio_private.market_snapshot_results (
    run_id uuid not null references portfolio_private.market_runs(id) on delete cascade,
    user_id uuid not null references public.user_portfolios(user_id) on delete cascade,
    status text not null, primary key(run_id,user_id)
);
alter table portfolio_private.market_snapshot_results enable row level security;
revoke all on portfolio_private.market_snapshot_results from public,anon,authenticated;
create index market_snapshot_results_owner_idx on portfolio_private.market_snapshot_results(user_id,run_id);
create function public.capture_market_snapshot(run_id uuid,portfolio_id uuid) returns text
language plpgsql security definer set search_path='' as $$
declare outcome text;
begin
    begin outcome:=portfolio_private.capture_snapshot(run_id,portfolio_id);
    exception when others then outcome:='failed'; end;
    if exists(select 1 from public.user_portfolios where user_id=portfolio_id) then
        insert into portfolio_private.market_snapshot_results values(run_id,portfolio_id,outcome)
        on conflict on constraint market_snapshot_results_pkey do update set status=excluded.status;
    end if;
    return outcome;
end $$;
revoke all on function public.capture_market_snapshot(uuid,uuid),portfolio_private.capture_snapshot(uuid,uuid) from public,anon,authenticated;
grant execute on function public.capture_market_snapshot(uuid,uuid) to service_role;

-- Worker health is independent from Cron's successful enqueue. No portfolio or
-- instrument names from other users are exposed through this summary.
create table portfolio_private.market_dispatches(request_id bigint primary key,requested_at timestamptz not null default now());
create table portfolio_private.market_alerts(kind text primary key,raised_at timestamptz not null,details text not null,resolved_at timestamptz);
alter table portfolio_private.market_dispatches enable row level security;
alter table portfolio_private.market_alerts enable row level security;
revoke all on portfolio_private.market_dispatches,portfolio_private.market_alerts from public,anon,authenticated;
create function portfolio_private.market_watchdog() returns void language plpgsql security definer set search_path='' as $$
declare last_run portfolio_private.market_runs%rowtype; expected timestamptz; issue text;
begin
    update portfolio_private.market_runs set status='failed',finished_at=now(),failures='[{"reason":"Worker lease expired"}]' where status='running' and started_at<now()-interval '5 minutes';
    select * into last_run from portfolio_private.market_runs order by started_at desc limit 1;
    select max(slot) into expected from generate_series(date_trunc('day',now())-interval '2 days',now(),interval '1 hour') slot
    where extract(hour from slot at time zone 'Europe/Madrid') in (8,10,12,14,16,18,20,22) and slot<=now()-interval '10 minutes';
    issue:=case when last_run.id is null or last_run.started_at<expected then 'No worker execution after the last scheduled slot'
        when last_run.status in ('failed','partial') then 'The latest worker did not update all instruments' end;
    if issue is null then update portfolio_private.market_alerts set resolved_at=now() where kind='worker' and resolved_at is null;
    else insert into portfolio_private.market_alerts values('worker',now(),issue,null) on conflict(kind) do update set raised_at=case when market_alerts.resolved_at is not null then excluded.raised_at else market_alerts.raised_at end,details=excluded.details,resolved_at=null; end if;
    if exists(select 1 from portfolio_private.market_dispatches d join net._http_response r on r.id=d.request_id where d.requested_at>now()-interval '3 hours' and (r.timed_out or r.status_code>=400 or r.error_msg is not null)) then
        insert into portfolio_private.market_alerts values('dispatch',now(),'The HTTP dispatch failed or timed out',null) on conflict(kind) do update set details=excluded.details,resolved_at=null;
    else update portfolio_private.market_alerts set resolved_at=now() where kind='dispatch' and resolved_at is null; end if;
    delete from portfolio_private.market_dispatches where requested_at<now()-interval '30 days';
end $$;
create function portfolio_private.dispatch_market_refresh() returns void language plpgsql security definer set search_path='' as $$
declare request_id bigint; url text; secret text;
begin
    if extract(hour from now() at time zone 'Europe/Madrid') not in (8,10,12,14,16,18,20,22) then return; end if;
    select decrypted_secret into url from vault.decrypted_secrets where name='daily_market_project_url';
    select decrypted_secret into secret from vault.decrypted_secrets where name='daily_market_job_secret';
    if url is null or secret is null then raise exception 'Market worker is not configured'; end if;
    select net.http_post(url:=url||'/functions/v1/daily-market-data',headers:=jsonb_build_object('Content-Type','application/json','x-job-secret',secret),body:='{}',timeout_milliseconds:=150000) into request_id;
    insert into portfolio_private.market_dispatches(request_id) values(request_id);
end $$;
revoke all on function portfolio_private.market_watchdog(),portfolio_private.dispatch_market_refresh() from public,anon,authenticated;
-- Job replacement retains the existing timezone-aware two-hour window.
create or replace function portfolio_private.configure_daily_market_job(project_url text) returns bigint
language plpgsql security invoker set search_path='' as $$
declare job_id bigint;
begin
    if project_url !~ '^https://[a-z0-9]+\.supabase\.co$' then raise exception 'Invalid project URL'; end if;
    if exists(select 1 from vault.secrets where name='daily_market_project_url') then
        perform vault.update_secret((select id from vault.secrets where name='daily_market_project_url'),project_url);
    else perform vault.create_secret(project_url,'daily_market_project_url'); end if;
    select cron.schedule('freewallet-daily-market','0 6-21 * * *','select portfolio_private.dispatch_market_refresh()') into job_id;
    return job_id;
end $$;
revoke all on function portfolio_private.configure_daily_market_job(text) from public,anon,authenticated,service_role;
select cron.schedule('freewallet-daily-market','0 6-21 * * *','select portfolio_private.dispatch_market_refresh()');
select cron.schedule('freewallet-market-watchdog','*/5 * * * *','select portfolio_private.market_watchdog()');

create function portfolio_private.read_market_base() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare owner_id uuid:=portfolio_private.require_user();
begin
    return jsonb_build_object('benchmark',(select jsonb_build_object('isin',benchmark_isin,'name',benchmark_name) from portfolio_private.market_settings),
    'prices',(select coalesce(jsonb_agg(p order by quoted_at),'[]') from portfolio_private.market_prices p where quote_date>=current_date-800 and instrument in (
        select portfolio_private.instrument_key(asset_type,symbol,isin) from public.portfolio_positions where user_id=owner_id
        union select upper(asset_symbol) from public.portfolio_transactions where user_id=owner_id union select benchmark_isin from portfolio_private.market_settings)),
    'lastRun',(select jsonb_build_object('startedAt',started_at,'finishedAt',finished_at,'status',status,'failures',(
        select coalesce(jsonb_agg(f),'[]') from jsonb_array_elements(failures) f where f->>'instrument' in (
            select portfolio_private.instrument_key(asset_type,symbol,isin) from public.portfolio_positions where user_id=owner_id union select benchmark_isin from portfolio_private.market_settings))) from portfolio_private.market_runs order by started_at desc limit 1),
    'snapshotStatus',(select status from portfolio_private.market_snapshot_results where user_id=owner_id and run_id=(select id from portfolio_private.market_runs order by started_at desc limit 1)),
    'health',jsonb_build_object('attentionRequired',exists(select 1 from portfolio_private.market_alerts where resolved_at is null),
        'alerts',(select coalesce(jsonb_agg(kind),'[]') from portfolio_private.market_alerts where resolved_at is null)));
end $$;
create or replace function portfolio_private.read_market_data() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare owner_id uuid:=portfolio_private.require_user();
begin return portfolio_private.read_market_base() || jsonb_build_object(
'snapshots',(select coalesce(jsonb_agg(jsonb_build_object('at',s.collected_at,'assets',s.assets,'transactions',coalesce((select jsonb_agg(l.payload order by l.entry_no) from portfolio_private.snapshot_ledger l where l.user_id=owner_id and
        (l.entry_no<=s.ledger_version or s.legacy_ledger_ids ? l.transaction_id)),s.transactions),'valuationKind',s.valuation_kind,'observationFrom',s.observation_from,'observationTo',s.observation_to) order by s.collected_at),'[]') from portfolio_private.daily_snapshots s where s.user_id=owner_id and s.snapshot_date>=current_date-800)); end $$;
revoke all on function portfolio_private.read_market_base() from public,anon,authenticated;

-- V2 transmits the ledger dictionary once rather than once for every day.
create function portfolio_private.read_market_data_v2() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare owner_id uuid:=portfolio_private.require_user(); result jsonb;
begin
    result:=portfolio_private.read_market_base() || jsonb_build_object('snapshots','[]'::jsonb);
    return jsonb_set(result,'{snapshots}',(select coalesce(jsonb_agg(jsonb_build_object('at',collected_at,'assets',assets,'ledgerVersion',ledger_version,'legacyLedgerIds',legacy_ledger_ids,
        'valuationKind',valuation_kind,'observationFrom',observation_from,'observationTo',observation_to) order by collected_at),'[]') from portfolio_private.daily_snapshots where user_id=owner_id and snapshot_date>=current_date-800))
        || jsonb_build_object('ledger',(select coalesce(jsonb_agg(jsonb_build_object('entry',entry_no,'transaction',payload) order by entry_no),'[]') from portfolio_private.snapshot_ledger where user_id=owner_id));
end $$;
create function public.read_daily_market_data_v2() returns jsonb language sql stable security invoker set search_path='' as $$select portfolio_private.read_market_data_v2()$$;
revoke all on function portfolio_private.read_market_data_v2(),public.read_daily_market_data_v2() from public,anon,authenticated;
grant execute on function portfolio_private.read_market_data_v2(),public.read_daily_market_data_v2() to authenticated;
commit;
