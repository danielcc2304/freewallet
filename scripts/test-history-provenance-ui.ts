import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { createQuoteSnapshot } from '../src/services/portfolioPerformance';
import type { Asset, PortfolioTransaction } from '../src/types/types';

// Regression fixture uses the reported portfolio totals, not invented market
// history. Its single aggregate position is explicitly a testing portfolio.
const assets: Asset[] = [{ id: 'audit', symbol: 'AUDIT', name: 'Cartera de prueba · totales comunicados', type: 'fund',
    purchasePrice: 66383.50, quantity: 1, purchaseDate: '2022-09-02', currentPrice: 85144.06, currency: 'EUR' }];
const tx: PortfolioTransaction[] = [{ id: 'purchase', assetId: 'audit', assetSymbol: 'AUDIT', assetName: assets[0].name,
    assetType: 'fund', type: 'buy', price: 66383.50, quantity: 1, total: 66383.50, date: '2022-09-02', createdAt: '2026-09-11' }];
const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(18, 0, 0, 0);
const snapshots = [createQuoteSnapshot([{ ...assets[0], currentPrice: 85148.94 }], tx, yesterday.toISOString()),
    createQuoteSnapshot(assets, tx, new Date().toISOString())];
const legacy = [{ date: '2025-12-31', value: 26595.16, invested: 26577.04 },
    { date: '2026-08-31', value: 39465.91, invested: 39503.41 }];
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu'], timeout: 15000 });
try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.evaluateOnNewDocument((data) => {
        localStorage.setItem('freewallet_assets', JSON.stringify(data.assets));
        localStorage.setItem('freewallet_transactions', JSON.stringify(data.tx));
        localStorage.setItem('freewallet_history', JSON.stringify(data.history));
        localStorage.setItem('freewallet_settings', JSON.stringify({ apiEnabled: false }));
    }, { assets, tx, history: [...legacy, ...snapshots] });
    void page.goto(process.env.FREEWALLET_TEST_URL || 'http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 0 });
    await page.waitForSelector('.portfolio-summary', { timeout: 30000 });
    const summary = await page.$eval('.portfolio-summary', el => el.textContent ?? '');
    assert.ok(summary.includes('-4,88'), summary);
    const before = await page.evaluate(() => localStorage.getItem('freewallet_history'));
    const ytd = await page.$('.portfolio-summary__tabs button:last-child');
    await ytd!.click();
    assert.ok((await page.$eval('.portfolio-summary', el => el.textContent ?? '')).includes('Sin histórico suficiente'));
    await page.click('.portfolio-summary__tabs button:first-child');
    await (await page.$('.portfolio-summary'))!.screenshot({ path: 'C:/Users/danie/AppData/Local/Temp/freewallet-history-daily-fixed.png' });
    const advanced = await page.$eval('.portfolio-excel-insights', el => el.textContent ?? '');
    assert.ok(advanced.includes('histórico antiguo se conserva'));
    assert.ok(!advanced.includes('26595') && !advanced.includes('39465'));
    assert.ok(advanced.includes('Sin meses cerrados'));
    assert.equal(await page.evaluate(() => localStorage.getItem('freewallet_history')), before, 'Opening dashboard must not rewrite legacy history');
    await (await page.$('.portfolio-excel-insights'))!.screenshot({ path: 'C:/Users/danie/AppData/Local/Temp/freewallet-history-quality-fixed.png' });
    console.log('Mobile: daily -4.88 EUR, YTD unavailable, legacy untouched, no fabricated historical ratios');
} finally { await browser.close(); }
