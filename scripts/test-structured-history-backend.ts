import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {importHistoryArchive} from '../src/services/imports/portfolioHistoryImport';
import {historicalBundle,validateHistoryArchive} from '../src/services/portfolioHistoryArchive';
import {performanceSeries,selectPortfolioPeriod} from '../src/services/portfolioPerformance';

const db=new PGlite();
const owner='11111111-1111-4111-8111-111111111111',other='33333333-3333-4333-8333-333333333333',session='22222222-2222-4222-8222-222222222222';
const migration=(name:string)=>readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(n=>n.endsWith('_'+name+'.sql')),'utf8');
const source={evolution:'Mes,Valor Total,Capital Inicial,Capital Aportado\n2025 Dic,1000,1000,0\n2026 Ene,1050,1000,0\n2026 Feb,1160,1000,100',daily:'',movements:'',comparison:'Año,Mes,Periodo,Rentabilidad Cartera (%),Rentabilidad MSCI World (%),Cartera Acum (%),MSCI Acum (%)\n2025,Dic,2025 Dic,0,0,0,0\n2026,Ene,2026 Ene,5,2,5,2\n2026,Feb,2026 Feb,1,3,6,5',advanced:'',label:'synthetic.xlsx'};
const archive=importHistoryArchive(source);archive.linkedAssetIds=['position'];
const assets=[{id:'position',symbol:'TEST',name:'Synthetic',type:'stock',quantity:1,purchasePrice:1000,purchaseDate:'2025-12-31',currency:'EUR'}];
const backup={freewallet_portfolio_v1:JSON.stringify({version:1,assets,transactions:[]}),freewallet_history_archive_v1:JSON.stringify(archive)};
const read=async()=> (await db.query<{v:{revision:number;archive:unknown}}>('select public.read_portfolio_history() v')).rows[0].v;
const upsert=async(revision:number,events:unknown,id=crypto.randomUUID())=>(await db.query<{v:{revision:number;archive:unknown}}>('select public.upsert_portfolio_history($1,$2,$3) v',[revision,id,events])).rows[0].v;
const expectCode=async(task:Promise<unknown>,code:string)=>assert.rejects(task,e=>typeof e==='object'&&e!==null&&'code' in e&&e.code===code);
try {
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create table auth.users(id uuid primary key,email_confirmed_at timestamptz default now(),is_anonymous boolean default false);
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade);
 create table auth.mfa_factors(id uuid primary key,user_id uuid,status text);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 grant usage on schema auth,public to anon,authenticated;
 insert into auth.users(id) values('${owner}'),('${other}');insert into auth.sessions values('${session}','${owner}');`);
 for(const name of ['portfolio_foundation','portfolio_commands','portfolio_mfa_guard','portfolio_command_validation','portfolio_opening_basis','portfolio_delta_commands','portfolio_chronological_trades','portfolio_structured_history','portfolio_history_event_dates'])await db.exec(migration(name));
 await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${owner}',false);select set_config('request.jwt.claims','{"session_id":"${session}"}',false)`);
 let saved=(await db.query<{v:{revision:number}}>("select public.commit_portfolio(-1,gen_random_uuid(),'import',$1) v",[backup])).rows[0].v;
 let result=await read();validateHistoryArchive(result.archive);
 const updatedAt=(result as unknown as {updatedAt:string}).updatedAt;
 const cached=(await db.query<{v:{archive:unknown;revision:number}}>('select public.read_portfolio_history($1) v',[updatedAt])).rows[0].v;
 assert.equal(cached.archive,null,'Unchanged archives return metadata instead of downloading the series again');
 assert.equal(cached.revision,result.revision);
 assert.equal(result.archive.valuations.length,3);assert.equal(result.archive.cashFlows.length,1);assert.equal(result.archive.cashFlows[0].precision,'month');
 const before=historicalBundle(archive,Date.now()),after=historicalBundle(result.archive,Date.now());
 const ytd=(bundle:typeof before)=>selectPortfolioPeriod(performanceSeries(bundle.points,bundle.flowTransactions,[],{maxGapDays:45}),'YTD',Date.parse('2026-03-01')).performance.returnPercent;
 assert.equal(ytd(after),ytd(before),'Normalized SQL storage preserves flow-adjusted YTD');
 const event={benchmarkNavs:[{date:'2026-03-02T12:00:00Z',nav:12.34,currency:'EUR',isin:'IE00BYX5NX33',source:'agent'}]};
 const id=crypto.randomUUID();result=await upsert(saved.revision,event,id);validateHistoryArchive(result.archive);
 assert.equal(result.archive.benchmarkNavs.length,1);assert.equal(result.archive.valuations.length,3);
 assert.equal((await upsert(saved.revision,event,id)).revision,result.revision,'Exact retry is idempotent');
 await expectCode(upsert(saved.revision,{...event,cashFlows:[]},id),'22023');
 await expectCode(upsert(saved.revision,event),'40001');
 const revision=result.revision;
 for(const invalid of [
  {benchmarkNavs:[{...event.benchmarkNavs[0],nav:-1}]},
  {benchmarkNavs:[{...event.benchmarkNavs[0],currency:'USD'}]},
  {benchmarkNavs:[{...event.benchmarkNavs[0],date:'2099-01-01'}]},
  {benchmarkNavs:[{...event.benchmarkNavs[0],date:'2026-13-01'}]},
  {cashFlows:[{id:'bad',date:'2026-02-15',amount:100,precision:'month',source:'agent'}]},
  {valuations:[{date:'2026-03-02',value:NaN,invested:1000,cadence:'daily'}]},
  {linkedAssetIds:['other-user']},
 ]) {await expectCode(upsert(revision,invalid),'22023');assert.equal((await read()).revision,revision,'Validation failure is atomic');}
 // A corrected NAV replaces the observation without adding a duplicate.
 result=await upsert(revision,{benchmarkNavs:[{...event.benchmarkNavs[0],nav:12.35}]});validateHistoryArchive(result.archive);
 assert.equal(result.archive.benchmarkNavs.length,1);assert.equal(result.archive.benchmarkNavs[0].nav,12.35);
 // ISO dates returned by the reader, date-only inputs and timezone offsets
 // identify the same instant and must not create a second SQL primary key.
 result=await upsert(result.revision,{benchmarkNavs:[{...result.archive.benchmarkNavs[0],date:'2026-03-02T13:00:00+01:00',nav:12.36}]});validateHistoryArchive(result.archive);
 assert.equal(result.archive.benchmarkNavs.length,1);assert.equal(result.archive.benchmarkNavs[0].nav,12.36);
 const firstValuation=result.archive.valuations[0],firstBenchmark=result.archive.benchmarkReturns[0];
 result=await upsert(result.revision,{valuations:[{...firstValuation,value:1001}],benchmarkReturns:[{...firstBenchmark,benchmarkAccumPct:0.5}]});validateHistoryArchive(result.archive);
 assert.equal(result.archive.valuations.length,3);assert.equal(result.archive.valuations[0].value,1001);
 assert.equal(result.archive.benchmarkReturns.length,3);assert.equal(result.archive.benchmarkReturns[0].benchmarkAccumPct,0.5);
 // An older full-document client cannot accidentally erase the new archive.
 saved=(await db.query<{v:{revision:number}}>("select public.commit_portfolio($1,gen_random_uuid(),'save',$2) v",[result.revision,{freewallet_portfolio_v1:backup.freewallet_portfolio_v1}])).rows[0].v;
 assert.ok((await read()).archive);
 await db.exec('reset role');
 for(const table of ['historical_archives','historical_valuations','historical_cash_flows','historical_benchmarks','history_event_receipts']){
  assert.equal((await db.query<{v:boolean}>(`select has_table_privilege('authenticated','portfolio_private.${table}','SELECT') v`)).rows[0].v,false);
 }
 assert.equal((await db.query<{v:boolean}>("select has_function_privilege('anon','public.upsert_portfolio_history(bigint,uuid,jsonb)','EXECUTE') v")).rows[0].v,false);
 await db.exec(`insert into auth.mfa_factors values(gen_random_uuid(),'${owner}','verified');set role authenticated;`);
 await expectCode(read(),'42501');
 await db.exec(`select set_config('request.jwt.claims','{"session_id":"${session}","aal":"aal2"}',false);`);
 assert.ok((await read()).archive);
 await db.exec(`select set_config('request.jwt.claim.sub','${other}',false);`);
 await expectCode(read(),'42501');
 await db.exec('reset role');
 const otherSession=crypto.randomUUID();await db.query('insert into auth.sessions values($1,$2)',[otherSession,other]);
 await db.exec(`set role authenticated;select set_config('request.jwt.claims','{"session_id":"${otherSession}"}',false);`);
 assert.equal((await read()).archive,null,'A second user cannot read the first historical archive');
 const fresh=(await db.query<{v:{revision:number}}>("select public.commit_portfolio(-1,gen_random_uuid(),'import',$1) v",[{freewallet_portfolio_v1:backup.freewallet_portfolio_v1}])).rows[0].v;
 const native=await upsert(fresh.revision,{valuations:[
  {date:'2026-10-06T18:00:00Z',value:1000,invested:1000,cadence:'daily'},
  {date:'2026-10-07T18:00:00Z',value:1010,invested:1000,cadence:'daily'},
 ]});validateHistoryArchive(native.archive);
 const nativeBundle=historicalBundle(native.archive,Date.parse('2026-10-08T20:00:00Z'));
 const nativeSeries=performanceSeries(nativeBundle.points,nativeBundle.flowTransactions);
 assert.ok(Math.abs(selectPortfolioPeriod(nativeSeries,'ALL',Date.parse('2026-10-08T20:00:00Z')).performance.returnPercent!-1)<1e-8,'Accounts without CSV use the same structured series and return engine');
 assert.equal(selectPortfolioPeriod(nativeSeries,'YTD',Date.parse('2026-10-08T20:00:00Z')).performance.returnPercent,null,'No January baseline is invented for a new account');
 console.log('PASS: native historical tables, month precision, YTD parity, authenticated agent updates, exact retries, corrections, atomic validation, legacy-client preservation, private tables, MFA and account isolation.');
}finally{await db.close();}
