import type { Asset, Portfolio, PortfolioHistoryPoint } from '../types/types';

const STORAGE_KEYS = {
    ASSETS: 'freewallet_assets',
    HISTORY: 'freewallet_history',
    SETTINGS: 'freewallet_settings',
} as const;

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
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
}
