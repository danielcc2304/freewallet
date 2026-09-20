import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Asset, PortfolioTransaction } from '../types/types';
import { getAssets, getTransactions, savePortfolioState, updateAssets as updateAssetsInStorage, saveHistory, addHistoryPoint, isApiEnabled, generateId } from '../services/storageService';
import { getPortfolioAssetQuote } from '../services/portfolioQuoteService';
import { mockAssets, generateMockHistory } from '../data/mockData';
import { PRICE_REFRESH_INTERVAL_MS } from '../constants/app';
import { createQuoteSnapshot, normalizePortfolioTransactions, portfolioLedgerKey } from '../services/portfolioPerformance';

function getLatestQuoteAt(assets: Asset[]): Date | null {
    const timestamps = assets
        .map((asset) => (asset.lastCheckedAt || asset.lastQuoteAt) ? Date.parse(asset.lastCheckedAt || asset.lastQuoteAt!) : NaN)
        .filter((timestamp) => Number.isFinite(timestamp));
    const latest = timestamps.length === assets.length && timestamps.length ? Math.min(...timestamps) : NaN;
    return Number.isFinite(latest) ? new Date(latest) : null;
}

function shouldRefreshAssets(assets: Asset[]): boolean {
    const latest = getLatestQuoteAt(assets);
    return !latest || Date.now() - latest.getTime() >= PRICE_REFRESH_INTERVAL_MS;
}

// State interface
interface PortfolioState {
    assets: Asset[];
    transactions: PortfolioTransaction[];
    loading: boolean;
    updatingPrices: boolean;
    lastPriceUpdate: Date | null;
    initialized: boolean;
    storageError: string | null;
    quoteFailures: number;
}

// Action types
type PortfolioAction =
    | { type: 'SET_STORAGE_ERROR'; payload: string | null }
    | { type: 'SET_QUOTE_FAILURES'; payload: number }
    | { type: 'SET_ASSETS'; payload: Asset[] }
    | { type: 'SET_TRANSACTIONS'; payload: PortfolioTransaction[] }
    | { type: 'ADD_TRANSACTION'; payload: PortfolioTransaction }
    | { type: 'ADD_ASSET'; payload: Asset }
    | { type: 'UPDATE_ASSET'; payload: { id: string; updates: Partial<Asset> } }
    | { type: 'UPDATE_ASSETS'; payload: Array<{ id: string; updates: Partial<Asset> }> }
    | { type: 'DELETE_ASSET'; payload: string }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_UPDATING_PRICES'; payload: boolean }
    | { type: 'SET_LAST_UPDATE'; payload: Date | null }
    | { type: 'SET_INITIALIZED'; payload: boolean };

// Initial state
const initialState: PortfolioState = {
    assets: [],
    transactions: [],
    loading: true,
    updatingPrices: false,
    lastPriceUpdate: null,
    initialized: false,
    storageError: null,
    quoteFailures: 0,
};

const PRICE_REFRESH_CONCURRENCY = 4;

// Reducer
function portfolioReducer(state: PortfolioState, action: PortfolioAction): PortfolioState {
    switch (action.type) {
        case 'SET_STORAGE_ERROR': return { ...state, storageError: action.payload };
        case 'SET_QUOTE_FAILURES': return { ...state, quoteFailures: action.payload };
        case 'SET_ASSETS':
            return { ...state, assets: action.payload, loading: false };
        case 'SET_TRANSACTIONS':
            return { ...state, transactions: action.payload };
        case 'ADD_TRANSACTION':
            return { ...state, transactions: [action.payload, ...state.transactions] };
        case 'ADD_ASSET':
            return { ...state, assets: [...state.assets, action.payload] };
        case 'UPDATE_ASSET':
            return {
                ...state,
                assets: state.assets.map(asset =>
                    asset.id === action.payload.id
                        ? { ...asset, ...action.payload.updates }
                        : asset
                ),
            };
        case 'UPDATE_ASSETS': {
            const updatesById = new Map(action.payload.map(({ id, updates }) => [id, updates]));
            return {
                ...state,
                assets: state.assets.map(asset => {
                    const updates = updatesById.get(asset.id);
                    return updates ? { ...asset, ...updates } : asset;
                }),
            };
        }
        case 'DELETE_ASSET':
            return {
                ...state,
                assets: state.assets.filter(asset => asset.id !== action.payload),
            };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_UPDATING_PRICES':
            return { ...state, updatingPrices: action.payload };
        case 'SET_LAST_UPDATE':
            return { ...state, lastPriceUpdate: action.payload };
        case 'SET_INITIALIZED':
            return { ...state, initialized: action.payload };
        default:
            return state;
    }
}

