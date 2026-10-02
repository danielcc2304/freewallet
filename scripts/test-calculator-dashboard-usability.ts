import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import puppeteer, { type Page } from 'puppeteer';
import { dailyAssetVariation, filterDashboardAssets, hasCurrentDayQuotes } from '../src/services/dashboardIntegrity';
import { calculateCompoundInterestProjection } from '../src/components/academy/calculators/compoundInterestUtils';
import type { Asset } from '../src/types/types';

const now = Date.parse('2026-10-02T12:00:00Z');
const base: Asset = { id: 'synthetic', name: 'Fondo Ábaco sintético', symbol: 'TEST', isin: 'TEST-ISIN', type: 'fund', currency: 'EUR', quantity: 10, purchasePrice: 100, currentPrice: 110, previousClose: 100, purchaseDate: '2026-01-01', quotedAt: '2026-10-02T10:00:00Z' };
assert.equal(dailyAssetVariation(base, now).todayChange, 100);
for (const quotedAt of ['2026-01-02', undefined, 'invalid', '2026-10-03']) {
    const variation = dailyAssetVariation({ ...base, quotedAt }, now);
    assert.ok(Number.isNaN(variation.todayChange));
    assert.equal(variation.latestChange, 100);
    assert.equal(variation.isToday, false);
    assert.equal(hasCurrentDayQuotes([{ ...base, quotedAt }], now), false);
}
assert.equal(hasCurrentDayQuotes([base, { ...base, id: 'cash', type: 'cash', quotedAt: undefined }], now), true);
assert.equal(hasCurrentDayQuotes([base, { ...base, id: 'old', quotedAt: '2026-10-01' }], now), false);
assert.deepEqual(filterDashboardAssets([base], 'abaco test-isin', 'fund'), [base]);
assert.deepEqual(filterDashboardAssets([base], 'ábaco', 'crypto'), []);
const withdrawn = calculateCompoundInterestProjection({ initial: 10000, monthly: 0, monthlyRate: 0, periods: 1, withdrawalType: 'fixed', withdrawalValue: 2000 }).at(-1)!;
assert.equal(withdrawn.grossInterest, 0); assert.equal(withdrawn.withdrawal, 2000); assert.equal(withdrawn.total, 8000);
assert.equal(withdrawn.contributed + withdrawn.grossInterest - withdrawn.withdrawal, withdrawn.total);

