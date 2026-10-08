import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import puppeteer from 'puppeteer';

const origin=process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5177';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const stamp=new Date().toISOString();
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const asset={id:'synthetic',symbol:'TEST',name:'Synthetic backdated sale',type:'stock',quantity:20,purchasePrice:150,currentPrice:170,purchaseDate:'2026-01-01',currency:'EUR',quotedAt:stamp,lastCheckedAt:stamp};
const trade=(id:string,date:string,price:number)=>({id,assetId:asset.id,assetSymbol:asset.symbol,assetName:asset.name,assetType:asset.type,type:'buy',date,quantity:10,price,total:10*price,createdAt:date+'T12:00:00Z',provenance:'trade'});
const transactions=[trade('first','2026-01-01',100),trade('second','2026-02-01',200)];
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const errors:string[]=[];
try {
    const page=await browser.newPage();page.on('pageerror',e=>errors.push(String(e)));
    await page.setViewport({width:1280,height:900});
    await page.evaluateOnNewDocument((asset,transactions,version)=>{
        if(!localStorage.getItem('freewallet_portfolio_v1'))localStorage.setItem('freewallet_portfolio_v1',JSON.stringify({version:1,assets:[asset],transactions}));
        localStorage.setItem('freewallet_settings','{"apiEnabled":false}');
        localStorage.setItem('freewallet_last_seen_version',version);
        localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
    },asset,transactions,version);
    await page.setRequestInterception(true);
    page.on('request',r=>{const url=new URL(r.url());void(url.origin===origin||['data:','blob:'].includes(url.protocol)?r.continue():r.abort());});
    const enterSale=async(quantity:string,date:string)=>{
        await page.click('button[aria-label="Registrar venta de TEST"]');
        await page.waitForSelector('.position-availability');
        await page.evaluate((quantity,date)=>{
            const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!;
            const numbers=document.querySelectorAll('.form-row input[type="number"]');
            for(const [i,value] of ['120',quantity].entries()) {setter.call(numbers[i],value);numbers[i].dispatchEvent(new Event('input',{bubbles:true}));}
            const input=document.querySelector('input[type="date"]')!;setter.call(input,date);input.dispatchEvent(new Event('input',{bubbles:true}));
        },quantity,date);
        await page.click('button[type="submit"]');
    };
    await page.goto(origin,{waitUntil:'networkidle2'});
    await enterSale('5','2026-01-15');
    await page.waitForFunction(()=>document.body.innerText.includes('¡Venta registrada!'));
    const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('freewallet_portfolio_v1')!));
    assert.equal(stored.assets[0].quantity,15);
    assert.ok(Math.abs(stored.assets[0].purchasePrice-2500/15)<1e-10);
    assert.ok(stored.transactions.some((t:{type:string;date:string})=>t.type==='sell'&&t.date==='2026-01-15'));
    for(const old of transactions)assert.deepEqual(stored.transactions.find((t:{id:string})=>t.id===old.id),old);
    await page.goto(origin,{waitUntil:'networkidle2'});
    const cards=await page.$$eval('.portfolio-summary .metric-card',els=>Object.fromEntries(els.map(el=>[el.querySelector('.metric-card__title')!.textContent,el.querySelector('.metric-card__value')!.textContent])));
    assert.match(cards['Coste de posiciones abiertas']!,/2\.?500,00/);
    assert.match(cards['Resultado no realizado']!,/^50,00/);
    assert.match(cards['Resultado realizado']!,/^100,00/);
    assert.match(cards['Resultado total']!,/^150,00/);
    for(const width of [390,1280]) {
        await page.setViewport({width,height:900});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    const before=await page.evaluate(()=>localStorage.getItem('freewallet_portfolio_v1'));
    await enterSale('11','2026-01-15');
    await page.waitForFunction(()=>document.body.innerText.includes('suficientes unidades en su fecha'));
    assert.equal(await page.evaluate(()=>localStorage.getItem('freewallet_portfolio_v1')),before,'An invalid historical sale must not save a changed position or ledger');
    assert.equal(await page.$('button[aria-label="Registrar venta de TEST"]'),null,'Rejected sale remains in the form for correction');
    assert.deepEqual(errors,[]);
    console.log('Retroactive trade UI passed: dated sale, persisted average cost, immutable purchases, open/realized/total results, mobile layout and invalid-sale rollback.');
}finally{await browser.close();}
