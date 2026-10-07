import type { Asset, AssetHolding, SearchResult } from '../types/types';
import { hasValidPrice } from './assetValuation';
import { planAssetKey } from './portfolioPlan';
import { accountingDay } from './portfolioCalendar';
import { underlyingCompanyKey, underlyingIsin, underlyingNameKey, underlyingReference } from './underlyingInstruments';

/** Multiple lots are legitimate; only a reused record ID is a definite duplicate. */
export function positionLotCounts(assets: Asset[]) {
    const instruments = new Set(assets.map(a => `${planAssetKey(a)}:${a.currency || 'EUR'}`));
    return { extraLots: assets.length - instruments.size, duplicateIds: assets.length - new Set(assets.map(a => a.id)).size };
}

export function dailyAssetVariation(asset: Asset, now = Date.now()) {
    const valid = hasValidPrice(asset) && Number.isFinite(asset.previousClose) && asset.previousClose! > 0;
    const timestamp = Date.parse(asset.quotedAt || asset.lastQuoteAt || '');
    const quoteDay = Number.isFinite(timestamp) && timestamp <= now ? accountingDay(timestamp) : undefined;
    const isToday = quoteDay === accountingDay(now);
    const latestChange = valid ? (asset.currentPrice! - asset.previousClose!) * asset.quantity : NaN;
    const latestChangePercent = valid ? (asset.currentPrice! / asset.previousClose! - 1) * 100 : NaN;
    return {
        todayChange: isToday ? latestChange : NaN,
        todayChangePercent: isToday ? latestChangePercent : NaN,
        latestChange,
        latestChangePercent,
        quoteDay,
        isToday,
    };
}

/** A portfolio daily fallback must not aggregate quotes from different/unknown days. */
export function hasCurrentDayQuotes(assets: Asset[], now: number) {
    return assets.some(a => a.type !== 'cash' && a.quantity > 0)
        && assets.filter(a => a.type !== 'cash' && a.quantity > 0).every(a => dailyAssetVariation(a, now).isToday);
}

export function filterDashboardAssets<T extends Asset>(assets: T[], query: string, type: Asset['type'] | 'all'): T[] {
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return assets.filter(a => (type === 'all' || a.type === type) && terms.every(term => normalize(`${a.name} ${a.symbol} ${a.isin || ''}`).includes(term)));
}

export function quoteIdentity(asset: Pick<Asset, 'symbol' | 'isin' | 'type' | 'currency'>): string {
    return [asset.symbol.trim().toUpperCase(), asset.isin?.trim().toUpperCase() || '', asset.type, asset.currency || 'EUR'].join('|');
}

/** Instrument changes invalidate market data; edits to a lot do not. */
export function applyPositionUpdate(asset: Asset, updates: Partial<Asset>): Asset {
    const next = { ...asset, ...updates };
    if (quoteIdentity(asset) === quoteIdentity(next)) return next;
    return { ...next, currentPrice: undefined, previousClose: undefined, lastCheckedAt: undefined, lastReadAt: undefined, quoteOrigin: undefined, lastQuoteAt: undefined, quotedAt: undefined, quoteSource: undefined, holdings: undefined };
}

/** Late responses belong to the requested instrument, not just its reusable ID. */
export function applicableQuoteUpdates(requested: Asset[], current: Asset[], updates: Array<{ id: string; updates: Partial<Asset> }>) {
    const identities = new Map(requested.map(a => [a.id, quoteIdentity(a)]));
    const currentIdentities = new Map(current.map(a => [a.id, quoteIdentity(a)]));
    const currentAssets = new Map(current.map(a => [a.id, a]));
    return updates.filter(u => {
        if (identities.get(u.id) === undefined || identities.get(u.id) !== currentIdentities.get(u.id)) return false;
        const asset = currentAssets.get(u.id)!;
        const currentAt = Date.parse(asset.quotedAt || asset.lastQuoteAt || '');
        const incomingAt = Date.parse(u.updates.quotedAt || u.updates.lastQuoteAt || '');
        return !Number.isFinite(currentAt) || (Number.isFinite(incomingAt) && incomingAt >= currentAt);
    });
}

export function compareKnownReturns(a: number, b: number, direction: 'asc' | 'desc') {
    if (!Number.isFinite(a)) return Number.isFinite(b) ? 1 : 0;
    if (!Number.isFinite(b)) return -1;
    return direction === 'asc' ? a - b : b - a;
}

export function chooseUnderlyingResult(results: SearchResult[], holding: AssetHolding, isinSearch = false): SearchResult | undefined {
    const expected = underlyingNameKey(holding.name);
    const isin = underlyingIsin(holding);
    if(!expected && !isin) return undefined;
    const reference = underlyingReference(holding);
    const candidates = results.filter(r => !isin || !r.isin || r.isin.toUpperCase()===isin);
    if(reference){
        const verified=candidates.find(r=>r.type==='stock' && r.symbol.toUpperCase()===reference.symbol && underlyingCompanyKey(r.name)===underlyingCompanyKey(reference.name));
        return verified ? {...verified,isin:reference.isin} : undefined;
    }
    if (isin) {
        const exact = candidates.filter(r => r.symbol.toUpperCase() === isin || r.isin?.toUpperCase() === isin);
        if(exact.length===1) return exact[0];
    }
    if(isin && !isinSearch) return undefined;
    // A literal ISIN lookup may omit the ISIN in each result. Require the full
    // company identity too; preserve separate classes when the ISIN is unknown.
    const matches=candidates.filter(r=>r.type==='stock' && underlyingNameKey(r.name)===expected);
    const isinMatches=isinSearch && isin ? candidates.filter(r=>r.type==='stock' && underlyingCompanyKey(r.name)===underlyingCompanyKey(holding.name)) : [];
    if(isin && isinMatches.length){
        const primary=[...isinMatches].sort((a,b)=>Number(/^[A-Z0-9]+\.(HK|TW|KS|KQ|MC|PA|L|T)$/.test(b.symbol))-Number(/^[A-Z0-9]+\.(HK|TW|KS|KQ|MC|PA|L|T)$/.test(a.symbol)));
        return {...primary[0],isin};
    }
    const symbol = holding.symbol.trim().toUpperCase();
    const exactSymbol = symbol && underlyingNameKey(symbol) !== expected ? matches.filter(r => r.symbol.toUpperCase() === symbol) : [];
    if (exactSymbol.length === 1) return exactSymbol[0];
    return matches.length === 1 ? matches[0] : undefined;
}
