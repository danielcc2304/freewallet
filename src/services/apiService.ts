import axios from 'axios';
import {quoteCurrency,marketSymbolMatches} from '../../supabase/functions/_shared/quoteCurrency';
import { verifiedSecurityAlias } from './securityAliases';
import { getFundRelevance } from './finect/finectService';
import { fundChartSymbols } from './funds/fundChartResolution';
import { extractPublicFundamentals, normalizeFundamentals, normalizeFundamentalSeries, mergeFundamentals, hasFundamentals, FUNDAMENTAL_SERIES_TYPES } from './market/fundamentals';
import type { StockQuote, SearchResult, HistoricalDataPoint, AssetType, TimePeriod } from '../types/types';
import {
    QUOTE_CACHE,
    SEARCH_CACHE,
    CHART_CACHE,
    TTL,
} from './market/marketCache';
import {
    ALPHA_VANTAGE_API_KEY,
    ALPHA_VANTAGE_BASE_URL,
    FINNHUB_BASE_URL,
    MAX_FAILURES_BEFORE_SWITCH,
    YAHOO_BASE_URL,
    YAHOO_CHART_URL,
    YAHOO_CHART_FALLBACK_URL,
    YAHOO_SEARCH_URL,
    YAHOO_SPARK_URL,
} from './market/marketConfig';
import {
    fetchFromFastestProxy,
} from './market/marketProxy';
import {
    getAlphaVantageFailures,
    getFinnhubApiKey,
    getYahooFinanceFailures,
    incrementAlphaVantageFailures,
    incrementYahooFinanceFailures,
    resetAlphaVantageFailures,
    resetYahooFinanceFailures,
    setFinnhubApiKey,
    waitForAlphaVantageRateLimit,
    waitForFinnhubRateLimit,
} from './market/marketState';
import { isApiEnabled } from './storageService';

const CHART_SYMBOL_CACHE = new Map<string, string[]>();

type JsonRecord = Record<string, unknown>;

function asJsonRecord(value: unknown): JsonRecord {
    return value && typeof value === 'object' ? value as JsonRecord : {};
}

function asJsonRecords(value: unknown): JsonRecord[] {
    return Array.isArray(value)
        ? value.filter((item): item is JsonRecord => Boolean(item) && typeof item === 'object')
        : [];
}

