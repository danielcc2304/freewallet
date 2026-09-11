import assert from 'node:assert/strict';
import { buildPortfolioAnalyticsHistory, calculatePeriodPerformance, normalizePortfolioTransactions, performanceSeries } from '../src/services/portfolioPerformance';
import type { PortfolioTransaction } from '../src/types/types';
const history = [
    { date: '2026-01-01T18:00:00Z', value: 100, invested: 100 },
    { date: '2026-01-02T18:00:00Z', value: 200, invested: 200 },
    { date: '2026-01-03T18:00:00Z', value: 170, invested: 150 },
];
const trade = (type: 'buy' | 'sell', total: number, day: string): PortfolioTransaction => ({
    id: day, assetId: 'a', assetSymbol: 'A', assetName: 'A', assetType: 'stock', type,
    total, date: day, createdAt: `${day}T12:00:00Z`,
});
const series = performanceSeries(history, [trade('buy', 100, '2026-01-02'), trade('sell', 50, '2026-01-03')]);
assert.equal(series[0].dailyReturn, null);
assert.equal(series[1].dailyReturn, 0, 'A purchase must not count as profit');
assert.equal(series[2].dailyReturn, 10, 'Sale proceeds must be restored when calculating return');
assert.ok(Math.abs(series[2].cumulativeReturn - 10) < 1e-9);
const saleWithGain = performanceSeries([
    { date: '2026-01-01T18:00:00Z', value: 200, invested: 200 },
    { date: '2026-01-02T18:00:00Z', value: 100, invested: 100 },
], [trade('sell', 150, '2026-01-02')]);
assert.equal(saleWithGain[1].dailyReturn, 25, 'Sale proceeds, not cost basis, must be used as the TWR cash flow');
assert.equal(performanceSeries(history, [])[1].dailyReturn, 0, 'Unrecorded invested-capital changes are treated as portfolio flows');
const sameDayAsset = { id: 'same-day', symbol: 'NEW', name: 'New asset', type: 'stock' as const, purchasePrice: 100, purchaseDate: '2026-01-02', quantity: 1, currentPrice: 150, currency: 'EUR' as const };
const sameDaySeries = performanceSeries([
    { date: '2026-01-01T18:00:00Z', value: 100, invested: 100 },
    { date: '2026-01-02T18:00:00Z', value: 250, invested: 200 },
], [{ ...trade('buy', 100, '2026-01-02'), assetId: sameDayAsset.id, assetSymbol: sameDayAsset.symbol, assetName: sameDayAsset.name, quantity: 1 }], [sameDayAsset]);
assert.equal(sameDaySeries[1].dailyReturn, 0, 'The first live quote of a same-day purchase must not become a return');

const backdatedTrade = { ...trade('buy', 100, '2026-01-02'), createdAt: '2026-02-01T12:00:00Z' };
const backdatedHistory = buildPortfolioAnalyticsHistory([
    { date: '2026-01-01T18:00:00Z', value: 100, invested: 100 },
    { date: '2026-01-03T18:00:00Z', value: 200, invested: 200 },
], [backdatedTrade]);
assert.ok(backdatedHistory.some((point) => point.date.slice(0, 10) === '2026-01-02'), 'The live history keeps a baseline on the entered operation date');
assert.equal(performanceSeries([
    { date: '2026-01-01T18:00:00Z', value: 100, invested: 100 },
    { date: '2026-01-03T18:00:00Z', value: 200, invested: 200 },
], [backdatedTrade])[1].dailyReturn, 0, 'Backdated purchases are treated as portfolio flows on their entered date');
assert.equal(performanceSeries([
    { date: '2026-01-01T18:00:00Z', value: 10000, invested: 10000 },
    { date: '2026-01-02T18:00:00Z', value: 85000, invested: 66000 },
], [])[1].dailyReturn, 0, 'A material imported contribution is not treated as a one-day return');

// Five-year audit: staggered stock/fund purchases, weekly valuations and a
// deterministic market path must produce finite, bounded period metrics.
const auditAssets = [
    { id: 'aapl', symbol: 'AAPL', name: 'Apple', type: 'stock' as const, purchasePrice: 100, purchaseDate: '2021-01-15', quantity: 20, currentPrice: 205, currency: 'EUR' as const },
    { id: 'world', symbol: 'WORLD', name: 'World fund', type: 'fund' as const, purchasePrice: 90, purchaseDate: '2022-06-10', quantity: 50, currentPrice: 143, currency: 'EUR' as const },
    { id: 'bond', symbol: 'BOND', name: 'Euro bond', type: 'etf' as const, purchasePrice: 102, purchaseDate: '2024-03-20', quantity: 80, currentPrice: 108, currency: 'EUR' as const },
];
const auditTransactions: PortfolioTransaction[] = auditAssets.map((asset) => ({
    id: `audit-${asset.id}`,
    assetId: asset.id,
    assetSymbol: asset.symbol,
    assetName: asset.name,
    assetType: asset.type,
    type: 'buy',
    date: asset.purchaseDate,
    quantity: asset.quantity,
    price: asset.purchasePrice,
    total: asset.quantity * asset.purchasePrice,
    createdAt: `${asset.purchaseDate}T00:00:00Z`,
}));
const auditStart = new Date('2021-01-01T00:00:00Z');
const auditHistory: { date: string; value: number; invested: number }[] = [];
let auditValue = 0;
let auditInvested = 0;
for (let day = 0; day <= 5 * 365; day += 1) {
    const date = new Date(auditStart);
    date.setUTCDate(date.getUTCDate() + day);
    const dateKey = date.toISOString().slice(0, 10);
    auditTransactions.filter((transaction) => transaction.date === dateKey).forEach((transaction) => {
        auditInvested += transaction.total || 0;
        auditValue += transaction.total || 0;
    });
    const marketReturn = Math.sin(day * 0.17) * 0.0015 + Math.cos(day * 0.031) * 0.0008;
    auditValue *= 1 + marketReturn;
    if (day % 7 === 0) auditHistory.push({ date: dateKey, value: auditValue, invested: auditInvested });
}
const auditLast = auditHistory.at(-1)!;
const auditHistoryWithDates = buildPortfolioAnalyticsHistory(auditHistory, auditTransactions, auditLast, auditAssets);
const auditSeries = performanceSeries(auditHistoryWithDates, auditTransactions);
const auditMonthly = new Map<string, { factor: number; observations: number }>();
auditSeries.forEach((point) => {
    const row = auditMonthly.get(point.date.slice(0, 7)) || { factor: 1, observations: 0 };
    if (point.dailyReturn !== null) {
        row.factor *= 1 + point.dailyReturn / 100;
        row.observations += 1;
    }
    auditMonthly.set(point.date.slice(0, 7), row);
});
const auditMonthlyReturns = [...auditMonthly.values()]
    .filter((row) => row.observations > 0)
    .map((row) => (row.factor - 1) * 100);
