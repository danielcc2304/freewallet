import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import puppeteer from 'puppeteer';
import type {Page} from 'puppeteer';
import {PGlite} from '@electric-sql/pglite';

// Isolated Chromium profiles + mocked Auth transport + actual local PostgreSQL.
// No credentials, portfolio fixtures or writes reach the production project.
const db=new PGlite();
const users=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'];
const sessions=['33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444'];
const errors:string[]=[];
const localPortfolio={version:1,assets:[{id:'fixture',symbol:'TEST',name:'Synthetic UI asset',type:'stock',quantity:3,purchasePrice:10,purchaseDate:'2026-01-01',currency:'EUR'}],transactions:[]};
if(process.env.FREEWALLET_REFERENCE_FILE){
    const source=readFileSync(process.env.FREEWALLET_REFERENCE_FILE,'utf8');
    localPortfolio.assets=[...source.matchAll(/\['([^']+)', '(fund|stock|crypto)', ([\d.]+), ([\d.]+)\]/g)].map(row=>({id:row[1],symbol:row[1],name:row[1],type:row[2],quantity:Number(row[3]),purchasePrice:Number(row[4]),purchaseDate:'2026-01-01',currency:'EUR'}));
    assert.equal(localPortfolio.assets.length,15);
}
const origin=process.env.FREEWALLET_TEST_URL??'http://127.0.0.1:5176';
assert.match(origin,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const browser=await puppeteer.launch({headless:true});
try {
    await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;
        create table auth.users(id uuid primary key,email_confirmed_at timestamptz default now(),is_anonymous boolean default false);
        create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id));
        create table auth.mfa_factors(id uuid primary key,user_id uuid references auth.users(id),status text);
        create function auth.uid() returns uuid language sql stable as $$select (current_setting('request.jwt.claims',true)::jsonb->>'sub')::uuid$$;
        create function auth.jwt() returns jsonb language sql stable as $$select current_setting('request.jwt.claims',true)::jsonb$$;
        grant usage on schema public,auth to anon,authenticated;`);
    for(let index=0;index<2;index++){await db.query('insert into auth.users(id) values ($1)',[users[index]]);await db.query('insert into auth.sessions values ($1,$2)',[sessions[index],users[index]]);}
    for(const suffix of ['portfolio_foundation.sql','portfolio_commands.sql','portfolio_mfa_guard.sql','portfolio_command_validation.sql']){
        const migration=readdirSync('supabase/migrations').find(name=>name.endsWith(suffix));assert.ok(migration);
        await db.exec(readFileSync(`supabase/migrations/${migration}`,'utf8'));
    }
    const prepare=async(index:number):Promise<Page>=>{
        const context=await browser.createBrowserContext();const page=await context.newPage();await page.setViewport({width:1440,height:1000});
        const user={id:users[index],aud:'authenticated',role:'authenticated',email:`ui-${index}@example.invalid`,email_confirmed_at:new Date().toISOString(),is_anonymous:false,app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:new Date().toISOString()};
        const jwt=`${btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))}.${btoa(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,session_id:sessions[index],role:'authenticated'}))}.synthetic-test-only`;
        await page.evaluateOnNewDocument((auth,portfolio)=>{
            localStorage.setItem('freewallet-news-auth',JSON.stringify(auth));
            localStorage.setItem('freewallet_portfolio_v1',JSON.stringify(portfolio));
            localStorage.setItem('freewallet_settings','{"apiEnabled":false}');
            localStorage.setItem('freewallet_last_seen_version','5.3.13');
        },{access_token:jwt,refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user},localPortfolio);
        page.on('pageerror',error=>errors.push(String(error)));
        await page.setRequestInterception(true);
        page.on('request',request=>{void(async()=>{
            const url=new URL(request.url());
            if(url.hostname.endsWith('.supabase.co')){
                const headers={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS',
                    'access-control-allow-headers':request.headers()['access-control-request-headers']??'*'};
                if(request.method()==='OPTIONS'){await request.respond({status:204,headers});return;}
                if(url.pathname.startsWith('/rest/v1/rpc/')){
                    const token=request.headers().authorization?.replace(/^Bearer /,'');assert.ok(token);
                    const claims=JSON.parse(atob(token.split('.')[1]));assert.equal(claims.sub,user.id,'Request must pin the scoped account token');
                }
                let data:unknown=null;let status=200;
                if(url.pathname==='/auth/v1/user')data=user;
                else if(url.pathname.startsWith('/rest/v1/rpc/')){
                    const args=JSON.parse(request.postData()??'{}');
                    try{data=await db.transaction(async(tx)=>{
                        await tx.query(`select set_config('request.jwt.claims',$1,true)`,[JSON.stringify({sub:user.id,session_id:sessions[index]})]);
                        await tx.exec('set local role authenticated');
                        const query=url.pathname.endsWith('read_portfolio')
                            ? await tx.query<{result:unknown}>('select public.read_portfolio($1) as result',[args.known_revision])
                            : await tx.query<{result:unknown}>('select public.commit_portfolio($1,$2,$3,$4) as result',[args.expected_revision,args.request_id,args.mode,args.data]);
                        return query.rows[0].result;
                    });}catch(error){console.error('Local fixture RPC:',url.pathname,String(error));status=409;data={code:typeof error==='object'&&error!==null&&'code'in error?error.code:'XX000',message:String(error)};}
                }else {status=400;data={message:'Unsupported test endpoint'};}
                await request.respond({status,contentType:'application/json',body:JSON.stringify(data),headers});
            }else if(url.origin===origin||url.protocol==='data:'||url.protocol==='blob:')await request.continue();
            else await request.abort();
        })().catch(error=>errors.push(String(error)));});
        await page.goto(`${origin}/account`,{waitUntil:'networkidle2'});
        try{await page.waitForFunction(()=>document.body.innerText.includes('Sin cartera importada'));}
        catch(error){console.error('Fixture account did not load:',await page.evaluate(()=>document.body.innerText),errors);throw error;}
        return page;
    };
    const a=await prepare(0);const b=await prepare(1);
    const click=async(page:Page,text:string)=>{const button=await page.$(`button::-p-text(${text})`);assert.ok(button,`Missing ${text}`);await button.click();};
    await click(a,'Revisar datos de este navegador');
    await a.waitForFunction(count=>document.body.innerText.includes(`${count} posiciones`),{},localPortfolio.assets.length);
    assert.equal(await a.$eval('button::-p-text(Confirmar importación)',element=>(element as HTMLButtonElement).disabled),true);
    await a.click('input[type="checkbox"]');await click(a,'Confirmar importación');
    await a.waitForFunction(()=>document.body.innerText.includes('Guardado en tu cuenta'));
    assert.ok(await b.$('button::-p-text(Empezar una cartera vacía)'),'Other account must remain empty');
    await a.goto(`${origin}/`,{waitUntil:'networkidle2'});
    await a.waitForFunction(()=>document.body.innerText.includes('Mis Activos'));
    await a.goto(`${origin}/portfolio-csv`,{waitUntil:'networkidle2'});
    await a.waitForFunction(()=>document.body.innerText.includes('Análisis de cartera'));
    await a.goto(`${origin}/account`,{waitUntil:'networkidle2'});
    await a.waitForFunction(()=>document.body.innerText.includes('Guardado en tu cuenta'));
    assert.equal(await a.$('button::-p-text(Confirmar importación)'),null,'Existing cloud portfolio cannot be overwritten via import');
    const data=await db.query<{data:Record<string,string>}>('select data from portfolio_private.documents where user_id=$1',[users[0]]);
    const roundTrip=JSON.parse(data.rows[0].data.freewallet_portfolio_v1);
    for(const asset of localPortfolio.assets){const stored=roundTrip.assets.find((item:{id:string})=>item.id===asset.id);assert.equal(stored.quantity,asset.quantity);assert.equal(stored.purchasePrice,asset.purchasePrice);}
    await a.setViewport({width:390,height:844});await a.reload({waitUntil:'networkidle2'});
    assert.ok(await a.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Account must fit mobile');
    assert.deepEqual(errors,[],'Frontend must not throw errors');
    console.log(`UI passed: isolated accounts, scoped Authorization, explicit preview/confirmation, ${localPortfolio.assets.length} position quantities/costs preserved, Dashboard/Portfolio, reload, no replacement import and mobile fit. Auth is mocked; production transport receives nothing.`);
}finally{await browser.close();await db.close();}
