import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes directly
const routes = [
    '/',
    '/add',
    '/settings',
    '/terms',
    '/academy',
    '/academy/timeline',
    '/academy/crisis',
    '/academy/scenarios',
    '/academy/errors',
    '/academy/portfolio',
    '/academy/tax',
    '/academy/strategies',
    '/academy/calculators',
    '/academy/risk',
    '/academy/resources',
    '/academy/glossary',
    '/academy/asset-types',
    '/academy/compound-interest',
    '/academy/fire-calculator',
    '/academy/bond-calculator',
    '/academy/retirement',
    '/academy/emergency-fund',
    '/academy/taxes',
    '/academy/asset-allocation'
];

const DOMAIN = 'https://freewallet-v2.vercel.app'; // Update with your actual domain

function generateSitemap() {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${DOMAIN}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : route.startsWith('/academy') ? '0.8' : '0.5'}</priority>
  </url>`).join('\n')}
</urlset>`;

    fs.writeFileSync(path.join(__dirname, '../dist/sitemap.xml'), sitemap);
    console.log('✅ sitemap.xml generated');
}

function generateRobots() {
    const robots = `User-agent: *
Allow: /

Sitemap: ${DOMAIN}/sitemap.xml`;

    fs.writeFileSync(path.join(__dirname, '../dist/robots.txt'), robots);
    console.log('✅ robots.txt generated');
}

// Ensure dist exists
if (!fs.existsSync(path.join(__dirname, '../dist'))) {
    fs.mkdirSync(path.join(__dirname, '../dist'), { recursive: true });
}

generateSitemap();
generateRobots();
