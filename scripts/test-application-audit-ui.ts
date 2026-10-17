import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer';

const origin = process.env.FREEWALLET_TEST_URL ?? 'http://127.0.0.1:5198';
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.evaluateOnNewDocument(v => {
        localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
        localStorage.setItem('freewallet_last_seen_version', v);
    }, version);
    await page.setRequestInterception(true);
    let delayed: import('puppeteer').HTTPRequest | undefined;
    page.on('request', request => {
        const url = new URL(request.url());
        if (url.pathname.endsWith('/SalaryCalculator.tsx')) { delayed = request; return; }
        void (url.origin === origin || ['data:', 'blob:'].includes(url.protocol) ? request.continue() : request.abort());
    });
    await page.goto(origin + '/academy/expenses', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.expense-manager h1');

    const sanitization = await page.evaluate(async () => {
        const { sanitizeNewsHtml } = await import('/src/utils/newsContent.ts');
        const payloads = [
            '<div><div><img src="https://invalid.test/image" onerror="window.__auditXss=1"></div></div>',
            '<span><a href="javascript:window.__auditXss=1" onclick="window.__auditXss=1">enlace</a></span>',
            '<p><a href="java&#x73;cript:alert(1)">enlace</a><script>window.__auditXss=1</script></p>',
            '<svg><foreignObject><img src=x onerror="window.__auditXss=1"></foreignObject></svg>',
            '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=window.__auditXss=1>">',
            '<span style="font-size:1rem;background:url(javascript:alert(1));position:fixed" onclick="alert(1)">texto</span>',
            '<iframe srcdoc="<script>alert(1)</script>"></iframe><form><input autofocus onfocus="alert(1)"></form>',
        ];
        const cleaned = payloads.map(raw => sanitizeNewsHtml(raw));
        const fixture = document.createElement('div');
        fixture.innerHTML = cleaned.join('');
        document.body.append(fixture);
        const unsafe = [...fixture.querySelectorAll('*')].some(element =>
            [...element.attributes].some(attr => /^on/i.test(attr.name) ||
                ['href', 'src'].includes(attr.name) && /^(?:javascript|data|vbscript):/i.test(attr.value.trim())) ||
            ['SCRIPT', 'IFRAME', 'SVG', 'MATH', 'FORM', 'INPUT', 'STYLE'].includes(element.tagName));
        const valid = sanitizeNewsHtml('<h2>Título</h2><p><strong>Negrita</strong> <a href="https://example.test" target="_blank">link</a><span style="font-size:1.125rem">grande</span><img src="https://example.test/image.png" alt="Foto"></p>');
        await new Promise(resolve => setTimeout(resolve, 100));
        const result = { cleaned, unsafe, executed: '__auditXss' in window, idempotent: cleaned.every(html => sanitizeNewsHtml(html) === html), valid, validIdempotent: sanitizeNewsHtml(valid) === valid };
        fixture.remove();
        return result;
    });
    assert.equal(sanitization.unsafe, false);
    assert.equal(sanitization.executed, false);
    assert.equal(sanitization.idempotent, true, 'Saving and rendering cannot revive unsafe attributes');
    assert.equal(sanitization.validIdempotent, true);
    assert.match(sanitization.valid, /<strong>Negrita<\/strong>/);
    assert.match(sanitization.valid, /rel="noopener noreferrer"/);
    assert.match(sanitization.valid, /font-size: 1.125rem/);
    assert.match(sanitization.valid, /alt="Foto"/);
    assert.ok(!sanitization.cleaned.join('').includes('background'));

    const pending = await page.evaluate(async () => {
        const { expenseStore } = await import('/src/services/expenseStore.ts');
        const book = structuredClone(expenseStore.getSnapshot().book);
        book.entries.push({ id: crypto.randomUUID(), date: '2026-10-17', description: 'Synthetic audit expense', kind: 'expense', amountCents: 1000, accountId: 'main', categoryId: 'other', tags: [], note: '' });
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) {
            if (key === 'freewallet_expenses_v1') throw new Error('Synthetic quota failure');
            return original.call(this, key, value);
        };
        try { await expenseStore.save(book); } catch { /* The retry/export copy must remain available. */ }
        finally { Storage.prototype.setItem = original; }
        const event = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(event);
        return { pending: expenseStore.hasPending, blocked: event.defaultPrevented };
    });
    assert.deepEqual(pending, { pending: true, blocked: true });
    await page.evaluate(() => { history.pushState({}, '', '/account'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await page.waitForSelector('.account-page');
    await page.waitForSelector('.pending-changes a');
    const afterNavigation = await page.evaluate(async () => {
        const { expenseStore } = await import('/src/services/expenseStore.ts');
        const { assertSafeToSignOut } = await import('/src/services/pendingChanges.ts');
        const { signOutNewsAdmin } = await import('/src/services/newsService.ts');
        const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event);
        let accountBlocked = false, editorBlocked = false;
        try { assertSafeToSignOut(); } catch { accountBlocked = true; }
        try { await signOutNewsAdmin(); } catch { editorBlocked = true; }
        return { pending: expenseStore.hasPending, blocked: event.defaultPrevented, accountBlocked, editorBlocked,
            exportAmount: expenseStore.exportBook.entries.at(-1)?.amountCents };
    });
    assert.deepEqual(afterNavigation, { pending: true, blocked: true, accountBlocked: true, editorBlocked: true, exportAmount: 1000 });
    await page.evaluate(async () => {
        const { expenseStore } = await import('/src/services/expenseStore.ts');
        await expenseStore.retry();
    });
    await page.waitForFunction(() => !document.querySelector('.pending-changes'));
    assert.equal(await page.evaluate(() => {
        const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented;
    }), false, 'The guard releases only after saving succeeds');

    await page.evaluate(() => { history.pushState({}, '', '/academy/salary-calculator'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await page.waitForSelector('.route-state--loading');
    assert.ok(delayed, 'The calculator code is requested only when navigating to it');
    assert.ok(await page.$('.sidebar'), 'The layout stays mounted while loading');
    await delayed.continue();
    await page.waitForSelector('.salary-calc__hero');
    assert.equal(await page.$('.route-state--loading'), null);
    assert.deepEqual(errors, []);

    const failure = await browser.newPage();
    await failure.evaluateOnNewDocument(v => localStorage.setItem('freewallet_last_seen_version', v), version);
    await failure.setRequestInterception(true);
    failure.on('request', request => {
        const url = new URL(request.url());
        void (url.origin === origin && !url.pathname.endsWith('/RiskManagement.tsx') ? request.continue() : request.abort());
    });
    await failure.goto(origin + '/academy/risk', { waitUntil: 'domcontentloaded' });
    await failure.waitForSelector('.route-state[role=alert]');
    assert.match(await failure.$eval('.route-state', node => node.textContent ?? ''), /Volver a cargar/);
    assert.ok(await failure.$('.sidebar'), 'A failed chunk does not remove navigation');
    await failure.evaluate(() => { history.pushState({}, '', '/account'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await failure.waitForSelector('.account-page');
    assert.equal(await failure.$('.route-state[role=alert]'), null);
    console.log('PASS: real-DOM news sanitization, nested/malformed payloads, route-independent pending guard, account/editor logout, recovery, lazy loading and recoverable route failure.');
} finally { await browser.close(); }
