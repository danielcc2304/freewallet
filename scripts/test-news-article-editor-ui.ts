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
const user = (id: string) => ({ id, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: stamp });
const session = (id: string) => ({ access_token: `${btoa('{"alg":"HS256"}')}.${btoa(JSON.stringify({ sub: id, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }))}.synthetic`, refresh_token: 'synthetic', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: user(id) });
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
        { name: 'active author', id: author, active: true, verifiedId: author, canEdit: true },
    ]) {
        const page = await browser.newPage();
        page.on('pageerror', error => errors.push(String(error)));
        await page.setViewport({ width: 390, height: 844 });
        await page.evaluateOnNewDocument((auth, version) => {
            if (auth) localStorage.setItem('freewallet-news-auth', JSON.stringify(auth));
            localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
            localStorage.setItem('freewallet_last_seen_version', version);
        }, scenario.id ? session(scenario.id) : null, version);
        await page.setRequestInterception(true);
        page.on('request', request => { void (async () => {
            const url = new URL(request.url());
            if (url.hostname.endsWith('.supabase.co')) {
                const headers = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS', 'access-control-allow-headers': request.headers()['access-control-request-headers'] || '*' };
                if (request.method() === 'OPTIONS') { await request.respond({ status: 204, headers }); return; }
                const post = { ...article, author_id: scenario.noAuthor ? null : article.author_id };
                let data: unknown = null;
                if (url.pathname === '/auth/v1/user') data = user(scenario.verifiedId);
                else if (url.pathname === '/auth/v1/logout') { await request.respond({ status: 204, headers }); return; }
                else if (url.pathname.endsWith('/rpc/is_news_admin')) data = scenario.active;
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
        })().catch(error => errors.push(String(error))); });
        await page.goto(`${origin}/news/${article.slug}`, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.news-article');
        assert.equal(await page.$('.news-page--article .news-page__back-link'), null);
        assert.equal(await page.$('.news-article__footer a'), null);
        assert.doesNotMatch(await page.$eval('.news-page--article', el => el.textContent || ''), /Todas las noticias|Volver a noticias/);
        if (!scenario.canEdit) {
            assert.equal(await page.$('.news-article__edit'), null, scenario.name);
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
        await page.goto(`${origin}/news/${article.slug}`, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.news-article__edit');
        await page.evaluate("import('/src/services/supabaseClient.ts').then(m => m.getAppSupabaseClient()).then(client => client.auth.signOut({scope:'local'}))");
        await page.waitForFunction(() => !document.querySelector('.news-article__edit'));
        assert.ok(await page.$('.news-article'), 'Logging out keeps the public article readable');
        await page.close();
    }
    assert.deepEqual(errors, []);
    console.log('News article UI passed: removed navigation links, verified author with active editorial access only, mobile floating pencil, selected article editing, preserved publication/author and logout.');
} finally { await browser.close(); }
