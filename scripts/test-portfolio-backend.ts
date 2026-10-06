import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { calculatePortfolioResults } from '../src/services/portfolioResults';
import { AccountScope } from '../src/services/accountScope';
import { assertPublicSupabaseEnvironment, publicSupabaseConfig } from '../src/services/supabaseConfig';

const publicKey = 'sb_publishable_fixture';
assert.ok(publicSupabaseConfig('https://example.supabase.co/', publicKey));
assert.ok(publicSupabaseConfig('http://127.0.0.1:54321', publicKey));
const jwt = (role: string) => `header.${btoa(JSON.stringify({ role }))}.signature`;
assert.ok(publicSupabaseConfig('https://example.supabase.co', jwt('anon')));
for (const key of ['sb_secret_fixture', jwt('service_role'), jwt('authenticated'), 'not-a-key']) {
    assert.equal(publicSupabaseConfig('https://example.supabase.co', key), null);
    assert.throws(() => assertPublicSupabaseEnvironment({ VITE_SUPABASE_PUBLISHABLE_KEY: key }));
}
assert.throws(() => assertPublicSupabaseEnvironment({ VITE_SUPABASE_SERVICE_ROLE_KEY: 'private' }));
assert.doesNotThrow(() => assertPublicSupabaseEnvironment({ VITE_SUPABASE_ANON_KEY: jwt('anon') }));
for (const url of ['http://example.com', 'https://user:password@example.com', 'https://example.com/path', 'https://example.com?token=secret']) {
    assert.equal(publicSupabaseConfig(url, publicKey), null);
}
const scope = new AccountScope();
assert.throws(() => scope.request());
scope.change('A');
const pending = scope.request();
scope.change('B');
assert.ok(pending.signal.aborted);
assert.equal(pending.isCurrent(), false);
const current = scope.request();
assert.ok(current.isCurrent());
scope.change('B'); // A renewed session also invalidates the previous request.
assert.ok(current.signal.aborted);
scope.change(null);
assert.throws(() => scope.request());

// PostgreSQL executes the real migration. Auth roles/functions are fixture stubs,
// not real Supabase login or JWT verification. No remote project is mutated.
const db = new PGlite();
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const tables = ['user_portfolios','portfolio_positions','portfolio_transactions','portfolio_valuations',
    'portfolio_preferences','portfolio_targets','portfolio_imports'];
