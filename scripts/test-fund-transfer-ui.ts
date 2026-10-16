import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import puppeteer, { type Page } from 'puppeteer';

const origin = process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5191';
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const source = { id: 'source', symbol: 'LU0034353002', isin: 'LU0034353002', name: 'Fondo de origen', type: 'fund', quantity: 100, purchasePrice: 50, currentPrice: 60, purchaseDate: '2026-01-01', currency: 'EUR' };
const browser = await puppeteer.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const field = async (page: Page, label: string, value: string) => {
    const handle = await page.evaluateHandle(label => [...document.querySelectorAll('.fund-transfer__field')].find(node => node.querySelector('span')?.textContent === label)?.querySelector('input'), label);
    const input = handle.asElement(); assert.ok(input);
    await input.focus(); await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control'); await page.keyboard.type(value);
    await handle.dispose();
};
const button = async (page: Page, text: string) => page.$$eval('.fund-transfer button', (nodes, text) => { const node = nodes.find(n => n.textContent?.trim() === text) as HTMLButtonElement; if (!node || node.disabled) throw new Error('Button unavailable: ' + text); node.click(); }, text);
const state = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('freewallet_portfolio_v1')!));
try {
    for (const width of [390, 1440]) {
        const context = await browser.createBrowserContext();
        const page = await context.newPage(); page.setDefaultTimeout(60000); page.setDefaultNavigationTimeout(60000);
        const errors: string[] = []; page.on('pageerror', error => errors.push(String(error)));
        await page.setViewport({ width, height: 900 });
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
        await page.evaluateOnNewDocument((asset, version) => {
            if (!localStorage.getItem('freewallet_portfolio_v1')) localStorage.setItem('freewallet_portfolio_v1', JSON.stringify({ version: 1, assets: [asset], transactions: [] }));
            localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
            localStorage.setItem('freewallet_last_seen_version', version);
            localStorage.setItem('freewallet-dashboard-notice-dismissed', '1');
        }, source, version);
        await page.setRequestInterception(true);
        page.on('request', request => { void (async () => {
            const url = new URL(request.url());
            if (url.pathname === '/__finect/api/v4/search') {
                await request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ type: 'fund', url: '/fondos-inversion/fixture-destination', entity: { isin: 'IE00BYX5NX33', alias: 'fixture-destination' } }] }) });
            } else if (url.pathname === '/__finect/site/fondos-inversion/fixture-destination') {
                const model = { name: 'Fidelity fixture EUR', alias: 'fixture-destination', isin: 'IE00BYX5NX33', currency: { code: 'EUR' }, lastQuote: { price: 25, datetime: '2026-10-15T00:00:00Z' } };
                await request.respond({ status: 200, contentType: 'text/html', body: `<script>window.INITIAL_STATE="${encodeURIComponent(JSON.stringify({ fund: { fund: { model } } }))}";</script>` });
            } else if (url.origin === origin) await request.continue();
            else await request.abort();
        })().catch(error => { errors.push(String(error)); if (!request.isInterceptResolutionHandled()) void request.abort(); }); });
        await page.goto(origin, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.assets-table');
        if (width < 768) await page.click('.assets-table__mobile-toolbar button[title="Editar y gestionar activos"]');
        const open = async () => {
            await page.waitForSelector(`button[aria-label="Traspasar ${source.symbol}"]`);
            await page.$eval(`button[aria-label="Traspasar ${source.symbol}"]`, node => (node as HTMLElement).click());
            await page.waitForSelector('.fund-transfer');
        };
        await open();
        assert.equal(await page.$eval('.fund-transfer__destination-mode button[aria-pressed="true"]', n => n.textContent), 'Nuevo fondo', 'Single-fund portfolios can transfer to a new fund');
        if (width === 390) {
            // Enable the explicit lookup without starting unrelated auto refreshes.
            await page.evaluate(() => localStorage.setItem('freewallet_settings', '{"apiEnabled":true}'));
            await field(page, 'ISIN del nuevo fondo', 'IE00BYX5NX33');
            await button(page, 'Buscar fondo por ISIN');
            await page.waitForFunction(() => [...document.querySelectorAll('.fund-transfer__field')].find(n => n.querySelector('span')?.textContent === 'Nombre del fondo')?.querySelector('input')?.value === 'Fidelity fixture EUR');
            assert.ok(await page.$eval('.fund-transfer', n => n.textContent?.includes('Fondo encontrado.')));
            await page.evaluate(() => localStorage.setItem('freewallet_settings', '{"apiEnabled":false}'));
            await field(page, 'ISIN del nuevo fondo', '');
        }
        await field(page, 'ISIN del nuevo fondo', 'IE00BYX5NX33');
        await field(page, 'Nombre del fondo', 'Fidelity MSCI World · EUR Acc');
        await field(page, 'Importe estimado (€)', '1200');
        assert.equal(await page.$eval('.fund-transfer button[type="submit"]', n => (n as HTMLButtonElement).disabled), true, 'A new fund needs a price');
        await field(page, 'Precio real de venta del origen (€/participación)', '61');
        await field(page, 'Precio real de compra del destino (€/participación)', '25');
        assert.equal(await page.$eval('.fund-transfer button[type="submit"]', n => (n as HTMLButtonElement).disabled), false);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
        await page.screenshot({ path: `/tmp/freewallet-traspaso-nuevo-${width}.png` });
        await button(page, 'Cancelar');
        assert.equal((await state(page)).assets.length, 1, 'Cancel never creates the destination');
        await open();
        await field(page, 'ISIN del nuevo fondo', source.isin);
        await page.waitForSelector('.fund-transfer__error');
        assert.equal(await page.$eval('.fund-transfer button[type="submit"]', n => (n as HTMLButtonElement).disabled), true);
        await field(page, 'ISIN del nuevo fondo', 'IE00BYX5NX33');
        await field(page, 'Nombre del fondo', 'Fidelity MSCI World · EUR Acc');
        await field(page, 'Importe estimado (€)', '1200');
        await field(page, 'Precio real de venta del origen (€/participación)', '61');
        await field(page, 'Precio real de compra del destino (€/participación)', '25');
        await button(page, 'Registrar traspaso');
        await page.waitForFunction(() => !document.querySelector('.fund-transfer'));
        let saved = await state(page);
        assert.equal(saved.assets.length, 2);
        assert.equal(saved.assets.find((a: { id: string }) => a.id === source.id).quantity, 80);
        const target = saved.assets.find((a: { id: string }) => a.id !== source.id);
        assert.equal(target.quantity, 48.8);
        assert.ok(Math.abs(target.purchasePrice * target.quantity - 1000) < 1e-8);
        assert.equal(saved.transactions.filter((t: { type: string }) => t.type === 'transfer').length, 1);
        await open();
        assert.equal(await page.$eval('.fund-transfer__destination-mode button[aria-pressed="true"]', n => n.textContent), 'Fondo existente');
        await button(page, 'Nuevo fondo');
        await field(page, 'ISIN del nuevo fondo', 'IE00BYX5NX33');
        await button(page, 'Usar fondo existente');
        assert.equal(await page.$eval('.fund-transfer select', n => (n as HTMLSelectElement).value), target.id);
        await page.click('.fund-transfer__full input');
        await field(page, 'Precio real de venta del origen (€/participación)', '60');
        await field(page, 'Precio real de compra del destino (€/participación)', '25');
        await button(page, 'Registrar traspaso');
        await page.waitForFunction(() => !document.querySelector('.fund-transfer'));
        saved = await state(page);
        assert.equal(saved.assets.length, 1);
        assert.ok(Math.abs(saved.assets[0].quantity - 240.8) < 1e-8);
        assert.equal(saved.transactions.length, 3, 'Only one opening basis and two internal transfers');
        await page.reload({ waitUntil: 'networkidle2' });
        assert.equal((await state(page)).assets.length, 1, 'Transfer persists across reload');
        assert.deepEqual(errors, []);
        console.log(`PASS transfer UI ${width}`);
        await context.close();
    }
    console.log('PASS UI 390/1440: single-fund portfolio, new destination, manual EUR price, same-fund and duplicate validation, cancel, partial/full transfer, existing destination and persistence.');
} finally { await browser.close(); }
