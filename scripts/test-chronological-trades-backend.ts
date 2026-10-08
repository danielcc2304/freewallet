import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {calculatePortfolioResults} from '../src/services/portfolioResults';

const db=new PGlite();
const owner='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222';
const migration=(name:string)=>readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(n=>n.endsWith('_'+name+'.sql')),'utf8');
const asset={id:'test',symbol:'TEST',name:'Synthetic',type:'stock' as const,quantity:20,purchasePrice:150,purchaseDate:'2026-01-01',currency:'EUR'};
const trade=(id:string,date:string,type:string,quantity:number,price:number)=>({id,date,type,quantity,price,total:quantity*price,createdAt:date+'T12:00:00Z',assetId:'test',assetSymbol:'TEST',assetName:'Synthetic',assetType:'stock',provenance:'trade'});
const first=trade('first','2026-01-01','buy',10,100),second=trade('second','2026-02-01','buy',10,200);
const data=(assets:unknown[],transactions:unknown[])=>({freewallet_portfolio_v1:JSON.stringify({version:1,assets,transactions})});
const commit=async(revision:number,mode:string,value:unknown,id=crypto.randomUUID())=>{
    const r=await db.query<{result:{revision:number;data:Record<string,string>}}>('select public.commit_portfolio($1,$2,$3,$4) result',[revision,id,mode,value]);
    return {revision:r.rows[0].result.revision,state:JSON.parse(r.rows[0].result.data.freewallet_portfolio_v1)};
};
const rejected=async(revision:number,value:unknown)=>{
    await assert.rejects(commit(revision,'save',value),(e:unknown)=>typeof e==='object' && e!==null && 'code' in e && e.code==='22023');
    assert.equal((await db.query<{result:{revision:number}}>('select public.read_portfolio() result')).rows[0].result.revision,revision);
};
const near=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
try {
    await db.exec(`create role anon;create role authenticated;create schema auth;
        create table auth.users(id uuid primary key,email_confirmed_at timestamptz default now(),is_anonymous boolean default false);
        create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade);
        create table auth.mfa_factors(id uuid primary key,user_id uuid,status text);
        create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
        create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
        grant usage on schema auth,public to anon,authenticated;
        insert into auth.users(id) values('${owner}');insert into auth.sessions values('${session}','${owner}');`);
    for(const name of ['portfolio_foundation','portfolio_commands','portfolio_mfa_guard','portfolio_command_validation','portfolio_opening_basis','portfolio_delta_commands','portfolio_chronological_trades'])await db.exec(migration(name));
    for(const role of ['anon','authenticated'])assert.equal((await db.query<{v:boolean}>("select has_function_privilege($1,'portfolio_private.replay_trade_position(jsonb,jsonb,jsonb)','EXECUTE') v",[role])).rows[0].v,false);
    await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${owner}',false);select set_config('request.jwt.claims','{"session_id":"${session}"}',false)`);
    const unrelated={...asset,id:'other',symbol:'OTHER',name:'Other position',quantity:1,purchasePrice:10};
    const otherTrade={...first,id:'other-buy',assetId:unrelated.id,assetSymbol:unrelated.symbol,assetName:unrelated.name,quantity:1,price:10,total:10};
    let saved=await commit(-1,'import',data([asset,unrelated],[first,second,otherTrade]));
    const early=trade('early','2025-12-31','sell',5,120),excess=trade('excess','2026-01-15','sell',11,120);
    await rejected(saved.revision,data([{...asset,quantity:15},unrelated],[early,first,second,otherTrade]));
    await rejected(saved.revision,data([{...asset,quantity:9},unrelated],[excess,first,second,otherTrade]));
    const sale=trade('retro-sale','2026-01-15','sell',5,120);
    const request=crypto.randomUUID();
    const payload=data([{...asset,quantity:15,purchasePrice:150},unrelated],[sale,first,second,otherTrade]);
    saved=await commit(saved.revision,'save',payload,request);
    const position=saved.state.assets.find((a:{id:string})=>a.id==='test');
    near(position.purchasePrice,2500/15);assert.equal(position.quantity,15);
    assert.deepEqual(saved.state.assets.find((a:{id:string})=>a.id==='other'),unrelated);
    near(calculatePortfolioResults(saved.state.assets.map((a:{id:string})=>({...a,currentPrice:a.id==='test'?170:10})),saved.state.transactions).realizedGain,100);
    assert.equal((await commit(1,'save',payload,request)).revision,saved.revision,'A repeated retroactive sale cannot be applied twice');
    await db.exec('reset role');
    const table=await db.query<{price:string}>("select purchase_price_eur::text price from public.portfolio_positions where user_id=$1 and id='test'",[owner]);
    await db.exec('set role authenticated');
    near(Number(table.rows[0].price),2500/15);
    assert.deepEqual(saved.state.transactions.find((t:{id:string})=>t.id==='second'),second,'Historical operations remain immutable');
    const buy=trade('retro-buy','2026-01-10','buy',5,200);
    const patch={freewallet_portfolio_v1:JSON.stringify({...saved.state,assets:saved.state.assets.map((a:{id:string})=>a.id==='test'?{...a,quantity:20,purchasePrice:175}:a),transactions:[buy,...saved.state.transactions]})};
    const patched=await db.query<{result:{revision:number;data:Record<string,string>}}>("select public.patch_portfolio($1,gen_random_uuid(),$2,'{}') result",[saved.revision,patch]);
    const after=JSON.parse(patched.rows[0].result.data.freewallet_portfolio_v1);
    near(after.assets.find((a:{id:string})=>a.id==='test').purchasePrice,1000/6);
    near(calculatePortfolioResults(after.assets,after.transactions).realizedGain,-200/3);
    assert.equal(after.transactions.length,5);
    // A legacy manual correction cannot serve as a guessed dated opening basis.
    const edit={...first,id:'manual',type:'edit',quantity:20,price:150,total:3000};
    await db.exec('reset role');
    await db.query('delete from auth.users where id=$1',[owner]);
    await db.exec(`insert into auth.users(id) values('${owner}');insert into auth.sessions values('${session}','${owner}');set role authenticated;`);
    saved=await commit(-1,'import',data([asset],[first,second,edit]));
    await rejected(saved.revision,data([{...asset,quantity:15}],[sale,first,second,edit]));
    console.log('Chronological PostgreSQL commands passed: backdated sales/buys, dated ownership, atomic rollback, exact retries, private helper, canonical table/document costs, immutable history, unrelated positions and incremental RPC parity.');
}finally{await db.close();}
