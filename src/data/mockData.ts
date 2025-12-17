import type { Asset, PortfolioHistoryPoint, ChartDataPoint } from '../types/types';

// ===== DEMO ASSETS =====
export const mockAssets: Asset[] = [
    {
        id: '1',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: 'stock',
        purchasePrice: 150.00,
        purchaseDate: '2023-06-15',
        quantity: 10,
        currentPrice: 178.50,
        previousClose: 176.80,
        currency: 'USD',
    },
    {
        id: '2',
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        type: 'stock',
        purchasePrice: 320.00,
        purchaseDate: '2023-04-20',
        quantity: 5,
        currentPrice: 378.25,
        previousClose: 375.10,
        currency: 'USD',
    },
    {
        id: '3',
        symbol: 'VOO',
        name: 'Vanguard S&P 500 ETF',
        type: 'etf',
        purchasePrice: 380.00,
        purchaseDate: '2023-01-10',
        quantity: 8,
        currentPrice: 432.15,
        previousClose: 430.50,
        currency: 'USD',
        holdings: [
            { symbol: 'AAPL', name: 'Apple Inc.', percentage: 7.2, sector: 'Technology' },
            { symbol: 'MSFT', name: 'Microsoft Corp.', percentage: 6.8, sector: 'Technology' },
            { symbol: 'AMZN', name: 'Amazon.com Inc.', percentage: 3.4, sector: 'Consumer' },
            { symbol: 'NVDA', name: 'NVIDIA Corp.', percentage: 3.1, sector: 'Technology' },
            { symbol: 'GOOGL', name: 'Alphabet Inc.', percentage: 2.1, sector: 'Communication' },
            { symbol: 'BRK.B', name: 'Berkshire Hathaway', percentage: 1.8, sector: 'Financial' },
            { symbol: 'META', name: 'Meta Platforms', percentage: 1.7, sector: 'Communication' },
            { symbol: 'UNH', name: 'UnitedHealth Group', percentage: 1.3, sector: 'Healthcare' },
            { symbol: 'JNJ', name: 'Johnson & Johnson', percentage: 1.2, sector: 'Healthcare' },
            { symbol: 'OTHER', name: 'Otros', percentage: 71.4, sector: 'Diversos' },
        ],
    },
    {
        id: '4',
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        type: 'stock',
        purchasePrice: 280.00,
        purchaseDate: '2023-08-01',
        quantity: 4,
        currentPrice: 495.20,
        previousClose: 488.50,
        currency: 'USD',
    },
    {
        id: '5',
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        type: 'stock',
        purchasePrice: 125.00,
        purchaseDate: '2023-03-10',
        quantity: 12,
        currentPrice: 141.80,
        previousClose: 143.20,
        currency: 'USD',
    },
    {
        id: '6',
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        type: 'stock',
        purchasePrice: 145.00,
        purchaseDate: '2023-07-05',
        quantity: 8,
        currentPrice: 153.40,
        previousClose: 152.80,
        currency: 'USD',
    },
];

// ===== GENERATE PORTFOLIO HISTORY =====
export function generateMockHistory(days: number = 365): PortfolioHistoryPoint[] {
    const history: PortfolioHistoryPoint[] = [];
    const today = new Date();

    let invested = 5000;
    let value = 5000;

    for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Simulate deposits
        if (i % 30 === 0 && i > 0) {
            invested += Math.random() * 500 + 200;
        }

        // Simulate market movement
        const dailyChange = (Math.random() - 0.47) * 0.02;
        value = value * (1 + dailyChange) + (invested > value ? (invested - value) * 0.1 : 0);
        value = Math.max(value, invested * 0.7);

        history.push({
            date: date.toISOString().split('T')[0],
            value: Math.round(value * 100) / 100,
            invested: Math.round(invested * 100) / 100,
        });
    }

    return history;
}

// ===== CHART DATA HELPERS =====
export function filterHistoryByPeriod(
    history: PortfolioHistoryPoint[],
    period: string
): ChartDataPoint[] {
    const now = new Date();
    let startDate: Date;

    switch (period) {
        case '1D':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 1);
            break;
        case '7D':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case '1M':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
        case '3M':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 3);
            break;
        case 'YTD':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'ALL':
        default:
            startDate = new Date(0);
    }

    return history
        .filter(point => new Date(point.date) >= startDate)
        .map(point => ({
            date: point.date,
            value: point.value,
            invested: point.invested,
            label: formatDateLabel(point.date, period),
        }));
}

function formatDateLabel(dateStr: string, period: string): string {
    const date = new Date(dateStr);

    if (period === '1D') {
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (period === '7D' || period === '1M') {
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } else {
        return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    }
}

// ===== COLOR PALETTE FOR CHARTS =====
export const chartColors = [
    '#10b981', // Green
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#84cc16', // Lime
    '#f97316', // Orange
    '#6366f1', // Indigo
];

export function getColorForIndex(index: number): string {
    return chartColors[index % chartColors.length];
}
