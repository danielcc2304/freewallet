import assert from 'node:assert/strict';
import { alignedBenchmark, buildPortfolioAnalyticsHistory, createQuoteSnapshot, normalizePortfolioTransactions, performanceSeries, readBatchSnapshot, selectPortfolioPeriod } from '../src/services/portfolioPerformance';
import { benchmarkChartCadence, benchmarkPeriodDifference } from '../src/services/benchmarkComparison';
import { weightedBenchmarkHistory } from '../src/services/portfolioBenchmark';
import type { Asset, HistoricalDataPoint } from '../src/types/types';

const collected = '2026-10-14T18:30:03Z';
const fund: Asset = { id: 'fund', symbol: 'IE00BYX5NX33', isin: 'IE00BYX5NX33', name: 'Synthetic fund', type: 'fund', quantity: 10, purchasePrice: 10, purchaseDate: '2026-01-01', currentPrice: 14, currency: 'EUR', quotedAt: '2026-10-13T00:00:00Z', lastCheckedAt: '2026-10-14T14:00:05Z' };
const stock: Asset = { ...fund, id: 'stock', symbol: 'TEST', isin: undefined, type: 'stock', quotedAt: '2026-10-14T18:29:56Z', lastCheckedAt: '2026-10-14T18:30:01Z' };
assert.equal(createQuoteSnapshot([fund, stock], [], collected), null, 'A cached consultation cannot create a new live valuation');
const saved = readBatchSnapshot([fund, stock], [], collected)!;
assert.ok(saved, 'A recorded batch valuation accepts the earlier fund checkpoint');
assert.equal(saved.date, collected, 'Preserve the original collection date');
assert.equal(saved.value, 280);
assert.equal(fund.lastCheckedAt, '2026-10-14T14:00:05Z', 'Never restamp source consultations');
assert.equal(readBatchSnapshot([{ ...fund, quoteOrigin: 'batch' }], [], collected)?.value, 140);
for (const invalid of [
    { currentPrice: undefined }, { currentPrice: NaN }, { currency: 'USD' }, { quantity: -1 },
    { purchasePrice: -1 }, { quotedAt: undefined }, { quotedAt: '2026-10-15T00:00:00Z' },
    { quotedAt: '2026-10-06T00:00:00Z' }, { lastCheckedAt: undefined },
    { lastCheckedAt: '2026-10-12T00:00:00Z' }, { lastCheckedAt: '2026-10-15T00:00:00Z' },
]) assert.equal(readBatchSnapshot([{ ...fund, ...invalid }], [], collected), null);
assert.equal(readBatchSnapshot([], [], collected), null);
assert.equal(readBatchSnapshot([fund], [], 'invalid'), null);

// An old recorded snapshot remains readable later: validate at capture time,
// then use real shared dates for the chart and period difference.
const history = ['11', '12', '13', '14'].map((day, i) => readBatchSnapshot([
    { ...fund, currentPrice: 14 + i / 10, quotedAt: `2026-10-${day}T00:00:00Z`, lastCheckedAt: `2026-10-${day}T14:00:00Z` },
], [], `2026-10-${day}T18:30:00Z`)!);
assert.equal(history.filter(Boolean).length, 4);
const ledger = normalizePortfolioTransactions([fund], []);
const series = performanceSeries(buildPortfolioAnalyticsHistory(history, ledger), ledger);
const selected = selectPortfolioPeriod(series, 'ALL', Date.parse('2026-10-14T21:00:00Z'));
assert.equal(selected.performance.endDate, '2026-10-14');
const nav = (day: string, price: number): HistoricalDataPoint => ({ date: `2026-10-${day}T00:00:00Z`, close: price, open: price, high: price, low: price, volume: 0, currency: 'EUR' });
const equity = [nav('11', 14), nav('12', 14.1), nav('13', 14.2)];
const defensive = [nav('11', 100), nav('12', 100.01), nav('13', 100.02)];
for (const benchmark of [equity, weightedBenchmarkHistory(equity, defensive, 80)]) {
    const line = alignedBenchmark(selected.points, benchmark);
    assert.equal(line.at(-1)?.date, '2026-10-13', 'Use the latest common date, not the stale October 11 endpoint');
    assert.equal(benchmarkPeriodDifference(line, selected.performance.baseDate)?.endDate, '2026-10-13');
    const byDay = new Map(line.map(point => [point.date, point.benchmark]));
    const chart = benchmarkChartCadence(selected.points.map(point => ({ date: point.date, benchmark: byDay.get(point.date) ?? null })), 'YTD');
    assert.equal(chart.at(-2)?.date, '2026-10-13');
    assert.equal(chart.at(-1)?.date, '2026-10-14');
    assert.equal(chart.at(-1)?.benchmark, null, 'No invented NAV on October 14');
}
console.log('Batch history: cached fund checkpoints, historical timestamps, invalid quotes, live isolation and latest common benchmark dates passed.');
