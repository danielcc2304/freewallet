import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seoConfig, seoFiles } from './seo-config.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const academy = fs.readFileSync(path.join(root, 'src/app/routes/academyRoutes.tsx'), 'utf8');
const routes = ['/', '/news', '/terms', ...[...academy.matchAll(/path: '([^']*)'/g)]
    .map(match => match[1]).filter(route => !['expenses', 'asset-types'].includes(route))
    .map(route => route ? `/academy/${route}` : '/academy')];
const config = seoConfig();
const { sitemap, robots } = seoFiles(routes, config);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/sitemap.xml'), sitemap);
fs.writeFileSync(path.join(root, 'dist/robots.txt'), robots);
const index = path.join(root, 'dist/index.html');
if (config.preview && fs.existsSync(index)) {
    const html = fs.readFileSync(index, 'utf8').replace(/<meta\s+name=["']robots["'][^>]*>/gi, '');
    fs.writeFileSync(index, html.replace('</head>', '<meta name="robots" content="noindex,nofollow" /></head>'));
}
console.log(`SEO: ${config.preview ? 'PRE/preview sin indexación' : config.domain}`);
