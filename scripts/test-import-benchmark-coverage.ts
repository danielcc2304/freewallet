import assert from 'node:assert/strict';
import { parseHoldings } from '../src/pages/PortfolioCsv/portfolioCsvUtils';
import { alignedBenchmark, alignImportedBenchmark, performanceSeries, portfolioMonthlyRows, selectPortfolioPeriod } from '../src/services/portfolioPerformance';

const positions = 'Activo,Importe,Peso\nFondo A,600,60%\nFondo B,400,40%\nTOTAL,1000,100%\nResumen por bloques,,\nFondo A,600,60%\nFondo B,400,40%';
assert.equal(parseHoldings(positions).length, 2);
assert.equal(parseHoldings(positions).reduce((s,p)=>s+p.amount,0),1000);
assert.equal(parseHoldings('Activo,Importe,Peso\nFondo A,300,30%\nFondo A,700,70%').length,2, 'Real rows before a total are not blindly deleted by name');
const history = performanceSeries([
    {date:'2025-12-31T18:00:00Z',value:1000,invested:1000},
    {date:'2026-01-31T18:00:00Z',value:1050,invested:1000},
    {date:'2026-02-28T18:00:00Z',value:1114.9,invested:1000},
    {date:'2026-03-31T18:00:00Z',value:1095,invested:1000},
],[],[],{maxGapDays:45});
const period = selectPortfolioPeriod(history,'YTD',Date.parse('2026-04-01'));
const comparison = alignImportedBenchmark(period.points,[
    {date:'2025-12-31T18:00:00Z',benchmarkAccumPct:0,portfolioAccumPct:0},
    {date:'2026-01-31T18:00:00Z',benchmarkAccumPct:4,portfolioAccumPct:999},
    {date:'2026-02-28T18:00:00Z',benchmarkAccumPct:8,portfolioAccumPct:888},
]);
assert.ok(Math.abs(period.performance.returnPercent!-9.5)<1e-8);
assert.ok(Math.abs(comparison.at(-1)!.portfolio-11.49)<1e-8);
assert.equal(comparison.at(-1)!.date.slice(0,10),'2026-02-28');
assert.notEqual(comparison.at(-1)!.date,period.performance.endDate);
assert.equal(alignImportedBenchmark(history,[]).length,0);
const partialMarket = [
    {date:'2026-01-31T18:00:00Z',close:100,open:100,high:100,low:100,volume:0},
    {date:'2026-02-28T18:00:00Z',close:108,open:108,high:108,low:108,volume:0},
];
const partialLine = alignedBenchmark(history, partialMarket);
assert.equal(partialLine.length, 2, 'Missing benchmark coverage must not hide the available comparison');
assert.equal(partialLine[0].date, '2026-01-31');
assert.ok(Math.abs(partialLine.at(-1)!.benchmark - 8) < 1e-8);
assert.ok(Math.abs(partialLine.at(-1)!.portfolio - (1114.9 / 1050 - 1) * 100) < 1e-8);
const cadenceHistory = performanceSeries([
    {date:'2026-07-31T18:00:00Z',value:1000,invested:1000,cadence:'monthly'},
    {date:'2026-08-31T18:00:00Z',value:1050,invested:1000,cadence:'monthly'},
    {date:'2026-09-01T18:00:00Z',value:1060,invested:1000,cadence:'daily'},
    {date:'2026-09-02T18:00:00Z',value:1070,invested:1000,cadence:'daily'},
],[]);
const monthlyRows = portfolioMonthlyRows(cadenceHistory,Date.parse('2026-09-03'));
assert.equal(monthlyRows[1].monthlyIntervals,1);
assert.equal(monthlyRows[1].dailyIntervals,0);
assert.equal(monthlyRows[2].dailyIntervals,2);
assert.equal(monthlyRows[2].monthlyIntervals,0);
console.log('Position block boundaries and partial YTD benchmark coverage passed.');
