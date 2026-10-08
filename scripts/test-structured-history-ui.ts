import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import puppeteer from 'puppeteer';
import {importHistoryArchive} from '../src/services/imports/portfolioHistoryImport';

// Use Vite with synthetic public Supabase settings and cloud enabled. Every
// external request is intercepted; no real session or portfolio is accessed.
const origin=process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5228';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const now=Date.parse('2026-10-07T12:00:00Z');
const owner='11111111-1111-4111-8111-111111111111';
const user={id:owner,aud:'authenticated',role:'authenticated',email:'history@example.invalid',email_confirmed_at:'2026-01-01',is_anonymous:false,app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:'2026-01-01'};
const token=`header.${btoa(JSON.stringify({sub:owner,exp:Math.floor(now/1000)+3600,session_id:'22222222-2222-4222-8222-222222222222',role:'authenticated'}))}.synthetic`;
const archive=importHistoryArchive({evolution:'Mes,Valor Total,Capital Inicial,Capital Aportado\n2025 Dic,1000,1000,0\n2026 Ene,1050,1000,0\n2026 Feb,1100,1000,0\n2026 Mar,1150,1000,0\n2026 Abr,1200,1000,0\n2026 May,1250,1000,0\n2026 Jun,1300,1000,0\n2026 Jul,1400,1000,0\n2026 Ago,1500,1000,0\n2026 Sept,1760,1000,200',daily:'Fecha,Valor portfolio,Flujo neto,Tipo de dato\n2026-10-06,1790,0,Diario',movements:'',comparison:'',advanced:'',label:'Synthetic history'},now);
const fallback={...archive,valuations:archive.valuations.map(p=>({...p,value:p.date.startsWith('2026-10') ? 1690 : p.value}))};
const doc={
 freewallet_portfolio_v1:JSON.stringify({version:1,assets:[{id:'open',symbol:'SYNTHETIC',name:'Synthetic',type:'fund',quantity:1,purchasePrice:1000,currentPrice:1790,purchaseDate:'2025-12-31',currency:'EUR'}],transactions:[]}),
 freewallet_history_archive_v1:JSON.stringify(fallback),freewallet_settings:'{"apiEnabled":false}',
 // If analytics ever tries to parse its old source it will fail this fixture.
 freewallet_portfolio_csv_evolution_raw:'not a usable spreadsheet',
};
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const errors:string[]=[];let revision=0;const reads:Array<{known_updated_at:string|null}>=[];
let updatedAt='2026-10-07T09:00:00+00:00';
const page=await browser.newPage();
try {
 page.on('pageerror',error=>errors.push(String(error)));
 await page.setViewport({width:390,height:900});
 await page.evaluateOnNewDocument(`Date = new Proxy(Date, {construct(target,args){return Reflect.construct(target,args.length ? args : [${now}]);},get(target,key){return key==='now' ? function(){return ${now};} : Reflect.get(target,key);}});`);
 await page.evaluateOnNewDocument((auth,version)=>{
  localStorage.setItem('freewallet-news-auth',JSON.stringify(auth));
  localStorage.setItem('freewallet_last_seen_version',version);
  localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
 },{access_token:token,refresh_token:'synthetic',expires_at:Math.floor(now/1000)+3600,expires_in:3600,token_type:'bearer',user},version);
 await page.setRequestInterception(true);
 page.on('request',request=>{void(async()=>{
  const url=new URL(request.url());
  if(url.hostname.endsWith('.supabase.co')){
   const headers={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'*'};
   if(request.method()==='OPTIONS'){await request.respond({status:204,headers});return;}
   let result:unknown;
   if(url.pathname==='/auth/v1/user')result=user;
   else if(url.pathname.endsWith('/read_portfolio')){const args=JSON.parse(request.postData()!);result={revision,data:args.known_revision===revision ? null : doc};}
   else if(url.pathname.endsWith('/patch_portfolio')){
    const args=JSON.parse(request.postData()!);assert.equal(args.expected_revision,revision);
    Object.assign(doc,args.changes);for(const key of args.removed ?? [])delete (doc as Record<string,string>)[key];
    result={revision:++revision,data:args.changes,removed:args.removed,patch:true};
   }
   else if(url.pathname.endsWith('/read_portfolio_history')){
    assert.equal(request.headers().authorization,`Bearer ${token}`,'Native history must pin the scoped account token');
    const args=JSON.parse(request.postData()!);reads.push(args);
    result={revision,updatedAt,archive:args.known_updated_at===updatedAt ? null : archive};
   }else if(url.pathname.endsWith('/read_daily_market_data_v2'))result={prices:[],snapshots:[],benchmark:{isin:'IE00BYX5NX33',name:'Fidelity MSCI World'},lastRun:null};
   else {await request.respond({status:404,headers,body:'{}'});return;}
   await request.respond({status:200,headers,contentType:'application/json',body:JSON.stringify(result)});
  }else if(url.origin===origin || ['data:','blob:'].includes(url.protocol))await request.continue();
  else await request.abort();
 })().catch(error=>{errors.push(String(error));if(!request.isInterceptResolutionHandled())void request.abort();});});
 await page.goto(origin,{waitUntil:'networkidle2'});await page.waitForSelector('.portfolio-summary');
 await page.$$eval('.portfolio-summary__tab',buttons=>(buttons.find(b=>b.textContent==='YTD') as HTMLElement).click());
 await page.waitForFunction(()=>document.querySelector('.portfolio-summary__grid .metric-card:last-child')?.textContent?.includes('590,00'));
 assert.ok(reads.some(r=>r.known_updated_at===null),'First read loads normalized history instead of the fallback or raw CSV');
 // Keep the browser module reference alive independently of a Puppeteer
 // evaluate promise while React remounts the account subtree.
 await page.evaluate("void import('/src/services/portfolioCloudStorage.ts').then(module=>{window.fixtureHistoryStorage=module.portfolioStorage;});");
 await page.waitForFunction('Boolean(window.fixtureHistoryStorage)');
 revision++;
 await page.evaluate(`window.fixtureHistoryStorage.hydrate({revision:${revision},data:null});`);
 await page.waitForFunction(()=>document.querySelector('.portfolio-summary__grid .metric-card:last-child')?.textContent?.includes('590,00'));
 await page.waitForNetworkIdle();
 assert.ok(reads.some(r=>r.known_updated_at===updatedAt),'The next revision reuses the unchanged native archive');
 // A corrected prior valuation and a new authoritative day must reach both
 // YTD displays without uploading or parsing another spreadsheet.
 const ledgerBefore=doc.freewallet_portfolio_v1;
 archive.valuations=archive.valuations.map(p=>p.date.startsWith('2026-10-06')?{...p,value:1775,historyOrigin:'agent'}:p);
 archive.valuations.push({...archive.valuations.at(-1)!,date:'2026-10-07T09:00:00Z',value:1770,historyOrigin:'agent'});
 updatedAt='2026-10-07T10:00:00+00:00';revision++;
 await page.evaluate(`window.fixtureHistoryStorage.hydrate({revision:${revision},data:null});`);
 await page.waitForFunction(()=>document.querySelector('.portfolio-summary__grid .metric-card:last-child')?.textContent?.includes('570,00'));
 await page.$$eval('.portfolio-summary__tab',buttons=>(buttons.find(b=>b.textContent==='YTD') as HTMLElement).click());
 assert.match(await page.$eval('.portfolio-summary__grid .metric-card:last-child',el=>el.textContent || ''),/56[,.]89%/);
 await page.$$eval('.portfolio-excel-insights__tabs button',buttons=>(buttons.find(b=>b.textContent?.includes('Benchmark')) as HTMLElement).click());
 await page.$$eval('.portfolio-excel-insights__periods button',buttons=>(buttons.find(b=>b.textContent==='YTD') as HTMLElement).click());
 assert.match(await page.$eval('.portfolio-excel-insights__benchmark-portfolio',el=>el.textContent || ''),/56,89%/);
 assert.equal(doc.freewallet_portfolio_v1,ledgerBefore,'An authoritative history update leaves the portfolio ledger intact');
 // A different storage generation cannot render the first account's native data.
 const otherArchive={...archive,valuations:archive.valuations.map(p=>({...p,value:p.date.startsWith('2026-10') ? 1290 : p.value}))};
 const otherDoc={...doc,freewallet_history_archive_v1:JSON.stringify(otherArchive)};
 await page.waitForNetworkIdle();
 await page.evaluate(`window.fixtureHistoryStorage.select('33333333-3333-4333-8333-333333333333');window.fixtureHistoryStorage.hydrate({revision:1,data:${JSON.stringify(otherDoc)}});`);
 await page.waitForFunction(()=>document.querySelector('.portfolio-summary__grid .metric-card:last-child')?.textContent?.includes('90,00'));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);
 console.log('PASS: Dashboard reads native history with a scoped token, ignores raw CSV, reuses conditional reads and isolates another account generation at mobile width.');
}catch(error){console.error({errors,reads,screen:(await page.evaluate(()=>document.body.innerText)).slice(0,1600)});throw error;}
finally{await browser.close();}
