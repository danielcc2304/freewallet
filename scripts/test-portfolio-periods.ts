import assert from 'node:assert/strict';
import { performanceSeries, selectPortfolioPeriod } from '../src/services/portfolioPerformance';

const now = Date.parse('2026-10-07T12:00:00Z');
const points = [
    { date: '2026-06-30T18:00:00Z', value: 1300, invested: 1000, cadence: 'monthly' as const },
    { date: '2026-07-31T18:00:00Z', value: 1400, invested: 1000, cadence: 'monthly' as const },
    { date: '2026-08-31T18:00:00Z', value: 1500, invested: 1000, cadence: 'monthly' as const },
    { date: '2026-09-30T18:00:00Z', value: 1760, invested: 1200, cadence: 'monthly' as const },
    { date: '2026-10-04T18:00:00Z', value: 1770, invested: 1200, cadence: 'daily' as const },
    { date: '2026-10-05T18:00:00Z', value: 1780, invested: 1200, cadence: 'daily' as const },
    { date: '2026-10-06T18:00:00Z', value: 1790, invested: 1200, cadence: 'daily' as const },
];
const flows = [{ id: 'contribution', assetId: 'workbook-history', assetSymbol: 'DCA', assetName: 'Contribution', assetType: 'fund' as const, type: 'buy' as const, date: '2026-09-30', total: 200, createdAt: '2026-09-30' }];
const series = performanceSeries(points, flows);
const month = selectPortfolioPeriod(series, '1M', now);
assert.equal(month.monthlyBase, true);
assert.equal(month.performance.baseDate, '2026-08-31');
assert.equal(month.performance.endDate, '2026-10-06');
assert.equal(month.points[0].date, month.performance.baseDate);
assert.equal(month.performance.change, 90, 'Contributions are not market gains');
assert.ok(Math.abs(month.performance.returnPercent! - ((1.04 * 1790 / 1760) - 1) * 100) < 1e-8);
const quarter = selectPortfolioPeriod(series, '3M', now);
assert.equal(quarter.monthlyBase, true);
assert.equal(quarter.performance.baseDate, '2026-06-30');
assert.equal(quarter.performance.change, 290);
assert.equal(selectPortfolioPeriod(series, '1D', now).performance.change, 10);
assert.equal(selectPortfolioPeriod(series, '7D', now).performance.change, 30);
assert.equal(selectPortfolioPeriod(series, 'YTD', now).performance.returnPercent, null, 'YTD cannot silently skip January without an opening valuation');
for (const period of ['1D', '7D'] as const) {
    assert.equal(selectPortfolioPeriod(performanceSeries(points.slice(0, 4), flows), period, now).monthlyBase, false);
}
const oneClose = selectPortfolioPeriod(performanceSeries(points.slice(3), []), '1M', now);
assert.equal(oneClose.performance.returnPercent, null, 'One monthly close after the cutoff cannot replace a missing opening value');
assert.equal(oneClose.monthlyBase, false);
const dailyOnly = selectPortfolioPeriod(performanceSeries(points.map(p => ({ ...p, cadence: 'daily' })), flows), '1M', now);
assert.equal(dailyOnly.performance.returnPercent, null, 'Sparse daily data cannot masquerade as monthly closes');
assert.equal(dailyOnly.monthlyBase, false);
const missingMonth = selectPortfolioPeriod(performanceSeries(points.filter(p => !p.date.startsWith('2026-08')), flows), '3M', now);
assert.equal(missingMonth.performance.returnPercent, null, 'Monthly selection must preserve unknown intervals');
const uncertainFlow = selectPortfolioPeriod(performanceSeries(points.map(p => p.date.startsWith('2026-10-04') ? { ...p, returnUnavailable: true } : p), flows), '1M', now);
assert.equal(uncertainFlow.performance.returnPercent, null);
const nearClose = selectPortfolioPeriod(series, '1M', Date.parse('2026-10-29T12:00:00Z'));
assert.equal(nearClose.performance.baseDate, '2026-09-30');
assert.equal(nearClose.monthlyBase, false, 'The nearby real close remains preferable to extending the range by a month');
const oldClose = selectPortfolioPeriod(performanceSeries(points.slice(0, 3), []), '1M', Date.parse('2026-11-07T12:00:00Z'));
assert.equal(oldClose.performance.returnPercent, null);
assert.equal(oldClose.monthlyBase, false);
console.log('Portfolio periods passed: monthly and quarterly closes, explicit real dates, contribution-adjusted gains, strict daily/weekly windows and unavailable incomplete histories.');
