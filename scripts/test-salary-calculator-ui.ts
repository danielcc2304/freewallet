import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import puppeteer, { type Page } from 'puppeteer';

const origin = process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5196';
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const errors: string[] = [];
async function fieldId(page: Page, label: string) {
    const id = await page.$$eval('.salary-calc label', (nodes, text) => nodes.find(n => n.textContent === text)?.getAttribute('for'), label);
    assert.ok(id, `Missing field ${label}`); return id;
}
async function setNumber(page: Page, label: string, value: string) {
    const id = await fieldId(page, label);
    await page.evaluate((id, value) => {
        const input = document.getElementById(id) as HTMLInputElement;
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, id, value);
}
async function select(page: Page, label: string, value: string) {
    const id = await fieldId(page, label); await page.select(`[id="${id}"]`, value);
}
async function clickText(page: Page, selector: string, text: string) {
    await page.$$eval(selector, (nodes, text) => {
        const node = nodes.find(n => n.textContent?.includes(text)); if (!node) throw new Error(`Missing ${text}`); (node as HTMLElement).click();
    }, text);
}
try {
    const page = await browser.newPage(); page.on('pageerror', e => errors.push(String(e)));
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.evaluateOnNewDocument(version => {
        localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
        localStorage.setItem('freewallet_last_seen_version', version);
        localStorage.setItem('freewallet-dashboard-notice-dismissed', '1');
    }, version);
    await page.setRequestInterception(true);
    page.on('request', r => { const u = new URL(r.url()); void (u.origin === origin || ['data:', 'blob:'].includes(u.protocol) ? r.continue() : r.abort()); });
    await page.setViewport({ width: 1440, height: 1100 });
    await page.goto(`${origin}/academy/salary-calculator`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('[data-testid="salary-monthly-net"]');
    assert.match(await page.$eval('[data-testid="salary-monthly-net"]', n => n.textContent!), /1\.?927,00/);
    assert.match(await page.$eval('[data-testid="salary-annual-net"]', n => n.textContent!), /23\.124,00/);
    assert.match(await page.$eval('[data-testid="salary-withholding-rate"]', n => n.textContent!), /16,42/);
    assert.equal(await page.$$eval('.salary-calc details[open]', nodes => nodes.length), 0, 'Advanced questions start collapsed');
    const originalTax = await page.$eval('[data-testid="salary-final-tax"]', n => n.textContent);
    await select(page, '¿Dónde tienes tu residencia fiscal?', 'cataluna');
    assert.notEqual(await page.$eval('[data-testid="salary-final-tax"]', n => n.textContent), originalTax);
    assert.match(await page.$eval('[data-testid="salary-withholding-rate"]', n => n.textContent!), /16,42/);
    await clickText(page, '.salary-calc__segmented button', '14 pagas');
    assert.match(await page.$eval('[data-testid="salary-monthly-net"]', n => n.textContent!), /1\.?628,50/);
    assert.match(await page.$eval('[data-testid="salary-annual-net"]', n => n.textContent!), /23\.124,00/);
    await clickText(page, '.salary-calc button', 'Comparar escenario');
    const firstScenario = await page.$eval('.salary-calc__scenario-grid article', n => n.textContent);
    await setNumber(page, '¿Cuál es tu sueldo bruto anual?', '50000');
    await clickText(page, '.salary-calc button', 'Comparar escenario');
    assert.equal(await page.$eval('.salary-calc__scenario-grid article', n => n.textContent), firstScenario);
    await setNumber(page, '¿Cuál es tu sueldo bruto anual?', '');
    await page.waitForSelector('.salary-calc [role="alert"]');
    assert.equal(await page.$('[data-testid="salary-monthly-net"]'), null, 'Empty gross does not silently become zero');
    assert.equal(await page.$$eval('.salary-calc__scenario-grid article', nodes => nodes.length), 2);
    await setNumber(page, '¿Cuál es tu sueldo bruto anual?', '30000');
    await clickText(page, '.salary-calc button', 'Restablecer ejemplo');
    await clickText(page, '.salary-calc summary', 'Tu situación personal y familiar');
    await clickText(page, '.salary-calc button', 'Añadir descendiente');
    await page.waitForSelector('.salary-calc__person');
    assert.match(await page.$eval('[data-testid="salary-withholding-rate"]', n => n.textContent!), /15,66/);
    await clickText(page, '.salary-calc button', 'Quitar descendiente');
    await clickText(page, '.salary-calc summary', 'Ajustes de la declaración');
    await setNumber(page, 'Aportación a plan de pensiones individual al año', '1500');
    assert.match(await page.$eval('[data-testid="salary-withholding-rate"]', n => n.textContent!), /16,42/);
    assert.notEqual(await page.$eval('[data-testid="salary-final-tax"]', n => n.textContent), originalTax);
    await select(page, '¿Dónde tienes tu residencia fiscal?', 'navarra');
    await page.waitForSelector('.salary-calc [role="alert"]');
    await clickText(page, '.salary-calc summary', 'Ajustes de nómina');
    await setNumber(page, 'Retención de IRPF de tu nómina', '15');
    await page.waitForSelector('[data-testid="salary-monthly-net"]');
    assert.equal(await page.$('[data-testid="salary-final-tax"]'), null, 'Foral income tax is not fabricated from common-territory scales');
    assert.match(await page.$eval('[data-testid="salary-monthly-net"]', n => n.textContent!), /1\.?962,50/);
    // Exercise the CSV through its real click without an external request.
    await page.evaluate(() => { (window as typeof window & { salaryExport?: string }).salaryExport = ''; HTMLAnchorElement.prototype.click = function () { (window as typeof window & { salaryExport?: string }).salaryExport = this.download; }; });
    await clickText(page, '.salary-calc button', 'Descargar desglose');
    assert.equal(await page.evaluate(() => (window as typeof window & { salaryExport?: string }).salaryExport), 'freewallet-sueldo-neto-2026.csv');
    // Route is reachable from both the calculators hub and Tools sidebar.
    await page.goto(`${origin}/academy/calculators`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.calculators__grid a[href="/academy/salary-calculator"]');
    assert.ok(await page.$('.sidebar a[href="/academy/salary-calculator"]'));
    await page.click('.calculators__grid a[href="/academy/salary-calculator"]');
    await page.waitForSelector('.salary-calc');
    for (const width of [320, 390, 768, 1440]) {
        await page.setViewport({ width, height: 1000 });
        for (const theme of ['dark', 'light']) for (const appearance of ['standard', 'liquid-glass']) {
            await page.evaluate((theme, appearance) => { document.documentElement.dataset.theme = theme; document.documentElement.dataset.appearance = appearance; }, theme, appearance);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Overflow ${width}/${theme}/${appearance}`);
            assert.ok(await page.$$eval('.salary-calc input[type=number], .salary-calc select, .salary-calc button', nodes => nodes.every(n => n.getBoundingClientRect().height === 0 || n.getBoundingClientRect().height >= 44)), 'Touch targets at least 44px');
        }
    }
    assert.ok(await page.$$eval('.salary-calc input:not([type=checkbox]), .salary-calc select', nodes => nodes.every(n => (n as HTMLInputElement).labels?.length)), 'Every control has an accessible name');
    const saved = await page.evaluate(() => Object.keys(localStorage).filter(k => /salary|irpf/.test(k)));
    assert.deepEqual(saved, [], 'Sensitive salary/family answers are not persisted');
    await page.evaluate(() => { localStorage.setItem('freewallet_theme_mode', 'dark'); localStorage.setItem('freewallet_appearance_mode', 'liquid-glass'); });
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('[data-testid="salary-monthly-net"]');
    await page.setViewport({ width: 1440, height: 1150 });
    await page.screenshot({ path: '/tmp/freewallet-irpf-desktop.png' });
    await page.setViewport({ width: 390, height: 844 });
    await page.screenshot({ path: '/tmp/freewallet-irpf-mobile.png', fullPage: true });
    await page.$eval('.salary-calc__hero', n => n.scrollIntoView({ behavior: 'instant', block: 'start' }));
    await page.evaluate(() => window.scrollBy({ top: -65, behavior: 'instant' }));
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await page.screenshot({ path: '/tmp/freewallet-irpf-mobile-results.png' });
    assert.deepEqual(errors, []);
    console.log('PASS: salary calculator navigation, payroll/declaration distinction, 12/14 payments, family questions, empty values, foral safeguards, scenario immutability, CSV download, privacy, mobile/desktop and all themes. Screenshots saved in /tmp/freewallet-irpf-*.png.');
} finally { await browser.close(); }
