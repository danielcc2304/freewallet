import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer';
const origin = process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5244';
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.evaluateOnNewDocument((version) => {
        if (!localStorage.getItem('freewallet_portfolio_v1'))
            localStorage.setItem(
                'freewallet_portfolio_v1',
                JSON.stringify({ version: 1, assets: [], transactions: [] }),
            );
        localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
        localStorage.setItem('freewallet_last_seen_version', version);
        localStorage.setItem('freewallet-dashboard-notice-dismissed', '1');
    }, version);
    await page.setRequestInterception(true);
    page.on(
        'request',
        (request) => void (new URL(request.url()).origin === origin ? request.continue() : request.abort()),
    );
    async function field(label: string, value?: string) {
        const id = await page.$$eval(
            '.input__label',
            (labels, label) => labels.find((element) => element.textContent === label)!.getAttribute('for')!,
            label,
        );
        const selector = `[id="${id}"]`;
        if (value !== undefined) {
            await page.$eval(selector, (input) => (input as HTMLInputElement).select());
            await page.focus(selector);
            await page.keyboard.press('Backspace');
            if (value) await page.type(selector, value);
        }
        return selector;
    }
    const asset = () => page.evaluate(() => JSON.parse(localStorage.getItem('freewallet_portfolio_v1')!).assets[0]);
    await page.goto(`${origin}/add`, { waitUntil: 'networkidle2' });
    assert.equal(await page.$eval('.sidebar__logo-text', n => getComputedStyle(n).backgroundClip), 'text', 'The logo gradient stays clipped to its text');
    await page.type('.form-group--search input', 'TESTCASH');
    await page.waitForFunction(() =>
        [...document.querySelectorAll('button')].some((button) => button.textContent?.includes('Añadir manualmente')),
    );
    await page.$$eval('button', (buttons) =>
        buttons.find((button) => button.textContent?.includes('Añadir manualmente'))!.click(),
    );
    await page.select('#asset-type', 'cash');
    await field('Nombre del activo', 'Cuenta remunerada');
    await field('Saldo en euros', '1000');
    const tae = await field('TAE de la cuenta (%)', '-1');
    assert.equal(await page.$eval(tae, (input) => (input as HTMLInputElement).checkValidity()), false);
    await field('TAE de la cuenta (%)', '2.5');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.dashboard');
    assert.equal((await asset()).cashTae, 2.5);
    assert.equal((await asset()).quantity, 1000);
    assert.equal((await asset()).currentPrice, 1);
    for (const value of ['0', '']) {
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForSelector('button[aria-label="Editar TESTCASH"]');
        await page.click('button[aria-label="Editar TESTCASH"]');
        await page.waitForSelector('.add-investment');
        await field('TAE de la cuenta (%)', value);
        await page.click('button[type="submit"]');
        await page.waitForSelector('.dashboard');
        assert.equal((await asset()).cashTae, value === '' ? undefined : 0);
        assert.equal((await asset()).quantity, 1000);
        assert.equal((await asset()).currentPrice, 1);
    }
    // Search remains a keyboard combobox with a popup that stays inside the form.
    await page.goto(`${origin}/add`, { waitUntil: 'networkidle2' });
    await page.type('.form-group--search input', 'AAPL');
    await page.waitForSelector('[role="listbox"] [role="option"]');
    await page.waitForFunction(() => {
        const list = document.querySelector('[role="listbox"]');
        return list && getComputedStyle(list).position === 'static';
    });
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval('[role="combobox"]', (n) => n.getAttribute('aria-expanded')), 'false');
    assert.equal(await page.$('[role="listbox"]'), null);
    // The direct cash path survives promotion from release and keeps its one-euro valuation.
    await page.goto(`${origin}/add`, { waitUntil: 'networkidle2' });
    await page.click('button[data-entry-mode="cash"]');
    assert.equal(await page.$('#asset-type'), null, 'Direct cash entry needs no instrument type');
    assert.equal(await page.$('#operation-currency'), null, 'Direct cash entry is always in EUR');
    assert.equal(
        await page.$$eval('.input__label', (labels) => labels.some((n) => n.textContent?.includes('Precio de compra'))),
        false,
    );
    await field('Nombre de la cuenta', 'Cuenta rápida');
    await field('Saldo en euros', '1234.56');
    await field('TAE de la cuenta (%)', '2.75');
    await page.click('button[data-entry-mode="cash"]');
    assert.equal(
        await page.$eval(await field('Saldo en euros'), (n) => (n as HTMLInputElement).value),
        '1234.56',
        'Clicking the active mode keeps the draft',
    );
    for (const width of [320, 390, 768, 1280]) {
        await page.setViewport({ width, height: 1000 });
        await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
        for (const theme of ['light', 'dark'])
            for (const appearance of ['standard', 'liquid-glass']) {
                await page.evaluate(
                    (theme, appearance) => {
                        document.documentElement.dataset.theme = theme;
                        document.documentElement.dataset.appearance = appearance;
                    },
                    theme,
                    appearance,
                );
                await page.evaluate(
                    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
                );
                assert.ok(
                    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
                    `Cash entry fits ${width}/${theme}/${appearance}`,
                );
                assert.ok(
                    await page.$$eval(
                        '.investment-entry-mode button,.form-actions button,.add-investment input',
                        (nodes) => nodes.every((n) => n.getBoundingClientRect().height >= 43.5),
                    ),
                    'Cash controls keep mobile touch targets',
                );
            }
    }
    await page.click('button[data-entry-mode="asset"]');
    assert.ok(await page.$('.form-group--search input'));
    await page.click('button[data-entry-mode="cash"]');
    assert.equal(
        await page.$eval(await field('Saldo en euros'), (n) => (n as HTMLInputElement).value),
        '',
        'Changing entry type starts a clean draft',
    );
    await field('Nombre de la cuenta', 'Cuenta rápida');
    await field('Saldo en euros', '1234.56');
    await field('TAE de la cuenta (%)', '2.75');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.dashboard');
    const quick = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('freewallet_portfolio_v1')!).assets.find(
            (a: { name: string }) => a.name === 'Cuenta rápida',
        ),
    );
    assert.equal(quick.symbol, 'CASH-EUR');
    assert.equal(quick.type, 'cash');
    assert.equal(quick.currency, 'EUR');
    assert.equal(quick.quantity, 1234.56);
    assert.equal(quick.purchasePrice, 1);
    assert.equal(quick.currentPrice, 1);
    assert.equal(quick.cashTae, 2.75);
    // Manual entry is available without entering a search term first.
    await page.goto(`${origin}/add`, { waitUntil: 'networkidle2' });
    await page.$$eval('button', (nodes) => nodes.find((n) => n.textContent?.trim() === 'Añadir manualmente')!.click());
    await field('Ticker o ISIN', 'MANUAL-TEST');
    await field('Nombre del activo', 'Activo manual de prueba');
    await field('Precio de compra (EUR)', '128.5');
    await field('Cantidad', '2');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.dashboard');
    const manual = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('freewallet_portfolio_v1')!).assets.find(
            (a: { symbol: string }) => a.symbol === 'MANUAL-TEST',
        ),
    );
    assert.equal(manual.purchasePrice, 128.5);
    assert.equal(manual.quantity, 2);
    console.log(
        'PASS: existing/manual cash and direct cash entry, optional TAE, edits, clean mode switching, draft preservation, one-euro valuation, 16 responsive/theme states and manual stock entry without a search.',
    );
} finally {
    await browser.close();
}
