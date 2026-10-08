import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer';
import { normalizePortfolioTransactions, portfolioLedgerKey } from '../src/services/portfolioPerformance';
import type { Asset, PortfolioTransaction } from '../src/types/types';

const origin = process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5197';
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const now = Date.parse('2026-10-08T15:00:00Z');
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const base: Asset = { id: 'first', symbol: 'SYNTHETIC', name: 'Synthetic stock', type: 'stock', quantity: 1, purchasePrice: 500, currentPrice: 592.5, currency: 'EUR', purchaseDate: '2025-12-31' };
const assets = [base, { ...base, id: 'second' }];
const buy: PortfolioTransaction = { id: 'test-buy', assetId: 'removed', assetSymbol: 'REMOVED', assetName: 'Removed test record', assetType: 'stock', type: 'buy', date: '2026-10-08', quantity: 1, price: 10, total: 10, createdAt: '2026-10-08T10:00:00Z' };
const deletion: PortfolioTransaction = { ...buy, id: 'test-delete', type: 'delete', createdAt: '2026-10-08T10:01:00Z' };
const transactions = [buy, deletion];
const date = '2026-10-08T12:00:00Z';
const history = [{ date, value: 1205, invested: 1000, source: 'quotes-v2', ledgerKey: portfolioLedgerKey(normalizePortfolioTransactions(assets, transactions), date) }];
const evolution = 'Mes,Valor Total,Capital Inicial,Capital Aportado\n2025 Dic,1000,1000,0\n2026 Ene,1010,1000,0\n2026 Feb,1020,1000,0\n2026 Mar,1030,1000,0\n2026 Abr,1040,1000,0\n2026 May,1050,1000,0\n2026 Jun,1060,1000,0\n2026 Jul,1070,1000,0\n2026 Ago,1080,1000,0\n2026 Sept,1180,1000,0';
const daily = 'Fecha,Valor portfolio,Flujo neto,Tipo de dato\n2026-10-05,1181,0,Diario\n2026-10-06,1183,0,Diario\n2026-10-07,1185,0,Diario';
const comparison = 'Año,Mes,Periodo,Rentabilidad Cartera (%),Rentabilidad MSCI World (%),Cartera Acum (%),MSCI Acum (%)\n'
    + ['2025,Dic,2025 Dic,0,0,0,0', ...['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sept'].map((month, i) => `2026,${month},2026 ${month},0,0,${i + 1},${(i + 1) * 2}`)].join('\n');
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const errors: string[] = [];
try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(String(error)));
    await page.evaluateOnNewDocument(`Date = new Proxy(Date, {
        construct(target, args) { return Reflect.construct(target, args.length ? args : [${now}]); },
        get(target, key) { return key === 'now' ? function() { return ${now}; } : Reflect.get(target, key); }
    });`);
    await page.evaluateOnNewDocument(data => {
        if (localStorage.getItem('freewallet_portfolio_v1')) return;
        localStorage.setItem('freewallet_portfolio_v1', JSON.stringify({ version: 1, assets: data.assets, transactions: data.transactions }));
        localStorage.setItem('freewallet_history', JSON.stringify(data.history));
        localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
        localStorage.setItem('freewallet_last_seen_version', data.version);
        localStorage.setItem('freewallet-dashboard-notice-dismissed', '1');
        localStorage.setItem('freewallet_portfolio_csv_evolution_raw', data.evolution);
        localStorage.setItem('freewallet_portfolio_csv_daily_raw', data.daily);
        localStorage.setItem('freewallet_portfolio_csv_comparison_raw', data.comparison);
        localStorage.setItem('freewallet_portfolio_csv_workbook_file', 'synthetic-ytd.xlsx');
    }, { assets, transactions, history, evolution, daily, comparison, version });
    await page.setRequestInterception(true);
    page.on('request', request => void (new URL(request.url()).origin === origin ? request.continue() : request.abort()));
    await page.goto(origin, { waitUntil: 'networkidle2' });
    // Link the synthetic workbook using the production identity, then mount the
    // Dashboard with the unresolved live interval following its imported close.
    await page.evaluate(async () => {
        const modulePath = '/src/services/portfolioHistoryArchive.ts';
        const { linkPortfolioHistory } = await import(modulePath);
        linkPortfolioHistory(['first', 'second', 'removed']);
        const archive=JSON.parse(localStorage.getItem('freewallet_history_archive_v1')!);
        archive.benchmarkNavs=[['2026-09-30',200],['2026-10-05',202],['2026-10-06',204],['2026-10-07',206]].map(([date,nav])=>({date,nav,currency:'EUR',isin:'IE00BYX5NX33',source:'synthetic fixture'}));
        localStorage.setItem('freewallet_history_archive_v1',JSON.stringify(archive));
    });
    const before = await page.evaluate(() => localStorage.getItem('freewallet_portfolio_v1'));
    for (const width of [320, 390, 1280]) {
        await page.setViewport({ width, height: 1000 });
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForSelector('.portfolio-summary');
        await page.$$eval('.portfolio-summary__tab', buttons => (buttons.find(button => button.textContent === 'YTD') as HTMLElement).click());
        const lastCard = await page.$eval('.portfolio-summary__grid .metric-card:last-child', card => card.textContent || '');
        assert.match(lastCard, /Cambio YTD hasta 7\/10\/2026/);
        assert.match(lastCard, /185,00/);
        assert.match(lastCard, /18[,.]50%/);
        assert.match(await page.$eval('.portfolio-summary__calculation', element => element.textContent || ''), /YTD pendiente de completar/);
        await page.$$eval('.portfolio-excel-insights__tabs button', buttons => (buttons.find(button => button.textContent?.includes('Benchmark')) as HTMLElement).click());
        await page.$$eval('.portfolio-excel-insights__periods button', buttons => (buttons.find(button => button.textContent === 'YTD') as HTMLElement).click());
        const benchmarkCard = await page.$eval('.portfolio-excel-insights__benchmark-portfolio', element => element.textContent || '');
        assert.match(benchmarkCard, /YTD hasta 7 oct 26/);
        assert.match(benchmarkCard, /18,50?%/);
        assert.match(await page.$eval('.portfolio-excel-insights__panel', element => element.textContent || ''), /Datos pendientes de verificar desde 8 oct 26/);
        assert.ok(await page.$('.portfolio-excel-insights__panel .recharts-line-curve'), 'Verified history remains visible in the comparison');
        for(const label of ['1D','7D','1M','3M','Todo']){
            await page.$$eval('.portfolio-excel-insights__periods button',(buttons,label)=>(buttons.find(button=>button.textContent===label) as HTMLElement).click(),label);
            assert.doesNotMatch(await page.$eval('.portfolio-excel-insights__benchmark-portfolio',el=>el.textContent || ''),/N\/D/);
            assert.match(await page.$eval('.portfolio-excel-insights__benchmark-portfolio',el=>el.textContent || ''),/hasta 7 oct 26/);
            assert.ok(await page.$('.portfolio-excel-insights__panel .recharts-line-curve'),label+' retains its verified graph');
            const benchmarkValues=await page.$eval('.portfolio-excel-insights__benchmark-kpis',el=>el.textContent || '');
            assert.doesNotMatch(benchmarkValues,/N\/D/,label+' compares real NAVs at the same verified endpoints');
        }
        assert.equal(await page.evaluate(() => localStorage.getItem('freewallet_portfolio_v1')), before, 'Showing the last verified YTD never changes the ledger');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    // A lagging benchmark must not silently remove the newer portfolio endpoint.
    await page.evaluate(() => {
        const archive=JSON.parse(localStorage.getItem('freewallet_history_archive_v1')!);
        archive.benchmarkNavs=archive.benchmarkNavs.filter((p:{date:string})=>p.date!=='2026-10-07');
        localStorage.setItem('freewallet_history_archive_v1',JSON.stringify(archive));
    });
    await page.reload({waitUntil:'networkidle2'});
    await page.$$eval('.portfolio-excel-insights__tabs button',buttons=>(buttons.find(b=>b.textContent?.includes('Benchmark')) as HTMLElement).click());
    await page.$$eval('.portfolio-excel-insights__periods button',buttons=>(buttons.find(b=>b.textContent==='YTD') as HTMLElement).click());
    await page.$eval('.portfolio-excel-insights__panel',el=>el.scrollIntoView({behavior:'instant',block:'center'}));
    const bounds=await page.$eval('.portfolio-excel-insights__panel .recharts-xAxis .recharts-cartesian-axis-line',el=>{
        const r=el.getBoundingClientRect();return {x:r.right-1,y:r.top-50};
    });
    await page.mouse.move(bounds.x,bounds.y);
    await page.waitForFunction(()=>document.querySelector('.recharts-tooltip-wrapper')?.textContent?.includes('N/D'));
    const tooltip=await page.$eval('.recharts-tooltip-wrapper',el=>el.textContent || '');
    assert.match(tooltip,/7 oct 26/);
    assert.match(tooltip,/Tu cartera.*18,50?%/,'The endpoint agrees with the verified summary even when the NAV lags');
    assert.match(tooltip,/MSCI World.*N\/D/,'The missing NAV is explicit instead of copied from October 6');
    // Classifying an erroneous record is explicit, reversible and never edits
    // the original ledger. The imported return remains on its verified date.
    await page.setViewport({width:390,height:1000});
    await page.$$eval('.portfolio-summary__calculation summary',summaries=>(summaries.find(s=>s.textContent?.includes('Ver motivo')) as HTMLElement).click());
    await page.click('button::-p-text(Era un registro erróneo)');
    await page.waitForSelector('.confirm-dialog');
    await page.click('button::-p-text(Confirmar corrección)');
    await page.waitForFunction(()=>[...document.querySelectorAll('.portfolio-summary .metric-card__value')].filter(el=>el.textContent==='No disponible').length===0);
    const correctedCards=await page.$$eval('.portfolio-summary .metric-card',cards=>Object.fromEntries(cards.map(c=>[c.querySelector('.metric-card__title')?.textContent,c.querySelector('.metric-card__value')?.textContent])));
    assert.match(correctedCards['Resultado realizado']!,/^0,00/);assert.match(correctedCards['Resultado total']!,/185,00/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('freewallet_portfolio_v1')),before);
    await page.reload({waitUntil:'networkidle2'});
    assert.equal(await page.$$eval('.portfolio-summary .metric-card__value',els=>els.filter(el=>el.textContent==='No disponible').length),0,'Correction survives reload');
    await page.click('.portfolio-summary__calculation summary::-p-text(Registros corregidos)');
    await page.click('button::-p-text(Deshacer corrección)');
    await page.waitForFunction(()=>[...document.querySelectorAll('.portfolio-summary .metric-card__value')].filter(el=>el.textContent==='No disponible').length===2);
    assert.equal(await page.evaluate(()=>localStorage.getItem('freewallet_portfolio_v1')),before);
    assert.deepEqual(errors, []);
    console.log('PASS: unresolved buy/delete preserves the same explicitly dated YTD in summary and benchmark, with verified chart and unchanged ledger at mobile/desktop widths.');
} finally { await browser.close(); }
