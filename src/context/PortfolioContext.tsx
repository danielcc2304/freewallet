import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Asset, PortfolioTransaction } from '../types/types';
import { getAssets, getTransactions, saveAssets, saveTransactions, addAsset as addAssetToStorage, updateAsset as updateAssetInStorage, deleteAsset as deleteAssetFromStorage, saveHistory, addTransaction as addTransactionToStorage, isApiEnabled, generateId } from '../services/storageService';
import { getQuote } from '../services/apiService';
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
    refreshPrices: () => Promise<void>;
    loadDemoData: () => void;
}

// Create context
const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined);

// Provider component
export function PortfolioProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(portfolioReducer, initialState);

    const recordTransaction = useCallback((transaction: Omit<PortfolioTransaction, 'id' | 'createdAt'>) => {
        const normalizedTransaction: PortfolioTransaction = {
            ...transaction,
            id: generateId(),
            createdAt: new Date().toISOString(),
        };
        addTransactionToStorage(normalizedTransaction);
        dispatch({ type: 'ADD_TRANSACTION', payload: normalizedTransaction });
    }, []);

    // Load assets from storage on mount
    useEffect(() => {
        if (!state.initialized) {
            const storedAssets = getAssets();
            const storedTransactions = getTransactions();
            dispatch({ type: 'SET_ASSETS', payload: storedAssets });
            dispatch({ type: 'SET_TRANSACTIONS', payload: storedTransactions });
            dispatch({ type: 'SET_INITIALIZED', payload: true });

            // Auto-update prices if we have assets
            if (storedAssets.length > 0 && isApiEnabled()) {
                updatePricesInternal(storedAssets);
            }
        }
    }, [state.initialized]);

    // Update prices
    const updatePricesInternal = async (assetsToUpdate: Asset[]) => {
        if (assetsToUpdate.length === 0) return;

        dispatch({ type: 'SET_UPDATING_PRICES', payload: true });

        for (const asset of assetsToUpdate) {
            try {
                const quote = await getQuote(asset.symbol);
                if (quote && quote.price > 0) {
                    dispatch({
                        type: 'UPDATE_ASSET',
                        payload: {
                            id: asset.id,
                            updates: {
                                currentPrice: quote.price,
                                previousClose: quote.previousClose,
                            },
                        },
                    });
                    // Also update storage
                    updateAssetInStorage(asset.id, {
                        currentPrice: quote.price,
                        previousClose: quote.previousClose,
                    });
                }
            } catch (error) {
                console.warn(`Failed to update price for ${asset.symbol}:`, error);
            }
        }

        dispatch({ type: 'SET_UPDATING_PRICES', payload: false });
        dispatch({ type: 'SET_LAST_UPDATE', payload: new Date() });
    };

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
    }, [recordTransaction, state.assets]);

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

    const refreshPrices = useCallback(async () => {
        if (!isApiEnabled()) {
            return;
        }

        await updatePricesInternal(state.assets);
    }, [state.assets]);

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
