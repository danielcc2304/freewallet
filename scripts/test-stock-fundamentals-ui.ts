import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import {readFileSync} from 'node:fs';

const origin=process.env.FREEWALLET_TEST_URL||'http://127.0.0.1:5177';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const stamp=new Date().toISOString();
const assets=['AAPL','MIXED','PARTIAL','EMPTY','NXTE.XD','AMP.MC','OHLA.MC'].map(symbol=>({id:symbol,symbol,name:'Synthetic '+symbol,type:'stock',quantity:1,purchasePrice:100,currentPrice:120,currency:'EUR',purchaseDate:'2026-01-01',quotedAt:stamp,lastCheckedAt:stamp}));
const recorded=process.env.FREEWALLET_STOCK_PROVIDER_FIXTURES;
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const errors:string[]=[], requests:string[]=[];
let repaired=false;
const summary=(symbol:string)=>({quoteSummary:{result:[{price:{symbol,currency:'USD',marketCap:{raw:1e9}},defaultKeyStatistics:{trailingEps:{raw:.001234},enterpriseToEbitda:{raw:20},mostRecentQuarter:{raw:1782777600}},summaryDetail:{trailingPE:{raw:30},dividendYield:{raw:0},dividendRate:{raw:0}},financialData:{financialCurrency:symbol==='MIXED'?'EUR':'USD',ebitda:{raw:2e9},profitMargins:{raw:.125},returnOnEquity:{raw:-.2},debtToEquity:{raw:51.72}}}]}});
try {
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewport({width:1280,height:900});
 await page.evaluateOnNewDocument((assets,version)=>{
  localStorage.setItem('freewallet_portfolio_v1',JSON.stringify({version:1,assets,transactions:[]}));
  localStorage.setItem('freewallet_settings','{"apiEnabled":true}');localStorage.setItem('freewallet_last_seen_version',version);localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
 },assets,version);
 await page.setRequestInterception(true);
 page.on('request',r=>{void(async()=>{
  const url=new URL(r.url());requests.push(url.pathname);
  if(url.pathname.includes('/fundamentals-timeseries/')){
   const symbol=decodeURIComponent(url.pathname.split('/').at(-1)!);
   const target=['B02.F','AMP.MC','OHLA.MC'].includes(symbol);
   let payload:unknown={timeseries:{result:[]}};
   if(target){
    if(recorded) payload=JSON.parse(readFileSync(recorded+'/fw-stock-series-'+symbol+'.json','utf8'));
    else {
     const date=symbol==='OHLA.MC'?'2026-06-30':'2025-12-31',ebitda=symbol==='B02.F'?11808000:symbol==='AMP.MC'?48101000:204969000;
     const item=(type:string,value:number)=>({meta:{symbol:[symbol],type:[type]},[type]:[{asOfDate:date,periodType:type.startsWith('trailing')?'TTM':'3M',currencyCode:'EUR',reportedValue:{raw:value}}]});
     payload={timeseries:{result:[item('trailingEBITDA',ebitda),item('trailingDilutedEPS',-.025532),item('trailingNetIncome',10),item('trailingTotalRevenue',100),item('quarterlyTotalDebt',50),item('quarterlyStockholdersEquity',100)]}};
    }
   }
   await r.respond({status:200,contentType:'application/json',body:JSON.stringify(payload)});return;
  }
  if(url.pathname.includes('/quoteSummary/')){
   const symbol=decodeURIComponent(url.pathname.split('/').at(-1)!);
   const partial={quoteSummary:{result:[{price:{symbol,currency:'USD'},financialData:{returnOnEquity:{raw:.1}}}]}};
   await r.respond({status:['MIXED','PARTIAL'].includes(symbol)?200:401,contentType:'application/json',body:JSON.stringify(symbol==='MIXED'?summary(symbol):symbol==='PARTIAL'?partial:{finance:{error:{description:'Invalid Crumb'}}})});return;
  }
  if(url.pathname.startsWith('/__market/yahoo-site')){
   const symbol=decodeURIComponent(url.pathname.split('/')[4]);
   const payload=(symbol==='EMPTY'&&!repaired)||['NXTE.XD','AMP.MC','OHLA.MC'].includes(symbol)?{quoteResponse:{result:[]}}:summary(symbol);
   const html='<script type="application/json" data-sveltekit-fetched>'+JSON.stringify({status:200,body:JSON.stringify(payload)})+'</script>';
   await r.respond({status:200,contentType:'text/html',body:html});return;
  }
  if(url.pathname.includes('/finance/chart/')){
   const symbol=decodeURIComponent(url.pathname.split('/').at(-1)!);
   const empty=symbol==='EMPTY'&&!repaired;
   const payload=empty?{chart:{result:[]}}:{chart:{result:[{meta:{symbol,currency:'USD',regularMarketPrice:120,fiftyTwoWeekHigh:200,fiftyTwoWeekLow:80},timestamp:[1790683200,1790769600],indicators:{quote:[{close:[100,120]}]}}]}};
   await r.respond({status:200,contentType:'application/json',body:JSON.stringify(payload)});return;
  }
  if(url.pathname.startsWith('/__market')||url.pathname.startsWith('/__finect')){await r.respond({status:200,contentType:'application/json',body:'{}'});return;}
  if(url.origin===origin||url.protocol==='data:'||url.protocol==='blob:')await r.continue();else await r.abort();
 })().catch(e=>errors.push(String(e)));});
 await page.goto(origin,{waitUntil:'networkidle2'});
 const open=async(symbol:string)=>{
  await page.$$eval('.assets-table__table tbody tr',(rows,symbol)=>(rows.find(el=>el.textContent?.includes(symbol)) as HTMLElement).click(),symbol);
  await page.waitForFunction(()=>!document.querySelector('.asset-detail .metrics-loading')&&document.querySelector('.asset-detail__metrics-note'));
 };
 const cards=()=>page.$$eval('.asset-detail .metrics-grid .metric-card',els=>Object.fromEntries(els.map(el=>[el.querySelector('.metric-card__label')!.textContent,el.querySelector('.metric-card__value')!.textContent])));
 await open('AAPL');
 const apple=await cards();assert.match(apple['EBITDA (12 meses)'],/USD/);assert.match(apple['BPA (12 meses)'],/0,001234 USD/);
 assert.equal(apple['Rent. dividendo'],'0%');assert.equal(apple['Margen Beneficio'],'12,5%');assert.equal(apple['Deuda/patrimonio'],'51,72%');assert.equal(apple.ROE,'-20%');
 assert.match(apple['Max (52 sem)'],/200 USD/);assert.match(apple['Capitalización'],/USD/);
 assert.ok(requests.some(path=>path.includes('/yahoo-site/quote/AAPL/')),'401 falls back to public page');
 for(const width of [390,1280]){
  await page.setViewport({width,height:900});
  assert.ok(await page.$eval('.asset-detail',el=>el.scrollWidth<=el.clientWidth));
 }
 await(await page.$('.asset-detail__metrics-section'))!.screenshot({path:'/tmp/freewallet-stock-fundamentals.png'});
 await page.click('.modal__close');await open('MIXED');
 const mixed=await cards();assert.match(mixed['EBITDA (12 meses)'],/EUR/);assert.match(mixed['BPA (12 meses)'],/USD/);
 assert.ok(!requests.some(path=>path.includes('/yahoo-site/quote/MIXED/')),'Working JSON source does not need HTML');
 await page.click('.modal__close');await open('PARTIAL');
 assert.match((await cards())['EBITDA (12 meses)'],/USD/);
 assert.equal((await cards()).ROE,'10%','Available primary metrics take precedence over fallbacks');
 assert.ok(requests.some(path=>path.includes('/yahoo-site/quote/PARTIAL/')),'Partial results still recover missing EBITDA');
 await page.click('.modal__close');await open('EMPTY');
 assert.equal(Object.keys(await cards()).length,0);assert.match(await page.$eval('.metrics-empty',el=>el.textContent||''),/no disponibles/);
 const chartRequests=requests.filter(path=>path.includes('/finance/chart/EMPTY')).length;
 repaired=true;await page.click('.asset-detail__metrics-note .btn');
 await page.waitForFunction(()=>document.querySelector('.asset-detail__metrics-section')?.textContent?.includes('USD'));
 assert.match((await cards())['EBITDA (12 meses)'],/USD/);
 assert.equal(requests.filter(path=>path.includes('/finance/chart/EMPTY')).length,chartRequests+1,'Fundamental retry only refreshes its quote, not the chart');
 for(const symbol of ['NXTE.XD','AMP.MC','OHLA.MC']){
  await page.click('.modal__close');await open(symbol);
  const metrics=await cards();assert.match(metrics['EBITDA (12 meses)'],/EUR$/);assert.match(metrics['BPA (12 meses)'],/EUR$/);
  const expectedDate=symbol==='OHLA.MC'?'2026-06-30':'2025-12-31';
  assert.ok(await page.$eval('.asset-detail__metrics-section',(el,date)=>el.textContent?.includes(date),expectedDate));
  if(symbol==='NXTE.XD') assert.match(await page.$eval('.asset-detail__metrics-note',el=>el.textContent||''),/B02.F/);
  assert.match(metrics['Deuda/patrimonio'],/%$/);
  if(symbol==='AMP.MC') assert.match(metrics['BPA (12 meses)'],/^-0,025532/);
 }
 assert.deepEqual(errors,[]);
 console.log('Stock fundamentals UI passed: authenticated API failure/public fallback, EPS vs financial currency, monetary EBITDA, debt/equity percent, valid zero, empty data, independent retry and mobile fit.');
}finally{await browser.close();}
