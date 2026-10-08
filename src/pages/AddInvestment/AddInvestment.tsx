import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import type { DashboardNavigationContext } from '../../components/layout/MainLayout/dashboardNavigation';
import axios from 'axios';
import { Search, Coins, Hash, ArrowLeft, Check, AlertCircle, Edit3, TrendingUp, Wrench, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardContent, Input, Button } from '../../components/ui';
import { searchSymbol, getQuote, getAssetChartData } from '../../services/apiService';
import { OPERATION_CURRENCIES, historicalOperationRate, operationEuroPrice } from '../../services/operationCurrency';
import { normalizeQuoteToEuro } from '../../services/portfolioQuoteService';
import { getFundRelevance } from '../../services/finect/finectService';
import { generateId, isApiEnabled } from '../../services/storageService';
import { usePortfolio } from '../../context/PortfolioContext';
import type { SearchResult, AssetType, Asset, StockQuote } from '../../types/types';
import './AddInvestment.css';
import { accountingDay } from '../../services/portfolioCalendar';

interface FormData {
    symbol: string;
    name: string;
    type: AssetType;
    purchasePrice: string;
    purchaseDate: string;
    quantity: string;
    isin: string;
    cashTae: string;
}

interface FormErrors {
    save?: string;
    symbol?: string;
    name?: string;
    purchasePrice?: string;
    purchaseDate?: string;
    quantity?: string;
    cashTae?: string;
}

