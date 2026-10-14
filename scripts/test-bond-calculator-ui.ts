import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer';
const origin = process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5183';
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const values = {
    price: 84.3,
    coupon: 9,
    face: 100,
    years: 4,
    months: 0,
    advancedEnabled: true,
    settlementDate: '2026-10-14',
    issueDate: '2025-07-25',
    maturityDate: '2031-02-01',
    couponFrequency: 'semiannual',
    priceInputType: 'clean',
    dayCountConvention: '30us360',
    firstCouponDate: '',
    lastCouponDate: '',
};
const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
});
const errors: string[] = [];
try {
    const page = await browser.newPage();
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.setViewport({ width: 1280, height: 1000 });
    await page.evaluateOnNewDocument(
        (values, version) => {
            if (!localStorage.getItem('freewallet_bond_calculator'))
                localStorage.setItem(
                    'freewallet_bond_calculator',
                    JSON.stringify(values),
                );
            localStorage.setItem('freewallet_last_seen_version', version);
        },
        values,
        version,
    );
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        const url = new URL(request.url());
        void (url.origin === origin || ['data:', 'blob:'].includes(url.protocol)
            ? request.continue()
            : request.abort());
    });
    await page.goto(origin + '/academy/bond-calculator', {
        waitUntil: 'networkidle2',
    });
    await page.waitForSelector('.result-value');
    const nominal = () => page.$eval('.result-value', (el) => el.textContent);
    assert.equal(await nominal(), '13.97%');
    assert.equal(
        await page.$eval(
            '#bond-day-count',
            (el) => (el as HTMLSelectElement).value,
        ),
        '30us360',
    );
    assert.equal(
        await page.$eval(
            '.bond-calc__results details',
            (el) => (el as HTMLDetailsElement).open,
        ),
        false,
    );
    await page.click('.bond-calc__results details summary');
    const detail = await page.$eval(
        '.bond-calc__results details',
        (el) => el.textContent || '',
    );
    assert.match(detail, /1\.825000/);
    assert.match(detail, /86\.125000/);
    assert.match(detail, /2027-02-01/);
    assert.match(detail, /2026-08-01/);
    assert.match(detail, /Flujos restantes9/);
    assert.match(detail, /14\.458148%/);
    assert.match(detail, /13\.970230%/);
    const setInput = async (selector: string, value: string) => {
        await page.$eval(
            selector,
            (el, value) => {
                Object.getOwnPropertyDescriptor(
                    HTMLInputElement.prototype,
                    'value',
                )!.set!.call(el, value);
                el.dispatchEvent(new Event('input', { bubbles: true }));
            },
            value,
        );
    };
    await page.select('#bond-price-type', 'dirty');
    await setInput('#bond-price', '86.125');
    assert.ok(
        await page.$eval('#bond-price', (el) =>
            (el as HTMLInputElement).checkValidity(),
        ),
        'Dirty prices can include fractions of a cent without step rounding',
    );
    await page.waitForFunction(
        () => document.querySelector('.result-value')?.textContent === '13.97%',
    );
    assert.match(
        await page.$eval(
            '.bond-calc__results details',
            (el) => el.textContent || '',
        ),
        /Precio limpio84\.300000/,
    );
    await setInput('#bond-face', '1000');
    await page.waitForFunction(() =>
        document
            .querySelector('.bond-calc__results details')
            ?.textContent?.includes('861.250000'),
    );
    assert.equal(
        await nominal(),
        '13.97%',
        'A percentage quotation is independent of nominal size',
    );
    await setInput('#bond-issue-date', '');
    await page.waitForFunction(
        () =>
            JSON.parse(
                localStorage.getItem('freewallet_bond_calculator') || '{}',
            ).issueDate === '',
    );
    await page.reload({ waitUntil: 'networkidle2' });
    assert.equal(
        await page.$eval(
            '#bond-issue-date',
            (el) => (el as HTMLInputElement).value,
        ),
        '',
        'Optional issue date stays empty after reload',
    );
    assert.equal(await nominal(), '13.97%');
    await page.setViewport({ width: 390, height: 844 });
    assert.ok(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
        'No horizontal overflow on mobile',
    );
    await setInput('#bond-settlement-date', '2031-02-01');
    await page.waitForSelector('.bond-calc__results [role="alert"]');
    assert.equal(
        await page.$('.result-value'),
        null,
        'Invalid dates cannot publish a yield',
    );
    assert.deepEqual(errors, []);
    console.log(
        'PASS: bond UI, CoreWeave nominal/effective yield, closed calculation details, clean/dirty parity, face scaling, stored 30/360 US, optional issue date and mobile layout.',
    );
} finally {
    await browser.close();
}
