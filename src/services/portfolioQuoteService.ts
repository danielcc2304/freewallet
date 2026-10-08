import type { Asset, StockQuote } from '../types/types';
import { getQuote, getAssetChartData } from './apiService';
import { quoteCurrency, datedFx, previousCryptoClose } from '../../supabase/functions/_shared/quoteCurrency';
import type { FxObservation } from '../../supabase/functions/_shared/quoteCurrency';
import { getFundRelevance } from './finect/finectService';
import { prefersBatchQuote } from './market/marketSessions';
import {freshFundQuote} from './funds/freshFundQuote';
import {fundSourcePriority} from '../../supabase/functions/_shared/fundQuotePolicy';

const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{10}$/;

export async function normalizeQuoteToEuro(quote: StockQuote, signal?: AbortSignal, forceRefresh = false, assetType?: Asset['type']): Promise<StockQuote> {
    try {
        const unit = quote.currency || '';
        const { currency, scale } = quoteCurrency(unit);
        let rate = 1, previousRate = 1, fxAt: string | null = null;
        let previous=quote.previousClose*scale,previousAt=quote.previousQuotedAt;
        let candles:FxObservation[]=[];
        if (currency !== 'EUR') {
            if (!quote.quotedAt) return quote;
            const history = await getAssetChartData(`${currency}EUR=X`, '1M', signal, { forceRefresh });
            candles = history.map(p => ({ at: new Date(p.timestamp ?? Date.parse(p.date)).toISOString(), close: p.close }));
            const observation = datedFx(candles, quote.quotedAt);
            rate = observation.close; fxAt = observation.at;
        }
        // An optional previous-close lookup must not discard a valid EUR price.
        if(assetType==='crypto') {previous=NaN;previousAt=undefined;}
        if(quote.quotedAt && (assetType==='crypto' || currency!=='EUR' && !previousAt && previous>0)) {
            try {
                const prices=await getAssetChartData(quote.symbol,'1M',signal,{forceRefresh});
                const history=prices.filter(p=>p.currency===currency).map(p=>({at:new Date(p.timestamp ?? Date.parse(p.date)).toISOString(),close:p.close}));
                if(assetType==='crypto') {
                    const baseline=previousCryptoClose(history,quote.quotedAt);
                    previous=baseline?.close ?? NaN;previousAt=baseline?.at;
                } else {
                    const preceding=history.filter(p=>p.at.slice(0,10)<quote.quotedAt!.slice(0,10)).sort((a,b)=>a.at.localeCompare(b.at)).at(-1);
                    if(preceding && Math.abs(preceding.close/previous-1)<0.000001)previousAt=preceding.at;
                }
            } catch { /* The current valuation remains valid without a daily change. */ }
        }
        if(currency!=='EUR') {
            previousRate=NaN;
            if(previousAt)try{previousRate=datedFx(candles,previousAt).close;}catch{/* No dated previous FX: variation is unavailable. */}
        }
        const price = quote.price * scale * rate;
        const previousClose = previous * previousRate;
        const change = price - previousClose;
        return {
            ...quote,
            price,
            change,
            changePercent: previousClose > 0 ? change / previousClose * 100 : NaN,
            previousClose,
            previousQuotedAt:previousAt,
            open: quote.open * scale * rate,
            high: quote.high * scale * rate,
            low: quote.low * scale * rate,
            currency: 'EUR',
            originalPrice: quote.price, originalCurrency: currency, originalUnit: unit, unitScale: scale,
            fxRate: rate, fxAt, valuationBasis: 'quote-date-fx',
        };
    } catch {
        return quote;
    }
}

export async function getPortfolioAssetQuote(asset: Asset, signal?: AbortSignal, forceRefresh = false, storedQuote?: StockQuote): Promise<StockQuote | null> {
    const preferBatch = prefersBatchQuote(asset);
    const currentAt = Date.parse(asset.quotedAt || asset.lastQuoteAt || '');
    const storedAt = Date.parse(storedQuote?.quotedAt || '');
    const canUseStored = !Number.isFinite(currentAt) || (Number.isFinite(storedAt) && storedAt >= currentAt);
    if (!forceRefresh && storedQuote && preferBatch && canUseStored) return storedQuote;
    if (asset.type === 'cash') return { symbol: asset.symbol, name: asset.name, price: 1, previousClose: 1, change: 0, changePercent: 0, open: 1, high: 1, low: 1, volume: 0, currency: asset.currency || 'EUR', quotedAt: new Date().toISOString(), checkedAt: new Date().toISOString(), origin: 'provider', source: 'Saldo' };
    const isin = (asset.isin || (ISIN_PATTERN.test(asset.symbol) ? asset.symbol : '')).trim().toUpperCase();

    if (asset.type === 'fund' && isin) {
        if(forceRefresh)try {
            const fresh=await freshFundQuote(asset,isin,signal);
            if(fresh)return fresh;
        }catch{if(signal?.aborted)return null;}
        try {
            // Automatic refreshes can reuse Finect's six-hour fund cache (NAVs
            // are generally daily). Manual refreshes can still bypass it.
            const fund = await getFundRelevance(isin, signal, forceRefresh);
            const price = fund.lastQuote?.price;
            if (price && price > 0) {
                const change = fund.lastQuote?.change || 0;
                const previousClose = fund.lastQuote?.change !== undefined ? price - change : NaN;
                const fundQuote: StockQuote = {
                    symbol: isin,
                    quotedAt: fund.lastQuote?.datetime,
                    checkedAt: fund.fetchedAt, origin: 'provider', source: 'Finect',
                    name: fund.className || fund.name,
                    price,
                    change,
                    changePercent: fund.lastQuote?.percentChange || 0,
                    previousClose,
                    open: previousClose,
                    high: price,
                    low: price,
                    volume: 0,
                    currency: fund.currencyCode || asset.currency || 'EUR',
                };
                const normalized=await normalizeQuoteToEuro(fundQuote, signal, forceRefresh);
                // A fallback must not replace a fresher or better corroborated
                // batch NAV when an on-demand source is unavailable.
                if(storedQuote&&canUseStored&&(String(storedQuote.quotedAt).slice(0,10)>String(normalized.quotedAt).slice(0,10)
                    ||String(storedQuote.quotedAt).slice(0,10)===String(normalized.quotedAt).slice(0,10)
                    &&fundSourcePriority(storedQuote.source??'')<fundSourcePriority(normalized.source??'')))return storedQuote;
                return normalized;
            }
        } catch (error) {
            console.warn(`[Portfolio] Finect no pudo actualizar ${isin}; se probarán proveedores de mercado.`, error);
        }
    }

    // Session refreshes bypass both the batch and the browser quote cache.
    const directRefresh = forceRefresh || !preferBatch;
    const quote = await getQuote(asset.symbol, signal, directRefresh);
    if (quote) return normalizeQuoteToEuro(quote, signal, directRefresh, asset.type);
    // Keep an existing live quote when the batch is older. The caller leaves
    // the current position untouched when no acceptable fallback is available.
    return storedQuote && canUseStored ? storedQuote : null;
}
