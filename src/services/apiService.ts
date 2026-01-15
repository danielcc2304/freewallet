import axios from 'axios';
import type { StockQuote, SearchResult, HistoricalDataPoint, AssetType, TimePeriod } from '../types/types';

// ===== API CONFIGURATION =====
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const ALPHA_VANTAGE_API_KEY = 'OTGRPQ9ZJ1MQSNLZ';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = 'demo'; // User can set their own Finnhub key for additional fallback

// Rate limiting for Alpha Vantage (25 calls/day on free tier = be conservative)
let lastAlphaVantageCall = 0;
const ALPHA_VANTAGE_MIN_INTERVAL = 3000; // 3 seconds between calls

// Rate limiting for Finnhub (60 calls/min on free tier)
let lastFinnhubCall = 0;
const FINNHUB_MIN_INTERVAL = 1000; // 1 second between calls

// Track API failures to switch providers
let alphaVantageFailures = 0;
let yahooFinanceFailures = 0;
const MAX_FAILURES_BEFORE_SWITCH = 3;

// Configure Yahoo Finance
// Note: In browser, direct calls to Yahoo are blocked by CORS.
// We use multiple proxies for fallback
const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v7/finance';
const YAHOO_SEARCH_URL = 'https://query2.finance.yahoo.com/v1/finance/search';

interface ProxyConfig {
    url: string;
    type: 'raw' | 'json';
}

const CORS_PROXIES: ProxyConfig[] = [
    { url: 'https://api.allorigins.win/raw?url=', type: 'raw' },
    { url: 'https://thingproxy.freeboard.io/fetch/', type: 'raw' },
    { url: 'https://api.allorigins.win/get?url=', type: 'json' },
    { url: 'https://corsproxy.org/?url=', type: 'raw' },
    { url: 'https://corsproxy.is/?url=', type: 'raw' },
    { url: 'https://api.codetabs.com/v1/proxy?quest=', type: 'raw' },
];
let currentProxyIndex = 0;

// ===== CACHE CONFIGURATION =====
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}
const QUOTE_CACHE = new Map<string, CacheEntry<StockQuote>>();
const SEARCH_CACHE = new Map<string, CacheEntry<SearchResult[]>>();

// Fix 4: Granular TTLs
const TTL = {
    QUOTE: 60 * 1000,         // 60 seconds
    SEARCH: 10 * 60 * 1000,   // 10 minutes
    FUNDAMENTALS: 6 * 60 * 60 * 1000, // 6 hours
    CHART: 5 * 60 * 1000      // 5 minutes
};

// ===== HELPER FUNCTIONS =====
const PROXY_COOLDOWN = new Map<string, number>();
const COOLDOWN_MS = 30000; // Increased to 30s to be safe

function getNextProxy(): ProxyConfig {
    const now = Date.now();
    for (let i = 0; i < CORS_PROXIES.length; i++) {
        const index = (currentProxyIndex + i) % CORS_PROXIES.length;
        const proxy = CORS_PROXIES[index];
        const cooldownUntil = PROXY_COOLDOWN.get(proxy.url) || 0;

        if (now > cooldownUntil) {
            currentProxyIndex = (index + 1) % CORS_PROXIES.length;
            return proxy;
        }
    }
    const proxy = CORS_PROXIES[currentProxyIndex];
    currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
    return proxy;
}

// Fix 5: Smart markProxyFailure
function markProxyFailure(proxyUrl: string, err?: any) {
    // Ignore AbortError (user cancelled)
    if (axios.isCancel(err) || err?.name === 'AbortError') return;

    // Penalize only specific errors
    const status = err?.response?.status;
    const isNetworkError = !status && err?.code; // e.g. ECONNABORTED
    const isRateLimit = status === 429;
    const isServerError = status >= 500;

    if (isNetworkError || isRateLimit || isServerError) {
        console.warn(`[Proxy] Penalty for ${proxyUrl}:`, err?.message || status);
        PROXY_COOLDOWN.set(proxyUrl, Date.now() + COOLDOWN_MS);
    }
}

