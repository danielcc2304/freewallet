import assert from 'node:assert/strict';
import { accountingDay, alignedBenchmark, buildPortfolioAnalyticsHistory, calculatePeriodPerformance, calculatePreviousClosePerformance, createMarketPortfolioHistory, createQuoteSnapshot,
    normalizePortfolioTransactions, performanceSeries, portfolioLedgerKey, portfolioMonthlyRows, workbookRiskStats } from '../src/services/portfolioPerformance';
import { buildWorkbookBenchmarkHistory, buildWorkbookHistory } from '../src/services/portfolioWorkbookHistory';
import type { Asset, PortfolioHistoryPoint, PortfolioTransaction } from '../src/types/types';

const near = (actual: number | null, expected: number, name: string) => {
    assert.ok(actual !== null && Math.abs(actual - expected) < 1e-8, name + ': ' + actual);
};
const asset: Asset = { id: 'a', symbol: 'A', name: 'Test', type: 'stock', quantity: 10, purchasePrice: 100,
    purchaseDate: '2025-01-01', currentPrice: 150, currency: 'EUR' };
const buy: PortfolioTransaction = { id: 'buy', assetId: 'a', assetSymbol: 'A', assetName: 'Test',
    assetType: 'stock', type: 'buy', quantity: 10, price: 100, total: 1000, date: '2025-01-01', createdAt: '2025-01-01' };
const sale: PortfolioTransaction = { ...buy, id: 'sell', type: 'sell', quantity: 5, price: 150, total: 750, date: '2025-03-01' };
const ledger = [buy, sale];
assert.deepEqual(normalizePortfolioTransactions([{ ...asset, quantity: 5 }], ledger), ledger, 'Profitable sales must not rescale buys');
assert.deepEqual(normalizePortfolioTransactions([], ledger), ledger, 'Retain closed positions');
const duplicated = [buy, { ...buy, id: 'duplicate' }];
assert.deepEqual(normalizePortfolioTransactions([asset], duplicated), duplicated, 'Do not guess duplicated operations');

const point = (date: string, value: number, invested = 1000, tx = [buy]): PortfolioHistoryPoint => ({
    date, value, invested, source: 'quotes-v2', ledgerKey: portfolioLedgerKey(tx, date),
});
const raw = [{ date: '2025-01-01', value: 1000, invested: 1000 }, point('2025-02-27T18:00:00Z', 1500)];
const original = structuredClone(raw);
const checked = buildPortfolioAnalyticsHistory(raw, [buy], { date: '2025-02-28', value: 1700, invested: 1000 }, [asset]);
assert.equal(checked.length, 1, 'Exclude unverified/demo history and render-time fake valuations');
assert.deepEqual(raw, original, 'Legacy records remain untouched');
assert.equal(checked[0].value, 1500, 'Never substitute purchase cost for market value');
const retroactive = { ...buy, id: 'retro', date: '2025-02-01', createdAt: '2025-04-01' };
assert.equal(buildPortfolioAnalyticsHistory(raw, [buy, retroactive]).length, 0, 'Backdated changes invalidate affected valuations');
assert.equal(buildPortfolioAnalyticsHistory(raw, ledger).length, 1, 'Later sales preserve earlier valuations');
assert.equal(createQuoteSnapshot([asset], [buy], '2025-02-27T18:00:00Z')?.value, 1500);
assert.equal(createQuoteSnapshot([{ ...asset, currentPrice: undefined }], [buy], '2025-02-27'), null);
const previousClosePerformance = calculatePreviousClosePerformance([{ ...asset, previousClose: 140 }]);
near(previousClosePerformance.change, 100, 'Previous close fallback uses observed P&L');
near(previousClosePerformance.returnPercent, 100 / 1400 * 100, 'Previous close fallback uses previous portfolio value');
const marketCurve = createMarketPortfolioHistory([asset], [buy], new Map([['a', [
    { date: '2025-01-01', open: 100, high: 100, low: 100, close: 100, volume: 1 },
    { date: '2025-01-08', open: 120, high: 120, low: 120, close: 120, volume: 1 },
]]]));
assert.equal(marketCurve.length, 2, 'Market history should provide at least two portfolio points');
assert.ok(marketCurve[1].value > marketCurve[0].value, 'EUR scaling must preserve historical price movement');
assert.equal(accountingDay('2026-09-11T22:03:07Z'), '2026-09-12');

const reported = performanceSeries([
    point('2026-09-10T18:00:00Z', 85144.06, 66383.50),
    point('2026-09-11T18:00:00Z', 85139.18, 66383.50),
], [buy]);
const period = calculatePeriodPerformance(reported, Date.parse('2026-09-10T23:00:00Z'));
near(period.change, -4.88, 'Daily euros use observed P&L');
near(period.returnPercent, -4.88 / 85144.06 * 100, 'Daily percent uses same observations');
assert.equal(calculatePeriodPerformance(reported, Date.parse('2026-01-01')).returnPercent, null, 'YTD requires year-end base');
const saleSeries = performanceSeries([
    point('2025-02-28T18:00:00Z', 1500), point('2025-03-01T18:00:00Z', 750, 500, ledger),
], ledger);
near(saleSeries[1].dailyReturn, 0, 'Sale proceeds differ from removed cost basis');
const largeBuy = { ...buy, id: 'large', date: '2025-03-01', total: 10000, quantity: 100 };
const large = performanceSeries([point('2025-02-28', 1000), point('2025-03-01', 11100, 11000)], [buy, largeBuy]);
near(large[1].dailyReturn, 10, 'Large flows must not suppress genuine P&L');
const gap = performanceSeries([point('2025-01-01', 1000), point('2025-02-01', 1200), point('2025-02-02', 1210)], [buy]);
assert.equal(calculatePeriodPerformance(gap, -Infinity).returnPercent, null, 'Do not chain across unknown intervals');
assert.deepEqual(alignedBenchmark(gap, gap.map(p => ({ date: p.date, close: 100, open: 100, high: 100, low: 100, volume: 0 }))), []);