function readString(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

function readFiniteNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readNumber(value: unknown, fallback = 0): number {
    return readFiniteNumber(value) ?? fallback;
}

function readNumberAt(value: unknown, index: number, fallback = 0): number {
    return Array.isArray(value) ? readNumber(value[index], fallback) : fallback;
}

function looksLikeISIN(q: string): boolean {
    return /^[A-Z]{2}[A-Z0-9]{10}$/.test(q.trim().toUpperCase());
}

function looksLikeCryptoPair(symbol:string):boolean {
    return /^[A-Z0-9]+-(USD|EUR|GBP|JPY|AUD|CAD|CHF)$/.test(symbol.trim().toUpperCase());
}

function isinCandidates(isin: string): string[] {
    const x = isin.trim().toUpperCase();
    // en Yahoo los fondos por ISIN a veces aparecen como ISIN.<exchange>
    return [`${x}.SG`, `${x}.L`, `${x}.MI`, `${x}.PA`, `${x}.DE`];
}

function normalizeQuery(q: string): string {
    return q.trim();
}

function queryLooksLikeFund(query: string): boolean {
    const s = query.toLowerCase();
    return (
        s.includes('fidelity') ||
        s.includes('msci') ||
        s.includes('index') ||
        s.includes('world') ||
        s.includes('fund') ||
        s.includes('fonds') ||
        s.includes('mutual') ||
        s.includes('isin')
    );
}

function addUniqueResult(
    allResults: SearchResult[],
    seenSymbols: Set<string>,
    res: SearchResult
): void {
    if (!seenSymbols.has(res.symbol)) {
        allResults.push(res);
        seenSymbols.add(res.symbol);
    }
}

function canonicalCompanyName(name: string): string {
    const legalTerms = new Set(['sa', 'sau', 'sl', 'slu', 'inc', 'corp', 'corporation', 'company', 'co', 'ltd', 'plc', 'ag', 'nv', 'spa', 'l', 's', 'a']);
    const tokens = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .split(' ')
        .filter((token) => token.length > 1 && !legalTerms.has(token));
    return Array.from(new Set(tokens)).slice(0, 4).join(' ');
}

function exchangePriority(symbol: string, currency?: string): number {
    const suffix = symbol.toUpperCase().split('.').pop() || '';
    const priorities: Record<string, number> = {
        MC: 100,
        PA: 90,
        DE: 80,
        MI: 75,
        F: 70,
        HM: 60,
        L: 50,
        NY: 45,
        NASDAQ: 45,
    };
    return (priorities[suffix] || (suffix === symbol.toUpperCase() ? 55 : 20)) + (currency?.toUpperCase() === 'EUR' ? 12 : 0);
}

function compactSearchResults(results: SearchResult[], score: (result: SearchResult) => number): SearchResult[] {
    // Yahoo devuelve la misma compañía en varias bolsas. Conserva una única
    // cotización por entidad, priorizando Europa y EUR.
    const bestByCompany = new Map<string, SearchResult>();
    results.forEach((result) => {
        const key = canonicalCompanyName(result.name) || result.symbol.toUpperCase();
        const previous = bestByCompany.get(key);
        const resultScore = score(result) + exchangePriority(result.symbol, result.currency);
        const previousScore = previous ? score(previous) + exchangePriority(previous.symbol, previous.currency) : -Infinity;
        if (!previous || resultScore > previousScore) bestByCompany.set(key, result);
    });
    return Array.from(bestByCompany.values());
}

// ===== SEARCH SYMBOLS (with fallback) =====
export async function searchSymbol(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
    if (!isApiEnabled()) {
        return [];
    }

    const q = normalizeQuery(query);
    const allResults: SearchResult[] = [];
    const seenSymbols = new Set<string>();

    // 0) Si parece ISIN, primero intenta resolver por "candidatos Yahoo"
    if (looksLikeISIN(q)) {
        const candidates = isinCandidates(q);

        // Paso 1: Intenta quote directo por Yahoo (candidatos ISIN.*)
        for (const sym of candidates) {
            try {
                const quote = await getQuoteYahoo(sym, signal);
                if (quote && quote.price > 0) {
                    addUniqueResult(allResults, seenSymbols, {
                        symbol: sym,
                        name: quote.name || sym,
                        type: 'fund',
                        region: 'Global',
                        currency: quote.currency || 'Unknown',
                    });
                    // Con 1 encontrado normalmente basta
                    break;
                }
            } catch {
                // sigue con el siguiente candidato
            }
        }

        // Paso 2: Si falla, intenta búsqueda por Yahoo usando el ISIN puro
        if (allResults.length === 0) {
            try {
                const yahooResults = await searchSymbolYahoo(q, signal);
                yahooResults.forEach(res => addUniqueResult(allResults, seenSymbols, res));
            } catch (error) {
                if (axios.isCancel(error)) throw error;
                console.warn('Yahoo ISIN search failed:', error);
            }
        }

        // Paso 3: Si sigue fallando, intenta búsqueda por Finnhub (solo si hay key real)
        if (allResults.length === 0 && getFinnhubApiKey() !== 'demo') {
            try {
                const finnhubResults = await searchSymbolFinnhub(q, signal);
                finnhubResults.forEach(res => addUniqueResult(allResults, seenSymbols, res));
            } catch (error) {
                if (axios.isCancel(error)) throw error;
                console.warn('Finnhub ISIN search failed:', error);
            }
        }

        // Si ya tenemos algo, devolvemos pronto
        if (allResults.length > 0) return allResults;
    }

    // 1) Yahoo Finance search (mejor cobertura)
    if (!signal?.aborted) {
        try {
            const results = await searchSymbolYahoo(q, signal);
            results.forEach(res => addUniqueResult(allResults, seenSymbols, res));
            resetYahooFinanceFailures();
        } catch (error) {
            if (axios.isCancel(error)) throw error;
            console.warn('Yahoo Finance search failed:', error);
            incrementYahooFinanceFailures();
        }
    }

    // Para autocompletado, una respuesta útil de Yahoo debe mostrarse ya. Evita
    // bloquear cada pulsación esperando proveedores con límites más estrictos.
    if (allResults.length > 0) return allResults;

    // 2) Alpha Vantage... (omitir detalles por brevedad, asumiendo mismos cambios)
    // En las siguientes funciones async, pasar el signal a axios.get(..., { signal })

    // 2) Alpha Vantage (si falta chicha)
    if (allResults.length < 8 && getAlphaVantageFailures() < MAX_FAILURES_BEFORE_SWITCH) {
        try {
            const results = await searchSymbolAlphaVantage(q, signal);
            results.forEach(res => addUniqueResult(allResults, seenSymbols, res));
            resetAlphaVantageFailures();
        } catch (error) {
            console.warn('Alpha Vantage search failed:', error);
            incrementAlphaVantageFailures();
        }
    }

    // 3) Finnhub (fallback)
    if (allResults.length < 5) {
        try {
            const results = await searchSymbolFinnhub(q, signal);
            results.forEach(res => addUniqueResult(allResults, seenSymbols, res));
        } catch (error) {
            console.warn('Finnhub search failed:', error);
        }
    }

    // 4) Heurística extra: si el query parece "Fidelity MSCI World",
    // intenta forzar algunos símbolos típicos (opcional, pero útil)
    // OJO: esto es un "hack", pero mejora UX.
    if (allResults.length === 0 && queryLooksLikeFund(q)) {
        const forced: string[] = [
            // el típico de Fidelity MSCI World Index Fund (ISIN) lo podrías construir si el usuario lo mete,
            // aquí solo dejo ejemplos: si tienes ISIN en tu DB local, mete los tuyos.
            // 'IE00BYX5NX33.SG',
        ];

        for (const sym of forced) {
            try {
                const quote = await getQuoteYahoo(sym);
                if (quote && quote.price > 0) {
                    addUniqueResult(allResults, seenSymbols, {
                        symbol: sym,
                        name: quote.name || sym,
                        type: 'fund',
                        region: 'Global',
                        currency: quote.currency || 'Unknown',
                    });
                }
            } catch {
                // Ignore unavailable forced Yahoo candidates.
            }
        }
    }

    if (allResults.length > 0) return allResults;

    return [];
}

// ===== ALPHA VANTAGE SEARCH =====
async function searchSymbolAlphaVantage(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
    await waitForAlphaVantageRateLimit();

    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
        params: {
            function: 'SYMBOL_SEARCH',
            keywords: query,
            apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 10000,
        signal,
    });

    // Check for API limit message
    if (response.data.Note || response.data['Error Message']) {
        console.warn('Alpha Vantage API limit or error:', response.data.Note || response.data['Error Message']);
        throw new Error('API limit reached');
    }

    const matches = response.data.bestMatches || [];
    return matches.map((match: Record<string, string>) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: mapAssetType(match['3. type']),
        region: match['4. region'],
        currency: match['8. currency'],
    }));
}