// Execute the real benchmark effect with controlled hooks/services, not a copy of its logic.
const source = ts.createSourceFile('PortfolioExcelInsights.tsx', readFileSync('src/components/dashboard/PortfolioExcelInsights.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let effectSource = '';
function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect' && node.arguments[0]?.getText(source).includes("getAssetChartData('URTH'")) effectSource = node.arguments[0].getText(source);
    ts.forEachChild(node, visit);
}
visit(source); assert.ok(effectSource);
const effect = ts.transpileModule(`const runEffect = ${effectSource}`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const requests: Array<{ symbol: string; forceRefresh: boolean }> = [];
const context = vm.createContext({ AbortController, tab: 'benchmark', apiEnabled: true, evolutionPeriod: 'YTD', benchmarkStart: 1, benchmarkRetry: 0, requestedRetry: { current: 0 },
    getAssetChartData: async (symbol: string, _period: string, _signal: AbortSignal, options: { forceRefresh: boolean }) => { requests.push({ symbol, forceRefresh: options.forceRefresh }); return [{ date: '2026-01-01', close: 100, currency: symbol === 'URTH' ? 'USD' : 'EUR' }]; },
    convertHistoryToCurrency: (data: unknown) => data, setBenchmarkResult: () => {},
});
vm.runInContext(effect, context);
for (const retry of [0, 1, 1, 2, 2]) {
    context.benchmarkRetry = retry;
    const cleanup = vm.runInContext('runEffect()', context) as () => void;
    await new Promise(resolve => setImmediate(resolve)); cleanup();
}
assert.deepEqual(requests.filter(r => r.symbol === 'URTH').map(r => r.forceRefresh), [false, true, false, true, false]);
assert.deepEqual(requests.filter(r => r.symbol === 'USDEUR=X').map(r => r.forceRefresh), [false, true, false, true, false]);

const fireSource = ts.createSourceFile('FIRECalculator.tsx', readFileSync('src/components/academy/calculators/FIRECalculator.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const tooltipFunctions = fireSource.statements.filter(s => ts.isFunctionDeclaration(s) && ['formatFIRECurrency', 'FIRETooltip'].includes(s.name?.text || '')).map(s => s.getText(fireSource)).join('\n');
const tooltipContext = vm.createContext({ React });
vm.runInContext(ts.transpileModule(tooltipFunctions, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText, tooltipContext);
for (const [includeInflation, mode, label] of [[false, 'real', 'sin ajuste por inflación'], [true, 'real', 'en euros de hoy'], [true, 'nominal', 'en euros futuros (nominal)']] as const) {
    tooltipContext.args = { active: true, payload: [{ value: 100 }, { value: 200 }], label: 1, shouldAdjustForInflation: includeInflation, projectionMode: mode };
    const markup = renderToStaticMarkup(vm.runInContext('FIRETooltip(args)', tooltipContext));
    assert.ok(markup.includes(label), `FIRE tooltip basis: ${label}`);
}

const origin = process.env.FREEWALLET_TEST_URL ?? 'http://127.0.0.1:5177';
assert.match(origin, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const reference = process.env.FREEWALLET_REFERENCE_FILE;
const positions: Asset[] = reference
    ? [...readFileSync(reference, 'utf8').matchAll(/\['([^']+)', '(fund|stock|crypto)', ([\d.]+), ([\d.]+)\]/g)].map(row => ({ ...base, id: row[1], symbol: row[1], isin: row[1], name: `Instrumento ${row[1]}`, type: row[2] as Asset['type'], quantity: Number(row[3]), purchasePrice: Number(row[4]), currentPrice: Number(row[4]) * 1.1, previousClose: Number(row[4]), quotedAt: new Date().toISOString() }))
    : Array.from({ length: 15 }, (_, i) => ({ ...base, id: `test-${i}`, symbol: `TEST${i}`, isin: `ISIN${i}`, type: i < 10 ? 'fund' : 'stock', quotedAt: new Date().toISOString() }));
assert.equal(positions.length, 15);
positions[0].quotedAt = '2026-01-02T12:00:00Z';
const browser = await puppeteer.launch({ headless: true });
const errors: string[] = [];
async function setInput(page: Page, selector: string, value: string) {
    await page.$eval(selector, (node, next) => { const input = node as HTMLInputElement; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, next); input.dispatchEvent(new Event('input', { bubbles: true })); }, value);
}
async function accessibleInputs(page: Page, selector: string) {
    assert.ok(await page.$$eval(selector, nodes => nodes.every(n => (n as HTMLInputElement).labels?.length || n.getAttribute('aria-label'))), 'All calculator controls need an accessible name');
}
try {
    const page = await browser.newPage(); page.on('pageerror', e => errors.push(String(e)));
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.evaluateOnNewDocument((assets, v) => {
        localStorage.setItem('freewallet_portfolio_v1', JSON.stringify({ version: 1, assets, transactions: [] }));
        localStorage.setItem('freewallet_settings', '{"apiEnabled":false}');
        localStorage.setItem('freewallet_last_seen_version', v); localStorage.setItem('freewallet-dashboard-notice-dismissed', '1');
        localStorage.setItem('freewallet_compound_interest_calc', JSON.stringify({ initialCapital: 10000, monthlyContribution: 0, annualRate: 0, years: 1, withdrawalType: 'fixed', withdrawalValue: 2000, showAdvanced: true }));
        localStorage.setItem('freewallet_emergency_fund_calculator', JSON.stringify({ monthlyRent: 0, monthlyFood: 0, monthlyBills: 0, monthlyOther: 0, currentSavings: 1000 }));
        localStorage.setItem('freewallet_fire_calculator', JSON.stringify({ monthlyExpenses: 4, currentSavings: 0, monthlySavings: 100, annualReturn: 0, withdrawalRate: 4, includeInflation: false }));
        localStorage.setItem('freewallet_retirement_calculator', JSON.stringify({ currentAge: 30, retirementAge: 31, currentSavings: 1200, monthlyContribution: 100, annualReturn: 0, inflationRate: 0 }));
    }, positions, version);
    await page.setRequestInterception(true);
    page.on('request', r => { void (new URL(r.url()).origin === origin || /^(data|blob):/.test(r.url()) ? r.continue() : r.abort()); });
    for (const width of [320, 390, 1280]) {
        await page.setViewport({ width, height: 900 }); await page.goto(origin, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.assets-table__filters');
        const weight = await page.$$eval('.assets-table tbody tr', (rows, id) => rows.find(r => r.textContent?.includes(id))?.querySelector('.assets-table__weight span')?.textContent, positions[0].symbol);
        await setInput(page, '.assets-table__filters input', positions[0].symbol);
        await page.waitForFunction(() => document.querySelectorAll('.assets-table tbody tr').length === 1);
        assert.equal(await page.$eval('.assets-table__weight span', n => n.textContent), weight, 'Filtering must not renormalize weights');
        const variationText = await page.$eval('.assets-table__today', n => n.textContent || '');
        assert.ok(variationText.includes('2026') && !variationText.includes('Hoy'));
        await setInput(page, '.assets-table__filters input', 'no-such-instrument');
        await page.waitForFunction(() => document.querySelectorAll('.assets-table tbody tr').length === 0);
        assert.ok((await page.$eval('.assets-table', n => n.textContent))?.includes('No hay activos que coincidan'));
        await setInput(page, '.assets-table__filters input', '');
        await page.select('.assets-table__filters select', 'fund');
        await page.waitForFunction(expected => document.querySelectorAll('.assets-table tbody tr').length === expected, {}, positions.filter(a => a.type === 'fund').length);
        await page.select('.assets-table__filters select', 'all');
        for (const theme of ['light', 'dark']) for (const appearance of ['standard', 'liquid-glass']) {
            await page.evaluate((t, a) => { document.documentElement.dataset.theme = t; document.documentElement.dataset.appearance = a; }, theme, appearance);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Dashboard overflow ${width}/${theme}/${appearance}`);
            assert.ok(await page.$$eval('.assets-table__filters input,.assets-table__filters select', nodes => nodes.every(n => n.getBoundingClientRect().height >= 44)));
        }
        assert.ok(await page.$$eval('.performers', nodes => nodes.every(n => n.textContent?.includes('Rentabilidad desde la compra'))));
        await page.goto(`${origin}/academy/compound-interest`, { waitUntil: 'networkidle2' });
        const compound = await page.$eval('.compound__result-cards', n => n.textContent || '');
        assert.match(compound, /Intereses Generados0\s*€/); assert.match(compound, /Retiradas Acumuladas2000\s*€/); assert.match(compound, /Capital Final8000\s*€/);
        assert.ok((await page.$eval('.compound__chart-legend', n => n.textContent))?.includes('Saldo Disponible'));
        await page.goto(`${origin}/academy/emergency-fund`, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.emergency');
        assert.ok((await page.$eval('.emergency__results', n => n.textContent))?.includes('Añade tus gastos mensuales'));
        assert.ok(!(await page.$eval('.emergency__results', n => n.textContent))?.includes('Te faltan -'));
        await accessibleInputs(page, '.emergency input,.emergency select');
        await setInput(page, '#emergencyfundcalculator-monthlyRent', '100');
        await page.waitForSelector('.emergency__recommendation-box');
        assert.ok((await page.$eval('.emergency__results', n => n.textContent))?.includes('fondo completo'));
        await page.goto(`${origin}/academy/inflation-predator`, { waitUntil: 'networkidle2' });
        await page.waitForSelector('#amount'); await accessibleInputs(page, '.inflation-predator input');
        await setInput(page, '#amount', '');
        assert.equal(await page.$eval('#amount', n => (n as HTMLInputElement).value), '');
        await page.waitForSelector('.inflation-predator [role="alert"]');
        await setInput(page, '#amount', '10000'); await setInput(page, '#inflation', '-1');
        await page.waitForFunction(() => document.querySelector('.loss-tag')?.textContent?.includes('Ganancia de poder de compra'));
        for (const path of ['fire', 'retirement']) {
            await page.goto(`${origin}/academy/${path === 'fire' ? 'fire-calculator' : path}`, { waitUntil: 'networkidle2' });
            await page.waitForSelector('.scenario-comparison'); await accessibleInputs(page, `.${path} input`);
            await page.$eval('.scenario-comparison__controls button', n => (n as HTMLButtonElement).click());
            await page.waitForFunction(() => document.querySelectorAll('.scenario-comparison__item').length === 1);
            const first = await page.$eval('.scenario-comparison__item', n => n.textContent);
            assert.ok(first?.includes(path === 'fire' ? '1 año' : '2400'));
            const field = path === 'fire' ? '#firecalculator-monthlySavings' : '#retirementcalculator-monthlyContribution';
            await setInput(page, field, '200');
            await page.$eval('.scenario-comparison__controls button', n => (n as HTMLButtonElement).click());
            await page.waitForFunction(() => document.querySelectorAll('.scenario-comparison__item').length === 2);
            assert.equal(await page.$eval('.scenario-comparison__item', n => n.textContent), first, 'Saved scenarios must not change with new inputs');
            await setInput(page, field, '300'); await page.$eval('.scenario-comparison__controls button', n => (n as HTMLButtonElement).click());
            await page.waitForFunction(() => document.querySelectorAll('.scenario-comparison__item').length === 3);
            assert.equal(await page.$eval('.scenario-comparison__controls button', n => (n as HTMLButtonElement).disabled), true);
            await setInput(page, field, '');
            assert.equal(await page.$eval('.scenario-comparison__controls button', n => (n as HTMLButtonElement).disabled), true);
            assert.equal(await page.$$eval('.scenario-comparison__item', nodes => nodes.length), 3);
            for (const theme of ['light', 'dark']) for (const appearance of ['standard', 'liquid-glass']) {
                await page.evaluate((t, a) => { document.documentElement.dataset.theme = t; document.documentElement.dataset.appearance = a; }, theme, appearance);
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path} overflow ${width}/${theme}/${appearance}`);
                assert.ok(await page.$$eval('.scenario-comparison button', nodes => nodes.every(n => n.getBoundingClientRect().height >= 44)));
            }
            await page.$eval('.scenario-comparison__item button', n => (n as HTMLButtonElement).click());
            await page.waitForFunction(() => document.querySelectorAll('.scenario-comparison__item').length === 2);
            if (width === 390) await (await page.$('.scenario-comparison'))!.screenshot({ path: join(tmpdir(), `freewallet-${path}-scenarios.png`) });
        }
    }
    assert.deepEqual(errors, []);
    console.log('PASS: withdrawal accounting, dated daily changes, one-shot benchmark retries, 15-position search/filter weights, zero-expense state, empty inflation inputs, accessible calculator controls and immutable scenarios in mobile/desktop and both themes.');
} finally { await browser.close(); }
