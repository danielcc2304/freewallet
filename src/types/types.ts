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

// ===== ACADEMY TYPES =====
export interface CrisisData {
    year: number;
    name: string;
    maxDrawdown: number;
    monthsDown: number;
    monthsRecovery: number;
    return5y?: number;
    description?: string;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    bias: string;
    explanation: string;
}

export interface TimelinePhase {
    id: string;
    phase: number;
    title: string;
    duration: string;
    objective: string;
    strategy?: string;
    allocation?: {
        conservative: string;
        moderate: string;
        aggressive: string;
    };
    commonError: string;
    checklist?: string[];
}

export interface AssetAllocationConfig {
    stocks: number;
    bonds: number;
    cash: number;
    realEstate: number;
    crypto: number;
}

export interface RiskProfileQuestion {
    id: string;
    question: string;
    options: {
        text: string;
        score: number;
    }[];
}

export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

export interface GlossaryTerm {
    id: string;
    term: string;
    definition: string;
    category?: string;
    relatedTerms?: string[];
}

export interface ScenarioAction {
    icon: string;
    title: string;
    description: string;
    type: 'do' | 'dont';
}

export interface Scenario {
    id: string;
    title: string;
    emoji: string;
    sections: {
        title: string;
        content: string | ScenarioAction[];
    }[];
}
