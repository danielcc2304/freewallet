import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer';

const origin = process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5177';
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const now = Date.parse('2026-10-07T12:00:00Z');
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const asset = { id: 'open', symbol: 'SYNTHETIC', name: 'Synthetic portfolio', type: 'fund', quantity: 1, purchasePrice: 1000, currentPrice: 1790, currency: 'EUR', purchaseDate: '2025-12-31' };
const transactions = [
    { id: 'old-buy', assetId: 'removed', assetSymbol: 'REMOVED', assetName: 'Removed synthetic position', assetType: 'stock', type: 'buy', date: '2026-01-01', quantity: 1, price: 10, total: 10, createdAt: '2026-01-01' },
    { id: 'old-delete', assetId: 'removed', assetSymbol: 'REMOVED', assetName: 'Removed synthetic position', assetType: 'stock', type: 'delete', date: '2026-01-02', quantity: 1, createdAt: '2026-01-02' },
];
const evolution = 'Mes,Valor Total,Capital Inicial,Capital Aportado\n2025 Dic,1000,1000,0\n2026 Ene,1050,1000,0\n2026 Feb,1100,1000,0\n2026 Mar,1150,1000,0\n2026 Abr,1200,1000,0\n2026 May,1250,1000,0\n2026 Jun,1300,1000,0\n2026 Jul,1400,1000,0\n2026 Ago,1500,1000,0\n2026 Sept,1760,1000,200';
const daily = 'Fecha,Valor portfolio,Flujo neto,Tipo de dato\n2026-10-04,1770,0,Diario\n2026-10-05,1780,0,Diario\n2026-10-06,1790,0,Diario';
const comparison = 'Año,Mes,Periodo,Rentabilidad Cartera (%),Rentabilidad MSCI World (%),Cartera Acum (%),MSCI Acum (%)\n'
    + ['2025,Dic,2025 Dic,0,0,0,0', ...['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sept'].map((month,i) => `2026,${month},2026 ${month},0,0,${i+1},${(i+1)*2}`)].join('\n');
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const errors: string[] = [];
try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(String(error)));
    await page.setViewport({ width: 390, height: 900 });
    // Use browser source text so tsx's function-name helpers do not cross realms.
    await page.evaluateOnNewDocument(`Date = new Proxy(Date, {
        construct(target, args) { return Reflect.construct(target, args.length ? args : [${now}]); },
        get(target, key) { return key === 'now' ? function() { return ${now}; } : Reflect.get(target, key); }
    });`);
    await page.evaluateOnNewDocument((data) => {
        if(localStorage.getItem('freewallet_portfolio_v1'))return;
        localStorage.setItem('freewallet_portfolio_v1', JSON.stringify({ version: 1, assets: [data.asset], transactions: data.transactions }));
        localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
        localStorage.setItem('freewallet_last_seen_version', data.version);
        localStorage.setItem('freewallet-dashboard-notice-dismissed', '1');
        localStorage.setItem('freewallet_portfolio_csv_evolution_raw', data.evolution);
        localStorage.setItem('freewallet_portfolio_csv_daily_raw', data.daily);
        localStorage.setItem('freewallet_portfolio_csv_comparison_raw', data.comparison);
        localStorage.setItem('freewallet_portfolio_csv_workbook_file', 'synthetic-monthly-history.xlsx');
    }, { asset, transactions, evolution, daily, comparison, version });
    await page.setRequestInterception(true);
    page.on('request', request => { void (async () => {
        const url = new URL(request.url());
        if (url.origin === origin || url.protocol === 'data:' || url.protocol === 'blob:') await request.continue();
        else await request.abort();
    })().catch(error => errors.push(String(error))); });
    await page.goto(origin, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.portfolio-summary');
    const before = await page.evaluate(() => localStorage.getItem('freewallet_portfolio_v1'));
    for (const [tab, expected, date] of [['Diario', '10,00', ''], ['7 días', '30,00', ''], ['Mensual', '90,00', '31/8/2026'], ['3 Meses', '290,00', '30/6/2026'], ['YTD', '590,00', ''], ['Todo', '590,00', '']]) {
        await page.$$eval('.portfolio-summary__tab', (buttons, label) => (buttons.find(button => button.textContent === label) as HTMLElement).click(), tab);
        const cards = await page.$$eval('.portfolio-summary__grid .metric-card', elements => elements.map(el => ({ title: el.querySelector('.metric-card__title')!.textContent, value: el.querySelector('.metric-card__value')!.textContent })));
        assert.match(cards[0].value!, /1\.?000,00/);
        assert.match(cards[1].value!, /1\.?790,00/);
        assert.equal(cards[3].value, 'No disponible', 'An unrecorded sale cannot turn into a realized zero');
        assert.equal(cards[4].value, 'No disponible');
        assert.ok(cards[5].value!.includes(expected), `${tab}: ${cards[5].value}`);
        if (date) {
            assert.equal(cards[5].title, `Cambio desde ${date}`);
            assert.match(await page.$eval('.portfolio-summary__dates', el => el.textContent || ''), /con cierre mensual/);
            assert.ok(await page.$eval('.portfolio-summary__dates', (el, date) => el.textContent?.includes(date), date));
        }
        assert.ok(await page.$eval('.portfolio-summary', el => el.scrollWidth <= el.clientWidth));
    }
    await page.click('.portfolio-summary__calculation summary');
    assert.match(await page.$eval('.portfolio-summary__calculation', el => el.textContent || ''), /Eliminar una posición no registra su venta/);
    assert.equal(await page.evaluate(() => localStorage.getItem('freewallet_portfolio_v1')), before, 'Changing period must not alter the ledger');
    await page.$$eval('.portfolio-excel-insights__tabs button', buttons => (buttons.find(button => button.textContent?.includes('Benchmark')) as HTMLElement).click());
    await page.$$eval('.portfolio-excel-insights__periods button', buttons => (buttons.find(button => button.textContent === 'YTD') as HTMLElement).click());
    await page.waitForSelector('.portfolio-excel-insights__benchmark-portfolio');
    assert.match(await page.$eval('.portfolio-excel-insights__panel', el => el.textContent || ''), /Cierres mensuales/);
    assert.match(await page.$eval('.portfolio-excel-insights__benchmark-portfolio', el => el.textContent || ''), /58,66%/);
    const path = await page.$eval('.portfolio-excel-insights__panel .recharts-line-curve', el => el.getAttribute('d') || '');
    assert.equal((path.match(/L/g) || []).length, 10, 'Nine closed months and one provisional October point, instead of a daily October burst');
    await page.$eval('.portfolio-excel-insights__panel', el => el.scrollIntoView({behavior:'instant',block:'center'}));
    const bounds = await page.$eval('.portfolio-excel-insights__panel .recharts-xAxis .recharts-cartesian-axis-line', el => {
        const r = el.getBoundingClientRect(); return {x:r.right-1,y:r.top-50};
    });
    await page.mouse.move(bounds.x,bounds.y);
    await page.waitForFunction(() => document.querySelector('.recharts-tooltip-wrapper')?.textContent?.includes('N/D'));
    assert.match(await page.$eval('.recharts-tooltip-wrapper', el => el.textContent || ''), /MSCI World.*N\/D/);
    if (process.env.FREEWALLET_BENCHMARK_SCREENSHOT) await page.screenshot({path:process.env.FREEWALLET_BENCHMARK_SCREENSHOT});
    const archive=await page.evaluate(()=>localStorage.getItem('freewallet_history_archive_v1'));
    assert.ok(archive,'Legacy import is converted to an independent archive');
    await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('freewallet_portfolio_csv_') || key==='freewallet_workbook_link')localStorage.removeItem(key);});
    await page.reload({waitUntil:'networkidle2'});
    await page.$$eval('.portfolio-summary__tab',buttons=>(buttons.find(button=>button.textContent==='YTD') as HTMLElement).click());
    assert.match(await page.$eval('.portfolio-summary__grid .metric-card:last-child',el=>el.textContent || ''),/590,00/);
    await page.$$eval('.portfolio-excel-insights__tabs button',buttons=>(buttons.find(button=>button.textContent?.includes('Benchmark')) as HTMLElement).click());
    await page.$$eval('.portfolio-excel-insights__periods button',buttons=>(buttons.find(button=>button.textContent==='YTD') as HTMLElement).click());
    assert.match(await page.$eval('.portfolio-excel-insights__benchmark-portfolio',el=>el.textContent || ''),/58,66%/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('freewallet_history_archive_v1')),archive);
    assert.equal(await page.evaluate(()=>localStorage.getItem('freewallet_portfolio_v1')),before);
    assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(key=>key.startsWith('freewallet_portfolio_csv_'))),false,'Dashboard does not recreate or read a spreadsheet');
    // A new portfolio builds the same metrics from verified snapshots alone.
    await page.evaluate(async data => {
        const modulePath='/src/services/portfolioPerformance.ts';
        const {normalizePortfolioTransactions,portfolioLedgerKey}=await import(modulePath);
        const newAsset={...data.asset,purchaseDate:'2026-10-05',currentPrice:1100};
        const ledger=normalizePortfolioTransactions([newAsset],[]);
        localStorage.removeItem('freewallet_history_archive_v1');
        localStorage.setItem('freewallet_portfolio_v1',JSON.stringify({version:1,assets:[newAsset],transactions:[]}));
        localStorage.setItem('freewallet_history',JSON.stringify([
            {date:'2026-10-05T18:00:00Z',value:1000,invested:1000},
            {date:'2026-10-06T18:00:00Z',value:1100,invested:1000},
        ].map(point=>({...point,source:'quotes-v2',ledgerKey:portfolioLedgerKey(ledger,point.date)}))));
    },{asset});
    await page.reload({waitUntil:'networkidle2'});
    await page.$$eval('.portfolio-summary__tab',buttons=>(buttons.find(button=>button.textContent==='Todo') as HTMLElement).click());
    assert.match(await page.$eval('.portfolio-summary__grid .metric-card:last-child',el=>el.textContent || ''),/100,00/);
    assert.match(await page.$eval('.portfolio-summary__grid .metric-card:last-child',el=>el.textContent || ''),/10\.00%/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('freewallet_history_archive_v1')),null,'A new portfolio needs no imported archive');
    assert.deepEqual(errors, []);
    console.log('Portfolio periods UI passed: monthly and quarterly gains from imported closes, actual dates, available daily/weekly/YTD, independent missing realized results and unchanged ledger at mobile width.');
} catch (error) {
    console.error({ errors });
    throw error;
} finally { await browser.close(); }
