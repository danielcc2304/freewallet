import { migrateLegacyPortfolioHistory } from '../services/imports/portfolioHistoryImport';
import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Asset, PortfolioTransaction } from '../types/types';
import { getAssets, getTransactions, savePortfolioState, updateAssets as updateAssetsInStorage, saveHistory, addHistoryPoint, isApiEnabled, generateId } from '../services/storageService';
import { getPortfolioAssetQuote } from '../services/portfolioQuoteService';
import { useLocalDataVersion, notifyLocalDataChange } from '../hooks/useLocalDataVersion';
import { LIVE_PRICE_REFRESH_INTERVAL_MS, PRICE_REFRESH_INTERVAL_MS } from '../constants/app';
import { prefersBatchQuote } from '../services/market/marketSessions';
import { priceRefreshInterval } from '../services/market/priceRefreshPolicy';
import { selectedStockQuoteMarket } from '../services/market/stockQuoteMarkets';
import { createQuoteSnapshot, normalizePortfolioTransactions, portfolioLedgerKey } from '../services/portfolioPerformance';
import { applicableQuoteUpdates, applyPositionUpdate } from '../services/dashboardIntegrity';
import { accountingDay } from '../services/portfolioCalendar';
import {portfolioStorage} from '../services/portfolioCloudStorage';
import {commitPortfolioState} from '../services/storageService';
import { readDailyMarketData, dailyQuote } from '../services/dailyMarketData';
import { reconcileTradePosition } from '../services/portfolioTradeReplay';

function getLatestQuoteAt(assets: Asset[]): Date | null {
    const timestamps = assets
        .map((asset) => Date.parse(asset.lastReadAt || asset.lastCheckedAt || asset.lastQuoteAt || ''))
        .filter((timestamp) => Number.isFinite(timestamp));
    const latest = timestamps.length === assets.length && timestamps.length ? Math.min(...timestamps) : NaN;
    return Number.isFinite(latest) ? new Date(latest) : null;
}

function shouldRefreshAssets(assets: Asset[]): boolean {
    return assets.some(asset => {
        const latest = getLatestQuoteAt([asset]);
        const onDashboard = ['/', '/dashboard'].includes(window.location.pathname) && document.visibilityState==='visible';
        const marketAsset = selectedStockQuoteMarket(asset)?.id==='BME' ? {...asset,symbol:'NXT.MC'} : asset;
        const interval = priceRefreshInterval(marketAsset,onDashboard);
        return !latest || Date.now() - latest.getTime() >= interval;
    });
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
    lastRefreshAttempt: Date | null;
}

// Action types
type PortfolioAction =
    | { type: 'SET_STORAGE_ERROR'; payload: string | null }
    | { type: 'SET_QUOTE_FAILURES'; payload: number }
    | { type: 'SET_REFRESH_ATTEMPT'; payload: Date }
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
    lastRefreshAttempt: null,
};

const PRICE_REFRESH_CONCURRENCY = 4;

// Reducer
function portfolioReducer(state: PortfolioState, action: PortfolioAction): PortfolioState {
    switch (action.type) {
        case 'SET_STORAGE_ERROR': return { ...state, storageError: action.payload };
        case 'SET_QUOTE_FAILURES': return { ...state, quoteFailures: action.payload };
        case 'SET_REFRESH_ATTEMPT': return { ...state, lastRefreshAttempt: action.payload };
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
    addAsset: (asset: Asset, transaction?: Omit<PortfolioTransaction, 'id' | 'createdAt'>) => Promise<void>;
    updateAsset: (id: string, updates: Partial<Asset>, transaction?: Omit<PortfolioTransaction, 'id' | 'createdAt'>) => Promise<void>;
    deleteAsset: (id: string) => Promise<void>;
    sellAsset: (id: string, quantity: number, price: number, date: string, conversionNote?: string) => Promise<void>;
    transferFund: (sourceId: string, destinationId: string, amount: number, transferAll?: boolean, executionPrices?: { sourcePrice?: number; destinationPrice?: number }) => Promise<void>;
    refreshPrices: () => Promise<void>;
    refreshAssetPrices: (ids: string[]) => Promise<void>;
    loadDemoData: () => void;
}

// Create context
const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined);

