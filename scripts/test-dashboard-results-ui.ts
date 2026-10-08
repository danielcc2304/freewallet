import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { readFileSync } from 'node:fs';

const origin = process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5177';
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const stamp=new Date().toISOString();
const asset={id:'opening',symbol:'TEST',name:'Synthetic imported position',type:'stock',quantity:10,purchasePrice:10,currentPrice:10,purchaseDate:'2026-01-01',currency:'EUR',quotedAt:stamp,lastCheckedAt:stamp};
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const errors:string[]=[];
try {
    const page=await browser.newPage();
    page.on('pageerror',e=>errors.push(String(e)));
    await page.setViewport({width:1280,height:900});
    await page.evaluateOnNewDocument((asset,version)=>{
        if(!localStorage.getItem('freewallet_portfolio_v1')) localStorage.setItem('freewallet_portfolio_v1',JSON.stringify({version:1,assets:[asset],transactions:[]}));
        localStorage.setItem('freewallet_settings','{"apiEnabled":false}');
        localStorage.setItem('freewallet_last_seen_version',version);
        localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
    },asset,version);
    await page.setRequestInterception(true);
    page.on('request',r=>{void(new URL(r.url()).origin===origin?r.continue():r.abort());});
    await page.goto(origin,{waitUntil:'networkidle2'});
    await page.click('button[aria-label="Registrar venta de TEST"]');
    await page.waitForSelector('.position-availability');
    await page.$$eval('.form-row input[type="number"]',(inputs)=>{
        const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!;
        for(const [i,value] of ['20','5'].entries()) {setter.call(inputs[i],value);inputs[i].dispatchEvent(new Event('input',{bubbles:true}));}
    });
    await page.click('button[type="submit"]');
    await page.waitForFunction(()=>document.body.innerText.includes('¡Venta registrada!'));
    const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('freewallet_portfolio_v1')!));
    assert.equal(stored.assets[0].quantity,5);
    assert.equal(stored.transactions.length,2);
    assert.ok(stored.transactions.some((t:{provenance:string;quantity:number})=>t.provenance==='initial-position'&&t.quantity===10),'First sale preserves the imported opening cost');
    await page.goto(origin,{waitUntil:'networkidle2'});
    const cards=await page.$$eval('.portfolio-summary .metric-card',els=>Object.fromEntries(els.map(el=>[el.querySelector('.metric-card__title')!.textContent,el.querySelector('.metric-card__value')!.textContent])));
    assert.match(cards['Resultado realizado'],/50,00/);
    assert.match(cards['Resultado no realizado'],/^0,00/);
    assert.match(cards['Resultado total'],/50,00/);
    assert.match(cards['Coste de posiciones abiertas'],/50,00/);
    const advanced=await page.$eval('.portfolio-excel-insights__kpis',el=>el.textContent || '');
    assert.match(advanced,/Rentabilidad no realizada\+0%0/,'A profitable sale must not turn the open-position return into the total result');
    assert.doesNotMatch(advanced,/Rentabilidad total/);
    assert.match(advanced,/Coste de posiciones abiertas50/);
    for (const width of [320,390]) {
        await page.setViewport({width,height:900});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Summary must fit mobile');
        // The sidebar animates its width when crossing the mobile breakpoint.
        await page.waitForFunction(()=>[...document.querySelectorAll('.portfolio-summary .metric-card')].every(el=>el.scrollWidth<=el.clientWidth));
        assert.ok(await page.$$eval('.portfolio-summary .metric-card',els=>els.every(el=>el.scrollWidth<=el.clientWidth)),'No overflow within financial cards');
    }
    await (await page.$('.portfolio-summary'))!.screenshot({path:'/tmp/freewallet-results-summary.png'});
    await page.setViewport({width:1280,height:900});
    await page.click('button[aria-label="Registrar venta de TEST"]');
    await page.waitForSelector('.position-availability');
    await page.$$eval('.form-row input[type="number"]',inputs=>{
        const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!;
        for(const [i,value] of ['8','5'].entries()) {setter.call(inputs[i],value);inputs[i].dispatchEvent(new Event('input',{bubbles:true}));}
    });
    await page.click('button[type="submit"]');
    await page.waitForFunction(()=>document.body.innerText.includes('¡Venta registrada!'));
    await page.goto(origin,{waitUntil:'networkidle2'});
    assert.ok(await page.$('.portfolio-summary'),'Closing all positions retains the result summary');
    const closed=await page.$$eval('.portfolio-summary .metric-card',els=>Object.fromEntries(els.map(el=>[el.querySelector('.metric-card__title')!.textContent,el.querySelector('.metric-card__value')!.textContent])));
    assert.match(closed['Resultado realizado'],/40,00/);assert.match(closed['Resultado total'],/40,00/);
    // A sale-only legacy ledger must never display a fabricated zero result.
    await page.evaluate(()=>{
        const state=JSON.parse(localStorage.getItem('freewallet_portfolio_v1')!);
        state.transactions=state.transactions.filter((t:{type:string})=>t.type==='sell');
        localStorage.setItem('freewallet_portfolio_v1',JSON.stringify(state));
    });
    await page.reload({waitUntil:'networkidle2'});
    const unavailable=await page.$eval('.portfolio-summary',el=>el.textContent || '');
    assert.match(unavailable,/Realizado y total no disponibles/);assert.match(unavailable,/coste de compra/);
    assert.equal(await page.$$eval('.portfolio-summary .metric-card__value',els=>els.filter(el=>el.textContent==='No disponible').length),2);
    assert.deepEqual(errors,[]);
    console.log('Dashboard results UI passed: first sale from import, persisted basis, realized/unrealized/total summary, incomplete ledger and 320/390 px layouts.');
} finally {await browser.close();}
