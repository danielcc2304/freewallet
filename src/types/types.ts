// ===== ASSET TYPES =====
export type AssetType = 'stock' | 'etf' | 'fund' | 'crypto';

export interface AssetHolding {
    symbol: string;
    name: string;
    percentage: number;
    sector?: string;
}

export interface Asset {
    id: string;
    symbol: string;
    name: string;
    type: AssetType;
    purchasePrice: number;
    purchaseDate: string;
    quantity: number;
    currentPrice?: number;
    previousClose?: number;
    currency?: string;
    holdings?: AssetHolding[];
    isin?: string;
}

// ===== PORTFOLIO TYPES =====
export interface PortfolioMetrics {
    totalInvested: number;
    currentValue: number;
    totalGain: number;
    percentageGain: number;
    dailyChange: number;
    dailyChangePercent: number;
    monthlyChange: number;
    monthlyChangePercent: number;
    threeMonthChange: number;
    threeMonthChangePercent: number;
    ytdChange: number;
    ytdChangePercent: number;
}

export interface PortfolioHistoryPoint {
    date: string;
    value: number;
    invested: number;
}

export interface Portfolio {
    assets: Asset[];
    metrics: PortfolioMetrics;
    history: PortfolioHistoryPoint[];
    lastUpdated: string;
}

// ===== CHART DATA TYPES =====
export type TimePeriod = '1D' | '7D' | '1M' | '3M' | 'YTD' | 'ALL';

export interface ChartDataPoint {
    date: string;
    value: number;
    invested: number;
    label?: string;
}

// ===== API TYPES =====
export interface StockQuote {
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
}

export interface SearchResult {
    symbol: string;
    name: string;
    type: AssetType;
    region: string;
    currency: string;
}

export interface HistoricalDataPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// ===== FORM TYPES =====
export interface AddInvestmentForm {
    symbol: string;
    name: string;
    type: AssetType;
    purchasePrice: number;
    purchaseDate: string;
    quantity: number;
    isin?: string;
}

// ===== UI TYPES =====
export interface PerformerData {
    id: string;
    symbol: string;
    name: string;
    change: number;
    changePercent: number;
    value: number;
}

export interface HeatmapItem {
    id: string;
    symbol: string;
    name: string;
    value: number;
    weight: number;
    change: number;
    changePercent: number;
    children?: HeatmapItem[];
}

export interface CompositionItem {
    id: string;
    symbol: string;
    name: string;
    value: number;
    percentage: number;
    color: string;
}
