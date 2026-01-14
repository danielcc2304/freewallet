import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Asset } from '../types/types';
import { getAssets, saveAssets, addAsset as addAssetToStorage, updateAsset as updateAssetInStorage, deleteAsset as deleteAssetFromStorage, saveHistory } from '../services/storageService';
import { getQuote } from '../services/apiService';
import { mockAssets, generateMockHistory } from '../data/mockData';

// State interface
interface PortfolioState {
    assets: Asset[];
    loading: boolean;
    updatingPrices: boolean;
    lastPriceUpdate: Date | null;
    initialized: boolean;
}

// Action types
type PortfolioAction =
    | { type: 'SET_ASSETS'; payload: Asset[] }
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
    addAsset: (asset: Asset) => void;
    updateAsset: (id: string, updates: Partial<Asset>) => void;
    deleteAsset: (id: string) => void;
    refreshPrices: () => Promise<void>;
    loadDemoData: () => void;
}

// Create context
const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined);

// Provider component
export function PortfolioProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(portfolioReducer, initialState);

    // Load assets from storage on mount
    useEffect(() => {
        if (!state.initialized) {
            const storedAssets = getAssets();
            dispatch({ type: 'SET_ASSETS', payload: storedAssets });
            dispatch({ type: 'SET_INITIALIZED', payload: true });

            // Auto-update prices if we have assets
            if (storedAssets.length > 0) {
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
    const addAsset = useCallback(async (asset: Asset) => {
        addAssetToStorage(asset);
        dispatch({ type: 'ADD_ASSET', payload: asset });

        // Refresh prices for all assets after adding new one
        const allAssets = [...state.assets, asset];
        await updatePricesInternal(allAssets);
    }, [state.assets]);

    const updateAsset = useCallback((id: string, updates: Partial<Asset>) => {
        updateAssetInStorage(id, updates);
        dispatch({ type: 'UPDATE_ASSET', payload: { id, updates } });
    }, []);

    const deleteAsset = useCallback((id: string) => {
        deleteAssetFromStorage(id);
        dispatch({ type: 'DELETE_ASSET', payload: id });
    }, []);

    const refreshPrices = useCallback(async () => {
        await updatePricesInternal(state.assets);
    }, [state.assets]);

    const loadDemoData = useCallback(() => {
        saveAssets(mockAssets);
        saveHistory(generateMockHistory(365));
        dispatch({ type: 'SET_ASSETS', payload: mockAssets });
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
