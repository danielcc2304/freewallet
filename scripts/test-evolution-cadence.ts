import assert from 'node:assert/strict';
import { evolutionChartCadence } from '../src/services/benchmarkComparison';
const points = [
    '2025-12-31',
    '2026-01-31',
    '2026-02-28',
    '2026-09-30',
    '2026-10-01',
    '2026-10-02',
    '2026-10-30',
    '2026-10-31',
    '2026-11-01',
    '2026-11-03',
].map((date, index) => ({ date, value: 1000 + index * 12, invested: 1000, netFlow: index === 5 ? 100 : 0 }));
const original = structuredClone(points);
for (const period of ['3M', 'YTD', 'ALL'] as const) {
    const sampled = evolutionChartCadence(points, period);
    assert.deepEqual(
        sampled.map((p) => p.date),
        ['2025-12-31', '2026-01-31', '2026-02-28', '2026-09-30', '2026-10-31', '2026-11-03'],
    );
    assert.equal(sampled[0], points[0]);
    assert.equal(sampled.at(-1), points.at(-1), 'Keep the real latest valuation, including provisional November');
    assert.equal(sampled.at(-2)!.value, points[7].value);
}
for (const period of ['1D', '7D', '1M'] as const)
    assert.equal(evolutionChartCadence(points, period), points, 'Short ranges keep daily detail');
assert.deepEqual(points, original, 'Sampling must not alter full valuations or flows');
assert.deepEqual(evolutionChartCadence([], 'ALL'), []);
assert.deepEqual(evolutionChartCadence(points.slice(0, 1), 'YTD'), points.slice(0, 1));
assert.deepEqual(
    evolutionChartCadence(points.slice(4, 8), 'ALL').map((p) => p.date),
    ['2026-10-01', '2026-10-31'],
    'Preserve an exact partial-period base',
);
console.log(
    'PASS: monthly long-range evolution, provisional current month, exact bases, daily short ranges and unchanged source valuations/flows.',
);
