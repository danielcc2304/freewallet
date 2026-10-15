import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import puppeteer from 'puppeteer';
const origin=process.env.FREEWALLET_TEST_URL??'http://127.0.0.1:5186';assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
try{
    page.setDefaultNavigationTimeout(60000);page.setDefaultTimeout(60000);
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    const errors:string[]=[];page.on('pageerror',error=>errors.push(String(error)));
    await page.evaluateOnNewDocument(v=>{localStorage.setItem('freewallet_settings','{"apiEnabled":false}');localStorage.setItem('freewallet_last_seen_version',v);},version);
    await page.setRequestInterception(true);page.on('request',request=>{if(new URL(request.url()).origin===origin)void request.continue();else void request.abort();});
    const click=async(text:string)=>{const selector=`button::-p-text(${text})`;await page.waitForSelector(selector);await page.$eval(selector,element=>element.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));await page.locator(selector).setTimeout(60000).click();};
    const fill=async(selector:string,value:string)=>{const field=await page.waitForSelector(selector);assert.ok(field);await field.focus();await page.keyboard.down('Control');await page.keyboard.press('KeyA');await page.keyboard.up('Control');await page.keyboard.press('Backspace');if(value)await page.keyboard.type(value);};
    const value=(selector:string)=>page.$eval(selector,element=>(element as HTMLInputElement).value);
    const fit=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Horizontal overflow at ${await page.evaluate(()=>innerWidth)}`);
    const themes=async(root:string)=>{
        for(const width of [320,390,768,1280,1440]){
            await page.setViewport({width,height:1000});
            for(const theme of ['light','dark'])for(const appearance of ['standard','liquid-glass']){
                await page.evaluate((t,a)=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.appearance=a;},theme,appearance);
                await page.evaluate(async()=>{await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));await Promise.all(document.getAnimations().filter(animation=>animation.effect?.getComputedTiming().iterations!==Infinity).map(animation=>animation.finished.catch(()=>{})));});await fit();
                const small=await page.$$eval(`${root} button`,buttons=>buttons.filter(button=>button.getBoundingClientRect().width>0&&button.getBoundingClientRect().height<43.5).map(button=>({text:button.textContent,height:button.getBoundingClientRect().height,minHeight:getComputedStyle(button).minHeight,class:button.className})));
                assert.deepEqual(small,[],`Touch targets ${root}/${width}/${theme}/${appearance}`);
            }
            console.log('PASS layout',root,width);
        }
    };
    await page.goto(`${origin}/academy/portfolio`,{waitUntil:'networkidle2'});await page.waitForSelector('.strategy-model');
    assert.equal((await page.$$('.strategy-model')).length,6);assert.equal(await page.$('.model-card__chart'),null,'Compact model catalogue does not render eleven charts');
    await themes('.strategy-page');
    await click('0–3 años');await click('Conservador');
    await page.waitForFunction(()=>document.querySelectorAll('.strategy-model').length===1);
    assert.deepEqual(await page.$$eval('.strategy-model h3',elements=>elements.map(element=>element.textContent)),['Reserva a corto plazo']);
    await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('.strategy-model');
    assert.equal(await page.$eval('button::-p-text(Conservador)',element=>element.getAttribute('aria-pressed')),'true');
    assert.equal((await page.$$('.strategy-model')).length,1);await click('Limpiar filtros');
    await page.click('button[aria-label="Comparar 60/40 clásica"]');await page.click('button[aria-label="Comparar Cartera permanente"]');await page.click('button[aria-label="Comparar Tres fondos indexados"]');
    assert.equal(await page.$eval('button[aria-label="Comparar Barbell ilustrativa"]',element=>(element as HTMLButtonElement).disabled),true);
    assert.equal((await page.$$('.strategy-comparison thead th')).length,4);
    await page.setViewport({width:320,height:1000});await page.evaluate(async()=>{await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));await Promise.all(document.getAnimations().filter(animation=>animation.effect?.getComputedTiming().iterations!==Infinity).map(animation=>animation.finished.catch(()=>{})));});await fit();await click('Limpiar comparación');
    await page.$$eval('.strategy-model',cards=>{const card=cards.find(card=>card.querySelector('h3')?.textContent==='All-Weather ilustrativa');(card?.querySelector('button') as HTMLButtonElement)?.click();});
    await page.waitForFunction(()=>(document.querySelector('#strategy-bonds') as HTMLInputElement)?.value==='55');
    assert.equal(await value('#strategy-gold'),'7.5');assert.equal(await value('#strategy-commodities'),'7.5');
    await fill('#strategy-capital','20000');await fill('#strategy-stocks','40');
    assert.equal(await page.$('a.strategy-button--primary'),null,'Invalid totals cannot be sent to the simulator');
    await click('Ajustar proporcionalmente al 100%');
    const normalized=await page.$$eval('.strategy-weight input',elements=>elements.map(element=>Number((element as HTMLInputElement).value)));
    assert.ok(Math.abs(normalized.reduce((sum,n)=>sum+n,0)-100)<1e-8);
    await click('Restaurar modelo');assert.equal(await value('#strategy-stocks'),'30');
    await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('#strategy-bonds');assert.equal(await value('#strategy-bonds'),'55');assert.equal(await value('#strategy-capital'),'20000');
    for(const width of [390,1440]){await page.setViewport({width,height:1000});await page.evaluate(()=>{document.documentElement.dataset.theme='light';document.documentElement.dataset.appearance='liquid-glass';window.scrollTo({top:0,behavior:'instant'});});await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(animation=>animation.effect?.getComputedTiming().iterations!==Infinity).map(animation=>animation.finished.catch(()=>{})));});await page.screenshot({path:`/tmp/freewallet-strategy-updated-${width}.png`});}
    await page.click('a.strategy-button--primary');await page.waitForSelector('#allocation-bonds');
    assert.equal(await value('#allocation-stocks'),'30');assert.equal(await value('#allocation-bonds'),'55');assert.equal(await value('#allocation-gold'),'7.5');assert.equal(await value('#allocation-commodities'),'7.5');assert.equal(await value('#allocation-capital'),'20000');
    assert.match(await page.$eval('[data-testid="scenario-return"]',element=>element.textContent??''),/3,2/);
    await themes('.alloc-sim');
    await fill('#allocation-stocks','');assert.equal(await page.$eval('[data-testid="scenario-return"]',element=>element.textContent),'—');await fill('#allocation-stocks','30');
    await fill('#shock-stocks','-101');assert.equal(await page.$eval('[data-testid="scenario-stress"]',element=>element.textContent),'—');await fill('#shock-stocks','-35');
    await fill('input[aria-label="Volatilidad anual de Renta fija"]','12');
    await page.focus('#allocation-correlation');await page.keyboard.press('End');
    await page.waitForFunction(()=>document.querySelector('[data-testid="scenario-volatility"]')?.textContent==='15%');
    await page.select('#allocation-stress','inflation');assert.equal(await value('#shock-commodities'),'25');assert.equal(await value('#shock-gold'),'-5');
    await click('Restablecer ejemplo 60/40');
    assert.equal(await value('#allocation-stocks'),'60');assert.equal(await value('#allocation-bonds'),'40');assert.equal(await value('#allocation-crypto'),'0');
    assert.equal(await page.$eval('[data-testid="scenario-return"]',element=>element.textContent),'+4,4%');assert.equal(await page.$eval('[data-testid="scenario-volatility"]',element=>element.textContent),'11,82%');
    for(const width of [390,1440]){await page.setViewport({width,height:1000});await page.evaluate(()=>{document.documentElement.dataset.theme='light';document.documentElement.dataset.appearance='liquid-glass';window.scrollTo({top:0,behavior:'instant'});});await page.evaluate(async()=>{await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));await Promise.all(document.getAnimations().filter(animation=>animation.effect?.getComputedTiming().iterations!==Infinity).map(animation=>animation.finished.catch(()=>{})));});await page.screenshot({path:`/tmp/freewallet-strategy-simulator-${width}.png`});}
    await page.click('.alloc-sim__back');await page.waitForSelector('#strategy-stocks');assert.equal(await value('#strategy-stocks'),'60');assert.equal(await value('#strategy-bonds'),'40');
    assert.deepEqual(errors,[]);
    console.log('PASS: conservative short-term filters, touch targets, theme layouts, comparison limits, persistent weights/capital, explicit normalization, complete handoff, editable assumptions, validation, true 60/40 reset and return navigation.');
}catch(error){console.error('Strategy UI failure',await page.evaluate(()=>({url:location.href,body:document.body.innerText.slice(-1800)})));await page.screenshot({path:'/tmp/freewallet-strategy-ui-failure.png'});throw error;}finally{await browser.close();}