// Context interface
interface PortfolioContextValue {
    state: PortfolioState;
    addAsset: (asset: Asset, transaction?: Omit<PortfolioTransaction, 'id' | 'createdAt'>) => void;
    updateAsset: (id: string, updates: Partial<Asset>, transaction?: Omit<PortfolioTransaction, 'id' | 'createdAt'>) => void;
    deleteAsset: (id: string) => void;
    sellAsset: (id: string, quantity: number, price: number, date: string) => void;
    refreshPrices: () => Promise<void>;
    loadDemoData: () => void;
}

// Create context
const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined);

// Provider component
export function PortfolioProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(portfolioReducer, initialState);
    const refreshInFlight = useRef(false);

    const commit = useCallback((assets: Asset[], transaction?: Omit<PortfolioTransaction, 'id' | 'createdAt'>) => {
        const ledger = getTransactions();
        if (transaction) ledger.unshift({ ...transaction, id: generateId(), createdAt: new Date().toISOString() });
        try {
            savePortfolioState(assets, ledger);
            dispatch({ type: 'SET_ASSETS', payload: assets });
            dispatch({ type: 'SET_TRANSACTIONS', payload: ledger });
            dispatch({ type: 'SET_STORAGE_ERROR', payload: null });
        } catch (error) {
            dispatch({ type: 'SET_STORAGE_ERROR', payload: String(error instanceof Error ? error.message : error) });
            throw error;
        }
    }, []);

    // Update prices
    const updatePricesInternal = useCallback(async (assetsToUpdate: Asset[], forceRefresh = false) => {
        if (assetsToUpdate.length === 0 || refreshInFlight.current) return;

        refreshInFlight.current = true;
        dispatch({ type: 'SET_UPDATING_PRICES', payload: true });
        const refreshDate = new Date().toISOString();
        const requested = forceRefresh ? assetsToUpdate : assetsToUpdate.filter(a => shouldRefreshAssets([a]));
        const initialLedgerKey = portfolioLedgerKey(normalizePortfolioTransactions(assetsToUpdate, getTransactions()), refreshDate);
        try {
            const quoteUpdates: Array<{ id: string; updates: Partial<Asset> }> = [];
            let nextIndex = 0;
            const updateNextAsset = async () => {
                while (nextIndex < requested.length) {
                    const asset = requested[nextIndex++];
                    const controller = new AbortController();
                    const deadline = window.setTimeout(() => controller.abort(), 15000);
                    try {
                        const quote = await getPortfolioAssetQuote(asset, controller.signal, forceRefresh);
                        if (quote && quote.price > 0 && quote.currency === 'EUR') {
                            const updates = {
                                currentPrice: quote.price,
                                previousClose: quote.previousClose,
                                currency: quote.currency || asset.currency,
                                lastCheckedAt: new Date().toISOString(),
                                quotedAt: quote.quotedAt,
                                lastQuoteAt: quote.quotedAt,
                                quoteSource: asset.isin ? 'Finect' : 'Mercado',
                            } as const;
                            quoteUpdates.push({ id: asset.id, updates });
                        }
                    } catch (error) {
                        console.warn(`Failed to update price for ${asset.symbol}:`, error);
                    } finally {
                        window.clearTimeout(deadline);
                    }
                }
            };

            await Promise.all(
                Array.from(
                    { length: Math.min(PRICE_REFRESH_CONCURRENCY, requested.length) },
                    () => updateNextAsset(),
                ),
            );

            // Publish one state update for the whole refresh. This prevents a
            // portfolio with many positions from rendering once per quote.
            if (quoteUpdates.length > 0) {
                updateAssetsInStorage(quoteUpdates);
                dispatch({ type: 'UPDATE_ASSETS', payload: quoteUpdates });
            }

            const refreshedAssets = getAssets();
            const snapshot = createQuoteSnapshot(refreshedAssets, getTransactions(), new Date().toISOString());
            const samePositions = refreshedAssets.length === assetsToUpdate.length && refreshedAssets.every(a =>
                assetsToUpdate.some(old => old.id === a.id && old.quantity === a.quantity && old.purchasePrice === a.purchasePrice && old.purchaseDate === a.purchaseDate));
            if (quoteUpdates.length === requested.length && samePositions && snapshot && snapshot.ledgerKey === initialLedgerKey) addHistoryPoint(snapshot);
            const latestQuoteAt = getLatestQuoteAt(refreshedAssets);
            dispatch({ type: 'SET_LAST_UPDATE', payload: latestQuoteAt });
            dispatch({ type: 'SET_QUOTE_FAILURES', payload: requested.length - quoteUpdates.length });
        } catch (error) {
            dispatch({ type: 'SET_STORAGE_ERROR', payload: error instanceof Error ? error.message : 'No se pudo guardar la actualización.' });
        } finally {
            refreshInFlight.current = false;
            dispatch({ type: 'SET_UPDATING_PRICES', payload: false });
        }
    }, []);

    useEffect(() => {
        if (state.initialized) return;
        try {
        const storedAssets = getAssets();
        dispatch({ type: 'SET_ASSETS', payload: storedAssets });
        dispatch({ type: 'SET_TRANSACTIONS', payload: getTransactions() });
        const latestQuoteAt = getLatestQuoteAt(storedAssets);
        if (latestQuoteAt) dispatch({ type: 'SET_LAST_UPDATE', payload: latestQuoteAt });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
        if (storedAssets.length > 0 && isApiEnabled() && shouldRefreshAssets(storedAssets)) void updatePricesInternal(storedAssets);
        } catch (error) {
            dispatch({ type: 'SET_STORAGE_ERROR', payload: String(error) });
            dispatch({ type: 'SET_LOADING', payload: false });
            dispatch({ type: 'SET_INITIALIZED', payload: true });
        }
    }, [state.initialized, updatePricesInternal]);

    useEffect(() => {
        if (!state.initialized || state.assets.length === 0 || !isApiEnabled()) return undefined;
        const refresh = () => {
            if (document.visibilityState !== 'visible') return;
            try {
                const currentAssets = getAssets();
                if (shouldRefreshAssets(currentAssets)) void updatePricesInternal(currentAssets);
            } catch (error) { dispatch({ type: 'SET_STORAGE_ERROR', payload: String(error) }); }
        };
        const intervalId = window.setInterval(refresh, PRICE_REFRESH_INTERVAL_MS);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [state.assets.length, state.initialized, updatePricesInternal]);

    useEffect(() => {
        const sync = (event: StorageEvent) => {
            if (event.key !== 'freewallet_portfolio_v1' && event.key !== null) return;
            try {
                const assets = getAssets();
                dispatch({ type: 'SET_ASSETS', payload: assets });
                dispatch({ type: 'SET_TRANSACTIONS', payload: getTransactions() });
                dispatch({ type: 'SET_LAST_UPDATE', payload: getLatestQuoteAt(assets) });
            } catch (error) {
                dispatch({ type: 'SET_STORAGE_ERROR', payload: String(error) });
            }
        };
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);

    // Public methods
    const addAsset = useCallback((asset: Asset, transaction?: Omit<PortfolioTransaction, 'id' | 'createdAt'>) => {
        const assets = [...getAssets(), asset];
        commit(assets, transaction);
        if (isApiEnabled()) void updatePricesInternal(assets);
    }, [commit, updatePricesInternal]);

    const updateAsset = useCallback((id: string, updates: Partial<Asset>, transaction?: Omit<PortfolioTransaction, 'id' | 'createdAt'>) => {
        commit(getAssets().map(a => a.id === id ? { ...a, ...updates } : a), transaction);
    }, [commit]);

    const deleteAsset = useCallback((id: string) => {
        const assets = getAssets();
        const asset = assets.find(a => a.id === id);
        if (!asset) return;
        commit(assets.filter(a => a.id !== id), {
            assetId: id, assetSymbol: asset.symbol, assetName: asset.name, assetType: asset.type,
            type: 'delete', date: new Date().toISOString().slice(0, 10), quantity: asset.quantity,
            price: asset.purchasePrice, total: asset.purchasePrice * asset.quantity, notes: 'Activo eliminado de la cartera',
        });
    }, [commit]);

    const sellAsset = useCallback((id: string, quantity: number, price: number, date: string) => {
        const assets = getAssets();
        const asset = assets.find(a => a.id === id);
        if (!asset || !Number.isFinite(quantity) || !Number.isFinite(price) || quantity <= 0 || price <= 0 || quantity > asset.quantity) throw new Error('Venta no válida.');
        const remaining = asset.quantity - quantity;
        commit(assets.flatMap(a => a.id !== id ? [a] : remaining > 1e-8 ? [{ ...a, quantity: remaining }] : []), {
            assetId: id, assetSymbol: asset.symbol, assetName: asset.name, assetType: asset.type,
            type: 'sell', date, quantity, price, total: quantity * price,
            notes: remaining > 1e-8 ? 'Venta parcial' : 'Cierre total de la posición',
        });
    }, [commit]);

    const refreshPrices = useCallback(async () => {
        if (!isApiEnabled()) {
            return;
        }

        await updatePricesInternal(state.assets, true);
    }, [state.assets, updatePricesInternal]);

    const loadDemoData = useCallback(() => {
        const demoTransactions: PortfolioTransaction[] = mockAssets.map((asset) => ({
            id: `demo-${asset.id}`,
            assetId: asset.id,
            assetSymbol: asset.symbol,
            assetName: asset.name,
            assetType: asset.type,
            type: 'buy',
            date: asset.purchaseDate,
            quantity: asset.quantity,
            price: asset.purchasePrice,
            total: asset.purchasePrice * asset.quantity,
            notes: 'Carga de datos demo',
            createdAt: asset.purchaseDate,
        }));
        try { savePortfolioState(mockAssets, demoTransactions); }
        catch (error) { dispatch({ type: 'SET_STORAGE_ERROR', payload: String(error) }); return; }
        try { saveHistory(generateMockHistory(365)); }
        catch (error) { dispatch({ type: 'SET_STORAGE_ERROR', payload: String(error) }); }
        dispatch({ type: 'SET_ASSETS', payload: mockAssets });
        dispatch({ type: 'SET_TRANSACTIONS', payload: demoTransactions.sort((a, b) => (a.date < b.date ? 1 : -1)) });
        const latestQuoteAt = getLatestQuoteAt(mockAssets);
        if (latestQuoteAt) dispatch({ type: 'SET_LAST_UPDATE', payload: latestQuoteAt });
    }, []);

    const value: PortfolioContextValue = {
        state,
        addAsset,
        updateAsset,
        deleteAsset,
        sellAsset,
        refreshPrices,
        loadDemoData,
    };

    return (
        <PortfolioContext.Provider value={value}>
            {state.storageError && <div role="alert">{state.storageError}</div>}
            {children}
        </PortfolioContext.Provider>
    );
}

// Hook to use portfolio context
// eslint-disable-next-line react-refresh/only-export-components
export function usePortfolio() {
    const context = useContext(PortfolioContext);
    if (context === undefined) {
        throw new Error('usePortfolio must be used within a PortfolioProvider');
    }
    return context;
}
