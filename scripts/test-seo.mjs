import assert from 'node:assert/strict';
import { seoConfig, seoFiles, DEFAULT_SITE_URL } from './seo-config.mjs';

assert.equal(seoConfig({}).domain, DEFAULT_SITE_URL);
assert.equal(seoConfig({ FREEWALLET_SITE_URL: 'https://example.test/' }).domain, 'https://example.test');
for (const invalid of ['http://example.test', 'https://user:password@example.test', 'https://example.test/path', 'https://example.test/?x=1', 'https://example.test/#x'])
    assert.throws(() => seoConfig({ FREEWALLET_SITE_URL: invalid }));
const routes = ['/', '/news', '/academy/bond-calculator', '/news'];
const production = seoFiles(routes, seoConfig({ VERCEL_ENV: 'production' }));
assert.equal((production.sitemap.match(/<loc>/g) ?? []).length, 3);
assert.ok(production.sitemap.includes(DEFAULT_SITE_URL + '/academy/bond-calculator'));
assert.ok(!production.sitemap.includes('freewallet-v2'));
assert.ok(production.robots.includes(`Sitemap: ${DEFAULT_SITE_URL}/sitemap.xml`));
assert.throws(() => seoFiles(['/news?x=<script>'], seoConfig({})));
for (const VERCEL_ENV of ['preview', 'development']) {
    const preview = seoFiles(routes, seoConfig({ VERCEL_ENV }));
    assert.equal(preview.robots, 'User-agent: *\nDisallow: /\n');
    assert.ok(!preview.sitemap.includes('<loc>'));
}
assert.equal(seoConfig({ VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'release' }).preview, true, 'The separate PRE project must not be indexed');
assert.equal(seoConfig({ VERCEL_ENV: 'production', FREEWALLET_DEPLOYMENT_ENV: 'preproduction' }).preview, true);
assert.equal(seoConfig({ VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'master' }).preview, false);
assert.throws(() => seoConfig({ FREEWALLET_DEPLOYMENT_ENV: 'typo' }));
console.log('PASS: production origin, validation, unique public routes and no indexing of previews.');
