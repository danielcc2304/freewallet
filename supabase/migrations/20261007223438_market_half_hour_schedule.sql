begin;

-- Record when the cadence changes: the watchdog must not retroactively expect
-- half-hourly runs that were never scheduled before this migration.
alter table portfolio_private.market_settings
    add column refresh_schedule_since timestamptz not null default now();

create function portfolio_private.market_refresh_slot_allowed(at_time timestamptz) returns boolean
language sql immutable security invoker set search_path='' as $$
    select extract(hour from at_time at time zone 'Europe/Madrid') between 8 and 22
        and extract(minute from at_time at time zone 'Europe/Madrid') in (0,30);
$$;

create function portfolio_private.expected_market_refresh_slot(checked_at timestamptz, schedule_since timestamptz) returns timestamptz
language sql stable security invoker set search_path='' as $$
    select max(slot)
    from generate_series(
        (date_trunc('day',checked_at at time zone 'UTC') at time zone 'UTC')-interval '2 days',
        checked_at-interval '10 minutes',interval '30 minutes'
    ) slot
    where case when slot>=schedule_since then portfolio_private.market_refresh_slot_allowed(slot)
        else extract(hour from slot at time zone 'Europe/Madrid') in (8,10,12,14,16,18,20,22)
            and extract(minute from slot at time zone 'Europe/Madrid')=0 end;
$$;

create or replace function portfolio_private.dispatch_market_refresh() returns void
language plpgsql security definer set search_path='' as $$
declare request_id bigint; url text; secret text;
begin
    if not portfolio_private.market_refresh_slot_allowed(now()) then return; end if;
    select decrypted_secret into url from vault.decrypted_secrets where name='daily_market_project_url';
    select decrypted_secret into secret from vault.decrypted_secrets where name='daily_market_job_secret';
    if url is null or secret is null then raise exception 'Market worker is not configured'; end if;
    select net.http_post(url:=url||'/functions/v1/daily-market-data',headers:=jsonb_build_object('Content-Type','application/json','x-job-secret',secret),body:='{}',timeout_milliseconds:=150000) into request_id;
    insert into portfolio_private.market_dispatches(request_id) values(request_id);
end $$;

create or replace function portfolio_private.market_watchdog() returns void
language plpgsql security definer set search_path='' as $$
declare last_run portfolio_private.market_runs%rowtype; expected timestamptz; issue text;
begin
    update portfolio_private.market_runs set status='failed',finished_at=now(),failures='[{"reason":"Worker lease expired"}]' where status='running' and started_at<now()-interval '5 minutes';
    select * into last_run from portfolio_private.market_runs order by started_at desc limit 1;
    select portfolio_private.expected_market_refresh_slot(now(),refresh_schedule_since)
        into expected from portfolio_private.market_settings;
    issue:=case when last_run.id is null or last_run.started_at<expected then 'No worker execution after the last scheduled slot'
        when last_run.status in ('failed','partial') then 'The latest worker did not update all instruments' end;
    if issue is null then update portfolio_private.market_alerts set resolved_at=now() where kind='worker' and resolved_at is null;
    else insert into portfolio_private.market_alerts values('worker',now(),issue,null) on conflict(kind) do update set raised_at=case when market_alerts.resolved_at is not null then excluded.raised_at else market_alerts.raised_at end,details=excluded.details,resolved_at=null; end if;
    if exists(select 1 from portfolio_private.market_dispatches d join net._http_response r on r.id=d.request_id where d.requested_at>now()-interval '3 hours' and (r.timed_out or r.status_code>=400 or r.error_msg is not null)) then
        insert into portfolio_private.market_alerts values('dispatch',now(),'The HTTP dispatch failed or timed out',null) on conflict(kind) do update set details=excluded.details,resolved_at=null;
    else update portfolio_private.market_alerts set resolved_at=now() where kind='dispatch' and resolved_at is null; end if;
    delete from portfolio_private.market_dispatches where requested_at<now()-interval '30 days';
end $$;

create or replace function portfolio_private.configure_daily_market_job(project_url text) returns bigint
language plpgsql security invoker set search_path='' as $$
declare job_id bigint;
begin
    if project_url !~ '^https://[a-z0-9]+\.supabase\.co$' then raise exception 'Invalid project URL'; end if;
    if exists(select 1 from vault.secrets where name='daily_market_project_url') then
        perform vault.update_secret((select id from vault.secrets where name='daily_market_project_url'),project_url);
    else perform vault.create_secret(project_url,'daily_market_project_url'); end if;
    select cron.schedule('freewallet-daily-market','*/30 6-21 * * *','select portfolio_private.dispatch_market_refresh()') into job_id;
    return job_id;
end $$;

revoke all on function portfolio_private.market_refresh_slot_allowed(timestamptz),
    portfolio_private.expected_market_refresh_slot(timestamptz,timestamptz),
    portfolio_private.dispatch_market_refresh(),portfolio_private.market_watchdog(),
    portfolio_private.configure_daily_market_job(text) from public,anon,authenticated,service_role;

-- This UTC candidate window covers CET and CEST. The shared Madrid guard
-- permits exactly 30 runs: 08:00, 08:30, ..., 22:30. Vault keys are unchanged.
select cron.schedule('freewallet-daily-market','*/30 6-21 * * *','select portfolio_private.dispatch_market_refresh()');

commit;
