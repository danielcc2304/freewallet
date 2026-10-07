import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer';

const origin=process.env.FREEWALLET_TEST_URL??'http://127.0.0.1:5177';
assert.match(origin,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const reference=process.env.FREEWALLET_REFERENCE_FILE;
const positions=reference
    ? [...readFileSync(reference,'utf8').matchAll(/\['([^']+)', '(fund|stock|crypto)', ([\d.]+), ([\d.]+)\]/g)]
        .map(row=>({id:row[1],symbol:row[1],name:row[1],type:row[2],quantity:Number(row[3]),purchasePrice:Number(row[4]),purchaseDate:'2026-01-01',currency:'EUR'}))
    : Array.from({length:15},(_,i)=>({id:`fixture-${i}`,symbol:`TEST${i}`,name:`Synthetic instrument ${i}`,type:'stock',quantity:i+1,purchasePrice:100,purchaseDate:'2026-01-01',currency:'EUR'}));
assert.equal(positions.length,15);
// Real quantities/costs stay outside the repository; quotes are controlled fixtures.
const assets=positions.map((a,i)=>({...a,currentPrice:i===0?undefined:a.purchasePrice*(i===1?.9:1.05),lastCheckedAt:new Date().toISOString(),quotedAt:new Date().toISOString()}));
const browser=await puppeteer.launch({headless:true});
try {
    const page=await browser.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await page.evaluateOnNewDocument((seed,v)=>{
        if(!localStorage.getItem('freewallet_portfolio_v1'))localStorage.setItem('freewallet_portfolio_v1',JSON.stringify({version:1,assets:seed,transactions:[]}));
        localStorage.setItem('freewallet_settings','{"apiEnabled":false}');
        localStorage.setItem('freewallet_last_seen_version',v);localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
    },assets,version);
    await page.setRequestInterception(true);
    page.on('request',request=>{void (new URL(request.url()).origin===origin?request.continue():request.abort());});
    for(const width of [320,390,600,1280]){
        await page.setViewport({width,height:900});await page.goto(origin,{waitUntil:'networkidle2'});
        await page.waitForSelector('.portfolio-data-quality');
        assert.equal(await page.$$eval('.portfolio-data-quality',n=>n.length),1);
        assert.ok((await page.$eval('.assets-table',n=>n.textContent))?.includes('Estimado al coste'));
        assert.ok((await page.$eval('.portfolio-summary',n=>n.textContent))?.includes('incluye estimaciones'));
        const ranked=await page.$$eval('.performers__change',nodes=>nodes.map(n=>({text:n.textContent??'',classes:n.className})));
        assert.ok(ranked.some(n=>n.text.startsWith('+')&&n.classes.includes('--positive')));
        for(const item of ranked){if(item.text.startsWith('-'))assert.ok(item.classes.includes('--negative'));if(item.text.startsWith('+'))assert.ok(item.classes.includes('--positive'));}
        await (await page.$('.portfolio-data-quality summary'))!.click();
        assert.ok(await page.$eval('.portfolio-data-quality',n=>(n as HTMLDetailsElement).open));
        assert.ok((await page.$eval('.portfolio-data-quality',n=>n.textContent))?.includes('sin cotización válida'));
        const missing=await page.$('.portfolio-excel-insights__missing summary');assert.ok(missing);await missing.click();
        assert.ok(await page.$eval('.portfolio-excel-insights__missing',n=>(n as HTMLDetailsElement).open));
        await (await page.$('.live-plan__use-weights'))!.click();
        await page.$eval('.live-plan__budget input',n=>{const input=n as HTMLInputElement;const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!;setter.call(input,'1000');input.dispatchEvent(new Event('input',{bubbles:true}));});
        await page.waitForFunction(()=>document.querySelector('.live-plan__use-weights')?.closest('.live-plan')?.textContent?.includes('Plan listo'));
        for(const theme of ['light','dark'])for(const appearance of ['standard','liquid-glass']){
            await page.evaluate((t,a)=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.appearance=a;},theme,appearance);
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`No page overflow at ${width}/${theme}/${appearance}`);
            const layout=await page.$eval('.live-plan__mobile-positions',n=>({visible:getComputedStyle(n).display!=='none',width:n.getBoundingClientRect().width,count:n.children.length}));
            assert.equal(layout.visible,width<=640);assert.equal(layout.count,15);
            if(width<=640){assert.ok(layout.width<width);assert.ok(await page.$$eval('.live-plan__position-main input',nodes=>nodes.every(n=>n.getBoundingClientRect().height>=44)));}
        }
        const group=width<=640?'.live-plan__mobile-positions':'.live-plan__desktop-positions';
        const contributions=await page.$$eval(`${group} ${width<=640?'.live-plan__position-main > div:last-child strong':'tbody tr td:last-child'}`,nodes=>nodes.map(n=>Number((n.textContent??'').replace(/[^\d,.-]/g,'').replaceAll('.','').replace(',','.'))));
        assert.equal(Math.round(contributions.reduce((a,b)=>a+b,0)*100),100000);
        assert.ok(contributions.every(value=>Number.isInteger(value)&&value%50===0));
        assert.ok(await page.$$eval(`${group} ${width<=640?'.live-plan__position-main > div:last-child strong':'tbody tr td:last-child'}`,nodes=>nodes.every(n=>!n.textContent?.includes(','))),'Suggested contributions have no cents');
        await page.$eval('.live-plan__budget input',n=>{const input=n as HTMLInputElement;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'1025');input.dispatchEvent(new Event('input',{bubbles:true}));});
        await page.waitForFunction(()=>document.querySelector('.live-plan__budget')?.closest('.live-plan')?.textContent?.includes('sin asignar'));
        assert.match(await page.$eval('.live-plan__budget',n=>n.closest('.live-plan')?.textContent||''),/Quedan 25\s*€ sin asignar/);
        const roundedSum=await page.$$eval(`${group} ${width<=640?'.live-plan__position-main > div:last-child strong':'tbody tr td:last-child'}`,nodes=>nodes.reduce((sum,n)=>sum+Number((n.textContent??'').replace(/[^\d,.-]/g,'').replaceAll('.','').replace(',','.')),0));
        assert.equal(roundedSum,1000,'A non-multiple budget does not push the plan over budget');
        if(width===390){await (await page.$('.live-plan__position details summary'))!.click();await (await page.$('.live-plan__position'))!.screenshot({path:join(tmpdir(),'freewallet-plan-mobile-quality.png')});await (await page.$('.portfolio-data-quality'))!.screenshot({path:join(tmpdir(),'freewallet-data-quality.png')});}
    }
    // A negative result in the best ranking must stay negative, too.
    await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('freewallet_portfolio_v1')!);p.assets.forEach((a:{purchasePrice:number;currentPrice:number})=>a.currentPrice=a.purchasePrice*.9);localStorage.setItem('freewallet_portfolio_v1',JSON.stringify(p));});
    await page.reload({waitUntil:'networkidle2'});
    assert.ok(await page.$$eval('.performers--best .performers__change',nodes=>nodes.every(n=>n.classList.contains('performers__change--negative'))));
    await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('freewallet_portfolio_v1')!);p.assets.push({...p.assets[0],id:'synthetic-additional-lot',quantity:1,purchaseDate:'2026-02-01'});localStorage.setItem('freewallet_portfolio_v1',JSON.stringify(p));});
    await page.reload({waitUntil:'networkidle2'});
    await page.$eval('.portfolio-excel-insights__tabs button:last-child',n=>(n as HTMLButtonElement).click());
    const lots=await page.$$eval('.portfolio-excel-insights__control-row',nodes=>nodes.map(n=>n.textContent));
    assert.ok(lots.some(s=>s?.includes('Lotes adicionales del mismo activo')&&s.endsWith('1')));
    assert.ok(lots.some(s=>s?.includes('Registros con identificador duplicado')&&s.endsWith('0')));
    const target=await page.$('.live-plan__desktop-positions input');assert.ok(target);await target.focus();await page.keyboard.down('Control');await page.keyboard.press('A');await page.keyboard.up('Control');await page.keyboard.press('Backspace');
    assert.equal(await target.evaluate(n=>(n as HTMLInputElement).value),'');
    await page.reload({waitUntil:'networkidle2'});
    assert.equal(await page.$eval('.live-plan__desktop-positions input',n=>(n as HTMLInputElement).value),'','Empty objectives must remain empty after reload');
    assert.deepEqual(errors,[]);console.log('PASS: 15 positions, ranking signs, estimated labels, quality panel, N/D explanations, responsive plan and exact €1,000 allocation in all themes.');
} finally { await browser.close(); }
