import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const fixtureAssets = [
    ['Fidelity MSCI World Index Fund EUR P Acc', 'IE00BYX5NX33', 'fund', 10.79, 14.05, 1485.713, [
        { symbol: 'AAPL', name: 'Apple Inc', percentage: 5 },
        { symbol: 'NVDA', name: 'NVIDIA Corp', percentage: 4 },
    ]],
    ['Nueva Expresion Textil SA', 'NXTE.XD', 'stock', 0.45, 1.05, 13965],
    ['Ábaco Renta Fija Mixta Global I FI', 'ES0140072002', 'fund', 8.98, 9.45, 913.0363],
    ['Vanguard Emerging Markets Stock Index Fund EUR Acc', 'IE0031786696', 'fund', 204.62, 315.53, 22.12, [
        { symbol: 'AAPL', name: 'Apple Inc.', percentage: 3 },
        { symbol: 'NVIDIA', name: 'NVIDIA Corporation', percentage: 2 },
    ]],
    ['Myinvestor Value C FI', 'ES0165243025', 'fund', 1.10, 1.3743, 5074.2216, [
        { symbol: 'AAPL', name: 'Apple Inc', percentage: 1 },
    ]],
    ['DWS Floating Rate Notes LC', 'LU0034353002', 'fund', 94.14, 94.44, 63.7375],
    ['Cobas Internacional D FI', 'ES0119199018', 'fund', 294.97, 302.12, 16.8704],
    ['Carmignac Pf Credit A EUR Acc', 'LU1623762843', 'fund', 151.39, 157.83, 31.443],
    ['EC SICAV - EverCapital Investments UCITS I Fund Class Retail', 'LU1953238794', 'fund', 149.81, 158.97, 17.878],
    ['Pictet-China Index P EUR', 'LU0625737910', 'fund', 153.36, 129.83, 17.3098],
    ['Azvalor Internacional FI', 'ES0112611001', 'fund', 346.70, 364.26, 5.624],
    ['AMPER, S.A.', 'AMP.MC', 'stock', 3.65, 4.44, 406],
    ['Bitcoin USD', 'BTC-USD', 'crypto', 40000, 66576.49, 0.0145],
    ['OBRASCON HUARTE LAIN, S.A.', 'OHLA.MC', 'stock', 0.37, 0.36, 1850],
].map(([name, symbol, type, purchasePrice, currentPrice, quantity, holdings], index) => ({
    id: `asset-${index}`,
    name,
    symbol,
    type,
    purchasePrice: Number(purchasePrice),
    currentPrice: Number(currentPrice),
    purchaseDate: '2026-09-11',
    quantity: Number(quantity),
    currency: 'EUR',
    isin: type === 'fund' ? symbol : undefined,
    lastQuoteAt: new Date().toISOString(),
    quoteSource: type === 'fund' ? 'Finect' : 'Mercado',
    holdings,
}));

const useLiveProviders = process.env.FREEWALLET_LIVE_COMPOSITION === '1';
const assets = useLiveProviders
    ? fixtureAssets.map(({ holdings, ...asset }) => asset)
    : fixtureAssets;

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu'], timeout: 15000 });
try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.evaluateOnNewDocument((fixture) => {
        localStorage.setItem('freewallet_assets', JSON.stringify(fixture.assets));
        localStorage.setItem('freewallet_settings', JSON.stringify({ apiEnabled: fixture.useLiveProviders }));
    }, { assets, useLiveProviders });
    await page.goto(process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 0 });
    await page.waitForSelector('.portfolio-composition', { timeout: 30000 });

    const donutText = await page.$eval('.portfolio-composition .donut-legend', (element) => element.textContent ?? '');
    assert.match(donutText, /Fidelity MSCI World Index Fund/);
    assert.doesNotMatch(donutText, /IE00BYX5NX33/);

    await page.click('.breakdown-toggle__label');
    await page.waitForSelector('.portfolio-composition__consolidated');
    if (useLiveProviders) {
        await page.waitForFunction(() => !document.querySelector('.portfolio-composition__breakdown-status')?.textContent?.includes('Cargando'), { timeout: 30000 });
    }
    const consolidatedText = await page.$eval('.portfolio-composition__consolidated', (element) => element.textContent ?? '');
    assert.match(consolidatedText, /Exposición total consolidada/);
    if (!useLiveProviders) {
        assert.equal(await page.$$eval('.portfolio-composition__exposure-row', (rows) => rows.filter((row) => row.textContent?.includes('Apple Inc')).length), 1);
        const compositionStatus = await page.$eval('.portfolio-composition__breakdown-status', (element) => element.textContent ?? '');
        assert.match(compositionStatus, /exposiciones repetidas sumadas/);
    }

    if (!useLiveProviders) {
        await page.click('.heatmap__item--child');
        await page.waitForSelector('.underlying-detail');
        const modalTitle = await page.$eval('.modal__title', (element) => element.textContent ?? '');
        assert.match(modalTitle, /Apple Inc/);
        assert.doesNotMatch(modalTitle, /Fidelity/);
    } else if (await page.$('.heatmap__item--child')) {
        const childName = await page.$eval('.heatmap__item--child .heatmap__item-symbol', (element) => element.textContent ?? '');
        await page.click('.heatmap__item--child');
        await page.waitForSelector('.underlying-detail');
        const modalTitle = await page.$eval('.modal__title', (element) => element.textContent ?? '');
        assert.ok(modalTitle.includes(childName.slice(0, 10)), `${modalTitle} does not identify ${childName}`);
        await page.click('.modal__close');
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 0, `horizontal overflow: ${overflow}px`);
    await (await page.$('.portfolio-composition'))?.screenshot({ path: 'C:/Users/danie/AppData/Local/Temp/freewallet-portfolio-composition-consolidated.png' });
    console.log(`Portfolio composition UI tests passed: names${useLiveProviders ? ' and live provider breakdown' : ', consolidated overlap and underlying click'} validated at 390px.`);
} finally {
    await browser.close();
}