const auditMean = auditMonthlyReturns.reduce((sum, value) => sum + value, 0) / auditMonthlyReturns.length;
const auditVolatility = Math.sqrt(auditMonthlyReturns.reduce((sum, value) => sum + (value - auditMean) ** 2, 0) / (auditMonthlyReturns.length - 1));
const auditNegative = auditMonthlyReturns.filter((value) => value < 0);
const auditDownside = Math.sqrt(auditNegative.reduce((sum, value) => sum + value ** 2, 0) / auditNegative.length);
assert.ok(auditHistoryWithDates.length > 250 && auditMonthlyReturns.length >= 60, 'The five-year scenario must retain its observations');
assert.ok(Number.isFinite(auditMean) && Number.isFinite(auditVolatility) && Number.isFinite(auditDownside), 'Risk inputs must be finite');
assert.ok(Math.abs(auditMean / auditVolatility * Math.sqrt(12)) < 10, 'Sharpe must remain bounded for a diversified five-year path');
assert.ok(Math.abs(auditMean / auditDownside * Math.sqrt(12)) < 20, 'Sortino must remain bounded for a diversified five-year path');
for (const start of ['2021-01-01', '2025-01-01', '2026-01-01']) {
    const period = calculatePeriodPerformance(auditSeries, new Date(`${start}T00:00:00Z`).getTime(), auditLast.date === start ? Date.parse(`${start}T23:59:59Z`) : Date.parse('2026-01-01T00:00:00Z'));
    if (period.hasBase && period.returnPercent !== null) assert.ok(Number.isFinite(period.returnPercent) && Math.abs(period.returnPercent) < 1000, `Period return should be sensible for ${start}`);
}

// Reconciliation keeps the dates while correcting an imported duplicated
// amount, preventing a fake contribution spike at the current timestamp.
const reconciled = normalizePortfolioTransactions([auditAssets[0]], [{ ...auditTransactions[0], total: 2000 }]);
assert.equal(reconciled[0].date, auditTransactions[0].date);
assert.equal(reconciled[0].total, 2000, 'Already matching operation amounts are preserved');
const reconciledDuplicate = normalizePortfolioTransactions([auditAssets[0]], [{ ...auditTransactions[0], total: 4000 }]);
assert.equal(reconciledDuplicate[0].date, auditTransactions[0].date);
assert.equal(reconciledDuplicate[0].total, 2000, 'Duplicated imported amounts are reconciled without moving their date');
const stalePeriod = calculatePeriodPerformance(
    performanceSeries([
        { date: '2026-02-12', value: 100, invested: 100 },
        { date: '2026-09-11', value: 140, invested: 100 },
    ], []),
    Date.parse('2026-08-11T00:00:00Z'),
    Date.parse('2026-09-11T00:00:00Z'),
    45 * 24 * 60 * 60 * 1000,
);
assert.equal(stalePeriod.hasBase, false, 'A one-month return must not reuse a seven-month-old valuation');
assert.equal(performanceSeries([
    { date: '2026-02-12', value: 100, invested: 100 },
    { date: '2026-09-11', value: 140, invested: 100 },
], [])[1].dailyReturn, null, 'A long valuation gap must not become a monthly return');
const existingAsset = { id: 'existing', symbol: 'OLD', name: 'Existing', type: 'stock' as const, purchasePrice: 100, purchaseDate: '2026-01-01', quantity: 1, currentPrice: 100, currency: 'EUR' as const };
const addedAsset = { id: 'added', symbol: 'NEW', name: 'Added', type: 'fund' as const, purchasePrice: 10, purchaseDate: '2026-01-02', quantity: 1, currentPrice: 15, currency: 'EUR' as const };
const operationDay = [{ ...trade('buy', 10, '2026-01-02'), assetId: addedAsset.id, assetSymbol: addedAsset.symbol, assetName: addedAsset.name, assetType: addedAsset.type, quantity: 1 }];
const operationSeries = performanceSeries([
    { date: '2026-01-01', value: 100, invested: 100 },
    { date: '2026-01-02T00:00:00.000Z', value: 110, invested: 110 },
    { date: '2026-01-02T18:00:00Z', value: 115, invested: 110 },
], operationDay, [existingAsset, addedAsset]);
assert.equal(operationSeries.at(-2)?.dailyReturn, 0, 'The dated purchase baseline has no return');
assert.equal(operationSeries.at(-1)?.dailyReturn, 0, 'The first quote after a same-day purchase has no return');
console.log('Portfolio performance tests passed');
