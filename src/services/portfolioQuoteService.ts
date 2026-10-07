import type { Asset, StockQuote } from '../types/types';
import { getQuote } from './apiService';
import { getFundRelevance } from './finect/finectService';
import { prefersBatchQuote } from './market/marketSessions';

const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{10}$/;

export async function normalizeQuoteToEuro(quote: StockQuote, signal?: AbortSignal, forceRefresh = false): Promise<StockQuote> {
    const sourceCurrency = quote.currency?.toUpperCase();
    if (!sourceCurrency || sourceCurrency === 'EUR' || sourceCurrency === 'UNKNOWN') return quote;

    try {
        const fxQuote = await getQuote(`${sourceCurrency}EUR=X`, signal, forceRefresh);
        if (!fxQuote?.price) return quote;
        const price = quote.price * fxQuote.price;
        const previousClose = fxQuote.previousClose > 0 ? quote.previousClose * fxQuote.previousClose : NaN;
        const change = price - previousClose;
        return {
            ...quote,
            price,
            change,
            changePercent: previousClose > 0 ? change / previousClose * 100 : NaN,
            previousClose,
            open: quote.open * fxQuote.price,
            high: quote.high * fxQuote.price,
            low: quote.low * fxQuote.price,
            currency: 'EUR',
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
                return normalizeQuoteToEuro(fundQuote, signal, forceRefresh);
            }
        } catch (error) {
            console.warn(`[Portfolio] Finect no pudo actualizar ${isin}; se probarán proveedores de mercado.`, error);
        }
    }

    // Session refreshes bypass both the batch and the browser quote cache.
    const directRefresh = forceRefresh || !preferBatch;
    const quote = await getQuote(asset.symbol, signal, directRefresh);
    if (quote) return normalizeQuoteToEuro(quote, signal, directRefresh);
    // Keep an existing live quote when the batch is older. The caller leaves
    // the current position untouched when no acceptable fallback is available.
    return storedQuote && canUseStored ? storedQuote : null;
}
