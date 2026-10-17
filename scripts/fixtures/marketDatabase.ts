import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
export const A='11111111-1111-4111-8111-111111111111';
export const migration=(suffix:string)=>readFileSync(`supabase/migrations/${readdirSync('supabase/migrations').find(n=>n.endsWith(suffix))}`,'utf8');
export async function marketDatabase() {
    const db=new PGlite();
    await db.exec(`create role anon;create role authenticated;create role service_role;
        create schema auth;create schema vault;create schema cron;create schema net;create schema storage;
        create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz default now(),is_anonymous boolean default false);
        create table auth.sessions(id uuid primary key,user_id uuid);create table auth.mfa_factors(id uuid,user_id uuid,status text);
        create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
        create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
        create table vault.decrypted_secrets(name text,decrypted_secret text);insert into vault.decrypted_secrets values('daily_market_job_secret','fixture');
        create table cron.job(jobid bigint generated always as identity primary key,jobname text unique,schedule text,command text);
        create function cron.schedule(n text,s text,c text) returns bigint language plpgsql as $$declare result bigint;begin
            insert into cron.job(jobname,schedule,command) values(n,s,c) on conflict(jobname) do update set schedule=excluded.schedule,command=excluded.command returning jobid into result;return result;end$$;
        create table net._http_response(id bigint,timed_out boolean,status_code integer,error_msg text);
        create table storage.buckets(id text primary key,name text,public boolean);create table storage.objects(id uuid,bucket_id text,owner_id text);alter table storage.objects enable row level security;
        grant usage on schema auth,public,storage to authenticated,anon,service_role;
        insert into auth.users(id,email) values('${A}','fixture@example.test');`);
    for (const suffix of [
        'portfolio_foundation.sql',
        'portfolio_commands.sql',
        'portfolio_mfa_guard.sql',
        'portfolio_command_validation.sql',
        'portfolio_opening_basis.sql',
        'daily_market_data.sql',
        'daily_market_accounting_calendar.sql',
    ])
        await db.exec(migration(suffix));
    await db.exec(
        readFileSync('supabase/news-schema.sql', 'utf8').replace(
            'create extension if not exists pgcrypto;',
            '',
        ),
    );
    for (const suffix of [
        'architecture_hardening.sql',
        'market_publication_hardening.sql',
        'market_snapshot_completeness.sql',
        'market_half_hour_schedule.sql',
        'fund_quote_sources.sql',
        'financial_times_fund_source.sql',
        'market_refresh_cadence.sql',
        'snapshot_ledger_membership.sql',
    ])
        await db.exec(migration(suffix));
    return db;
}
