import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { readFileSync } from 'node:fs';

// Every remote request is intercepted. No real account or price is used.
const origin = process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5178';
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const now = new Date(), day = now.toISOString().slice(0,10);
const yesterday = new Date(now.getTime()-86400000).toISOString().slice(0,10);
const owner = '11111111-1111-4111-8111-111111111111';
const user = { id:owner,aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',email_confirmed_at:now.toISOString(),is_anonymous:false,app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:now.toISOString() };
const token = `header.${btoa(JSON.stringify({sub:owner,exp:Math.floor(Date.now()/1000)+3600,session_id:'33333333-3333-4333-8333-333333333333',role:'authenticated'}))}.fixture`;
const asset = { id:'asset',symbol:'TEST',name:'Synthetic daily asset',type:'stock',quantity:2,purchasePrice:5,purchaseDate:yesterday,currency:'EUR' };
const providerCheckedAt = new Date(now.getTime() - 30 * 60000).toISOString();
const price = (instrument:string,date:string,value:number) => ({instrument,quoted_at:date+'T00:00:00Z',checked_at:providerCheckedAt,price_eur:value,previous_close_eur:value-1,source:'Yahoo Finance'});
const data = {
    benchmark:{isin:'IE00BYX5NX33',name:'Fidelity MSCI World ACC EUR'},
    prices:[price('TEST',yesterday,10),price('IE00BYX5NX33',yesterday,14),price('TEST',day,11),price('IE00BYX5NX33',day,14.2)],
    snapshots:[yesterday,day].map((date,i)=>({at:date+'T13:00:00Z',assets:[{...asset,currentPrice:10+i,previousClose:9+i,quotedAt:date+'T12:00:00Z',lastCheckedAt:date+'T13:00:00Z'}],transactions:[]})),
    lastRun:{startedAt:now.toISOString(),finishedAt:now.toISOString(),status:'success',failures:[]},
};
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
let reads=0, mutations=0;
const historyWrites: unknown[] = [];
const errors:string[]=[];
try {
    const page=await browser.newPage();
    page.on('pageerror',error=>errors.push(String(error)));
    await page.setViewport({width:390,height:900});
    await page.evaluateOnNewDocument((auth,version)=>{
        localStorage.setItem('freewallet-news-auth',JSON.stringify(auth));
        localStorage.setItem('freewallet_last_seen_version',version);
        localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
    },{access_token:token,refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user},version);
    await page.setRequestInterception(true);
    page.on('request',request=>{void(async()=>{
        const url=new URL(request.url());
        if(url.hostname.endsWith('.supabase.co')){
            const headers={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'*'};
            if(request.method()==='OPTIONS'){await request.respond({status:204,headers});return;}
            let result:unknown=null;
            if(url.pathname==='/auth/v1/user')result=user;
            else if(url.pathname.endsWith('read_portfolio'))result={revision:0,data:{freewallet_portfolio_v1:JSON.stringify({version:1,assets:[asset],transactions:[]}),freewallet_settings:'{"apiEnabled":true}'}};
            else if(url.pathname.endsWith('read_daily_market_data_v2')){assert.equal(request.headers().authorization,`Bearer ${token}`);reads++;result=data;}
            else if(url.pathname.endsWith('commit_portfolio')){mutations++;const body=JSON.parse(request.postData()!);if (body.data?.freewallet_history) historyWrites.push(body.data.freewallet_history);result={revision:mutations,data:body.data};}
            else {await request.respond({status:404,headers,body:'{}'});return;}
            await request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify(result)});
        } else if(url.origin===origin||url.protocol==='data:'||url.protocol==='blob:')await request.continue();
        else await request.abort();
    })().catch(error=>errors.push(String(error)));});
    await page.goto(origin,{waitUntil:'networkidle2'});
    await page.waitForFunction(()=>document.querySelector('.dashboard__automatic-status')?.textContent?.includes('Consulta automática'));
    await page.waitForFunction(()=>document.querySelector('.assets-table')?.textContent?.includes('22,00'));
    await page.$$eval('.assets-table__table tbody tr',rows => (rows[0] as HTMLElement).click());
    await page.waitForSelector('.asset-detail');
    const detailText = await page.$eval('.asset-detail',el=>el.textContent || '');
    assert.ok(detailText.includes(new Date(providerCheckedAt).toLocaleString('es-ES')), 'Shows the original provider-check time');
    assert.match(detailText,/Lectura en la app/);assert.match(detailText,/batch/);
    assert.equal(historyWrites.length,0,'Reading a batch must not create new historical valuations');
    await page.keyboard.press('Escape');
    await page.click('.portfolio-excel-insights__tabs button:nth-child(2)');
    await page.waitForSelector('.portfolio-excel-insights__panel .recharts-wrapper');
    const text=await page.$eval('.portfolio-excel-insights__panel',el=>el.textContent||'');
    assert.match(text,/Fidelity MSCI World ACC EUR/);assert.match(text,/IE00BYX5NX33/);assert.doesNotMatch(text,/URTH/);
    assert.ok(reads>0);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Mobile Dashboard must fit viewport');
    assert.deepEqual(errors,[]);
    console.log('Daily market UI passed: authenticated scoped reads, stored prices with original provider timestamps, no fabricated snapshots, daily history, exact Fidelity benchmark and mobile layout.');
} finally {await browser.close();}
