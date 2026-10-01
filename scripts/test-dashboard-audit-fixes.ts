import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applicableQuoteUpdates, applyPositionUpdate, chooseUnderlyingResult, compareKnownReturns } from '../src/services/dashboardIntegrity';
import { buildConsolidatedPortfolioExposures } from '../src/services/portfolioComposition';
import { performanceSeries, portfolioMonthlyRows, calculatePeriodPerformance } from '../src/services/portfolioPerformance';
import type { Asset, SearchResult, PortfolioHistoryPoint, PortfolioTransaction } from '../src/types/types';

const asset: Asset = { id: 'synthetic', symbol: 'TEST', name: 'Test company', type: 'stock', currency: 'EUR', purchasePrice: 10, currentPrice: 10, quantity: 100, purchaseDate: '2025-01-02' };
const updates = [{ id: asset.id, updates: { currentPrice: 12 } }];
assert.equal(applyPositionUpdate(asset, { symbol: 'OTHER' }).currentPrice, undefined);
assert.equal(applyPositionUpdate(asset, { quantity: 200 }).currentPrice, 10);
assert.equal(applicableQuoteUpdates([asset], [{ ...asset, symbol: 'OTHER' }], updates).length, 0);
assert.equal(applicableQuoteUpdates([asset], [{ ...asset, isin: 'US0000000001' }], updates).length, 0);
assert.equal(applicableQuoteUpdates([asset], [], updates).length, 0);
assert.equal(applicableQuoteUpdates([asset], [{ ...asset, quantity: 200 }], updates).length, 1);
for (const direction of ['asc', 'desc'] as const) {
    const sorted = [-3, NaN, 5, Infinity, 0].sort((a, b) => compareKnownReturns(a, b, direction));
    assert.deepEqual(sorted.slice(0, 3), direction === 'asc' ? [-3, 0, 5] : [5, 0, -3]);
    assert.ok(!Number.isFinite(sorted[3]) && !Number.isFinite(sorted[4]));
}
const result = (symbol: string, name: string): SearchResult => ({ symbol, name, type: 'stock', currency: 'USD', region: 'Global' });
const holding = { symbol: '', name: 'Example Company', percentage: 5 };
assert.equal(chooseUnderlyingResult([result('WRONG', 'Unrelated Inc')], holding), undefined);
assert.equal(chooseUnderlyingResult([result('A', 'Example Company'), result('B', 'Example Company')], holding), undefined);
assert.equal(chooseUnderlyingResult([result('A', 'Example Company')], holding)?.symbol, 'A');
assert.equal(chooseUnderlyingResult([result('A', 'Example Company')], { ...holding, isin: 'US0000000001' }), undefined);
assert.equal(chooseUnderlyingResult([result('A', 'Example Company')], { ...holding, symbol: 'US0000000001' }), undefined);
const fund = { ...asset, type: 'fund' as const, symbol: 'IE0000000001' };
const exposures = buildConsolidatedPortfolioExposures([fund]);
assert.equal(exposures[0].isResidual, true);
assert.equal(exposures[0].hasDirectPosition, false);
assert.equal(exposures[0].weight, 100);
const history: PortfolioHistoryPoint[] = [
    { date: '2026-08-31T18:00:00Z', value: 1000, invested: 1000, cadence: 'daily' },
    { date: '2026-09-07T18:00:00Z', value: 2100, invested: 2000, cadence: 'daily' },
    { date: '2026-09-14T18:00:00Z', value: 2310, invested: 2000, cadence: 'daily' },
    { date: '2026-09-21T18:00:00Z', value: 2310, invested: 2000, cadence: 'daily' },
    { date: '2026-09-28T18:00:00Z', value: 2310, invested: 2000, cadence: 'daily' },
];
const flow: PortfolioTransaction = { id: 'flow', assetId: asset.id, assetName: asset.name, assetSymbol: asset.symbol, assetType: asset.type, type: 'buy', date: '2026-09-07', quantity: 100, price: 10, total: 1000, createdAt: '2026-09-07' };
const series = performanceSeries(history, [flow]);
const monthly = portfolioMonthlyRows(series, Date.parse('2026-10-01')).at(-1)!;
assert.ok(Math.abs(monthly.monthlyReturn! - 21) < 1e-8);
assert.equal(monthly.monthlyReturn, calculatePeriodPerformance(series, series[0].timestamp).returnPercent);
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
assert.match(read('src/pages/AddInvestment/AddInvestment.tsx'), /purchaseDate: isEditMode \? targetAsset!\.purchaseDate/);
assert.match(read('src/components/dashboard/UnderlyingAssetDetail.tsx'), /<AssetDetail asset=\{resolvedAsset\} marketOnly/);
assert.match(read('src/components/dashboard/AssetDetail.tsx'), /!marketOnly && <div className="asset-detail__position-grid"/);
assert.match(read('src/components/dashboard/LivePortfolioPlan.tsx'), /freewallet-plan-targets-change/);
assert.doesNotMatch(read('src/components/dashboard/LivePortfolioPlan.tsx'), /notifyLocalDataChange/);
assert.match(read('src/services/apiService.ts'), /!options.forceRefresh && cached/);
console.log('Dashboard audit fixes passed: quote identity races, N/D sorting, conservative lookup, unknown coverage, linked monthly returns, preserved edit dates, market-only detail, targeted updates and cache bypass.');
