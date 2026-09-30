import type { Asset, HistoricalDataPoint } from '../types/types';

/** Zero is a valid price; absent/invalid quotes are explicitly estimated at cost. */
export function assetPrice(asset: Asset): number {
    if (Number.isFinite(asset.currentPrice) && asset.currentPrice! >= 0) return asset.currentPrice!;
    return Number.isFinite(asset.purchasePrice) && asset.purchasePrice >= 0 ? asset.purchasePrice : 0;
}
export function assetValue(asset: Asset): number {
    return Number.isFinite(asset.quantity) && asset.quantity >= 0 ? assetPrice(asset) * asset.quantity : 0;
}
export function hasValidPrice(asset: Asset): boolean {
    return Number.isFinite(asset.currentPrice) && asset.currentPrice! >= 0;
}
export function formatQuantity(asset: Pick<Asset, 'quantity' | 'type'>): string {
    return Number.isFinite(asset.quantity) ? asset.quantity.toLocaleString('es-ES', { maximumFractionDigits: asset.type === 'crypto' ? 8 : 10 }) : 'N/D';
}

/** Linear merge: never use future FX observations or carry stale rates indefinitely. */
export function convertHistoryToCurrency(points: HistoricalDataPoint[], fx: HistoricalDataPoint[], currency = 'EUR', maxGapDays = 8): HistoricalDataPoint[] {
    const time = (p: HistoricalDataPoint) => p.timestamp ?? Date.parse(p.date);
    const rates = fx.filter(p => Number.isFinite(time(p)) && p.close > 0).sort((a, b) => time(a) - time(b));
    const ordered = [...points].sort((a, b) => time(a) - time(b));
    let index = -1;
    return ordered.flatMap(p => {
        if (p.currency === currency) return [p];
        const timestamp = time(p);
        while (index + 1 < rates.length && time(rates[index + 1]) <= timestamp) index++;
        const rate = rates[index];
        if (!Number.isFinite(timestamp) || !rate || timestamp - time(rate) > maxGapDays * 86400000) return [];
        return [{ ...p, open: p.open * rate.close, high: p.high * rate.close, low: p.low * rate.close,
            close: p.close * rate.close, previousClose: undefined, currency }];
    });
}
