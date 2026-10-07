import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import puppeteer from 'puppeteer';
const origin=process.env.FREEWALLET_TEST_URL||'http://127.0.0.1:5177';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const holdings=[
 {name:'Alibaba Group Holding Ltd Ordinary Shares',symbol:'Alibaba Group Holding Ltd Ordinary Shares',percentage:10},
 {name:'Tencent Holdings Ltd',symbol:'Tencent Holdings Ltd',percentage:10},
 {name:'Taiwan Semiconductor Manufacturing Co Ltd',symbol:'TW0002330008',isin:'TW0002330008',percentage:10},
 {name:'Samsung Electronics Co Ltd Pfd Registered Shs Non-Voting',symbol:'KR7005931001',isin:'KR7005931001',percentage:10},
 {name:'Alphabet Inc Class A',symbol:'Alphabet Inc Class A',percentage:10},
 {name:'Example Company',symbol:'Example Company',percentage:10},
];
const listings:Record<string,{symbol:string;name:string;currency:string}>={
 '9988.HK':{symbol:'9988.HK',name:'Alibaba Group Holding Limited',currency:'HKD'},
 '0700.HK':{symbol:'0700.HK',name:'Tencent Holdings Limited',currency:'HKD'},
 TW0002330008:{symbol:'2330.TW',name:'Taiwan Semiconductor Manufacturing Company Limited',currency:'TWD'},
 KR7005931001:{symbol:'005935.KS',name:'Samsung Electronics Co., Ltd.',currency:'KRW'},
 GOOGL:{symbol:'GOOGL',name:'Alphabet Inc.',currency:'USD'},
 example:{symbol:'EXAMPLE',name:'Example Company',currency:'EUR'},
};
const assets=[{id:'fund',symbol:'IE0031786696',isin:'IE0031786696',name:'Synthetic fund',type:'fund',quantity:10,purchasePrice:100,currentPrice:100,currency:'EUR',purchaseDate:'2026-01-01',holdings}];
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const errors:string[]=[],queries:string[]=[],charts:string[]=[];let repaired=false,failedQueries=0;
try{
 const page=await browser.newPage();page.on('pageerror',error=>errors.push(String(error)));await page.setViewport({width:390,height:900});
 await page.evaluateOnNewDocument((assets,version)=>{
  localStorage.setItem('freewallet_portfolio_v1',JSON.stringify({version:1,assets,transactions:[]}));localStorage.setItem('freewallet_settings','{"apiEnabled":true}');localStorage.setItem('freewallet_last_seen_version',version);localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
 },assets,version);
 await page.setRequestInterception(true);page.on('request',r=>{void(async()=>{
  const url=new URL(r.url());
  if(url.pathname.endsWith('/finance/search')){
   const query=url.searchParams.get('q')||'';queries.push(query);const listing=listings[query];
   const quotes=listing && (query!=='example'||repaired) ? [{symbol:listing.symbol,longname:listing.name,quoteType:'EQUITY',currency:listing.currency}] : [];
   if(query==='9988.HK')quotes.unshift({symbol:'BABA',longname:'Alibaba Group Holding Limited',quoteType:'EQUITY',currency:'USD'});
   await r.respond({status:200,contentType:'application/json',body:JSON.stringify({quotes})});return;
  }
  if(url.pathname.includes('/finance/chart/')){
   const symbol=decodeURIComponent(url.pathname.split('/').at(-1)!);charts.push(symbol);const listing=Object.values(listings).find(l=>l.symbol===symbol);
   const chart=listing ? {result:[{meta:{symbol,longName:listing.name,currency:listing.currency,regularMarketPrice:110},timestamp:[1790683200,1790769600],indicators:{quote:[{close:[100,110]}]}}]}:{result:[]};
   await r.respond({status:200,contentType:'application/json',body:JSON.stringify({chart})});return;
  }
  if(url.pathname.startsWith('/__market')||url.pathname.startsWith('/__finect')){await r.respond({status:200,contentType:'application/json',body:'{}'});return;}
  if(url.origin===origin||url.protocol==='data:'||url.protocol==='blob:')await r.continue();else await r.abort();
 })().catch(error=>errors.push(String(error)));});
 await page.goto(origin,{waitUntil:'networkidle2'});await page.click('.breakdown-toggle__label');await page.waitForSelector('.portfolio-composition__exposure-row');
 for(const holding of holdings){
  await page.$$eval('.portfolio-composition__exposure-row',(rows,name)=>(rows.find(row=>row.querySelector('strong')?.textContent===name) as HTMLElement).click(),holding.name);
  if(holding.name==='Example Company'){
   await page.waitForSelector('.underlying-detail__unavailable .btn');failedQueries=queries.filter(q=>q==='example').length;repaired=true;await page.click('.underlying-detail__unavailable .btn');
  }
  await page.waitForSelector('.underlying-detail .asset-detail__chart-container .recharts-wrapper');
  assert.equal(await page.$('.underlying-detail__unavailable'),null);
  assert.equal(await page.$('.asset-detail__position-grid'),null,'Look-through detail must not invent units or acquisition costs');
  assert.ok(await page.$eval('.underlying-detail',el=>el.scrollWidth<=el.clientWidth));
  assert.ok(await page.$eval('.asset-detail__chart-container',el=>el.getBoundingClientRect().height>=200),'Underlying chart keeps a readable height');
  assert.equal(await page.$eval('.asset-detail',el=>getComputedStyle(el).maxHeight),'none','Academy simulator styles must not collapse market details');
  assert.ok(await page.$eval('.asset-detail__header',el=>el.scrollHeight<=el.clientHeight+1),'The asset name and quotation remain visible');
  assert.ok(await page.$eval('.asset-detail__price-group',el=>el.scrollHeight<=el.clientHeight+1),'Mobile quotation must not inherit a desktop height basis');
  assert.ok(await page.$eval('.asset-detail__chart-section',el=>el.scrollHeight<=el.clientHeight+1),'The chart section must contain its graph and controls without clipping');
  if(holding===holdings[0]){
   for(const width of [390,1280])for(const theme of ['light','dark'])for(const appearance of ['standard','liquid-glass']){
    await page.setViewport({width,height:900});
    await page.evaluate((theme,appearance)=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.appearance=appearance;},theme,appearance);
    await page.waitForFunction(()=>{const section=document.querySelector('.asset-detail__chart-section')!;return section.scrollHeight<=section.clientHeight+1;});
    assert.ok(await page.$eval('.underlying-detail',el=>el.scrollWidth<=el.clientWidth));
    assert.equal(await page.$eval('.asset-detail',el=>getComputedStyle(el).maxHeight),'none');
    await page.$eval('.asset-detail__chart-section',el=>el.scrollIntoView());
    if(width===390 && theme==='dark' && appearance==='liquid-glass') await page.screenshot({path:'/tmp/freewallet-alibaba-underlying.png'});
   }
   await page.setViewport({width:390,height:900});
  }
  await page.click('.modal__close');
 }
 assert.ok(charts.includes('9988.HK'));assert.ok(!charts.includes('BABA'));assert.ok(charts.includes('005935.KS'));assert.ok(!charts.includes('005930.KS'));assert.ok(charts.includes('GOOGL'));assert.ok(!charts.includes('GOOG'));
 assert.ok(queries.includes('TW0002330008'));assert.ok(failedQueries>0 && queries.filter(q=>q==='example').length>failedQueries);assert.deepEqual(errors,[]);
 console.log('Underlying detail UI passed: Alibaba ordinary shares, Tencent, TSMC ISIN, Samsung preferred shares, Alphabet A, independent retry, market-only data and mobile fit.');
}finally{await browser.close();}
