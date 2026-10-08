import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer';

const origin = process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5196';
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const base = { symbol: 'NXTE.XD', name: 'Nextil', isin: 'ES0126962069', type: 'stock', quantity: 100, purchasePrice: .8, purchaseDate: '2026-01-01', currentPrice: 1.1, currency: 'EUR' };
const assets = [
    { ...base, id: 'first' },
    { ...base, id: 'second', quantity: 200, purchaseDate: '2026-03-01' },
    { ...base, id: 'third', purchaseDate: '2026-05-01' },
    { ...base, id: 'other', name: 'Another company', symbol: 'OTHER', isin: undefined },
];
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.evaluateOnNewDocument((assets, version) => {
        if (!localStorage.getItem('freewallet_portfolio_v1')) localStorage.setItem('freewallet_portfolio_v1', JSON.stringify({ version: 1, assets, transactions: [] }));
        localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
        localStorage.setItem('freewallet_last_seen_version', version);
        localStorage.setItem('freewallet-dashboard-notice-dismissed', '1');
    }, assets, version);
    await page.setRequestInterception(true);
    page.on('request', request => void (new URL(request.url()).origin === origin ? request.continue() : request.abort()));

    for (const width of [320, 390, 1280]) {
        await page.setViewport({ width, height: 900 });
        await page.goto(origin, { waitUntil: 'networkidle2' });
        await page.waitForSelector('tr[data-position-kind="group"]');
        const portfolio = await page.evaluate(() => localStorage.getItem('freewallet_portfolio_v1'));
        await page.$$eval('.portfolio-summary__tab', buttons => (buttons.find(button => button.textContent === 'YTD') as HTMLElement).click());
        await page.type('.assets-table__filters input[type="search"]', 'Nextil');
        await page.select('.assets-table__filters select', 'stock');
        await page.click('.assets-table__column--asset .assets-table__sort');
        if (width < 768) await page.click('.assets-table__mobile-toolbar button[title="Editar y gestionar activos"]');
        await page.click('button[aria-label="Gestionar registros de NXTE.XD"]');
        if (width < 768) await page.click('.assets-table__mobile-toolbar button[title="Ver toda la información"]');

        for (const [operation, exit] of [
            ['Editar NXTE.XD', 'Cancelar'],
            ['Editar NXTE.XD', 'Volver'],
            ['Añadir compra de NXTE.XD', 'Cancelar'],
            ['Registrar venta de NXTE.XD', 'browser-back'],
        ]) {
            await page.$$eval('tr[data-position-kind="lot"]', rows => {
                const row = rows.find(row => row.textContent?.includes('1/3/2026'))!;
                window.scrollTo({ top: window.scrollY + row.getBoundingClientRect().top - 180, behavior: 'instant' });
            });
            const before = await page.evaluate(() => ({ key: history.state.key, y: scrollY }));
            assert.ok(before.y > 300, 'Exercise a genuinely scrolled Dashboard');
            await page.$$eval('tr[data-position-kind="lot"]', (rows, operation) => {
                const row = rows.find(row => row.textContent?.includes('1/3/2026'))!;
                (row.querySelector(`button[aria-label="${operation}"]`) as HTMLElement).click();
            }, operation);
            await page.waitForSelector('.add-investment');
            assert.equal(await page.evaluate(() => scrollY), 0, 'Form starts at the top');
            if (operation.startsWith('Editar')) {
                const id = await page.$$eval('.input__label', labels => labels.find(label => label.textContent === 'Cantidad')!.getAttribute('for')!);
                await page.$eval(`#${id}`, input => (input as HTMLInputElement).select());
                await page.type(`#${id}`, '999');
            }
            if (exit === 'browser-back') await page.goBack({ waitUntil: 'networkidle2' });
            else {
                // A real click also scrolls the form to its footer before cancelling.
                const handle = await page.evaluateHandle(exit => [...document.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === exit)!, exit);
                await handle.asElement()!.click();
                await handle.dispose();
            }
            await page.waitForSelector('tr[data-position-kind="lot"]');
            await page.waitForFunction(y => Math.abs(scrollY - y) <= 2, {}, before.y);
            assert.equal(await page.evaluate(() => history.state.key), before.key, 'Return to the original history entry, without a new Dashboard entry');
            assert.equal(await page.$eval('.assets-table__filters input[type="search"]', input => (input as HTMLInputElement).value), 'Nextil');
            assert.equal(await page.$eval('.assets-table__filters select', input => (input as HTMLSelectElement).value), 'stock');
            assert.equal(await page.$eval('.assets-table__column--asset', cell => cell.getAttribute('aria-sort')), 'descending');
            assert.equal(await page.$eval('.portfolio-summary__tab--active', button => button.textContent), 'YTD');
            assert.equal(await page.$$eval('tr[data-position-kind="lot"]', rows => rows.length), 3);
            assert.ok(await page.$('.assets-table__table--show-actions'));
            if (width < 768) assert.ok(await page.$('.assets-table__table--show-details'));
            assert.equal(await page.evaluate(() => localStorage.getItem('freewallet_portfolio_v1')), portfolio, 'Cancelled edits never change holdings or transactions');
        }
    }

    // Directly opening /add has no Dashboard snapshot and must still cancel safely.
    await page.goto(`${origin}/add`, { waitUntil: 'networkidle2' });
    const cancel = await page.evaluateHandle(() => [...document.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === 'Cancelar')!);
    await cancel.asElement()!.click();
    await page.waitForSelector('.dashboard');
    assert.equal(new URL(page.url()).pathname, '/');
    assert.equal(await page.evaluate(() => scrollY), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: cancel/top-back/browser-back restore original Dashboard scroll, history entry, period, filters, sorting, expanded lots and mobile controls; direct /add fallback works; cancelled edits preserve portfolio data.');
} finally {
    await browser.close();
}