// ===== FINNHUB SEARCH =====
async function searchSymbolFinnhub(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
    await waitForFinnhubRateLimit();

    const response = await axios.get(`${FINNHUB_BASE_URL}/search`, {
        params: {
            q: query,
            token: getFinnhubApiKey(),
        },
        timeout: 10000,
        signal,
    });

    const results = response.data.result || [];
    return results.map((item: Record<string, string>) => ({
        symbol: item.symbol,
        name: item.description,
        type: mapFinnhubType(item.type),
        region: item.region || 'Global',
        currency: item.currency || 'USD', // Finnhub results often have currency
    }));
}

// ===== YAHOO FINANCE SEARCH =====
async function searchSymbolYahoo(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
    const q = normalizeQuery(query);

    // Check cache
    const cached = SEARCH_CACHE.get(q);
    if (cached && Date.now() - cached.timestamp < TTL.SEARCH) {
        return cached.data;
    }

    const url = `${YAHOO_SEARCH_URL}?q=${encodeURIComponent(q)}&quotesCount=40&newsCount=0`;

    try {
            const rawData: unknown = url.startsWith('/')
                ? (await axios.get(url, { signal, timeout: 5000 })).data
                : await fetchFromFastestProxy(url, signal);
            const data = asJsonRecord(rawData);
            const quotes = asJsonRecords(data.quotes);

            console.log(`[Yahoo API] Search for "${q}" returned ${quotes.length} results`);

            // Mapping
            const mapped: SearchResult[] = quotes.map((item) => ({
                symbol: readString(item.symbol),
                name: readString(item.shortname) || readString(item.longname) || readString(item.symbol),
                type: mapYahooType(readString(item.quoteType)),
                region: readString(item.region, 'Global'),
                currency: readString(item.currency, 'Unknown'),
            }));

            // Score and Sort
            const isFundQuery = queryLooksLikeFund(q);
            const getScore = (r: SearchResult) => {
                let s = 0;
                const nameLower = r.name?.toLowerCase() || '';
                const symbolLower = r.symbol?.toLowerCase() || '';
                const qLower = q.toLowerCase();

                if (symbolLower === qLower) s += 500;
                if (symbolLower.includes(qLower)) s += 100;
                if (nameLower === qLower) s += 400;

                if (isFundQuery) {
                    if (r.type === 'fund') s += 300;
                    if (r.type === 'etf') s += 200;
                    if (r.type === 'stock') s -= 100;
                } else {
                    if (r.type === 'stock') s += 50;
                    if (r.type === 'crypto') s += 50;
                }

                if (nameLower.includes('msci')) s += 50;
                if (nameLower.includes('world')) s += 30;
                if (nameLower.includes('fidelity')) s += 30;
                if (nameLower.includes('index')) s += 20;

                return s;
            };

            const sorted = compactSearchResults(mapped, getScore)
                .sort((a, b) => getScore(b) + exchangePriority(b.symbol, b.currency) - getScore(a) - exchangePriority(a.symbol, a.currency))
                .slice(0, 8);

            SEARCH_CACHE.set(q, { data: sorted, timestamp: Date.now() });
            return sorted;
    } catch (error) {
        if (axios.isCancel(error)) throw error;
        console.warn('Yahoo Finance search failed:', error);
    }

    return [];
}

// ===== GET QUOTE (with fallback) =====
export async function getQuote(symbol: string, signal?: AbortSignal, forceRefresh = false): Promise<StockQuote | null> {
    if (!isApiEnabled()) {
        return null;
    }

    // Check cache first
    const cached = QUOTE_CACHE.get(symbol);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < TTL.QUOTE) {
        console.log(`[Cache Hit] Quote for ${symbol}`);
        return cached.data;
    }

    // Try Yahoo Finance first as it's generally more reliable and has better coverage
    if (!signal?.aborted) {
        try {
            const quote = await getQuoteYahoo(symbol, signal);
            if (quote) {
                resetYahooFinanceFailures();
                quote.checkedAt = new Date().toISOString();
                quote.origin = 'provider';
                quote.source = 'Yahoo Finance';
                QUOTE_CACHE.set(symbol, { data: quote, timestamp: Date.now() });
                return quote;
            }
        } catch (error) {
            if (axios.isCancel(error)) throw error;
            console.warn('Yahoo Finance quote failed, trying Alpha Vantage...', error);
            incrementYahooFinanceFailures();
        }
    }

    // Try Alpha Vantage second
    if (getAlphaVantageFailures() < MAX_FAILURES_BEFORE_SWITCH) {
        try {
            const quote = await getQuoteAlphaVantage(symbol, signal);
            if (quote) {
                resetAlphaVantageFailures();
                quote.checkedAt = new Date().toISOString();
                quote.origin = 'provider';
                quote.source = 'Mercado';
                QUOTE_CACHE.set(symbol, { data: quote, timestamp: Date.now() });
                return quote;
            }
        } catch (error) {
            if (axios.isCancel(error)) throw error;
            console.warn('Alpha Vantage quote failed, trying Finnhub...', error);
            incrementAlphaVantageFailures();
        }
    }

    // Try Finnhub as additional fallback
    try {
        const quote = await getQuoteFinnhub(symbol, signal);
        if (quote) {
            quote.checkedAt = new Date().toISOString();
            quote.origin = 'provider';
            quote.source = 'Mercado';
            QUOTE_CACHE.set(symbol, { data: quote, timestamp: Date.now() });
            return quote;
        }
    } catch (error) {
        if (axios.isCancel(error)) throw error;
        console.warn('Finnhub quote failed:', error);
    }

    // Return null if all sources fail (Strict Real Data)
    return null;
}

