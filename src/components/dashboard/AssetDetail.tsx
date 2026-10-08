import { useState, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    Info,
    Clock,
    Activity,
    Coins,
    Percent,
    Layers,
    Building2,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    ReferenceArea
} from 'recharts';
import { getAssetChartData, getFundamentalData } from '../../services/apiService';
import { getFundRelevance } from '../../services/finect/finectService';
import type { FinectFundRelevance } from '../../services/finect/finectService';
import type { Asset, StockQuote, HistoricalDataPoint, TimePeriod } from '../../types/types';
import { assetPrice, assetValue, formatQuantity, hasValidPrice } from '../../services/assetValuation';
import { portfolioQuoteStatus, quoteDateLabel } from '../../services/portfolioQuoteStatus';
import { getSettings, isApiEnabled, updateSettings } from '../../services/storageService';
import { stockQuoteMarkets, selectedStockQuoteMarket } from '../../services/market/stockQuoteMarkets';
import { portfolioStorage } from '../../services/portfolioCloudStorage';
import { usePortfolio } from '../../context/PortfolioContext';
import { portfolioPositionGroups } from '../../services/portfolioPositionGroups';
import { useLocalDataVersion } from '../../hooks/useLocalDataVersion';
import { Button } from '../ui';
import { formatFundamentalMoney, formatFundamentalPercent, formatFundamentalRatio, hasFundamentals } from '../../services/market/fundamentals';
import { companyOverview } from '../../services/market/companyOverview';
import './AssetDetail.css';

interface AssetDetailProps {
    asset: Asset;
    portfolioValue?: number;
    marketOnly?: boolean;
    positionLots?: Asset[];
}

interface ChartSelection {
    start: number;
    end: number;
}

const periods: { label: string; value: TimePeriod }[] = [
    { label: '1D', value: '1D' },
    { label: '7D', value: '7D' },
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: 'YTD', value: 'YTD' },
    { label: 'Máx', value: 'ALL' },
];

/**
 * Finect exposes several performance families in the same response (for
 * example accumulated and annualized). They are useful as metrics, but they
 * are not points of the same series and drawing them together produces the
 * large artificial spikes seen in the detail modal.
 */
