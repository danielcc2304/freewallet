import { getAppSupabaseClient, appBackendConfig } from './supabaseClient';
import { portfolioStorage } from './portfolioCloudStorage';
import type { Asset, PortfolioTransaction, HistoricalDataPoint, StockQuote } from '../types/types';
import { createQuoteSnapshot } from './portfolioPerformance';

export const BENCHMARK_ISIN = 'IE00BYX5NX33';
export const BENCHMARK_NAME = 'Fidelity MSCI World ACC EUR';
export interface DailyPrice {
    instrument: string; quoted_at: string; checked_at: string; price_eur: number;
    previous_close_eur: number | null; source: 'Finect' | 'Yahoo Finance';
}
export interface DailyMarketData {
    benchmark: { isin: string; name: string };
    prices: DailyPrice[];
    snapshots: Array<{ at: string; assets: Asset[]; transactions: PortfolioTransaction[] }>;
    lastRun: { startedAt: string; finishedAt: string | null; status: string; failures: Array<{ instrument: string; reason: string }> } | null;
}
export async function readDailyMarketData(signal?: AbortSignal): Promise<DailyMarketData | null> {
    const owner = portfolioStorage.getSnapshot().userId;
    const epoch = portfolioStorage.epoch;
    if (!owner || !appBackendConfig) return null;
    const client = await getAppSupabaseClient();
    const session = await client.auth.getSession();
    if (session.error || session.data.session?.user.id !== owner || portfolioStorage.epoch !== epoch) return null;
    const response = await fetch(`${appBackendConfig.url}/rest/v1/rpc/read_daily_market_data`, {
        method: 'POST', headers: { apikey: appBackendConfig.key, Authorization: `Bearer ${session.data.session.access_token}`, 'Content-Type': 'application/json' },
        body: '{}', signal: signal ?? AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error('No se pudo consultar la actualización diaria de la cartera.');
    const data = await response.json() as DailyMarketData;
    if (portfolioStorage.epoch !== epoch) return null;
    if (!Array.isArray(data.prices) || !Array.isArray(data.snapshots) || data.benchmark?.isin !== BENCHMARK_ISIN) throw new Error('Datos diarios no válidos.');
    return data;
}
export function instrumentKey(asset: Pick<Asset, 'symbol' | 'isin'>): string {
    return (asset.isin || asset.symbol).trim().toUpperCase();
}
export function dailyQuote(asset: Asset, data: DailyMarketData | null, now = Date.now()): StockQuote | undefined {
    const price = data?.prices.filter(p => p.instrument === instrumentKey(asset)).at(-1);
    if (!price || !Number.isFinite(price.price_eur) || price.price_eur <= 0) return undefined;
    const at = Date.parse(price.quoted_at), checked = Date.parse(price.checked_at);
    const maxAge = (asset.type === 'fund' ? 7 : asset.type === 'crypto' ? 2 : 4) * 86400000;
    if (!Number.isFinite(at) || at > now + 300000 || now - at > maxAge || !Number.isFinite(checked) || checked > now + 300000 || now - checked > 36 * 3600000) return undefined;
    if (Date.parse(asset.quotedAt || '') > at) return undefined;
    const previous = price.previous_close_eur ?? NaN;
    return { symbol: asset.symbol, name: asset.name, price: price.price_eur, previousClose: previous,
        change: price.price_eur - previous, changePercent: previous > 0 ? (price.price_eur / previous - 1) * 100 : NaN,
        open: previous, high: price.price_eur, low: price.price_eur, volume: 0, currency: 'EUR', quotedAt: price.quoted_at, checkedAt: price.checked_at, origin: 'batch', source: price.source };
}
export function dailyHistory(data: DailyMarketData | null, instrument: string): HistoricalDataPoint[] {
    return (data?.prices ?? []).filter(p => p.instrument === instrument.toUpperCase()).map(p => ({ date: p.quoted_at,
        close: p.price_eur, open: p.price_eur, high: p.price_eur, low: p.price_eur, volume: 0, currency: 'EUR' }));
}
export function dailySnapshots(data: DailyMarketData | null) {
    return (data?.snapshots ?? []).flatMap(snapshot => {
        const point = createQuoteSnapshot(snapshot.assets, snapshot.transactions, snapshot.at);
        return point ? [point] : [];
    });
}
