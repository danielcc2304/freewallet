import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Asset, PortfolioTransaction } from '../types/types';
import { getAssets, getTransactions, saveAssets, saveTransactions, addAsset as addAssetToStorage, updateAsset as updateAssetInStorage, deleteAsset as deleteAssetFromStorage, saveHistory, addHistoryPoint, addTransaction as addTransactionToStorage, isApiEnabled, generateId } from '../services/storageService';
import { getPortfolioAssetQuote } from '../services/portfolioQuoteService';
import { mockAssets, generateMockHistory } from '../data/mockData';

// State interface
interface PortfolioState {
    assets: Asset[];
    transactions: PortfolioTransaction[];
    loading: boolean;
    updatingPrices: boolean;
    lastPriceUpdate: Date | null;
    initialized: boolean;
}

// Action types
type PortfolioAction =
    | { type: 'SET_ASSETS'; payload: Asset[] }
    | { type: 'SET_TRANSACTIONS'; payload: PortfolioTransaction[] }
    | { type: 'ADD_TRANSACTION'; payload: PortfolioTransaction }
    | { type: 'ADD_ASSET'; payload: Asset }
    | { type: 'UPDATE_ASSET'; payload: { id: string; updates: Partial<Asset> } }
    | { type: 'DELETE_ASSET'; payload: string }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_UPDATING_PRICES'; payload: boolean }
    | { type: 'SET_LAST_UPDATE'; payload: Date }
    | { type: 'SET_INITIALIZED'; payload: boolean };

// Initial state
const initialState: PortfolioState = {
    assets: [],
    transactions: [],
    loading: true,
    updatingPrices: false,
    lastPriceUpdate: null,
    initialized: false,
};

