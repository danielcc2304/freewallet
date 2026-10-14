import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
const A = '11111111-1111-4111-8111-111111111111';
const FUND = 'IE00BYX5NX33';
const migration = (suffix: string) =>
    readFileSync(
        `supabase/migrations/${readdirSync('supabase/migrations').find((n) => n.endsWith(suffix))}`,
        'utf8',
    );
try {
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
    ])
        await db.exec(migration(suffix));
    for (const day of [
        '2026-01-15',
        '2026-07-15',
        '2026-03-29',
        '2026-10-25',
    ]) {
        for (const [time, expected] of [
            ['07:59', '22:00'],
            ['08:00', '08:00'],
            ['11:59', '08:00'],
            ['12:00', '12:00'],
            ['15:59', '12:00'],
            ['16:00', '16:00'],
            ['21:59', '16:00'],
            ['22:00', '22:00'],
            ['22:30', '22:00'],
        ] as const) {
            const rows = await db.query<{ slot: string }>(
                "select to_char(portfolio_private.latest_fund_refresh_slot($1::timestamp at time zone 'Europe/Madrid') at time zone 'Europe/Madrid','HH24:MI') slot",
                [`${day} ${time}`],
            );
            assert.equal(rows.rows[0].slot, expected, `${day} ${time}`);
        }
        const slots = (
            await db.query<{ slot: string }>(
                `select distinct to_char(portfolio_private.latest_fund_refresh_slot(slot) at time zone 'Europe/Madrid','HH24:MI') slot from generate_series($1::date::timestamp at time zone 'Europe/Madrid',($1::date+1)::timestamp at time zone 'Europe/Madrid'-interval '30 minutes',interval '30 minutes') slot where portfolio_private.market_refresh_slot_allowed(slot)`,
                [day],
            )
        ).rows
            .map((r) => r.slot)
            .sort();
        assert.deepEqual(slots, ['08:00', '12:00', '16:00', '22:00']);
    }
    await db.exec("set time zone 'America/Los_Angeles'");
    assert.equal(
        (
            await db.query<{ v: string }>(
                "select to_char(portfolio_private.latest_fund_refresh_slot('2026-07-15 12:30'::timestamp at time zone 'Europe/Madrid') at time zone 'Europe/Madrid','HH24:MI') v",
            )
        ).rows[0].v,
        '12:00',
    );
    await db.exec("set time zone 'UTC'");
    await db.query('insert into public.user_portfolios(user_id) values($1)', [
        A,
    ]);
    const assets = [
        {
            id: 'stock',
            symbol: 'AAA',
            type: 'stock',
            name: 'Stock',
            quantity: 2,
        },
        {
            id: 'crypto',
            symbol: 'BTC-EUR',
            type: 'crypto',
            name: 'Crypto',
            quantity: 1,
        },
        {
            id: 'fund',
            symbol: FUND,
            isin: FUND,
            type: 'fund',
            name: 'Fund',
            quantity: 3,
        },
    ].map((a) => ({
        ...a,
        purchasePrice: 5,
        purchaseDate: '2026-01-01',
        currency: 'EUR',
    }));
    for (const a of assets)
        await db.query(
            "insert into public.portfolio_positions(user_id,id,symbol,isin,name,asset_type,quantity,purchase_price_eur,purchase_date) values($1,$2,$3,$4,$5,$6,$7,5,'2026-01-01')",
            [
                A,
                a.id,
                a.symbol,
                'isin' in a ? a.isin : null,
                a.name,
                a.type,
                a.quantity,
            ],
        );
    await db.query('insert into portfolio_private.documents values($1,$2)', [
        A,
        JSON.stringify({
            freewallet_portfolio_v1: JSON.stringify({
                version: 1,
                assets,
                transactions: [],
            }),
        }),
    ]);
    const stamp = (await db.query<{ at: string }>('select now()::text at'))
        .rows[0].at;
    const old = (
        await db.query<{ id: string }>(
            "insert into portfolio_private.market_runs(started_at,finished_at,status) values(now()-interval '1 minute',now()-interval '1 minute','success') returning id",
        )
    ).rows[0].id;
    for (const a of assets)
        await db.query(
            `insert into portfolio_private.market_prices(instrument,quote_date,quoted_at,checked_at,price_eur,original_price,original_currency,original_unit,unit_scale,fx_rate,source,run_id)
        values($1,current_date,now()-interval '1 minute',now(),10,10,'EUR','EUR',1,1,'Yahoo Finance',$2)`,
            [a.symbol, old],
        );
    const begin = async () =>
        (
            await db.query<{
                r: {
                    id: string;
                    instrumentsV2: { instrument: string; type: string }[];
                };
            }>("select public.begin_daily_market_refresh('fixture') r")
        ).rows[0].r;
    const finish = async (
        id: string,
        includeFund = false,
        failedFund = false,
    ) => {
        const quote = (instrument: string) => ({
            instrument,
            quoted_at: stamp,
            checked_at: stamp,
            price_eur: 12,
            previous_close_eur: 10,
            original_price: 12,
            original_currency: 'EUR',
            original_unit: 'EUR',
            unit_scale: 1,
            fx_rate: 1,
            fx_at: null,
            source: 'Yahoo Finance',
        });
        await db.query('select public.finish_daily_market_refresh($1,$2,$3)', [
            id,
            JSON.stringify(
                ['AAA', 'BTC-EUR', ...(includeFund ? [FUND] : [])].map(quote),
            ),
            JSON.stringify(
                failedFund
                    ? [{ instrument: FUND, reason: 'Provider unavailable' }]
                    : [],
            ),
        ]);
    };
    await assert.rejects(
        db.query("select public.begin_daily_market_refresh('wrong')"),
    );
    let run = await begin();
    assert.deepEqual(
        run.instrumentsV2.map((i) => i.instrument),
        ['AAA', 'BTC-EUR'],
    );
    await finish(run.id);
    assert.equal(
        (
            await db.query<{ v: string }>(
                'select portfolio_private.capture_snapshot($1,$2) v',
                [run.id, A],
            )
        ).rows[0].v,
        'captured',
        'Intentionally skipped fresh fund can be reused',
    );
    const snapshot = (
        await db.query<{ assets: typeof assets }>(
            'select assets from portfolio_private.daily_snapshots where user_id=$1',
            [A],
        )
    ).rows[0].assets;
    assert.equal(snapshot.length, 3);
    assert.equal(
        (
            snapshot.find((a) => a.type === 'fund') as unknown as {
                currentPrice: number;
            }
        ).currentPrice,
        10,
    );
    const savedFund = snapshot.find((a) => a.type === 'fund') as unknown as {
        quotedAt: string;
        lastCheckedAt: string;
    };
    const originalFund = (
        await db.query<{ quoted: string; checked: string }>(
            'select quoted_at::text quoted,checked_at::text checked from portfolio_private.market_prices where instrument=$1',
            [FUND],
        )
    ).rows[0];
    assert.equal(
        Date.parse(savedFund.quotedAt),
        Date.parse(originalFund.quoted),
    );
    assert.equal(
        Date.parse(savedFund.lastCheckedAt),
        Date.parse(originalFund.checked),
        'Reuse does not pretend a new provider check',
    );
    await db.query(
        'update portfolio_private.market_runs set requested_instruments=null where id=$1',
        [run.id],
    );
    assert.equal(
        (
            await db.query<{ v: string }>(
                'select portfolio_private.capture_snapshot($1,$2) v',
                [run.id, A],
            )
        ).rows[0].v,
        'incomplete',
        'Legacy in-flight runs retain strict same-run checks',
    );
    // Expired checkpoint: fund is due, and failures do not permit reuse.
    await db.query(
        "update portfolio_private.market_prices set checked_at=portfolio_private.latest_fund_refresh_slot(now())-interval '1 second' where instrument=$1",
        [FUND],
    );
    run = await begin();
    assert.ok(run.instrumentsV2.some((i) => i.instrument === FUND));
    await finish(run.id, false, true);
    assert.equal(
        (
            await db.query<{ v: string }>(
                'select portfolio_private.capture_snapshot($1,$2) v',
                [run.id, A],
            )
        ).rows[0].v,
        'incomplete',
    );
    run = await begin();
    assert.ok(
        run.instrumentsV2.some((i) => i.instrument === FUND),
        'Failed fund retries on next half-hour run',
    );
    await finish(run.id, true);
    assert.equal(
        (
            await db.query<{ v: string }>(
                'select portfolio_private.capture_snapshot($1,$2) v',
                [run.id, A],
            )
        ).rows[0].v,
        'captured',
    );
    // Adding a fund triggers a fetch between checkpoints.
    await db.query(
        "insert into public.portfolio_positions(user_id,id,symbol,isin,name,asset_type,quantity,purchase_price_eur,purchase_date) values($1,'newfund','FR0000989626','FR0000989626','New fund','fund',1,5,current_date)",
        [A],
    );
    run = await begin();
    assert.ok(run.instrumentsV2.some((i) => i.instrument === 'FR0000989626'));
    assert.ok(!run.instrumentsV2.some((i) => i.instrument === FUND));
    await finish(run.id);
    // Missing stock/crypto observations cannot borrow prices from previous runs.
    run = await begin();
    await finish(run.id);
    await db.query(
        "update portfolio_private.market_prices set run_id=$1 where instrument='AAA'",
        [old],
    );
    assert.equal(
        (
            await db.query<{ v: string }>(
                'select portfolio_private.capture_snapshot($1,$2) v',
                [run.id, A],
            )
        ).rows[0].v,
        'incomplete',
    );
    // A fresh check does not make an eight-day-old fund NAV usable.
    await db.query(
        "update portfolio_private.market_prices set quoted_at=now()-interval '8 days' where instrument=$1",
        [FUND],
    );
    run = await begin();
    assert.ok(run.instrumentsV2.some((i) => i.instrument === FUND));
    await finish(run.id);
    assert.equal(
        (
            await db.query<{ v: string }>(
                'select portfolio_private.capture_snapshot($1,$2) v',
                [run.id, A],
            )
        ).rows[0].v,
        'incomplete',
    );
    await db.query(
        'delete from portfolio_private.market_prices where instrument=$1',
        [FUND],
    );
    run = await begin();
    await finish(run.id, false, true);
    assert.equal(
        (
            await db.query<{ v: string }>(
                'select portfolio_private.capture_snapshot($1,$2) v',
                [run.id, A],
            )
        ).rows[0].v,
        'incomplete',
        'A missing fund cannot disappear through bool_and(NULL)',
    );
    for (const role of ['anon', 'authenticated', 'service_role'])
        assert.equal(
            (
                await db.query<{ v: boolean }>(
                    "select has_function_privilege($1,'portfolio_private.latest_fund_refresh_slot(timestamptz)','EXECUTE') v",
                    [role],
                )
            ).rows[0].v,
            false,
        );
    for (const role of ['anon', 'authenticated'])
        assert.equal(
            (
                await db.query<{ v: boolean }>(
                    "select has_function_privilege($1,'public.begin_daily_market_refresh(text)','EXECUTE') v",
                    [role],
                )
            ).rows[0].v,
            false,
        );
    assert.equal(
        (
            await db.query<{ v: boolean }>(
                "select has_function_privilege('service_role','public.begin_daily_market_refresh(text)','EXECUTE') v",
            )
        ).rows[0].v,
        true,
    );
    console.log(
        'PASS: four fund checkpoints including DST, stock/crypto half-hour selection, new funds, retry after failure, cached NAV snapshots, missing/stale quote rejection and privileged access.',
    );
} finally {
    await db.close();
}
