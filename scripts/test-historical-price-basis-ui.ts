import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import puppeteer from 'puppeteer';

const origin=process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5177';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const stamp=new Date().toISOString();
const asset={id:'synthetic',symbol:'UNH',name:'Synthetic dividend-paying company',type:'stock',quantity:10,
    purchasePrice:90,currentPrice:89.1,purchaseDate:'2026-09-08',currency:'EUR',quotedAt:stamp,lastCheckedAt:stamp};
const fundIsin='IE00BYX5NX33',fundSymbol='0P0001CLDK.F';
// A one-dollar dividend changes the price from 100 to 99. Its adjusted series
// stays flat, but that series cannot value the ten shares recorded in the ledger.
const candles=(symbol:string,currency:string,close:unknown[],adjusted?:number[])=>({chart:{result:[{
    meta:{symbol,currency,chartPreviousClose:100},
    timestamp:close.map((_,i)=>Date.parse(`2026-09-${String(8+i).padStart(2,'0')}T13:30:00Z`)/1000),
    events:{dividends:{fixture:{date:Date.parse('2026-09-09T13:30:00Z')/1000,amount:1}}},
    indicators:{quote:[{open:close,high:close,low:close,close,volume:close.map(()=>100)}],
        ...(adjusted?{adjclose:[{adjclose:adjusted}]}:{})},
}]}});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const errors:string[]=[];
try {
    const page=await browser.newPage();
    page.on('pageerror',e=>errors.push(String(e)));
    await page.setViewport({width:1280,height:900});
    await page.evaluateOnNewDocument((asset,version)=>{
        localStorage.setItem('freewallet_portfolio_v1',JSON.stringify({version:1,assets:[asset],transactions:[]}));
        localStorage.setItem('freewallet_settings','{"apiEnabled":true}');
        localStorage.setItem('freewallet_last_seen_version',version);
        localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
    },asset,version);
    await page.setRequestInterception(true);
    page.on('request',r=>{void(async()=>{
        const url=new URL(r.url());
        if(url.pathname.includes('/finance/search')) {
            const isin=url.searchParams.get('q');
            await r.respond({status:200,contentType:'application/json',body:JSON.stringify({quotes:isin===fundIsin
                ?[{symbol:fundSymbol,quoteType:'MUTUALFUND',isin:fundIsin,longname:'Fidelity MSCI World Index EUR P Acc'}]:[]})});return;
        }
        if(url.pathname.includes('/finance/chart/')) {
            const symbol=decodeURIComponent(url.pathname.split('/').at(-1)!);
            let response:unknown;
            if(symbol==='UNH')response=candles(symbol,'USD',[100,99],[99,99]);
            else if(symbol==='MISSING')response=candles(symbol,'EUR',[null,0,-1,99],[98,98,98,99]);
            else if(symbol==='ADJUSTED_ONLY') {
                const data=candles(symbol,'EUR',[100,99],[99,99]);
                data.chart.result[0].indicators.quote=[];response=data;
            }
            else if(symbol==='PENCE.L')response=candles(symbol,'GBp',[100,99],[90,90]);
            else if(symbol==='USDEUR=X')response=candles(symbol,'EUR',[.9,.9],[.8,.8]);
            else if(symbol==='BTC-EUR')response=candles(symbol,'EUR',[100,99],[90,90]);
            else if(symbol===fundSymbol)response=candles(symbol,'EUR',[100,101]);
            else response={chart:{result:[]}};
            await r.respond({status:200,contentType:'application/json',body:JSON.stringify(response)});return;
        }
        if(url.pathname.startsWith('/__market') || url.pathname.startsWith('/__finect')) {
            await r.respond({status:200,contentType:'application/json',body:'{}'});return;
        }
        if(url.origin===origin || ['data:','blob:'].includes(url.protocol))await r.continue();else await r.abort();
    })().catch(e=>{errors.push(String(e));if(!r.isInterceptResolutionHandled())void r.abort();});});
    await page.goto(origin,{waitUntil:'networkidle2'});
    const result=await page.evaluate(async(asset,fundIsin)=>{
        const {getAssetChartData}=await import('/src/services/apiService.ts');
        const {convertHistoryToCurrency}=await import('/src/services/assetValuation.ts');
        const {createMarketPortfolioHistory,normalizePortfolioTransactions,performanceSeries}=await import('/src/services/portfolioPerformance.ts');
        const prices=await getAssetChartData('UNH','1M');
        const fx=await getAssetChartData('USDEUR=X','1M');
        const history=createMarketPortfolioHistory([asset],[],new Map([[asset.id,convertHistoryToCurrency(prices,fx)]]));
        const series=performanceSeries(history,normalizePortfolioTransactions([asset],[]),[asset]);
        const variants=Object.fromEntries(await Promise.all(['MISSING','ADJUSTED_ONLY','PENCE.L','BTC-EUR',fundIsin]
            .map(async symbol=>[symbol,await getAssetChartData(symbol,'1M')])));
        return {prices,fx,history,series,variants};
    },asset,fundIsin);
    assert.deepEqual(result.prices.map(p=>p.close),[100,99],'Share valuation must use closes, not dividend-adjusted total-return prices');
    assert.equal(result.history.length,2);
    for(const [i,value] of [900,891].entries())assert.ok(Math.abs(result.history[i].value-value)<1e-8,
        'Historical EUR valuations agree with actual shares and dated FX');
    assert.ok(Math.abs(result.series[1].dailyReturn!+1)<1e-8,'Price decline must not disappear because Yahoo reinvests a dividend');
    assert.deepEqual(result.variants.MISSING.map(p=>p.close),[99],'Missing or invalid closes are not replaced by adjusted prices');
    assert.deepEqual(result.variants.ADJUSTED_ONLY,[],'An adjusted-only response cannot provide a historical valuation');
    assert.deepEqual(result.variants['PENCE.L'].map(p=>p.close),[1,.99]);
    assert.ok(result.variants['PENCE.L'].every(p=>p.currency==='GBP'));
    assert.deepEqual(result.fx.map(p=>p.close),[.9,.9]);
    assert.deepEqual(result.variants['BTC-EUR'].map(p=>p.close),[100,99]);
    assert.deepEqual(result.variants[fundIsin].map(p=>p.close),[100,101],'Unadjusted fund NAV histories remain available');
    await page.$$eval('.assets-table__table tbody tr',rows=>(rows.find(row=>row.textContent?.includes('UNH')) as HTMLElement).click());
    await page.waitForSelector('.asset-detail__chart-container .recharts-wrapper');
    const performance=await page.$eval('.asset-detail__period-performance',el=>el.textContent || '');
    assert.match(performance,/Variación del precio 1M/);
    assert.match(performance,/-1\.00%/,'The detail chart displays price variation, not an implicit dividend reinvestment');
    assert.doesNotMatch(performance,/Rentabilidad/);
    for(const width of [390,1280]) {
        await page.setViewport({width,height:900});
        assert.ok(await page.$eval('.asset-detail',el=>el.scrollWidth<=el.clientWidth));
    }
    assert.deepEqual(errors,[]);
    console.log('Historical price basis passed: dividend-paying stock, EUR valuation and returns, unavailable raw closes, pence, FX, crypto, fund NAVs and desktop/mobile price chart.');
}finally{await browser.close();}
