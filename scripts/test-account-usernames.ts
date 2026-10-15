import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {handleUsernameLogin,type UsernameLoginDependencies} from '../supabase/functions/username-login/handler';
import {normalizeUsername,validUsername,signInWithIdentifier} from '../src/services/accountProfile';
import type {SupabaseClient} from '@supabase/supabase-js';

assert.equal(normalizeUsername(' Daniel_01 '),'daniel_01');
for(const name of ['daniel230401','a.b-c_01','ABC'])assert.ok(validUsername(name));
for(const name of ['ab','a@b','_test','with space','ábc','x'.repeat(33)] )assert.ok(!validUsername(name));

const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const C='33333333-3333-4333-8333-333333333333';
const SESSION='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const db=new PGlite();
try{
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
        create schema auth;create schema portfolio_private;
        create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',created_at timestamptz default now(),email_confirmed_at timestamptz default now(),is_anonymous boolean default false);
        create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade);
        create table auth.mfa_factors(id uuid primary key,user_id uuid,status text);
        create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
        create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
        grant usage on schema auth,public to anon,authenticated,service_role;
        insert into auth.users(id,email,created_at) values('${A}','daniel230401@example.invalid','2025-01-01'),('${B}','same@first.invalid','2025-01-02'),('${C}','same@second.invalid','2025-01-03');
        insert into auth.sessions values('${SESSION}','${A}');`);
    await db.exec(readFileSync('supabase/migrations/20261001234107_portfolio_mfa_guard.sql','utf8'));
    await db.exec(readFileSync('supabase/migrations/20261015115626_account_usernames.sql','utf8'));
    const names=await db.query<{username:string}>('select username from account_private.profiles order by user_id');
    assert.deepEqual(names.rows.map(row=>row.username),['daniel230401','same','same_2']);
    const asUser=async(aal='aal1',expected=A)=>{
        await db.exec(`reset role;set request.jwt.claim.sub='${expected}';set request.jwt.claims='${JSON.stringify({role:'authenticated',session_id:SESSION,aal})}';set role authenticated;`);
    };
    await db.exec('set role anon');
    await assert.rejects(db.exec('select * from account_private.profiles'),/permission denied/);
    await assert.rejects(db.exec('select public.my_account_profile()'),/permission denied/);
    await assert.rejects(db.exec("select public.prepare_username_login('daniel230401',repeat('a',64))"),/permission denied/);
    await asUser();
    const own=await db.query<{profile:{username:string;userId:string}}>('select public.my_account_profile() as profile');
    assert.equal(own.rows[0].profile.userId,A);assert.equal(own.rows[0].profile.username,'daniel230401');
    await assert.rejects(db.exec('select * from account_private.profiles'),/permission denied/);
    await assert.rejects(db.exec(`select public.change_my_username('newname','${B}')`),/Account changed/);
    await assert.rejects(db.exec(`select public.change_my_username('same','${A}')`),/username_taken/);
    await assert.rejects(db.exec(`select public.change_my_username('bad name','${A}')`),/invalid_username/);
    await db.exec(`reset role;insert into auth.mfa_factors values('${C}','${A}','verified')`);
    await asUser();
    await assert.rejects(db.exec(`select public.change_my_username('newname','${A}')`),/Second factor/);
    await asUser('aal2');
    await db.exec(`select public.change_my_username(' NewName ','${A}')`);
    const changed=await db.query<{profile:{username:string}}>('select public.my_account_profile() as profile');
    assert.equal(changed.rows[0].profile.username,'newname');
    await asUser('aal2',B);
    await assert.rejects(db.exec('select public.my_account_profile()'),/Active confirmed session/);
    await db.exec('reset role');
    const NEW='44444444-4444-4444-8444-444444444444';
    await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values('${NEW}','new@example.invalid','{"username":"Chosen_Name"}')`);
    const inserted=await db.query<{username:string}>(`select username from account_private.profiles where user_id='${NEW}'`);
    assert.equal(inserted.rows[0].username,'chosen_name');
    await assert.rejects(db.exec(`insert into auth.users(id,email,raw_user_meta_data) values('55555555-5555-4555-8555-555555555555','other@example.invalid','{"username":"CHOSEN_NAME"}')`),/username_taken/);
    const orphan=await db.query<{count:number}>("select count(*)::int as count from auth.users where email='other@example.invalid'");assert.equal(orphan.rows[0].count,0);
    await assert.rejects(db.exec("insert into auth.users(id,email,raw_user_meta_data) values('55555555-5555-4555-8555-555555555555','other@example.invalid','{\"username\":\"bad name\"}')"),/invalid_username/);
    // User-editable metadata cannot rename or hijack a profile.
    await db.exec(`update auth.users set raw_user_meta_data='{"username":"same"}' where id='${A}';
        set request.jwt.claims='{"role":"service_role"}';set role service_role;`);
    const prepare=async(name:string,key='a')=>(await db.query<{data:{allowed:boolean;email:string|null}}>('select public.prepare_username_login($1,$2) as data',[name,key.repeat(64)])).rows[0].data;
    assert.equal((await prepare('newname')).email,'daniel230401@example.invalid');
    assert.equal((await prepare('daniel230401')).email,null,'Old username stops resolving');
    assert.equal((await prepare('same')).email,'same@first.invalid','Metadata cannot change lookup ownership');
    for(let i=0;i<9;i++)assert.equal((await prepare('newname')).allowed,true);
    const denied=await prepare('newname');assert.equal(denied.allowed,false);assert.equal(denied.email,undefined,'Rate limit never reveals a mapped email');
    await db.exec('reset role');
    const acl=await db.query<{allowed:boolean}>("select has_function_privilege('anon','public.prepare_username_login(text,text)','execute') as allowed");assert.equal(acl.rows[0].allowed,false);
    console.log('PASS: username backfill, collisions, signup atomicity, private lookup, session/MFA guards, rename ownership and durable rate limits.');
}finally{await db.close();}

