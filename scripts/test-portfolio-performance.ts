import assert from 'node:assert/strict';
import { performanceSeries } from '../src/services/portfolioPerformance';
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
assert.equal(performanceSeries(history, [])[1].dailyReturn, null, 'Unexplained changes must not create returns');
console.log('Portfolio performance tests passed');