// Provider component
export function PortfolioProvider({ children }: { children: ReactNode }) {
    const localRevision = useLocalDataVersion();
    const apiEnabled = isApiEnabled();
    const [state, dispatch] = useReducer(portfolioReducer, initialState);
    const refreshInFlight = useRef(false);
    const commitInFlight = useRef(false);

    const commit = useCallback(async (assets: Asset[], transaction?: Omit<PortfolioTransaction, 'id' | 'createdAt'>) => {
        if(commitInFlight.current)throw new Error('Espera a que termine la operación anterior.');
        if(portfolioStorage.cloud && ['error','conflict'].includes(portfolioStorage.getSnapshot().status))
            throw new Error('Abre Mi cuenta para recuperar el guardado pendiente antes de añadir otra operación.');
        commitInFlight.current=true;
        try {
            // Capture an imported position before its first sale/edit changes the basis.
            const previous = getAssets();
            const positionIds = transaction?.type === 'transfer' ? [transaction.assetId, transaction.transferToAssetId] : [transaction?.assetId];
            const ledger = transaction
                ? normalizePortfolioTransactions(previous.filter(a => positionIds.includes(a.id)), getTransactions())
                : getTransactions();
            let nextAssets = assets;
            if (transaction) {
                const operation = { ...transaction, provenance:transaction.provenance??'trade', id: generateId(), createdAt: new Date().toISOString() };
                ledger.unshift(operation);
                nextAssets = reconcileTradePosition(previous, assets, ledger, operation);
            }
            await commitPortfolioState(nextAssets, ledger);
            dispatch({ type: 'SET_ASSETS', payload: getAssets() });
            dispatch({ type: 'SET_TRANSACTIONS', payload: getTransactions() });
            dispatch({ type: 'SET_STORAGE_ERROR', payload: null });
        } catch (error) {
            dispatch({ type: 'SET_STORAGE_ERROR', payload: String(error instanceof Error ? error.message : error) });
            throw error;
        } finally {commitInFlight.current=false;}
    }, []);

    // Update prices
    const updatePricesInternal = useCallback(async (assetsToUpdate: Asset[], forceRefresh = false) => {
        if (assetsToUpdate.length === 0 || refreshInFlight.current) return;
        const accountEpoch=portfolioStorage.epoch;

        refreshInFlight.current = true;
        dispatch({ type: 'SET_REFRESH_ATTEMPT', payload: new Date() });
        dispatch({ type: 'SET_UPDATING_PRICES', payload: true });
        const refreshDate = new Date().toISOString();
        const requested = forceRefresh ? assetsToUpdate : assetsToUpdate.filter(a => shouldRefreshAssets([a]));
        try {
            const initialLedgerKey = portfolioLedgerKey(normalizePortfolioTransactions(assetsToUpdate, getTransactions()), refreshDate);
            // Minute-by-minute requests should not download the entire batch
            // history unless a stored quote or a closed market needs it.
            const needsBatch = requested.some(asset => prefersBatchQuote(asset) || !asset.currentPrice || !asset.lastCheckedAt
                || Date.now()-Date.parse(asset.lastCheckedAt || '') >= PRICE_REFRESH_INTERVAL_MS);
            const centralData = needsBatch ? await readDailyMarketData().catch(() => null) : null;
            if (accountEpoch !== portfolioStorage.epoch) return;
            const quoteUpdates: Array<{ id: string; updates: Partial<Asset> }> = [];
            const quoteMarkets = new Map(requested.map(asset=>[asset.id,selectedStockQuoteMarket(asset)?.id]));
            let nextIndex = 0;
            const updateNextAsset = async () => {
                while (nextIndex < requested.length) {
                    if(accountEpoch!==portfolioStorage.epoch)return;
                    const asset = requested[nextIndex++];
                    const controller = new AbortController();
                    const deadline = window.setTimeout(() => controller.abort(), forceRefresh&&asset.type==='fund'?35000:asset.type==='stock'||asset.type==='crypto'?20000:15000);
                    try {
                        const quote = await getPortfolioAssetQuote(asset, controller.signal, forceRefresh, dailyQuote(asset, centralData));
                        if (quote && Number.isFinite(quote.price) && quote.price >= 0 && quote.currency === 'EUR') {
                            const sameObservation = quote.price === asset.currentPrice && quote.quotedAt
                                && Date.parse(quote.quotedAt) === Date.parse(asset.quotedAt || asset.lastQuoteAt || '');
                            const previousClose = Number.isFinite(quote.previousClose) && quote.previousClose > 0 ? quote.previousClose
                                : sameObservation && Number.isFinite(asset.previousClose) && asset.previousClose! > 0 ? asset.previousClose : quote.previousClose;
                            const updates = {
                                currentPrice: quote.price,
                                previousClose,
                                currency: quote.currency || asset.currency,
                                lastCheckedAt: quote.checkedAt,
                                lastReadAt: new Date().toISOString(),
                                quoteOrigin: quote.origin,
                                quotedAt: quote.quotedAt,
                                lastQuoteAt: quote.quotedAt,
                                quoteSource: quote.source,
                                originalPrice: quote.originalPrice, originalCurrency: quote.originalCurrency,
                                originalUnit: quote.originalUnit, unitScale: quote.unitScale,
                                fxRate: quote.fxRate, fxAt: quote.fxAt, valuationBasis: quote.valuationBasis,
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
            if(accountEpoch!==portfolioStorage.epoch)return;

            // Publish one state update for the whole refresh. This prevents a
            // portfolio with many positions from rendering once per quote.
            const applicable = applicableQuoteUpdates(requested, getAssets(), quoteUpdates)
                .filter(update => {
                    const asset=requested.find(asset=>asset.id===update.id)!;
                    return quoteMarkets.get(asset.id)===selectedStockQuoteMarket(asset)?.id;
                });
            if (applicable.length > 0) {
                updateAssetsInStorage(applicable);
                dispatch({ type: 'UPDATE_ASSETS', payload: applicable });
            }

            const refreshedAssets = getAssets();
            // Reading the batch must not turn its earlier valuation into a new live point.
            const snapshot = createQuoteSnapshot(refreshedAssets, getTransactions(), new Date().toISOString());
            const samePositions = refreshedAssets.length === assetsToUpdate.length && refreshedAssets.every(a =>
                assetsToUpdate.some(old => old.id === a.id && old.quantity === a.quantity && old.purchasePrice === a.purchasePrice && old.purchaseDate === a.purchaseDate));
            if (requested.length > 0 && applicable.length === requested.length && samePositions && snapshot && snapshot.ledgerKey === initialLedgerKey
                && (!portfolioStorage.cloud || portfolioStorage.getSnapshot().status==='synced')) addHistoryPoint(snapshot);
            const latestQuoteAt = getLatestQuoteAt(refreshedAssets);
            dispatch({ type: 'SET_LAST_UPDATE', payload: latestQuoteAt });
            dispatch({ type: 'SET_QUOTE_FAILURES', payload: requested.length - applicable.length });
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
        if(migrateLegacyPortfolioHistory())notifyLocalDataChange();
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
        if (!state.initialized || state.assets.length === 0 || !apiEnabled) return undefined;
        const refresh = () => {
            if (document.visibilityState !== 'visible') return;
            try {
                const currentAssets = getAssets();
                if (shouldRefreshAssets(currentAssets)) void updatePricesInternal(currentAssets);
            } catch (error) { dispatch({ type: 'SET_STORAGE_ERROR', payload: String(error) }); }
        };
        const intervalId = window.setInterval(refresh, LIVE_PRICE_REFRESH_INTERVAL_MS);
        refresh();
        document.addEventListener('visibilitychange', refresh);
        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [state.assets.length, state.initialized, updatePricesInternal, apiEnabled]);

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
        const localSync=()=>{try {if(migrateLegacyPortfolioHistory())notifyLocalDataChange();} catch (error) {dispatch({type:'SET_STORAGE_ERROR',payload:String(error)});}sync({key:null} as StorageEvent);};
        window.addEventListener('freewallet-data-change',localSync);
        return () => {window.removeEventListener('storage', sync);window.removeEventListener('freewallet-data-change',localSync);};
    }, []);

    // Public methods
    const addAsset = useCallback(async (asset: Asset, transaction?: Omit<PortfolioTransaction, 'id' | 'createdAt'>) => {
        const assets = [...getAssets(), asset];
        await commit(assets, transaction);
        if (isApiEnabled()) void updatePricesInternal(getAssets());
    }, [commit, updatePricesInternal]);

    const updateAsset = useCallback(async (id: string, updates: Partial<Asset>, transaction?: Omit<PortfolioTransaction, 'id' | 'createdAt'>) => {
        await commit(getAssets().map(a => a.id === id ? applyPositionUpdate(a, updates) : a), transaction);
    }, [commit]);

    const deleteAsset = useCallback(async (id: string) => {
        const assets = getAssets();
        const asset = assets.find(a => a.id === id);
        if (!asset) return;
        await commit(assets.filter(a => a.id !== id), {
            assetId: id, assetSymbol: asset.symbol, assetName: asset.name, assetType: asset.type,
            type: 'delete', date: accountingDay(Date.now()), quantity: asset.quantity,
            price: asset.purchasePrice, total: asset.purchasePrice * asset.quantity, notes: 'Activo eliminado de la cartera',
        });
    }, [commit]);

    const sellAsset = useCallback(async (id: string, quantity: number, price: number, date: string, conversionNote = '') => {
        const assets = getAssets();
        const asset = assets.find(a => a.id === id);
        if (!asset || !Number.isFinite(quantity) || !Number.isFinite(price) || quantity <= 0 || price <= 0 || quantity > asset.quantity) throw new Error('Venta no válida.');
        const remaining = asset.quantity - quantity;
        await commit(assets.flatMap(a => a.id !== id ? [a] : remaining > 0 ? [{ ...a, quantity: remaining }] : []), {
            assetId: id, assetSymbol: asset.symbol, assetName: asset.name, assetType: asset.type,
            type: 'sell', date, quantity, price, total: quantity * price,
            notes: (remaining > 1e-8 ? 'Venta parcial' : 'Cierre total de la posición') + conversionNote,
        });
    }, [commit]);

    const transferFund = useCallback(async (sourceId: string, destinationId: string, amount: number, transferAll = false, executionPrices: { sourcePrice?: number; destinationPrice?: number } = {}) => {
        const assets = getAssets();
        const source = assets.find(asset => asset.id === sourceId);
        const destination = assets.find(asset => asset.id === destinationId);
        if (!source || !destination || source.id === destination.id || source.type !== 'fund' || destination.type !== 'fund')
            throw new Error('Elige dos fondos distintos para registrar el traspaso.');
        const sourceIsin = source.isin?.replace(/\s/g, '').toUpperCase();
        const destinationIsin = destination.isin?.replace(/\s/g, '').toUpperCase();
        if (sourceIsin && destinationIsin ? sourceIsin === destinationIsin : source.symbol.toUpperCase() === destination.symbol.toUpperCase())
            throw new Error('El fondo de destino debe ser distinto al de origen.');
        if (!Number.isFinite(source.currentPrice) || source.currentPrice! <= 0 || !Number.isFinite(destination.currentPrice) || destination.currentPrice! <= 0
            || (source.currency && source.currency !== 'EUR') || (destination.currency && destination.currency !== 'EUR'))
            throw new Error('Hace falta una última valoración válida en euros para los dos fondos.');
        const sourceExecutionPrice = executionPrices.sourcePrice ?? source.currentPrice!;
        const destinationExecutionPrice = executionPrices.destinationPrice ?? destination.currentPrice!;
        if (!Number.isFinite(sourceExecutionPrice) || sourceExecutionPrice <= 0 || !Number.isFinite(destinationExecutionPrice) || destinationExecutionPrice <= 0)
            throw new Error('Los precios de ejecución deben ser mayores que cero.');
        if (!Number.isFinite(source.quantity) || source.quantity <= 0 || !Number.isFinite(source.purchasePrice) || source.purchasePrice < 0)
            throw new Error('La posición de origen no tiene participaciones o coste válido.');
        if (!Number.isFinite(destination.quantity) || destination.quantity < 0 || !Number.isFinite(destination.purchasePrice) || destination.purchasePrice < 0)
            throw new Error('La posición de destino no tiene participaciones o coste válido.');
        const sourceValue = source.quantity * source.currentPrice!;
        if (!Number.isFinite(sourceValue)) throw new Error('No se ha podido calcular el valor del traspaso.');
        if (!transferAll && (!Number.isFinite(amount) || amount <= 0 || amount > sourceValue + .005))
            throw new Error('El importe debe ser mayor que cero y no superar el valor de la posición.');
        const sourceQuantity = transferAll ? source.quantity : Math.min(source.quantity, Math.round((amount / source.currentPrice!) * 1e12) / 1e12);
        const transferredValue = sourceQuantity * sourceExecutionPrice;
        const destinationQuantity = Math.round((transferredValue / destinationExecutionPrice) * 1e12) / 1e12;
        if (!Number.isFinite(destination.quantity + destinationQuantity)) throw new Error('No se han podido calcular las participaciones de destino.');
        const transferBasis = Math.min(source.purchasePrice * sourceQuantity, source.purchasePrice * source.quantity);
        if (!Number.isFinite(transferredValue) || !Number.isFinite(transferBasis) || sourceQuantity <= 0 || destinationQuantity <= 0 || transferredValue <= 0)
            throw new Error('El importe es demasiado pequeño para calcular participaciones válidas.');
        const remaining = Math.max(0, source.quantity - sourceQuantity);
        const destinationTotalQuantity = destination.quantity + destinationQuantity;
        const nextAssets = assets.flatMap(asset => {
            if (asset.id === source.id) return remaining > 1e-10 ? [{ ...asset, quantity: remaining }] : [];
            if (asset.id === destination.id) return [{ ...asset,
                quantity: destinationTotalQuantity,
                purchasePrice: (asset.purchasePrice * asset.quantity + transferBasis) / destinationTotalQuantity,
                purchaseDate: asset.purchaseDate < source.purchaseDate ? asset.purchaseDate : source.purchaseDate,
            }];
            return [asset];
        });
        await commit(nextAssets, {
            assetId: source.id, assetSymbol: source.symbol, assetName: source.name, assetType: source.type,
            type: 'transfer', date: accountingDay(Date.now()), quantity: sourceQuantity, price: sourceExecutionPrice, total: transferredValue,
            transferToAssetId: destination.id, transferToAssetSymbol: destination.symbol, transferToAssetName: destination.name,
            transferToAssetType: destination.type, transferQuantity: destinationQuantity, transferToPrice: destinationExecutionPrice, transferBasis,
            estimated: executionPrices.sourcePrice === undefined || executionPrices.destinationPrice === undefined,
            notes: 'Traspaso interno registrado en FreeWallet; no ejecuta la operación en la entidad.',
        });
    }, [commit]);

    const refreshPrices = useCallback(async () => {
        if (!isApiEnabled()) {
            return;
        }

        await updatePricesInternal(state.assets, true);
    }, [state.assets, updatePricesInternal]);

    const refreshAssetPrices = useCallback(async (ids: string[]) => {
        if (isApiEnabled()) await updatePricesInternal(getAssets().filter(asset => ids.includes(asset.id)),true);
    }, [updatePricesInternal]);

    const loadDemoData = useCallback(async () => {
        if(portfolioStorage.cloud){dispatch({type:'SET_STORAGE_ERROR',payload:'Los datos demo solo están disponibles sin una cuenta conectada.'});return;}
        const epoch=portfolioStorage.epoch;
        const { mockAssets, generateMockHistory } = await import('../data/mockData');
        if(epoch!==portfolioStorage.epoch)return;
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
    void localRevision;

    const value: PortfolioContextValue = {
        state,
        addAsset,
        updateAsset,
        deleteAsset,
        sellAsset,
        transferFund,
        refreshPrices,
        refreshAssetPrices,
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
