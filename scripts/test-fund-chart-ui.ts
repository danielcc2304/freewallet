import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const origin=process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5177';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
// Public instrument identifiers, synthetic amounts. Optional downloaded public
// responses allow a second run against the providers' actual response shapes.
const funds=[
 ['LU0034353002','DWS Floating Rate Notes LC','0P00000N4I.F'],
 ['IE00BYX5NX33','Fidelity MSCI World Index EUR P Acc','0P0001CLDK.F'],
 ['ES0140072002','Ábaco Renta Fija Mixta Global I FI','0P0000W78X.F'],
 ['LU1953238794','EC SICAV EverCapital Invms UCITS I Rtl','0P0001J2L4.F'],
 ['LU1623762843','Carmignac Pf Credit A EUR Acc','0P0001FE3K.F'],
 ['IE0031786696','Vanguard Em Mkts Stk Idx EUR Acc','0P00012I6A.F'],
 ['ES0165243025','Myinvestor Value C FI','0P0001T8V7.F'],
 ['ES0119199018','Cobas Internacional D FI','0P0001LFVO.F'],
 ['LU0625737910','Pictet-China Index P EUR','LU0625737910.LU'],
 ['ES0112611001','Azvalor Internacional FI','0P00016YQ5.F'],
];
const stamp=new Date().toISOString();
const assets=funds.map(([isin,name],i)=>({id:'fund-'+i,name,symbol:isin,isin,type:'fund',currency:'EUR',quantity:1,purchasePrice:90,currentPrice:100,purchaseDate:'2026-01-01',quotedAt:stamp,lastCheckedAt:stamp}));
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const recorded=process.env.FREEWALLET_FUND_PROVIDER_FIXTURES;
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const errors:string[]=[], searches:string[]=[], charts:string[]=[];
let failDws=true;
const body=(name:string)=>readFileSync(join(recorded!,name),'utf8');
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewport({width:1280,height:900});
 await page.evaluateOnNewDocument((assets,version)=>{
  localStorage.setItem('freewallet_portfolio_v1',JSON.stringify({version:1,assets,transactions:[]}));
  localStorage.setItem('freewallet_settings','{"apiEnabled":true}');
  localStorage.setItem('freewallet_last_seen_version',version);localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
 },assets,version);
 await page.setRequestInterception(true);
 page.on('request',r=>{void(async()=>{
  const url=new URL(r.url());
  if(url.pathname.includes('/finance/search')){
   const q=url.searchParams.get('q')!;searches.push(q);
   const fund=funds.find(([isin,name])=>q===isin||q===name);
   let payload:unknown={quotes:[]};
   if(fund){
    const [isin,name,symbol]=fund;
    payload=q===name?{quotes:[{symbol:'WRONG-LD',quoteType:'MUTUALFUND',longname:'DWS Floating Rate Notes LD'},{symbol,quoteType:'MUTUALFUND',longname:name}]}
     :recorded?JSON.parse(body('fw-fund-search-'+isin+'.json'))
      :{quotes:[isin==='LU0034353002'?{symbol:'DI4A.F',quoteType:'ETF',longname:'DWS Floating Rate Notes'}
        :isin==='ES0140072002'?{symbol:isin+'.SG',quoteType:'MUTUALFUND',longname:name}
        :{symbol,quoteType:'MUTUALFUND',longname:name}]};
   }
   await r.respond({status:200,contentType:'application/json',body:JSON.stringify(payload)});return;
  }
  if(url.pathname.includes('/finance/chart/')){
   const symbol=decodeURIComponent(url.pathname.split('/').at(-1)!);charts.push(symbol);
   if(failDws && (symbol==='0P00000N4I.F'||symbol.startsWith('LU0034353002'))){
    await r.respond({status:503,body:'Synthetic first attempt failure'});return;
   }
   const fund=funds.find(f=>f[2]===symbol);
   if(fund){
    const payload=recorded?body('fw-fund-chart-'+symbol+'.json'):JSON.stringify({chart:{result:[{meta:{symbol,currency:'EUR'},timestamp:[1790683200,1790769600,1790856000,1790942400],indicators:{quote:[{close:[100,100.3,100.6,101]}]}}]}});
    await r.respond({status:200,contentType:'application/json',body:payload});return;
   }
   if(symbol==='ES0140072002.SG'){
    await r.respond({status:200,contentType:'application/json',body:JSON.stringify({chart:{result:[{meta:{symbol,currency:'EUR'},timestamp:[1790942400],indicators:{quote:[{close:[100]}]}}]}})});return;
   }
   await r.respond({status:200,contentType:'application/json',body:'{"chart":{"result":[]}}'});return;
  }
  if(url.pathname.startsWith('/__finect')){
   if(url.pathname.includes('/search')){
    const isin=url.searchParams.get('q')!;
    await r.respond({status:200,contentType:'application/json',body:JSON.stringify({data:[{type:'fund',entity:{isin,alias:'test-'+isin},url:'/fondos-inversion/'+isin+'-test'}]})});return;
   }
   const isin=url.pathname.split('/').at(-1)!.slice(0,12),fund=funds.find(f=>f[0]===isin)!;
   const html=recorded?body('freewallet-fund-'+isin+'.html'):'<script>window.INITIAL_STATE='+JSON.stringify(JSON.stringify({fund:{fund:{model:{isin,name:fund[1],alias:'test-'+isin,class:{isin,name:fund[1]},currency:{code:'EUR'},portfolio:{holdings:[]}}}}}))+';</script>';
   await r.respond({status:200,contentType:'text/html',body:html});return;
  }
  if(url.pathname.startsWith('/__market')){await r.respond({status:200,contentType:'application/json',body:'{}'});return;}
  if(url.origin===origin||url.protocol==='data:'||url.protocol==='blob:')await r.continue();else await r.abort();
 })().catch(e=>errors.push(String(e)));});
 await page.goto(origin,{waitUntil:'networkidle2'});
 const open=async(isin:string)=>{
  await page.$$eval('.assets-table__table tbody tr',(rows,isin)=>(rows.find(el=>el.textContent?.includes(isin)) as HTMLElement).click(),isin);
  await page.waitForSelector('.asset-detail');
 };
 await open('LU0034353002');
 await page.waitForSelector('.chart-overlay.error-state .btn',{timeout:30000});
 for(const width of [1280,390]){
  await page.setViewport({width,height:900});
  await page.waitForFunction(()=>document.querySelector('.chart-overlay.error-state .btn')!.getBoundingClientRect().height>=43.9);
  const button=await page.$eval('.chart-overlay.error-state .btn',el=>({height:el.getBoundingClientRect().height,border:getComputedStyle(el).borderRadius,text:el.textContent}));
  assert.ok(button.height>=43.9);assert.notEqual(button.border,'0px');assert.match(button.text!,/Reintentar consulta/);
  assert.ok(await page.$eval('.asset-detail',el=>el.scrollWidth<=el.clientWidth));
 }
 await(await page.$('.asset-detail__chart-section'))!.screenshot({path:'/tmp/freewallet-fund-chart-retry.png'});
 failDws=false;
 await page.click('.chart-overlay.error-state .btn');
 await page.waitForSelector('.asset-detail__chart-container .recharts-wrapper');
 await page.waitForFunction(()=>document.querySelector('.asset-detail__chart-source')?.textContent?.includes('0P00000N4I.F'));
 assert.ok(searches.filter(q=>q==='LU0034353002').length>=2,'Retry must refresh symbol resolution');
 assert.ok(!charts.includes('DI4A.F'),'Traded DWS quote is not a NAV chart');
 assert.ok(!charts.includes('WRONG-LD'),'Wrong class is never charted');
 assert.doesNotMatch(await page.$eval('.asset-detail__period-performance',el=>el.textContent||''),/N\/D/);
 await(await page.$('.asset-detail__chart-section'))!.screenshot({path:'/tmp/freewallet-fund-chart-dws.png'});
 for(const period of ['1D','7D','3M','YTD','Máx']){
  await page.$$eval('.period-btn',(buttons,period)=>(buttons.find(el=>el.textContent===period) as HTMLElement).click(),period);
  await page.waitForSelector('.asset-detail__chart-container .recharts-wrapper');
 }
 for(const [isin,,symbol] of funds.slice(1)){
  await page.click('.modal__close');await open(isin);
  await page.waitForFunction(symbol=>document.querySelector('.asset-detail__chart-source')?.textContent?.includes(symbol),{},symbol);
  await page.waitForSelector('.asset-detail__chart-container .recharts-wrapper');
  assert.doesNotMatch(await page.$eval('.asset-detail__period-performance',el=>el.textContent||''),/N\/D/);
 }
 assert.deepEqual(errors,[]);
 console.log('Fund chart UI passed: ten funds, DWS verified LC fallback, daily NAV chart, period controls, symbol refresh on retry, styled retry on desktop/mobile and wrong-class rejection.'+(recorded?' Replayed real public provider responses.':''));
}catch(error){
 console.error(JSON.stringify({errors,searches:searches.slice(-12),charts:charts.slice(-12)}));
 throw error;
}finally{await browser.close();}
