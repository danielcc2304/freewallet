import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
    Activity,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    CalendarClock,
    CheckCircle2,
    Coins,
    Gauge,
    Layers3,
    ListChecks,
    ShieldCheck,
    Target,
    TrendingUp,
    WalletCards,
} from 'lucide-react';
import {
    Area,
    Bar,
    BarChart,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader } from '../ui';
import { usePortfolio } from '../../context/PortfolioContext';
import { getHistory } from '../../services/storageService';
import { getAssetChartData } from '../../services/apiService';
import { buildPortfolioAnalyticsHistory, calculatePeriodPerformance, normalizePortfolioTransactions, performanceSeries } from '../../services/portfolioPerformance';
import type { HistoricalDataPoint } from '../../types/types';
import './PortfolioExcelInsights.css';

type InsightTab = 'evolution' | 'benchmark' | 'allocation' | 'risk' | 'controls';
type EvolutionPeriod = '1D' | '7D' | '1M' | '3M' | 'YTD' | 'ALL';

const QUOTE_WINDOW_MS = 15 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const currency = (value: number) => value.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
});
const percent = (value: number | null | undefined) => value === null || value === undefined || !Number.isFinite(value)
    ? 'N/D'
    : `${value >= 0 ? '+' : ''}${value.toLocaleString('es-ES', { maximumFractionDigits: 2 })}%`;
const plainPercent = (value: number | null | undefined) => value === null || value === undefined || !Number.isFinite(value)
    ? 'N/D'
    : `${value.toLocaleString('es-ES', { maximumFractionDigits: 2 })}%`;
const tooltipTheme = {
    contentStyle: {
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
    },
    labelStyle: { color: 'var(--text-primary)' },
};

const benchmarkSeriesLabel = (name?: string) => name === 'portfolio' || name === 'Tu cartera'
    ? 'Tu cartera'
    : 'MSCI World';

const formatAxisCurrency = (value: number) => value >= 1000
    ? `${Math.round(value / 1000)}k`
    : `${Math.round(value)} €`;

const evolutionPeriods: Array<{ value: EvolutionPeriod; label: string }> = [
    { value: '1D', label: '1D' },
    { value: '7D', label: '7D' },
    { value: '1M', label: '1M' },
    { value: '3M', label: '3M' },
    { value: 'YTD', label: 'YTD' },
    { value: 'ALL', label: 'Todo' },
];

function getPeriodCutoff(period: EvolutionPeriod, nowMs: number): number | null {
    if (period === 'ALL') return null;
    const now = new Date(nowMs);
    if (period === 'YTD') return new Date(now.getFullYear(), 0, 1).getTime();
    if (period === '1D') return nowMs - 24 * 60 * 60 * 1000;
    if (period === '7D') return nowMs - 7 * 24 * 60 * 60 * 1000;
    const months = period === '3M' ? 3 : 1;
    // Date#setMonth overflows 31st-day dates (31 March minus one month
    // becomes 3 March). Clamp to the last valid day of the target month.
    const day = now.getDate();
    now.setDate(1);
    now.setMonth(now.getMonth() - months);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    now.setDate(Math.min(day, lastDay));
    return now.getTime();
}

