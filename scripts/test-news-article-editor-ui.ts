import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer';

const origin = process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:5181';
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const author = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const stamp = '2026-10-01T12:00:00Z';
const article = { id: '33333333-3333-4333-8333-333333333333', slug: 'synthetic-news', title: 'Synthetic editorial analysis', excerpt: 'Synthetic excerpt', content: '<p>Original synthetic article.</p>', cover_image_url: null, status: 'published', author_id: author, published_at: stamp, created_at: stamp, updated_at: stamp };
const user = (id: string, mfa=false) => ({factors:mfa?[{id:'44444444-4444-4444-8444-444444444444',factor_type:'totp',status:'verified',friendly_name:'FreeWallet',created_at:stamp,updated_at:stamp}]:[], id, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: stamp });
const session = (id: string, mfa=false, aal='aal1') => ({ access_token: `${btoa('{"alg":"HS256"}')}.${btoa(JSON.stringify({ sub: id, role: 'authenticated', aal, exp: Math.floor(Date.now() / 1000) + 3600 }))}.${btoa('synthetic')}`, refresh_token: 'synthetic', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: user(id,mfa) });
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const errors: string[] = [];
const writes: { method: string; id: string | null; body: Record<string, unknown> }[] = [];
try {
    for (const scenario of [
        { name: 'anonymous', id: null, active: false, verifiedId: author, canEdit: false },
        { name: 'other editor', id: other, active: true, verifiedId: other, canEdit: false },
        { name: 'revoked author', id: author, active: false, verifiedId: author, canEdit: false },
        { name: 'unverified identity', id: author, active: true, verifiedId: other, canEdit: false },
        { name: 'author without attribution', id: author, active: true, verifiedId: author, canEdit: false, noAuthor: true },
        { name: 'author requiring MFA', id: author, active: true, verifiedId: author, canEdit: false, mfa:true },
        { name: 'author completing MFA', id: author, active: true, verifiedId: author, canEdit: false, mfa:true, verifyResult:'success' },
        { name: 'author completing MFA during a portfolio outage', id: author, active: true, verifiedId: author, canEdit: false, mfa:true, verifyResult:'refresh-error' },
        { name: 'author with invalid MFA code', id: author, active: true, verifiedId: author, canEdit: false, mfa:true, verifyResult:'invalid-code' },
        { name: 'active author', id: author, active: true, verifiedId: author, canEdit: true },
    ]) {
        const page = await browser.newPage();
        let mfaVerified=false;let refreshFailures=0;
        page.on('pageerror', error => errors.push(String(error)));
        await page.setViewport({ width: 390, height: 844 });
        await page.evaluateOnNewDocument((auth, version) => {
            if (auth) localStorage.setItem('freewallet-news-auth', JSON.stringify(auth));
            localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
            localStorage.setItem('freewallet_last_seen_version', version);
        }, scenario.id ? session(scenario.id,!!scenario.mfa) : null, version);
        await page.setRequestInterception(true);
        page.on('request', request => { void (async () => {
            const url = new URL(request.url());
            if (url.hostname.endsWith('.supabase.co')) {
                const headers = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS', 'access-control-allow-headers': request.headers()['access-control-request-headers'] || '*' };
                if (request.method() === 'OPTIONS') { await request.respond({ status: 204, headers }); return; }
                const post = { ...article, author_id: scenario.noAuthor ? null : article.author_id };
                let data: unknown = null;
                if (url.pathname === '/auth/v1/user') data = user(scenario.verifiedId,!!scenario.mfa);
                else if (url.pathname === '/auth/v1/logout') { await request.respond({ status: 204, headers }); return; }
                else if (url.pathname.endsWith('/challenge')) data = {id:'55555555-5555-4555-8555-555555555555',expires_at:Math.floor(Date.now()/1000)+300};
                else if (url.pathname.endsWith('/verify')) {
                    if(scenario.verifyResult==='invalid-code') {
                        await request.respond({status:400,headers,contentType:'application/json',body:JSON.stringify({code:'mfa_verification_failed',message:'Código de prueba rechazado'})});return;
                    }
                    mfaVerified=true;data=session(scenario.verifiedId,true,'aal2');
                }
                else if (url.pathname.endsWith('/rpc/is_news_admin')) data = scenario.active && (!scenario.mfa || mfaVerified);
                else if (url.pathname.endsWith('/rpc/read_portfolio')) {
                    if(mfaVerified && scenario.verifyResult==='refresh-error') {
                        refreshFailures++;await request.respond({status:503,headers,contentType:'application/json',body:'{"code":"503","message":"Synthetic portfolio outage"}'});return;
                    }
                    data = null;
                }
                else if (url.pathname.startsWith('/rest/v1/rpc/')) data = false;
                else if (url.pathname === '/rest/v1/news_posts') {
                    if (request.method() === 'PATCH') {
                        const body = JSON.parse(request.postData() || '{}');
                        writes.push({ method: request.method(), id: url.searchParams.get('id'), body });
                        data = { ...post, ...body };
                    } else data = url.searchParams.has('slug') ? post : [post];
                } else throw new Error(`Unexpected isolated endpoint: ${url.pathname}`);
                await request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify(data) });
            } else if (url.origin === origin || url.protocol === 'data:' || url.protocol === 'blob:') await request.continue();
            else await request.abort();
        })().catch(error => { errors.push(String(error)); if(!request.isInterceptResolutionHandled())void request.abort(); }); });
        await page.goto(`${origin}/news/${article.slug}`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.news-article');
        assert.equal(await page.$('.news-page--article .news-page__back-link'), null);
        assert.equal(await page.$('.news-article__footer a'), null);
        assert.doesNotMatch(await page.$eval('.news-page--article', el => el.textContent || ''), /Todas las noticias|Volver a noticias/);
        if (!scenario.canEdit) {
            assert.equal(await page.$('.news-article__edit'), null, scenario.name);
            if(scenario.mfa){
                await page.goto(`${origin}/admin/news`,{waitUntil:'domcontentloaded'});
                await page.waitForSelector('.account-page__form input[autocomplete="one-time-code"]');
                assert.equal(await page.$('.news-admin__editor-card'),null,'A verified MFA account must complete its challenge before editing');
                if(scenario.verifyResult) {
                    await page.type('input[autocomplete="one-time-code"]','123456');
                    await page.click('.account-page__form form button');
                    if(scenario.verifyResult==='invalid-code') {
                        await page.waitForFunction(()=>document.body.textContent?.includes('Código de prueba rechazado'));
                        assert.ok(await page.$('input[autocomplete="one-time-code"]'),'A rejected code must remain retryable');
                        assert.equal(await page.$('.news-admin__editor-card'),null);assert.equal(mfaVerified,false);
                    } else {
                        await page.waitForSelector('.news-admin__editor-card');
                        assert.equal(await page.$('input[autocomplete="one-time-code"]'),null);
                        const aal=await page.evaluate(async()=>{
                            // @ts-expect-error Vite resolves this browser-only absolute source import.
                            const module=await import('/src/services/supabaseClient.ts');
                            const client=await module.getAppSupabaseClient();const {data}=await client.auth.getSession();
                            return JSON.parse(atob(data.session.access_token.split('.')[1])).aal;
                        });
                        assert.equal(aal,'aal2');assert.equal(mfaVerified,true);
                        if(scenario.verifyResult==='refresh-error') {
                            await page.waitForFunction(()=>document.body.textContent?.includes('No se pudo actualizar la cartera'));
                            assert.ok(refreshFailures>0);assert.ok(await page.$('.news-admin__editor-card'),'Portfolio loading cannot block an already verified editor');
                        }
                    }
                }
            }
            await page.close();
            continue;
        }
        await page.waitForSelector('.news-article__edit');
        for (const width of [390, 1280]) for (const theme of ['light', 'dark']) for (const appearance of ['standard', 'liquid-glass']) {
            await page.setViewport({ width, height: 844 });
            await page.evaluate((theme, appearance) => { document.documentElement.dataset.theme = theme; document.documentElement.dataset.appearance = appearance; }, theme, appearance);
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            const button = await page.$eval('.news-article__edit', el => { const r = el.getBoundingClientRect(); return { position: getComputedStyle(el).position, width: r.width, height: r.height, right: r.right, bottom: r.bottom, label: el.getAttribute('aria-label') }; });
            assert.equal(button.position, 'fixed');
            assert.ok(button.width >= 44 && button.height >= 44 && button.right <= width && button.bottom <= 844);
            assert.equal(button.label, 'Editar noticia');
        }
        await page.setViewport({ width: 390, height: 844 });
        await page.click('.news-article__edit');
        await page.waitForSelector('.news-admin__editor-card input');
        await page.waitForFunction(title => (document.querySelector('.news-admin__editor-card input') as HTMLInputElement)?.value === title, {}, article.title);
        assert.equal(new URL(page.url()).searchParams.get('edit'), article.id);
        assert.equal(await page.$eval('#news-excerpt', el => (el as HTMLTextAreaElement).value), article.excerpt);
        await page.waitForFunction(() => document.querySelector('#news-editor')?.textContent?.includes('Original synthetic article.'));
        assert.equal(await page.$eval('.news-admin__editor-card input', el => el === document.activeElement), true, 'The editor receives focus on mobile');
        await page.$eval('.news-admin__editor-card input', el => {
            const input = el as HTMLInputElement;
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Updated synthetic analysis');
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await page.click('.news-admin__editor-actions .btn:last-child');
        await page.waitForFunction(() => window.location.pathname === '/news');
        assert.equal(writes.length, 1);
        assert.equal(writes[0].method, 'PATCH');
        assert.equal(writes[0].id, `eq.${article.id}`);
        assert.equal(writes[0].body.title, 'Updated synthetic analysis');
        assert.equal(writes[0].body.published_at, stamp);
        assert.equal(writes[0].body.author_id, undefined, 'Editing preserves attribution');
        await page.goto(`${origin}/news/${article.slug}`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.news-article__edit');
        await page.evaluate("import('/src/services/supabaseClient.ts').then(m => m.getAppSupabaseClient()).then(client => client.auth.signOut({scope:'local'}))");
        await page.waitForFunction(() => !document.querySelector('.news-article__edit'));
        assert.ok(await page.$('.news-article'), 'Logging out keeps the public article readable');
        await page.close();
    }
    assert.deepEqual(errors, []);
    console.log('News UI passed: author permissions, mobile pencil, MFA challenge/rejection/success, editing despite a portfolio outage, preserved publication/author and logout.');
} catch(error) { console.error(errors);throw error; } finally { await browser.close(); }
