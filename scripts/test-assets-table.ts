import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareKnownReturns, dailyAssetVariation } from '../src/services/dashboardIntegrity';
import type { Asset } from '../src/types/types';

const base: Asset = { id: 'synthetic', name: 'Synthetic fund with a long descriptive name', symbol: 'TEST', type: 'fund', currency: 'EUR', quantity: 10, purchasePrice: 8, purchaseDate: '2026-01-01', previousClose: 100 };
const rows = [105, undefined, 95, 100, 0].map(currentPrice => ({ ...base, currentPrice, ...dailyAssetVariation({ ...base, currentPrice }) }));
for (const direction of ['asc', 'desc'] as const) {
    const sorted = [...rows].sort((a, b) => compareKnownReturns(a.todayChangePercent, b.todayChangePercent, direction));
    assert.deepEqual(sorted.map(a => a.currentPrice), direction === 'asc' ? [0, 95, 100, 105, undefined] : [105, 100, 95, 0, undefined]);
}
assert.equal(dailyAssetVariation({ ...base, currentPrice: 105 }).todayChange, 50);
assert.ok(Number.isNaN(dailyAssetVariation({ ...base, currentPrice: 105, previousClose: 0 }).todayChangePercent));
assert.ok(Number.isNaN(dailyAssetVariation({ ...base, currentPrice: 105, currency: 'USD' }).todayChangePercent));
const component = readFileSync(new URL('../src/components/dashboard/AssetsTable.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/components/dashboard/AssetsTable.css', import.meta.url), 'utf8');
assert.match(component, /handleSort\('today'\)/);
assert.match(component, /aria-sort=\{sortKey === 'today'/);
assert.match(component, /compareKnownReturns\(a.todayChangePercent, b.todayChangePercent/);
assert.match(css, /\.assets-table__table--show-details \.assets-table__name\s*\{[^}]*white-space: normal;[^}]*overflow-wrap: anywhere;/);
assert.match(css, /\.assets-table__table--show-details \.assets-table__column--asset\s*\{ grid-column: 1 \/ -1;/);
assert.doesNotMatch(css, /\.assets-table__table--show-details \.assets-table__today\s*\{[^}]*display: none/);
console.log('Assets table passed: daily percentage sorting both ways, unavailable values last, full mobile names and visible daily variation in expanded mode. CSS checks are structural, not visual.');