const COMMON_ASSETS: SearchResult[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', region: 'Estados Unidos', currency: 'USD' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', region: 'Estados Unidos', currency: 'USD' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', region: 'Estados Unidos', currency: 'USD' },
    { symbol: 'AMZN', name: 'Amazon.com, Inc.', type: 'stock', region: 'Estados Unidos', currency: 'USD' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', region: 'Estados Unidos', currency: 'USD' },
    { symbol: 'META', name: 'Meta Platforms, Inc.', type: 'stock', region: 'Estados Unidos', currency: 'USD' },
    { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'stock', region: 'Estados Unidos', currency: 'USD' },
    { symbol: 'SAN.MC', name: 'Banco Santander, S.A.', type: 'stock', region: 'España', currency: 'EUR' },
    { symbol: 'IBE.MC', name: 'Iberdrola, S.A.', type: 'stock', region: 'España', currency: 'EUR' },
    { symbol: 'ITX.MC', name: 'Industria de Diseño Textil, S.A.', type: 'stock', region: 'España', currency: 'EUR' },
];

function getLocalPredictions(query: string): SearchResult[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return COMMON_ASSETS.filter((asset) =>
        asset.symbol.toLowerCase().startsWith(normalized)
        || asset.name.toLowerCase().includes(normalized)
    );
}

export function AddInvestment() {
    const navigate = useNavigate();
    const location = useLocation();
    const { dashboardReturn } = useOutletContext<DashboardNavigationContext>();
    const returnToDashboard = () => {
        if (dashboardReturn && location.state?.dashboardReturnKey === dashboardReturn.key) {
            navigate(-1);
        } else {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            navigate('/', { replace: true });
        }
    };
    useLayoutEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, []);
    const { addAsset, updateAsset, sellAsset } = usePortfolio();

    // Check modes
    const editAsset = location.state?.editAsset as Asset | undefined;
    const dcaAsset = location.state?.dcaAsset as Asset | undefined;
    const assetToSell = location.state?.sellAsset as Asset | undefined;

    const isEditMode = !!editAsset;
    const isDcaMode = !!dcaAsset;
    const isSellMode = !!assetToSell;
    const targetAsset = editAsset || dcaAsset || assetToSell;
    const apiEnabled = isApiEnabled();

    const [formData, setFormData] = useState<FormData>({
        symbol: targetAsset?.symbol || '',
        name: targetAsset?.name || '',
        type: targetAsset?.type || 'stock',
        // In DCA mode, start empty to ask for NEW purchase price. In Edit mode, show OLD price.
        purchasePrice: targetAsset?.type === 'cash' ? '1' : isEditMode ? targetAsset?.purchasePrice.toString() || '' : (isSellMode ? String(targetAsset?.currentPrice || targetAsset?.purchasePrice || '') : ''),
        purchaseDate: isEditMode ? targetAsset!.purchaseDate.slice(0, 10) : accountingDay(Date.now()),
        // In DCA mode, start empty. In Edit mode, show OLD quantity.
        quantity: isEditMode ? targetAsset?.quantity.toString() || '' : '',
        isin: targetAsset?.isin || '',
        cashTae: targetAsset?.cashTae === undefined ? '' : String(targetAsset.cashTae),
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [searchQuery, setSearchQuery] = useState(targetAsset?.symbol || '');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [highlightedResult, setHighlightedResult] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [manualMode, setManualMode] = useState(!!targetAsset);
    const [noResultsFound, setNoResultsFound] = useState(false);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [loadingPrice, setLoadingPrice] = useState(false);
    const [priceLookupFailed, setPriceLookupFailed] = useState(false);
    const [currency, setCurrency] = useState(targetAsset?.currency || 'EUR');
    const [manualEuroTotal, setManualEuroTotal] = useState('');
    const [fx, setFx] = useState<{ key: string; rate?: number; date?: string; loading: boolean }>({ key: '', loading: false });
    const currencyRef = useRef(currency);
    currencyRef.current = currency;
    const fxKey = `${currency}:${formData.purchaseDate}`;
    const activeFx = fx.key === fxKey ? fx : undefined;
    const euroPrice = operationEuroPrice(Number(formData.purchasePrice), Number(formData.quantity), currency,
        activeFx?.rate, manualEuroTotal.trim() ? Number(manualEuroTotal) : undefined);

    useEffect(() => {
        if (currency === 'EUR') return;
        const date = formData.purchaseDate;
        const day = Date.parse(`${date}T00:00:00Z`);
        if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== date || date > accountingDay(Date.now())) return;
        const controller = new AbortController();
        const key = `${currency}:${date}`;
        const timer = window.setTimeout(() => controller.abort(), 12000);
        let disposed = false;
        setFx({ key, loading: true });
        void getAssetChartData(`${currency}EUR=X`, '1M', controller.signal, { startDate: day, endDate: day + 86400000 })
            .then(points => {
                const rate = historicalOperationRate(points, date);
                if (!disposed) setFx({ key, loading: false, rate: rate?.close, date: rate?.date });
            }).catch(() => { if (!disposed) setFx({ key, loading: false }); })
            .finally(() => window.clearTimeout(timer));
        return () => { disposed = true; controller.abort(); window.clearTimeout(timer); };
    }, [currency, formData.purchaseDate]);

    const handleCurrencyChange = (value: string) => {
        setCurrency(value);
        currencyRef.current = value;
        setManualEuroTotal('');
        setFormData(prev => ({ ...prev, purchasePrice: '' }));
        setErrors({});
    };
    // Al seleccionar una sugerencia actualizamos también el texto del buscador.
    // Este ref evita que ese cambio vuelva a abrir el desplegable y obligue a
    // seleccionar el activo una segunda vez.
    const selectedSearchSymbolRef = useRef<string | null>(null);
    const quoteRequestRef = useRef<AbortController | null>(null);
    useEffect(() => () => quoteRequestRef.current?.abort(), []);

    // Detect if search query looks like an ISIN
    const isISIN = (query: string): boolean => {
        return /^[A-Z]{2}[A-Z0-9]{10}$/i.test(query.trim());
    };

    // Debounced search
    useEffect(() => {
        if (isEditMode && searchQuery === editAsset?.symbol) return;

        if (selectedSearchSymbolRef.current === searchQuery.trim()) {
            selectedSearchSymbolRef.current = null;
            setSearchResults([]);
            setShowResults(false);
            setNoResultsFound(false);
            setIsSearching(false);
            return;
        }

        const controller = new AbortController();

        const timer = setTimeout(async () => {
            if (!apiEnabled) {
                setSearchResults([]);
                setShowResults(false);
                setNoResultsFound(false);
                setIsSearching(false);
                return;
            }

            if (searchQuery.trim().length >= 1) {
                setIsSearching(true);
                setNoResultsFound(false);
                const searchDeadline = window.setTimeout(() => controller.abort(), 6000);
                try {
                    const results = isISIN(searchQuery)
                        ? [await getFundRelevance(searchQuery, controller.signal)].map((fund) => ({
                            symbol: fund.isin,
                            name: fund.className || fund.name,
                            type: 'fund' as const,
                            region: fund.managerCountry || 'Europa',
                            currency: fund.currencyCode || 'EUR',
                        }))
                        : await searchSymbol(searchQuery, controller.signal);
                    const localResults = getLocalPredictions(searchQuery);
                    const mergedResults = [...localResults, ...results.filter((result) =>
                        !localResults.some((local) => local.symbol === result.symbol)
                    )].slice(0, 8);
                    // El usuario puede haber seleccionado una sugerencia
                    // mientras esta petición estaba en vuelo. No dejes que
                    // una respuesta antigua reabra el menú.
                    if (controller.signal.aborted) return;
                    setSearchResults(mergedResults);
                    setHighlightedResult(0);
                    setShowResults(mergedResults.length > 0);
                    setNoResultsFound(mergedResults.length === 0);
                } catch (error) {
                    if (axios.isCancel(error)) {
                        console.log('Search request cancelled:', searchQuery);
                    } else {
                        console.error('Search failed:', error);
                    }
                } finally {
                    window.clearTimeout(searchDeadline);
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
                setNoResultsFound(false);
            }
        }, 250);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [searchQuery, isEditMode, editAsset, apiEnabled]);

    const handleSearchChange = (value: string) => {
        setManualEuroTotal('');
        quoteRequestRef.current?.abort();
        setCurrentPrice(null);
        setLoadingPrice(false);
        setPriceLookupFailed(false);
        selectedSearchSymbolRef.current = null;
        const localPredictions = getLocalPredictions(value);
        setSearchQuery(value);
        setFormData(prev => ({
            ...prev,
            symbol: value,
            isin: isISIN(value) ? value.trim().toUpperCase() : '',
        }));
        if (!targetAsset) {
            setFormData(prev => ({ ...prev, name: '' }));
            setManualMode(false);
        }
        setSearchResults(localPredictions);
        setHighlightedResult(0);
        setShowResults(localPredictions.length > 0);
        setNoResultsFound(false);
    };

    const handleSelectResult = async (result: SearchResult) => {
        quoteRequestRef.current?.abort();
        selectedSearchSymbolRef.current = result.symbol;
        setFormData({
            symbol: result.symbol,
            name: result.name,
            type: result.type,
            purchasePrice: '',
            purchaseDate: isEditMode ? targetAsset!.purchaseDate.slice(0, 10) : accountingDay(Date.now()),
            quantity: '',
            cashTae: '',
            isin: isISIN(result.symbol) ? result.symbol : ''
        });
        setSearchQuery(result.symbol);

        // Start in the accounting currency; the user can choose the trade currency.
        setCurrency('EUR');
        currencyRef.current = 'EUR';
        setManualEuroTotal('');

        setShowResults(false);
        setManualMode(false);
        setErrors(prev => ({ ...prev, symbol: undefined }));

        // Fetch current price
        setLoadingPrice(true);
        setCurrentPrice(null);
        setPriceLookupFailed(false);
        const quoteController = new AbortController();
        quoteRequestRef.current = quoteController;
        const quoteDeadline = window.setTimeout(() => quoteController.abort(), 15000);
        try {
            const fund = isISIN(result.symbol) ? await getFundRelevance(result.symbol, quoteController.signal) : null;
            const rawQuote = fund ? null : await getQuote(result.symbol, quoteController.signal);
            const fundQuote: StockQuote | null = fund?.lastQuote?.price
                ? {
                    symbol: result.symbol,
                    name: result.name,
                    price: fund.lastQuote.price,
                    change: fund.lastQuote.change || 0,
                    changePercent: fund.lastQuote.percentChange || 0,
                    previousClose: fund.lastQuote.change ? fund.lastQuote.price - fund.lastQuote.change : fund.lastQuote.price,
                    open: fund.lastQuote.price,
                    high: fund.lastQuote.price,
                    low: fund.lastQuote.price,
                    volume: 0,
                    currency: fund.currencyCode || 'EUR',
                }
                : null;
            const quote = rawQuote
                ? await normalizeQuoteToEuro(rawQuote, quoteController.signal, false, result.type)
                : fundQuote
                    ? await normalizeQuoteToEuro(fundQuote, quoteController.signal)
                    : null;
            const resolvedPrice = quote?.price;
            if (quoteRequestRef.current !== quoteController || quoteController.signal.aborted) return;
            if (resolvedPrice && quote.currency === 'EUR') {
                setCurrentPrice(resolvedPrice);
                setFormData(prev => ({
                    ...prev,
                    purchasePrice: currencyRef.current === 'EUR' ? prev.purchasePrice || resolvedPrice.toFixed(6) : prev.purchasePrice
                }));
            } else {
                setPriceLookupFailed(true);
            }
        } catch (error) {
            if (!axios.isCancel(error)) console.error('Error fetching price:', error);
            if (quoteRequestRef.current === quoteController) setPriceLookupFailed(true);
        } finally {
            window.clearTimeout(quoteDeadline);
            if (quoteRequestRef.current === quoteController) {
                setLoadingPrice(false);
                if (quoteController.signal.aborted) setPriceLookupFailed(true);
            }
        }
    };

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showResults || searchResults.length === 0) return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setHighlightedResult((current) => (current + 1) % searchResults.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setHighlightedResult((current) => (current - 1 + searchResults.length) % searchResults.length);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            void handleSelectResult(searchResults[highlightedResult]);
        } else if (event.key === 'Escape') {
            setShowResults(false);
        }
    };

    const handleManualEntry = () => {
        const query = searchQuery.trim().toUpperCase();
        if (isISIN(query)) {
            setFormData(prev => ({
                ...prev,
                symbol: query,
                isin: query,
                type: 'fund',
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                symbol: query,
                type: 'stock',
            }));
        }
        setManualMode(true);
        setShowResults(false);
        setNoResultsFound(false);
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        if (field === 'type' && value === 'cash') { setCurrency('EUR'); currencyRef.current = 'EUR'; }
        if (field === 'quantity' || field === 'purchaseDate' || field === 'purchasePrice') setManualEuroTotal('');
        setFormData(prev => ({ ...prev, [field]: value, ...(field === 'type' && value === 'cash' ? { purchasePrice: '1', isin: '' } : {}) }));
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.symbol.trim()) {
            newErrors.symbol = 'El símbolo o ISIN es requerido';
        }

        if (manualMode && !formData.name.trim()) {
            newErrors.name = 'El nombre del activo es requerido';
        }

        const price = parseFloat(formData.purchasePrice);
        if (!formData.purchasePrice || !Number.isFinite(price) || price <= 0) {
            newErrors.purchasePrice = 'Introduce un precio válido mayor que 0';
        }

        if (formData.type === 'cash' && formData.cashTae.trim() && (!Number.isFinite(Number(formData.cashTae)) || Number(formData.cashTae) < 0)) {
            newErrors.cashTae = 'Introduce una TAE válida igual o mayor que 0';
        }

        const day = Date.parse(`${formData.purchaseDate}T00:00:00Z`);
        if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== formData.purchaseDate || formData.purchaseDate > accountingDay(Date.now())) {
            newErrors.purchaseDate = 'Introduce una fecha válida que no sea futura';
        }

        const qty = parseFloat(formData.quantity);
        if (!formData.quantity || !Number.isFinite(qty) || qty <= 0) {
            newErrors.quantity = 'Introduce una cantidad válida mayor que 0';
        } else if (isSellMode && assetToSell && qty > assetToSell.quantity) {
            newErrors.quantity = `No puedes vender más de ${assetToSell.quantity}`;
        }

        if (!Number.isFinite(euroPrice) || !Number.isFinite(euroPrice * qty)) {
            newErrors.save = currency === 'EUR' ? 'Introduce importes válidos.' : 'Indica el importe real en euros o espera a un cambio histórico válido.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        const conversionNote = currency === 'EUR' ? '' : ` · Precio original: ${formData.purchasePrice} ${currency}; ${manualEuroTotal.trim() ? `importe indicado: ${manualEuroTotal} EUR` : `cambio ${activeFx?.date}: ${activeFx?.rate} EUR/${currency}`}`;

        try {
            if (isSellMode && assetToSell) {
                await sellAsset(assetToSell.id, parseFloat(formData.quantity), euroPrice, formData.purchaseDate, conversionNote);
            } else if (isEditMode && editAsset) {
                // Update existing asset (Overwrite)
                await updateAsset(editAsset.id, {
                    symbol: formData.symbol.toUpperCase(),
                    name: formData.name || formData.symbol,
                    type: formData.type,
                    purchasePrice: euroPrice,
                    purchaseDate: formData.purchaseDate,
                    quantity: parseFloat(formData.quantity),
                    isin: formData.isin || undefined,
                    cashTae: formData.type === 'cash' && formData.cashTae.trim() ? Number(formData.cashTae) : undefined,
                    currency: 'EUR',
                }, {
                    assetId: editAsset.id,
                    assetSymbol: formData.symbol.toUpperCase(),
                    assetName: formData.name || formData.symbol,
                    assetType: formData.type,
                    type: 'edit',
                    date: formData.purchaseDate,
                    quantity: parseFloat(formData.quantity),
                    price: euroPrice,
                    total: euroPrice * parseFloat(formData.quantity),
                    notes: 'Edición manual de la posición' + conversionNote,
                });
            } else if (isDcaMode && dcaAsset) {
                // DCA Logic: Calculate weighted average
                const newQty = parseFloat(formData.quantity);
                const newPrice = euroPrice;
                const oldQty = dcaAsset.quantity;
                const oldAvgPrice = dcaAsset.purchasePrice;

                const totalQty = oldQty + newQty;
                // Calculate new average price: (OldVal + NewVal) / TotalQty
                const totalCost = (oldQty * oldAvgPrice) + (newQty * newPrice);
                const newAvgPrice = totalCost / totalQty;

                await updateAsset(dcaAsset.id, {
                    quantity: totalQty,
                    purchasePrice: newAvgPrice,
                    purchaseDate: dcaAsset.purchaseDate,
                }, {
                    assetId: dcaAsset.id,
                    assetSymbol: dcaAsset.symbol,
                    assetName: dcaAsset.name,
                    assetType: dcaAsset.type,
                    type: 'buy',
                    date: formData.purchaseDate,
                    quantity: newQty,
                    price: newPrice,
                    total: newQty * newPrice,
                    notes: 'Compra adicional para promediar precio' + conversionNote,
                });
            } else {
                // Add new asset
                const newAsset: Asset = {
                    id: generateId(),
                    symbol: formData.symbol.toUpperCase(),
                    name: formData.name || formData.symbol,
                    type: formData.type,
                    purchasePrice: euroPrice,
                    purchaseDate: formData.purchaseDate,
                    quantity: parseFloat(formData.quantity),
                    isin: formData.isin || undefined,
                    cashTae: formData.type === 'cash' && formData.cashTae.trim() ? Number(formData.cashTae) : undefined,
                    currentPrice: formData.type === 'cash' ? 1 : undefined,
                    previousClose: formData.type === 'cash' ? 1 : undefined,
                    currency: 'EUR',
                };
                await addAsset(newAsset, {
                    assetId: newAsset.id,
                    assetSymbol: newAsset.symbol,
                    assetName: newAsset.name,
                    assetType: newAsset.type,
                    type: 'buy',
                    date: newAsset.purchaseDate,
                    quantity: newAsset.quantity,
                    price: newAsset.purchasePrice,
                    total: newAsset.purchasePrice * newAsset.quantity,
                    notes: 'Alta inicial de la posición' + conversionNote,
                });
            }

            setSubmitSuccess(true);

            setTimeout(() => {
                returnToDashboard();
            }, 1500);
        } catch (error) {
            setErrors(prev => ({ ...prev, save: error instanceof Error ? error.message : 'No se pudieron guardar los cambios.' }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const assetTypes: { value: AssetType; label: string }[] = [
        { value: 'stock', label: 'Acción' },
        { value: 'etf', label: 'ETF' },
        { value: 'fund', label: 'Fondo' },
        { value: 'crypto', label: 'Crypto' },
        { value: 'cash', label: 'Liquidez / efectivo' },
    ];

    const operationTotal = (parseFloat(formData.purchasePrice) || 0) * (parseFloat(formData.quantity) || 0);

    if (submitSuccess) {
        return (
            <div className="add-investment add-investment--success">
                <Card className="success-card">
                    <CardContent>
                        <div className="success-content">
                            <div className="success-content__icon">
                                <Check size={48} />
                            </div>
                            <h2>
                                {isEditMode ? '¡Activo Actualizado!' :
                                    isDcaMode ? '¡Compra Añadida!' : isSellMode ? '¡Venta registrada!' : '¡Inversión Añadida!'}
                            </h2>
                            <p>{formData.name || formData.symbol} se ha {isEditMode ? 'actualizado' :
                                (isDcaMode ? 'promediado' : isSellMode ? 'actualizado tras la venta' : 'añadido')} correctamente</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const getPageTitle = () => {
        if (isEditMode) return "Editar Inversión";
        if (isDcaMode) return "Añadir Compra (DCA)";
        if (isSellMode) return "Registrar Venta";
        return "Añadir Inversión";
    };

    const getPageSubtitle = () => {
        if (isEditMode) return "Modifica los datos de tu inversión";
        if (isDcaMode) return "Promedia tu precio de compra añadiendo más cantidad";
        if (isSellMode) return "Registra una venta parcial o cierra la posición";
        return "Introduce los datos de tu nueva inversión";
    };

    return (
        <div className="add-investment">
            <div className="add-investment__header">
                <Button
                    variant="ghost"
                    onClick={returnToDashboard}
                    icon={<ArrowLeft size={18} />}
                >
                    Volver
                </Button>
            </div>

            <Card className="add-investment__form-card">
                <CardHeader
                    title={getPageTitle()}
                    subtitle={getPageSubtitle()}
                />
                <CardContent>
                    <form onSubmit={handleSubmit} className="add-investment__form">
                        {!apiEnabled && (
                            <div className="manual-mode-badge">
                                <Wrench size={16} />
                                <span>
                                    Las APIs estan desactivadas. Esta pantalla funciona en modo manual mientras el dashboard sigue en construccion.
                                </span>
                            </div>
                        )}

                        {/* DCA Current Position Info */}
                        {isDcaMode && dcaAsset && (
                            <div className="dca-info-box" style={{
                                background: 'var(--bg-tertiary)',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1.5rem',
                                borderLeft: '4px solid var(--accent-primary)'
                            }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <TrendingUp size={16} color="var(--accent-primary)" />
                                    Posición Actual
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Cantidad Total</span>
                                        <p style={{ fontWeight: '600', fontSize: '1.125rem' }}>{dcaAsset.quantity}</p>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Precio Medio</span>
                                        <p style={{ fontWeight: '600', fontSize: '1.125rem' }}>{dcaAsset.purchasePrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 6 })}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Symbol / ISIN Search */}
                        <div className="form-group form-group--search">
                            <label className="form-label">Busca el activo</label>
                            <p className="form-hint">Escribe el nombre, ticker o ISIN. Te mostraremos coincidencias mientras escribes.</p>
                            <div className="search-container">
                                <Input
                                    placeholder="Apple, AAPL, Fidelity, IE00BYX5NX33…"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    icon={<Search size={18} />}
                                    error={errors.symbol}
                                    disabled={isEditMode || isDcaMode || isSellMode}
                                    autoComplete="off"
                                    role="combobox"
                                    aria-expanded={showResults}
                                    aria-controls="investment-search-results"
                                />
                                {showResults && searchResults.length > 0 && (
                                    <ul id="investment-search-results" className="search-results" role="listbox">
                                        {searchResults.map((result, index) => (
                                            <li
                                                key={result.symbol}
                                                className={`search-results__item ${index === highlightedResult ? 'search-results__item--active' : ''}`}
                                                role="option"
                                                aria-selected={index === highlightedResult}
                                                onMouseEnter={() => setHighlightedResult(index)}
                                                onMouseDown={(event) => event.preventDefault()}
                                                onPointerDown={(event) => event.preventDefault()}
                                                onClick={() => void handleSelectResult(result)}
                                            >
                                                <span className="search-results__identity">
                                                    <strong className="search-results__symbol">{result.symbol}</strong>
                                                    <span className="search-results__name">{result.name}</span>
                                                </span>
                                                <span className="search-results__type">{assetTypes.find((type) => type.value === result.type)?.label || result.type}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {isSearching && (
                                    <div className="search-loading"><Loader2 size={16} className="search-loading__spinner" /> Buscando coincidencias…</div>
                                )}
                                {/* No results found - show manual entry option */}
                                {!manualMode && !isSearching && searchQuery.trim().length >= 1 && !targetAsset && (
                                    <div className="no-results">
                                        <AlertCircle size={18} />
                                        <div className="no-results__text">
                                            <p>{noResultsFound ? `No se encontró "${searchQuery}"` : '¿Quieres registrar un activo o una cuenta manualmente?'}</p>
                                            <span>
                                                {isISIN(searchQuery)
                                                    ? 'ISIN no encontrado en la base de datos, pero puedes añadirlo manualmente.'
                                                    : 'Puedes añadir este activo manualmente.'}
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleManualEntry}
                                            icon={<Edit3 size={14} />}
                                        >
                                            Añadir manualmente
                                        </Button>
                                    </div>
                                )}
                            </div>
                            {/* Selected asset indicator */}
                            {formData.name && !manualMode && (
                                <div className="selected-asset">
                                    <Check size={17} />
                                    <span className="selected-asset__content">
                                        <strong className="selected-asset__symbol">{formData.symbol}</strong>
                                        <span className="selected-asset__name">{formData.name}</span>
                                    </span>
                                    <span className="selected-asset__type">
                                        {assetTypes.find((type) => type.value === formData.type)?.label || formData.type}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Name field - only shown in manual mode */}
                        {manualMode && (
                            <div className="form-group">
                                <Input
                                    label="Nombre del activo"
                                    placeholder="Ej: Fidelity MSCI World Index Fund"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    error={errors.name}
                                    disabled={isDcaMode} // Disable name edit in DCA mode
                                />
                            </div>
                        )}

                        {manualMode && <div className="form-group">
                            <label className="form-label" htmlFor="asset-type">Tipo de activo</label>
                            <select id="asset-type" className="input" value={formData.type} disabled={isDcaMode || isSellMode}
                                onChange={event => handleInputChange('type', event.target.value)}>
                                {assetTypes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                            </select>
                        </div>}

                        {/* Current Price Display */}
                        {(currentPrice !== null || loadingPrice) && !manualMode && (
                            <div className="current-price-banner">
                                <div className="current-price-banner__label">Cotización de referencia</div>
                                <div className="current-price-banner__value">
                                    {loadingPrice ? <><Loader2 size={16} className="search-loading__spinner" /> Consultando…</> : `${currentPrice?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} EUR`}
                                </div>
                            </div>
                        )}

                        {priceLookupFailed && !loadingPrice && (
                            <div className="quote-warning" role="status">
                                <AlertCircle size={16} /> No se pudo obtener la cotización ahora. Puedes introducir el precio manualmente.
                            </div>
                        )}

                        {/* Price, Quantity, Date in row */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="operation-currency">Divisa del precio de la operación</label>
                            <select className="input" id="operation-currency" value={currency} disabled={formData.type === 'cash' || isSubmitting}
                                onChange={e => handleCurrencyChange(e.target.value)}>
                                {OPERATION_CURRENCIES.map(code => <option key={code} value={code}>{code}</option>)}
                            </select>
                            <p className="form-hint">La cartera se contabiliza en euros. La liquidez se registra en EUR.</p>
                        </div>
                        {isSellMode && assetToSell && (
                            <p className="position-availability">Disponible para vender: <strong>{assetToSell.quantity}</strong> participaciones</p>
                        )}
                        <div className="form-row">
                            <div className="form-group">
                                <Input
                                    label={`${isSellMode ? 'Precio de venta' : 'Precio de compra'} (${currency})`}
                                    type="number"
                                    step="0.000001"
                                    min="0"
                                    placeholder="0.000000"
                                    value={formData.purchasePrice}
                                    disabled={formData.type === 'cash'}
                                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                                    icon={<Coins size={18} />}
                                    error={errors.purchasePrice}
                                />
                            </div>

                            <div className="form-group">
                                <Input
                                    label={formData.type === 'cash' ? 'Saldo en euros' : isDcaMode ? 'Nueva cantidad' : isSellMode ? 'Cantidad a vender' : 'Cantidad'}
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    max={isSellMode ? assetToSell?.quantity : undefined}
                                    placeholder="0"
                                    value={formData.quantity}
                                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                                    icon={<Hash size={18} />}
                                    error={errors.quantity}
                                />
                            </div>

                            <div className="form-group">
                                <Input
                                    label={isSellMode ? 'Fecha de venta' : 'Fecha de compra'}
                                    type="date"
                                    value={formData.purchaseDate}
                                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                                    error={errors.purchaseDate}
                                />
                            </div>
                        </div>

                        {formData.type === 'cash' && !isSellMode && !isDcaMode && <div className="form-group">
                            <Input label="TAE de la cuenta (%)" type="number" min="0" step="any" placeholder="Ej. 2,5" value={formData.cashTae}
                                onChange={event => handleInputChange('cashTae', event.target.value)} error={errors.cashTae} />
                            <p className="form-hint">Opcional. Indica 0 % si no está remunerada. El saldo cambia cuando registres los intereses abonados.</p>
                        </div>}

                        {currency !== 'EUR' && (
                            <div className="form-group">
                                <p className="form-hint" role="status">{activeFx?.loading ? 'Consultando el cambio histórico…' : activeFx?.rate
                                    ? `Cambio de cierre del ${activeFx.date}: 1 ${currency} = ${activeFx.rate} EUR. Es una estimación, no el cambio aplicado por tu bróker.`
                                    : 'No hay cambio histórico disponible. Introduce el importe real en euros para guardar.'}</p>
                                <Input label={isSellMode ? 'Importe recibido en euros (sin comisiones)' : 'Importe pagado en euros (sin comisiones)'}
                                    type="number" min="0" step="any" value={manualEuroTotal}
                                    placeholder="Opcional si hay cambio histórico" onChange={e => setManualEuroTotal(e.target.value)} />
                                <p className="form-hint">Este importe sustituye la estimación. Si editas un precio medio, indica el coste total de la posición en euros.</p>
                                {Number.isFinite(euroPrice) && <p className="form-hint">Importe contabilizado: {(euroPrice * Number(formData.quantity)).toLocaleString('es-ES', { maximumFractionDigits: 2 })} EUR</p>}
                            </div>
                        )}
                        {operationTotal > 0 && (
                            <div className="operation-total" aria-live="polite">
                                <span>{isSellMode ? 'Importe estimado de la venta' : 'Importe de la operación'}</span>
                                <strong>{operationTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</strong>
                            </div>
                        )}

                        {/* Submit */}
                        {errors.save && <p role="alert">{errors.save}</p>}
                        <div className="form-actions">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={returnToDashboard}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                loading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                {isEditMode ? 'Guardar Cambios' :
                                    isDcaMode ? 'Añadir compra' : isSellMode ? 'Registrar venta' : 'Añadir inversión'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