// ===== ALPHA VANTAGE GET QUOTE =====
async function getQuoteAlphaVantage(symbol: string, signal?: AbortSignal): Promise<StockQuote | null> {
    await waitForAlphaVantageRateLimit();

    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
        params: {
            function: 'GLOBAL_QUOTE',
            symbol: symbol,
            apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 10000,
        signal,
    });

    // Check for API limit message
    if (response.data.Note || response.data['Error Message']) {
        throw new Error('API limit reached');
    }

    const quote = response.data['Global Quote'];
    if (!quote || Object.keys(quote).length === 0) {
        return null;
    }

    return {
        symbol: quote['01. symbol'],
        name: symbol,
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat((quote['10. change percent'] || '0').replace('%', '')),
        previousClose: parseFloat(quote['08. previous close']),
        open: parseFloat(quote['02. open']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        volume: parseInt(quote['06. volume']),
        currency: 'USD',
    };
}

// ===== FINNHUB GET QUOTE =====
async function getQuoteFinnhub(symbol: string, signal?: AbortSignal): Promise<StockQuote | null> {
    await waitForFinnhubRateLimit();

    const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
        params: {
            symbol: symbol,
            token: getFinnhubApiKey(),
        },
        timeout: 10000,
        signal,
    });

    const data = response.data;
    if (!data || data.c === 0) {
        return null;
    }

    return {
        symbol: symbol,
        name: symbol,
        price: data.c, // Current price
        change: data.d, // Change
        changePercent: data.dp, // Change percent
        previousClose: data.pc, // Previous close
        open: data.o, // Open
        high: data.h, // High
        low: data.l, // Low
        volume: 0, // Finnhub doesn't include volume in quote
        currency: 'USD',
    };
}

