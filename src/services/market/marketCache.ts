import type { SearchResult, StockQuote } from '../../types/types';

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

export const QUOTE_CACHE = new Map<string, CacheEntry<StockQuote>>();
export const SEARCH_CACHE = new Map<string, CacheEntry<SearchResult[]>>();

export const TTL = {
    QUOTE: 60 * 1000,
    SEARCH: 10 * 60 * 1000,
    FUNDAMENTALS: 6 * 60 * 60 * 1000,
    CHART: 5 * 60 * 1000,
};
