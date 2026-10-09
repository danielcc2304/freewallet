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
    await page.evaluateOnNewDocument(version => {
        if (!localStorage.getItem('freewallet_portfolio_v1')) localStorage.setItem('freewallet_portfolio_v1', JSON.stringify({ version: 1, assets: [], transactions: [] }));
        localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
        localStorage.setItem('freewallet_last_seen_version', version);
        localStorage.setItem('freewallet-dashboard-notice-dismissed', '1');
    }, version);
    await page.setRequestInterception(true);
    page.on('request', request => void (new URL(request.url()).origin === origin ? request.continue() : request.abort()));
    async function field(label: string, value?: string) {
        const id = await page.$$eval('.input__label', (labels, label) => labels.find(element => element.textContent === label)!.getAttribute('for')!, label);
        const selector = `[id="${id}"]`;
        if (value !== undefined) {
            await page.$eval(selector, input => (input as HTMLInputElement).select());
            await page.focus(selector);
            await page.keyboard.press('Backspace');
            if (value) await page.type(selector, value);
        }
        return selector;
    }
    const asset = () => page.evaluate(() => JSON.parse(localStorage.getItem('freewallet_portfolio_v1')!).assets[0]);
    await page.goto(`${origin}/add`, { waitUntil: 'networkidle2' });
    await page.type('.form-group--search input', 'TESTCASH');
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent?.includes('Añadir manualmente')));
    await page.$$eval('button', buttons => buttons.find(button => button.textContent?.includes('Añadir manualmente'))!.click());
    await page.select('#asset-type', 'cash');
    await field('Nombre del activo', 'Cuenta remunerada');
    await field('Saldo en euros', '1000');
    const tae = await field('TAE de la cuenta (%)', '-1');
    assert.equal(await page.$eval(tae, input => (input as HTMLInputElement).checkValidity()), false);
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
    console.log('PASS: manual cash account, optional TAE, negative validation, persistence, edit to zero and removal; balance unchanged.');
} finally { await browser.close(); }