// Reducer
function portfolioReducer(state: PortfolioState, action: PortfolioAction): PortfolioState {
    switch (action.type) {
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

    const recordTransaction = useCallback((transaction: Omit<PortfolioTransaction, 'id' | 'createdAt'>) => {
        const normalizedTransaction: PortfolioTransaction = {
            ...transaction,
            id: generateId(),
            createdAt: new Date().toISOString(),
        };
        addTransactionToStorage(normalizedTransaction);
        dispatch({ type: 'ADD_TRANSACTION', payload: normalizedTransaction });
    }, []);

    // Update prices
    const updatePricesInternal = useCallback(async (assetsToUpdate: Asset[]) => {
        if (assetsToUpdate.length === 0 || refreshInFlight.current) return;

        refreshInFlight.current = true;
        dispatch({ type: 'SET_UPDATING_PRICES', payload: true });
        try {
            for (const asset of assetsToUpdate) {
                try {
                    const quote = await getPortfolioAssetQuote(asset);
                    if (quote && quote.price > 0) {
                        const updates = {
                            currentPrice: quote.price,
                            previousClose: quote.previousClose,
                            currency: quote.currency || asset.currency,
                            lastQuoteAt: new Date().toISOString(),
                            quoteSource: asset.isin ? 'Finect' : 'Mercado',
                        } as const;
                        dispatch({ type: 'UPDATE_ASSET', payload: { id: asset.id, updates } });
                        updateAssetInStorage(asset.id, updates);
                    }
                } catch (error) {
                    console.warn(`Failed to update price for ${asset.symbol}:`, error);
                }
            }

            const refreshedAssets = getAssets();
            const value = refreshedAssets.reduce((sum, asset) => sum + (asset.currentPrice || asset.purchasePrice) * asset.quantity, 0);
            const invested = refreshedAssets.reduce((sum, asset) => sum + asset.purchasePrice * asset.quantity, 0);
            addHistoryPoint({ date: new Date().toISOString(), value, invested });
            dispatch({ type: 'SET_LAST_UPDATE', payload: new Date() });
        } finally {
            refreshInFlight.current = false;
            dispatch({ type: 'SET_UPDATING_PRICES', payload: false });
        }
    }, []);

    useEffect(() => {
        if (state.initialized) return;
        const storedAssets = getAssets();
        dispatch({ type: 'SET_ASSETS', payload: storedAssets });
        dispatch({ type: 'SET_TRANSACTIONS', payload: getTransactions() });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
        if (storedAssets.length > 0 && isApiEnabled()) void updatePricesInternal(storedAssets);
    }, [state.initialized, updatePricesInternal]);

    useEffect(() => {
        if (!state.initialized || state.assets.length === 0 || !isApiEnabled()) return undefined;
        const refresh = () => {
            if (document.visibilityState === 'visible') void updatePricesInternal(getAssets());
        };
        const intervalId = window.setInterval(refresh, 5 * 60 * 1000);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [state.assets.length, state.initialized, updatePricesInternal]);

    // Public methods
    const addAsset = useCallback(async (asset: Asset, transaction?: Omit<PortfolioTransaction, 'id' | 'createdAt'>) => {
        addAssetToStorage(asset);
        dispatch({ type: 'ADD_ASSET', payload: asset });
        if (transaction) {
            recordTransaction(transaction);
        }

        // Refresh prices for all assets after adding new one
        if (!isApiEnabled()) {
            return;
        }

        const allAssets = [...state.assets, asset];
        await updatePricesInternal(allAssets);
    }, [recordTransaction, state.assets, updatePricesInternal]);

    const updateAsset = useCallback((id: string, updates: Partial<Asset>, transaction?: Omit<PortfolioTransaction, 'id' | 'createdAt'>) => {
        updateAssetInStorage(id, updates);
        dispatch({ type: 'UPDATE_ASSET', payload: { id, updates } });
        if (transaction) {
            recordTransaction(transaction);
        }
    }, [recordTransaction]);

    const deleteAsset = useCallback((id: string) => {
        const assetToDelete = state.assets.find((asset) => asset.id === id);
        if (assetToDelete) {
            recordTransaction({
                assetId: assetToDelete.id,
                assetSymbol: assetToDelete.symbol,
                assetName: assetToDelete.name,
                assetType: assetToDelete.type,
                type: 'delete',
                date: new Date().toISOString().split('T')[0],
                quantity: assetToDelete.quantity,
                price: assetToDelete.purchasePrice,
                total: assetToDelete.purchasePrice * assetToDelete.quantity,
                notes: 'Activo eliminado de la cartera',
            });
        }
        deleteAssetFromStorage(id);
        dispatch({ type: 'DELETE_ASSET', payload: id });
    }, [recordTransaction, state.assets]);

    const sellAsset = useCallback((id: string, quantity: number, price: number, date: string) => {
        const asset = state.assets.find((item) => item.id === id);
        if (!asset || quantity <= 0 || quantity > asset.quantity) return;
        const remainingQuantity = asset.quantity - quantity;
        recordTransaction({
            assetId: asset.id,
            assetSymbol: asset.symbol,
            assetName: asset.name,
            assetType: asset.type,
            type: 'sell',
            date,
            quantity,
            price,
            total: quantity * price,
            notes: remainingQuantity === 0 ? 'Cierre total de la posición' : 'Venta parcial',
        });
        if (remainingQuantity === 0) {
            deleteAssetFromStorage(id);
            dispatch({ type: 'DELETE_ASSET', payload: id });
        } else {
            updateAssetInStorage(id, { quantity: remainingQuantity });
            dispatch({ type: 'UPDATE_ASSET', payload: { id, updates: { quantity: remainingQuantity } } });
        }
    }, [recordTransaction, state.assets]);

    const refreshPrices = useCallback(async () => {
        if (!isApiEnabled()) {
            return;
        }

        await updatePricesInternal(state.assets);
    }, [state.assets, updatePricesInternal]);

    const loadDemoData = useCallback(() => {
        saveAssets(mockAssets);
        saveHistory(generateMockHistory(365));
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
        saveTransactions(demoTransactions);
        dispatch({ type: 'SET_ASSETS', payload: mockAssets });
        dispatch({ type: 'SET_TRANSACTIONS', payload: demoTransactions.sort((a, b) => (a.date < b.date ? 1 : -1)) });
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
            {children}
        </PortfolioContext.Provider>
    );
}

// Hook to use portfolio context
export function usePortfolio() {
    const context = useContext(PortfolioContext);
    if (context === undefined) {
        throw new Error('usePortfolio must be used within a PortfolioProvider');
    }
    return context;
}
