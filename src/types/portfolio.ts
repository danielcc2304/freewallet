import type { Asset } from './asset';

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

export type PortfolioTransactionType = 'buy' | 'edit' | 'delete';

export interface PortfolioTransaction {
    id: string;
    assetId: string;
    assetSymbol: string;
    assetName: string;
    assetType: Asset['type'];
    type: PortfolioTransactionType;
    date: string;
    quantity?: number;
    price?: number;
    total?: number;
    notes?: string;
    createdAt: string;
}

export type PortfolioGoalCategory = 'retirement' | 'home' | 'emergency' | 'education' | 'other';

export interface PortfolioGoal {
    id: string;
    title: string;
    category: PortfolioGoalCategory;
    targetAmount: number;
    currentAmount: number;
    targetDate?: string;
    notes?: string;
    createdAt: string;
}

export interface WatchlistItem {
    id: string;
    symbol: string;
    name: string;
    assetType: Asset['type'];
    targetPrice?: number;
    notes?: string;
    createdAt: string;
}

export interface Portfolio {
    assets: Asset[];
    metrics: PortfolioMetrics;
    history: PortfolioHistoryPoint[];
    lastUpdated: string;
}

export type TimePeriod = '1D' | '7D' | '1M' | '3M' | 'YTD' | 'ALL';

export interface ChartDataPoint {
    date: string;
    value: number;
    invested: number;
    label?: string;
}
