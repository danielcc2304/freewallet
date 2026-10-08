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
    assert.equal(sampled.filter(p=>p.date.startsWith('2026-10')).length,1);
    assert.equal(sampled.at(-1)?.date,'2026-10-07','Use the latest common observation in the provisional month');
    assert.ok(Math.abs(sampled.at(-1)!.benchmark!-(1.18*206/200-1)*100)<1e-10);
}
assert.ok(Math.abs(selected.performance.returnPercent!-9.4)<1e-8,'The full portfolio return still includes October 8');
for (const period of ['1D','7D','1M'] as const) assert.equal(benchmarkChartCadence(chart,period),chart);
const missing = benchmarkChartCadence(chart.map(p=>p.date.startsWith('2026-10')?{...p,benchmark:null}:p),'YTD');
assert.equal(missing.at(-1)?.date,'2026-10-08');
assert.equal(missing.at(-1)?.benchmark,null,'An unavailable current-month benchmark remains unavailable');
console.log('PASS: anchored October NAV, homogeneous monthly cadence, daily short ranges, missing observations and unchanged full-period return.');
