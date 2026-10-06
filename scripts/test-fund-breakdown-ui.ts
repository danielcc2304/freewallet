import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import {readFileSync} from 'node:fs';

// Synthetic portfolios and intercepted provider pages; no account is modified.
const origin=process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5177';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const stamp=new Date().toISOString();
const base={type:'fund',quantity:1,purchasePrice:100,currentPrice:100,purchaseDate:'2026-01-01',currency:'EUR',quotedAt:stamp,lastCheckedAt:stamp,lastReadAt:stamp};
const assets=[
 {...base,id:'world',name:'Synthetic equity',symbol:'IE00BYX5NX33',holdings:[{name:'Saved incomplete position',symbol:'OLD',percentage:1}]},
 {...base,id:'world-lot',name:'Synthetic equity second lot',symbol:'IE00BYX5NX33'},
 {...base,id:'bonds',name:'Synthetic bond distribution',symbol:'ES0140072002'},
 {...base,id:'retry',name:'Synthetic retry fund',symbol:'LU1953238794',holdings:[{name:'Saved protected position',symbol:'SAVED',percentage:7}]},
 {...base,id:'unknown',name:'Synthetic fund without ISIN',symbol:'UNKNOWN'},
];
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const errors:string[]=[], searches:string[]=[];
let retryWorks=false, apiFallbacks=0;
try {
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewport({width:390,height:900});
 await page.evaluateOnNewDocument((assets,version)=>{
  localStorage.setItem('freewallet_portfolio_v1',JSON.stringify({version:1,assets,transactions:[]}));
  localStorage.setItem('freewallet_settings','{"apiEnabled":true}');
  localStorage.setItem('freewallet_last_seen_version',version);
  localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
 },assets,version);
 await page.setRequestInterception(true);
 page.on('request',r=>{void(async()=>{
  const url=new URL(r.url());
  if(url.pathname.startsWith('/__finect')) {
   if(url.pathname.includes('/search')) {
    const isin=url.searchParams.get('q')!;searches.push(isin);
    if(isin==='LU1953238794'&&!retryWorks){await r.abort();return;}
    await r.respond({status:200,contentType:'application/json',body:JSON.stringify({data:[{type:'fund',entity:{isin,alias:'synthetic-'+isin},url:'/fondos-inversion/'+isin+'-synthetic'}]})});return;
   }
   if(url.pathname.includes('/products/')) {apiFallbacks++;await r.abort();return;}
   const isin=url.pathname.split('/').at(-1)!.slice(0,12);
   const holdings=isin==='IE00BYX5NX33'?Array.from({length:18},(_,i)=>({name:`Published issuer ${String.fromCharCode(65+i).repeat(3)}`,weight:2}))
      :isin==='LU1953238794'?[{name:'Published retry issuer',weight:8}]:[];
   const model={name:'Synthetic provider fund',alias:'synthetic-'+isin,isin,currency:{code:'EUR'},portfolio:{holdings},
     breakdown:[{type:'asset-allocation',items:[{drawer:'Bonds',values:{long:80}},{drawer:'Cash',values:{long:20}}]},
       {type:'regional-exposure',items:[{drawer:'Europe',values:{long:60}},{drawer:'America',values:{long:40}}]}]};
   const state={fund:{fund:{model}}};
   await r.respond({status:200,contentType:'text/html',body:`<script>window.INITIAL_STATE=${JSON.stringify(JSON.stringify(state))};</script>`});return;
  }
  if(url.pathname.startsWith('/__market')||url.pathname.includes('/finance/')){await r.respond({status:200,contentType:'application/json',body:'{}'});return;}
  if(url.origin===origin||url.protocol==='data:'||url.protocol==='blob:')await r.continue();else await r.abort();
 })().catch(e=>errors.push(String(e)));});
 await page.goto(origin,{waitUntil:'networkidle2'});
 await page.click('.breakdown-toggle__label');
 await page.waitForFunction(()=>document.querySelector('[data-fund-id="world"]')?.textContent?.includes('18 posiciones'));
 await page.waitForFunction(()=>document.querySelector('[data-fund-id="retry"]')?.textContent?.includes('Consulta fallida')||document.querySelector('[data-fund-id="retry"]')?.textContent?.includes('No se pudo consultar'));
 const world=await page.$eval('[data-fund-id="world"]',el=>({text:el.textContent,open:(el as HTMLDetailsElement).open,holdings:el.querySelector('section ul')?.children.length}));
 assert.equal(world.holdings,18);assert.equal(world.open,true);assert.match(world.text!,/36% identificado/);
 assert.doesNotMatch(world.text!,/Saved incomplete position/);assert.match(world.text!,/Tipos de activo/);assert.match(world.text!,/Distribución geográfica/);
 const bonds=await page.$eval('[data-fund-id="bonds"]',el=>el.textContent || '');
 assert.match(bonds,/sin posiciones publicadas/);assert.match(bonds,/Bonds/);assert.match(bonds,/Europe/);
 const missing=await page.$eval('[data-fund-id="unknown"]',el=>el.textContent || '');assert.match(missing,/Falta el ISIN/);
 const fallback=await page.$eval('[data-fund-id="retry"]',el=>el.textContent || '');assert.match(fallback,/Saved protected position/);assert.match(fallback,/guardado/);
 assert.equal(searches.filter(s=>s==='IE00BYX5NX33').length,1,'ISIN shared across lots is requested once');
 assert.equal(apiFallbacks,0,'Current escaped HTML must parse without a second API query');
 const status=await page.$eval('.portfolio-composition__breakdown-status',el=>el.textContent || '');assert.match(status,/3\/5 fondos con posiciones/);assert.match(status,/1 solo con distribución/);
 const rows=await page.$$eval('.portfolio-composition__exposure-row',els=>els.map(el=>el.textContent || ''));
 assert.equal(rows.filter(s=>s.includes('Published issuer')).length,18,'Both lots consolidate into the same 18 issuers');
 assert.ok(rows.some(s=>s.includes('Published issuer AAA')&&s.includes('4,00')),'Two fund lots sum their exposure');
 await page.$eval('[data-fund-id="world"]',el=>el.scrollIntoView());
 await (await page.$('[data-fund-id="world"]'))!.screenshot({path:'/tmp/freewallet-fund-breakdown.png'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Expanded breakdown fits mobile');
 retryWorks=true;
 await page.click('button::-p-text(Reintentar desgloses pendientes)');
 await page.waitForFunction(()=>document.querySelector('[data-fund-id="retry"]')?.textContent?.includes('Published retry issuer'));
 assert.equal(searches.filter(s=>s==='IE00BYX5NX33').length,1,'Retry only fetches failed funds');
 assert.equal(await page.$('button::-p-text(Reintentar desgloses pendientes)'),null);
 await page.click('.breakdown-toggle__label');assert.equal(await page.$('.portfolio-composition__distributions'),null);
 assert.deepEqual(errors,[]);
 console.log('Fund breakdown UI passed: partial saved holdings refreshed, 18 positions, shared-ISIN consolidation, visible allocation/geography, failed-provider fallback, retry, missing identifiers and mobile layout.');
} finally {await browser.close();}
