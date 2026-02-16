import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import handler from 'serve-handler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '../dist');

const routes = [
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

async function prerender() {
    console.log('🚀 Starting post-build prerender...');

    // Start a temporary server to serve the dist folder
    const server = createServer((request, response) => {
        return handler(request, response, {
            public: DIST_DIR,
            rewrites: [{ source: '/**', destination: '/index.html' }]
        });
    });

    const PORT = 3456;
    server.listen(PORT, async () => {
        console.log(`📡 Temporary server running at http://localhost:${PORT}`);

        const browser = await puppeteer.launch({ headless: true });

        for (const route of routes) {
            const page = await browser.newPage();
            const url = `http://localhost:${PORT}${route}`;

            console.log(`Rendering: ${route}...`);
            await page.goto(url, { waitUntil: 'networkidle0' });

            // Wait for custom trigger or just wait a bit
            // await page.evaluate(() => new Promise(resolve => {
            //     document.addEventListener('custom-render-trigger', resolve);
            //     setTimeout(resolve, 5000); // Fail-safe
            // }));
            await new Promise(r => setTimeout(r, 1000));

            const content = await page.content();

            const filePath = path.join(DIST_DIR, route === '/' ? 'index.html' : `${route}.html`);
            const dirPath = path.dirname(filePath);

            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            fs.writeFileSync(filePath, content);
            console.log(`✅ Saved: ${filePath}`);
            await page.close();
        }

        await browser.close();
        server.close();
        console.log('✨ Prerender complete!');
        process.exit(0);
    });
}

prerender().catch(err => {
    console.error('❌ Prerender failed:', err);
    process.exit(1);
});