// ===== YAHOO FINANCE GET QUOTE =====
async function getQuoteYahoo(symbol: string, signal?: AbortSignal): Promise<StockQuote | null> {
    let lastError: unknown;
    for (const baseUrl of [YAHOO_CHART_URL, YAHOO_CHART_FALLBACK_URL]) {
        try {
            // The one-day range supplies the previous session close. A
            // five-day chartPreviousClose may belong to the start of the range.
            const url = `${baseUrl}/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
            const rawData: unknown = (await axios.get(url, { signal, timeout: 5000 })).data;
            const chart = asJsonRecord(asJsonRecord(rawData).chart);
            const meta = asJsonRecord((asJsonRecords(chart.result)[0] ?? {}).meta);
            if (readString(meta.symbol).toUpperCase() !== symbol.trim().toUpperCase()) continue;
            const price = readFiniteNumber(meta.regularMarketPrice);
            if (price === undefined || price <= 0) continue;
            const previousClose = [meta.regularMarketPreviousClose, meta.previousClose, meta.chartPreviousClose]
                .map(readFiniteNumber).find(value => value !== undefined && value > 0) ?? NaN;
            const change = price - previousClose;
            return {
                quotedAt: readFiniteNumber(meta.regularMarketTime) ? new Date(readNumber(meta.regularMarketTime) * 1000).toISOString() : undefined,
                symbol: readString(meta.symbol),
                name: readString(meta.longName) || readString(meta.shortName) || symbol,
                price, change,
                changePercent: previousClose > 0 ? change / previousClose * 100 : NaN,
                previousClose,
                open: readFiniteNumber(meta.regularMarketOpen) ?? price,
                high: readFiniteNumber(meta.regularMarketDayHigh) ?? price,
                low: readFiniteNumber(meta.regularMarketDayLow) ?? price,
                volume: readNumber(meta.regularMarketVolume),
                currency: readString(meta.currency, 'Unknown'),
                fiftyTwoWeekHigh: readFiniteNumber(meta.fiftyTwoWeekHigh),
                fiftyTwoWeekLow: readFiniteNumber(meta.fiftyTwoWeekLow),
            };
        } catch (error) {
            if (axios.isCancel(error) || signal?.aborted) throw error;
            lastError = error;
        }
    }
    if (lastError) throw lastError;
    return null;
}

// ===== YAHOO FINANCE GET QUOTES BATCH =====
// ===== YAHOO FINANCE GET QUOTES BATCH =====
export async function getQuotesYahooBatch(symbols: string[], signal?: AbortSignal): Promise<StockQuote[]> {
    if (symbols.length === 0) return [];

    // Fix 6: Chunking to avoid URL overflow
    const CHUNK_SIZE = 20;
    const allQuotes: StockQuote[] = [];

    // Helper to process a single chunk
    const fetchChunk = async (chunkSymbols: string[]): Promise<StockQuote[]> => {
        const url = `${YAHOO_BASE_URL}/quote?symbols=${encodeURIComponent(chunkSymbols.join(','))}`;

        try {
                const data = asJsonRecord(await fetchFromFastestProxy(url, signal));
                const quoteResponse = asJsonRecord(data.quoteResponse);
                const results = asJsonRecords(quoteResponse.result);

                console.log(`[Yahoo API] Batch quote for ${chunkSymbols.length} symbols returned ${results.length} results`);

                return results.map((result) => {
                    const dividendYield = readFiniteNumber(result.trailingAnnualDividendYield);

                    return {
                    quotedAt: readFiniteNumber(result.regularMarketTime) ? new Date(readNumber(result.regularMarketTime) * 1000).toISOString() : undefined,
                    symbol: readString(result.symbol),
                    name: readString(result.longName) || readString(result.shortName) || readString(result.symbol),
                    price: readNumber(result.regularMarketPrice),
                    change: readNumber(result.regularMarketChange),
                    changePercent: readNumber(result.regularMarketChangePercent),
                    previousClose: readNumber(result.regularMarketPreviousClose),
                    open: readNumber(result.regularMarketOpen),
                    high: readNumber(result.regularMarketDayHigh),
                    low: readNumber(result.regularMarketDayLow),
                    volume: readNumber(result.regularMarketVolume),
                    marketCap: readFiniteNumber(result.marketCap),
                    // Fix 1: No fake defaults
                    currency: readString(result.currency) || readString(result.financialCurrency) || 'Unknown',
                    // Fundamentals from Yahoo
                    pe: readFiniteNumber(result.trailingPE),
                    forwardPe: readFiniteNumber(result.forwardPE),
                    ps: readFiniteNumber(result.priceToSales),
                    pb: readFiniteNumber(result.priceToBook),
                    dividendYield: dividendYield !== undefined ? dividendYield * 100 : undefined,
                    dividendRate: readFiniteNumber(result.trailingAnnualDividendRate),
                    eps: readFiniteNumber(result.trailingEps),
                    beta: readFiniteNumber(result.beta),
                    fiftyTwoWeekHigh: readFiniteNumber(result.fiftyTwoWeekHigh),
                    fiftyTwoWeekLow: readFiniteNumber(result.fiftyTwoWeekLow),
                    };
                });
        } catch (error) {
            if (axios.isCancel(error)) throw error;
            console.warn('Yahoo Finance batch chunk failed:', error);
        }
        return [];
    };

    // Process chunks
    for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
        const chunk = symbols.slice(i, i + CHUNK_SIZE);
        const chunkResults = await fetchChunk(chunk);
        allQuotes.push(...chunkResults);

        // Small delay between chunks to be nice to proxies if we have many
        if (symbols.length > CHUNK_SIZE) {
            await new Promise(r => setTimeout(r, 200));
        }
    }

    return allQuotes;
}

// ===== YAHOO FINANCE MULTI-SYMBOL SPARK =====
// Unlike the quote endpoint, spark does not require a Yahoo crumb and can
// return many daily series in one request. It is used by broad market views.
export async function getQuotesYahooSpark(symbols: string[], signal?: AbortSignal): Promise<StockQuote[]> {
    const uniqueSymbols = Array.from(new Set(symbols.filter(Boolean)));
    if (uniqueSymbols.length === 0 || !isApiEnabled()) return [];

    // Yahoo rejects spark requests with more than 20 symbols.
    const chunkSize = 20;
    const chunks: string[][] = [];
    for (let index = 0; index < uniqueSymbols.length; index += chunkSize) {
        chunks.push(uniqueSymbols.slice(index, index + chunkSize));
    }

    const chunkResults: StockQuote[][] = Array.from({ length: chunks.length }, () => []);
    let nextChunk = 0;
    const worker = async () => {
        while (nextChunk < chunks.length) {
            const chunkIndex = nextChunk;
            nextChunk += 1;
            const chunk = chunks[chunkIndex];
            const url = `${YAHOO_SPARK_URL}?symbols=${encodeURIComponent(chunk.join(','))}&range=5d&interval=1d`;
            try {
                const response = await axios.get(url, { signal, timeout: 15000 });
                const payload = response.data as Record<string, {
                    symbol?: string;
                    close?: Array<number | null>;
                }>;

                chunkResults[chunkIndex] = Object.entries(payload || {}).flatMap(([requestedSymbol, item]) => {
                    const closes = (item?.close || []).filter((value): value is number => Number.isFinite(value));
                    if (closes.length === 0) return [];
                    const price = closes.at(-1) as number;
                    const previousClose = closes.at(-2) ?? price;
                    const change = price - previousClose;

                    return [{
                        symbol: item.symbol || requestedSymbol,
                        name: item.symbol || requestedSymbol,
                        price,
                        change,
                        changePercent: previousClose ? (change / previousClose) * 100 : 0,
                        previousClose,
                        open: price,
                        high: price,
                        low: price,
                        volume: 0,
                        currency: 'Unknown',
                    } satisfies StockQuote];
                });
            } catch (error) {
                if (axios.isCancel(error)) throw error;
                console.warn('Yahoo Finance spark chunk failed:', error);
                chunkResults[chunkIndex] = [];
            }
        }
    };

    await Promise.all(Array.from({ length: Math.min(4, chunks.length) }, () => worker()));

    return chunkResults.flat();
}

// ===== YAHOO FINANCE GET FUNDAMENTALS =====
export async function getFundamentalData(symbol: string, signal?: AbortSignal, includeCompanyProfile = true): Promise<Partial<StockQuote>> {
    if (!isApiEnabled()) {
        return {};
    }

    const abortOrEmpty = (error: unknown): Partial<StockQuote> => {
        if (axios.isCancel(error) || signal?.aborted) throw error;
        return {};
    };
    // Same-origin routes work in development and production. The chart quote
    // only supplies prices/ranges; it is not a source of EBITDA or earnings.
    const [base, summary] = await Promise.all([
        getQuoteYahoo(symbol, signal).then(data => data || {}).catch(abortOrEmpty),
        axios.get(`/__market/yahoo1/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=price,defaultKeyStatistics,financialData,summaryDetail${includeCompanyProfile ? ',summaryProfile' : ''}`, {signal, timeout:5000})
            .then(response => normalizeFundamentals(response.data, symbol)).catch(abortOrEmpty),
    ]);
    let series: Partial<StockQuote> = {};
    // Yahoo's public statistics page embeds the same JSON data even when v10
    // returns Invalid Crumb. No login, cookies or execution of scripts needed.
    const fetchPublished = async (page: 'key-statistics' | 'profile') => {
        try {
            const response = await axios.get(`/__market/yahoo-site/quote/${encodeURIComponent(symbol)}/${page}/`, {signal, timeout:8000, responseType:'text'});
            return extractPublicFundamentals(response.data, symbol);
        } catch (error) { return abortOrEmpty(error); }
    };
    const fetchSeries = async (ticker: string) => {
        try {
            const dates = `period1=${Math.floor((Date.now()-3*365.25*86400000)/1000)}&period2=${Math.ceil(Date.now()/1000)}`;
            const response = await axios.get(`/__market/yahoo1/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(ticker)}?type=${FUNDAMENTAL_SERIES_TYPES.join(',')}&merge=false&${dates}`, {signal,timeout:5000});
            return normalizeFundamentalSeries(response.data,ticker);
        } catch (error) { return abortOrEmpty(error); }
    };
    const needsFinancials = !Number.isFinite(summary.ebitda) || !Number.isFinite(summary.eps);
    const [profile, published, financialSeries] = await Promise.all([
        !includeCompanyProfile || summary.businessDescription ? Promise.resolve({}) : fetchPublished('profile'),
        needsFinancials ? fetchPublished('key-statistics') : Promise.resolve({}),
        needsFinancials ? fetchSeries(symbol) : Promise.resolve({}),
    ]);
    if (needsFinancials) {
        series = financialSeries;
        if (!hasFundamentals(series)) {
            const verified = verifiedSecurityAlias('',symbol);
            if(verified && verified.chartSymbol!==symbol.toUpperCase()) series = await fetchSeries(verified.chartSymbol);
        }
    }
    return {...mergeFundamentals(base,series,profile,published,summary),fundamentalsCheckedAt:new Date().toISOString()};
}

// ===== YAHOO FINANCE GET CHART DATA =====
async function searchChartInstrument(query: string, signal?: AbortSignal): Promise<unknown> {
    const url = YAHOO_SEARCH_URL + '?q=' + encodeURIComponent(query) + '&quotesCount=40&newsCount=0';
    return url.startsWith('/')
        ? (await axios.get(url, { signal, timeout: 5000 })).data as unknown
        : await fetchFromFastestProxy(url, signal);
}

/** Preserve individual listings/classes for look-through details, without autocomplete deduplication. */
export async function searchUnderlyingInstrument(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
    if(!isApiEnabled()) return [];
    const data=asJsonRecord(await searchChartInstrument(query,signal));
    return asJsonRecords(data.quotes).filter(r=>['EQUITY','ETF','MUTUALFUND'].includes(readString(r.quoteType))).map(r=>({
        symbol:readString(r.symbol),name:readString(r.longname)||readString(r.shortname)||readString(r.symbol),
        type:mapYahooType(readString(r.quoteType)),region:readString(r.region,'Global'),currency:readString(r.currency,'Unknown'),
        isin:readString(r.isin)||undefined,
    }));
}

async function getFundClassChartSymbols(isin: string, signal?: AbortSignal): Promise<string[]> {
    const key = 'fund-class::' + isin;
    const cached = CHART_SYMBOL_CACHE.get(key);
    if (cached) return cached;
    try {
        const fund = await getFundRelevance(isin, signal);
        if (!fund.className) return [];
        const symbols = fundChartSymbols(await searchChartInstrument(fund.className, signal), isin, fund.className);
        if (symbols.length) CHART_SYMBOL_CACHE.set(key, symbols);
        return symbols;
    } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) throw error;
        return [];
    }
}

async function getChartSymbolCandidates(symbol: string, signal?: AbortSignal): Promise<string[]> {
    const normalized = symbol.trim().toUpperCase();
    // FX pairs must not fall back to similarly named or inverse instruments.
    if (/^[A-Z]{6}=X$/.test(normalized)) return [normalized];
    // A crypto pair already identifies the coin and quote currency. Company
    // searches can delay the refresh or substitute another currency's series.
    if (looksLikeCryptoPair(normalized)) return [normalized];
    const cached = CHART_SYMBOL_CACHE.get(normalized);
    if (cached) return cached;

    if (looksLikeISIN(normalized)) {
        let resolved: string[] = [];
        try { resolved = fundChartSymbols(await searchChartInstrument(normalized, signal), normalized); }
        catch (error) { if (axios.isCancel(error) || signal?.aborted) throw error; }
        // Yahoo can return a traded quote with no NAV history (DWS DI4A.F).
        // Resolve the full, ISIN-verified class instead of a similar fund.
        if (!resolved.length) {
            resolved = await getFundClassChartSymbols(normalized, signal);
        }
        const candidates = [...new Set([...resolved, normalized + '.SG', normalized])];
        if (resolved.length) CHART_SYMBOL_CACHE.set(normalized, candidates);
        return candidates;
    }

    const verified = verifiedSecurityAlias('', normalized);
    const candidates = new Set<string>(verified ? [normalized, verified.chartSymbol] : [normalized]);

    // Some European listings returned by Yahoo (notably the DXE ".XD"
    // suffix) only expose a quote. Search the same company for a listing
    // that actually has historical candles before giving up on the chart.
    try {
        const queries = new Set([normalized, normalized.split('.')[0]]);
        let originalName = verified ? canonicalCompanyName(verified.name) : '';
        for (const query of queries) {
            const url = YAHOO_SEARCH_URL + '?q=' + encodeURIComponent(query) + '&quotesCount=40&newsCount=0';
            const rawData: unknown = url.startsWith('/')
                ? (await axios.get(url, { signal, timeout: 5000 })).data
                : await fetchFromFastestProxy(url, signal);
            const data = asJsonRecord(rawData);
            const quotes = asJsonRecords(data.quotes);
            const original = quotes.find((item) => readString(item.symbol).toUpperCase() === normalized);
            originalName = originalName || canonicalCompanyName(readString(original?.shortname) || readString(original?.longname));
            if (originalName) queries.add(originalName);

            quotes.forEach((item) => {
                const candidate = readString(item.symbol).trim().toUpperCase();
                const candidateName = canonicalCompanyName(readString(item.longname) || readString(item.shortname));
                if (!candidate || candidate === normalized) return;
                // Avoid following an unrelated ticker that merely shares a
                // short symbol (NXTE ETF vs Nueva Expresion Textil, for example).
                if (originalName && candidateName === originalName) candidates.add(candidate);
            });
        }
    } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) throw error;
    }

    const result = [normalized, ...Array.from(candidates).filter(c => c !== normalized).sort((a, b) => exchangePriority(b) - exchangePriority(a))];
    CHART_SYMBOL_CACHE.set(normalized, result);
    return result;
}

async function fetchYahooChartPoints(
    symbol: string,
    range: string,
    interval: string,
    period: TimePeriod,
    signal?: AbortSignal,
    startDate?: number,
    endDate?: number,
): Promise<HistoricalDataPoint[]> {
    const dates = Number.isFinite(startDate)
        ? `period1=${Math.floor((startDate! - 7 * 86400000) / 1000)}&period2=${Math.ceil((endDate ?? Date.now()) / 1000)}`
        : 'range=' + range;
    const url = YAHOO_CHART_URL + '/' + encodeURIComponent(symbol) + '?' + dates + '&interval=' + interval;
    const rawData: unknown = url.startsWith('/')
        ? (await axios.get(url, { signal, timeout: 6000 })).data
        : await fetchFromFastestProxy(url, signal);
    const data = asJsonRecord(rawData);
    const chart = asJsonRecord(data.chart);
    const result = asJsonRecords(chart.result)[0] ?? {};

    if((symbol.endsWith('=X') || looksLikeCryptoPair(symbol)) && !marketSymbolMatches(symbol,asJsonRecord(result.meta).symbol,asJsonRecord(result.meta).currency))return [];

    if (!Array.isArray(result.timestamp) || result.timestamp.length === 0) return [];

    const timestamps = result.timestamp;
    const indicators = asJsonRecord(result.indicators);
    const quotes = asJsonRecords(indicators.quote)[0] ?? {};
    const adjCloseRecord = asJsonRecords(indicators.adjclose)[0] ?? {};
    const adjClose = Array.isArray(adjCloseRecord.adjclose) ? adjCloseRecord.adjclose : quotes.close;
    const previousClose = readFiniteNumber(asJsonRecord(result.meta).chartPreviousClose);
    const rawCurrency=readString(asJsonRecord(result.meta).currency, 'Unknown');
    let currency=rawCurrency,scale=1;
    try{const unit=quoteCurrency(rawCurrency);currency=unit.currency;scale=unit.scale;}catch{/* Keep unknown chart units explicit. */}

    return timestamps.map((timestampValue, i) => {
        const timestamp = readNumber(timestampValue);
        const date = new Date(timestamp * 1000);
        const dateStr = period === '1D'
            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : date.toISOString().split('T')[0];

        return {
            date: dateStr,
            timestamp: timestamp * 1000,
            currency,
            sourceSymbol: symbol,
            previousClose: i === 0 && previousClose !== undefined ? previousClose * scale : undefined,
            open: readNumberAt(quotes.open, i) * scale,
            high: readNumberAt(quotes.high, i) * scale,
            low: readNumberAt(quotes.low, i) * scale,
            close: readNumberAt(adjClose, i, readNumberAt(quotes.close, i)) * scale,
            volume: readNumberAt(quotes.volume, i),
        };
    }).filter((point) => point.close > 0);
}

export async function getAssetChartData(
    symbol: string,
    period: TimePeriod = '1M',
    signal?: AbortSignal,
    options: { startDate?: number; endDate?: number; forceRefresh?: boolean } = {},
): Promise<HistoricalDataPoint[]> {
    if (!isApiEnabled()) {
        return [];
    }

    const cacheKey = `${symbol.trim().toUpperCase()}::${period}::${Number.isFinite(options.startDate) ? new Date(options.startDate!).toISOString().slice(0, 10) : ''}::${options.endDate ?? ''}`;
    const cached = CHART_CACHE.get(cacheKey);
    if (!options.forceRefresh && cached && Date.now() - cached.timestamp < TTL.CHART) {
        return cached.data;
    }
    if (options.forceRefresh) {
        CHART_SYMBOL_CACHE.delete(symbol.trim().toUpperCase());
        CHART_SYMBOL_CACHE.delete('fund-class::' + symbol.trim().toUpperCase());
    }

    let range = '1mo';
    let interval = '1d';
    const fundIdentifier = looksLikeISIN(symbol);

    switch (period) {
        case '1D':
            range = fundIdentifier ? '5d' : '1d';
            interval = fundIdentifier ? '1d' : '5m';
            break;
        case '7D':
            range = '7d';
            interval = fundIdentifier ? '1d' : '30m';
            break;
        case '1M':
            range = '1mo';
            interval = '1d';
            break;
        case '3M':
            range = '3mo';
            interval = '1d';
            break;
        case 'YTD':
            range = 'ytd';
            interval = '1d';
            break;
        case 'ALL':
            range = 'max';
            interval = '1wk';
            break;
    }

    try {
        const candidates = await getChartSymbolCandidates(symbol, signal);
        let bestPoints: HistoricalDataPoint[] = [];
        const visited = new Set<string>();
        const loadCandidates = async (symbols: string[]) => {
            for (const candidate of symbols) {
                if (visited.has(candidate)) continue;
                visited.add(candidate);
                try {
                    const points = await fetchYahooChartPoints(candidate, range, Number.isFinite(options.startDate) ? '1d' : interval, period, signal, options.startDate, options.endDate);
                    if (points.length > bestPoints.length) bestPoints = points;
                    // Keep looking when a listing only exposes a current quote.
                    if (points.length >= 2) return;
                } catch (error) {
                    if (axios.isCancel(error) || signal?.aborted) throw error;
                }
            }
        };
        await loadCandidates(candidates);
        if (fundIdentifier && bestPoints.length < 2) {
            await loadCandidates(await getFundClassChartSymbols(symbol.trim().toUpperCase(), signal));
        }
        const result = fundIdentifier && period === '1D' ? bestPoints.slice(-2) : bestPoints;
        if (result.length > 0) {
            CHART_CACHE.set(cacheKey, { data: result, timestamp: Date.now() });
        }
        return result;
    } catch (error) {
        if (axios.isCancel(error)) throw error;
        console.warn('Yahoo Finance chart failed:', error);
    }

    return [];
}

// ===== GET HISTORICAL DATA =====
export async function getHistoricalData(
    symbol: string,
    outputSize: 'compact' | 'full' = 'compact',
    signal?: AbortSignal
): Promise<HistoricalDataPoint[]> {
    if (!isApiEnabled()) {
        return [];
    }

    await waitForAlphaVantageRateLimit();

    try {
        const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
            params: {
                function: 'TIME_SERIES_DAILY',
                symbol: symbol,
                outputsize: outputSize,
                apikey: ALPHA_VANTAGE_API_KEY,
            },
            timeout: 10000,
            signal,
        });

        // Check for API limit
        if (response.data.Note || response.data['Error Message']) {
            throw new Error('API limit reached');
        }

        const timeSeries = response.data['Time Series (Daily)'];
        if (!timeSeries) {
            return [];
        }

        return Object.entries(timeSeries).map(([date, data]: [string, unknown]) => {
            const values = data as Record<string, string>;
            return {
                date,
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseInt(values['5. volume']),
            };
        }).reverse();
    } catch (error) {
        console.error('Error getting historical data:', error);
        return [];
    }
}

// ===== BATCH UPDATE PRICES =====
export async function updateAssetPrices(
    assets: { symbol: string }[]
): Promise<Map<string, { price: number; previousClose: number }>> {
    const prices = new Map<string, { price: number; previousClose: number }>();
    if (assets.length === 0) return prices;
    if (!isApiEnabled()) return prices;

    const uniqueSymbols = Array.from(new Set(assets.map(a => a.symbol)));

    // Try batch first (best for performance)
    if (getYahooFinanceFailures() < MAX_FAILURES_BEFORE_SWITCH) {
        try {
            const quotes = await getQuotesYahooBatch(uniqueSymbols);
            quotes.forEach(q => {
                prices.set(q.symbol, { price: q.price, previousClose: q.previousClose });
                // Also update cache
                QUOTE_CACHE.set(q.symbol, { data: q, timestamp: Date.now() });
            });
            resetYahooFinanceFailures();

            console.log(`[Batch Update] Succeeded for ${prices.size}/${uniqueSymbols.length} symbols`);
        } catch (error) {
            console.warn('Batch price update failed:', error);
            incrementYahooFinanceFailures();
        }
    }

    // Fallback for missing symbols
    const remainingSymbols = uniqueSymbols.filter(s => !prices.has(s));
    if (remainingSymbols.length > 0) {
        console.log(`[Batch Update] Falling back for ${remainingSymbols.length} symbols`);
        for (const symbol of remainingSymbols) {
            const quote = await getQuote(symbol);
            if (quote) {
                prices.set(symbol, { price: quote.price, previousClose: quote.previousClose });
            }
        }
    }

    return prices;
}

// ===== HELPER FUNCTIONS =====
function mapAssetType(type: string): AssetType {
    const typeMap: Record<string, AssetType> = {
        'Equity': 'stock',
        'ETF': 'etf',
        'Mutual Fund': 'fund',
        'Cryptocurrency': 'crypto',
    };
    return typeMap[type] || 'stock';
}

function mapFinnhubType(type: string): AssetType {
    const typeMap: Record<string, AssetType> = {
        'Common Stock': 'stock',
        'ETP': 'etf',
        'ETF': 'etf',
        'REIT': 'stock',
        'ADR': 'stock',
        'Crypto': 'crypto',
    };
    return typeMap[type] || 'stock';
}

function mapYahooType(type: string): AssetType {
    const typeMap: Record<string, AssetType> = {
        'EQUITY': 'stock',
        'ETF': 'etf',
        'MUTUALFUND': 'fund',
        'CURRENCY': 'crypto',
        'CRYPTOCURRENCY': 'crypto',
        'INDEX': 'stock',
    };
    return typeMap[type] || 'stock';
}



// ===== API STATUS =====
export function getApiStatus(): { alphaVantage: boolean; finnhub: boolean } {
    return {
        alphaVantage: getAlphaVantageFailures() < MAX_FAILURES_BEFORE_SWITCH,
        finnhub: true, // Finnhub is always available as fallback
    };
}

export { getFinnhubApiKey, setFinnhubApiKey };