function looksLikeISIN(q: string): boolean {
    return /^[A-Z]{2}[A-Z0-9]{10}$/.test(q.trim().toUpperCase());
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


function buildProxyUrl(proxyConfig: ProxyConfig, url: string, forceRefresh = false): string {
    const { url: proxyBase } = proxyConfig;

    // Only add cache buster if explicitly requested (retries)
    let targetUrl = url;
    if (forceRefresh) {
        const cacheBuster = `&_cb=${Date.now()}`;
        targetUrl = url + (url.includes('?') ? cacheBuster : `?${cacheBuster.substring(1)}`);
    }

    const encodedUrl = encodeURIComponent(targetUrl);

    if (proxyBase.includes('allorigins') || proxyBase.includes('codetabs')) {
        return `${proxyBase}${encodedUrl}`;
    }
    if (proxyBase.includes('?') && !proxyBase.endsWith('=')) {
        return `${proxyBase}${targetUrl}`;
    }
    if (proxyBase.endsWith('url=')) {
        return `${proxyBase}${encodedUrl}`;
    }
    return `${proxyBase}${targetUrl}`;
}

async function fetchFromProxy(proxyConfig: ProxyConfig, url: string, signal?: AbortSignal, forceRefresh = false) {
    const proxyUrl = buildProxyUrl(proxyConfig, url, forceRefresh);
    const response = await axios.get(proxyUrl, { timeout: 10000, signal });

    if (proxyConfig.type === 'json') {
        const data = response.data;
        if (data && data.contents !== undefined) {
            if (typeof data.contents === 'string') {
                try {
                    // Try to parse if it looks like JSON
                    if (data.contents.trim().startsWith('{') || data.contents.trim().startsWith('[')) {
                        return JSON.parse(data.contents);
                    }
                    return data.contents;
                } catch (e) {
                    return data.contents;
                }
            }
            return data.contents;
        }
    }
    return response.data;
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

async function waitForAlphaVantageRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - lastAlphaVantageCall;
    if (elapsed < ALPHA_VANTAGE_MIN_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, ALPHA_VANTAGE_MIN_INTERVAL - elapsed));
    }
    lastAlphaVantageCall = Date.now();
}

async function waitForFinnhubRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - lastFinnhubCall;
    if (elapsed < FINNHUB_MIN_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, FINNHUB_MIN_INTERVAL - elapsed));
    }
    lastFinnhubCall = Date.now();
}

