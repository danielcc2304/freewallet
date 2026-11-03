import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer';

const origin = process.env.FREEWALLET_TEST_URL!;
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const before = process.env.FREEWALLET_VISUAL_PHASE === 'before';
const phase = before ? 'before' : 'after';
const directory = `/tmp/freewallet-tailwind-${phase}`;
mkdirSync(directory, { recursive: true });
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.evaluateOnNewDocument(value => {
        localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
        localStorage.setItem('freewallet_last_seen_version', value);
    }, version);
    await page.setRequestInterception(true);
    page.on('request', request => {
        const url = new URL(request.url());
        void (url.origin === origin || ['data:', 'blob:'].includes(url.protocol) ? request.continue() : request.abort());
    });
    await page.goto(origin + '/account', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#account-login');
    await page.evaluate(async () => { await import('/scripts/fixtures/FoundationGallery.tsx'); });
    // Settle captures without sampling halfway through a theme transition.
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
    await page.waitForSelector('[data-test="primary"]');
    const measurements: Record<string, unknown> = {};
    for (const width of [320, 390, 1280]) {
        await page.setViewport({ width, height: 1000 });
        for (const theme of ['light', 'dark']) for (const appearance of ['standard', 'liquid-glass']) {
            const name = `${width}-${theme}-${appearance}`;
            await page.evaluate((theme, appearance) => {
                document.documentElement.dataset.theme = theme;
                document.documentElement.dataset.appearance = appearance;
            }, theme, appearance);
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: no horizontal overflow`);
            measurements[name] = await page.evaluate(() => Object.fromEntries(['.account-page', '.account-page .page-header', '.account-page h1', '.account-page .page-header p', '#account-login', '[data-test="primary"]', '[data-test="secondary"]', '.foundation-fields', '.metric-card__value'].map(selector => {
                const element = document.querySelector(selector)!;
                const style = getComputedStyle(element);
                const bounds = element.getBoundingClientRect();
                return [selector, { width: bounds.width, height: bounds.height, fontSize: style.fontSize, color: style.color, borderRadius: style.borderRadius, display: style.display, background: style.background, padding: style.padding }];
            })));
            await (await page.$('.account-page'))!.screenshot({ path: `${directory}/account-${name}.png` });
            if (width !== 320) await (await page.$('[data-foundation-gallery]'))!.screenshot({ path: `${directory}/components-${name}.png` });
        }
    }
    writeFileSync(`${directory}/measurements.json`, JSON.stringify(measurements, null, 2));
    if (!before) {
        assert.equal(await page.$eval('.foundation-override', element => getComputedStyle(element).padding), '16px', 'Consumer utility overrides the default Card padding');
        assert.equal(await page.$eval('#gallery-error', element => element.getAttribute('aria-invalid')), 'true');
        assert(await page.$eval('#gallery-email', element => (element.getAttribute('aria-describedby') ?? '').split(' ').every(id => !!document.getElementById(id))), 'Input help points to existing elements');
        await page.focus('#gallery-error');
        const error = await page.$eval('#gallery-error', element => ({ color: getComputedStyle(element).borderColor, expected: getComputedStyle(document.documentElement).getPropertyValue('--color-negative').trim() }));
        assert.equal(error.color, 'rgb(239, 68, 68)', `Error focus remains visible in Liquid Glass (${error.expected})`);
        assert.equal(await page.$eval('[data-test="loading"]', element => (element as HTMLButtonElement).disabled), true);
        assert.equal(await page.$eval('[data-test="loading"]', element => element.getAttribute('aria-busy')), 'true');
        assert.notEqual(await page.$eval('[data-test="loading"] .btn__spinner', element => getComputedStyle(element).color), 'rgba(0, 0, 0, 0)', 'Loading spinner remains visible');
        await page.focus('[data-test="secondary"]');
        await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
        const focus = await page.$eval('[data-test="primary"]', element => ({ active: document.activeElement === element, style: getComputedStyle(element).outlineStyle, width: getComputedStyle(element).outlineWidth }));
        assert.deepEqual(focus, { active: true, style: 'solid', width: '2px' }, 'Keyboard focus has a visible outline despite the default outline reset');
        await page.hover('[data-test="disabled"]'); await page.mouse.down();
        assert.equal(await page.$eval('[data-test="disabled"]', element => getComputedStyle(element).transform), 'none', 'Disabled controls do not receive the glass press transform');
        await page.mouse.up();
        await page.evaluate(() => { document.documentElement.dataset.appearance = 'standard'; });
        // This headless runner reports no hover hardware, even through CDP
        // media overrides. Enable only the hover capability guards in this
        // isolated page; keep the actual production selectors/declarations.
        await page.evaluate(() => {
            if (matchMedia('(hover:hover)').matches) return;
            const rules: CSSRule[] = [];
            for (const sheet of document.styleSheets) {
                try { rules.push(...sheet.cssRules); } catch { /* Ignore unrelated cross-origin styles. */ }
            }
            for (let index = 0; index < rules.length; index++) {
                const rule = rules[index];
                if (rule instanceof CSSMediaRule && /^\(\s*hover\s*:\s*hover\s*\)$/.test(rule.conditionText)) rule.media.mediaText = 'all';
                if ('cssRules' in rule) rules.push(...(rule as CSSGroupingRule).cssRules);
            }
        });
        await page.hover('[data-test="button-link"]');
        assert.equal(await page.$eval('[data-test="button-link"]', element => getComputedStyle(element).borderColor), 'rgb(16, 185, 129)', 'The button recipe also supports hover on native links, which cannot match :enabled');
    }
    await page.click('[data-test="open-modal"]');
    await page.waitForSelector('[role="dialog"]');
    assert(await page.$eval('[role="dialog"]', element => element.contains(document.activeElement)), 'Dialog receives focus');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    assert(await page.$eval('[role="dialog"]', element => element.contains(document.activeElement)), 'Focus remains trapped');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
    assert(await page.$eval('[data-test="open-modal"]', element => document.activeElement === element), 'Focus returns to the trigger');
    assert.deepEqual(errors, []);
    console.log(`PASS: ${phase} captures and computed styles, 320/390/1280px, all four theme/appearance combinations, shared controls and modal keyboard interaction.`);
} finally { await browser.close(); }
