import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer';

const origin = process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5177';
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const errors: string[] = [];
const page = await browser.newPage();
try {
    page.on('pageerror', error => errors.push(String(error)));
    await page.setViewport({ width: 390, height: 844 });
    await page.evaluateOnNewDocument(`
        localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
        localStorage.setItem('freewallet_last_seen_version', '${version}');
        window.setInterval = new Proxy(window.setInterval, {
            apply(target, self, args) { if (args[1] === 400) args[1] = 200; return Reflect.apply(target, self, args); }
        });
    `);
    await page.setRequestInterception(true);
    page.on('request', request => {
        const url = new URL(request.url());
        void (url.origin === origin || ['data:', 'blob:'].includes(url.protocol) ? request.continue() : request.abort());
    });
    await page.goto(`${origin}/academy/market-timing-game`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.timing-intro');
    const values = () => page.$$eval('.timing-stats strong', elements => elements.map(el => el.textContent));
    assert.match((await values())[0]!, /10\.000/);
    assert.match((await values())[1]!, /10\.000/);
    await page.click('.timing-intro button');
    await page.waitForSelector('.timing-chart');
    await page.keyboard.press('p');
    await page.waitForFunction(() => document.querySelector('.timing-clock')?.textContent?.includes('En pausa'));
    const tick = await page.$eval('.timing-quote span', el => el.textContent);
    await new Promise(resolve => setTimeout(resolve, 350));
    assert.equal(await page.$eval('.timing-quote span', el => el.textContent), tick, 'Paused market does not advance');
    assert.equal(await page.$eval('.timing-buy', el => (el as HTMLButtonElement).disabled), true);
    for (const width of [320, 390, 1280]) for (const theme of ['light', 'dark']) for (const appearance of ['standard', 'liquid-glass']) {
        await page.setViewport({ width, height: 844 });
        await page.evaluate((theme, appearance) => { document.documentElement.dataset.theme = theme; document.documentElement.dataset.appearance = appearance; }, theme, appearance);
        const layout = await page.evaluate(() => ({
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            buttons: [...document.querySelectorAll('.timing-portions button, .timing-trade-buttons button')].map(el => {
                const rect = el.getBoundingClientRect(); return { width: rect.width, height: rect.height, left: rect.left, right: rect.right };
            }),
        }));
        assert.equal(layout.overflow, false, `${width}/${theme}/${appearance}`);
        assert.ok(layout.buttons.every(r => r.width >= 44 && r.height >= 44 && r.left >= 0 && r.right <= width), `${width}/${theme}/${appearance}: touch targets`);
    }
    await page.setViewport({ width: 390, height: 844 });
    await page.keyboard.press('p');
    await page.waitForFunction(() => !(document.querySelector('.timing-buy') as HTMLButtonElement)?.disabled);
    await page.$eval('.timing-buy', el => (el as HTMLButtonElement).click());
    await page.waitForFunction(() => document.querySelector('.timing-order-status')?.textContent?.includes('pendiente'));
    assert.equal(await page.$eval('.timing-buy', el => (el as HTMLButtonElement).disabled), true);
    await page.waitForFunction(() => document.querySelector('.timing-wallet span strong')?.textContent?.includes('5000') || document.querySelector('.timing-wallet span strong')?.textContent?.includes('5.000'));
    await page.waitForFunction(() => !(document.querySelector('.timing-sell') as HTMLButtonElement)?.disabled);
    await page.click('.timing-portions button:first-of-type');
    assert.match(await page.$eval('.timing-sell', el => el.textContent || ''), /25%/);
    await page.click('.timing-sell');
    await page.waitForFunction(() => document.querySelector('.timing-order-status')?.textContent?.includes('Próxima orden'));
    await page.keyboard.press('p');
    const cash = await page.$eval('.timing-wallet span strong', el => Number((el.textContent || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')));
    assert.ok(cash > 5000, 'Partial sale adds cash without selling the whole position');
    await page.$eval('.timing-board', el => el.scrollIntoView());
    await page.screenshot({ path: '/tmp/freewallet-market-timing-game.png', fullPage: true });
    await page.keyboard.press('p');
    await page.evaluate("Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'));");
    await page.waitForFunction(() => document.querySelector('.timing-clock')?.textContent?.includes('En pausa'));
    await page.evaluate("delete document.hidden;");
    await page.keyboard.press('p');
    await page.waitForSelector('.timing-results', { timeout: 25000 });
    assert.ok(await page.$('.timing-chart'), 'Round result preserves the chart');
    assert.equal(await page.$('.timing-trade-buttons'), null);
    for (const round of [2, 3]) {
        await page.click('.timing-results button');
        await page.waitForFunction(round => document.querySelector('.timing-round-header')?.textContent?.includes(`Ronda ${round} de 3`), {}, round);
        assert.match((await values())[0]!, /10\.000/);
        assert.match((await values())[3]!, /0 \/ 8/);
        await page.waitForSelector('.timing-results', { timeout: 25000 });
        assert.equal(await page.$$eval('.timing-round-result', elements => elements.length), round);
    }
    assert.match(await page.$eval('.timing-results button', el => el.textContent || ''), /Nueva partida/);
    await page.click('.timing-results button');
    await page.waitForFunction(() => document.querySelector('.timing-round-header')?.textContent?.includes('Ronda 1 de 3'));
    assert.equal(await page.$('.timing-results'), null);
    assert.deepEqual(errors, []);
    console.log('Market timing UI passed: mobile/themes, fair starting values, partial/delayed orders, pause/keyboard/tab visibility, three rounds and clean restart.');
} catch (error) {
    console.error(await page.$eval('.market-timing-game', el => el.textContent));
    await page.screenshot({ path: '/tmp/freewallet-market-timing-failed.png', fullPage: true });
    throw error;
} finally { await browser.close(); }