export function PortfolioExcelInsights({ now }: { now: number }) {
    const { state: { assets, transactions, lastPriceUpdate } } = usePortfolio();
    const [tab, setTab] = useState<InsightTab>('evolution');
    const [evolutionPeriod, setEvolutionPeriod] = useState<EvolutionPeriod>('ALL');
    const [benchmark, setBenchmark] = useState<HistoricalDataPoint[]>([]);
    const activeTransactions = useMemo(() => {
        const activeAssetIds = new Set(assets.map((asset) => asset.id));
        return transactions.filter((transaction) => activeAssetIds.has(transaction.assetId));
    }, [assets, transactions]);
    const portfolioTransactions = useMemo(() => normalizePortfolioTransactions(assets, activeTransactions), [activeTransactions, assets]);

    const totalValue = useMemo(
        () => assets.reduce((sum, asset) => sum + (asset.currentPrice || asset.purchasePrice) * asset.quantity, 0),
        [assets],
    );
    const investedValue = useMemo(
        () => assets.reduce((sum, asset) => sum + asset.purchasePrice * asset.quantity, 0),
        [assets],
    );

    useEffect(() => {
        const controller = new AbortController();
        getAssetChartData('URTH', 'YTD', controller.signal)
            .then((data) => {
                if (!controller.signal.aborted) setBenchmark(data);
            })
            .catch(() => {
                if (!controller.signal.aborted) setBenchmark([]);
            });
        return () => controller.abort();
    }, [lastPriceUpdate]);

    const history = useMemo(() => {
        const currentSnapshot = {
            date: new Date(now).toISOString(),
            value: totalValue,
            invested: investedValue,
        };
        return buildPortfolioAnalyticsHistory(getHistory(), portfolioTransactions, currentSnapshot, assets);
    }, [assets, investedValue, now, portfolioTransactions, totalValue]);
    const series = useMemo(() => performanceSeries(history, portfolioTransactions, assets), [assets, history, portfolioTransactions]);

    const monthly = useMemo(() => {
        const rows = new Map<string, {
            month: string;
            value: number;
            invested: number;
            factor: number;
            observations: number;
            drawdown: number;
        }>();
        series.forEach((point) => {
            const month = point.date.slice(0, 7);
            const current = rows.get(month) || {
                month,
                value: 0,
                invested: 0,
                factor: 1,
                observations: 0,
                drawdown: 0,
            };
            current.value = point.value;
            current.invested = point.invested;
            if (point.dailyReturn !== null) {
                current.factor *= 1 + point.dailyReturn / 100;
                current.observations += 1;
            }
            rows.set(month, current);
        });

        let wealth = 1;
        let peak = 1;
        return [...rows.values()].map((row) => {
            const monthlyReturn = (row.factor - 1) * 100;
            if (row.observations > 0) wealth *= 1 + monthlyReturn / 100;
            peak = Math.max(peak, wealth);
            return {
                ...row,
                monthlyReturn,
                drawdown: peak > 0 ? (wealth / peak - 1) * 100 : 0,
            };
        });
    }, [series]);

    const dailyReturns = series
        .map((point) => point.dailyReturn)
        .filter((value): value is number => value !== null && Number.isFinite(value));
    const validMonthly = monthly.filter((row) => row.observations > 0);
    const monthlyReturns = validMonthly
        .map((row) => row.monthlyReturn)
        .filter((value) => Number.isFinite(value));
    const monthlyMean = monthlyReturns.length
        ? monthlyReturns.reduce((sum, value) => sum + value, 0) / monthlyReturns.length
        : null;
    const monthlyVolatility = monthlyReturns.length > 1
        ? Math.sqrt(monthlyReturns.reduce((sum, value) => sum + (value - monthlyMean!) ** 2, 0) / (monthlyReturns.length - 1))
        : null;
    // The live dashboard has no imported €STR series, so it follows the Excel
    // fallback of a 0% annual risk-free rate until one is available.
    const monthlyRiskFreePct = 0;
    const excessMonthlyReturns = monthlyReturns.map((value) => value - monthlyRiskFreePct);
    const meanExcess = excessMonthlyReturns.length
        ? excessMonthlyReturns.reduce((sum, value) => sum + value, 0) / excessMonthlyReturns.length
        : null;
    const downside = excessMonthlyReturns.filter((value) => value < 0);
    const downsideDeviation = downside.length
        ? Math.sqrt(downside.reduce((sum, value) => sum + value ** 2, 0) / downside.length)
        : null;
    const volatility = monthlyVolatility === null ? null : monthlyVolatility * Math.sqrt(12);
    const sharpe = meanExcess !== null && monthlyVolatility !== null && monthlyVolatility > 0
        ? meanExcess / monthlyVolatility * Math.sqrt(12)
        : null;
    const sortino = meanExcess !== null && downsideDeviation !== null && downsideDeviation > 0
        ? meanExcess / downsideDeviation * Math.sqrt(12)
        : null;

    const historyYears = validMonthly.length > 1
        ? Math.max(1 / 12, ((Number(validMonthly.at(-1)!.month.slice(0, 4)) - Number(validMonthly[0].month.slice(0, 4))) * 12 + Number(validMonthly.at(-1)!.month.slice(5, 7)) - Number(validMonthly[0].month.slice(5, 7))) / 12)
        : null;
    let wealth = 1;
    let peak = 1;
    let maxDrawdown = 0;
    series.filter((point) => point.dailyReturn !== null).forEach((point) => {
        wealth = point.index;
        peak = Math.max(peak, wealth);
        if (peak > 0) maxDrawdown = Math.min(maxDrawdown, (wealth / peak - 1) * 100);
    });
    const annualized = historyYears !== null && historyYears >= 1 && monthlyReturns.length > 0
        ? ((monthlyReturns.reduce((growth, value) => growth * (1 + value / 100), 1) ** (1 / historyYears) - 1) * 100)
        : null;
    const positiveDays = dailyReturns.length ? dailyReturns.filter((value) => value > 0).length / dailyReturns.length * 100 : null;
    const currentReturn = investedValue > 0 ? (totalValue / investedValue - 1) * 100 : 0;
    const bestMonth = validMonthly.length
        ? validMonthly.reduce((best, row) => row.monthlyReturn > best.monthlyReturn ? row : best)
        : null;
    const worstMonth = validMonthly.length
        ? validMonthly.reduce((worst, row) => row.monthlyReturn < worst.monthlyReturn ? row : worst)
        : null;
    const negativeMonths = validMonthly.filter((row) => row.monthlyReturn < 0).length;
    const stale = assets.filter((asset) => {
        if (!asset.lastQuoteAt) return true;
        return now - new Date(asset.lastQuoteAt).getTime() > QUOTE_WINDOW_MS;
    }).length;
    const freshQuotes = assets.length - stale;
    const dataCoverage = assets.length ? freshQuotes / assets.length * 100 : 0;
    const duplicateSymbols = assets.length - new Set(assets.map((asset) => asset.symbol.toUpperCase())).size;
    const invalidPositions = assets.filter((asset) => asset.quantity <= 0 || asset.purchasePrice <= 0).length;
    const assetTypes = new Set(assets.map((asset) => asset.type)).size;
    const ledgerFlow = activeTransactions.reduce((sum, transaction) => {
        const amount = transaction.total || 0;
        return sum + (transaction.type === 'buy' ? amount : transaction.type === 'sell' ? -amount : 0);
    }, 0);
    const ledgerDifference = ledgerFlow - investedValue;
    const leaders = useMemo(
        () => assets
            .map((asset) => ({
                symbol: asset.symbol,
                name: asset.name,
                value: (asset.currentPrice || asset.purchasePrice) * asset.quantity,
            }))
            .sort((left, right) => right.value - left.value)
            .slice(0, 5),
        [assets],
    );
    const largestWeight = totalValue > 0 && leaders[0] ? leaders[0].value / totalValue * 100 : 0;
    const buys = portfolioTransactions
        .filter((transaction) => transaction.type === 'buy')
        .reduce((sum, transaction) => sum + (transaction.total || 0), 0);
    const sells = portfolioTransactions
        .filter((transaction) => transaction.type === 'sell')
        .reduce((sum, transaction) => sum + (transaction.total || 0), 0);

    const allocations = useMemo(() => {
        const values = new Map<string, number>();
        assets.forEach((asset) => values.set(
            asset.type,
            (values.get(asset.type) || 0) + (asset.currentPrice || asset.purchasePrice) * asset.quantity,
        ));
        return [...values.entries()]
            .map(([type, value]) => ({
                name: ({ stock: 'Acciones', fund: 'Fondos', etf: 'ETF', crypto: 'Cripto' } as Record<string, string>)[type] || type,
                actual: totalValue ? value / totalValue * 100 : 0,
            }))
            .sort((left, right) => right.actual - left.actual);
    }, [assets, totalValue]);

    const benchmarkReturn = benchmark.length > 1
        ? (benchmark.at(-1)!.close / benchmark[0].close - 1) * 100
        : null;
    const benchmarkLine = useMemo(() => {
        if (!benchmark.length) return [];
        const portfolioByDate = new Map(series.map((point) => [point.date.slice(0, 10), point.index]));
        const firstCommon = benchmark.find((point) => portfolioByDate.has(point.date.slice(0, 10)));
        const basePortfolioIndex = firstCommon ? portfolioByDate.get(firstCommon.date.slice(0, 10)) : undefined;

        return benchmark.map((point, index) => {
            const date = point.date.slice(0, 10);
            const portfolioIndex = portfolioByDate.get(date);
            return {
                date,
                index,
                benchmark: benchmark[0].close ? (point.close / benchmark[0].close - 1) * 100 : 0,
                portfolio: portfolioIndex !== undefined && basePortfolioIndex
                    ? (portfolioIndex / basePortfolioIndex - 1) * 100
                    : null,
            };
        });
    }, [benchmark, series]);
    const portfolioBenchmarkReturn = benchmarkLine
        .filter((point) => point.portfolio !== null)
        .at(-1)?.portfolio ?? currentReturn;
    const hasPortfolioBenchmark = benchmarkLine.some((point) => point.portfolio !== null);

    const evolutionSeries = useMemo(() => {
        const cutoff = getPeriodCutoff(evolutionPeriod, now);
        if (cutoff === null) return series;
        return series.filter((point) => new Date(point.date).getTime() >= cutoff);
    }, [evolutionPeriod, now, series]);
    const selectedPeriodPerformance = useMemo(() => {
        const cutoff = getPeriodCutoff(evolutionPeriod, now);
        const maxBaseGap = cutoff === null ? Number.POSITIVE_INFINITY : Math.max(3 * DAY_MS, (now - cutoff) * 1.5);
        return calculatePeriodPerformance(series, cutoff ?? Number.NEGATIVE_INFINITY, now, maxBaseGap);
    }, [evolutionPeriod, now, series]);
    const significantCapitalFlow = evolutionSeries.slice(1)
        .map((point, index) => ({
            date: point.date,
            amount: point.netFlow,
            baseValue: evolutionSeries[index].value,
        }))
        .filter((flow) => Math.abs(flow.amount) > Math.max(100, flow.baseValue * 0.5))
        .at(-1);

    const tabs: Array<{ value: InsightTab; label: string; icon: ReactNode }> = [
        { value: 'evolution', label: 'Evolución', icon: <TrendingUp size={15} /> },
        { value: 'benchmark', label: 'Benchmark', icon: <BarChart3 size={15} /> },
        { value: 'allocation', label: 'Asignación', icon: <Layers3 size={15} /> },
        { value: 'risk', label: 'Riesgo', icon: <AlertTriangle size={15} /> },
        { value: 'controls', label: 'Controles', icon: <ListChecks size={15} /> },
    ];
    const kpis: Array<{ label: string; value: string; detail?: string; icon: ReactNode; tone?: string }> = [
        { label: 'Valor actual', value: currency(totalValue), detail: `${assets.length} posiciones`, icon: <WalletCards size={17} /> },
        { label: 'Capital invertido', value: currency(investedValue), detail: `${activeTransactions.length} operaciones`, icon: <Coins size={17} /> },
        { label: 'Rentabilidad total', value: percent(currentReturn), detail: currency(totalValue - investedValue), icon: <ArrowUpRight size={17} />, tone: currentReturn >= 0 ? 'is-positive' : 'is-negative' },
        { label: 'Rentabilidad anualizada', value: percent(annualized), detail: historyYears === null ? 'Sin histórico suficiente' : `${historyYears.toFixed(1)} años analizados`, icon: <Gauge size={17} /> },
        { label: 'Volatilidad anualizada', value: plainPercent(volatility), detail: 'Riesgo estimado', icon: <BarChart3 size={17} /> },
        { label: 'Máximo drawdown', value: dailyReturns.length > 0 ? plainPercent(maxDrawdown) : 'N/D', detail: 'Caída desde máximos', icon: <ArrowDownRight size={17} />, tone: maxDrawdown < 0 ? 'is-negative' : undefined },
        { label: 'Periodos positivos', value: plainPercent(positiveDays), detail: `${dailyReturns.length} intervalos válidos`, icon: <ShieldCheck size={17} /> },
        { label: 'Ratio Sharpe', value: sharpe === null ? 'N/D' : sharpe.toFixed(2), detail: 'Retorno / riesgo', icon: <Gauge size={17} /> },
        { label: 'Ratio Sortino', value: sortino === null ? 'N/D' : sortino.toFixed(2), detail: 'Riesgo bajista', icon: <Gauge size={17} /> },
        { label: 'Mejor mes', value: percent(bestMonth?.monthlyReturn), detail: bestMonth?.month || 'Sin histórico', icon: <ArrowUpRight size={17} />, tone: bestMonth && bestMonth.monthlyReturn < 0 ? 'is-negative' : 'is-positive' },
        { label: 'Peor mes', value: plainPercent(worstMonth?.monthlyReturn), detail: worstMonth?.month || 'Sin histórico', icon: <ArrowDownRight size={17} />, tone: worstMonth && worstMonth.monthlyReturn < 0 ? 'is-negative' : undefined },
        { label: 'Meses negativos', value: validMonthly.length ? `${negativeMonths} de ${validMonthly.length}` : 'N/D', detail: 'Periodos cerrados', icon: <AlertTriangle size={17} /> },
        { label: 'Compras posiciones activas', value: currency(buys), detail: 'Flujo reconciliado', icon: <WalletCards size={17} /> },
        { label: 'Ventas posiciones activas', value: currency(sells), detail: 'Flujo de salida', icon: <Coins size={17} /> },
    ];
    const controls = [
        { label: 'Mayor posición', value: leaders[0] ? `${leaders[0].symbol} · ${largestWeight.toFixed(1)}%` : 'N/D', ok: largestWeight <= 35 },
        { label: 'Diversificación', value: `${assets.length} posiciones · ${assetTypes} tipos`, ok: assets.length > 1 },
        { label: 'Cobertura de precios', value: `${dataCoverage.toFixed(0)}%`, ok: stale === 0 },
        { label: 'Cuadre de operaciones', value: Math.abs(ledgerDifference) <= 0.01 ? 'OK' : `Revisar ${ledgerDifference >= 0 ? '+' : ''}${currency(ledgerDifference)}`, ok: Math.abs(ledgerDifference) <= 0.01 },
        { label: 'Posiciones duplicadas', value: duplicateSymbols, ok: duplicateSymbols === 0 },
        { label: 'Cantidades o precios inválidos', value: invalidPositions, ok: invalidPositions === 0 },
        { label: 'Cotizaciones sin actualizar', value: stale, ok: stale === 0 },
        { label: 'Histórico de la cartera', value: `${history.length} registros`, ok: history.length >= 2 },
        { label: 'Operaciones registradas', value: activeTransactions.length, ok: activeTransactions.length > 0 },
        { label: 'Divisa normalizada', value: assets.every((asset) => !asset.currency || asset.currency === 'EUR') ? 'EUR' : 'Revisar', ok: assets.every((asset) => !asset.currency || asset.currency === 'EUR') },
    ];

    return (
        <Card className="portfolio-excel-insights">
            <CardHeader title="Análisis avanzado" subtitle="Las mismas lecturas del Portfolio, recalculadas con tus activos, operaciones, histórico y cotizaciones" />
            <CardContent>
                <div className="portfolio-excel-insights__kpis">
                    {kpis.map((kpi) => (
                        <div key={kpi.label}>
                            <span className="portfolio-excel-insights__kpi-icon">{kpi.icon}</span>
                            <span>{kpi.label}</span>
                            <strong className={kpi.tone}>{kpi.value}</strong>
                            {kpi.detail && <small>{kpi.detail}</small>}
                        </div>
                    ))}
                </div>

                <div className="portfolio-excel-insights__tabs" role="tablist" aria-label="Análisis avanzado de cartera">
                    {tabs.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            role="tab"
                            aria-selected={tab === item.value}
                            className={tab === item.value ? 'is-active' : ''}
                            onClick={() => setTab(item.value)}
                        >
                            {item.icon}{item.label}
                        </button>
                    ))}
                </div>

                {tab === 'evolution' && (
                    <section className="portfolio-excel-insights__panel">
                        <div className="portfolio-excel-insights__panel-heading">
                            <div>
                                <h3><CalendarClock size={16} /> Evolución real de la cartera</h3>
                                <p>Valor y capital invertido a partir de los snapshots generados por tus cotizaciones.</p>
                            </div>
                            <div className="portfolio-excel-insights__panel-actions">
                                <div className="portfolio-excel-insights__period-summary">
                                    <span>Rentabilidad del periodo</span>
                                    <strong className={selectedPeriodPerformance.returnPercent !== null && selectedPeriodPerformance.returnPercent < 0 ? 'is-negative' : ''}>{percent(selectedPeriodPerformance.returnPercent)}</strong>
                                    <small>{selectedPeriodPerformance.observations} intervalos · base {selectedPeriodPerformance.baseDate || 'sin histórico'}</small>
                                </div>
                                <strong>{evolutionSeries.length} registros</strong>
                                <div className="portfolio-excel-insights__periods" role="group" aria-label="Periodo de evolución">
                                    {evolutionPeriods.map((period) => (
                                        <button
                                            key={period.value}
                                            type="button"
                                            className={evolutionPeriod === period.value ? 'is-active' : ''}
                                            onClick={() => setEvolutionPeriod(period.value)}
                                        >
                                            {period.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {evolutionSeries.length > 1 ? (
                            <ResponsiveContainer width="100%" height={270}>
                                <ComposedChart data={evolutionSeries} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}>
                                    <defs>
                                        <linearGradient id="liveValueFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} interval="preserveStartEnd" minTickGap={28} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={formatAxisCurrency} width={48} />
                                    <Tooltip {...tooltipTheme} formatter={(value: number | string | undefined, name?: string) => [currency(Number(value || 0)), name === 'value' ? 'Valor actual' : 'Capital invertido']} />
                                    <Legend formatter={(value) => value === 'value' ? 'Valor actual' : 'Capital invertido'} />
                                    <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#liveValueFill)" strokeWidth={2} />
                                    <Line type="monotone" dataKey="invested" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="portfolio-excel-insights__empty">Necesitamos al menos dos actualizaciones de precios para dibujar la evolución.</div>
                        )}
                        {significantCapitalFlow && (
                            <p className="portfolio-excel-insights__chart-note">
                                El salto del {significantCapitalFlow.date} coincide con una {significantCapitalFlow.amount >= 0 ? 'aportación' : 'retirada'} neta de {currency(Math.abs(significantCapitalFlow.amount))}; se excluye del cálculo de rentabilidad.
                            </p>
                        )}
                    </section>
                )}

                {tab === 'benchmark' && (
                    <section className="portfolio-excel-insights__panel">
                        <div className="portfolio-excel-insights__panel-heading">
                            <div>
                                <h3><BarChart3 size={16} /> Comparativa automática</h3>
                                <p>Tu cartera frente al MSCI World (URTH), usando datos vivos del mercado.</p>
                            </div>
                            <strong>{benchmark.length} puntos</strong>
                        </div>
                        <div className="portfolio-excel-insights__benchmark-kpis">
                            <div><span>Tu cartera</span><strong>{percent(portfolioBenchmarkReturn)}</strong></div>
                            <div><span>MSCI World</span><strong>{percent(benchmarkReturn)}</strong></div>
                            <div><span>Diferencia</span><strong className={benchmarkReturn !== null && portfolioBenchmarkReturn - benchmarkReturn >= 0 ? 'is-positive' : 'is-negative'}>{benchmarkReturn === null ? 'N/D' : percent(portfolioBenchmarkReturn - benchmarkReturn)}</strong></div>
                        </div>
                        {benchmarkLine.length > 1 ? (
                            <ResponsiveContainer width="100%" height={230}>
                                <LineChart data={benchmarkLine} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} interval="preserveStartEnd" minTickGap={28} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={(value) => value + '%'} width={45} />
                                    <Tooltip {...tooltipTheme} formatter={(value: number | string | undefined, name?: string) => [percent(Number(value || 0)), benchmarkSeriesLabel(name)]} />
                                    <Legend formatter={(value) => benchmarkSeriesLabel(String(value))} />
                                    {hasPortfolioBenchmark && <Line type="monotone" dataKey="portfolio" name="Tu cartera" stroke="#10b981" strokeWidth={2} dot={false} connectNulls />}
                                    <Line type="monotone" dataKey="benchmark" name="MSCI World" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="portfolio-excel-insights__empty">Aún no hay histórico coincidente suficiente para comparar tu cartera con el benchmark.</div>
                        )}
                        {benchmarkLine.length > 1 && !hasPortfolioBenchmark && <p className="portfolio-excel-insights__chart-note">El histórico del benchmark está disponible, pero todavía no hay fechas coincidentes de la cartera para dibujar su línea.</p>}
                    </section>
                )}

                {tab === 'allocation' && (
                    <section className="portfolio-excel-insights__allocation">
                        <div className="portfolio-excel-insights__mini-chart">
                            <h3><Layers3 size={16} /> Distribución por tipo</h3>
                            <ResponsiveContainer width="100%" height={230}>
                                <BarChart data={allocations} layout="vertical" margin={{ left: 10, right: 12 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(value) => value + '%'} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                    <YAxis dataKey="name" type="category" width={90} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                    <Tooltip {...tooltipTheme} formatter={(value: number | string | undefined) => percent(Number(value || 0))} />
                                    <Bar dataKey="actual" name="Peso actual" fill="#10b981" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="portfolio-excel-insights__mini-chart">
                            <h3><Target size={16} /> Mayores posiciones</h3>
                            {leaders.map((leader) => (
                                <div className="portfolio-excel-insights__leader-row" key={leader.symbol}>
                                    <span><strong>{leader.symbol}</strong><small>{leader.name}</small></span>
                                    <b>{currency(leader.value)}</b>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {tab === 'risk' && (
                    <section className="portfolio-excel-insights__panel">
                        <div className="portfolio-excel-insights__panel-heading">
                            <div>
                                <h3><AlertTriangle size={16} /> Riesgo y consistencia</h3>
                                <p>Retornos mensuales, desviación muestral y 0% de libre de riesgo hasta disponer de €STR.</p>
                            </div>
                            <strong>{validMonthly.length} meses</strong>
                        </div>
                        {validMonthly.length > 1 ? (
                            <ResponsiveContainer width="100%" height={270}>
                                <ComposedChart data={validMonthly} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                                    <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} minTickGap={28} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={(value) => value + '%'} width={45} />
                                    <Tooltip {...tooltipTheme} formatter={(value: number | string | undefined, name?: string) => [percent(Number(value || 0)), name || 'Valor']} />
                                    <Legend />
                                    <Bar dataKey="monthlyReturn" name="Retorno mensual" fill="#10b981" radius={[5, 5, 0, 0]} />
                                    <Line type="monotone" dataKey="drawdown" name="Drawdown" stroke="#ef4444" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="portfolio-excel-insights__empty">Necesitamos más actualizaciones para calcular el riesgo mensual.</div>
                        )}
                        <div className="portfolio-excel-insights__stats">
                            <span>Sharpe <strong>{sharpe === null ? 'N/D' : sharpe.toFixed(2)}</strong></span>
                            <span>Sortino <strong>{sortino === null ? 'N/D' : sortino.toFixed(2)}</strong></span>
                            <span>Peor mes <strong>{plainPercent(worstMonth?.monthlyReturn)}</strong></span>
                            <span>Meses negativos <strong>{validMonthly.length ? `${negativeMonths} de ${validMonthly.length}` : 'N/D'}</strong></span>
                            <span>Histórico <strong>{history.length}</strong></span>
                            <span>Stale <strong>{stale}</strong></span>
                        </div>
                    </section>
                )}

                {tab === 'controls' && (
                    <section className="portfolio-excel-insights__controls">
                        <div className="portfolio-excel-insights__control-column">
                            <h3><ListChecks size={16} /> Controles vivos</h3>
                            {controls.map((control) => (
                                <div className="portfolio-excel-insights__control-row" key={control.label}>
                                    {control.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                                    <span>{control.label}</span>
                                    <strong className={control.ok ? 'is-ok' : 'is-warn'}>{control.value}</strong>
                                </div>
                            ))}
                        </div>
                        <div className="portfolio-excel-insights__control-column">
                            <h3><Target size={16} /> Operaciones recientes</h3>
                            {activeTransactions.length ? [...activeTransactions]
                                .sort((left, right) => right.date.localeCompare(left.date))
                                .slice(0, 7)
                                .map((transaction) => (
                                    <div className="portfolio-excel-insights__movement-row" key={transaction.id}>
                                        <span>{transaction.date}<small>{transaction.assetSymbol} · {transaction.type}</small></span>
                                        <strong>{currency(transaction.total || 0)}</strong>
                                    </div>
                                )) : <p>Aún no hay operaciones registradas.</p>}
                        </div>
                        <div className="portfolio-excel-insights__control-column">
                            <h3><ShieldCheck size={16} /> Estado de actualización</h3>
                            <p>{stale ? 'Hay posiciones sin cotización reciente. Pulsa Actualizar precios para reintentar.' : 'Todas las posiciones tienen una cotización reciente.'}</p>
                            <div className="portfolio-excel-insights__live-status">
                                <Activity size={15} />
                                <strong>{lastPriceUpdate ? lastPriceUpdate.toLocaleString('es-ES') : 'Pendiente'}</strong>
                            </div>
                        </div>
                    </section>
                )}
            </CardContent>
        </Card>
    );
}
