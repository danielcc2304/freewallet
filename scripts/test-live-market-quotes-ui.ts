import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import puppeteer from 'puppeteer';

const origin=process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5196';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const base=Date.parse('2026-10-08T11:35:00Z');
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const assets=[
    {id:'nextil',symbol:'NXTE.XD',isin:'ES0126962069',name:'Nextil',type:'stock'},
    {id:'amper',symbol:'AMP.MC',name:'Amper',type:'stock'},
    {id:'btc',symbol:'BTC-EUR',name:'Bitcoin',type:'crypto'},
].map(a=>({...a,quantity:1,purchasePrice:1,purchaseDate:'2026-01-01',currency:'EUR'}));
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
let round=0,quoteCalls=0,oldResponses=false;
const errors:string[]=[];
try {
    const page=await browser.newPage();page.on('pageerror',e=>errors.push(String(e)));
    await page.setViewport({width:390,height:900});
    await page.evaluateOnNewDocument(`{
        window.__quoteNow=${base};window.__quoteTimers=[];window.__quoteVisible=true;
        Date=new Proxy(Date,{construct(t,a){return Reflect.construct(t,a.length?a:[window.__quoteNow]);},get(t,k){return k==='now'?()=>window.__quoteNow:Reflect.get(t,k);}});
        const realInterval=window.setInterval.bind(window);
        window.setInterval=(fn,ms,...args)=>{if(ms===60000)window.__quoteTimers.push(fn);return realInterval(fn,ms,...args);};
        Object.defineProperty(document,'visibilityState',{get:()=>window.__quoteVisible?'visible':'hidden'});
    }`);
    await page.evaluateOnNewDocument((assets,version)=>{
        localStorage.setItem('freewallet_portfolio_v1',JSON.stringify({version:1,assets,transactions:[]}));
        localStorage.setItem('freewallet_settings','{"apiEnabled":true}');
        localStorage.setItem('freewallet_last_seen_version',version);localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
    },assets,version);
    await page.setRequestInterception(true);
    page.on('request',request=>{void(async()=>{
        const url=new URL(request.url()),at=oldResponses ? base/1000-3600 : base/1000+round*61;
        const reply=(body:unknown)=>request.respond({status:200,contentType:'application/json',body:JSON.stringify(body)});
        if(url.pathname.startsWith('/__market/google/')){
            quoteCalls++;
            const listing=decodeURIComponent(url.pathname.split('/').at(-1)!);
            const [ticker,exchange]=listing.split(':');
            const record=['/g/fixture',[ticker,exchange],ticker==='NXT'?'Nueva Expresion Textil SA':'Amper SA',0,'EUR',[1.04+round*.01,0,0],null,1,null,'ES',null,[at-2]];
            await request.respond({status:200,contentType:'text/html',body:`<script>AF_initDataCallback({key: 'ds:8', hash: '1', data:${JSON.stringify([record])}, sideChannel: {}});</script>`});
        }else if(url.pathname.includes('/coingecko/')){
            quoteCalls++;await reply({bitcoin:{eur:200+round,last_updated_at:at-3}});
        }else if(url.pathname.includes('/finance/chart/')){
            const symbol=decodeURIComponent(url.pathname.split('/').at(-1)!);
            if(url.searchParams.get('interval')==='1m')quoteCalls++;
            const daily=url.searchParams.get('interval')!=='1m';
            const previousDay=Math.floor(base/86400000)*86400-86400;
            await reply({chart:{result:[{meta:{symbol,regularMarketPrice:1,regularMarketTime:base/1000-1800,currency:'EUR',exchangeName:'MCE',regularMarketPreviousClose:1},timestamp:daily?[previousDay,at]:[at],indicators:{quote:[{close:daily?[100,200+round]:[1],open:[1],high:[1],low:[1],volume:[0]}]}}],error:null}});
        }else if(url.pathname.startsWith('/__market/') || url.hostname.endsWith('supabase.co') || ['www.alphavantage.co','finnhub.io'].includes(url.hostname))await request.abort();
        else if(url.origin===origin||['data:','blob:'].includes(url.protocol))await request.continue();else await request.abort();
    })().catch(e=>errors.push(String(e)));});
    await page.goto(origin,{waitUntil:'networkidle2'});
    const prices=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('freewallet_portfolio_v1')!).assets.map((a:{currentPrice:number})=>a.currentPrice));
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('freewallet_portfolio_v1')!).assets.every((a:{currentPrice:number})=>a.currentPrice>1));
    assert.deepEqual(await prices(),[1.04,1.04,200],'Primary BME, stale-Yahoo same-venue alternative and crypto CoinGecko');
    await page.$$eval('.assets-table__table tbody tr',rows=>(rows.find(row=>row.textContent?.includes('Nextil')) as HTMLElement).click());
    await page.waitForSelector('.asset-detail__quote-market select');
    assert.equal(await page.$eval('.asset-detail__quote-market select',el=>(el as HTMLSelectElement).value),'BME');
    assert.match(await page.$eval('.asset-detail',el=>el.textContent || ''),/Google Finance · Madrid\/BME/);
    await page.keyboard.press('Escape');
    round=1;
    await page.evaluate(`window.__quoteNow+=61000;window.__quoteTimers.forEach(fn=>fn());`);
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('freewallet_portfolio_v1')!).assets.find((a:{id:string})=>a.id==='btc').currentPrice===201);
    assert.deepEqual(await prices(),[1.05,1.05,201],'One-minute polls update both equities and crypto');
    const before=quoteCalls;
    await page.evaluate(`window.__quoteVisible=false;window.__quoteNow+=61000;window.__quoteTimers.forEach(fn=>fn());`);
    await new Promise(resolve=>setTimeout(resolve,200));assert.equal(quoteCalls,before,'Hidden pages must not start requests');
    await page.evaluate(`window.__quoteVisible=true;history.pushState({},'', '/academy');window.__quoteTimers.forEach(fn=>fn());`);
    await new Promise(resolve=>setTimeout(resolve,200));assert.equal(quoteCalls,before,'Outside Dashboard the minute policy is suspended');
    await page.evaluate(`history.pushState({},'', '/');document.dispatchEvent(new Event('visibilitychange'));`);
    await page.waitForFunction(()=>!document.querySelector('.dashboard__updating-banner'));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.equal(await page.$eval('.dashboard__floating-refresh',el=>el.getAttribute('aria-label')),'Consultar precios ahora');
    await page.waitForFunction(()=>!document.querySelector('.dashboard__updating-banner'));
    oldResponses=true;
    const priorCalls=quoteCalls;
    await page.click('.dashboard__floating-refresh');
    await page.waitForFunction(()=>!document.querySelector('.dashboard__updating-banner'));
    assert.ok(quoteCalls>priorCalls,'Manual refresh bypasses the alternative-source cache');
    assert.deepEqual(await prices(),[1.05,1.05,201],'Older provider responses never overwrite newer displayed prices');
    assert.deepEqual(errors,[]);
    console.log('PASS: mobile BME selection, stock/crypto fallback, real dates, minute refreshes, hidden/background pause, manual retry and no layout overflow.');
}finally{await browser.close();}
