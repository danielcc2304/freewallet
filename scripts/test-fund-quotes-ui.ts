import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import puppeteer from 'puppeteer';

const origin=process.env.FREEWALLET_TEST_URL||'http://127.0.0.1:5192';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const now=new Date(),today=now.toISOString().slice(0,10),yesterday=new Date(+now-86400000).toISOString().slice(0,10);
const owner='11111111-1111-4111-8111-111111111111',isin='IE00BYX5NX33';
const user={id:owner,aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',email_confirmed_at:now.toISOString(),is_anonymous:false,app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:now.toISOString()};
const token=`header.${btoa(JSON.stringify({sub:owner,exp:Math.floor(Date.now()/1000)+3600,session_id:'33333333-3333-4333-8333-333333333333',role:'authenticated'}))}.fixture`;
const asset={id:'fund',symbol:isin,isin,name:'Fidelity fixture',type:'fund',quantity:2,purchasePrice:5,purchaseDate:yesterday,currency:'EUR'};
const price={instrument:isin,quoted_at:yesterday+'T00:00:00Z',checked_at:now.toISOString(),price_eur:11,previous_close_eur:10,
    original_price:11,original_currency:'EUR',original_unit:'EUR',unit_scale:1,fx_rate:1,fx_at:null,source:'Finect'};
const data={benchmark:{isin,name:'Fidelity MSCI World ACC EUR'},prices:[price],snapshots:[],lastRun:{startedAt:now.toISOString(),finishedAt:now.toISOString(),status:'success',failures:[]}};
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const errors:string[]=[];let manualReads=0;
try {
    const page=await browser.newPage();page.on('pageerror',error=>errors.push(String(error)));
    await page.setViewport({width:390,height:844});
    await page.evaluateOnNewDocument((auth,version)=>{
        localStorage.setItem('freewallet-news-auth',JSON.stringify(auth));localStorage.setItem('freewallet_last_seen_version',version);
        localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
    },{access_token:token,refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user},version);
    await page.setRequestInterception(true);
    page.on('request',request=>{void(async()=>{
        const url=new URL(request.url());
        if(url.hostname.endsWith('.supabase.co')) {
            const headers={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'*'};
            if(request.method()==='OPTIONS'){await request.respond({status:204,headers});return;}
            let result:unknown;
            if(url.pathname==='/auth/v1/user')result=user;
            else if(url.pathname.endsWith('/read_portfolio'))result={revision:0,data:{freewallet_portfolio_v1:JSON.stringify({version:1,assets:[asset],transactions:[]}),freewallet_settings:'{"apiEnabled":true}'}};
            else if(url.pathname.endsWith('/read_daily_market_data_v2'))result=data;
            else if(url.pathname==='/functions/v1/fund-quote') {
                assert.equal(request.headers().authorization,`Bearer ${token}`);assert.deepEqual(JSON.parse(request.postData()!),{isin});manualReads++;
                result={quote:{...price,quoted_at:today+'T00:00:00Z',price_eur:12,previous_close_eur:11,original_price:12,source:'Yahoo Finance'},cached:false};
            } else if(url.pathname.endsWith('/patch_portfolio')) {const body=JSON.parse(request.postData()!);result={revision:1,data:body.changes,removed:body.removed,patch:true};}
            else {await request.respond({status:404,headers,body:'{}'});return;}
            await request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify(result)});
        } else if(url.origin===origin||['data:','blob:'].includes(url.protocol))await request.continue();
        else await request.abort();
    })().catch(error=>{errors.push(String(error));if(!request.isInterceptResolutionHandled())void request.abort();});});
    await page.goto(origin,{waitUntil:'networkidle2'});
    await page.waitForFunction(()=>document.querySelector('.assets-table')?.textContent?.includes('22,00'));
    assert.equal(manualReads,0,'Background fund refresh uses the central batch quote');
    await page.click('.dashboard__floating-refresh');
    await page.waitForFunction(()=>document.querySelector('.assets-table')?.textContent?.includes('24,00'));
    assert.equal(manualReads,1,'Manual refresh queries the signed-in multi-source endpoint');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile layout remains within the viewport');
    assert.deepEqual(errors,[]);
    console.log('Fund quote UI: automatic batch preference, signed manual refresh, fresher NAV valuation and mobile layout passed.');
}finally{await browser.close();}
