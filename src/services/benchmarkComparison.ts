import type { HistoricalDataPoint, TimePeriod } from '../types/types';
import { accountingDay } from './portfolioPerformance';
import type { AccumulatedBenchmarkPoint } from './portfolioPerformance';

/** Extend the imported index only with a real NAV on the same anchor day.
 * Prices and accumulated percentages must never be concatenated unscaled. */
export function extendImportedBenchmark(imported: AccumulatedBenchmarkPoint[], history: HistoricalDataPoint[]) {
    const real = new Map<string, HistoricalDataPoint>();
    [...history].sort((a, b) => (a.timestamp ?? Date.parse(a.date)) - (b.timestamp ?? Date.parse(b.date)))
        .filter(p => p.close > 0 && Number.isFinite(p.close) && (!p.currency || p.currency === 'EUR'))
        .forEach(p => real.set(accountingDay(p.timestamp ?? p.date), p));
    const valid = imported.filter(p => Number.isFinite(p.benchmarkAccumPct) && p.benchmarkAccumPct > -100 && Number.isFinite(Date.parse(p.date)))
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    const anchor = valid.filter(p => real.has(accountingDay(p.date))).at(-1);
    if (!anchor) return [];
    const scale = (1 + anchor.benchmarkAccumPct / 100) / real.get(accountingDay(anchor.date))!.close;
    const indexed = valid.filter(p => accountingDay(p.date) <= accountingDay(anchor.date))
        .map(p => ({ date: p.date, close: 1 + p.benchmarkAccumPct / 100, open: 1, high: 1, low: 1, volume: 0, currency: 'EUR' }));
    return [...indexed, ...[...real.entries()].filter(([day]) => day > accountingDay(anchor.date))
        .map(([, p]) => ({ ...p, close: p.close * scale }))];
}

/** Use one observation per month for long ranges; retain the actual period
 * base and latest observation. Short ranges keep their daily observations. */
export function benchmarkChartCadence<T extends { date: string; benchmark?: number | null }>(points: T[], period: TimePeriod): T[] {
    if (['1D', '7D', '1M'].includes(period) || points.length < 2) return points;
    const monthly = new Map<string, T>();
    points.slice(1).forEach(p => {
        const month = accountingDay(p.date).slice(0, 7);
        const previous = monthly.get(month);
        // Prefer the latest common observation within each month. If none
        // exists, retain a missing benchmark explicitly rather than copy it.
        if (!previous || p.benchmark != null || previous.benchmark == null) monthly.set(month, p);
    });
    return [points[0], ...monthly.values()];
}