export function AssetDetail({ asset, portfolioValue = 0, marketOnly = false, positionLots }: AssetDetailProps) {
    useLocalDataVersion();
    const { refreshAssetPrices } = usePortfolio();
    const [marketError,setMarketError] = useState('');
    const [changingMarket,setChangingMarket] = useState(false);
    const marketChoices = stockQuoteMarkets(asset);
    const selectedMarket = selectedStockQuoteMarket(positionLots?.[0] ?? asset);
    const group = positionLots && positionLots.length>1 ? portfolioPositionGroups(positionLots)[0] : undefined;
    const changeMarket = async (id:string) => {
        const epoch=portfolioStorage.epoch;
        setChangingMarket(true);setMarketError('');
        try {
            const ids=positionLots?.map(lot=>lot.id) ?? [asset.id];
            updateSettings({stockQuoteMarkets:{...getSettings().stockQuoteMarkets,...Object.fromEntries(ids.map(assetId=>[assetId,id]))}});
            await portfolioStorage.flush();
            if(epoch!==portfolioStorage.epoch)return;
            await refreshAssetPrices(ids);
        } catch { if(epoch===portfolioStorage.epoch)setMarketError('No se pudo guardar o consultar el mercado seleccionado.'); }
        finally { if(epoch===portfolioStorage.epoch)setChangingMarket(false); }
    };
    const apiEnabled = isApiEnabled() && asset.type !== 'cash';
    const [retry, setRetry] = useState(0);
    const [fundamentalRetry, setFundamentalRetry] = useState(0);
    const [quote, setQuote] = useState<Partial<StockQuote> | null>(null);
    const [chartData, setChartData] = useState<HistoricalDataPoint[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');
    const [fundData, setFundData] = useState<FinectFundRelevance | null>(null);
    const [chartSelection, setChartSelection] = useState<ChartSelection | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const activeTouchPointersRef = useRef(new Map<number, number>());
    const assetIsin = asset.isin || (/^[A-Z]{2}[A-Z0-9]{10}$/i.test(asset.symbol) ? asset.symbol : '');
    const isFund = asset.type === 'fund' && !!assetIsin;

    // Independent loading states (Fix 16)
    const [loadingFundamentals, setLoadingFundamentals] = useState(true);
    const [loadingChart, setLoadingChart] = useState(true);

    // Fix 14: AbortController for safety
    // Effect for Fundamentals (runs once per asset change)
    useEffect(() => {
        const controller = new AbortController();
        const fetchFundamentals = async () => {
            setLoadingFundamentals(true);
            setFundData(null);
            setQuote(null);
            if (!apiEnabled) { setLoadingFundamentals(false); return; }
            try {
                if (isFund) {
                    const data = await getFundRelevance(assetIsin, controller.signal, retry > 0 || fundamentalRetry > 0);
                    if (!controller.signal.aborted) {
                        setFundData(data);
                        setQuote({
                            price: data.lastQuote?.price,
                            change: data.lastQuote?.change,
                            changePercent: data.lastQuote?.percentChange,
                            beta: data.statistics.beta?.[0]?.value,
                        });
                    }
                    return;
                }
                const data = await getFundamentalData(asset.symbol, controller.signal, asset.type === 'stock' && !companyOverview(asset.symbol));
                if (!controller.signal.aborted) {
                    setQuote(data);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error('Error fetching fundamentals:', error);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingFundamentals(false);
                }
            }
        };

        fetchFundamentals();
        return () => controller.abort();
    }, [asset.symbol, asset.type, assetIsin, isFund, apiEnabled, retry, fundamentalRetry]);

    // Effect for Chart (runs on asset or period change)
    useEffect(() => {
        const controller = new AbortController();
        const fetchChart = async () => {
            setLoadingChart(true);
            setChartData([]);
            if (!apiEnabled) { setLoadingChart(false); return; }
            try {
                const data = await getAssetChartData(isFund ? assetIsin : asset.symbol, selectedPeriod, controller.signal, { forceRefresh: retry > 0 });
                if (!controller.signal.aborted) {
                    setChartData(data);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error('Error fetching chart:', error);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingChart(false);
                }
            }
        };

        fetchChart();
        return () => controller.abort();
    }, [asset.symbol, assetIsin, isFund, selectedPeriod, apiEnabled, retry]);

    useEffect(() => {
        setChartSelection(null);
        setIsSelecting(false);
        activeTouchPointersRef.current.clear();
    }, [asset.symbol, isFund, selectedPeriod]);

    const formatValue = (value: number | undefined, type: 'currency' | 'price' | 'percent' | 'number' | 'compact' = 'number', currency = asset.currency || 'EUR') => {
        if (value === undefined || value === null || !Number.isFinite(value)) return 'N/D';

        if (type === 'currency' || type === 'price') {
            if (!/^[A-Z]{3}$/.test(currency)) return `${value.toLocaleString('es-ES', { maximumFractionDigits: 6 })} (divisa no disponible)`;
            return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: type === 'price' ? 6 : 2,
            }).format(value);
        }

        if (type === 'percent') {
            return `${value > 0 ? '+' : ''}${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
        }

        if (type === 'compact') {
            return new Intl.NumberFormat('es-ES', {
                notation: 'compact',
                maximumFractionDigits: 1
            }).format(value);
        }

        return value.toLocaleString('es-ES', { maximumFractionDigits: 6 });
    };

    const hasPreviousClose = Number.isFinite(asset.previousClose) && asset.previousClose! > 0
        && (hasValidPrice(asset) || (marketOnly && Number.isFinite(asset.currentPrice) && asset.currentPrice! >= 0));
    const priceChange = hasPreviousClose ? asset.currentPrice! - asset.previousClose! : 0;
    const priceChangePercent = hasPreviousClose ? (priceChange / asset.previousClose!) * 100 : 0;
    const investedValue = asset.purchasePrice * asset.quantity;
    const currentValue = assetValue(asset);
    const positionGain = currentValue - investedValue;
    const positionReturn = investedValue > 0 && hasValidPrice(asset) && !group?.estimatedCount ? (positionGain / investedValue) * 100 : NaN;
    const portfolioWeight = portfolioValue > 0 ? (currentValue / portfolioValue) * 100 : 0;
    const quoteStatus = portfolioQuoteStatus(asset, Date.now());

    // Type-aware rendering (Fix 17)
    const getRelevance = (category: string) => {
        if (asset.type === 'crypto') return category === 'Técnico' || category === 'Riesgo';
        if (asset.type === 'fund') return category === 'Valoración' || category === 'Riesgo' || category === 'Técnico';
        return true; // Stocks show everything
    };

    const metricItems = [
        { label: 'P/E Ratio', value: formatFundamentalRatio(quote?.pe), field:'pe', icon: <Activity size={16} />, category: 'Valoración' },
        { label: 'Forward P/E', value: formatFundamentalRatio(quote?.forwardPe), icon: <Clock size={16} />, category: 'Valoración' },
        { label: 'P/S Ratio', value: formatFundamentalRatio(quote?.ps), field:'ps', icon: <BarChart3 size={16} />, category: 'Valoración' },
        { label: 'P/B Ratio', value: formatFundamentalRatio(quote?.pb), field:'pb', icon: <Layers size={16} />, category: 'Valoración' },
        { label: 'Rent. dividendo', value: formatFundamentalPercent(quote?.dividendYield), icon: <Percent size={16} />, category: 'Dividendos' },
        { label: 'Dividendo por acción', value: formatFundamentalMoney(quote?.dividendRate, quote?.dividendCurrency || quote?.currency), icon: <Coins size={16} />, category: 'Dividendos' },
        { label: 'EBITDA (12 meses)', value: formatFundamentalMoney(quote?.ebitda, quote?.financialCurrency, true), field:'ebitda', icon: <BarChart3 size={16} />, category: 'Resultados' },
        { label: 'EV/EBITDA', value: formatFundamentalRatio(quote?.evToEbitda), field:'evToEbitda', icon: <Activity size={16} />, category: 'Valoración' },
        { label: 'Crecim. Ingresos', value: formatFundamentalPercent(quote?.revenueGrowth, true), field:'revenueGrowth', icon: <TrendingUp size={16} />, category: 'Resultados' },
        { label: 'Margen Beneficio', value: formatFundamentalPercent(quote?.profitMargin), field:'profitMargin', icon: <Activity size={16} />, category: 'Resultados' },
        { label: 'ROE', value: formatFundamentalPercent(quote?.roe), field:'roe', icon: <Activity size={16} />, category: 'Rentabilidad' },
        { label: 'Deuda/patrimonio', value: formatFundamentalPercent(quote?.debtToEquity), field:'debtToEquity', icon: <Layers size={16} />, category: 'Salud Financiera' },
        { label: 'Beta', value: formatFundamentalRatio(quote?.beta), icon: <Activity size={16} />, category: 'Riesgo' },
        { label: 'BPA (12 meses)', value: formatFundamentalMoney(quote?.eps, quote?.epsCurrency), field:'eps', icon: <Coins size={16} />, category: 'Resultados' },
        { label: 'Capitalización', value: formatFundamentalMoney(quote?.marketCap, quote?.marketCapCurrency || quote?.currency, true), icon: <Coins size={16} />, category: 'Valoración' },
        { label: 'Max (52 sem)', value: formatFundamentalMoney(quote?.fiftyTwoWeekHigh, quote?.currency), icon: <ArrowUpRight size={16} />, category: 'Técnico' },
        { label: 'Min (52 sem)', value: formatFundamentalMoney(quote?.fiftyTwoWeekLow, quote?.currency), icon: <ArrowDownRight size={16} />, category: 'Técnico' },
    ].filter(item => getRelevance(item.category)).map(item=>({...item,
        asOf:item.field ? quote?.fundamentalDates?.[item.field] : undefined,
        derived:item.field ? quote?.fundamentalDerived?.[item.field] : undefined,
    }));

    const fundMetricItems = [
        { label: 'Categoría', value: fundData?.category || 'Fondo de inversión', icon: <Layers size={16} />, category: 'Fondo' },
        { label: 'Gestora', value: fundData?.manager || 'N/D', icon: <Info size={16} />, category: 'Fondo' },
        { label: 'ISIN', value: assetIsin || 'N/D', icon: <Activity size={16} />, category: 'Identificación' },
        { label: 'Riesgo SRRI', value: fundData?.srri ? `${fundData.srri} / 7` : 'N/D', icon: <Activity size={16} />, category: 'Riesgo' },
        { label: 'Gastos corrientes', value: fundData?.fees.ongoing !== undefined ? `${fundData.fees.ongoing.toFixed(2)}%` : 'N/D', icon: <Percent size={16} />, category: 'Costes' },
        { label: 'TER', value: fundData?.fees.totalExpenseRatio !== undefined ? `${fundData.fees.totalExpenseRatio.toFixed(2)}%` : 'N/D', icon: <Percent size={16} />, category: 'Costes' },
        { label: 'Inversión mínima', value: formatValue(fundData?.minimumInvestment, 'currency'), icon: <Coins size={16} />, category: 'Operativa' },
        { label: 'Rating Morningstar', value: fundData?.morningstarRating ? `${fundData.morningstarRating} / 5` : 'N/D', icon: <Activity size={16} />, category: 'Calidad' },
        { label: 'Patrimonio', value: formatValue(fundData?.totalNetAsset, 'compact'), icon: <BarChart3 size={16} />, category: 'Tamaño' },
        { label: 'Fecha de lanzamiento', value: fundData?.availableDate || 'N/D', icon: <Clock size={16} />, category: 'Fondo' },
        { label: 'Gestión indexada', value: fundData?.indexed === undefined ? 'N/D' : fundData.indexed ? 'Sí' : 'No', icon: <Layers size={16} />, category: 'Fondo' },
        { label: 'Puntuación Finect', value: fundData?.finectScore !== undefined ? formatValue(fundData.finectScore) : 'N/D', icon: <Activity size={16} />, category: 'Calidad' },
        ...Object.entries(fundData?.fees || {}).filter(([key, value]) => !['ongoing', 'totalExpenseRatio'].includes(key) && value !== undefined).map(([key, value]) => ({
            label: ({ management: 'Comisión de gestión', entry: 'Comisión de entrada', redemption: 'Comisión de reembolso', custody: 'Comisión de custodia', success: 'Comisión de éxito' } as Record<string, string>)[key] || key,
            value: Number(value).toFixed(2) + '%',
            icon: <Percent size={16} />,
            category: 'Costes',
        })),
        ...(fundData?.performance || []).filter(point => Number.isFinite(point.value)).slice(0, 8).map(point => ({
            label: 'Rentabilidad ' + point.period,
            value: formatValue(point.value, 'percent'),
            icon: <TrendingUp size={16} />,
            category: point.type || 'Rentabilidad',
        })),
        ...Object.entries(fundData?.statistics || {}).flatMap(([key, points]) => points.slice(0, 1).map(point => ({
            label: ({ maxDrawdown: 'Máximo drawdown', standardDeviation: 'Volatilidad', alpha: 'Alpha', beta: 'Beta', sharpeRatio: 'Ratio Sharpe', trackingError: 'Tracking error', correlation: 'Correlación', informationRatio: 'Information ratio', r2: 'R²' } as Record<string, string>)[key] || key,
            value: formatValue(point.value),
            icon: <Activity size={16} />,
            category: point.period,
        }))),
    ];

    const visibleMetricItems = isFund ? fundMetricItems : hasFundamentals(quote || {}) ? metricItems : [];
    const company = asset.type === 'stock' ? companyOverview(asset.symbol, quote?.businessDescription) : undefined;
    const canDrawChart = !loadingChart && chartData.length > 1;
    const chartPeriodStart = chartData[0];
    const chartPeriodEnd = chartData.at(-1);
    const chartPeriodReturn = chartPeriodStart?.close && chartPeriodEnd?.close
        ? ((chartPeriodEnd.close - chartPeriodStart.close) / chartPeriodStart.close) * 100
        : null;
    const selectedStart = chartSelection ? chartData[chartSelection.start] : undefined;
    const selectedEnd = chartSelection ? chartData[chartSelection.end] : undefined;
    const selectedStartValue = selectedStart?.close;
    const selectedEndValue = selectedEnd?.close;
    const selectedChange = selectedStartValue !== undefined && selectedEndValue !== undefined && selectedStartValue !== 0
        ? ((selectedEndValue - selectedStartValue) / Math.abs(selectedStartValue)) * 100
        : null;
    const selectionLeft = chartSelection ? Math.min(chartSelection.start, chartSelection.end) : null;
    const selectionRight = chartSelection ? Math.max(chartSelection.start, chartSelection.end) : null;
   const formatSelectionValue = (value: number | undefined) => {
       if (value === undefined) return 'N/D';
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: chartData[0]?.currency && chartData[0].currency !== 'Unknown' ? chartData[0].currency : asset.currency || 'EUR',
            maximumFractionDigits: 6,
        }).format(value);
    };
    const getChartIndexAtClientX = (clientX: number): number | null => {
        const rect = chartContainerRef.current?.getBoundingClientRect();
        if (!rect || chartData.length < 2) return null;

        // Keep the pointer mapping inside the plot area (the chart reserves
        // room for the Y axis and the right margin).
        const plotLeft = isFund ? 52 : 44;
        const plotRight = 10;
        const plotWidth = Math.max(rect.width - plotLeft - plotRight, 1);
        const relativeX = Math.min(Math.max(clientX - rect.left - plotLeft, 0), plotWidth);
        return Math.min(chartData.length - 1, Math.max(0, Math.round((relativeX / plotWidth) * (chartData.length - 1))));
    };
    const handlePointerStart = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!canDrawChart) return;
        if (event.pointerType === 'touch') {
            activeTouchPointersRef.current.set(event.pointerId, event.clientX);
            if (activeTouchPointersRef.current.size < 2) return;
            event.preventDefault();
            const indices = [...activeTouchPointersRef.current.values()]
                .map((clientX) => getChartIndexAtClientX(clientX))
                .filter((index): index is number => index !== null);
            if (indices.length === 2) {
                setChartSelection({ start: indices[0], end: indices[1] });
                setIsSelecting(true);
            }
            event.currentTarget.setPointerCapture(event.pointerId);
            return;
        }
        event.preventDefault();
        const index = getChartIndexAtClientX(event.clientX);
        if (index === null) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setChartSelection({ start: index, end: index });
        setIsSelecting(true);
    };
    const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType === 'touch') {
            if (!activeTouchPointersRef.current.has(event.pointerId)) return;
            activeTouchPointersRef.current.set(event.pointerId, event.clientX);
            if (activeTouchPointersRef.current.size < 2 || !isSelecting) return;
            event.preventDefault();
            const indices = [...activeTouchPointersRef.current.values()]
                .map((clientX) => getChartIndexAtClientX(clientX))
                .filter((index): index is number => index !== null);
            if (indices.length === 2) setChartSelection({ start: indices[0], end: indices[1] });
            return;
        }
        if (!isSelecting) return;
        const index = getChartIndexAtClientX(event.clientX);
        if (index === null) return;
        event.preventDefault();
        setChartSelection((current) => current ? { ...current, end: index } : current);
    };
    const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType === 'touch') {
            activeTouchPointersRef.current.delete(event.pointerId);
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
            }
            if (activeTouchPointersRef.current.size < 2) setIsSelecting(false);
            return;
        }
        if (!isSelecting) return;
        const index = getChartIndexAtClientX(event.clientX);
        if (index !== null) {
            setChartSelection((current) => current ? { ...current, end: index } : current);
        }
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        setIsSelecting(false);
    };
    const formatChartTick = (value: string) => {
        if (selectedPeriod === '1D' || value.includes(':')) return value;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    };
    const formatChartAxisValue = (value: number) => new Intl.NumberFormat('es-ES', {
        maximumFractionDigits: Math.abs(value) < 0.01 ? 6 : Math.abs(value) < 1 ? 4 : Math.abs(value) < 10 ? 3 : 2,
        notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
    }).format(value);

    return (
        <div className={`asset-detail ${isFund ? 'asset-detail--fund' : ''}`}>
            {/* Header info - Always visible (from props) */}
            <div className="asset-detail__header">
                <div className="asset-detail__title-group">
                    <h2 className="asset-detail__symbol">{asset.symbol}</h2>
                    <p className="asset-detail__name">{asset.name}</p>
                </div>
                <div className="asset-detail__price-group">
                    <div className="asset-detail__price">
                        {formatValue(group?.estimatedCount ? undefined : marketOnly ? asset.currentPrice : assetPrice(asset), 'price')}
                    </div>
                    <div className={`asset-detail__change ${hasPreviousClose ? priceChange >= 0 ? 'positive' : 'negative' : ''}`}>
                        {hasPreviousClose ? <>{priceChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            {formatValue(priceChange, 'price')} ({formatValue(priceChangePercent, 'percent')})</> : 'Cambio diario no disponible'}
                    </div>
                </div>
            </div>

            {group && <p className="asset-detail__group-note">Posición agrupada · {group.lots.length} registros{group.estimatedCount?' · incluye valoraciones estimadas':group.mixedPrices?' · precio medio de valoración':''}.</p>}
            {!marketOnly && <div className="asset-detail__position-grid">
                <div><span>Cantidad</span><strong>{formatQuantity(asset)}</strong></div>
                <div><span>Precio medio</span><strong>{formatValue(asset.purchasePrice, 'price')}</strong></div>
                <div><span>Capital invertido</span><strong>{formatValue(investedValue, 'currency')}</strong></div>
                <div><span>Valor actual</span><strong>{formatValue(currentValue, 'currency')}</strong></div>
                <div><span>Resultado</span><strong className={positionGain >= 0 ? 'positive' : 'negative'}>{formatValue(positionGain, 'currency')}</strong></div>
                <div><span>Rentabilidad</span><strong className={positionReturn >= 0 ? 'positive' : 'negative'}>{formatValue(positionReturn, 'percent')}</strong></div>
                <div><span>Peso en cartera</span><strong>{portfolioWeight.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</strong></div>
                <div><span>Consulta al proveedor</span><strong>{quoteDateLabel(asset.lastCheckedAt)}</strong></div>
                <div><span>Lectura en la app</span><strong>{quoteDateLabel(asset.lastReadAt)}</strong></div>
                <div><span>Origen</span><strong>{asset.quoteSource || 'No disponible'}{asset.quoteSource==='Google Finance' && marketChoices.length>1 ? ' · Madrid/BME' : ''}{asset.quoteOrigin === 'batch' ? ' · batch' : ''}</strong></div>
                <div><span>{group?.mixedDates?'Fechas de valoración':'Fecha del precio'}</span><strong>{group?.mixedDates?'Ver registros individuales':quoteDateLabel(asset.quotedAt || asset.lastQuoteAt)}</strong></div>
            </div>}
            {!marketOnly && marketChoices.length>1 && <div className="asset-detail__quote-market">
                <label htmlFor={`quote-market-${asset.id}`}>Mercado de cotización</label>
                <select id={`quote-market-${asset.id}`} value={selectedMarket?.id ?? 'original'} disabled={changingMarket}
                    onChange={event=>void changeMarket(event.target.value)}>
                    {marketChoices.map(market=><option key={market.id} value={market.id}>{market.label}</option>)}
                </select>
                <p>Elige el mercado de tu compra. Las cotizaciones de otras bolsas pueden diferir.</p>
                {changingMarket && <p role="status">Consultando el mercado seleccionado…</p>}
                {selectedMarket?.id==='BME' && asset.quoteSource!=='Google Finance' && !changingMarket && <p role="status">Consulta de Madrid pendiente. El precio visible conserva su origen anterior.</p>}
                {marketError && <p role="alert">{marketError}</p>}
            </div>}
            {!marketOnly && asset.originalCurrency && asset.originalCurrency!=='EUR' && <details className="dashboard__update-details">
                <summary>Conversión a euros</summary>
                <p>Precio original: {asset.originalPrice?.toLocaleString('es-ES')} {asset.originalUnit || asset.originalCurrency}. Cambio: {asset.fxRate?.toLocaleString('es-ES')} EUR/{asset.originalCurrency} · {quoteDateLabel(asset.fxAt || undefined)}. Se usa el cambio del día del precio.</p>
            </details>}
            {marketOnly && <p>Fecha del precio: {quoteDateLabel(asset.quotedAt || asset.lastQuoteAt)} · Consulta al proveedor: {quoteDateLabel(asset.lastCheckedAt)}</p>}
            {asset.type !== 'cash' && (quoteStatus.stalePrice || quoteStatus.unknownPriceDate || quoteStatus.futurePrice) && <p role="status">{quoteStatus.futurePrice ? 'La fecha del precio está en el futuro; se necesita una cotización válida.' : quoteStatus.stalePrice ? 'El último precio disponible está atrasado; una consulta reciente no implica una cotización nueva.' : 'El proveedor no identifica la fecha del precio; su antigüedad no puede verificarse.'}</p>}

            {/* Chart Section */}
            {!marketOnly && !hasValidPrice(asset) && <p role="status">Valor estimado al coste: no hay una cotización válida.</p>}
            {!apiEnabled && <p role="status">{asset.type === 'cash' ? 'Saldo de liquidez registrado; no requiere consultas de mercado.' : 'Consultas externas desactivadas. Los datos de tu posición siguen disponibles.'}</p>}
            <div className="asset-detail__chart-section">
                <div className="asset-detail__chart-header">
                    <div className="asset-detail__chart-title">
                        <TrendingUp size={18} />
                        {isFund ? 'Precio de participación' : 'Histórico de precio'}
                    </div>
                    <div className="asset-detail__period-selector">
                        {periods.map((p) => (
                            <button
                                key={p.value}
                                type="button" aria-pressed={selectedPeriod === p.value}
                                className={`period-btn ${selectedPeriod === p.value ? 'active' : ''}`}
                                onClick={() => setSelectedPeriod(p.value)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="asset-detail__period-performance" aria-live="polite">
                    <span>Variación del precio {selectedPeriod === 'ALL' ? 'histórica' : selectedPeriod}</span>
                    <strong className={chartPeriodReturn !== null && chartPeriodReturn < 0 ? 'negative' : 'positive'}>
                        {canDrawChart && chartPeriodReturn !== null ? `${chartPeriodReturn >= 0 ? '+' : ''}${chartPeriodReturn.toFixed(2)}%` : 'N/D'}
                    </strong>
                    {canDrawChart && chartPeriodStart && chartPeriodEnd && <small>{chartPeriodStart.date} → {chartPeriodEnd.date}</small>}
                </div>

                <div
                    ref={chartContainerRef}
                    className="asset-detail__chart-container"
                    onPointerDown={handlePointerStart}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerEnd}
                    onPointerCancel={handlePointerEnd}
                >
                    {loadingChart && <div className="chart-overlay"><div className="spinner-sm" /><span>Preparando histórico…</span></div>}
                    {!loadingChart && chartData.length < 2 && (
                        <div className="chart-overlay error-state">
                            <p>{!apiEnabled ? 'Consulta de histórico desactivada.' : chartData.length === 1 ? 'Recopilando datos del histórico…' : 'Datos históricos no disponibles.'}</p>
                            <small>{!apiEnabled ? 'No se han realizado llamadas al proveedor.' : chartData.length === 1 ? 'Necesitamos al menos dos cotizaciones para dibujar la evolución.' : 'El proveedor no ha devuelto un histórico utilizable para este periodo.'}</small>
                            {apiEnabled && <Button variant="secondary" icon={<RefreshCw size={16} />} type="button" onClick={() => setRetry(n => n + 1)}>Reintentar consulta</Button>}
                        </div>
                    )}
                    {canDrawChart && <ResponsiveContainer width="100%" height={240}>
                        <AreaChart
                            data={chartData}
                    margin={{ top: 10, right: 8, left: 0, bottom: 4 }}
                        >
                            <defs>
                                <linearGradient id="assetColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#71717a"
                                fontSize={11}
                                tickLine={{ stroke: '#52525b' }}
                                axisLine={{ stroke: '#52525b' }}
                                tickFormatter={formatChartTick}
                                minTickGap={28}
                            />
                            <YAxis
                                stroke="#71717a"
                                fontSize={11}
                                tickLine={{ stroke: '#52525b' }}
                                axisLine={{ stroke: '#52525b' }}
                                tickFormatter={formatChartAxisValue}
                                width={64}
                                tickMargin={0}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                                itemStyle={{ color: 'var(--accent-primary)' }}
                                labelStyle={{ marginBottom: '4px', fontWeight: 'bold' }}
                               formatter={(value: number | string | undefined) => [
                                   value !== undefined && value !== null
                                        ? formatSelectionValue(Number(value))
                                       : 'N/A',
                                    isFund ? 'Precio participación' : 'Precio'
                                ]}
                            />
                            {selectionLeft !== null && selectionRight !== null && selectionLeft !== selectionRight && (
                                <ReferenceArea
                                    x1={chartData[selectionLeft]?.date}
                                    x2={chartData[selectionRight]?.date}
                                    fill="var(--accent-primary)"
                                    fillOpacity={0.12}
                                    stroke="var(--accent-primary)"
                                    strokeOpacity={0.45}
                                />
                            )}
                            <Area
                                type="monotone"
                                dataKey="close"
                                stroke="var(--accent-primary)"
                                fillOpacity={1}
                                fill="url(#assetColor)"
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>}
                </div>
                {canDrawChart && (
                    <div className={`asset-detail__chart-selection ${selectedChange !== null ? (selectedChange >= 0 ? 'positive' : 'negative') : ''}`}>
                        {selectedChange !== null && selectedStart && selectedEnd ? (
                            <>
                                <strong>{selectedChange >= 0 ? 'Mejora' : 'Drawdown'} {selectedChange >= 0 ? '+' : ''}{selectedChange.toFixed(2)}%</strong>
                                <span>{selectedStart.date} ({formatSelectionValue(selectedStartValue)}) → {selectedEnd.date} ({formatSelectionValue(selectedEndValue)})</span>
                                <button type="button" onClick={() => setChartSelection(null)} aria-label="Limpiar selección">Limpiar</button>
                            </>
                        ) : (
                            <span>Ordenador: arrastra. Móvil: coloca dos dedos sobre los puntos para medir la mejora o el drawdown.</span>
                        )}
                    </div>
                )}
                <div className="asset-detail__chart-legend">
                    <span><i className="asset-detail__legend-line" /> {isFund ? 'Precio participación' : 'Precio'}</span>
                    <span className="asset-detail__chart-axis-hint">Eje vertical: {chartData[0]?.currency || asset.currency || 'EUR'} · Eje horizontal: fecha. {marketOnly ? 'Histórico en su divisa de origen.' : `Histórico en su divisa de origen; la posición se valora en ${asset.currency || 'EUR'}.`}</span>
                </div>
               {!isFund && chartData[0]?.sourceSymbol && chartData[0].sourceSymbol !== asset.symbol && <p className="asset-detail__chart-source">
                   Histórico de {chartData[0].sourceSymbol}, cotización alternativa de la misma empresa. El precio de tu posición se consulta en {selectedMarket?.label ?? asset.symbol}.
               </p>}
               {isFund && (
                   <p className="asset-detail__chart-source">
                       {chartData[0]?.sourceSymbol ? `Histórico Yahoo · ${chartData[0].sourceSymbol}. ` : ''}
                       Clase identificada por ISIN. Finect aporta la ficha y la última valoración.
                   </p>
               )}
           </div>

            {asset.type === 'stock' && (
                <section className="asset-detail__company" aria-label="Sobre la empresa">
                    <h3 className="section-title"><Building2 size={18} />Sobre la empresa</h3>
                    <p>{company?.description || (loadingFundamentals ? 'Cargando descripción…' : 'Descripción no disponible.')}</p>
                    {company && <a href={company.url} target="_blank" rel="noopener noreferrer">Fuente: {company.source}</a>}
                </section>
            )}

            {/* Metrics Grid */}
            <div className="asset-detail__metrics-section">
                <h3 className="section-title">
                    <BarChart3 size={18} />
                    Métricas Clave
                </h3>
                {loadingFundamentals ? (
                    <div className="metrics-loading">
                        <div className="spinner-sm" />
                        <p>Cargando datos fundamentales...</p>
                    </div>
                ) : (
                    <div className="metrics-grid">
                        {visibleMetricItems.length === 0 && (
                            <div className="metrics-empty">{apiEnabled ? 'Datos ampliados no disponibles.' : 'Consulta de datos desactivada.'}</div>
                        )}
                        {visibleMetricItems.map((item, idx) => (
                            <div key={idx} className="metric-card">
                                <div className="metric-card__header">
                                    <span className="metric-card__icon">{item.icon}</span>
                                    <span className="metric-card__label">{item.label}</span>
                                </div>
                                <div className="metric-card__value">{item.value}</div>
                                <div className="metric-card__category">{item.category}</div>
                                {'asOf' in item && typeof item.asOf==='string' && <small className="asset-detail__metric-date">{'derived' in item && item.derived===true ? 'Calculado · ' : ''}{item.asOf}</small>}
                            </div>
                        ))}
                    </div>
                )}
                {!isFund && !loadingFundamentals && <div className="asset-detail__metrics-note">
                    <small>N/D: dato no disponible.{quote?.fundamentalsSymbol && quote.fundamentalsSymbol!==asset.symbol.toUpperCase() && ` Financieros de ${quote.fundamentalsSymbol}, misma acción.`}</small>
                    {apiEnabled && <Button variant="secondary" size="sm" type="button" onClick={() => setFundamentalRetry(n => n + 1)}>Reintentar datos</Button>}
                </div>}
            </div>

            {isFund && fundData && (
                <div className="asset-detail__fund-sections">
                    {(fundData.description || fundData.strategy) && <section><h3>Política de inversión</h3><p>{fundData.strategy || fundData.description}</p></section>}
                    {!!fundData.benchmarks.length && <section><h3>Índices de referencia</h3><p>{fundData.benchmarks.join(' · ')}</p></section>}
                    {!!fundData.holdings.length && <section><h3>Principales posiciones</h3><div className="asset-detail__holding-list">{fundData.holdings.slice(0, 10).map(item => <div key={item.name}><span>{item.name}</span><strong>{item.weight.toFixed(2)}%</strong></div>)}</div></section>}
                    {fundData.breakdowns.map(group => <section key={group.type}><h3>{group.type}</h3><div className="asset-detail__holding-list">{group.items.slice(0, 10).map(item => <div key={item.label}><span>{item.label}</span><strong>{item.value.toFixed(2)}%</strong></div>)}</div></section>)}
                </div>
            )}

            <div className="asset-detail__footer">
                <Info size={14} />
                <p>{isFund ? 'Ficha obtenida de Finect e histórico de mercado de la clase encontrada por ISIN.' : 'Datos de Yahoo Finance. Los financieros corresponden al último periodo publicado.'}</p>
            </div>
        </div>
    );
}
