begin;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
-- Random server-side credential never stored in the repository or browser.
do $$begin
    if not exists(select 1 from vault.secrets where name='daily_market_job_secret') then
        perform vault.create_secret(gen_random_uuid()::text || gen_random_uuid()::text,'daily_market_job_secret');
    end if;
end $$;
-- Configure once with the actual project URL after deploying the worker.
-- Only the database owner may configure scheduling; no client can call this.
create function portfolio_private.configure_daily_market_job(project_url text) returns bigint
language plpgsql security invoker set search_path='' as $$
declare job_id bigint;
begin
    if project_url !~ '^https://[a-z0-9]+\.supabase\.co$' then raise exception 'Invalid project URL'; end if;
    if exists(select 1 from vault.secrets where name='daily_market_project_url') then
        perform vault.update_secret((select id from vault.secrets where name='daily_market_project_url'),project_url);
    else
        perform vault.create_secret(project_url,'daily_market_project_url');
    end if;
    select cron.schedule('freewallet-daily-market','0 6,20,22 * * *', $job$
        select net.http_post(
            url:=(select decrypted_secret from vault.decrypted_secrets where name='daily_market_project_url') || '/functions/v1/daily-market-data',
            headers:=jsonb_build_object('Content-Type','application/json','x-job-secret',(select decrypted_secret from vault.decrypted_secrets where name='daily_market_job_secret')),
            body:='{}'::jsonb,timeout_milliseconds:=150000
        );
    $job$) into job_id;
    return job_id;
end $$;
revoke all on function portfolio_private.configure_daily_market_job(text) from public,anon,authenticated,service_role;
commit;
