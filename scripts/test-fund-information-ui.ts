import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer';

const origin = process.env.FREEWALLET_TEST_URL!;
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const isin = 'IE00BYX5NX33';
const model = {
    name: 'Fondo de prueba · clase exacta', alias: 'fixture-fund', isin, srri: 5,
    managementCompany: { name: 'Gestora de prueba' }, category: { name: 'RV Global' },
    attributes: { indexed: true }, benchmarks: [{ name: 'MSCI World' }],
    classes: [{ name: 'Clase EUR acumulación', alias: 'fixture-fund', isin,
        currency: { code: 'EUR', name: 'Euro' }, fees: { ter: { value: 0 }, mgr: { value: 0.12 } },
        lastQuote: { price: 123.45, percentChange: 0, change: 0, datetime: '2026-10-21T00:00:00Z' },
        annualizedPerformance: { period: 'M36', type: 'annualized', value: 8.4 } }],
    stats: { performance: { periods: [{ period: 'YTD', type: 'accumulated', value: 0 }] },
        standardDeviation: [{ period: 'M36', value: 12.3 }], maxDrawdown: [{ period: 'M36', value: -15 }] },
    breakdown: [{ type: 'asset-allocation', items: [{ drawer: 'Renta variable', values: { long: 95 } }, { drawer: 'Liquidez', values: { long: 5 } }] }],
    portfolio: { holdings: [{ name: 'Empresa de prueba con un nombre suficientemente largo', weight: 3.25 }] },
    documents: [{ type: 'KID', url: 'https://example.org/fund-kid.pdf', language: 'es', updated: '2026-10-01' }],
    description: 'Descripción de prueba del fondo.', strategy: 'Primera línea de estrategia.\nSegunda línea de estrategia.',
};
const encodedState = encodeURIComponent(JSON.stringify({ fund: { fund: { model } } }));
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
    const page = await browser.newPage();
    page.setDefaultTimeout(60000); page.setDefaultNavigationTimeout(60000);
    const errors: string[] = []; let requests = 0;
    page.on('pageerror', error => errors.push(String(error)));
    await page.evaluateOnNewDocument(version => {
        localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
        localStorage.setItem('freewallet_last_seen_version', version);
    }, version);
    await page.setRequestInterception(true);
    page.on('request', async request => {
        const url = new URL(request.url());
        if (url.origin === origin && url.pathname.startsWith('/__finect/api/v4/search')) {
            requests++;
            const data = url.searchParams.get('q') === isin ? [{ type: 'fund', entity: { isin, alias: 'fixture-fund' }, url: 'https://www.finect.com/fondos-inversion/fixture-fund' }] : [];
            await request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) });
        } else if (url.origin === origin && url.pathname.startsWith('/__finect/site/')) {
            await request.respond({ status: 200, contentType: 'text/html', body: `<script>window.INITIAL_STATE="${encodedState}";</script>` });
        } else if ((url.origin === origin && !/^\/(?:api|__market|__holdings)(?:\/|$)/.test(url.pathname)) || ['data:', 'blob:'].includes(url.protocol)) await request.continue();
        else await request.abort();
    });
    await page.goto(origin + '/academy/fund-information', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.fund-info__empty-state');
    await page.click('.fund-info__sample button');
    assert.equal(await page.$eval('.fund-info__form input', element => (element as HTMLInputElement).value), isin);
    await page.click('.fund-info__form button[type=submit]');
    await page.waitForSelector('.fund-info__results');
    assert.equal(requests, 1);
    const metrics = await page.$$eval('.fund-info__metric', nodes => nodes.map(node => node.textContent));
    assert.ok(metrics.some(value => /123,45/.test(value ?? '')));
    assert.ok(metrics.some(value => /Rentabilidad YTD0%/.test(value ?? '')), 'Zero return remains valid data');
    assert.ok(metrics.some(value => /Variación diaria0%/.test(value ?? '')));
    assert.match(await page.$eval('.fund-info__fee-grid', node => node.textContent ?? ''), /TER0%/);
    assert.equal(await page.$$eval('.fund-info__fee-item', nodes => nodes.length), 2, 'Missing fees are omitted, zero fees retained');
    assert.equal(await page.$$eval('.fund-info__data-item', nodes => nodes.length), 10);
    assert.equal(await page.$eval('.fund-info__document', node => node.getAttribute('href')), 'https://example.org/fund-kid.pdf');
    assert.match(await page.$eval('.fund-info__stats-table', node => node.textContent ?? ''), /12,3%/);
    assert.equal(await page.$$eval('.fund-info__breakdown-item', nodes => nodes.length), 2);
    await page.focus('.fund-info__risk-trigger');
    await page.waitForFunction(() => { const tooltip = document.querySelector('.fund-info [role=tooltip]'); return tooltip && getComputedStyle(tooltip).visibility === 'visible'; });
    await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
    const measurements: Record<string, unknown> = {};
    for (const width of [320, 390, 768, 1440]) {
        await page.setViewport({ width, height: 1000 });
        for (const theme of ['light', 'dark']) for (const appearance of ['standard', 'liquid-glass']) {
            await page.evaluate((theme, appearance) => { document.documentElement.dataset.theme = theme; document.documentElement.dataset.appearance = appearance; }, theme, appearance);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}/${theme}/${appearance}: no page overflow`);
            assert.ok(await page.$eval('.fund-info__table-wrapper', node => node.scrollWidth <= node.clientWidth + 1), 'History table fits without horizontal scrolling');
            assert.equal(await page.$eval('.fund-info__form input', node => (node as HTMLInputElement).labels?.length), 1);
            measurements[`${width}/${theme}/${appearance}`] = await page.$$eval('.fund-info :is(h1,h2,h3,p,span,strong,input,button,section,div,a,table,th,td,small,code)', nodes => nodes.filter(node => node.getBoundingClientRect().width && node.getBoundingClientRect().height).map(node => {
                const style = getComputedStyle(node);
                return { tag: node.tagName, hook: [...node.classList].filter(name => !name.startsWith('tw:') && name !== 'calculator-panel').join(' '),
                    display: style.display, font: style.fontSize, weight: style.fontWeight, line: style.lineHeight,
                    padding: style.padding, margin: style.margin, gap: style.gap, radius: style.borderRadius,
                    borderWidth: style.borderWidth, borderColor: style.borderColor, background: style.backgroundColor, color: style.color };
            }));
        }
    }
    writeFileSync(`/tmp/freewallet-fund-sheet-${process.env.FREEWALLET_VISUAL_PHASE === 'before' ? 'before' : 'after'}.json`, JSON.stringify(measurements));
    await page.setViewport({ width: 390, height: 844 });
    await page.$eval('.fund-info__risk-trigger', node => (node as HTMLElement).blur());
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: '/tmp/freewallet-fund-information-mobile.png', fullPage: true });
    const setIsin = async (value: string) => page.$eval('.fund-info__form input', (element, value) => {
        const input = element as HTMLInputElement;
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
    await setIsin('IE00BYX5NX32'); await page.click('.fund-info__form button[type=submit]');
    await page.waitForFunction(() => document.querySelector('.fund-info__form')?.textContent?.includes('ISIN válido'));
    assert.equal(requests, 1, 'Invalid checksum is rejected without an API request');
    await setIsin('LU0329355670'); await page.click('.fund-info__form button[type=submit]');
    await page.waitForSelector('.fund-info__alert');
    assert.equal(await page.$('.fund-info__results'), null);
    assert.match(await page.$eval('.fund-info__alert', node => node.textContent ?? ''), /No se ha encontrado/);
    assert.deepEqual(errors, []);
    console.log('PASS fund sheet: exact class, NAV, zero/missing values, fees, history, composition, documents, accessible risk tooltip, invalid/not-found ISINs and 16 responsive/theme combinations.');
} finally { await browser.close(); }
