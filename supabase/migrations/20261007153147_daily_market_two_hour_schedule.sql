begin;

-- Keep the batch's eight daily runs at 08:00, 10:00, ..., 22:00 in Spain.
-- pg_cron uses UTC on this project. The hourly candidate window covers both
-- CET and CEST; the local-hour guard sends no HTTP request on other hours.
create or replace function portfolio_private.configure_daily_market_job(project_url text) returns bigint
language plpgsql security invoker set search_path='' as $$
declare job_id bigint;
begin
    if project_url !~ '^https://[a-z0-9]+\.supabase\.co$' then raise exception 'Invalid project URL'; end if;
    if exists(select 1 from vault.secrets where name='daily_market_project_url') then
        perform vault.update_secret((select id from vault.secrets where name='daily_market_project_url'),project_url);
    else
        perform vault.create_secret(project_url,'daily_market_project_url');
    end if;
    select cron.schedule('freewallet-daily-market','0 6-21 * * *', $job$
        select net.http_post(
            url:=(select decrypted_secret from vault.decrypted_secrets where name='daily_market_project_url') || '/functions/v1/daily-market-data',
            headers:=jsonb_build_object('Content-Type','application/json','x-job-secret',(select decrypted_secret from vault.decrypted_secrets where name='daily_market_job_secret')),
            body:='{}'::jsonb,timeout_milliseconds:=150000
        )
        where extract(hour from current_timestamp at time zone 'Europe/Madrid') in (8,10,12,14,16,18,20,22);
    $job$) into job_id;
    return job_id;
end $$;
revoke all on function portfolio_private.configure_daily_market_job(text) from public,anon,authenticated,service_role;

-- Update the installed job without exposing or rotating its Vault credential.
-- New installations configure their URL after deploying the Edge Function.
do $$begin
    if exists(select 1 from cron.job where jobname='freewallet-daily-market')
        and exists(select 1 from vault.secrets where name='daily_market_project_url') then
        perform portfolio_private.configure_daily_market_job(
            (select decrypted_secret from vault.decrypted_secrets where name='daily_market_project_url')
        );
    end if;
end $$;

commit;
