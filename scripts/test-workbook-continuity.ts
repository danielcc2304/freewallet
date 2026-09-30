import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildWorkbookHistory } from '../src/services/portfolioWorkbookHistory';
import { calculatePeriodPerformance, performanceSeries } from '../src/services/portfolioPerformance';
import { parseDailyData, parseDateLabel, parseEvolution, parseHoldings } from '../src/pages/PortfolioCsv/portfolioCsvUtils';

const now = Date.parse('2026-09-30T12:00:00Z');
const monthly = '2026\nMes,Valor Total,Capital Inicial,Capital Aportado\nJul,1000,1000,0\nAgo,1100,1000,100\nSep,1160,1100,50';
const daily = 'Fecha,Valor portfolio,Flujo neto,Retorno diario,Tipo de dato\n31/08/2026,1100,100,,Histórico mensual\n26/09/2026,1150,50,,Diario\n29/09/2026,1160,0,,Diario';
const moves = 'Fecha / mes,Importe €,Concepto,Fecha contable,Fecha exacta\n26/09/26,50,Aportación,26/09/26,TRUE';
const mixed = buildWorkbookHistory(monthly, daily, moves, now);
assert.equal(mixed.source, 'mixed');
assert.equal(mixed.points.at(-1)?.date.slice(0, 10), '2026-09-29');
assert.equal(mixed.points.at(-1)?.invested, 1150, 'Monthly checkpoints must not duplicate contributions');
assert.equal(mixed.flowTransactions.reduce((sum, t) => sum + t.total!, 0), 150);
assert.equal(parseDateLabel('26/09/26'), '2026-09-26');
assert.equal(parseDateLabel('31/02/26'), null);
assert.equal(parseDailyData('Fecha,Valor cartera,Comentario\n29/09/26,1160,Texto libre')[0].totalValue, 1160);
assert.equal(parseDailyData('Fecha,Valor cartera,Comentario\n29/09/26,1160,Aportación 500')[0].netFlow, 0, 'Comments are never cash flows');
assert.equal(parseDailyData('Fecha,Valor portfolio,Flujo neto,Retorno diario,Tipo de dato\n28/09/26,1150,0,,Diario\n29/09/26,1160,0,,Diario')[1].dailyReturnPct, null, 'A blank formula result must remain unavailable');
assert.equal(buildWorkbookHistory(monthly, 'Fecha,Valor cartera,Comentario\n26/09/26,1150,Nota\n29/09/26,1160,Nota', moves, now).points.at(-1)?.invested, 1150, 'Diario uses exact dated Movimientos when no flow column exists');
assert.equal(buildWorkbookHistory(monthly, daily.split('\n').slice(0, 3).join('\n'), moves, now).points.at(-1)?.date.slice(0, 10), '2026-09-26', 'A single new daily observation must be appended');
const series = performanceSeries(mixed.points, mixed.flowTransactions, [], { maxGapDays: 45 });
assert.equal(calculatePeriodPerformance(series, -Infinity).returnPercent, null, 'A daily series with a 26-day gap cannot give a verified period return');
const denseDaily = 'Fecha,Valor portfolio,Flujo neto,Retorno diario,Tipo de dato\n01/09/2026,1100,0,,Diario\n08/09/2026,1100,0,,Diario\n15/09/2026,1100,0,,Diario\n22/09/2026,1100,0,,Diario\n26/09/2026,1150,50,,Diario\n29/09/2026,1160,0,,Diario';
const continuous = buildWorkbookHistory(monthly, denseDaily, moves, now);
assert.ok(calculatePeriodPerformance(performanceSeries(continuous.points, continuous.flowTransactions, [], { maxGapDays: 45 }), -Infinity).returnPercent !== null, 'Continuous verified daily observations preserve the period return');
const unknown = buildWorkbookHistory(monthly, daily, moves.replace('TRUE', 'FALSE'), now);
const unknownPeriod = calculatePeriodPerformance(performanceSeries(unknown.points, unknown.flowTransactions, [], { maxGapDays: 45 }), -Infinity);
assert.equal(unknownPeriod.returnPercent, null, 'Never invent a daily date for an unknown monthly flow');
assert.ok(unknownPeriod.baseDate);
assert.ok(unknownPeriod.observations > 0);
assert.ok(unknownPeriod.missingIntervals > 0);

// Optional private fixture stays outside Git; no personal portfolio in regressions.
if (process.argv[2]) {
    const fixture = JSON.parse(readFileSync(process.argv[2], 'utf8'));
    const actual = buildWorkbookHistory(fixture.Evolucion, fixture['Datos diarios'], fixture.Movimientos, now);
    const holdings = parseHoldings(fixture.Cartera);
    assert.equal(holdings.length, 16);
    assert.equal(actual.source, 'mixed');
    assert.equal(actual.endDate?.slice(0, 10), '2026-09-29');
    assert.equal(actual.points.at(-1)?.value, parseDailyData(fixture['Datos diarios']).at(-1)?.totalValue);
    const evolution = parseEvolution(fixture.Evolucion);
    assert.equal(actual.points.at(-1)?.invested, evolution[0].initialCapital + evolution.reduce((sum, p) => sum + p.monthlyContribution, 0));
    const result = calculatePeriodPerformance(performanceSeries(actual.points, actual.flowTransactions, [], { maxGapDays: 45 }), -Infinity);
    assert.ok(result.observations > 0);
    console.log('Private workbook verified:', holdings.length, 'holdings,', actual.points.length, 'observations;', result.observations, 'valid intervals;', result.missingIntervals, 'unknown intervals.');
}
console.log('Workbook continuity, exact dates, unknown flows and period metadata passed.');
