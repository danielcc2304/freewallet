import assert from 'node:assert/strict';
import { benchmarkChartCadence, extendImportedBenchmark } from '../src/services/benchmarkComparison';
import { alignedBenchmark, alignImportedBenchmark, chooseBenchmarkLine, performanceSeries, selectPortfolioPeriod } from '../src/services/portfolioPerformance';
import type { HistoricalDataPoint } from '../src/types/types';

const nav = (date: string, close: number, currency = 'EUR'): HistoricalDataPoint => ({date,close,open:close,high:close,low:close,volume:0,currency});
const dates = ['2025-12-31','2026-01-31','2026-02-28','2026-03-31','2026-04-30','2026-05-31','2026-06-30','2026-07-31','2026-08-31','2026-09-30'];
const imported = dates.map((date, i) => ({date,portfolioAccumPct:i,benchmarkAccumPct:i * 2}));
const series = performanceSeries([
    ...dates.map((date,i) => ({date,value:1000+i*10,invested:1000,cadence:'monthly' as const})),
    ...['2026-10-05','2026-10-06','2026-10-07','2026-10-08'].map((date,i) => ({date,value:1091+i,invested:1000,cadence:'daily' as const})),
], [], [], {maxGapDays:45});
const real = [nav('2026-09-30',200),nav('2026-10-05',202),nav('2026-10-06',204),nav('2026-10-07',206)];
const combined = extendImportedBenchmark(imported, real);
assert.equal(combined.at(-1)?.date,'2026-10-07');
assert.ok(Math.abs(combined.at(-1)!.close-1.18*206/200)<1e-10,'A real common NAV anchors the accumulated index');
assert.deepEqual(extendImportedBenchmark(imported,real.slice(1)),[],'No invented anchor if the two histories do not overlap');
assert.deepEqual(extendImportedBenchmark(imported,real.map(p=>({...p,currency:'USD'}))),[],'Never attach a different currency class');
const selected = selectPortfolioPeriod(series,'YTD',Date.parse('2026-10-08T21:00:00Z'));
const extendedLine = alignedBenchmark(selected.points,combined);
const line = chooseBenchmarkLine(selected.points,extendedLine,alignImportedBenchmark(selected.points,imported));
assert.equal(line,extendedLine,'An anchored real October tail must not lose to the September-only Excel series');
assert.equal(line.at(-1)?.date,'2026-10-07','Do not forward-fill the NAV to October 8');
const lookup = new Map(line.map(p=>[p.date,p.benchmark]));
const chart = selected.points.map(p=>({date:p.date,portfolio:(p.index/selected.points[0].index-1)*100,benchmark:lookup.get(p.date)??null}));
for (const period of ['3M','YTD','ALL'] as const) {
    const sampled = benchmarkChartCadence(chart,period);
    assert.equal(sampled.filter(p=>p.date.startsWith('2026-10')).length,2,'Retain only the common close and the latest portfolio endpoint');
    assert.equal(sampled.at(-2)?.date,'2026-10-07','Keep the real benchmark observation on its own date');
    assert.ok(Math.abs(sampled.at(-2)!.benchmark!-(1.18*206/200-1)*100)<1e-10);
    assert.equal(sampled.at(-1)?.date,'2026-10-08','The chart endpoint must match the portfolio summary');
    assert.equal(sampled.at(-1)?.benchmark,null,'Never carry the previous NAV forward');
    assert.ok(Math.abs(sampled.at(-1)!.portfolio-selected.performance.returnPercent!)<1e-8);
}
assert.ok(Math.abs(selected.performance.returnPercent!-9.4)<1e-8,'The full portfolio return still includes October 8');
for (const period of ['1D','7D','1M'] as const) assert.equal(benchmarkChartCadence(chart,period),chart);
const missing = benchmarkChartCadence(chart.map(p=>p.date.startsWith('2026-10')?{...p,benchmark:null}:p),'YTD');
assert.equal(missing.at(-1)?.date,'2026-10-08');
assert.equal(missing.at(-1)?.benchmark,null,'An unavailable current-month benchmark remains unavailable');
assert.equal(missing.filter(p=>p.date.startsWith('2026-10')).length,1,'Do not add daily detail when there is no common current-month close');
console.log('PASS: anchored October NAV, homogeneous monthly cadence, daily short ranges, missing observations and unchanged full-period return.');
const unresolved=performanceSeries([
    ...dates.map((date,i)=>({date,value:1000+i*10,invested:1000,cadence:'monthly' as const})),
    ...['2026-10-05','2026-10-06','2026-10-07','2026-10-08'].map((date,i)=>({date,value:1091+i,invested:1000,cadence:'daily' as const,returnUnavailable:i===3})),
],[],[],{maxGapDays:45});
for(const period of ['1D','7D','1M','3M','YTD','ALL'] as const){
    const verified=selectPortfolioPeriod(unresolved,period,Date.parse('2026-10-08T21:00:00Z'));
    assert.notEqual(verified.performance.returnPercent,null,period+' retains a real verified interval');
    assert.equal(verified.performance.endDate,'2026-10-07');
    assert.equal(verified.incompleteSince,'2026-10-08');
    assert.ok(verified.points.length>=2,period+' remains drawable');
    assert.equal(verified.points.at(-1)?.date,'2026-10-07');
}
console.log('PASS: all six benchmark periods preserve verified, explicitly dated intervals after an unresolved close.');
const resumed=performanceSeries([
    ...dates.map((date,i)=>({date,value:1000+i*10,invested:1000,cadence:'monthly' as const})),
    ...['2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-09'].map((date,i)=>({date,value:1091+i,invested:1000,cadence:'daily' as const,returnUnavailable:i===3})),
],[],[],{maxGapDays:45});
for(const period of ['1M','3M','YTD','ALL'] as const){
    const selection=selectPortfolioPeriod(resumed,period,Date.parse('2026-10-09T21:00:00Z'));
    assert.equal(selection.performance.endDate,'2026-10-07',period+' remains available when subsequent valid observations resume');
    assert.equal(selection.incompleteSince,'2026-10-08');
    assert.ok(selection.points.every(p=>p.date<'2026-10-08'),'Never join indices across the unresolved interval');
}
