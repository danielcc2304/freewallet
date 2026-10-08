import { portfolioStorage } from './portfolioCloudStorage';
import type { Asset, Portfolio, PortfolioGoal, PortfolioHistoryPoint, PortfolioTransaction, WatchlistItem } from '../types/types';
import { calculatePortfolioResults } from './portfolioResults';
import { calculatePreviousClosePerformance, normalizePortfolioTransactions, performanceSeries, selectPortfolioPeriod } from './portfolioPerformance';

const STORAGE_KEYS = {
    PORTFOLIO: 'freewallet_portfolio_v1',
    ASSETS: 'freewallet_assets',
    HISTORY: 'freewallet_history',
    TRANSACTIONS: 'freewallet_transactions',
    GOALS: 'freewallet_goals',
    WATCHLIST: 'freewallet_watchlist',
    SETTINGS: 'freewallet_settings',
} as const;

export interface AppSettings {
    apiEnabled: boolean;
    allocationBlocks?: { lookThrough: boolean; categories: Record<string, string> };
    /** Explicit quote-market choices; positions and their trade ledger stay unchanged. */
    stockQuoteMarkets?: Record<string, string>;
    discardedPositionRecords?: import('./portfolioResults').DiscardedPositionRecord[];
}

const DEFAULT_SETTINGS: AppSettings = {
    apiEnabled: true,
};

/** One atomic localStorage record for positions and their ledger. Legacy keys remain readable. */
export function savePortfolioState(assets: Asset[], transactions: PortfolioTransaction[]): void {
    try {
        portfolioStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify({ version: 1, assets, transactions }));
    } catch {
        throw new Error('No se han podido guardar los cambios. Comprueba el espacio y los permisos del navegador y vuelve a intentarlo.');
    }
}

/** Operations are only acknowledged after the atomic cloud command succeeds. */
export async function commitPortfolioState(assets:Asset[],transactions:PortfolioTransaction[]):Promise<void> {
    const epoch=portfolioStorage.epoch;
    if(portfolioStorage.cloud) await portfolioStorage.flush();
    if(epoch!==portfolioStorage.epoch)throw new Error('La sesión ha cambiado; no se han enviado los datos de esta cartera.');
    savePortfolioState(assets,transactions);
    await portfolioStorage.flush();
    if(epoch!==portfolioStorage.epoch)throw new Error('La sesión ha cambiado; no se ha aplicado el resultado en esta cuenta.');
}

function readPortfolioState(): { assets: Asset[]; transactions: PortfolioTransaction[] } | null {
    const raw = portfolioStorage.getItem(STORAGE_KEYS.PORTFOLIO);
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (state.version !== 1 || !Array.isArray(state.assets) || !Array.isArray(state.transactions)) {
        throw new Error('El archivo local de cartera no es válido.');
    }
    return state;
}

// ===== ASSETS CRUD =====
export function getAssets(): Asset[] {
    try {
        const saved = readPortfolioState();
        if (saved) return saved.assets;
        const data = portfolioStorage.getItem(STORAGE_KEYS.ASSETS);
        return data ? JSON.parse(data) : [];
    } catch {
        throw new Error('No se puede leer la cartera guardada. No se han sobrescrito los datos.');
    }
}

export function saveAssets(assets: Asset[]): void {
    savePortfolioState(assets, getTransactions());
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

export function updateAssets(updates: Array<{ id: string; updates: Partial<Asset> }>): void {
    if (updates.length === 0) return;
    const assets = getAssets();
    const updatesById = new Map(updates.map(({ id, updates: assetUpdates }) => [id, assetUpdates]));
    const nextAssets = assets.map((asset) => {
        const assetUpdates = updatesById.get(asset.id);
        return assetUpdates ? { ...asset, ...assetUpdates } : asset;
    });
    saveAssets(nextAssets);
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
        const data = portfolioStorage.getItem(STORAGE_KEYS.HISTORY);
        const parsed: unknown = data ? JSON.parse(data) : [];
        return Array.isArray(parsed) ? parsed.filter(p => p && typeof p.date === 'string' && Number.isFinite(p.value) && Number.isFinite(p.invested)) : [];
    } catch {
        console.error('Error reading history from localStorage');
        return [];
    }
}

