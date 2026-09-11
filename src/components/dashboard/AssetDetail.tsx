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
    ArrowUpRight,
    ArrowDownRight
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
import './AssetDetail.css';

interface AssetDetailProps {
    asset: Asset;
    portfolioValue?: number;
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
export function AssetDetail({ asset, portfolioValue = 0 }: AssetDetailProps) {
    const [quote, setQuote] = useState<Partial<StockQuote> | null>(null);
    const [chartData, setChartData] = useState<HistoricalDataPoint[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');
    const [fundData, setFundData] = useState<FinectFundRelevance | null>(null);
    const [chartSelection, setChartSelection] = useState<ChartSelection | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const chartContainerRef = useRef<HTMLDivElement>(null);
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
            try {
                if (isFund) {
                    const data = await getFundRelevance(assetIsin, controller.signal);
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
                const data = await getFundamentalData(asset.symbol, controller.signal);
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
    }, [asset.symbol, assetIsin, isFund]);

    // Effect for Chart (runs on asset or period change)
    useEffect(() => {
        const controller = new AbortController();
        const fetchChart = async () => {
            setLoadingChart(true);
            try {
                const data = await getAssetChartData(isFund ? assetIsin : asset.symbol, selectedPeriod, controller.signal);
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
    }, [asset.symbol, assetIsin, isFund, selectedPeriod]);

    useEffect(() => {
        setChartSelection(null);
        setIsSelecting(false);
    }, [asset.symbol, isFund, selectedPeriod]);

    const formatValue = (value: number | undefined, type: 'currency' | 'percent' | 'number' | 'compact' = 'number') => {
        if (value === undefined || value === null) return 'N/A';

        if (type === 'currency') {
            return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: asset.currency || 'EUR',
                minimumFractionDigits: 2
            }).format(value);
        }

        if (type === 'percent') {
            return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
        }

        if (type === 'compact') {
            return new Intl.NumberFormat('es-ES', {
                notation: 'compact',
                maximumFractionDigits: 1
            }).format(value);
        }

        return value.toLocaleString('es-ES', { maximumFractionDigits: 2 });
    };

    const priceChange = (asset.currentPrice || 0) - (asset.previousClose || 0);
    const priceChangePercent = asset.previousClose ? (priceChange / asset.previousClose) * 100 : 0;
    const investedValue = asset.purchasePrice * asset.quantity;
    const currentValue = (asset.currentPrice || asset.purchasePrice) * asset.quantity;
    const positionGain = currentValue - investedValue;
    const positionReturn = investedValue > 0 ? (positionGain / investedValue) * 100 : 0;
    const portfolioWeight = portfolioValue > 0 ? (currentValue / portfolioValue) * 100 : 0;

    // Type-aware rendering (Fix 17)
    const getRelevance = (category: string) => {
        if (asset.type === 'crypto') return category === 'Técnico' || category === 'Riesgo';
        if (asset.type === 'fund') return category === 'Valoración' || category === 'Riesgo' || category === 'Técnico';
        return true; // Stocks show everything
    };

    const metricItems = [
        { label: 'P/E Ratio', value: formatValue(quote?.pe), icon: <Activity size={16} />, category: 'Valoración' },
        { label: 'Forward P/E', value: formatValue(quote?.forwardPe), icon: <Clock size={16} />, category: 'Valoración' },
        { label: 'P/S Ratio', value: formatValue(quote?.ps), icon: <BarChart3 size={16} />, category: 'Valoración' },
        { label: 'P/B Ratio', value: formatValue(quote?.pb), icon: <Layers size={16} />, category: 'Valoración' },
        { label: 'Div. Yield', value: formatValue(quote?.dividendYield, 'percent'), icon: <Percent size={16} />, category: 'Dividendos' },
        { label: 'Div. Rate', value: formatValue(quote?.dividendRate, 'currency'), icon: <Coins size={16} />, category: 'Dividendos' },
        { label: 'EBITDA', value: formatValue(quote?.ebitda, 'compact'), icon: <BarChart3 size={16} />, category: 'Resultados' },
        { label: 'EV/EBITDA', value: formatValue(quote?.evToEbitda), icon: <Activity size={16} />, category: 'Valoración' },
        { label: 'Crecim. Ingresos', value: formatValue(quote?.revenueGrowth, 'percent'), icon: <TrendingUp size={16} />, category: 'Resultados' },
        { label: 'Margen Beneficio', value: formatValue(quote?.profitMargin, 'percent'), icon: <Activity size={16} />, category: 'Resultados' },
        { label: 'ROE', value: formatValue(quote?.roe, 'percent'), icon: <Activity size={16} />, category: 'Rentabilidad' },
        { label: 'Deuda/Capital', value: formatValue(quote?.debtToEquity), icon: <Layers size={16} />, category: 'Salud Financiera' },
        { label: 'Beta', value: formatValue(quote?.beta), icon: <Activity size={16} />, category: 'Riesgo' },
        { label: 'EPS', value: formatValue(quote?.eps), icon: <Coins size={16} />, category: 'Resultados' },
        { label: 'Max (52 sem)', value: formatValue(quote?.fiftyTwoWeekHigh, 'currency'), icon: <ArrowUpRight size={16} />, category: 'Técnico' },
        { label: 'Min (52 sem)', value: formatValue(quote?.fiftyTwoWeekLow, 'currency'), icon: <ArrowDownRight size={16} />, category: 'Técnico' },
    ].filter(item => getRelevance(item.category));

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

    const visibleMetricItems = isFund ? fundMetricItems : metricItems.filter((item) => item.value !== 'N/A');
    const canDrawChart = !loadingChart && chartData.length > 1;
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
            currency: asset.currency || 'EUR',
            maximumFractionDigits: 2,
        }).format(value);
    };
    const getChartIndexAtClientX = (clientX: number): number | null => {
        const rect = chartContainerRef.current?.getBoundingClientRect();
        if (!rect || chartData.length < 2) return null;

        // Keep the pointer mapping inside the plot area (the chart reserves
        // room for the Y axis and the right margin).
        const plotLeft = Math.min(68, rect.width * 0.15);
        const plotRight = Math.min(20, rect.width * 0.08);
        const plotWidth = Math.max(rect.width - plotLeft - plotRight, 1);
        const relativeX = Math.min(Math.max(clientX - rect.left - plotLeft, 0), plotWidth);
        return Math.min(chartData.length - 1, Math.max(0, Math.round((relativeX / plotWidth) * (chartData.length - 1))));
    };
    const handlePointerStart = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!canDrawChart) return;
        event.preventDefault();
        const index = getChartIndexAtClientX(event.clientX);
        if (index === null) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setChartSelection({ start: index, end: index });
        setIsSelecting(true);
    };
    const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!isSelecting) return;
        const index = getChartIndexAtClientX(event.clientX);
        if (index === null) return;
        event.preventDefault();
        setChartSelection((current) => current ? { ...current, end: index } : current);
    };
    const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
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
    const formatChartAxisValue = (value: number) => isFund
        ? new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: asset.currency || 'EUR',
            maximumFractionDigits: 2,
        }).format(value)
        : new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(value);

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
                        {formatValue(asset.currentPrice || asset.purchasePrice, 'currency')}
                    </div>
                    <div className={`asset-detail__change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
                        {priceChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {formatValue(priceChange, 'number')} ({formatValue(priceChangePercent, 'percent')})
                    </div>
                </div>
            </div>

            <div className="asset-detail__position-grid">
                <div><span>Cantidad</span><strong>{formatValue(asset.quantity)}</strong></div>
                <div><span>Precio medio</span><strong>{formatValue(asset.purchasePrice, 'currency')}</strong></div>
                <div><span>Capital invertido</span><strong>{formatValue(investedValue, 'currency')}</strong></div>
                <div><span>Valor actual</span><strong>{formatValue(currentValue, 'currency')}</strong></div>
                <div><span>Resultado</span><strong className={positionGain >= 0 ? 'positive' : 'negative'}>{formatValue(positionGain, 'currency')}</strong></div>
                <div><span>Rentabilidad</span><strong className={positionReturn >= 0 ? 'positive' : 'negative'}>{formatValue(positionReturn, 'percent')}</strong></div>
                <div><span>Peso en cartera</span><strong>{portfolioWeight.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</strong></div>
                <div><span>Última actualización</span><strong>{asset.lastQuoteAt ? new Date(asset.lastQuoteAt).toLocaleString('es-ES') : 'Pendiente'}</strong></div>
            </div>

            {/* Chart Section */}
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
                                className={`period-btn ${selectedPeriod === p.value ? 'active' : ''}`}
                                onClick={() => setSelectedPeriod(p.value)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
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
                            <p>{chartData.length === 1 ? 'Recopilando datos del histórico…' : 'Datos históricos no disponibles temporalmente.'}</p>
                            <small>{chartData.length === 1 ? 'Necesitamos al menos dos cotizaciones para dibujar la evolución.' : isFund ? 'Finect no ha devuelto una serie histórica' : 'No se ha podido consultar el proveedor de mercado'}</small>
                        </div>
                    )}
                    {canDrawChart && <ResponsiveContainer width="100%" height={240}>
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 18, left: 12, bottom: 4 }}
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
                               formatter={(value: any) => [
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
                            <span>Arrastra sobre la gráfica para medir la mejora o el drawdown entre dos puntos.</span>
                        )}
                    </div>
                )}
                <div className="asset-detail__chart-legend">
                    <span><i className="asset-detail__legend-line" /> {isFund ? 'Precio participación' : 'Precio'}</span>
                    <span className="asset-detail__chart-axis-hint">Eje vertical: {asset.currency || 'EUR'} · Eje horizontal: {isFund ? 'horizonte' : 'fecha'}</span>
                </div>
               {isFund && (
                   <p className="asset-detail__chart-source">
                       Valores liquidativos históricos de la clase encontrada por ISIN. Finect aporta la ficha y la última valoración.
                   </p>
               )}
           </div>

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
                            <div className="metrics-empty">La posición está disponible arriba. Los datos de mercado ampliados no están disponibles temporalmente.</div>
                        )}
                        {visibleMetricItems.map((item, idx) => (
                            <div key={idx} className="metric-card">
                                <div className="metric-card__header">
                                    <span className="metric-card__icon">{item.icon}</span>
                                    <span className="metric-card__label">{item.label}</span>
                                </div>
                                <div className="metric-card__value">{item.value}</div>
                                <div className="metric-card__category">{item.category}</div>
                            </div>
                        ))}
                    </div>
                )}
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
                <p>{isFund ? 'Ficha obtenida de Finect e histórico de mercado de la clase encontrada por ISIN.' : 'Las métricas se obtienen de Yahoo Finance y pueden tener un ligero retraso.'}</p>
            </div>
        </div>
    );
}
