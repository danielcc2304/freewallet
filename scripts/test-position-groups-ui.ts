import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import puppeteer from 'puppeteer';

const origin=process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5196';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const base={symbol:'NXTE.XD',name:'Nextil',isin:'ES0126962069',type:'stock',quantity:100,purchasePrice:.8,purchaseDate:'2026-01-01',currentPrice:1.1,previousClose:1,currency:'EUR',quotedAt:'2026-10-08T11:30:00Z'};
const assets=[{...base,id:'first'},{...base,id:'second',quantity:200,purchasePrice:.9,purchaseDate:'2026-03-01'},{...base,id:'third',purchasePrice:1,purchaseDate:'2026-05-01'},{...base,id:'other',symbol:'OTHER',name:'Another company',isin:undefined,quantity:1,purchasePrice:40,currentPrice:50}];
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const errors:string[]=[];
try{
    const page=await browser.newPage();page.on('pageerror',e=>errors.push(String(e)));
    await page.evaluateOnNewDocument((assets,version)=>{
        if(!localStorage.getItem('freewallet_portfolio_v1'))localStorage.setItem('freewallet_portfolio_v1',JSON.stringify({version:1,assets,transactions:[]}));
        localStorage.setItem('freewallet_settings','{"apiEnabled":false}');localStorage.setItem('freewallet_last_seen_version',version);
        localStorage.setItem('freewallet-dashboard-notice-dismissed','1');
    },assets,version);
    await page.setRequestInterception(true);
    page.on('request',r=>void(new URL(r.url()).origin===origin?r.continue():r.abort()));
    for(const width of [320,390,1280]){
        await page.setViewport({width,height:1000});await page.goto(origin,{waitUntil:'networkidle2'});
        await page.waitForSelector('tr[data-position-kind="group"]');
        const original=await page.evaluate(()=>localStorage.getItem('freewallet_portfolio_v1'));
        assert.equal(await page.$$eval('.assets-table tbody tr',rows=>rows.length),2);
        assert.match(await page.$eval('tr[data-position-kind="group"]',el=>el.textContent || ''),/440,00/);
        assert.match(await page.$eval('.assets-table',el=>el.textContent || ''),/2 activos · 4 registros/);
        await page.click('tr[data-position-kind="group"] .assets-table__lots-toggle');
        assert.equal(await page.$$eval('tr[data-position-kind="lot"]',rows=>rows.length),3);
        assert.equal(await page.$eval('.assets-table__lots-toggle',el=>el.getAttribute('aria-expanded')),'true');
        await page.click('tr[data-position-kind="group"] .assets-table__open');
        await page.waitForSelector('.asset-detail__group-note');
        const cells=await page.$$eval('.asset-detail__position-grid > div',nodes=>Object.fromEntries(nodes.map(n=>[n.querySelector('span')?.textContent,n.querySelector('strong')?.textContent])));
        assert.equal(cells.Cantidad,'400');assert.match(cells['Precio medio'] || '',/0,9/);
        assert.match(cells['Capital invertido'] || '',/360/);assert.match(cells['Valor actual'] || '',/440/);
        assert.match(cells.Resultado || '',/80/);
        const purchases=await page.$$eval('.asset-detail__purchases tbody tr',rows=>rows.map(row=>[...row.querySelectorAll('td')].map(cell=>cell.textContent)));
        assert.equal(purchases.length,3);
        assert.match(purchases[1][1] || '',/200/);
        assert.match(purchases[1][3] || '',/180/);
        await page.keyboard.press('Escape');
        assert.equal(await page.$('.assets-table__group-toggle'),null,'Grouping is permanent; no view toggle is shown');
        await page.click('tr[data-position-kind="group"] .assets-table__lots-toggle');
        assert.equal(await page.$$eval('.assets-table tbody tr',rows=>rows.length),2,'Collapsing hides purchases without ungrouping the asset');
        await page.click('tr[data-position-kind="group"] .assets-table__lots-toggle');
        assert.equal(await page.$$eval('tr[data-position-kind="lot"]',rows=>rows.length),3);
        const ranks=await page.$$eval('.performers--best .performers__symbol',nodes=>nodes.map(n=>n.textContent));
        assert.equal(ranks.filter(s=>s==='NXTE.XD').length,1,'Rankings must consolidate repeated purchases too');
        assert.equal(await page.evaluate(()=>localStorage.getItem('freewallet_portfolio_v1')),original,'Expanding purchases does not rewrite any record');
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Viewport must not overflow');
    }
    // Group-level management exposes real records; trade/edit targets never use synthetic IDs.
    await page.click('tr[data-position-kind="group"] button[aria-label="Gestionar registros de NXTE.XD"]');
    for(const [label,key] of [['Añadir compra de NXTE.XD','dcaAsset'],['Registrar venta de NXTE.XD','sellAsset'],['Editar NXTE.XD','editAsset']]){
        await page.$$eval('tr[data-position-kind="lot"]', (rows,{label})=>{
            const row=rows.find(r=>r.textContent?.includes('200'))!;
            (row.querySelector(`button[aria-label="${label}"]`) as HTMLElement).click();
        },{label});
        await page.waitForFunction(()=>location.pathname==='/add');
        assert.equal(await page.evaluate(key=>history.state.usr[key].id,key),'second');
        assert.equal(await page.evaluate(key=>history.state.usr[key].quantity,key),200);
        await page.goBack({waitUntil:'networkidle2'});
        await page.waitForSelector('tr[data-position-kind="group"]');
        await page.click('tr[data-position-kind="group"] button[aria-label="Gestionar registros de NXTE.XD"]');
    }
    await page.$$eval('tr[data-position-kind="lot"]', rows=>{
        const row=rows.find(r=>r.textContent?.includes('1,00') && r.textContent?.includes('1/5/2026'))!;
        (row.querySelector('button[aria-label="Eliminar NXTE.XD"]') as HTMLElement).click();
    });
    await page.waitForSelector('[role="dialog"]');
    await page.$$eval('[role="dialog"] button',buttons=>(buttons.find(b=>b.textContent==='Eliminar') as HTMLElement).click());
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('freewallet_portfolio_v1')!).assets.length===3);
    const ids=await page.evaluate(()=>JSON.parse(localStorage.getItem('freewallet_portfolio_v1')!).assets.map((a:{id:string})=>a.id));
    assert.deepEqual(ids,['first','second','other'],'Deleting one original record preserves the other purchases');
    assert.deepEqual(errors,[]);
    console.log('PASS: grouped desktop/mobile rows, weighted detail, consolidated rankings, original edit/buy/sell IDs, one-record deletion and unchanged storage during grouping.');
}finally{await browser.close();}
