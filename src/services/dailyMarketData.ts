import { getAppSupabaseClient, appBackendConfig } from './supabaseClient';
import { portfolioStorage } from './portfolioCloudStorage';
import type { Asset, PortfolioTransaction, HistoricalDataPoint, StockQuote } from '../types/types';
import { createQuoteSnapshot } from './portfolioPerformance';
import type {FundSource} from '../../supabase/functions/_shared/fundQuotePolicy';

export const BENCHMARK_ISIN = 'IE00BYX5NX33';
export const BENCHMARK_NAME = 'Fidelity MSCI World ACC EUR';
export interface DailyPrice {
    instrument: string; quoted_at: string; checked_at: string; price_eur: number;
    previous_close_eur: number | null; original_price?: number; original_currency?: string; original_unit?: string; unit_scale?: number; fx_rate?: number; fx_at?: string | null; source: FundSource;
}
export interface DailyMarketData {
    benchmark: { isin: string; name: string };
    prices: DailyPrice[];
    snapshots: Array<{ at: string; assets: Asset[]; transactions: PortfolioTransaction[]; ledgerVersion?: number; legacyLedgerIds?: string[]; valuationKind?: 'mixed-observations'; observationFrom?: string; observationTo?: string }>;
    ledger?: Array<{entry: number; transaction: PortfolioTransaction}>;
    snapshotStatus?: string;
    health?: {attentionRequired: boolean; alerts: string[]};
    lastRun: { startedAt: string; finishedAt: string | null; status: string; failures: Array<{ instrument: string; reason: string }> } | null;
}
export async function readDailyMarketData(signal?: AbortSignal): Promise<DailyMarketData | null> {
    const owner = portfolioStorage.getSnapshot().userId;
    const epoch = portfolioStorage.epoch;
    if (!owner || !appBackendConfig) return null;
    const client = await getAppSupabaseClient();
    const session = await client.auth.getSession();
    if (session.error || session.data.session?.user.id !== owner || portfolioStorage.epoch !== epoch) return null;
    const response = await fetch(`${appBackendConfig.url}/rest/v1/rpc/read_daily_market_data_v2`, {
        method: 'POST', headers: { apikey: appBackendConfig.key, Authorization: `Bearer ${session.data.session.access_token}`, 'Content-Type': 'application/json' },
        body: '{}', signal: signal ?? AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error('No se pudo consultar la actualización diaria de la cartera.');
    const data = await response.json() as DailyMarketData;
    if (portfolioStorage.epoch !== epoch) return null;
    if (!Array.isArray(data.prices) || !Array.isArray(data.snapshots) || data.benchmark?.isin !== BENCHMARK_ISIN) throw new Error('Datos diarios no válidos.');
    data.snapshots=data.snapshots.map(snapshot=>({...snapshot,transactions:snapshot.transactions ?? (data.ledger ?? [])
        .filter(entry=>snapshot.legacyLedgerIds ? snapshot.legacyLedgerIds.includes(entry.transaction.id) : entry.entry <= (snapshot.ledgerVersion ?? 0)).map(entry=>entry.transaction)}));
    return data;
}
export function instrumentKey(asset: Pick<Asset, 'symbol' | 'isin' | 'type'>): string {
    return (asset.type === 'fund' ? asset.isin || asset.symbol : asset.symbol).trim().toUpperCase();
}
export function dailyQuote(asset: Asset, data: DailyMarketData | null, now = Date.now()): StockQuote | undefined {
    const price = data?.prices.filter(p => p.instrument === instrumentKey(asset)).at(-1);
    return dailyPriceQuote(asset,price,now);
}
export function dailyPriceQuote(asset:Asset,price:DailyPrice|undefined,now=Date.now()):StockQuote|undefined {
    if (!price || !Number.isFinite(price.price_eur) || price.price_eur <= 0) return undefined;
    const at = Date.parse(price.quoted_at), checked = Date.parse(price.checked_at);
    const maxAge = (asset.type === 'fund' ? 7 : asset.type === 'crypto' ? 2 : 4) * 86400000;
    if (!Number.isFinite(at) || at > now + 300000 || now - at > maxAge || !Number.isFinite(checked) || checked > now + 300000 || now - checked > 36 * 3600000) return undefined;
    if (Date.parse(asset.quotedAt || '') > at) return undefined;
    const previous = price.previous_close_eur ?? NaN;
    return { symbol: asset.symbol, name: asset.name, price: price.price_eur, previousClose: previous,
        change: price.price_eur - previous, changePercent: previous > 0 ? (price.price_eur / previous - 1) * 100 : NaN,
        open: previous, high: price.price_eur, low: price.price_eur, volume: 0, currency: 'EUR', quotedAt: price.quoted_at, checkedAt: price.checked_at, origin: 'batch', source: price.source, originalPrice: price.original_price, originalCurrency: price.original_currency, originalUnit: price.original_unit, unitScale: price.unit_scale, fxRate: price.fx_rate, fxAt: price.fx_at, valuationBasis: 'quote-date-fx' };
}
export function dailyHistory(data: DailyMarketData | null, instrument: string): HistoricalDataPoint[] {
    return (data?.prices ?? []).filter(p => p.instrument === instrument.toUpperCase()).map(p => ({ date: p.quoted_at,
        close: p.price_eur, open: p.price_eur, high: p.price_eur, low: p.price_eur, volume: 0, currency: 'EUR' }));
}
export function dailySnapshots(data: DailyMarketData | null) {
    return (data?.snapshots ?? []).flatMap(snapshot => {
        const point = createQuoteSnapshot(snapshot.assets, snapshot.transactions, snapshot.at);
        return point ? [{...point,valuationKind:snapshot.valuationKind,observationFrom:snapshot.observationFrom,observationTo:snapshot.observationTo}] : [];
    });
}
