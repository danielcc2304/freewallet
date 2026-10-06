begin;
create table portfolio_private.market_settings (
    singleton boolean primary key default true check(singleton),
    benchmark_isin text not null check(benchmark_isin ~ '^[A-Z]{2}[A-Z0-9]{10}$'),
    benchmark_name text not null
);
insert into portfolio_private.market_settings values(true,'IE00BYX5NX33','Fidelity MSCI World ACC EUR');
create table portfolio_private.market_prices (
    instrument text not null, quote_date date not null, quoted_at timestamptz not null,
    price_eur numeric not null check(price_eur > 0 and price_eur <> 'NaN'::numeric),
    previous_close_eur numeric check(previous_close_eur > 0 and previous_close_eur <> 'NaN'::numeric),
    original_price numeric not null check(original_price > 0 and original_price <> 'NaN'::numeric),
    original_currency text not null check(original_currency ~ '^[A-Z]{3}$'),
    fx_rate numeric not null check(fx_rate > 0 and fx_rate <> 'NaN'::numeric),
    fx_at timestamptz, source text not null check(source in ('Finect','Yahoo Finance')),
    checked_at timestamptz not null, primary key(instrument,quote_date)
);
create table portfolio_private.market_runs (
    id uuid primary key default gen_random_uuid(), started_at timestamptz not null default now(),
    finished_at timestamptz, status text not null default 'running' check(status in ('running','success','partial','failed')),
    failures jsonb not null default '[]', success_count integer not null default 0
);
create index market_runs_started_idx on portfolio_private.market_runs(started_at desc);
create table portfolio_private.daily_snapshots (
    user_id uuid not null references public.user_portfolios(user_id) on delete cascade,
    snapshot_date date not null, revision bigint not null, collected_at timestamptz not null,
    assets jsonb not null, transactions jsonb not null, primary key(user_id,snapshot_date)
);
alter table portfolio_private.market_settings enable row level security;
alter table portfolio_private.market_prices enable row level security;
alter table portfolio_private.market_runs enable row level security;
alter table portfolio_private.daily_snapshots enable row level security;
revoke all on portfolio_private.market_settings,portfolio_private.market_prices,portfolio_private.market_runs,portfolio_private.daily_snapshots from public,anon,authenticated;

