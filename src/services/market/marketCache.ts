import type { SearchResult, StockQuote } from '../../types/types';

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

export const QUOTE_CACHE = new Map<string, CacheEntry<StockQuote>>();
export const SEARCH_CACHE = new Map<string, CacheEntry<SearchResult[]>>();

export const TTL = {
    // El dashboard refresca cada minuto; deja margen para que el siguiente
    // ciclo no reciba la cotización del ciclo anterior.
    QUOTE: 45 * 1000,
    SEARCH: 10 * 60 * 1000,
    FUNDAMENTALS: 6 * 60 * 60 * 1000,
    CHART: 5 * 60 * 1000,
};
