import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer';

const origin = process.env.FREEWALLET_TEST_URL!;
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const phase = process.env.FREEWALLET_VISUAL_PHASE === 'before' ? 'before' : 'after';
const directory = `/tmp/freewallet-tailwind-modules-${phase}`;
mkdirSync(directory, { recursive: true });
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const academy = ['', 'glossary', 'timeline', 'errors', 'investor-profile-test', 'portfolio', 'risk', 'tax', 'strategies', 'calculators', 'salary-calculator', 'expenses', 'fund-information', 'valuation', 'market-timing-game', 'crisis', 'scenarios', 'inflation-predator', 'resources', 'compound-interest', 'fire-calculator', 'bond-calculator', 'retirement', 'emergency-fund', 'taxes', 'asset-allocation', 'assets/equities', 'assets/bonds', 'assets/cash', 'assets/reits', 'assets/crypto'];
const allRoutes = ['/', '/planning', '/transactions', '/add', '/settings', '/portfolio-csv', '/feature-log', '/market-heatmap', '/terms', '/not-found-test', ...academy.map(path => '/academy' + (path ? '/' + path : ''))];
const selectedRoutes = process.env.FREEWALLET_VISUAL_ROUTES?.split(',').map(route => route.trim()).filter(Boolean);
if (selectedRoutes) assert(selectedRoutes.length > 0 && selectedRoutes.every(route => allRoutes.includes(route)), 'Focused routes must exist in the normal audit');
const routes = selectedRoutes ? [...new Set(selectedRoutes)] : allRoutes;
const captures = new Set(['/', '/academy', '/academy/portfolio', '/academy/risk', '/academy/bond-calculator', '/academy/expenses', '/settings', '/academy/resources', '/not-found-test', ...(selectedRoutes ?? [])]);
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
const baselinePath = '/tmp/freewallet-tailwind-modules-before/measurements.json';
const baselineMeasurements = phase === 'after' && existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : null;
const measurements: Record<string, unknown> = {};
try {
    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.evaluateOnNewDocument(value => {
        localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
        localStorage.setItem('freewallet_last_seen_version', value);
        localStorage.setItem('freewallet-dashboard-notice-dismissed', '1');
    }, version);
    await page.setRequestInterception(true);
    page.on('request', request => {
        const url = new URL(request.url());
        const proxy = /^\/(?:__market|__finect|__holdings|data\/funds|api)(?:\/|$)/.test(url.pathname);
        void ((!proxy && url.origin === origin) || ['data:', 'blob:'].includes(url.protocol) ? request.continue() : request.abort());
    });
    for (const route of routes) {
        console.log('CHECK', route);
        await page.setViewport({ width: 1280, height: 1000 });
        if (page.url() === 'about:blank') await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
        else await page.evaluate(route => { history.pushState({}, '', route); dispatchEvent(new PopStateEvent('popstate')); }, route);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await page.waitForFunction(() => document.querySelector('#root :is(h1,h2,h3)') && !document.querySelector('.route-state--loading'));
        assert.equal(await page.$('.route-state[role="alert"]'), null, `${route}: module loads successfully`);
        await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important;}' });
        for (const close of await page.$$('.modal__close')) await close.click();
        for (const width of (phase === 'before' ? [390, 1280] : [320, 390, 1280])) {
            await page.setViewport({ width, height: 1000 });
            for (const theme of ['light', 'dark']) for (const appearance of ['standard', 'liquid-glass']) {
                if (phase === 'before' && !(width === 390 && theme === 'light' && appearance === 'liquid-glass' || width === 1280 && theme === 'dark' && appearance === 'standard')) continue;
                await page.evaluate((theme, appearance) => {
                    document.documentElement.dataset.theme = theme;
                    document.documentElement.dataset.appearance = appearance;
                    window.scrollTo({ top: 0, behavior: 'instant' });
                }, theme, appearance);
                const key = `${route}|${width}|${theme}|${appearance}`;
                const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
                // Preserve the baseline for diagnosing pre-existing overflow; after migration
                // it must never grow and a clean route must remain clean.
                const styles = await page.evaluate(() => {
                    const root = document.querySelector('.layout__content') ?? document.querySelector('#root')!;
                    return [...root.querySelectorAll('h1,h2,h3,button,input,select,textarea,[class]')].filter(element => {
                        const rect = element.getBoundingClientRect();
                        return rect.width > 0 && rect.height > 0 && !element.closest('svg');
                    }).slice(0, 100).map(element => {
                        const style = getComputedStyle(element);
                        return { tag: element.tagName, hook: [...element.classList].filter(name => !name.startsWith('tw:')).join(' '),
                            display: style.display, direction: style.flexDirection, columns: style.gridTemplateColumns,
                            font: style.fontSize, line: style.lineHeight, weight: style.fontWeight,
                            padding: style.padding, gap: style.gap, radius: style.borderRadius,
                            color: style.color, background: style.backgroundColor, border: style.borderColor,
                            borderWidth: style.borderWidth, minHeight: style.minHeight };
                    });
                });
                measurements[key] = { overflow, styles };
                if (phase === 'after') {
                    if (baselineMeasurements?.[key]) {
                        const baseline = baselineMeasurements[key];
                        assert(overflow <= Math.max(1, baseline.overflow), `${key}: horizontal overflow does not grow`);
                    } else assert(overflow <= 1, `${key}: no horizontal overflow`);
                }
                if (captures.has(route) && width === 390 && theme === 'light' && appearance === 'liquid-glass') {
                    await page.screenshot({ path: `${directory}/${route.replaceAll('/', '_') || 'dashboard'}.png` });
                }
            }
        }
        assert.deepEqual(errors, [], `${route}: no runtime errors`);
        writeFileSync(`${directory}/measurements.json`, JSON.stringify(measurements, null, 2));
        console.log(`PASS ${route}: ${phase === 'before' ? 'mobile/desktop reference' : '3 widths, all 4 themes/appearances'}`);
    }
    writeFileSync(`${directory}/measurements.json`, JSON.stringify(measurements, null, 2));
    console.log(`PASS: ${routes.length} routes, ${Object.keys(measurements).length} layout/theme combinations (${phase}).`);
} finally { await browser.close(); }
