import type { AssetType } from './asset';

export interface StockQuote {
    quotedAt?: string;
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    previousClose: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    marketCap?: number;
    currency?: string;
    // Fundamentals
    pe?: number;
    forwardPe?: number;
    ps?: number;
    pb?: number;
    dividendYield?: number;
    dividendRate?: number;
    eps?: number;
    beta?: number;
    ebitda?: number;
    evToEbitda?: number;
    revenueGrowth?: number;
    profitMargin?: number;
    roe?: number;
    debtToEquity?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    averageVolume?: number;
}

export interface SearchResult {
    symbol: string;
    name: string;
    type: AssetType;
    region: string;
    currency: string;
}

export interface HistoricalDataPoint {
    currency?: string;
    date: string;
    /** Source timestamp in milliseconds. The display date may be time-only for 1D charts. */
    timestamp?: number;
    /** Close immediately before the requested Yahoo range, when provided. */
    previousClose?: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface AddInvestmentForm {
    symbol: string;
    name: string;
    type: AssetType;
    purchasePrice: number;
    purchaseDate: string;
    quantity: number;
    isin?: string;
}
