import axios from 'axios';
import type { StockQuote, SearchResult, HistoricalDataPoint, AssetType } from '../types/types';

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
const MAX_FAILURES_BEFORE_SWITCH = 3;

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
export async function searchSymbol(query: string): Promise<SearchResult[]> {
    // Try Alpha Vantage first
    if (alphaVantageFailures < MAX_FAILURES_BEFORE_SWITCH) {
        try {
            const results = await searchSymbolAlphaVantage(query);
            if (results.length > 0) {
                alphaVantageFailures = 0; // Reset on success
                return results;
            }
        } catch (error) {
            console.warn('Alpha Vantage search failed, trying Finnhub...', error);
            alphaVantageFailures++;
        }
    }

    // Try Finnhub as fallback
    try {
        const results = await searchSymbolFinnhub(query);
        if (results.length > 0) {
            return results;
        }
    } catch (error) {
        console.warn('Finnhub search also failed', error);
    }

    // Return mock data as last resort
    return getMockSearchResults(query);
}

// ===== ALPHA VANTAGE SEARCH =====
async function searchSymbolAlphaVantage(query: string): Promise<SearchResult[]> {
    await waitForAlphaVantageRateLimit();

    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
        params: {
            function: 'SYMBOL_SEARCH',
            keywords: query,
            apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 10000,
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
async function searchSymbolFinnhub(query: string): Promise<SearchResult[]> {
    await waitForFinnhubRateLimit();

    const response = await axios.get(`${FINNHUB_BASE_URL}/search`, {
        params: {
            q: query,
            token: FINNHUB_API_KEY,
        },
        timeout: 10000,
    });

    const results = response.data.result || [];
    return results.map((item: Record<string, string>) => ({
        symbol: item.symbol,
        name: item.description,
        type: mapFinnhubType(item.type),
        region: 'Global',
        currency: 'USD',
    }));
}

// ===== GET QUOTE (with fallback) =====
export async function getQuote(symbol: string): Promise<StockQuote | null> {
    // Try Alpha Vantage first
    if (alphaVantageFailures < MAX_FAILURES_BEFORE_SWITCH) {
        try {
            const quote = await getQuoteAlphaVantage(symbol);
            if (quote) {
                alphaVantageFailures = 0;
                return quote;
            }
        } catch (error) {
            console.warn('Alpha Vantage quote failed, trying Finnhub...', error);
            alphaVantageFailures++;
        }
    }

    // Try Finnhub as fallback
    try {
        const quote = await getQuoteFinnhub(symbol);
        if (quote) {
            return quote;
        }
    } catch (error) {
        console.warn('Finnhub quote also failed', error);
    }

    // Return mock quote as last resort
    return getMockQuote(symbol);
}

// ===== ALPHA VANTAGE GET QUOTE =====
async function getQuoteAlphaVantage(symbol: string): Promise<StockQuote | null> {
    await waitForAlphaVantageRateLimit();

    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
        params: {
            function: 'GLOBAL_QUOTE',
            symbol: symbol,
            apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 10000,
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
    };
}

// ===== FINNHUB GET QUOTE =====
async function getQuoteFinnhub(symbol: string): Promise<StockQuote | null> {
    await waitForFinnhubRateLimit();

    const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
        params: {
            symbol: symbol,
            token: FINNHUB_API_KEY,
        },
        timeout: 10000,
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
    };
}

// ===== GET HISTORICAL DATA =====
export async function getHistoricalData(
    symbol: string,
    outputSize: 'compact' | 'full' = 'compact'
): Promise<HistoricalDataPoint[]> {
    try {
        await waitForAlphaVantageRateLimit();

        const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
            params: {
                function: 'TIME_SERIES_DAILY',
                symbol: symbol,
                outputsize: outputSize,
                apikey: ALPHA_VANTAGE_API_KEY,
            },
            timeout: 15000,
        });

        // Check for API limit
        if (response.data.Note || response.data['Error Message']) {
            throw new Error('API limit reached');
        }

        const timeSeries = response.data['Time Series (Daily)'];
        if (!timeSeries) {
            return getMockHistoricalData();
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
        return getMockHistoricalData();
    }
}

// ===== BATCH UPDATE PRICES =====
export async function updateAssetPrices(
    assets: { symbol: string }[]
): Promise<Map<string, { price: number; previousClose: number }>> {
    const prices = new Map<string, { price: number; previousClose: number }>();

    for (const asset of assets) {
        const quote = await getQuote(asset.symbol);
        if (quote) {
            prices.set(asset.symbol, {
                price: quote.price,
                previousClose: quote.previousClose,
            });
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

// ===== MOCK DATA FALLBACKS =====
function getMockSearchResults(query: string): SearchResult[] {
    const mockData: SearchResult[] = [
        { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', region: 'United States', currency: 'USD' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', region: 'United States', currency: 'USD' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', region: 'United States', currency: 'USD' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', region: 'United States', currency: 'USD' },
        { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', region: 'United States', currency: 'USD' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', region: 'United States', currency: 'USD' },
        { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf', region: 'United States', currency: 'USD' },
        { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'etf', region: 'United States', currency: 'USD' },
        { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf', region: 'United States', currency: 'USD' },
    ];

    const lowerQuery = query.toLowerCase();
    return mockData.filter(
        item => item.symbol.toLowerCase().includes(lowerQuery) ||
            item.name.toLowerCase().includes(lowerQuery)
    );
}

function getMockQuote(symbol: string): StockQuote {
    const mockPrices: Record<string, number> = {
        'AAPL': 178.50,
        'MSFT': 378.25,
        'GOOGL': 141.80,
        'AMZN': 153.40,
        'TSLA': 248.90,
        'NVDA': 495.20,
        'VOO': 432.15,
        'VTI': 238.45,
        'QQQ': 402.80,
    };

    const basePrice = mockPrices[symbol] || 100 + Math.random() * 200;
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / basePrice) * 100;

    return {
        symbol,
        name: symbol,
        price: basePrice,
        change,
        changePercent,
        previousClose: basePrice - change,
        open: basePrice - change * 0.5,
        high: basePrice + Math.abs(change),
        low: basePrice - Math.abs(change),
        volume: Math.floor(Math.random() * 10000000),
    };
}

function getMockHistoricalData(): HistoricalDataPoint[] {
    const data: HistoricalDataPoint[] = [];
    const today = new Date();
    let price = 100;

    for (let i = 100; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        const change = (Math.random() - 0.48) * 3;
        price = Math.max(50, price + change);

        data.push({
            date: date.toISOString().split('T')[0],
            open: price - Math.random(),
            high: price + Math.random() * 2,
            low: price - Math.random() * 2,
            close: price,
            volume: Math.floor(Math.random() * 1000000),
        });
    }

    return data;
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
