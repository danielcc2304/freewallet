import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import {normalizeFundamentals,formatFundamentalMoney} from '../src/services/market/fundamentals';
import { PGlite } from '@electric-sql/pglite';
import { quoteCurrency, datedFx, marketSymbolMatches, previousCryptoClose } from '../supabase/functions/_shared/quoteCurrency';
import { fetchMarketPrice, providerJson, parseFund, parseChart } from '../supabase/functions/daily-market-data/providers';

assert.deepEqual(quoteCurrency('GBp'),{currency:'GBP',scale:0.01});
assert.ok(marketSymbolMatches('USDEUR=X','EUR=X','EUR'));
assert.equal(marketSymbolMatches('USDEUR=X','GBP=X','GBP'),false);
assert.equal(marketSymbolMatches('VOD.L','VOD','USD'),false);
assert.deepEqual(quoteCurrency('GBP'),{currency:'GBP',scale:1});
assert.throws(()=>quoteCurrency('UNKNOWN'));
assert.equal(datedFx([{at:'2026-10-02T00:00:00Z',close:1.1},{at:'2026-10-07T00:00:00Z',close:1.2}],'2026-10-05T12:00:00Z').close,1.1);
assert.equal(previousCryptoClose([{at:'2026-10-05T00:00:00Z',close:9},{at:'2026-10-06T00:00:00Z',close:10},{at:'2026-10-07T00:00:00Z',close:11}],'2026-10-07T12:00:00Z')?.close,10);
assert.equal(previousCryptoClose([{at:'2026-10-05T00:00:00Z',close:9},{at:'2026-10-07T00:00:00Z',close:11}],'2026-10-07T12:00:00Z'),undefined,'Crypto cannot borrow a close from an older day');
assert.equal(previousCryptoClose([],'invalid'),undefined);
assert.throws(()=>parseFund({data:{entity:{isin:'WRONG',lastQuote:{price:4,datetime:'2026-10-01'},currency:{code:'EUR'},classes:[{isin:'IE00BYX5NX33'}]}}},'IE00BYX5NX33'),'Do not borrow another class NAV');
assert.throws(()=>parseChart({chart:{result:[{meta:{symbol:'OTHER',currency:'EUR'}}]}},'VOD.L'));
const fundamentals=normalizeFundamentals({quoteSummary:{result:[{price:{symbol:'VOD.L',currency:'GBp',marketCap:{raw:1000000}},defaultKeyStatistics:{trailingEps:{raw:8}},summaryDetail:{dividendRate:{raw:4},fiftyTwoWeekHigh:{raw:150}},financialData:{financialCurrency:'GBP',ebitda:{raw:900000}}}]}},'VOD.L');
assert.equal(fundamentals.marketCapCurrency,'GBP');assert.equal(fundamentals.financialCurrency,'GBP');
assert.equal(formatFundamentalMoney(fundamentals.eps,fundamentals.epsCurrency),'0,08 GBP');
assert.equal(formatFundamentalMoney(fundamentals.dividendRate,fundamentals.dividendCurrency),'0,04 GBP');
assert.equal(formatFundamentalMoney(fundamentals.ebitda,fundamentals.financialCurrency),'900.000 GBP');
const realFetch=globalThis.fetch;
try {
    const day=Math.floor(Date.parse('2026-10-06T10:00:00Z')/1000), previous=day-86400;
    const requested:string[]=[];
    globalThis.fetch=(async(url)=>{
        const target=String(url);requested.push(target);
        const symbol=decodeURIComponent(target.split('/chart/')[1].split('?')[0]);
        const fx=symbol==='GBPEUR=X';
        return Response.json({chart:{result:[{meta:{symbol,currency:fx?'EUR':'GBp',regularMarketPrice:127.75,regularMarketTime:day,previousClose:120},
            timestamp:[previous,day],indicators:{quote:[{close:fx?[1.1,1.2]:[120,127.75]}]}}]}});
    }) as typeof fetch;
    const quote=await fetchMarketPrice({instrument:'VOD.L',symbol:'VOD.L',type:'stock',isin:'GB00BH4HKS39'},'fixture');
    assert.equal(quote.price_eur,1.2775*1.2);assert.equal(quote.original_unit,'GBp');assert.equal(quote.original_currency,'GBP');
    assert.equal(quote.previous_close_eur,1.2*1.1);
    assert.ok(requested.every(url=>!url.includes('finect')),'A stock ISIN must not route to the fund provider');
    const today=new Date().toISOString().slice(0,10);const midnight=Date.parse(today)/1000;
    let missingCryptoClose=false;
    globalThis.fetch=(async(url)=>{
        const target=new URL(String(url));const symbol=decodeURIComponent(target.pathname.split('/chart/')[1]);
        const fx=symbol==='USDEUR=X',euro=symbol==='BCH-EUR';
        const current=euro?110:0.007,previous=euro?100:0.008373;
        return Response.json({chart:{result:[{meta:{symbol,currency:fx||euro?'EUR':'USD',regularMarketPrice:current,regularMarketTime:midnight,previousClose:previous*0.999},
            timestamp:[midnight-(missingCryptoClose&&!fx?2:1)*86400,midnight],indicators:{quote:[{close:fx?[0.8,0.9]:[previous,current]}]}}]}});
    }) as typeof fetch;
    for(const symbol of ['BTC-USD','ROSE-USD','BCH-EUR']) {
        const crypto=await fetchMarketPrice({instrument:symbol,symbol,type:'crypto'},'fixture');
        assert.equal(crypto.previous_close_eur,symbol==='BCH-EUR'?100:0.008373*0.8,'Crypto EUR variation must use the dated daily close despite metadata differences');
        assert.equal(crypto.price_eur,symbol==='BCH-EUR'?110:0.007*0.9);
    }
    missingCryptoClose=true;
    assert.equal((await fetchMarketPrice({instrument:'BTC-USD',symbol:'BTC-USD',type:'crypto'},'fixture')).previous_close_eur,null,'No invented crypto previous close');
    let attempts=0;globalThis.fetch=(async()=>++attempts===1 ? new Response('',{status:429}) : Response.json({ok:true})) as typeof fetch;
    assert.deepEqual(await providerJson('https://fixture.invalid'),{ok:true});assert.equal(attempts,2);
    const aborted=new AbortController();aborted.abort();await assert.rejects(providerJson('https://fixture.invalid',aborted.signal));
} finally {globalThis.fetch=realFetch;}