const monthlyInput = [point('2025-01-31T18:00:00Z', 1000)];
for (let day = 1; day <= 28; day++) monthlyInput.push(point('2025-02-' + String(day).padStart(2, '0') + 'T18:00:00Z', 1000 + day * 5));
const monthly = portfolioMonthlyRows(performanceSeries(monthlyInput, [buy]), Date.parse('2025-03-12'));
near(monthly[1].monthlyReturn, 14, 'Monthly endpoint formula');
assert.equal(monthly[0].complete, false, 'Initial partial month is not complete');
assert.equal(portfolioMonthlyRows(performanceSeries(monthlyInput.slice(0, -10), [buy]), Date.parse('2025-03-12'))[1].complete, false);
assert.equal(portfolioMonthlyRows(performanceSeries(monthlyInput, [buy]), Date.parse('2025-02-28'))[1].closed, false);

const workbookHistory = buildWorkbookHistory(`2025
Mes,Valor Total,Capital Inicial,Capital Aportado,Plusvalias,% mens.,TWR YTD
Feb,52428,51728,700,,,
Mar,55139,52428,700,2011,3.79%,3.79%
Abr,57033,55139,700,1194,4.28%,8.22%
2026
Mes,Valor Total,Capital Inicial,Capital Aportado,Plusvalias,% mens.,TWR YTD
Ene,76000,73708,500,1792,2.41%,2.41%
Feb,76422,76000,700,-278,-0.36%,2.04%`, `Fecha,Valor portfolio,Flujo neto,Retorno diario (%),Tipo de dato
2026-01-30,76000,0,,Historico mensual`);
assert.equal(workbookHistory.source, 'monthly', 'A complete Excel evolution takes precedence over sparse daily checkpoints');
assert.equal(workbookHistory.points.length, 5, 'Excel evolution rows become dated portfolio observations');
assert.deepEqual(workbookHistory.points.map((point) => point.date.slice(0, 10)), [
    '2025-02-28', '2025-03-31', '2025-04-30', '2026-01-31', '2026-02-28',
]);
assert.deepEqual(workbookHistory.flowTransactions.map((transaction) => transaction.total), [700, 700, 700, 500, 700], 'Every DCA is preserved as a dated flow');
assert.equal(workbookHistory.points.at(-1)?.invested, 55028, 'Invested capital follows cumulative Excel contributions');
const workbookSeries = performanceSeries(workbookHistory.points, workbookHistory.flowTransactions, [], { maxGapDays: 45 });
near(workbookSeries[1].dailyReturn, (55139 - 52428 - 700) / 52428 * 100, 'Monthly Excel return removes the DCA');
assert.equal(portfolioMonthlyRows(workbookSeries, Date.parse('2026-03-12')).filter((row) => row.complete).length, 3, 'Monthly Excel intervals stay valid across month-end gaps');

const workbookBenchmark = buildWorkbookBenchmarkHistory(`Año,Mes,Periodo,Rentabilidad Cartera (%),Rentabilidad MSCI World (%),Cartera Acum (%),MSCI Acum (%)
2026,Ene,2026 Ene,2.00%,1.00%,2.00%,1.00%
2026,Feb,2026 Feb,-1.00%,0.50%,0.98%,1.51%
2026,Mar,2026 Mar,3.00%,2.00%,4.01%,3.54%`);
assert.deepEqual(workbookBenchmark.map((point) => point.date.slice(0, 10)), ['2026-01-31', '2026-02-28', '2026-03-31']);
assert.equal(workbookBenchmark.at(-1)?.benchmarkAccumPct, 3.54, 'Benchmark comparison keeps Excel accumulated values and dates');

// B77:B94; compare the production function to the observed Sheet outputs.
const workbookReturns = [0.038357366292820716, 0.021654364424454453, 0.022706152578331862, 0.011130311038829, 0.014954044878695116, 0.008001548686842552, 0.0519910103823753, 0.02853995146570587, -0.002679620554265849, 0.038535398796568865, 0.024312150648504893, -0.0036578947368420822, -0.05328308602234955, 0.054242631939684705, 0.05219992914036764, 0.0008806693086746975, 0.02295211193588642, 0.016014404617109124];
const stats = workbookRiskStats(workbookReturns.map(r => r * 100));
near(stats.sharpe, 2.3028731463480203, 'Sheet Sharpe');
near(stats.sortino, 4.445384661860771, 'Sheet Sortino');
near(stats.annualized, 25.28389464985918, 'Sheet annualization');
near(stats.volatility, 8.84696132180294, 'Sheet volatility');
near(stats.maxDrawdown, -5.674607683926769, 'Sheet monthly drawdown');
assert.equal(workbookRiskStats([]).maxDrawdown, null);
assert.equal(workbookRiskStats([2]).sharpe, null);
console.log('Portfolio provenance, flows, calendar, monthly and Sheet parity tests passed');
