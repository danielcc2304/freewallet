import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const origin = process.env.FREEWALLET_TEST_URL ?? 'http://127.0.0.1:5176';
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const browser = await puppeteer.launch({ headless: true });
try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(String(error)));
    let recoveryError = false;
    let holdUser = false;
    let requests = 0;
    await page.evaluateOnNewDocument(() => {
        localStorage.clear();
        localStorage.setItem('freewallet_last_seen_version', '5.3.13');
        localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
    });
    await page.setRequestInterception(true);
    page.on('request', request => { void (async () => {
        const url = new URL(request.url());
        if (url.hostname.endsWith('.supabase.co')) {
            const headers = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS',
                'access-control-allow-headers': request.headers()['access-control-request-headers'] ?? '*' };
            if (request.method() === 'OPTIONS') { await request.respond({ status: 204, headers }); return; }
            if (holdUser && url.pathname === '/auth/v1/user') await new Promise(resolve => setTimeout(resolve, 2000));
            requests++;
            const recover = url.pathname.endsWith('/recover');
            await request.respond({ status: recover && !recoveryError ? 200 : recover ? 500 : 400,
                headers, contentType: 'application/json', body: JSON.stringify(recover && !recoveryError ? {} : {
                    error_code: recover ? 'unexpected_failure' : 'invalid_credentials',
                    msg: recover ? 'Error sending recovery email' : 'Invalid login credentials',
                }) });
        } else if (url.origin === origin || ['data:', 'blob:'].includes(url.protocol)) await request.continue();
        else await request.abort();
    })().catch(error => errors.push(String(error))); });
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${origin}/account`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'test@example.invalid');
    await page.type('input[type="password"]', 'synthetic-password');
    await page.click('.account-page__form button[type="submit"], .account-page__form button:not([type])');
    await page.waitForSelector('.feedback-toast--error');
    assert.ok(await page.$eval('.feedback-toast', e => e.textContent?.includes('Invalid login credentials') && e.getAttribute('role') === 'alert'));
    const click = async (text: string) => { const button = await page.$(`button::-p-text(${text})`); assert.ok(button); await button.click(); };
    await click('Olvidé mi contraseña');
    assert.equal(await page.$('.feedback-toast'), null, 'Changing form clears prior notification');
    await click('Enviar instrucciones');
    await page.waitForSelector('.feedback-toast--success');
    assert.ok(await page.$eval('.feedback-toast', e => e.getAttribute('role') === 'status' && e.textContent?.includes('Si existe una cuenta')));
    for (const width of [320, 390, 1440]) {
        await page.setViewport({ width, height: 900 });
        assert.ok(await page.$eval('.feedback-toast', e => {
            const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && getComputedStyle(e).position === 'fixed';
        }), 'Notification must fit viewport');
    }
    recoveryError = true;
    await click('Enviar instrucciones');
    await page.waitForSelector('.feedback-toast--error');
    assert.ok(await page.$eval('.feedback-toast', e => e.textContent?.includes('Error sending recovery email')));
    assert.equal(await page.$('.feedback-toast--success'), null, 'Errors replace success, without overlapping notices');
    assert.equal(requests, 3, 'One request per user action, all intercepted');
    // Simulate an existing session whose verification is deliberately delayed.
    // The signed-out fixture still starts clean on navigation, so use a new
    // document initializer registered after that fixture.
    holdUser = true;
    await page.evaluateOnNewDocument(() => {
        const user = { id: '11111111-1111-4111-8111-111111111111', email: 'test@example.invalid',
            aud: 'authenticated', role: 'authenticated', email_confirmed_at: new Date().toISOString(),
            app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
        const token = `${btoa(JSON.stringify({ alg: 'HS256' }))}.${btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 }))}.synthetic`;
        localStorage.setItem('freewallet-news-auth', JSON.stringify({ access_token: token, refresh_token: 'synthetic',
            expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user }));
    });
    await page.setViewport({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.account-connection__card');
    assert.ok(await page.$eval('.account-connection', e => e.getAttribute('aria-busy') === 'true'));
    assert.ok(await page.$eval('.account-connection__card', e => {
        const r = e.getBoundingClientRect();
        return e.getAttribute('role') === 'status' && r.left >= 0 && r.right <= innerWidth;
    }));
    await page.screenshot({ path: 'C:/Users/danie/AppData/Local/Temp/freewallet-account-loading-review.png' });
    assert.deepEqual(errors, []);
    console.log('Account feedback: invalid credentials, recovery success/error, form reset, accessible roles, responsive toast and connection card OK. No real email sent.');
} finally { await browser.close(); }
