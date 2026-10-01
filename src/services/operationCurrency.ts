import type { HistoricalDataPoint } from '../types/types';

export const OPERATION_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'HKD', 'SEK', 'NOK', 'DKK'] as const;

export function historicalOperationRate(points: HistoricalDataPoint[], date: string) {
    const day = Date.parse(`${date}T00:00:00Z`);
    if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== date) return null;
    // Weekends/holidays: last available close, never a later or stale rate.
    return points.filter(p => p.currency === 'EUR' && Number.isFinite(p.close) && p.close > 0
        && p.date <= date && day - Date.parse(`${p.date}T00:00:00Z`) <= 7 * 86400000)
        .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
}

export function operationEuroPrice(price: number, quantity: number, currency: string, rate?: number, manualEuroTotal?: number) {
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(quantity) || quantity <= 0) return NaN;
    if (currency === 'EUR') return price;
    if (manualEuroTotal !== undefined) return Number.isFinite(manualEuroTotal) && manualEuroTotal > 0 ? manualEuroTotal / quantity : NaN;
    return Number.isFinite(rate) && rate! > 0 && Number.isFinite(price * rate!) ? price * rate! : NaN;
}
