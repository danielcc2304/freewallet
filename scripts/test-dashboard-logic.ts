import assert from 'node:assert/strict';
import { calculateContributionPlan, migratePlanTargets, parsePlanNumber, planAssetKey, targetsFromCurrentWeights } from '../src/services/portfolioPlan';
import { alignedBenchmark, chooseBenchmarkLine, performanceSeries, portfolioMonthlyRows, selectPortfolioPeriod } from '../src/services/portfolioPerformance';
import { workbookRiskStats, latestContinuousMonths } from '../src/services/portfolioRisk';
import { calculateAdvancedPortfolioStats } from '../src/pages/PortfolioCsv/portfolioCsvUtils';
import { assetValue, hasValidPrice } from '../src/services/assetValuation';
import { buildConsolidatedPortfolioExposures } from '../src/services/portfolioComposition';
import { buildWorkbookHistory } from '../src/services/portfolioWorkbookHistory';
import type { Asset } from '../src/types/types';

const near = (actual: number | null | undefined, expected: number) => assert.ok(actual !== null && actual !== undefined && Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const base = 1086.2 / 1.0604;
const history = performanceSeries([
    { date: '2025-12-31T18:00:00Z', value: 1000, invested: 1000, cadence: 'monthly' },
    { date: '2026-01-31T18:00:00Z', value: base, invested: 1000, cadence: 'monthly' },
    { date: '2026-02-28T18:00:00Z', value: 1086.2, invested: 1000, cadence: 'monthly' },
], []);
const period = selectPortfolioPeriod(history, 'YTD', Date.parse('2026-03-01'));
const market = history.map(p => ({ date: p.date, close: 100, open: 100, high: 100, low: 100, volume: 0 }));
const partial = alignedBenchmark(period.points, market.slice(1));
const full = alignedBenchmark(period.points, market);
near(period.performance.returnPercent, 8.62);
near(partial.at(-1)?.portfolio, 6.04);
near(full.at(-1)?.portfolio, 8.62);
const laterCloses = market.map(p => ({ ...p, date: p.date + 'T20:00:00Z', timestamp: Date.parse(p.date + 'T20:00:00Z') }));
near(alignedBenchmark(period.points, laterCloses).at(-1)?.portfolio, 8.62);
assert.equal(chooseBenchmarkLine(period.points, partial, full), full);
assert.equal(chooseBenchmarkLine(period.points, full, partial), full);

const months = portfolioMonthlyRows(performanceSeries([
    { date: '2026-01-31', value: 1000, invested: 1000, cadence: 'monthly' },
    { date: '2026-02-28', value: 1500, invested: 1600, cadence: 'monthly' },
    { date: '2026-03-31', value: 1575, invested: 1600, cadence: 'monthly' },
], [{ id: 'flow', assetId: 'test', assetSymbol: 'TEST', assetName: 'Test', assetType: 'fund', type: 'buy', date: '2026-02-28', total: 600, createdAt: '2026-02-28' }]), Date.parse('2026-04-01'));
near(months[1].monthlyReturn, -10);
near(months[1].drawdown, -10); // A growing euro balance must not hide a loss.
const risk = workbookRiskStats([-10, 5], 2.75);
const advanced = calculateAdvancedPortfolioStats([], [], [], 2.75, months);
near(advanced.maxDrawdownPct, risk.maxDrawdown!);
near(advanced.sortinoRatio, risk.sortino!);
near(advanced.sharpeRatio, risk.sharpe!);
near(advanced.annualizedVolatilityPct, risk.volatility!);
assert.equal(advanced.analyzedMonths, 2);
assert.equal(workbookRiskStats([NaN]).annualized, null);
assert.equal(latestContinuousMonths([{ month: '2026-01' }, { month: '2026-03' }, { month: '2026-04' }]).length, 2);

const a: Asset = { id: 'old-a', symbol: 'TEST-A', name: 'Test A', type: 'stock', quantity: 1, purchasePrice: 100, currentPrice: 150, currency: 'EUR', purchaseDate: '2025-01-01' };
const b: Asset = { ...a, id: 'b', symbol: 'TEST-B', name: 'Test B', currentPrice: 50 };
const targets = migratePlanTargets([a, b], {}, { 'old-a': 50, b: 50 });
assert.equal(targets[planAssetKey({ ...a, id: 'new-a' } as Asset)], '50');
const plan = calculateContributionPlan([a, b], targets, '100,01');
assert.equal(plan.canCalculate, true);
near(plan.rows.reduce((s, r) => s + r.contribution, 0), 100.01);
assert.ok(plan.rows.every(r => r.contribution >= 0));
assert.equal(calculateContributionPlan([a, b], {}, '100').canCalculate, false);
assert.equal(calculateContributionPlan([a, b], targets, '').canCalculate, false);
assert.equal(calculateContributionPlan([a, b], targets, '-1').canCalculate, false);
assert.equal(parsePlanNumber('12,5'), 12.5);
assert.equal(parsePlanNumber('12.'), 12);
assert.equal(parsePlanNumber('texto'), null);
const duplicate = { ...a, id: 'lot-2' };
const lots = calculateContributionPlan([a, duplicate, b], targets, '100');
assert.equal(lots.rows.length, 2);
near(lots.total, 350);
near(lots.rows.reduce((s, r) => s + r.contribution, 0), 100);
const tinyResidual = buildConsolidatedPortfolioExposures([{ ...a, type: 'fund', holdings: [{ name: 'Underlying', symbol: 'U', percentage: 99.99 }] }]);
near(tinyResidual.reduce((s, r) => s + r.value, 0), 150);
assert.equal(hasValidPrice({ ...a, currency: 'USD' }), false);
near(assetValue({ ...a, currency: 'USD' }), 100);
const weights = targetsFromCurrentWeights([a, b, { ...a, id: 'tiny', symbol: 'TINY', currentPrice: .001 }]);
near(Object.values(weights).reduce((s, v) => s + Number(v), 0), 100);
assert.ok(Object.values(weights).every(v => Number(v) >= 0));
const duplicateMonth = buildWorkbookHistory('Mes,Valor Total,Capital Inicial,Capital Aportado\n2026 Ene,1100,1000,100\n2026 Ene,1100,1000,100\n2026 Feb,1200,1100,100', '');
near(duplicateMonth.points.at(-1)?.invested, 1200);
assert.equal(duplicateMonth.flowTransactions.length, 2);
const midnightMonth = buildWorkbookHistory('Mes,Valor Total,Capital Inicial,Capital Aportado\n2026 Ago,1000,1000,0\n2026 Sept,1100,1000,100', 'Fecha,Valor portfolio,Flujo neto,Tipo de dato\n2026-09-30,999,0,Diario', '', Date.parse('2026-09-30T22:30:00Z'));
assert.equal(midnightMonth.points.at(-1)?.value, 1100, 'Madrid October must keep the authoritative September close');
const ambiguous = performanceSeries([
    { date: '2026-01-01', value: 1000, invested: 1000 },
    { date: '2026-01-02', value: 1000, invested: 1000 },
], [{ id: 'buy', assetId: 'a', assetName: 'Test', assetSymbol: 'A', assetType: 'stock', type: 'buy', date: '2026-01-02', total: 100, createdAt: '2026-01-02' }], [{ ...a, type: 'cash' }]);
assert.equal(ambiguous[1].dailyReturn, null, 'Internal cash-account trading is not a verified external flow');
console.log('Dashboard logic: full/partial YTD, risk parity, DCA drawdown, decimal targets, stable identities, exact budget, lots and composition reconciliation passed.');