// ===== SETTINGS =====
export function getSettings(): AppSettings {
    try {
        const data = portfolioStorage.getItem(STORAGE_KEYS.SETTINGS);
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

export function getConfirmedRecordCorrections():NonNullable<AppSettings['discardedPositionRecords']> {
    try {const settings=JSON.parse(portfolioStorage.getConfirmedItem(STORAGE_KEYS.SETTINGS) || '{}');return Array.isArray(settings.discardedPositionRecords) ? settings.discardedPositionRecords : [];}
    catch {return [];}
}

function buildBootstrapTransactions(assets: Asset[]): PortfolioTransaction[] {
    return assets
        .map((asset) => ({
            provenance: 'initial-position' as const, id: `bootstrap-${asset.id}`,
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
        const saved = readPortfolioState();
        if (saved) return saved.transactions;
        const data = portfolioStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (data) {
            return JSON.parse(data) as PortfolioTransaction[];
        }

        const assets = getAssets();
        if (assets.length === 0) {
            return [];
        }

        const bootstrapTransactions = buildBootstrapTransactions(assets);
        return bootstrapTransactions;
    } catch {
        throw new Error('No se pueden leer las operaciones guardadas. No se han sobrescrito los datos.');
    }
}

export function saveTransactions(transactions: PortfolioTransaction[]): void {
    savePortfolioState(getAssets(), transactions);
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
        const data = portfolioStorage.getItem(STORAGE_KEYS.GOALS);
        return data ? JSON.parse(data) as PortfolioGoal[] : [];
    } catch {
        console.error('Error reading goals from localStorage');
        return [];
    }
}

export function saveGoals(goals: PortfolioGoal[]): void {
    try {
        portfolioStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (error) {
        throw new Error('No se han podido guardar los objetivos. Revisa la conexión y el estado de Mi cuenta.',{cause:error});
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
        const data = portfolioStorage.getItem(STORAGE_KEYS.WATCHLIST);
        return data ? JSON.parse(data) as WatchlistItem[] : [];
    } catch {
        console.error('Error reading watchlist from localStorage');
        return [];
    }
}

export function saveWatchlist(items: WatchlistItem[]): void {
    try {
        portfolioStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(items));
    } catch (error) {
        throw new Error('No se ha podido guardar la lista de seguimiento. Revisa la conexión y Mi cuenta.',{cause:error});
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
        portfolioStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('freewallet-data-change'));
    } catch (error) {
        throw new Error('No se ha podido guardar la configuración. Revisa la conexión y Mi cuenta.',{cause:error});
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
        portfolioStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('freewallet-data-change'));
    } catch (error) {
        throw new Error('No se ha podido guardar el histórico de la cartera.', { cause: error });
    }
}

export function addHistoryPoint(point: PortfolioHistoryPoint): void {
    const history = getHistory();
    history.push(point);
    const now = Date.now();
    const recentCutoff = now - 7 * 24 * 60 * 60 * 1000;
    // Keep enough history for the Portfolio workbook's multi-year metrics.
    // Older observations are compacted hourly below seven days and retained
    // for five years instead of silently dropping the periods used by CAGR,
    // Sharpe and drawdown calculations.
    const oldestCutoff = now - 5 * 365 * 24 * 60 * 60 * 1000;
    const hourly = new Map<string, PortfolioHistoryPoint>();
    const daily = new Map<string, PortfolioHistoryPoint>();
    const recent: PortfolioHistoryPoint[] = [];

    for (const item of history) {
        const timestamp = new Date(item.date).getTime();
        if (!Number.isFinite(timestamp) || timestamp < oldestCutoff) continue;
        if (timestamp >= recentCutoff) {
            recent.push(item);
        } else if (timestamp < now - 30 * 86400000) {
            const dayKey = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date(timestamp));
            const previous = daily.get(dayKey);
            if (!previous || Date.parse(previous.date) < timestamp) daily.set(dayKey, item);
        } else {
            const date = new Date(timestamp);
            const hourKey = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}`;
            hourly.set(hourKey, item);
        }
    }

    // Minute data for 7 days, hourly for 30 days and daily for five years.
    saveHistory([...daily.values(), ...hourly.values(), ...recent].sort((a, b) => Date.parse(a.date) - Date.parse(b.date)));
}

// ===== PORTFOLIO HELPERS =====
export function getPortfolio(): Portfolio {
    const assets = getAssets();
    const history = getHistory();

    const results = calculatePortfolioResults(assets, getTransactions(),Date.now(),getConfirmedRecordCorrections());

    const daily = calculatePreviousClosePerformance(assets);
    const series = performanceSeries(history, normalizePortfolioTransactions(assets, getTransactions()), assets);
    const now = Date.now();
    const month = selectPortfolioPeriod(series, '1M', now).performance;
    const quarter = selectPortfolioPeriod(series, '3M', now).performance;
    const ytd = selectPortfolioPeriod(series, 'YTD', now).performance;

    return {
        assets,
        metrics: {
            ...results,
            dailyChange: daily.change ?? NaN,
            dailyChangePercent: daily.returnPercent ?? NaN,
            monthlyChange: month.returnPercent === null ? NaN : month.change ?? NaN,
            monthlyChangePercent: month.returnPercent ?? NaN,
            threeMonthChange: quarter.returnPercent === null ? NaN : quarter.change ?? NaN,
            threeMonthChangePercent: quarter.returnPercent ?? NaN,
            ytdChange: ytd.returnPercent === null ? NaN : ytd.change ?? NaN,
            ytdChangePercent: ytd.returnPercent ?? NaN,
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
    if(portfolioStorage.cloud) throw new Error('Cierra sesión para gestionar los datos locales. La cartera cloud no se borra desde este botón.');
    portfolioStorage.removeItem(STORAGE_KEYS.PORTFOLIO);
    portfolioStorage.removeItem(STORAGE_KEYS.ASSETS);
    portfolioStorage.removeItem(STORAGE_KEYS.HISTORY);
    portfolioStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    portfolioStorage.removeItem(STORAGE_KEYS.GOALS);
    portfolioStorage.removeItem(STORAGE_KEYS.WATCHLIST);
    portfolioStorage.removeItem(STORAGE_KEYS.SETTINGS);
}