try {
    await db.exec(`
        create role anon nologin;
        create role authenticated nologin;
        create schema auth;
        create table auth.users(id uuid primary key, email_confirmed_at timestamptz default now(), is_anonymous boolean default false);
        create table auth.sessions(id uuid primary key, user_id uuid references auth.users(id) on delete cascade);
        create table auth.mfa_factors(id uuid primary key,user_id uuid references auth.users(id) on delete cascade,status text);
        create function auth.uid() returns uuid language sql stable as $$
            select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
        create function auth.jwt() returns jsonb language sql stable as $$
            select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
        grant usage on schema auth, public to anon, authenticated;
        insert into auth.users(id) values ('${A}'), ('${B}');
    `);
    const migration = readdirSync('supabase/migrations').find(name => name.endsWith('_portfolio_foundation.sql'));
    assert.ok(migration);
    await db.exec(readFileSync(`supabase/migrations/${migration}`, 'utf8'));
    if (process.env.FREEWALLET_REFERENCE_FILE) {
        const source = readFileSync(process.env.FREEWALLET_REFERENCE_FILE, 'utf8');
        const reference = [...source.matchAll(/\['([^']+)', '(fund|stock|crypto)', ([\d.]+), ([\d.]+)\]/g)];
        assert.equal(reference.length, 15, 'The optional private fixture must contain all 15 supplied positions');
        const user = '44444444-4444-4444-8444-444444444444';
        await db.query('insert into auth.users(id) values ($1)', [user]);
        await db.query('insert into public.user_portfolios(user_id) values ($1)', [user]);
        for (const row of reference) {
            await db.query(`insert into public.portfolio_positions(user_id,id,symbol,name,asset_type,quantity,purchase_price_eur,purchase_date)
                values ($1,$2,$2,$2,$3,$4,$5,'2026-01-01')`, [user, row[1], row[2], String(Number(row[3])), String(Number(row[4]))]);
            const stored = await db.query<{ quantity: string; price: string }>(`select quantity::text, purchase_price_eur::text as price from public.portfolio_positions where user_id=$1 and id=$2`, [user, row[1]]);
            assert.equal(Number(stored.rows[0].quantity), Number(row[3]));
            assert.equal(Number(stored.rows[0].price), Number(row[4]));
        }
        console.log('Private reference: all 15 quantities/costs preserved in local PostgreSQL; no personal fixture or remote data written.');
    }
    for (const user of [A, B]) {
        await db.query('insert into public.user_portfolios(user_id) values ($1)', [user]);
        await db.query(`insert into public.portfolio_positions values ($1,'position','TEST','Synthetic asset','crypto',null,'0.123456789123','123.456789123456','2026-01-01')`, [user]);
        await db.query(`insert into public.portfolio_transactions(user_id,id,asset_id,asset_symbol,asset_name,asset_type,operation_type,operation_date,quantity,price_eur,total_eur,provenance,recorded_at)
            values ($1,'trade','sold-position','SOLD','Sold asset','stock','sell','2026-01-02',1,100,100,'legacy-import',now())`, [user]);
        await db.query(`insert into public.portfolio_valuations(user_id,valuation_date,cadence,source,value_eur,invested_eur)
            values ($1,'2026-01-01','daily','legacy-import',100,90)`, [user]);
        await db.query('insert into public.portfolio_preferences(user_id) values ($1)', [user]);
        await db.query(`insert into public.portfolio_targets values ($1,'position',100)`, [user]);
        await db.query(`insert into public.portfolio_imports(user_id,source,format_version,payload) values ($1,'local-migration',1,'{}')`, [user]);
    }
    const expectCode = async (query: string, params: unknown[], code: string) => {
        await assert.rejects(db.query(query, params), error => typeof error === 'object' && error !== null && 'code' in error && error.code === code);
    };
    await expectCode(`insert into public.portfolio_positions values ($1,'bad','TEST','Invalid','stock',null,'NaN',1,'2026-01-01')`, [A], '23514');
    await expectCode(`insert into public.portfolio_positions values ($1,'bad','TEST','Invalid','stock',null,-1,1,'2026-01-01')`, [A], '23514');
    await expectCode(`insert into public.portfolio_positions values ($1,'bad','TEST','Invalid','stock',null,1,1,'infinity')`, [A], '23514');
    await expectCode(`update public.portfolio_targets set target_percent=101 where user_id=$1`, [A], '23514');
    await db.query(`insert into public.portfolio_positions values ($1,'only-A','TEST','Private','stock',null,1,1,'2026-01-01')`, [A]);
    await expectCode(`insert into public.portfolio_targets values ($1,'only-A',20)`, [B], '23503');
    const precision = await db.query<{ quantity: string; price: string }>(`select quantity::text, purchase_price_eur::text as price from public.portfolio_positions where user_id=$1 and id='position'`, [A]);
    assert.deepEqual(precision.rows[0], { quantity: '0.123456789123', price: '123.456789123456' });
    await db.query(`insert into portfolio_private.command_receipts values ($1,'33333333-3333-4333-8333-333333333333',$2,1,now())`, [A, 'a'.repeat(64)]);
    await expectCode(`insert into portfolio_private.command_receipts values ($1,'33333333-3333-4333-8333-333333333333',$2,1,now())`, [A, 'a'.repeat(64)], '23505');

    await db.exec('set role authenticated');
    for (const user of [A, B]) {
        await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [user]);
        for (const table of tables) {
            const rows = await db.query<{ user_id: string }>(`select user_id from public.${table}`);
            assert.ok(rows.rows.length > 0);
            assert.ok(rows.rows.every(row => row.user_id === user), `${table}: no cross-account rows`);
            const stranger = await db.query(`select user_id from public.${table} where user_id=$1`, [user === A ? B : A]);
            assert.equal(stranger.rows.length, 0);
            await expectCode(`update public.${table} set user_id=$1`, [user], '42501');
            await expectCode(`delete from public.${table}`, [], '42501');
            await expectCode(`insert into public.${table} default values`, [], '42501');
        }
        await expectCode(`insert into public.user_portfolios(user_id) values ($1)`, [user], '42501');
        await expectCode(`select * from portfolio_private.command_receipts`, [], '42501');
    }
    await db.query(`select set_config('request.jwt.claims','{"is_anonymous":true}',false)`);
    for (const table of tables) assert.equal((await db.query(`select * from public.${table}`)).rows.length, 0);
    await db.exec('set role anon');
    for (const table of tables) await expectCode(`select * from public.${table}`, [], '42501');
    await db.exec('reset role');
    assert.equal((await db.query(`select * from public.portfolio_positions where user_id=$1`, [A])).rows.length, 2);
    await db.query('delete from auth.users where id=$1', [A]);
    for (const table of tables) assert.equal((await db.query(`select * from public.${table} where user_id=$1`, [A])).rows.length, 0);
    assert.equal((await db.query(`select * from portfolio_private.command_receipts where user_id=$1`, [A])).rows.length, 0);
    const commands = readdirSync('supabase/migrations').find(name => name.endsWith('_portfolio_commands.sql'));
    assert.ok(commands);
    await db.exec(readFileSync(`supabase/migrations/${commands}`, 'utf8'));
    const mfa=readdirSync('supabase/migrations').find(name=>name.endsWith('_portfolio_mfa_guard.sql'));assert.ok(mfa);
    await db.exec(readFileSync(`supabase/migrations/${mfa}`,'utf8'));
    const validation=readdirSync('supabase/migrations').find(name=>name.endsWith('_portfolio_command_validation.sql'));assert.ok(validation);
    await db.exec(readFileSync(`supabase/migrations/${validation}`,'utf8'));
    const openingMigration=readdirSync('supabase/migrations').find(name=>name.endsWith('_portfolio_opening_basis.sql'));assert.ok(openingMigration);
    await db.exec(readFileSync(`supabase/migrations/${openingMigration}`,'utf8'));
    const C = '55555555-5555-4555-8555-555555555555';
    const session = '66666666-6666-4666-8666-666666666666';
    await db.query('insert into auth.users(id) values ($1)',[C]);
    await db.query('insert into auth.sessions values ($1,$2)',[session,C]);
    await db.exec('set role authenticated');
    await db.query(`select set_config('request.jwt.claim.sub',$1,false), set_config('request.jwt.claims',$2,false)`,[C,JSON.stringify({session_id:session})]);
    const asset = { id:'test',symbol:'TEST',name:'Synthetic',type:'stock',quantity:3,purchasePrice:10,purchaseDate:'2026-01-01',currency:'EUR' };
    const initial = {version:1,assets:[asset],transactions:[] as Record<string,unknown>[]};
    const data = (state = initial) => ({freewallet_portfolio_v1:JSON.stringify(state),freewallet_theme_mode:'dark'});
    let result = await db.query<{result:{revision:number;data:Record<string,string>}}>(`select public.commit_portfolio(-1,$1,'import',$2) as result`,[session,data()]);
    assert.equal(result.rows[0].result.revision,1);
    result = await db.query(`select public.commit_portfolio(-1,$1,'import',$2) as result`,[session,data()]);
    assert.equal(result.rows[0].result.revision,1,'Same request is idempotent');
    await expectCode(`select public.commit_portfolio(-1,$1,'import',$2)`,[session,{...data(),freewallet_theme_mode:'light'}],'22023');
    await expectCode(`select public.commit_portfolio(0,gen_random_uuid(),'save',$1)`,[data()],'40001');
    await expectCode(`select public.commit_portfolio(1,gen_random_uuid(),'save',$1)`,[{...data(),freewallet_finnhub_key:'private'}],'22023');
    const buy = {id:'buy',assetId:'test',assetSymbol:'TEST',assetName:'Synthetic',assetType:'stock',type:'buy',date:'2026-02-01',quantity:2,price:20,total:999,createdAt:'2026-02-01T12:00:00Z'};
    const purchased = {version:1,assets:[{...asset,quantity:5,purchasePrice:999,purchaseDate:'2026-02-01'}],transactions:[buy]};
    result = await db.query(`select public.commit_portfolio(1,gen_random_uuid(),'save',$1) as result`,[data(purchased)]);
    const verified = JSON.parse(result.rows[0].result.data.freewallet_portfolio_v1);
    assert.equal(verified.assets[0].purchasePrice,14);
    assert.equal(verified.assets[0].purchaseDate,'2026-01-01');
    assert.equal(verified.transactions[0].total,40);
    await expectCode(`select public.commit_portfolio(2,gen_random_uuid(),'save',$1)`,[data()],'22023');
    const sell = {...buy,id:'sell',type:'sell',quantity:2,price:30};
    const sold = {...verified,assets:[{...verified.assets[0],quantity:3}],transactions:[sell,...verified.transactions]};
    result = await db.query(`select public.commit_portfolio(2,gen_random_uuid(),'save',$1) as result`,[data(sold)]);
    assert.equal(JSON.parse(result.rows[0].result.data.freewallet_portfolio_v1).assets[0].quantity,3);
    const soldCanonical=JSON.parse(result.rows[0].result.data.freewallet_portfolio_v1);
    const lateOpening={...buy,id:'position-test',quantity:3,price:14,total:42,date:'2026-01-01',createdAt:'2026-01-01',provenance:'initial-position'};
    await expectCode(`select public.commit_portfolio(3,gen_random_uuid(),'save',$1)`,[data({...soldCanonical,transactions:[...soldCanonical.transactions,lateOpening]})],'22023');
    const invalid = {...sold,assets:[{...asset,quantity:-10}]};
    await expectCode(`select public.commit_portfolio(3,gen_random_uuid(),'save',$1)`,[data(invalid)],'22023');
    assert.equal((await db.query<{result:{revision:number}}>('select public.read_portfolio() as result')).rows[0].result.revision,3);
    assert.equal((await db.query<{result:{data:null}}>('select public.read_portfolio(3) as result')).rows[0].result.data,null);
    await expectCode('select * from portfolio_private.documents',[],'42501');
    await expectCode('select * from public.portfolio_positions',[],'42501');
    await db.exec('reset role');
    await db.query(`insert into auth.mfa_factors values (gen_random_uuid(),$1,'verified')`,[C]);
    await db.exec('set role authenticated');
    await expectCode('select public.read_portfolio()',[],'42501');
    await db.query(`select set_config('request.jwt.claims',$1,false)`,[JSON.stringify({session_id:session,aal:'aal2'})]);
    assert.equal((await db.query<{result:{revision:number}}>('select public.read_portfolio() as result')).rows[0].result.revision,3);
    await db.query(`select set_config('request.jwt.claim.sub',$1,false)`,[B]);
    await expectCode('select public.read_portfolio()',[],'42501');
    await db.exec('reset role');
    await db.query('delete from auth.sessions where id=$1',[session]);
    await db.exec('set role authenticated');
    await db.query(`select set_config('request.jwt.claim.sub',$1,false)`,[C]);
    await expectCode('select public.read_portfolio()',[],'42501');
    await db.exec('set role anon');
    await expectCode('select public.read_portfolio()',[],'42501');
    await db.exec('reset role');
    const importedOwner=crypto.randomUUID(), importedSession=crypto.randomUUID();
    await db.query('insert into auth.users(id) values ($1)',[importedOwner]);
    await db.query('insert into auth.sessions values ($1,$2)',[importedSession,importedOwner]);
    await db.exec('set role authenticated');
    await db.query(`select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)`,[importedOwner,JSON.stringify({session_id:importedSession})]);
    await db.query(`select public.commit_portfolio(-1,gen_random_uuid(),'import',$1)`,[data()]);
    const opening={id:'position-test',assetId:asset.id,assetSymbol:asset.symbol,assetName:asset.name,assetType:asset.type,type:'buy',provenance:'initial-position',date:asset.purchaseDate,createdAt:asset.purchaseDate,quantity:asset.quantity,price:asset.purchasePrice,total:asset.quantity*asset.purchasePrice};
    const firstSale={...sell,total:60};
    const saleWithOpening={version:1,assets:[{...asset,quantity:1}],transactions:[firstSale,opening]};
    for (const forged of [{...opening,price:1},{...opening,quantity:30},{...opening,total:0},{...opening,assetSymbol:'OTHER'},{...opening,date:'2025-01-01'},{...opening,id:'fake'},{...opening,assetId:'missing'}]) {
        await expectCode(`select public.commit_portfolio(1,gen_random_uuid(),'save',$1)`,[data({...saleWithOpening,transactions:[firstSale,forged]})],'22023');
    }
    await expectCode(`select public.commit_portfolio(1,gen_random_uuid(),'save',$1)`,[data({...saleWithOpening,transactions:[firstSale,{...buy,id:'extra'},opening]})],'22023');
    assert.equal((await db.query<{result:{revision:number}}>('select public.read_portfolio() as result')).rows[0].result.revision,1,'Forged baselines roll back atomically');
    const openingRequest=crypto.randomUUID();
    const actual=await db.query<{result:{revision:number;data:Record<string,string>}}>(`select public.commit_portfolio(1,$1,'save',$2) as result`,[openingRequest,data(saleWithOpening)]);
    const saved=JSON.parse(actual.rows[0].result.data.freewallet_portfolio_v1);
    assert.equal(saved.assets[0].quantity,1);assert.equal(saved.transactions.length,2);
    assert.equal(saved.transactions.find((t:{provenance:string})=>t.provenance==='initial-position').total,30);
    assert.equal(calculatePortfolioResults(saved.assets,saved.transactions).realizedGain,40,'The first cloud sale retains its verified opening cost');
    assert.equal((await db.query<{result:{revision:number}}>(`select public.commit_portfolio(1,$1,'save',$2) as result`,[openingRequest,data(saleWithOpening)])).rows[0].result.revision,2,'A repeated sale must not duplicate the opening basis');
    await expectCode(`select public.commit_portfolio(2,gen_random_uuid(),'save',$1)`,[data({...saved,transactions:[...saved.transactions,{...opening,id:'position-again'}]})],'22023');
    await db.exec('reset role');
    const zeroOwner='77777777-7777-4777-8777-777777777777';
    const zeroSession='88888888-8888-4888-8888-888888888888';
    await db.query('insert into auth.users(id) values ($1)',[zeroOwner]);
    await db.query('insert into auth.sessions values ($1,$2)',[zeroSession,zeroOwner]);
    await db.exec('set role authenticated');
    await db.query(`select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)`,[zeroOwner,JSON.stringify({session_id:zeroSession})]);
    const zero={...initial,assets:[{...asset,quantity:0}]};
    await expectCode(`select public.commit_portfolio(-1,gen_random_uuid(),'import',$1)`,[data({...zero,assets:[zero.assets[0],zero.assets[0]]})],'22023');
    await db.query(`select public.commit_portfolio(-1,gen_random_uuid(),'import',$1)`,[data(zero)]);
    await expectCode(`select public.commit_portfolio(1,gen_random_uuid(),'save',$1)`,[data({...zero,transactions:[{...buy,quantity:0}]})],'22023');
    const removed={...zero,assets:[],transactions:[{...buy,id:'delete-zero',type:'delete',quantity:0}]};
    const deletion=await db.query<{result:{data:Record<string,string>}}>(`select public.commit_portfolio(1,gen_random_uuid(),'save',$1) as result`,[data(removed)]);
    const afterRemoval=JSON.parse(deletion.rows[0].result.data.freewallet_portfolio_v1);
    assert.equal(afterRemoval.assets.length,0);
    assert.equal(afterRemoval.transactions[0].total,0);
    console.log('Atomic API passed: confirmed active sessions, revision conflicts, same-request retries, key allowlist, server DCA/sales, verified imported opening costs, forged-basis rejection, immutable ledger, rollback and revoked-session denial.');
    console.log('Portfolio foundation passed: real PostgreSQL migration, 7 private tables, ownership RLS, guest/anonymous denial, denied direct mutations, numeric precision, composite FKs, sold ledger, request uniqueness, cascades, key safety and session cancellation. Supabase Auth/network/live deployment remain untested.');
} finally { await db.close(); }
