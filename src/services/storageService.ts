import type { Asset, Portfolio, PortfolioGoal, PortfolioHistoryPoint, PortfolioTransaction, WatchlistItem } from '../types/types';

const STORAGE_KEYS = {
    ASSETS: 'freewallet_assets',
    HISTORY: 'freewallet_history',
    TRANSACTIONS: 'freewallet_transactions',
    GOALS: 'freewallet_goals',
    WATCHLIST: 'freewallet_watchlist',
    SETTINGS: 'freewallet_settings',
} as const;

export interface AppSettings {
    apiEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
    apiEnabled: false,
};

// ===== ASSETS CRUD =====
export function getAssets(): Asset[] {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.ASSETS);
        return data ? JSON.parse(data) : [];
    } catch {
        console.error('Error reading assets from localStorage');
        return [];
    }
}

export function saveAssets(assets: Asset[]): void {
    try {
        localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    } catch (error) {
        console.error('Error saving assets to localStorage:', error);
    }
}

export function addAsset(asset: Asset): void {
    const assets = getAssets();
    assets.push(asset);
    saveAssets(assets);
}

export function updateAsset(id: string, updates: Partial<Asset>): void {
    const assets = getAssets();
    const index = assets.findIndex(a => a.id === id);
    if (index !== -1) {
        assets[index] = { ...assets[index], ...updates };
        saveAssets(assets);
    }
}

export function deleteAsset(id: string): void {
    const assets = getAssets();
    const filtered = assets.filter(a => a.id !== id);
    saveAssets(filtered);
}

export function getAssetById(id: string): Asset | undefined {
    const assets = getAssets();
    return assets.find(a => a.id === id);
}

// ===== HISTORY =====
export function getHistory(): PortfolioHistoryPoint[] {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
        return data ? JSON.parse(data) : [];
    } catch {
        console.error('Error reading history from localStorage');
        return [];
    }
}

// ===== SETTINGS =====
export function getSettings(): AppSettings {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (!data) {
            return DEFAULT_SETTINGS;
        }

        const parsed = JSON.parse(data) as Partial<AppSettings>;
        return {
            ...DEFAULT_SETTINGS,
            ...parsed,
        };
    } catch {
        console.error('Error reading settings from localStorage');
        return DEFAULT_SETTINGS;
    }
}

function buildBootstrapTransactions(assets: Asset[]): PortfolioTransaction[] {
    return assets
        .map((asset) => ({
            id: `bootstrap-${asset.id}`,
            assetId: asset.id,
            assetSymbol: asset.symbol,
            assetName: asset.name,
            assetType: asset.type,
            type: 'buy' as const,
            date: asset.purchaseDate,
            quantity: asset.quantity,
            price: asset.purchasePrice,
            total: asset.purchasePrice * asset.quantity,
            notes: 'Importado desde la posición existente',
            createdAt: asset.purchaseDate,
        }))
        .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ===== TRANSACTIONS =====
export function getTransactions(): PortfolioTransaction[] {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (data) {
            return JSON.parse(data) as PortfolioTransaction[];
        }

        const assets = getAssets();
        if (assets.length === 0) {
            return [];
        }

        const bootstrapTransactions = buildBootstrapTransactions(assets);
        saveTransactions(bootstrapTransactions);
        return bootstrapTransactions;
    } catch {
        console.error('Error reading transactions from localStorage');
        return [];
    }
}

export function saveTransactions(transactions: PortfolioTransaction[]): void {
    try {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
        console.error('Error saving transactions to localStorage:', error);
    }
}

export function addTransaction(transaction: PortfolioTransaction): void {
    const transactions = getTransactions();
    transactions.unshift(transaction);
    saveTransactions(transactions);
}

export function deleteTransactionsByAssetId(assetId: string): void {
    const transactions = getTransactions();
    saveTransactions(transactions.filter((transaction) => transaction.assetId !== assetId));
}

// ===== GOALS =====
export function getGoals(): PortfolioGoal[] {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.GOALS);
        return data ? JSON.parse(data) as PortfolioGoal[] : [];
    } catch {
        console.error('Error reading goals from localStorage');
        return [];
    }
}

export function saveGoals(goals: PortfolioGoal[]): void {
    try {
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (error) {
        console.error('Error saving goals to localStorage:', error);
    }
}

export function addGoal(goal: PortfolioGoal): void {
    const goals = getGoals();
    goals.unshift(goal);
    saveGoals(goals);
}

export function deleteGoal(goalId: string): void {
    const goals = getGoals();
    saveGoals(goals.filter((goal) => goal.id !== goalId));
}

// ===== WATCHLIST =====
export function getWatchlist(): WatchlistItem[] {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
        return data ? JSON.parse(data) as WatchlistItem[] : [];
    } catch {
        console.error('Error reading watchlist from localStorage');
        return [];
    }
}

export function saveWatchlist(items: WatchlistItem[]): void {
    try {
        localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(items));
    } catch (error) {
        console.error('Error saving watchlist to localStorage:', error);
    }
}

export function addWatchlistItem(item: WatchlistItem): void {
    const items = getWatchlist();
    items.unshift(item);
    saveWatchlist(items);
}

export function deleteWatchlistItem(itemId: string): void {
    const items = getWatchlist();
    saveWatchlist(items.filter((item) => item.id !== itemId));
}

export function saveSettings(settings: AppSettings): void {
    try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving settings to localStorage:', error);
    }
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
    const nextSettings = {
        ...getSettings(),
        ...updates,
    };
    saveSettings(nextSettings);
    return nextSettings;
}

export function isApiEnabled(): boolean {
    return getSettings().apiEnabled;
}

export function saveHistory(history: PortfolioHistoryPoint[]): void {
    try {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (error) {
        console.error('Error saving history to localStorage:', error);
    }
}

export function addHistoryPoint(point: PortfolioHistoryPoint): void {
    const history = getHistory();
    history.push(point);
    // Keep only last 365 days of history
    const maxPoints = 365;
    if (history.length > maxPoints) {
        history.splice(0, history.length - maxPoints);
    }
    saveHistory(history);
}

// ===== PORTFOLIO HELPERS =====
export function getPortfolio(): Portfolio {
    const assets = getAssets();
    const history = getHistory();

    const totalInvested = assets.reduce((sum, a) => sum + (a.purchasePrice * a.quantity), 0);
    const currentValue = assets.reduce((sum, a) => sum + ((a.currentPrice || a.purchasePrice) * a.quantity), 0);
    const totalGain = currentValue - totalInvested;
    const percentageGain = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    // Calculate period changes (simplified - in real app would use actual historical data)
    const dailyChange = assets.reduce((sum, a) => {
        const prevValue = (a.previousClose || a.purchasePrice) * a.quantity;
        const currValue = (a.currentPrice || a.purchasePrice) * a.quantity;
        return sum + (currValue - prevValue);
    }, 0);

    return {
        assets,
        metrics: {
            totalInvested,
            currentValue,
            totalGain,
            percentageGain,
            dailyChange,
            dailyChangePercent: currentValue > 0 ? (dailyChange / (currentValue - dailyChange)) * 100 : 0,
            monthlyChange: totalGain * 0.3, // Simplified
            monthlyChangePercent: percentageGain * 0.3,
            threeMonthChange: totalGain * 0.6,
            threeMonthChangePercent: percentageGain * 0.6,
            ytdChange: totalGain,
            ytdChangePercent: percentageGain,
        },
        history,
        lastUpdated: new Date().toISOString(),
    };
}

// ===== UTILITY =====
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.ASSETS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    localStorage.removeItem(STORAGE_KEYS.WATCHLIST);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
}
