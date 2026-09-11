import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
const browser = await puppeteer.launch({ headless: true });
try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5181/add', { waitUntil: 'networkidle2' });
    const input = await page.$('input[placeholder*="AAPL"]');
    assert.ok(input, 'Asset search input exists');
    await input.type('apple');
    await page.waitForSelector('.search-results__item', { timeout: 10000 });
    await page.click('.search-results__item');
    await page.waitForFunction(() => document.querySelector('.current-price-banner__value')?.textContent?.includes('EUR'), { timeout: 20000 });
    console.log('Single-click Apple quote:', await page.$eval('.current-price-banner__value', e => e.textContent));
    assert.equal(await page.$('.quote-warning'), null);

    await page.evaluate(() => {
        localStorage.setItem('freewallet_assets', JSON.stringify([{
            id: 'fund-test', symbol: 'IE00BYX5NX33', isin: 'IE00BYX5NX33',
            name: 'Fidelity MSCI World Index Fund EUR P Acc', type: 'fund',
            purchasePrice: 12.78, currentPrice: 14.23, previousClose: 14.20,
            quantity: 7, purchaseDate: '2025-01-02', currency: 'EUR',
            lastQuoteAt: new Date().toISOString(), quoteSource: 'Finect'
        }]));
        localStorage.setItem('freewallet_transactions', '[]');
        localStorage.setItem('freewallet_history', JSON.stringify([
            { date: '2026-09-09T12:00:00Z', value: 98, invested: 89.46 },
            { date: '2026-09-10T12:00:00Z', value: 99, invested: 89.46 }
        ]));
    });
    await page.goto('http://127.0.0.1:5181/', { waitUntil: 'networkidle2' });
    assert.ok((await page.evaluate(() => document.body.innerText)).includes('Auto · 1 min'));
    await page.waitForSelector('.portfolio-excel-insights');
    const insightTabs = await page.$$eval('.portfolio-excel-insights__tabs button', buttons => buttons.map(button => button.textContent));
    assert.deepEqual(insightTabs, ['Evolución', 'Benchmark', 'Asignación', 'Riesgo', 'Controles']);
    await page.click('.portfolio-excel-insights__tabs button:nth-child(2)');
    await page.waitForSelector('.portfolio-excel-insights__panel .recharts-wrapper');
    await page.click('.portfolio-excel-insights__tabs button:nth-child(5)');
    assert.ok((await page.$eval('.portfolio-excel-insights', element => element.textContent || '')).includes('Controles vivos'));
    await page.click('.assets-table__table tbody tr');
    await page.waitForSelector('.asset-detail');
    await page.waitForFunction(() => document.querySelector('.asset-detail__chart-container .recharts-wrapper') || document.querySelector('.asset-detail__chart-container .chart-overlay.error-state'), { timeout: 35000 });
    await page.evaluate(() => [...document.querySelectorAll('.period-btn')].find(el => el.textContent === 'YTD')?.click());
    await page.waitForFunction(() => [...document.querySelectorAll('.period-btn')].some(el => el.textContent === 'YTD' && el.classList.contains('active')));
    const layout = await page.$eval('.modal__content', el => ({ clientWidth: el.clientWidth, scrollWidth: el.scrollWidth, title: document.querySelector('.asset-detail__name')?.textContent, metrics: document.querySelectorAll('.metric-card').length }));
    console.log('Fund detail:', layout);
    assert.equal(layout.scrollWidth, layout.clientWidth, 'Fund detail must not overflow horizontally');
    assert.ok(layout.metrics >= 9, 'Fund detail should expose the full fund sheet');
    const cardsAreSeparate = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('.card')];
        const plan = cards.find(card => card.textContent?.includes('Plan y control de cartera'));
        const movements = cards.find(card => card.textContent?.includes('Últimos movimientos'));
        return !!plan && !!movements && plan !== movements;
    });
    assert.equal(cardsAreSeparate, true, 'Plan and latest transactions need separate cards');
} finally { await browser.close(); }
