import { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    Info,
    Clock,
    Activity,
    DollarSign,
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
    AreaChart
} from 'recharts';
import { getAssetChartData, getFundamentalData } from '../../services/apiService';
import type { Asset, StockQuote, HistoricalDataPoint, TimePeriod } from '../../types/types';
import './AssetDetail.css';

interface AssetDetailProps {
    asset: Asset;
}

const periods: { label: string; value: TimePeriod }[] = [
    { label: '1D', value: '1D' },
    { label: '7D', value: '7D' },
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: 'YTD', value: 'YTD' },
    { label: 'Máx', value: 'ALL' },
];

export function AssetDetail({ asset }: AssetDetailProps) {
    const [quote, setQuote] = useState<Partial<StockQuote> | null>(null);
    const [chartData, setChartData] = useState<HistoricalDataPoint[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');

    // Independent loading states (Fix 16)
    const [loadingFundamentals, setLoadingFundamentals] = useState(true);
    const [loadingChart, setLoadingChart] = useState(true);

    // Fix 14: AbortController for safety
    // Effect for Fundamentals (runs once per asset change)
    useEffect(() => {
        const controller = new AbortController();
        const fetchFundamentals = async () => {
            setLoadingFundamentals(true);
            try {
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
    }, [asset.symbol]);

    // Effect for Chart (runs on asset or period change)
    useEffect(() => {
        const controller = new AbortController();
        const fetchChart = async () => {
            setLoadingChart(true);
            try {
                const data = await getAssetChartData(asset.symbol, selectedPeriod, controller.signal);
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
    }, [asset.symbol, selectedPeriod]);

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
        { label: 'Div. Rate', value: formatValue(quote?.dividendRate, 'currency'), icon: <DollarSign size={16} />, category: 'Dividendos' },
        { label: 'EBITDA', value: formatValue(quote?.ebitda, 'compact'), icon: <BarChart3 size={16} />, category: 'Resultados' },
        { label: 'EV/EBITDA', value: formatValue(quote?.evToEbitda), icon: <Activity size={16} />, category: 'Valoración' },
        { label: 'Crecim. Ingresos', value: formatValue(quote?.revenueGrowth, 'percent'), icon: <TrendingUp size={16} />, category: 'Resultados' },
        { label: 'Margen Beneficio', value: formatValue(quote?.profitMargin, 'percent'), icon: <Activity size={16} />, category: 'Resultados' },
        { label: 'ROE', value: formatValue(quote?.roe, 'percent'), icon: <Activity size={16} />, category: 'Rentabilidad' },
        { label: 'Deuda/Capital', value: formatValue(quote?.debtToEquity), icon: <Layers size={16} />, category: 'Salud Financiera' },
        { label: 'Beta', value: formatValue(quote?.beta), icon: <Activity size={16} />, category: 'Riesgo' },
        { label: 'EPS', value: formatValue(quote?.eps), icon: <DollarSign size={16} />, category: 'Resultados' },
        { label: 'Max (52 sem)', value: formatValue(quote?.fiftyTwoWeekHigh, 'currency'), icon: <ArrowUpRight size={16} />, category: 'Técnico' },
        { label: 'Min (52 sem)', value: formatValue(quote?.fiftyTwoWeekLow, 'currency'), icon: <ArrowDownRight size={16} />, category: 'Técnico' },
    ].filter(item => getRelevance(item.category));

    return (
        <div className="asset-detail">
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

            {/* Chart Section */}
            <div className="asset-detail__chart-section">
                <div className="asset-detail__chart-header">
                    <div className="asset-detail__chart-title">
                        <TrendingUp size={18} />
                        Histórico de Precio
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

                <div className="asset-detail__chart-container">
                    {loadingChart && <div className="chart-overlay"><div className="spinner-sm" /></div>}
                    {!loadingChart && chartData.length === 0 && (
                        <div className="chart-overlay error-state">
                            <p>Datos históricos no disponibles temporalmente.</p>
                            <small>Problema de conexión con Yahoo Finance</small>
                        </div>
                    )}
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={chartData}>
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
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                hide={selectedPeriod === '1D'}
                            />
                            <YAxis
                                hide
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
                                        ? new Intl.NumberFormat('es-ES', { maximumFractionDigits: 3 }).format(value)
                                        : 'N/A',
                                    'Precio'
                                ]}
                            />
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
                    </ResponsiveContainer>
                </div>
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
                        {metricItems.map((item, idx) => (
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

            <div className="asset-detail__footer">
                <Info size={14} />
                <p>Las métricas se obtienen de Yahoo Finance y pueden tener un ligero retraso.</p>
            </div>
        </div>
    );
}