// ===== SEARCH SYMBOLS (with fallback) =====
export async function searchSymbol(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
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
    if (yahooFinanceFailures < MAX_FAILURES_BEFORE_SWITCH) {
        try {
            const results = await searchSymbolYahoo(q, signal);
            results.forEach(res => addUniqueResult(allResults, seenSymbols, res));
            yahooFinanceFailures = 0;
        } catch (error) {
            if (axios.isCancel(error)) throw error;
            console.warn('Yahoo Finance search failed:', error);
            yahooFinanceFailures++;
        }
    }

    // 2) Alpha Vantage... (omitir detalles por brevedad, asumiendo mismos cambios)
    // En las siguientes funciones async, pasar el signal a axios.get(..., { signal })

    // 2) Alpha Vantage (si falta chicha)
    if (allResults.length < 8 && alphaVantageFailures < MAX_FAILURES_BEFORE_SWITCH) {
        try {
            const results = await searchSymbolAlphaVantage(q);
            results.forEach(res => addUniqueResult(allResults, seenSymbols, res));
            alphaVantageFailures = 0;
        } catch (error) {
            console.warn('Alpha Vantage search failed:', error);
            alphaVantageFailures++;
        }
    }

    // 3) Finnhub (fallback)
    if (allResults.length < 5) {
        try {
            const results = await searchSymbolFinnhub(q);
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
            } catch { }
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

    for (let attempt = 0; attempt < CORS_PROXIES.length; attempt++) {
        const proxy = getNextProxy();
        try {
            // Fix 2: Conditional cache busting
            const forceRefresh = attempt > 0;
            const data = await fetchFromProxy(proxy, url, signal, forceRefresh);
            const quotes = data?.quotes || [];

            console.log(`[Yahoo API] Search for "${q}" returned ${quotes.length} results via Proxy ${attempt + 1}`);

            // Mapping
            const mapped: SearchResult[] = quotes.map((item: any) => ({
                symbol: item.symbol,
                name: item.shortname || item.longname || item.symbol,
                type: mapYahooType(item.quoteType),
                region: item.region || 'Global',
                currency: item.currency || 'Unknown',
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

            const sorted = mapped.sort((a, b) => getScore(b) - getScore(a));

            SEARCH_CACHE.set(q, { data: sorted, timestamp: Date.now() });
            return sorted;
        } catch (error) {
            if (axios.isCancel(error)) throw error;
            markProxyFailure(proxy.url, error);
            console.warn(`Yahoo Finance search failed with proxy ${attempt + 1}:`, error);
        }
    }

    return [];
}

// ===== GET QUOTE (with fallback) =====
export async function getQuote(symbol: string, signal?: AbortSignal): Promise<StockQuote | null> {
    // Check cache first
    const cached = QUOTE_CACHE.get(symbol);
    if (cached && Date.now() - cached.timestamp < TTL.QUOTE) {
        console.log(`[Cache Hit] Quote for ${symbol}`);
        return cached.data;
    }

    // Try Yahoo Finance first as it's generally more reliable and has better coverage
    if (yahooFinanceFailures < MAX_FAILURES_BEFORE_SWITCH) {
        try {
            const quote = await getQuoteYahoo(symbol, signal);
            if (quote) {
                yahooFinanceFailures = 0;
                QUOTE_CACHE.set(symbol, { data: quote, timestamp: Date.now() });
                return quote;
            }
        } catch (error) {
            if (axios.isCancel(error)) throw error;
            console.warn('Yahoo Finance quote failed, trying Alpha Vantage...', error);
            yahooFinanceFailures++;
        }
    }

    // Try Alpha Vantage second
    if (alphaVantageFailures < MAX_FAILURES_BEFORE_SWITCH) {
        try {
            const quote = await getQuoteAlphaVantage(symbol, signal);
            if (quote) {
                alphaVantageFailures = 0;
                QUOTE_CACHE.set(symbol, { data: quote, timestamp: Date.now() });
                return quote;
            }
        } catch (error) {
            if (axios.isCancel(error)) throw error;
            console.warn('Alpha Vantage quote failed, trying Finnhub...', error);
            alphaVantageFailures++;
        }
    }

    // Try Finnhub as additional fallback
    try {
        const quote = await getQuoteFinnhub(symbol, signal);
        if (quote) {
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
    const results = await getQuotesYahooBatch([symbol], signal);
    return results.length > 0 ? results[0] : null;
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

        for (let attempt = 0; attempt < CORS_PROXIES.length; attempt++) {
            const proxy = getNextProxy();
            try {
                // Fix 2: Conditional cache busting (only on retries)
                const forceRefresh = attempt > 0;
                const data = await fetchFromProxy(proxy, url, signal, forceRefresh);
                const results = data?.quoteResponse?.result || [];

                console.log(`[Yahoo API] Batch quote for ${chunkSymbols.length} symbols returned ${results.length} results via Proxy ${attempt + 1}`);

                return results.map((result: any) => ({
                    symbol: result.symbol,
                    name: result.longName || result.shortName || result.symbol,
                    price: result.regularMarketPrice || 0,
                    change: result.regularMarketChange || 0,
                    changePercent: result.regularMarketChangePercent || 0,
                    previousClose: result.regularMarketPreviousClose || 0,
                    open: result.regularMarketOpen || 0,
                    high: result.regularMarketDayHigh || 0,
                    low: result.regularMarketDayLow || 0,
                    volume: result.regularMarketVolume || 0,
                    marketCap: result.marketCap,
                    // Fix 1: No fake defaults
                    currency: result.currency || result.financialCurrency || 'Unknown',
                    // Fundamentals from Yahoo
                    pe: result.trailingPE,
                    forwardPe: result.forwardPE,
                    ps: result.priceToSales,
                    pb: result.priceToBook,
                    dividendYield: result.trailingAnnualDividendYield ? result.trailingAnnualDividendYield * 100 : undefined,
                    dividendRate: result.trailingAnnualDividendRate,
                    eps: result.trailingEps,
                    beta: result.beta,
                    fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
                    fiftyTwoWeekLow: result.fiftyTwoWeekLow,
                }));
            } catch (error) {
                if (axios.isCancel(error)) throw error;
                markProxyFailure(proxy.url, error);
                console.warn(`Yahoo Finance batch chunk failed with proxy ${attempt + 1}:`, error);
            }
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

// ===== YAHOO FINANCE GET FUNDAMENTALS =====
export async function getFundamentalData(symbol: string, signal?: AbortSignal): Promise<Partial<StockQuote>> {
    // Strategy: Progressive Enhancement.
    // 1. Always get the "basic" quote first (v7), which we know is reliable (used in "Add Asset").
    // 2. Try to get "advanced" details (v10).
    // 3. Merge them.

    let baseMetrics: Partial<StockQuote> = {};

    try {
        const basicQuote = await getQuoteYahoo(symbol, signal);
        if (basicQuote) {
            baseMetrics = {
                price: basicQuote.price,
                change: basicQuote.change,
                changePercent: basicQuote.changePercent,
                pe: basicQuote.pe,
                forwardPe: basicQuote.forwardPe,
                ps: basicQuote.ps,
                pb: basicQuote.pb,
                dividendYield: basicQuote.dividendYield,
                dividendRate: basicQuote.dividendRate,
                eps: basicQuote.eps,
                beta: basicQuote.beta,
                marketCap: basicQuote.marketCap,
                fiftyTwoWeekHigh: basicQuote.fiftyTwoWeekHigh,
                fiftyTwoWeekLow: basicQuote.fiftyTwoWeekLow,
                averageVolume: basicQuote.averageVolume
            };
        }
    } catch (e) {
        console.warn('Basic quote fetch failed in getFundamentalData', e);
    }

    const v10Url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=defaultKeyStatistics,financialData,summaryDetail`;

    // Try v10 for advanced metrics (EBITDA, Margins, etc.)
    for (let attempt = 0; attempt < CORS_PROXIES.length; attempt++) {
        const proxy = getNextProxy();
        try {
            // Fix 2: Conditional cache busting
            const forceRefresh = attempt > 0;
            const data = await fetchFromProxy(proxy, v10Url, signal, forceRefresh);
            const result = data?.quoteSummary?.result?.[0];

            if (result && Object.keys(result).length > 0) {
                const stats = result.defaultKeyStatistics || {};
                const financialData = result.financialData || {};
                const summaryDetail = result.summaryDetail || {};

                // Merge advanced metrics
                return {
                    ...baseMetrics,
                    // Prefer v10 values if available, otherwise keep v7 or undefined
                    pe: stats.trailingPE?.raw || summaryDetail.trailingPE?.raw || baseMetrics.pe,
                    forwardPe: stats.forwardPE?.raw || summaryDetail.forwardPE?.raw || baseMetrics.forwardPe,
                    ps: stats.priceToSalesTrailing12Months?.raw || summaryDetail.priceToSalesTrailing12Months?.raw || baseMetrics.ps,
                    pb: stats.priceToBook?.raw || summaryDetail.priceToBook?.raw || baseMetrics.pb,
                    dividendYield: summaryDetail.dividendYield?.raw ? summaryDetail.dividendYield.raw * 100 : baseMetrics.dividendYield,
                    dividendRate: summaryDetail.dividendRate?.raw || baseMetrics.dividendRate,
                    eps: stats.trailingEps?.raw || baseMetrics.eps,
                    beta: stats.beta?.raw || baseMetrics.beta,

                    // Advanced metrics ONLY in v10
                    ebitda: financialData.ebitda?.raw,
                    evToEbitda: stats.enterpriseToEbitda?.raw,
                    revenueGrowth: financialData.revenueGrowth?.raw ? financialData.revenueGrowth.raw * 100 : undefined,
                    profitMargin: financialData.profitMargins?.raw ? financialData.profitMargins.raw * 100 : undefined,
                    roe: financialData.returnOnEquity?.raw ? financialData.returnOnEquity.raw * 100 : undefined,
                    debtToEquity: financialData.debtToEquity?.raw,
                };
            }
        } catch (error) {
            if (axios.isCancel(error)) throw error;
            markProxyFailure(proxy.url, error);
        }
    }

    // If v10 failed completely, return whatever we got from v7
    return baseMetrics;
}

// ===== YAHOO FINANCE GET CHART DATA =====
export async function getAssetChartData(
    symbol: string,
    period: TimePeriod = '1M',
    signal?: AbortSignal
): Promise<HistoricalDataPoint[]> {
    let range = '1mo';
    let interval = '1d';

    switch (period) {
        case '1D':
            range = '1d';
            interval = '5m';
            break;
        case '7D':
            range = '7d';
            interval = '30m';
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

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;

    for (let attempt = 0; attempt < CORS_PROXIES.length; attempt++) {
        const proxy = getNextProxy();
        try {
            // Fix 2: Conditional cache busting
            const forceRefresh = attempt > 0;
            const data = await fetchFromProxy(proxy, url, signal, forceRefresh);
            const result = data?.chart?.result?.[0];

            if (!result || !result.timestamp) return [];

            const timestamps = result.timestamp;
            const quotes = result.indicators.quote[0];
            const adjClose = result.indicators.adjclose?.[0].adjclose || quotes.close;

            return timestamps.map((timestamp: number, i: number) => {
                const date = new Date(timestamp * 1000);
                const dateStr = period === '1D'
                    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : date.toISOString().split('T')[0];

                return {
                    date: dateStr,
                    open: quotes.open[i] || 0,
                    high: quotes.high[i] || 0,
                    low: quotes.low[i] || 0,
                    close: adjClose[i] || quotes.close[i] || 0,
                    volume: quotes.volume[i] || 0,
                };
            }).filter((p: any) => p.close > 0);
        } catch (error) {
            if (axios.isCancel(error)) throw error;
            markProxyFailure(proxy.url, error);
            console.warn(`Yahoo Finance chart failed with proxy ${attempt + 1}:`, error);
        }
    }

    return [];
}

// ===== GET HISTORICAL DATA =====
export async function getHistoricalData(
    symbol: string,
    outputSize: 'compact' | 'full' = 'compact',
    signal?: AbortSignal
): Promise<HistoricalDataPoint[]> {
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

    const uniqueSymbols = Array.from(new Set(assets.map(a => a.symbol)));

    // Try batch first (best for performance)
    if (yahooFinanceFailures < MAX_FAILURES_BEFORE_SWITCH) {
        try {
            const quotes = await getQuotesYahooBatch(uniqueSymbols);
            quotes.forEach(q => {
                prices.set(q.symbol, { price: q.price, previousClose: q.previousClose });
                // Also update cache
                QUOTE_CACHE.set(q.symbol, { data: q, timestamp: Date.now() });
            });
            yahooFinanceFailures = 0;

            console.log(`[Batch Update] Succeeded for ${prices.size}/${uniqueSymbols.length} symbols`);
        } catch (error) {
            console.warn('Batch price update failed:', error);
            yahooFinanceFailures++;
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
        alphaVantage: alphaVantageFailures < MAX_FAILURES_BEFORE_SWITCH,
        finnhub: true, // Finnhub is always available as fallback
    };
}

// ===== SET CUSTOM FINNHUB KEY =====
export function setFinnhubApiKey(key: string): void {
    localStorage.setItem('freewallet_finnhub_key', key);
}

export function getFinnhubApiKey(): string {
    return localStorage.getItem('freewallet_finnhub_key') || FINNHUB_API_KEY;
}
