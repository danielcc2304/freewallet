import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import puppeteer from 'puppeteer';

const origin=process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5192';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const now=Date.now(),midnight=Math.floor(now/86400000)*86400;
const quotedAt=new Date(now-1000).toISOString();
const assets=[
    {id:'btc',symbol:'BTC-USD',name:'Bitcoin fixture',quantity:0.5,current:110,previous:100,currency:'USD'},
    {id:'rose',symbol:'ROSE-USD',name:'Oasis fixture',quantity:1000,current:0.007,previous:0.008373,currency:'USD'},
    {id:'bch',symbol:'BCH-EUR',name:'Bitcoin Cash fixture',quantity:2,current:110,previous:100,currency:'EUR'},
];
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const errors:string[]=[];
try {
    for(const scenario of ['available','missing-day','unavailable','wrong-instrument']) {
        const page=await browser.newPage();page.on('pageerror',error=>errors.push(String(error)));
        await page.setViewport({width:390,height:844});
        await page.evaluateOnNewDocument((items,version)=>{
            localStorage.setItem('freewallet_portfolio_v1',JSON.stringify({version:1,assets:items.map(a=>({id:a.id,symbol:a.symbol,name:a.name,type:'crypto',quantity:a.quantity,purchasePrice:a.current/2,purchaseDate:'2026-01-01',currency:'EUR'})),transactions:[]}));
            localStorage.setItem('freewallet_settings','{"apiEnabled":true}');localStorage.setItem('freewallet_last_seen_version',version);
            localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
        },assets,version);
        let companySearches=0;
        await page.setRequestInterception(true);
        page.on('request',request=>{void(async()=>{
            const url=new URL(request.url());
            if(url.pathname.includes('/finance/chart/')) {
                const symbol=decodeURIComponent(url.pathname.split('/chart/')[1]);
                const fx=symbol==='USDEUR=X',fixture=assets.find(a=>a.symbol===symbol);
                assert.ok(fx||fixture,`Unexpected isolated instrument: ${symbol}`);
                const daily=url.searchParams.get('interval')==='1d';
                if(daily&&!fx&&scenario==='unavailable') {await request.respond({status:503,body:'Isolated history unavailable'});return;}
                const current=fx?0.9:fixture!.current,previous=fx?0.8:fixture!.previous;
                const payload={chart:{result:[{
                    meta:{symbol:daily&&!fx&&scenario==='wrong-instrument'?'DOGE-USD':symbol,currency:fx?'EUR':fixture!.currency,instrumentType:fx?'CURRENCY':'CRYPTOCURRENCY',regularMarketTime:Math.floor(Date.parse(quotedAt)/1000),regularMarketPrice:current,previousClose:previous*0.999},
                    timestamp:daily?[midnight-(!fx&&scenario==='missing-day'?2:1)*86400,midnight]:[Math.floor(Date.parse(quotedAt)/1000)],
                    indicators:{quote:[{close:daily?[previous,current]:[current]}]},
                }]}};
                await request.respond({status:200,contentType:'application/json',body:JSON.stringify(payload)});
            } else if(url.pathname.includes('/finance/search')) {
                companySearches++;await request.respond({status:200,contentType:'application/json',body:'{"quotes":[]}'});
            } else if(url.origin===origin||['data:','blob:'].includes(url.protocol))await request.continue();
            else await request.abort();
        })().catch(error=>{errors.push(String(error));if(!request.isInterceptResolutionHandled())void request.abort();});});
        await page.goto(origin,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>[...document.querySelectorAll('.assets-table tbody tr')].length===3 && !document.querySelector('.assets-table')?.textContent?.includes('sin cotización válida'));
        for(const fixture of assets) {
            const actual=await page.$$eval('.assets-table tbody tr',(rows,symbol)=>{
                const row=rows.find(row=>row.querySelector('.assets-table__symbol')?.textContent===symbol)!;
                return {variation:row.querySelector('.assets-table__today strong')?.textContent,change:row.querySelector('.assets-table__today small')?.textContent,value:row.querySelector('.assets-table__value')?.textContent,text:row.textContent};
            },fixture.symbol);
            const price=fixture.current*(fixture.currency==='EUR'?1:0.9);
            const value=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(price*fixture.quantity);
            assert.equal(actual.value?.trim(),value,`${scenario}/${fixture.symbol} must retain its valid EUR valuation`);
            if(scenario==='available') {
                const previous=fixture.previous*(fixture.currency==='EUR'?1:0.8);
                const percent=(price/previous-1)*100;
                assert.equal(actual.variation,`${percent>0?'+':''}${percent.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})}%`);
                const change=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format((price-previous)*fixture.quantity);
                assert.equal(actual.change,change,'Position impact must include its units and dated FX');
            } else assert.equal(actual.variation,'N/D','Missing or wrong historical observations cannot fabricate a daily change');
        }
        assert.equal(companySearches,0,'Exact crypto pairs must not wait for company searches');
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile Dashboard fits the viewport');
        await page.close();
    }
    assert.deepEqual(errors,[]);
    console.log('Crypto UI passed: BTC/Oasis USD and BCH EUR, metadata mismatch, yesterday UTC close with dated FX, unit impact, exact identities and valid prices when history fails.');
} finally {await browser.close();}
