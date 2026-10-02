import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import puppeteer from 'puppeteer';
import {NASDAQ_100_HOLDINGS} from '../src/data/nasdaq100Holdings';

const origin=process.env.FREEWALLET_TEST_URL??'http://127.0.0.1:5177';
assert.match(origin,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const assets=process.env.FREEWALLET_REFERENCE_FILE
    ? [...readFileSync(process.env.FREEWALLET_REFERENCE_FILE,'utf8').matchAll(/\['([^']+)', '(fund|stock|crypto)', ([\d.]+), ([\d.]+)\]/g)]
        .map(row=>({id:row[1],symbol:row[1],name:row[1],type:row[2],quantity:Number(row[3]),purchasePrice:Number(row[4]),currentPrice:Number(row[4]),purchaseDate:'2026-01-01',currency:'EUR'}))
    : [{id:'fixture',symbol:'TEST',name:'Synthetic asset',type:'stock',quantity:2,purchasePrice:100,currentPrice:100,purchaseDate:'2026-01-01',currency:'EUR'}];
if(process.env.FREEWALLET_REFERENCE_FILE)assert.equal(assets.length,15);
const browser=await puppeteer.launch({headless:true});
let holdingsFail=false;let quotesFail=false;
const errors:string[]=[];
try{
    const page=await browser.newPage();page.on('pageerror',error=>errors.push(String(error)));
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await page.evaluateOnNewDocument((portfolio,v)=>{
        if(!localStorage.getItem('freewallet_portfolio_v1'))localStorage.setItem('freewallet_portfolio_v1',JSON.stringify(portfolio));
        localStorage.setItem('freewallet_settings',JSON.stringify({apiEnabled:location.pathname==='/market-heatmap'}));localStorage.setItem('freewallet_last_seen_version',v);
        localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
    },{version:1,assets,transactions:[]},version);
    await page.setRequestInterception(true);
    page.on('request',request=>{void(async()=>{
        const url=new URL(request.url());
        if(url.pathname==='/__holdings/ndq'){
            const header='Ticker,Name,Asset Class,Sector,Country,Weight (%)';
            const rows=NASDAQ_100_HOLDINGS.map((item,i)=>`${item.symbol} UW,"${item.name}",Equities,Information Technology,United States,${i===0?9:item.weight}`);
            await request.respond({status:holdingsFail?503:200,contentType:'text/csv',body:[header,...rows].join('\n')});
        }else if(url.pathname.includes('/finance/spark')){
            const symbols=(url.searchParams.get('symbols')??'').split(',');
            await request.respond({status:200,contentType:'application/json',body:JSON.stringify(quotesFail?{}:Object.fromEntries(symbols.map(symbol=>[symbol,{symbol,close:[100,101]}])))});
        }else if(url.pathname.startsWith('/__holdings/')||url.pathname.startsWith('/__market/'))await request.respond({status:503,body:'Isolated fixture'});
        else if(url.origin===origin||url.protocol==='data:'||url.protocol==='blob:')await request.continue();
        else await request.abort();
    })().catch(error=>errors.push(String(error)));});

    for(const width of [320,390,600]){
        await page.setViewport({width,height:900});await page.goto(origin,{waitUntil:'networkidle2'});
        await page.waitForSelector('.assets-table__mobile-toolbar');
        await (await page.$('.assets-table__mobile-toolbar button:nth-child(2)'))!.click();
        await page.waitForSelector('.assets-table__table--show-actions');
        for(const theme of ['light','dark'])for(const appearance of ['standard','liquid-glass']){
            await page.evaluate((t,a)=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.appearance=a;},theme,appearance);
            const controls=await page.$$eval('.assets-table__actions',groups=>groups.map(group=>{
                const buttons=Array.from(group.querySelectorAll('button'));const rects=buttons.map(button=>button.getBoundingClientRect());
                return {count:buttons.length,fit:rects.every(rect=>rect.width>=43.9&&rect.height>=43.9),
                    separated:rects.every((rect,i)=>!i||rect.top>rects[i-1].bottom||rect.left-rects[i-1].right>=11.9),
                    glass:buttons.every(button=>getComputedStyle(button).backgroundImage.includes('linear-gradient')&&getComputedStyle(button).borderTopStyle==='solid')};
            }));
            assert.equal(controls.length,assets.length);
            for(const control of controls){assert.equal(control.count,4);assert.ok(control.fit&&control.separated,`${width}/${theme}/${appearance} actions: ${JSON.stringify(control)}`);if(appearance==='liquid-glass')assert.ok(control.glass);}
            assert.ok(await page.$$eval('.assets-table__mobile-toolbar button',buttons=>buttons.every(button=>button.getBoundingClientRect().height>=43.9)));
        }
        await (await page.$('.assets-table__mobile-toolbar button:first-child'))!.click();
        assert.ok(await page.$('.assets-table__table--show-details'));
        if(width===390)await (await page.$('.assets-table'))!.screenshot({path:join(tmpdir(),'freewallet-dashboard-controls-test.png')});
    }
    await page.goto(`${origin}/academy/bond-calculator`,{waitUntil:'networkidle2'});
    for(const theme of ['light','dark'])for(const appearance of ['standard','liquid-glass']){
        await page.evaluate((t,a)=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.appearance=a;},theme,appearance);
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        const colors=await page.$eval('.result-main-card',node=>({card:getComputedStyle(node).color,value:getComputedStyle(node.querySelector('.result-value')!).color,subtext:getComputedStyle(node.querySelector('p')!).color}));
        assert.equal(colors.value,colors.card,'YTM heading must inherit the card text palette');
        if(theme==='light'&&appearance==='liquid-glass')assert.notEqual(colors.subtext,'rgba(255, 255, 255, 0.95)');
        if(theme==='light')await (await page.$('.result-main-card'))!.screenshot({path:join(tmpdir(),`freewallet-bond-${appearance}-test.png`)});
    }
    await page.goto(`${origin}/market-heatmap`,{waitUntil:'networkidle2'});
    const tab=await page.waitForSelector('button[role="tab"]::-p-text(Nasdaq 100)');assert.ok(tab);await tab.click();
    await page.waitForFunction(()=>document.querySelector('.market-heatmap__index-intro h2')?.textContent==='Nasdaq 100');
    await page.waitForFunction(()=>document.querySelectorAll('.market-heatmap__tile-symbol').length>0);
    const live=await page.evaluate(async()=>{
        const {loadMarketIndexHoldings}=await import('/src/services/marketHeatmapService.ts');
        const {MARKET_HEATMAP_INDEX_BY_ID}=await import('/src/data/marketHeatmapIndices.ts');
        return loadMarketIndexHoldings(MARKET_HEATMAP_INDEX_BY_ID.nasdaq100,new AbortController().signal);
    });
    assert.equal(live.length,101);assert.equal(live[0].weight,9,'Equal-sized holdings must refresh weights instead of keeping the snapshot');
    assert.ok(live.every((item:{symbol:string})=>!item.symbol.includes(' ')));
    holdingsFail=true;
    const fallback=await page.evaluate(async()=>{
        const {loadMarketIndexHoldings}=await import('/src/services/marketHeatmapService.ts');
        const {MARKET_HEATMAP_INDEX_BY_ID}=await import('/src/data/marketHeatmapIndices.ts');
        return loadMarketIndexHoldings(MARKET_HEATMAP_INDEX_BY_ID.nasdaq100,new AbortController().signal);
    });
    assert.equal(fallback.length,101);assert.equal(fallback[0].weight,NASDAQ_100_HOLDINGS[0].weight);
    quotesFail=true;await page.reload({waitUntil:'networkidle2'});
    await page.waitForSelector('.market-heatmap__error');
    for(const theme of ['light','dark'])for(const appearance of ['standard','liquid-glass']){
        await page.evaluate((t,a)=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.appearance=a;},theme,appearance);
        assert.equal(await page.$eval('.market-heatmap__error strong',node=>getComputedStyle(node).color),'rgb(248, 250, 252)');
        assert.equal(await page.$eval('.market-heatmap__error span',node=>getComputedStyle(node).color),'rgb(203, 213, 225)');
    }
    await (await page.$('.market-heatmap__canvas'))!.screenshot({path:join(tmpdir(),'freewallet-heatmap-error-test.png')});
    assert.deepEqual(errors,[]);
    console.log(`PASS: ${assets.length} reference positions; mobile actions in all themes, YTM text, Nasdaq selection/101 holdings/refresh/fallback and readable error. No production writes.`);
}finally{await browser.close();}