-- The worker is authenticated by a random Vault token, validated only by this
-- service-role RPC. A public key or user JWT cannot start a batch.
create function public.begin_daily_market_refresh(job_secret text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare run_id uuid;
begin
    if job_secret is null or not exists(select 1 from vault.decrypted_secrets where name='daily_market_job_secret' and decrypted_secret=job_secret)
    then raise exception 'Invalid job credential' using errcode='42501'; end if;
    perform pg_advisory_xact_lock(640610);
    if exists(select 1 from portfolio_private.market_runs where status='running' and started_at > now()-interval '5 minutes') then return null; end if;
    update portfolio_private.market_runs set status='failed',finished_at=now() where status='running';
    insert into portfolio_private.market_runs default values returning id into run_id;
    return jsonb_build_object('id',run_id,'instruments',(
        select coalesce(jsonb_agg(instrument),'[]') from (
            select distinct coalesce(isin,upper(btrim(symbol))) as instrument from public.portfolio_positions where asset_type <> 'cash' and quantity>0
            union select benchmark_isin from portfolio_private.market_settings
        ) i));
end $$;

-- Atomic publication. Refreshes never mutate portfolio quantities, costs,
-- operations, documents or revision numbers. Snapshot quantities are captured
-- under portfolio row locks so trades cannot race the capture.
create function public.finish_daily_market_refresh(run_id uuid, prices jsonb, failures jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare owner_record record; document jsonb; priced_assets jsonb; stamp timestamptz:=now();
begin
    perform pg_advisory_xact_lock(640610);
    if not exists(select 1 from portfolio_private.market_runs where id=run_id and status='running' and started_at>now()-interval '5 minutes')
    then raise exception 'Expired market run'; end if;
    if jsonb_typeof(prices)<>'array' or jsonb_typeof(failures)<>'array' then raise exception 'Invalid batch'; end if;
    insert into portfolio_private.market_prices
    select p.instrument, (p.quoted_at at time zone 'UTC')::date,p.quoted_at,p.price_eur,p.previous_close_eur,p.original_price,p.original_currency,p.fx_rate,p.fx_at,p.source,p.checked_at
    from jsonb_to_recordset(prices) as p(instrument text,quoted_at timestamptz,price_eur numeric,previous_close_eur numeric,original_price numeric,original_currency text,fx_rate numeric,fx_at timestamptz,source text,checked_at timestamptz)
    where p.quoted_at<=stamp+interval '5 minutes' and p.checked_at between stamp-interval '5 minutes' and stamp+interval '5 minutes'
    on conflict(instrument,quote_date) do update set quoted_at=excluded.quoted_at,price_eur=excluded.price_eur,previous_close_eur=excluded.previous_close_eur,
        original_price=excluded.original_price,original_currency=excluded.original_currency,fx_rate=excluded.fx_rate,fx_at=excluded.fx_at,source=excluded.source,checked_at=excluded.checked_at
    where excluded.quoted_at>=market_prices.quoted_at;
    for owner_record in select user_id,revision from public.user_portfolios order by user_id for update loop
        select (d.data->>'freewallet_portfolio_v1')::jsonb into document from portfolio_private.documents d where d.user_id=owner_record.user_id;
        if document is null then continue; end if;
        select jsonb_agg(a.asset || case when a.asset->>'type'='cash' then jsonb_build_object('currentPrice',1,'previousClose',1,'currency','EUR','quotedAt',stamp,'lastCheckedAt',stamp,'quoteSource','Saldo')
            else jsonb_build_object('currentPrice',q.price_eur,'previousClose',q.previous_close_eur,'currency','EUR','quotedAt',q.quoted_at,'lastQuoteAt',q.quoted_at,'lastCheckedAt',q.checked_at,'quoteSource',q.source) end)
        into priced_assets from jsonb_array_elements(document->'assets') a(asset)
        left join lateral (select * from portfolio_private.market_prices q where q.instrument=coalesce(nullif(a.asset->>'isin',''),upper(a.asset->>'symbol')) order by quoted_at desc limit 1) q on true
        having count(*)>0 and bool_and(a.asset->>'type'='cash' or (q.checked_at>=stamp-interval '5 minutes' and q.quoted_at>=stamp-case when a.asset->>'type'='fund' then interval '7 days' when a.asset->>'type'='crypto' then interval '2 days' else interval '4 days' end));
        if priced_assets is not null then
            insert into portfolio_private.daily_snapshots values(owner_record.user_id,(stamp at time zone 'UTC')::date,owner_record.revision,stamp,priced_assets,coalesce(document->'transactions','[]'))
            on conflict(user_id,snapshot_date) do update set revision=excluded.revision,collected_at=excluded.collected_at,assets=excluded.assets,transactions=excluded.transactions;
        end if;
    end loop;
    update portfolio_private.market_runs set finished_at=stamp,status=case when jsonb_array_length(finish_daily_market_refresh.failures)=0 then 'success' when jsonb_array_length(prices)=0 then 'failed' else 'partial' end,
        success_count=jsonb_array_length(prices),failures=finish_daily_market_refresh.failures where id=run_id;
end $$;

create function portfolio_private.read_market_data() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare owner_id uuid:=portfolio_private.require_user();
begin
    return jsonb_build_object('benchmark',(select jsonb_build_object('isin',benchmark_isin,'name',benchmark_name) from portfolio_private.market_settings),
    'prices',(select coalesce(jsonb_agg(p order by quoted_at),'[]') from portfolio_private.market_prices p where quote_date >= current_date-800 and instrument in (
        select coalesce(isin,upper(symbol)) from public.portfolio_positions where user_id=owner_id
        union select upper(asset_symbol) from public.portfolio_transactions where user_id=owner_id
        union select benchmark_isin from portfolio_private.market_settings)),
    'snapshots',(select coalesce(jsonb_agg(jsonb_build_object('at',collected_at,'assets',assets,'transactions',transactions) order by collected_at),'[]') from portfolio_private.daily_snapshots where user_id=owner_id and snapshot_date>=current_date-800),
    'lastRun',(select jsonb_build_object('startedAt',started_at,'finishedAt',finished_at,'status',status,'failures',(
        select coalesce(jsonb_agg(f),'[]') from jsonb_array_elements(failures) f where f->>'instrument' in (
            select coalesce(isin,upper(symbol)) from public.portfolio_positions where user_id=owner_id union select benchmark_isin from portfolio_private.market_settings)))
        from portfolio_private.market_runs order by started_at desc limit 1));
end $$;
create function public.read_daily_market_data() returns jsonb language sql stable security invoker set search_path='' as $$select portfolio_private.read_market_data()$$;
revoke all on function public.begin_daily_market_refresh(text), public.finish_daily_market_refresh(uuid,jsonb,jsonb), public.read_daily_market_data(),portfolio_private.read_market_data() from public,anon,authenticated;
grant execute on function public.begin_daily_market_refresh(text),public.finish_daily_market_refresh(uuid,jsonb,jsonb) to service_role;
grant execute on function public.read_daily_market_data(),portfolio_private.read_market_data() to authenticated;
commit;
