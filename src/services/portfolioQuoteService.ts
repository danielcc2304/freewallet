import type { Asset, StockQuote } from '../types/types';
import { getQuote } from './apiService';
import { getFundRelevance } from './finect/finectService';

const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{10}$/;

export async function normalizeQuoteToEuro(quote: StockQuote, signal?: AbortSignal): Promise<StockQuote> {
    const sourceCurrency = quote.currency?.toUpperCase();
    if (!sourceCurrency || sourceCurrency === 'EUR' || sourceCurrency === 'UNKNOWN') return quote;

    try {
        const fxQuote = await getQuote(`${sourceCurrency}EUR=X`, signal);
        if (!fxQuote?.price) return quote;
        return {
            ...quote,
            price: quote.price * fxQuote.price,
            change: quote.change * fxQuote.price,
            previousClose: quote.previousClose * fxQuote.price,
            open: quote.open * fxQuote.price,
            high: quote.high * fxQuote.price,
            low: quote.low * fxQuote.price,
            currency: 'EUR',
        };
    } catch {
        return quote;
    }
}

export async function getPortfolioAssetQuote(asset: Asset, signal?: AbortSignal, forceRefresh = false): Promise<StockQuote | null> {
    const isin = (asset.isin || (ISIN_PATTERN.test(asset.symbol) ? asset.symbol : '')).trim().toUpperCase();

    if (isin) {
        try {
            // Automatic refreshes can reuse Finect's six-hour fund cache (NAVs
            // are generally daily). Manual refreshes can still bypass it.
            const fund = await getFundRelevance(isin, signal, forceRefresh);
            const price = fund.lastQuote?.price;
            if (price && price > 0) {
                const change = fund.lastQuote?.change || 0;
                const previousClose = change ? price - change : price;
                const fundQuote: StockQuote = {
                    symbol: isin,
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
                return normalizeQuoteToEuro(fundQuote, signal);
            }
        } catch (error) {
            console.warn(`[Portfolio] Finect no pudo actualizar ${isin}; se probarán proveedores de mercado.`, error);
        }
    }

    const quote = await getQuote(asset.symbol, signal);
    return quote ? normalizeQuoteToEuro(quote, signal) : null;
}