const db=new PGlite();
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',S='33333333-3333-4333-8333-333333333333',T='44444444-4444-4444-8444-444444444444';
const migration=(suffix:string)=>readFileSync(`supabase/migrations/${readdirSync('supabase/migrations').find(n=>n.endsWith(suffix))}`,'utf8');
const login=async(uid:string,sid:string,aal='aal1')=>db.exec(`reset role;select set_config('request.jwt.claim.sub','${uid}',false);select set_config('request.jwt.claims','{"session_id":"${sid}","aal":"${aal}"}',false);set role authenticated;`);
try {
    await db.exec(`create role anon;create role authenticated;create role service_role;
        create schema auth;create schema vault;create schema cron;create schema net;create schema storage;
        create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz default now(),is_anonymous boolean default false);
        create table auth.sessions(id uuid primary key,user_id uuid);create table auth.mfa_factors(id uuid,user_id uuid,status text);
        create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
        create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
        create table vault.decrypted_secrets(name text,decrypted_secret text);insert into vault.decrypted_secrets values('daily_market_job_secret','fixture');
        create table cron.job(jobid bigint generated always as identity primary key,jobname text unique,schedule text,command text);
        create function cron.schedule(job_name text,job_schedule text,job_command text) returns bigint language plpgsql as $$declare result bigint;begin
            insert into cron.job(jobname,schedule,command) values(job_name,job_schedule,job_command)
            on conflict(jobname) do update set schedule=excluded.schedule,command=excluded.command returning jobid into result;return result;end$$;
        create table net._http_response(id bigint,timed_out boolean,status_code integer,error_msg text);
        create table storage.buckets(id text primary key,name text,public boolean);create table storage.objects(id uuid,bucket_id text,owner_id text);alter table storage.objects enable row level security;
        grant usage on schema auth,public,storage to authenticated,anon,service_role;
        insert into auth.users(id,email) values('${A}','daniel230401@gmail.com'),('${B}','editor@example.test');insert into auth.sessions values('${S}','${A}'),('${T}','${B}');`);
    for(const name of ['portfolio_foundation.sql','portfolio_commands.sql','portfolio_mfa_guard.sql','portfolio_command_validation.sql','portfolio_opening_basis.sql','daily_market_data.sql','daily_market_accounting_calendar.sql']) await db.exec(migration(name));
    await db.exec(readFileSync('supabase/news-schema.sql','utf8').replace('create extension if not exists pgcrypto;',''));
    for(const name of ['architecture_hardening.sql','market_publication_hardening.sql','portfolio_delta_commands.sql','architecture_advisor_cleanup.sql','market_snapshot_completeness.sql','market_half_hour_schedule.sql','fund_quote_sources.sql','portfolio_chronological_trades.sql']) await db.exec(migration(name));
    const schedule=(await db.query<{schedule:string}>("select schedule from cron.job where jobname='freewallet-daily-market'")).rows;
    assert.deepEqual(schedule,[{schedule:'*/30 6-21 * * *'}],'Update the existing Cron job instead of installing a duplicate');
    assert.equal((await db.query<{schedule:string}>("select schedule from cron.job where jobname='freewallet-market-watchdog'")).rows[0].schedule,'*/5 * * * *');
    for(const day of ['2026-01-15','2026-07-15','2026-03-29','2026-10-25']) {
        const slots=(await db.query<{local:string}>(`select to_char(slot at time zone 'Europe/Madrid','HH24:MI') local
            from generate_series($1::date::timestamp at time zone 'UTC',($1::date+1)::timestamp at time zone 'UTC'-interval '30 minutes',interval '30 minutes') slot
            where extract(hour from slot at time zone 'UTC') between 6 and 21 and portfolio_private.market_refresh_slot_allowed(slot) order by slot`,[day])).rows.map(r=>r.local);
        assert.equal(slots.length,30,`Exactly 30 runs on ${day}, including DST transition days`);
        assert.equal(slots[0],'08:00');assert.equal(slots.at(-1),'22:30');
        assert.ok(slots.includes('08:30')&&slots.includes('21:30'));
    }
    for(const [local,allowed] of [['07:30',false],['08:00',true],['08:15',false],['08:30',true],['22:30',true],['23:00',false]] as const)
        assert.equal((await db.query<{v:boolean}>("select portfolio_private.market_refresh_slot_allowed($1::timestamp at time zone 'Europe/Madrid') v",[`2026-10-07 ${local}`])).rows[0].v,allowed);
    const expectedSlot=async(checked:string,since:string)=>(await db.query<{v:string}>(`select to_char(portfolio_private.expected_market_refresh_slot(
        $1::timestamp at time zone 'Europe/Madrid',$2::timestamp at time zone 'Europe/Madrid') at time zone 'Europe/Madrid','YYYY-MM-DD HH24:MI') v`,[checked,since])).rows[0].v;
    assert.equal(await expectedSlot('2026-10-07 09:39','2026-10-06 00:00'),'2026-10-07 09:00','Allow ten minutes for a batch to start');
    assert.equal(await expectedSlot('2026-10-07 09:40','2026-10-06 00:00'),'2026-10-07 09:30','Monitor half-hour slots as well as full hours');
    assert.equal(await expectedSlot('2026-10-08 07:59','2026-10-06 00:00'),'2026-10-07 22:30','No expected overnight batches');
    assert.equal(await expectedSlot('2026-10-07 15:25','2026-10-07 15:20'),'2026-10-07 14:00','Do not expect new slots before activation');
    assert.equal(await expectedSlot('2026-10-07 15:40','2026-10-07 15:20'),'2026-10-07 15:30','Use the new cadence from its first scheduled slot');
    assert.equal(await expectedSlot('2026-10-08 00:30','2026-10-08 00:20'),'2026-10-07 22:00','An overnight migration preserves the previous last expected run');
    await db.exec("set time zone 'America/Los_Angeles'");
    assert.equal(await expectedSlot('2026-10-07 09:40','2026-10-06 00:00'),'2026-10-07 09:30','Slot alignment must not depend on the DB session timezone');
    await db.exec("set time zone 'UTC'");
    for(const role of ['anon','authenticated','service_role']) {
        assert.equal((await db.query<{v:boolean}>("select has_function_privilege($1,'portfolio_private.dispatch_market_refresh()','EXECUTE') v",[role])).rows[0].v,false);
        assert.equal((await db.query<{v:boolean}>("select has_function_privilege($1,'portfolio_private.expected_market_refresh_slot(timestamptz,timestamptz)','EXECUTE') v",[role])).rows[0].v,false);
    }
    await login(A,S);
    const fundContext=(await db.query<{r:{allowed:boolean,name:string,cached:unknown}}>("select public.prepare_fund_quote('IE00BYX5NX33') r")).rows[0].r;
    assert.equal(fundContext.allowed,true);assert.equal(fundContext.cached,null);
    assert.equal((await db.query<{r:{allowed:boolean}}>("select public.prepare_fund_quote('IE00BYX5NX33') r")).rows[0].r.allowed,false,'Manual refreshes are throttled independently of the batch');
    await assert.rejects(db.query("select public.prepare_fund_quote('ES0119199018')"),'A user cannot query an unowned fund through the manual endpoint');
    await assert.rejects(db.query("select public.prepare_fund_quote('INVALID')"));
    assert.equal((await db.query<{v:boolean}>('select public.ensure_news_owner() v')).rows[0].v,true);
    const asset={id:'vod',symbol:'VOD.L',isin:'GB00BH4HKS39',name:'Vodafone',type:'stock',quantity:2,purchasePrice:1,purchaseDate:'2026-01-01',currency:'EUR'};
    const opening={id:'initial-buy',assetId:'vod',assetSymbol:'VOD.L',assetName:'Vodafone',assetType:'stock',type:'buy',quantity:2,price:1,total:2,date:'2026-01-01',createdAt:'2026-01-01T12:00:00Z',provenance:'trade'};
    const book={freewallet_portfolio_v1:JSON.stringify({version:1,assets:[asset],transactions:[opening]}),freewallet_portfolio_csv_holdings_raw:'large-fixture'};
    const imported=await db.query<{r:{revision:number}}>("select public.commit_portfolio(-1,gen_random_uuid(),'import',$1) r",[JSON.stringify(book)]);
    const revision=imported.rows[0].r.revision;
    const id=crypto.randomUUID();
    const patched=await db.query<{r:{revision:number,data:object,patch:boolean}}>('select public.patch_portfolio($1,$2,$3) r',[revision,id,JSON.stringify({freewallet_theme_mode:'light'})]);
    assert.equal(patched.rows[0].r.patch,true);assert.deepEqual(patched.rows[0].r.data,{freewallet_theme_mode:'light'});
    await db.query('select public.patch_portfolio($1,$2,$3)',[revision,id,JSON.stringify({freewallet_theme_mode:'light'})]);
    await assert.rejects(db.query('select public.patch_portfolio($1,$2,$3)',[revision,id,JSON.stringify({freewallet_theme_mode:'dark'})]));
    await assert.rejects(db.query('select public.patch_portfolio($1,gen_random_uuid(),$2)',[revision,JSON.stringify({freewallet_theme_mode:'dark'})]));
    await assert.rejects(db.query('select public.patch_portfolio($1,gen_random_uuid(),$2)',[revision+1,JSON.stringify({freewallet_settings:'[]'})]));
    await assert.rejects(db.query('select public.patch_portfolio($1,gen_random_uuid(),$2)',[revision+1,JSON.stringify({private_key:'secret'})]));
    await db.query('select public.patch_portfolio($1,gen_random_uuid(),$2,$3)',[revision+1,'{}',['freewallet_portfolio_csv_holdings_raw']]);
    const invitation=await db.query<{r:{deliveryRequired:boolean}}>("select public.prepare_news_invitation('editor@example.test') r");
    assert.equal(invitation.rows[0].r.deliveryRequired,false,'Existing Auth account recovers membership without mailing');
    const prepared=(await db.query<{r:{id:string,deliveryRequired:boolean}}>("select public.prepare_news_invitation('new@example.test') r")).rows[0].r;
    assert.equal(prepared.deliveryRequired,true);
    const retry=(await db.query<{r:{id:string,deliveryRequired:boolean}}>("select public.prepare_news_invitation('new@example.test') r")).rows[0].r;
    assert.equal(retry.id,prepared.id);assert.equal(retry.deliveryRequired,false,'In-flight invitation cannot mail twice');
    await db.exec(`reset role;insert into auth.users(id,email) values(gen_random_uuid(),'new@example.test');`);
    assert.equal((await db.query<{v:boolean}>('select public.complete_news_invitation($1,true) v',[prepared.id])).rows[0].v,true,'Recover after Auth registered the account but response was lost');
    await db.query("insert into public.portfolio_positions(user_id,id,symbol,isin,name,asset_type,quantity,purchase_price_eur,purchase_date) values($1,'owned-fund-context','ES0119199018','ES0119199018','Owned fund fixture','fund',1,5,current_date)",[A]);
    await login(A,S);
    assert.equal((await db.query<{r:{allowed:boolean,name:string}}>("select public.prepare_fund_quote('ES0119199018') r")).rows[0].r.name,'Owned fund fixture');
    await login(B,T);
    await assert.rejects(db.query("select public.prepare_fund_quote('ES0119199018')"),'A different owner cannot refresh or read another portfolio fund');
    await db.exec('reset role;');
    await db.query("delete from public.portfolio_positions where user_id=$1 and id='owned-fund-context'",[A]);
    await login(B,T);assert.equal((await db.query<{v:boolean}>('select public.has_pending_news_invitation() v')).rows[0].v,true);
    assert.equal((await db.query<{v:boolean}>('select public.accept_news_editor_invitation() v')).rows[0].v,true);
    await db.query("insert into public.news_posts(slug,title,author_id) values('editor-article','Fixture',$1)",[B]);
    await login(A,S);await db.query("insert into public.news_posts(slug,title,author_id,status) values('owner-article','Fixture',$1,'published')",[A]);
    await login(B,T);
    assert.equal((await db.query("update public.news_posts set title='Unauthorized' where slug='owner-article' returning id")).rows.length,0);
    assert.equal((await db.query("update public.news_posts set title='Own edit' where slug='editor-article' returning id")).rows.length,1);
    await db.exec(`reset role;insert into auth.mfa_factors values(gen_random_uuid(),'${B}','verified');set role authenticated;`);
    assert.equal((await db.query<{v:boolean}>('select public.is_news_admin() v')).rows[0].v,false);
    await assert.rejects(db.query("select public.prepare_fund_quote('IE00BYX5NX33')"),'MFA is enforced even for cached fund quotes');
    assert.equal((await db.query("update public.news_posts set title='No MFA' where slug='editor-article' returning id")).rows.length,0);
    await login(B,T,'aal2');assert.equal((await db.query<{v:boolean}>('select public.is_news_admin() v')).rows[0].v,true);
    await db.exec(`reset role;delete from auth.sessions where id='${T}';set role authenticated;`);
    assert.equal((await db.query<{v:boolean}>('select public.is_news_admin() v')).rows[0].v,false);
    await assert.rejects(db.query("select public.prepare_fund_quote('IE00BYX5NX33')"),'A revoked session cannot trigger a fund refresh');
    await db.exec('reset role;set role anon;');
    await assert.rejects(db.query('select public.is_news_admin()'));
    assert.equal((await db.query('select slug from public.news_posts')).rows.length,1,'Public published article remains readable');
    await db.exec('reset role;');
    const run=(await db.query<{r:{id:string,instrumentsV2:Array<{instrument:string,type:string}>}}>("select public.begin_daily_market_refresh('fixture') r")).rows[0].r;
    assert.ok(run.instrumentsV2.some(i=>i.instrument==='VOD.L'&&i.type==='stock'));
    const now=new Date().toISOString(), price={instrument:'VOD.L',quoted_at:now,checked_at:now,price_eur:1.5,previous_close_eur:1.4,original_price:125,original_currency:'GBP',original_unit:'GBp',unit_scale:0.01,fx_rate:1.2,fx_at:now,source:'Yahoo Finance'};
    await db.query('select public.finish_daily_market_refresh($1,$2,$3)',[run.id,JSON.stringify([price]),'[]']);
    assert.equal((await db.query<{n:number}>('select count(*)::int n from portfolio_private.daily_snapshots')).rows[0].n,0,'Publication does not capture or lock all portfolios');
    assert.equal((await db.query<{v:string}>('select public.capture_market_snapshot($1,$2) v',[run.id,A])).rows[0].v,'captured');
    for(let repeat=0;repeat<30;repeat++) await db.query('select public.capture_market_snapshot($1,$2)',[run.id,A]);
    assert.equal((await db.query<{n:number}>('select count(*)::int n from portfolio_private.daily_snapshots')).rows[0].n,1,'Thirty captures do not create thirty daily snapshots');
    assert.equal((await db.query<{n:number}>('select count(*)::int n from portfolio_private.snapshot_ledger')).rows[0].n,1,'Repeated captures do not duplicate trades');
    const snapshots=(await db.query<{transactions:unknown[],valuation_kind:string}>('select transactions,valuation_kind from portfolio_private.daily_snapshots')).rows;
    assert.deepEqual(snapshots[0].transactions,[]);assert.equal(snapshots[0].valuation_kind,'mixed-observations');
    await login(A,S);
    const daily=(await db.query<{r:{snapshots:Array<{ledgerVersion:number}>,ledger:unknown[],prices:Array<{original_unit:string}>}}>('select public.read_daily_market_data_v2() r')).rows[0].r;
    assert.equal(daily.snapshots.length,1);assert.equal(daily.prices[0].original_unit,'GBp');
    const legacy=(await db.query<{r:{snapshots:Array<{transactions:unknown[]}>}}>('select public.read_daily_market_data() r')).rows[0].r;
    assert.equal(legacy.snapshots.length,1);
    await db.exec('reset role;');
    const firstVersion=(await db.query<{v:number}>('select ledger_version v from portfolio_private.daily_snapshots')).rows[0].v;
    await db.exec("update portfolio_private.daily_snapshots set snapshot_date=snapshot_date-1;");
    await login(A,S);
    const changed={version:1,assets:[{...asset,quantity:3,purchasePrice:1.333333333333}],transactions:[opening,{...opening,id:'backdated-buy',quantity:1,price:2,total:2,date:'2026-01-02',createdAt:new Date().toISOString()}]};
    await db.query('select public.patch_portfolio($1,gen_random_uuid(),$2)',[revision+2,JSON.stringify({freewallet_portfolio_v1:JSON.stringify(changed)})]);
    await assert.rejects(db.query('select public.patch_portfolio($1,gen_random_uuid(),$2)',[revision+3,JSON.stringify({freewallet_portfolio_v1:JSON.stringify({...changed,transactions:[]})})]));
    await db.exec('reset role;');
    assert.equal((await db.query<{v:string}>('select public.capture_market_snapshot($1,$2) v',[run.id,A])).rows[0].v,'captured');
    assert.equal((await db.query<{n:number}>('select count(*)::int n from portfolio_private.snapshot_ledger')).rows[0].n,2,'Operations are stored once across valuations');
    assert.equal((await db.query<{n:number}>('select count(*)::int n from portfolio_private.snapshot_ledger where entry_no<=$1',[firstVersion])).rows[0].n,1,'A later backdated trade cannot enter the old snapshot book');
    await login(B,T,'aal2');
    await assert.rejects(db.query('select public.read_daily_market_data_v2()'),'Revoked B session cannot read A ledger');
    await db.exec('reset role;');
    const completeSnapshot=(await db.query<{snapshot:object}>('select to_jsonb(s) snapshot from portfolio_private.daily_snapshots s order by snapshot_date desc limit 1')).rows[0].snapshot;
    const missingAsset={...asset,id:'missing',symbol:'MISSING',name:'Unpriced fixture',isin:undefined,quantity:1,purchasePrice:10};
    const withMissing={...changed,assets:[...changed.assets,missingAsset],transactions:[...changed.transactions,{...opening,id:'missing-buy',assetId:'missing',assetSymbol:'MISSING',assetName:'Unpriced fixture',quantity:1,price:10,total:10}]};
    await login(A,S);
    await db.query('select public.patch_portfolio($1,gen_random_uuid(),$2)',[revision+3,JSON.stringify({freewallet_portfolio_v1:JSON.stringify(withMissing)})]);
    await db.exec('reset role;');
    const incompleteRun=(await db.query<{r:{id:string}}>("select public.begin_daily_market_refresh('fixture') r")).rows[0].r;
    await db.query('select public.finish_daily_market_refresh($1,$2,$3)',[incompleteRun.id,JSON.stringify([price]),'[{"instrument":"MISSING","reason":"No provider observation"}]']);
    assert.equal((await db.query<{v:string}>('select public.capture_market_snapshot($1,$2) v',[incompleteRun.id,A])).rows[0].v,'incomplete','A missing price must be rejected even when another position has a valid price');
    assert.deepEqual((await db.query<{snapshot:object}>('select to_jsonb(s) snapshot from portfolio_private.daily_snapshots s order by snapshot_date desc limit 1')).rows[0].snapshot,completeSnapshot,'An incomplete run must preserve the entire last valid daily snapshot');
    assert.equal((await db.query<{n:number}>('select count(*)::int n from portfolio_private.snapshot_ledger')).rows[0].n,2,'An incomplete valuation must not advance its snapshot ledger');
    assert.equal((await db.query<{v:string}>('select status v from portfolio_private.market_snapshot_results where run_id=$1 and user_id=$2',[incompleteRun.id,A])).rows[0].v,'incomplete');
    const recoveredRun=(await db.query<{r:{id:string}}>("select public.begin_daily_market_refresh('fixture') r")).rows[0].r;
    const missingPrice={...price,instrument:'MISSING',price_eur:10,previous_close_eur:9,original_price:10,original_currency:'EUR',original_unit:'EUR',unit_scale:1,fx_rate:1,fx_at:null};
    await db.query('select public.finish_daily_market_refresh($1,$2,$3)',[recoveredRun.id,JSON.stringify([price,missingPrice]),'[]']);
    assert.equal((await db.query<{v:string}>('select public.capture_market_snapshot($1,$2) v',[recoveredRun.id,A])).rows[0].v,'captured','The next complete run must recover normally');
    assert.equal((await db.query<{n:number}>('select count(*)::int n from portfolio_private.snapshot_ledger')).rows[0].n,3);
    // Cash is valid without a market quote, but cannot mask a missing security.
    const C='55555555-5555-4555-8555-555555555555',U='66666666-6666-4666-8666-666666666666';
    await db.query('insert into auth.users(id,email) values($1,$2)',[C,'cash-fixture@example.test']);
    await db.query('insert into auth.sessions values($1,$2)',[U,C]);await login(C,U);
    const cash={id:'cash',symbol:'CASH',name:'Cash fixture',type:'cash',quantity:50,purchasePrice:1,purchaseDate:'2026-01-01',currency:'EUR'};
    const cashBook={version:1,assets:[cash],transactions:[]};
    const cashRevision=(await db.query<{r:{revision:number}}>("select public.commit_portfolio(-1,gen_random_uuid(),'import',$1) r",[JSON.stringify({freewallet_portfolio_v1:JSON.stringify(cashBook)})])).rows[0].r.revision;
    await db.exec('reset role;');
    assert.equal((await db.query<{v:string}>('select public.capture_market_snapshot($1,$2) v',[recoveredRun.id,C])).rows[0].v,'captured','A cash-only portfolio needs no provider price');
    const cashSnapshot=(await db.query<{snapshot:object}>('select to_jsonb(s) snapshot from portfolio_private.daily_snapshots s where user_id=$1',[C])).rows[0].snapshot;
    await login(C,U);
    const absentAsset={...missingAsset,symbol:'ABSENT'};
    await db.query('select public.patch_portfolio($1,gen_random_uuid(),$2)',[cashRevision,JSON.stringify({freewallet_portfolio_v1:JSON.stringify({...cashBook,assets:[cash,absentAsset],transactions:[{...withMissing.transactions.at(-1)!,assetSymbol:'ABSENT'}]})})]);
    await db.exec('reset role;');
    assert.equal((await db.query<{v:string}>('select public.capture_market_snapshot($1,$2) v',[recoveredRun.id,C])).rows[0].v,'incomplete','Cash plus an unpriced security must be incomplete');
    assert.deepEqual((await db.query<{snapshot:object}>('select to_jsonb(s) snapshot from portfolio_private.daily_snapshots s where user_id=$1',[C])).rows[0].snapshot,cashSnapshot);
    const failedRun=(await db.query<{r:{id:string}}>("select public.begin_daily_market_refresh('fixture') r")).rows[0].r;
    await db.query('select public.finish_daily_market_refresh($1,$2,$3)',[failedRun.id,'[]','[{"instrument":"VOD.L","reason":"fixture"}]']);
    await db.query('select portfolio_private.market_watchdog()');
    assert.equal((await db.query<{v:boolean}>("select exists(select 1 from portfolio_private.market_alerts where resolved_at is null) v")).rows[0].v,true);
    console.log('Architecture: currencies, providers, editorial access/MFA, invitation recovery, patches, half-hour Cron/DST/activation grace, deduplicated captures, missing-price rejection, preserved daily snapshots/ledger, recovery, cash portfolios and worker health passed.');
} finally {await db.close();}
