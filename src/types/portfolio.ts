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
