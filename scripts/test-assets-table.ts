import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareKnownReturns, dailyAssetVariation } from '../src/services/dashboardIntegrity';
import type { Asset } from '../src/types/types';
import { recipeDeclarations } from './helpers/compileModuleStyles';
import { assetsGridStyle } from '../src/components/dashboard/ui/DashboardAssetsGrid.styles';

const base: Asset = {
    id: 'synthetic',
    name: 'Synthetic fund with a long descriptive name',
    symbol: 'TEST',
    type: 'fund',
    currency: 'EUR',
    quantity: 10,
    purchasePrice: 8,
    purchaseDate: '2026-01-01',
    previousClose: 100,
    quotedAt: new Date().toISOString(),
};
const rows = [105, undefined, 95, 100, 0].map((currentPrice) => ({
    ...base,
    currentPrice,
    ...dailyAssetVariation({ ...base, currentPrice }),
}));
for (const direction of ['asc', 'desc'] as const) {
    const sorted = [...rows].sort((a, b) => compareKnownReturns(a.todayChangePercent, b.todayChangePercent, direction));
    assert.deepEqual(
        sorted.map((a) => a.currentPrice),
        direction === 'asc' ? [0, 95, 100, 105, undefined] : [105, 100, 95, 0, undefined],
    );
}
assert.equal(dailyAssetVariation({ ...base, currentPrice: 105 }).todayChange, 50);
assert.ok(Number.isNaN(dailyAssetVariation({ ...base, currentPrice: 105, previousClose: 0 }).todayChangePercent));
assert.ok(Number.isNaN(dailyAssetVariation({ ...base, currentPrice: 105, currency: 'USD' }).todayChangePercent));
const component = readFileSync(new URL('../src/components/dashboard/AssetsTable.tsx', import.meta.url), 'utf8');
const declarations = await recipeDeclarations(assetsGridStyle('assets-table__table--show-details'));
assert.match(component, /handleSort\('today'\)/);
assert.match(component, /aria-sort=\{sortKey === 'today'/);
assert.match(component, /compareKnownReturns\(a.latestChangePercent, b.latestChangePercent/);
const has = (target: string, property: string, value: string) =>
    declarations.some((d) => d.context.includes(target) && d.property === property && d.value === value);
assert.ok(has('assets-table__name', 'white-space', 'normal'));
assert.ok(has('assets-table__name', 'overflow-wrap', 'anywhere'));
assert.ok(has('assets-table__column--asset', 'grid-column', '1 / -1'));
assert.ok(!has('assets-table__today', 'display', 'none'));
console.log(
    'Assets table passed: daily percentage sorting both ways, unavailable values last, full mobile names and visible daily variation in expanded mode. CSS checks are structural, not visual.',
);
