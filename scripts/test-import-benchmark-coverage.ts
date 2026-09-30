import assert from 'node:assert/strict';
import { parseHoldings } from '../src/pages/PortfolioCsv/portfolioCsvUtils';
import { alignImportedBenchmark, performanceSeries, selectPortfolioPeriod } from '../src/services/portfolioPerformance';

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
console.log('Position block boundaries and partial YTD benchmark coverage passed.');