let verifies=0;let prepares=0;
const dependencies:UsernameLoginDependencies={prepare:async(name,hash)=>{prepares++;assert.match(hash,/^[a-f0-9]{64}$/);return {allowed:name!=='limited',email:name==='exists'?'private@example.invalid':null};},
    signIn:async(email,password)=>{verifies++;return email==='private@example.invalid'&&password==='correct'?{access_token:'access',refresh_token:'refresh'}:null;}};
const request=(username:string,password='correct')=>new Request('https://fixture.invalid',{method:'POST',headers:{'content-type':'application/json','x-forwarded-for':'spoofed, 192.0.2.1'},body:JSON.stringify({username,password})});
assert.equal((await handleUsernameLogin(request('EXISTS'),dependencies)).status,200);
const success=await (await handleUsernameLogin(request('exists'),dependencies)).json();assert.deepEqual(success,{access_token:'access',refresh_token:'refresh'});
const wrong=await handleUsernameLogin(request('exists','wrong'),dependencies);
const missing=await handleUsernameLogin(request('missing','wrong'),dependencies);
assert.equal(wrong.status,401);assert.equal(missing.status,401);assert.deepEqual(await wrong.json(),await missing.json());
const before=verifies;assert.equal((await handleUsernameLogin(request('limited'),dependencies)).status,429);assert.equal(verifies,before);
const beforePrepare=prepares;assert.equal((await handleUsernameLogin(request('bad@name'),dependencies)).status,401);assert.equal(prepares,beforePrepare);
assert.equal((await handleUsernameLogin(new Request('https://fixture.invalid',{method:'GET'}),dependencies)).status,405);
assert.equal((await handleUsernameLogin(new Request('https://fixture.invalid',{method:'OPTIONS'}),dependencies)).status,200);
assert.equal((await handleUsernameLogin(request('exists','x'.repeat(5000)),dependencies)).status,413);
assert.equal((await handleUsernameLogin(request('exists'),{...dependencies,prepare:async()=>{throw new Error('private internal error');}})).status,503);
console.log('PASS: password-verifying endpoint, identical invalid credentials, no email disclosure, limits, methods and errors.');

let direct=0;let edge=0;let saved=0;
const client={auth:{signInWithPassword:async({email}:{email:string})=>{direct++;assert.equal(email,'mail@example.invalid');return {data:{session:{}},error:null};},setSession:async(tokens:unknown)=>{saved++;assert.deepEqual(tokens,{access_token:'access',refresh_token:'refresh'});return {data:{session:{}},error:null};}},
    functions:{invoke:async(_name:string,{body}:{body:{username:string}})=>{edge++;assert.equal(body.username,'exists');return {data:{access_token:'access',refresh_token:'refresh'},error:null};}}} as unknown as SupabaseClient;
await signInWithIdentifier(client,' mail@example.invalid ','secret');assert.equal(direct,1);assert.equal(edge,0);
await signInWithIdentifier(client,' EXISTS ','secret');assert.equal(edge,1);assert.equal(saved,1);
console.log('PASS: client email/username routing and installation of the real Auth session.');
