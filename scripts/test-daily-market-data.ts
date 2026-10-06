import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { parseFund, parseChart, fxAt } from '../supabase/functions/daily-market-data/providers';

const ISIN = 'IE00BYX5NX33';
const at = '2026-10-05T00:00:00Z';
const model = { data: { entity: { isin: ISIN, currency: { code: 'EUR' }, lastQuote: { price: 14, change: 0.1, datetime: at } } } };
assert.equal(parseFund(model, ISIN).price, 14);
assert.throws(() => parseFund(model, 'IE0031786696'));
assert.throws(() => parseFund({data:{entity:{...model.data.entity,lastQuote:{price:14}}}}, ISIN));
assert.throws(() => parseFund({data:{entity:{...model.data.entity,lastQuote:{price:NaN,datetime:at}}}}, ISIN));
assert.throws(() => fxAt([{at:'2026-10-06T00:00:00Z',close:0.9}], at));
assert.throws(() => fxAt([{at:'2026-09-01T00:00:00Z',close:0.9}], at));
assert.equal(fxAt([{at:'2026-10-02T00:00:00Z',close:0.9}],at).close, 0.9);
assert.throws(() => parseChart({chart:{result:[{meta:{currency:'UNKNOWN'},timestamp:[1],indicators:{quote:[{close:[1]}]}}]}}));
const db = new PGlite();
const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222', S='33333333-3333-4333-8333-333333333333';
try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
        create schema auth; create schema vault;
        create table vault.decrypted_secrets(name text,decrypted_secret text);
        insert into vault.decrypted_secrets values('daily_market_job_secret','fixture');
        create table auth.users(id uuid primary key,email_confirmed_at timestamptz default now(),is_anonymous boolean default false);
        create table auth.sessions(id uuid primary key,user_id uuid);
        create table auth.mfa_factors(id uuid,user_id uuid,status text);
        create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
        create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
        grant usage on schema auth,public to authenticated,anon,service_role;
        insert into auth.users(id) values('${A}'),('${B}');
        insert into auth.sessions values('${S}','${A}');`);
    for (const suffix of ['portfolio_foundation.sql','portfolio_commands.sql','portfolio_mfa_guard.sql','portfolio_command_validation.sql','portfolio_opening_basis.sql','daily_market_data.sql','daily_market_accounting_calendar.sql']) {
        const migration = readdirSync('supabase/migrations').find(n=>n.endsWith(suffix));
        assert.ok(migration); await db.exec(readFileSync(`supabase/migrations/${migration}`,'utf8'));
    }
    for (const owner of [A,B]) {
        await db.query('insert into public.user_portfolios(user_id) values($1)',[owner]);
        await db.query("insert into public.portfolio_positions(user_id,id,symbol,name,asset_type,quantity,purchase_price_eur,purchase_date) values($1,'asset',$2,'fixture','stock',2,5,current_date)",[owner,owner===A?'AAA':'BBB']);
        const asset={id:'asset',symbol:owner===A?'AAA':'BBB',name:'fixture',type:'stock',quantity:2,purchasePrice:5,purchaseDate:new Date().toISOString().slice(0,10),currency:'EUR'};
        await db.query('insert into portfolio_private.documents values($1,$2)',[owner,JSON.stringify({freewallet_portfolio_v1:JSON.stringify({version:1,assets:[asset],transactions:[]})})]);
    }
    await assert.rejects(db.query("select public.begin_daily_market_refresh('wrong')"));
    const begin = await db.query<{run: {id:string}}>("select public.begin_daily_market_refresh('fixture') as run");
    const id=begin.rows[0].run.id;
    assert.equal((await db.query<{run: unknown}>("select public.begin_daily_market_refresh('fixture') as run")).rows[0].run,null);
    const stamp=new Date().toISOString();
    const price=(instrument:string)=>({instrument,quoted_at:stamp,checked_at:stamp,price_eur:10,previous_close_eur:9,original_price:10,original_currency:'EUR',fx_rate:1,fx_at:null,source:'Yahoo Finance'});
    await db.query('select public.finish_daily_market_refresh($1,$2,$3)',[id,JSON.stringify([price('AAA'),price(ISIN)]),JSON.stringify([{instrument:'BBB',reason:'HTTP 429'}])]);
    assert.equal((await db.query<{n:number}>('select count(*)::int n from portfolio_private.daily_snapshots')).rows[0].n,1,'Missing quote must prevent publishing B valuation');
    assert.equal((await db.query<{revision:number}>('select revision from public.user_portfolios limit 1')).rows[0].revision,0,'Batch never mutates portfolio revisions');
    await assert.rejects(db.query('select public.finish_daily_market_refresh($1,$2,$3)',[id,'[]','[]']));
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${A}',false); select set_config('request.jwt.claims','{"session_id":"${S}","aal":"aal1"}',false);`);
    await assert.rejects(db.query("select public.begin_daily_market_refresh('fixture')"));
    await assert.rejects(db.query('select * from portfolio_private.market_prices'));
    const result=await db.query<{data:{prices:Array<{instrument:string}>,snapshots:unknown[],lastRun:{failures:unknown[]}}}>('select public.read_daily_market_data() data');
    assert.deepEqual(new Set(result.rows[0].data.prices.map(p=>p.instrument)),new Set(['AAA',ISIN]));
    assert.equal(result.rows[0].data.snapshots.length,1);
    assert.equal(result.rows[0].data.lastRun.failures.length,0,'A must not see B failures');
    await db.exec(`reset role; delete from auth.sessions where id='${S}'; set role authenticated;`);
    await assert.rejects(db.query('select public.read_daily_market_data()'));
    console.log('Daily market: provider identity/dates/FX, batch lease, atomic snapshots, missing prices, permissions, tenant isolation and revoked sessions passed.');
} finally { await db.close(); }
