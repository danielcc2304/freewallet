import assert from 'node:assert/strict';
import { alignedBenchmark, calculateBenchmarkPeriodPerformance, calculatePreviousClosePerformance, createMarketPortfolioHistory, performanceSeries } from '../src/services/portfolioPerformance';
import { continueWorkbookHistory, latestContinuousMonths } from '../src/services/dashboardHistory';
import { buildWorkbookHistory } from '../src/services/portfolioWorkbookHistory';
import { getAssets, getTransactions, savePortfolioState } from '../src/services/storageService';
import type { Asset, HistoricalDataPoint, PortfolioTransaction } from '../src/types/types';

const asset: Asset = { id: 'test', symbol: 'TEST', name: 'Synthetic', type: 'fund', quantity: 15, purchasePrice: 100, currentPrice: 100, purchaseDate: '2026-01-01', currency: 'EUR' };
const trade = (id: string, date: string, type: 'buy' | 'sell', quantity: number): PortfolioTransaction => ({
    id, date, type, quantity, price: 100, total: quantity * 100, createdAt: date, assetId: asset.id, assetSymbol: asset.symbol, assetName: asset.name, assetType: asset.type,
});
const candle = (date: string, close = 100): HistoricalDataPoint => ({ date, close, open: close, high: close, low: close, volume: 0, currency: 'EUR' });
const purchases = [trade('start', '2026-01-01', 'buy', 10), trade('dca', '2026-01-03', 'buy', 5)];
const history = new Map([[asset.id, [candle('2026-01-02'), candle('2026-01-03'), candle('2026-01-04')]]]);
const curve = createMarketPortfolioHistory([asset], purchases, history);
assert.deepEqual(curve.map(p => p.value), [1000, 1500, 1500], 'DCA quantities must not be applied before purchase');
assert.equal(performanceSeries(curve, purchases)[1].dailyReturn, 0);
assert.equal(curve[0].source, 'market-estimate', 'Reconstructed observations must be labelled estimates');
const sold = [...purchases, trade('exit', '2026-01-04', 'sell', 15)];
const closedCurve = createMarketPortfolioHistory([], sold, history);
assert.deepEqual(closedCurve.map(p => p.value), [1000, 1500, 0], 'Closed positions still contribute to their historical dates');
assert.equal(performanceSeries(closedCurve, sold)[2].dailyReturn, 0);
assert.equal(calculatePreviousClosePerformance([asset]).returnPercent, null, 'Missing previous close must not become lifetime return');
assert.equal(calculatePreviousClosePerformance([{ ...asset, previousClose: 100 }]).returnPercent, 0);
assert.deepEqual(createMarketPortfolioHistory([asset], purchases, new Map([[asset.id, [{ ...candle('2026-01-02'), currency: 'USD' }]]])), [], 'Unconverted foreign quotes cannot value EUR positions');

const workbook = buildWorkbookHistory('2026\nMes,Valor Total,Capital Inicial,Capital Aportado,Plusvalias,% mens.,TWR YTD\nEne,1000,1000,0,,,\nFeb,1000,1000,0,,,', '');
const additional = trade('after-import', '2026-03-05', 'buy', 5);
const combined = continueWorkbookHistory(workbook, [{ date: '2026-03-10', value: 1500, invested: 1500 }], [...purchases, additional], Date.parse('2026-03-11'));
assert.equal(combined.transactions.filter(t => t.id === additional.id).length, 1);
assert.ok(!combined.transactions.some(t => t.id === 'dca'), 'Operations covered by the imported close must not be duplicated');
assert.equal(performanceSeries(combined.history, combined.transactions, [], { maxGapDays: 45 }).at(-1)?.dailyReturn, 0);
const series = performanceSeries([{ date: '2026-03-01', value: 1000, invested: 1000 }, { date: '2026-03-02', value: 1020, invested: 1000 }], []);
const market = [{ ...candle('2026-03-01'), previousClose: 98 }, candle('2026-03-02', 102)];
assert.equal(calculateBenchmarkPeriodPerformance(series, market, -Infinity).benchmarkReturn, alignedBenchmark(series, market).at(-1)?.benchmark);
assert.deepEqual(alignedBenchmark(series, [candle('2025-01-01')]), [], 'Never extend stale market quotes indefinitely');
assert.deepEqual(latestContinuousMonths([{ month: '2025-10', monthlyReturn: 1 }, { month: '2026-01', monthlyReturn: 2 }, { month: '2026-02', monthlyReturn: 3 }]).map(r => r.month), ['2026-01', '2026-02']);

const memory = new Map<string, string>();
let failWrites = false;
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { if (failWrites) throw new Error('QuotaExceeded'); memory.set(key, value); },
    removeItem: (key: string) => memory.delete(key),
} });
memory.set('freewallet_assets', JSON.stringify([asset]));
memory.set('freewallet_transactions', JSON.stringify(purchases));
assert.equal(getAssets()[0].quantity, 15, 'Read legacy data without requiring a migration');
savePortfolioState([{ ...asset, quantity: 10 }], [...purchases, trade('partial', '2026-01-05', 'sell', 5)]);
failWrites = true;
assert.throws(() => savePortfolioState([], []), /guardar/);
assert.equal(getAssets()[0].quantity, 10, 'Failed atomic write preserves holdings');
assert.equal(getTransactions().length, 3, 'Failed atomic write preserves matching ledger');
failWrites = false;
memory.set('freewallet_portfolio_v1', '{broken');
assert.throws(() => getAssets(), /leer/, 'Corrupt data cannot silently become an empty portfolio');
console.log('Dashboard integrity passed: DCA, full sales, missing prices, workbook continuation, benchmark parity, risk gaps and atomic storage.');
