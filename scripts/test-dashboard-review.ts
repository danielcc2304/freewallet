import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { DEFAULT_EVOLUTION_CSV } from '../src/pages/PortfolioCsv/portfolioCsvConstants';

const origin=process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5177';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const stamp=new Date().toISOString();
const common={purchaseDate:'2026-01-01',currency:'EUR',lastCheckedAt:stamp,quotedAt:stamp};
const assets=[
    {...common,id:'nextil',symbol:'NXTE.XD',name:'Nueva Expresion Textil SA',type:'stock',quantity:100,purchasePrice:0.8,currentPrice:1.036,previousClose:1},
    {...common,id:'evercapital',symbol:'LU1953238794',isin:'LU1953238794',name:'Evercapital',type:'fund',quantity:10,purchasePrice:90,currentPrice:100,previousClose:99,holdings:[{symbol:'ES0126962069',isin:'ES0126962069',name:'Nueva Expresion Textil SA',percentage:7.05}]},
];
const chart=(symbol:string)=>({chart:{result:[{meta:{symbol,currency:'EUR',chartPreviousClose:1},timestamp:symbol==='NXTE.XD'?[1791288000]:[1790683200,1790769600,1790856000,1790942400],indicators:{quote:[{close:symbol==='NXTE.XD'?[1.036]:[0.989,1.012,1.019,1.036],volume:[0,10,20,30]}]}}]}});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const errors:string[]=[],requests:string[]=[];
try {
    const page=await browser.newPage();page.on('pageerror',e=>errors.push(String(e)));
    await page.setViewport({width:390,height:900});
    await page.evaluateOnNewDocument((assets,evolution)=>{
        localStorage.setItem('freewallet_portfolio_v1',JSON.stringify({version:1,assets,transactions:[]}));
        localStorage.setItem('freewallet_settings','{"apiEnabled":true}');
        localStorage.setItem('freewallet_last_seen_version','6.0.5');
        localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
        localStorage.setItem('freewallet_portfolio_csv_evolution_raw',evolution);
        localStorage.setItem('freewallet_portfolio_csv_workbook_file','fixture.xlsx');
    },assets,DEFAULT_EVOLUTION_CSV);
    await page.setRequestInterception(true);
    page.on('request',r=>{void(async()=>{
        const url=new URL(r.url());
        if(url.pathname.includes('/finance/chart/')) {
            const symbol=decodeURIComponent(url.pathname.split('/').at(-1)!);requests.push(symbol);
            await r.respond({status:200,contentType:'application/json',body:JSON.stringify(['NXTE.XD','B02.F'].includes(symbol)?chart(symbol):{chart:{result:[]}})});
        } else if(url.pathname.includes('/finance/search')) await r.respond({status:200,contentType:'application/json',body:JSON.stringify({quotes:[{symbol:'NXTE',shortname:'Unrelated ETF',quoteType:'ETF'},{symbol:'B02.F',longname:'Nueva Expresión Textil, S.A.',quoteType:'EQUITY'}]})});
        else if(url.pathname.startsWith('/__market')||url.pathname.startsWith('/__finect')) await r.respond({status:200,contentType:'application/json',body:'{}'});
        else if(url.origin===origin||url.protocol==='data:'||url.protocol==='blob:')await r.continue();
        else await r.abort();
    })().catch(e=>errors.push(String(e)));});
    await page.goto(origin,{waitUntil:'networkidle2'});
    await page.waitForSelector('.portfolio-excel-insights__workbook-notice');
    const notice=await page.$('.portfolio-excel-insights__workbook-notice');assert.ok(notice);
    await notice.screenshot({path:'/tmp/freewallet-workbook-notice.png'});
    const layout=await notice.evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,button:el.querySelector('button')!.getBoundingClientRect().height}));
    assert.equal(layout.scroll,layout.width);assert.ok(layout.button>=44);
    await page.click('.portfolio-excel-insights__workbook-notice button');
    await page.waitForFunction(()=>!document.querySelector('.portfolio-excel-insights__workbook-notice'));
    assert.ok(await page.evaluate(()=>localStorage.getItem('freewallet_workbook_link')),'Confirmation persists the workbook link');
    await page.click('.breakdown-toggle__label');
    await page.waitForSelector('.portfolio-composition__exposure-list');
    const rows=await page.$$eval('.portfolio-composition__exposure-row',els=>els.map(el=>el.textContent||''));
    const nextil=rows.filter(text=>text.includes('Nueva Expresion Textil'));
    assert.equal(nextil.length,1);assert.match(nextil[0],/174,10/);
    await page.$$eval('.assets-table__table tbody tr',rows => (rows.find(el => el.textContent?.includes('Nueva Expresion Textil')) as HTMLElement).click());
    await page.waitForSelector('.asset-detail__chart-container .recharts-wrapper');
    await page.waitForFunction(()=>document.querySelector('.asset-detail__chart-source')?.textContent?.includes('B02.F'));
    assert.ok(requests.includes('B02.F'));assert.ok(!requests.includes('NXTE'),'Never uses an unrelated ETF for Nextil');
    await page.$eval('.asset-detail__chart-section',el=>el.scrollIntoView());
    await (await page.$('.asset-detail__chart-section'))!.screenshot({path:'/tmp/freewallet-nextil-chart.png'});
    assert.ok(await page.$eval('.asset-detail',el=>el.scrollWidth<=el.clientWidth),'Detail fits mobile width');
    const ticks=await page.$$eval('.asset-detail__chart-container svg text',els=>els.map(el=>el.textContent).filter(text=>/^\d+(?:,\d+)?$/.test(text||'')));
    assert.ok(new Set(ticks).size>1,'Small stock prices remain distinguishable on the price axis');
    assert.deepEqual(errors,[]);
    console.log('Dashboard review passed: mobile workbook confirmation, single Nextil direct + Evercapital amount, verified alternate listing and readable stock chart.');
} finally {await browser.close();}
