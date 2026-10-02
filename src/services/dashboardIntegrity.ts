import type { Asset, AssetHolding, SearchResult } from '../types/types';
import { hasValidPrice } from './assetValuation';
import { planAssetKey } from './portfolioPlan';

/** Multiple lots are legitimate; only a reused record ID is a definite duplicate. */
export function positionLotCounts(assets: Asset[]) {
    const instruments = new Set(assets.map(a => `${planAssetKey(a)}:${a.currency || 'EUR'}`));
    return { extraLots: assets.length - instruments.size, duplicateIds: assets.length - new Set(assets.map(a => a.id)).size };
}

export function dailyAssetVariation(asset: Asset) {
    const valid = hasValidPrice(asset) && Number.isFinite(asset.previousClose) && asset.previousClose! > 0;
    return {
        todayChange: valid ? (asset.currentPrice! - asset.previousClose!) * asset.quantity : NaN,
        todayChangePercent: valid ? (asset.currentPrice! / asset.previousClose! - 1) * 100 : NaN,
    };
}

export function quoteIdentity(asset: Pick<Asset, 'symbol' | 'isin' | 'type' | 'currency'>): string {
    return [asset.symbol.trim().toUpperCase(), asset.isin?.trim().toUpperCase() || '', asset.type, asset.currency || 'EUR'].join('|');
}

/** Instrument changes invalidate market data; edits to a lot do not. */
export function applyPositionUpdate(asset: Asset, updates: Partial<Asset>): Asset {
    const next = { ...asset, ...updates };
    if (quoteIdentity(asset) === quoteIdentity(next)) return next;
    return { ...next, currentPrice: undefined, previousClose: undefined, lastCheckedAt: undefined, lastQuoteAt: undefined, quotedAt: undefined, quoteSource: undefined, holdings: undefined };
}

/** Late responses belong to the requested instrument, not just its reusable ID. */
export function applicableQuoteUpdates(requested: Asset[], current: Asset[], updates: Array<{ id: string; updates: Partial<Asset> }>) {
    const identities = new Map(requested.map(a => [a.id, quoteIdentity(a)]));
    const currentIdentities = new Map(current.map(a => [a.id, quoteIdentity(a)]));
    return updates.filter(u => identities.get(u.id) !== undefined && identities.get(u.id) === currentIdentities.get(u.id));
}

export function compareKnownReturns(a: number, b: number, direction: 'asc' | 'desc') {
    if (!Number.isFinite(a)) return Number.isFinite(b) ? 1 : 0;
    if (!Number.isFinite(b)) return -1;
    return direction === 'asc' ? a - b : b - a;
}

export function chooseUnderlyingResult(results: SearchResult[], holding: AssetHolding): SearchResult | undefined {
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const expected = normalize(holding.name);
    const isin = holding.isin?.trim().toUpperCase() || (/^[A-Z]{2}[A-Z0-9]{9}\d$/i.test(holding.symbol.trim()) ? holding.symbol.trim().toUpperCase() : undefined);
    if (isin) return results.find(r => r.symbol.toUpperCase() === isin || ('isin' in r && String(r.isin).toUpperCase() === isin));
    const symbol = holding.symbol.trim().toUpperCase();
    const exactSymbol = symbol && normalize(symbol) !== expected ? results.filter(r => r.symbol.toUpperCase() === symbol) : [];
    if (exactSymbol.length === 1) return exactSymbol[0];
    const exactNames = results.filter(r => normalize(r.name) === expected);
    if (exactNames.length === 1) return exactNames[0];
    const tokens = expected.split(' ').filter(t => t.length > 2 && !['inc', 'corp', 'plc', 'ltd', 'corporation', 'limited'].includes(t));
    if (!tokens.length) return undefined;
    const matches = results.filter(r => {
        const name = normalize(r.name).split(' ');
        return r.type === 'stock' && tokens.every(t => name.includes(t));
    });
    return matches.length === 1 ? matches[0] : undefined;
}
