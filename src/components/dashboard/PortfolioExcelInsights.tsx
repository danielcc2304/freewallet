import { useEffect, useId, useMemo, useState, useTransition } from 'react';
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
    LoaderCircle,
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
import { BENCHMARK_ISIN, BENCHMARK_NAME, dailyHistory } from '../../services/dailyMarketData';
import { alignedBenchmark, alignImportedBenchmark, chooseBenchmarkLine, selectPortfolioPeriod, workbookRiskStats } from '../../services/portfolioPerformance';
import { assetValue, hasValidPrice } from '../../services/assetValuation';
import { archiveBenchmarkHistory } from '../../services/portfolioHistoryArchive';
import './PortfolioExcelInsights.css';
import type { DashboardAnalytics } from './useDashboardAnalytics';
import { latestContinuousMonths } from '../../services/dashboardHistory';
import { WORKBOOK_RISK_FREE_ANNUAL_PCT } from '../../services/portfolioRisk';
import { positionLotCounts } from '../../services/dashboardIntegrity';
import { getAssetChartData } from '../../services/apiService';
import { isApiEnabled } from '../../services/storageService';
import { DashboardMarketHistoryCache } from '../../services/dashboardMarketHistory';
import { benchmarkChartCadence, benchmarkPeriodDifference, extendImportedBenchmark } from '../../services/benchmarkComparison';
import type { HistoricalDataPoint } from '../../types/types';

const benchmarkHistoryCache = new DashboardMarketHistoryCache(1,15*60*1000);

function missingMetricReason(label: string, months: number) {
    if (label.startsWith('Rentabilidad no realizada')) return 'Falta un coste de posiciones abiertas mayor que cero para calcular el porcentaje.';
    if (label === 'Volatilidad anualizada' && months < 2) return 'Se necesitan al menos dos meses cerrados, válidos y consecutivos.';
    if (label === 'Ratio Sharpe') return months < 2
        ? 'Se necesitan al menos dos meses cerrados, válidos y consecutivos.'
        : 'La volatilidad es cero: no se puede dividir el exceso de retorno entre un riesgo nulo.';
    if (label === 'Ratio Sortino' && months) return 'No hay desviación bajista respecto a la tasa libre de riesgo: el denominador del ratio es cero.';
    return 'No hay meses cerrados con una base y retornos verificables suficientes. Un mes abierto no cuenta como cierre.';
}

type InsightTab = 'evolution' | 'benchmark' | 'allocation' | 'risk' | 'controls';
type EvolutionPeriod = '1D' | '7D' | '1M' | '3M' | 'YTD' | 'ALL';

const QUOTE_WINDOW_MS = 15 * 60 * 1000;
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

const benchmarkSeriesLabel = (name?: string, portfolioLabel = 'Tu cartera') => name === 'portfolio' || name === 'Tu cartera'
    ? portfolioLabel
    : 'MSCI World';

const formatAxisCurrency = (value: number) => value >= 1000
    ? `${Math.round(value / 1000)}k`
    : `${Math.round(value)} €`;

const formatHistoryDate = (value: string | null | undefined) => {
    if (!value) return 'sin histórico';
    const date = new Date(value);
    return Number.isFinite(date.getTime())
        ? new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric', timeZone: 'Europe/Madrid' }).format(date).replace('.', '')
        : 'sin histórico';
};

const formatChartDate = (value: string | number) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime())
        ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'Europe/Madrid' }).format(date).replace('.', '')
        : String(value);
};

const evolutionPeriods: Array<{ value: EvolutionPeriod; label: string }> = [
    { value: '1D', label: '1D' },
    { value: '7D', label: '7D' },
    { value: '1M', label: '1M' },
    { value: '3M', label: '3M' },
    { value: 'YTD', label: 'YTD' },
    { value: 'ALL', label: 'Todo' },
];

export function PortfolioExcelInsights({ now, analytics, period: evolutionPeriod, onPeriodChange: setEvolutionPeriod }: { now: number; analytics: DashboardAnalytics; period: EvolutionPeriod; onPeriodChange: (period: EvolutionPeriod) => void }) {
    const { state: { assets, transactions, lastPriceUpdate } } = usePortfolio();
    const [tab, setTab] = useState<InsightTab>('evolution');
    const [changingPanel,startPanelTransition]=useTransition();
    const [loadingBenchmark,setLoadingBenchmark]=useState(false);
    const changeTab=(next:InsightTab)=>{
        if (next === tab) return;
        setLoadingBenchmark(next==='benchmark'&&benchmarkHistoryCache.needsRefresh(benchmarkCacheKey));
        startPanelTransition(()=>setTab(next));
    };
    const tabId = useId();
        const [linkError, setLinkError] = useState('');
    const { historicalHistory, hasArchivedHistory, portfolioTransactions, history, series, monthly, hasEstimates } = analytics;
    const historicalMonthlyCount=historicalHistory.points.filter(p=>p.cadence==='monthly').length;
    const historicalDailyCount=historicalHistory.points.filter(p=>p.cadence==='daily').length;
    const workbookBenchmarkHistory = analytics.archive.benchmarkReturns;
    const [benchmarkHistory, setBenchmarkHistory] = useState<HistoricalDataPoint[]>([]);
    const apiEnabled = isApiEnabled();
    const benchmarkHistoryStart = series[0]?.timestamp;
    const benchmarkCacheKey=`${BENCHMARK_ISIN}::${benchmarkHistoryStart??'default'}`;
    useEffect(() => {
        if (tab !== 'benchmark' || !apiEnabled) return;
        const controller = new AbortController();
        void benchmarkHistoryCache.load(benchmarkCacheKey, controller.signal,
            (_symbol, period, signal) => getAssetChartData(BENCHMARK_ISIN, period, signal,
                period === 'ALL' ? { startDate: benchmarkHistoryStart ?? now - 2 * 366 * 86400000 } : {}))
            .then(points => { if (!controller.signal.aborted) setBenchmarkHistory(points); })
            .catch(() => { /* Keep imported and batch data on provider failure. */ })
            .finally(()=>{if(!controller.signal.aborted)setLoadingBenchmark(false);});
        return () => controller.abort();
    }, [tab, apiEnabled, lastPriceUpdate, benchmarkHistoryStart, benchmarkCacheKey, now]);
    const riskFreeAnnual = analytics.archive.riskFreeAnnualPct ?? WORKBOOK_RISK_FREE_ANNUAL_PCT;

    const totalValue = useMemo(
        () => assets.reduce((sum, asset) => sum + assetValue(asset), 0),
        [assets],
    );
    const investedValue = useMemo(
        () => assets.reduce((sum, asset) => sum + asset.purchasePrice * asset.quantity, 0),
        [assets],
    );

    const validMonthly = useMemo(
        () => monthly.filter(row => row.closed && row.complete && row.monthlyReturn !== null)
            .map(row => ({ ...row, monthlyReturn: row.monthlyReturn! })),
        [monthly],
    );
    const recentMonthly = useMemo(() => latestContinuousMonths(validMonthly), [validMonthly]);
    const { volatility, sharpe, sortino, annualized, maxDrawdown } = useMemo(
        () => workbookRiskStats(recentMonthly.map(row => row.monthlyReturn), riskFreeAnnual),
        [recentMonthly, riskFreeAnnual],
    );
    const historyYears = recentMonthly.length ? recentMonthly.length / 12 : null;
    const estimatedCount = assets.filter(asset => !hasValidPrice(asset)).length;
    const positiveDays = validMonthly.length ? validMonthly.filter(row => row.monthlyReturn > 0).length / validMonthly.length * 100 : null;
    const unrealizedReturn = investedValue > 0 ? (totalValue / investedValue - 1) * 100 : NaN;
    const bestMonth = validMonthly.length
        ? validMonthly.reduce((best, row) => row.monthlyReturn > best.monthlyReturn ? row : best)
        : null;
    const worstMonth = validMonthly.length
        ? validMonthly.reduce((worst, row) => row.monthlyReturn < worst.monthlyReturn ? row : worst)
        : null;
    const negativeMonths = validMonthly.filter((row) => row.monthlyReturn < 0).length;
    const stale = useMemo(() => assets.filter((asset) => {
        const checked = Date.parse(asset.lastCheckedAt || asset.lastQuoteAt || '');
        return !Number.isFinite(checked) || now - checked > QUOTE_WINDOW_MS;
    }).length, [assets, now]);
    const freshQuotes = assets.length - stale;
    const dataCoverage = assets.length ? freshQuotes / assets.length * 100 : 0;
    const lots = useMemo(() => positionLotCounts(assets), [assets]);
    const invalidPositions = useMemo(
        () => assets.filter((asset) => !Number.isFinite(asset.quantity) || asset.quantity < 0 || !Number.isFinite(asset.purchasePrice) || asset.purchasePrice < 0 || (asset.currentPrice !== undefined && (!Number.isFinite(asset.currentPrice) || asset.currentPrice < 0))).length,
        [assets],
    );
    const assetTypes = useMemo(() => new Set(assets.map((asset) => asset.type)).size, [assets]);
    const ledgerFlow = useMemo(() => portfolioTransactions.reduce((sum, transaction) => {
        const amount = transaction.total || 0;
        return sum + (transaction.type === 'buy' ? amount : transaction.type === 'sell' ? -amount : 0);
    }, 0), [portfolioTransactions]);
    const leaders = useMemo(
        () => assets
            .map((asset) => ({
                symbol: asset.symbol,
                name: asset.name,
                value: assetValue(asset),
            }))
            .sort((left, right) => right.value - left.value)
            .slice(0, 5),
        [assets],
    );
    const largestWeight = totalValue > 0 && leaders[0] ? leaders[0].value / totalValue * 100 : 0;
    const buys = useMemo(
        () => portfolioTransactions
            .filter((transaction) => transaction.type === 'buy' && transaction.provenance !== 'initial-position' && !/^(position|bootstrap)-/.test(transaction.id))
            .reduce((sum, transaction) => sum + (transaction.total || 0), 0),
        [portfolioTransactions],
    );
    const sells = useMemo(
        () => portfolioTransactions
            .filter((transaction) => transaction.type === 'sell' && transaction.provenance !== 'initial-position')
            .reduce((sum, transaction) => sum + (transaction.total || 0), 0),
        [portfolioTransactions],
    );

    const allocations = useMemo(() => {
        const values = new Map<string, number>();
        assets.forEach((asset) => values.set(
            asset.type,
            (values.get(asset.type) || 0) + assetValue(asset),
        ));
        return [...values.entries()]
            .map(([type, value]) => ({
                name: ({ stock: 'Acciones', fund: 'Fondos', etf: 'ETF', crypto: 'Cripto', cash: 'Liquidez' } as Record<string, string>)[type] || type,
                actual: totalValue ? value / totalValue * 100 : 0,
            }))
            .sort((left, right) => right.actual - left.actual);
    }, [assets, totalValue]);

    const selectedPeriod = useMemo(() => selectPortfolioPeriod(series, evolutionPeriod, now), [evolutionPeriod, now, series]);
    const periodSeries = selectedPeriod.points;
    const workbookBenchmarkLine = useMemo(() => {
        return alignImportedBenchmark(periodSeries, workbookBenchmarkHistory);
    }, [periodSeries, workbookBenchmarkHistory]);
    const benchmark = useMemo(() => [...benchmarkHistory, ...archiveBenchmarkHistory(analytics.archive,BENCHMARK_ISIN), ...dailyHistory(analytics.dailyMarket.data, BENCHMARK_ISIN)]
        .filter(point => (point.timestamp ?? Date.parse(point.date)) <= now && (!point.currency || point.currency === 'EUR')), [benchmarkHistory, analytics.archive, analytics.dailyMarket.data, now]);
    const automaticLine = useMemo(() => alignedBenchmark(periodSeries, benchmark), [periodSeries, benchmark]);
    const extendedLine = useMemo(() => alignedBenchmark(periodSeries, extendImportedBenchmark(workbookBenchmarkHistory, benchmark)), [periodSeries, workbookBenchmarkHistory, benchmark]);
    const benchmarkLine = useMemo(() => chooseBenchmarkLine(periodSeries, automaticLine,
        chooseBenchmarkLine(periodSeries, extendedLine, workbookBenchmarkLine)), [periodSeries, automaticLine, extendedLine, workbookBenchmarkLine]);
    const benchmarkUsesWorkbook = benchmarkLine.length > 1 && benchmarkLine === workbookBenchmarkLine;
    const benchmarkUsesExtension = benchmarkLine.length > 1 && benchmarkLine === extendedLine;
    const benchmarkReturn = benchmarkLine.at(-1)?.benchmark ?? null;
    const hasPortfolioBenchmark = benchmarkLine.length > 1;
    const benchmarkHasPeriodBase = hasPortfolioBenchmark
        && benchmarkLine[0].date.slice(0, 10) === selectedPeriod.performance.baseDate?.slice(0, 10);
    const benchmarkPartial = hasPortfolioBenchmark && (
        benchmarkLine[0].date.slice(0, 10) !== selectedPeriod.performance.baseDate?.slice(0, 10)
        || benchmarkLine.at(-1)!.date.slice(0, 10) !== selectedPeriod.performance.endDate?.slice(0, 10));
    const comparison=benchmarkPeriodDifference(benchmarkLine,selectedPeriod.performance.baseDate);
    const benchmarkDifference=comparison?.value??null;
    // The portfolio keeps the same full-period base/end as the summary. A
    // partial benchmark never truncates it or introduces a second current return.
    const benchmarkChart = useMemo(() => {
        const base = periodSeries[0];
        if (!base || base.index <= 0 || !Number.isFinite(selectedPeriod.performance.returnPercent)) return [];
        const benchmarkByDate = new Map(benchmarkLine.map(point => [point.date, point.benchmark]));
        return benchmarkChartCadence(periodSeries.map(point => ({
            date: point.date,
            timestamp: point.timestamp,
            portfolio: (point.index / base.index - 1) * 100,
            benchmark: benchmarkHasPeriodBase ? benchmarkByDate.get(point.date) ?? null : null,
        })), evolutionPeriod);
    }, [periodSeries, selectedPeriod.performance.returnPercent, benchmarkLine, benchmarkHasPeriodBase, evolutionPeriod]);

    const evolutionSeries = periodSeries;
    const selectedPeriodPerformance = selectedPeriod.performance;
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
        { label: 'Valor actual', value: currency(totalValue), detail: `${assets.length} posiciones${estimatedCount ? ` · ${estimatedCount} estimadas al coste` : ''}`, icon: <WalletCards size={17} /> },
        { label: 'Coste de posiciones abiertas', value: currency(investedValue), detail: `${assets.length} posiciones`, icon: <Coins size={17} /> },
        { label: estimatedCount ? 'Rentabilidad no realizada (estimada)' : 'Rentabilidad no realizada', value: percent(unrealizedReturn), detail: currency(totalValue - investedValue), icon: <ArrowUpRight size={17} />, tone: unrealizedReturn >= 0 ? 'is-positive' : 'is-negative' },
        { label: 'Rentabilidad anualizada', value: percent(annualized), detail: historyYears === null ? 'Sin meses cerrados' : `${recentMonthly.length} meses cerrados`, icon: <Gauge size={17} /> },
        { label: 'Volatilidad anualizada', value: plainPercent(volatility), detail: 'Riesgo estimado', icon: <BarChart3 size={17} /> },
        { label: 'Máximo drawdown', value: plainPercent(maxDrawdown), detail: 'Entre cierres mensuales', icon: <ArrowDownRight size={17} />, tone: maxDrawdown !== null && maxDrawdown < 0 ? 'is-negative' : undefined },
        { label: 'Meses positivos', value: plainPercent(positiveDays), detail: `${validMonthly.length} meses cerrados válidos`, icon: <ShieldCheck size={17} /> },
        { label: 'Ratio Sharpe', value: sharpe === null ? 'N/D' : sharpe.toFixed(2), detail: 'Retorno / riesgo', icon: <Gauge size={17} /> },
        { label: 'Ratio Sortino', value: sortino === null ? 'N/D' : sortino.toFixed(2), detail: 'Riesgo bajista', icon: <Gauge size={17} /> },
        { label: 'Mejor mes', value: percent(bestMonth?.monthlyReturn), detail: bestMonth?.month || 'Sin histórico', icon: <ArrowUpRight size={17} />, tone: bestMonth ? (bestMonth.monthlyReturn < 0 ? 'is-negative' : 'is-positive') : undefined },
        { label: 'Peor mes', value: plainPercent(worstMonth?.monthlyReturn), detail: worstMonth?.month || 'Sin histórico', icon: <ArrowDownRight size={17} />, tone: worstMonth && worstMonth.monthlyReturn < 0 ? 'is-negative' : undefined },
        { label: 'Meses negativos', value: validMonthly.length ? `${negativeMonths} de ${validMonthly.length}` : 'N/D', detail: 'Periodos cerrados', icon: <AlertTriangle size={17} /> },
        { label: 'Compras registradas', value: currency(buys), detail: 'Solo operaciones registradas, sin posiciones iniciales', icon: <WalletCards size={17} /> },
        { label: 'Ventas registradas', value: currency(sells), detail: 'Importes originales', icon: <Coins size={17} /> },
    ];
    const controls = [
        { label: 'Mayor posición', value: leaders[0] ? `${leaders[0].symbol} · ${largestWeight.toFixed(1)}%` : 'N/D', ok: largestWeight <= 35 },
        { label: 'Diversificación', value: `${assets.length} posiciones · ${assetTypes} tipos`, ok: assets.length > 1 },
        { label: 'Consultas recientes', value: `${dataCoverage.toFixed(0)}%`, ok: stale === 0 },
        { label: 'Flujo neto registrado', value: currency(ledgerFlow), ok: Number.isFinite(ledgerFlow) },
        { label: 'Lotes adicionales del mismo activo', value: lots.extraLots, ok: true },
        { label: 'Registros con identificador duplicado', value: lots.duplicateIds, ok: lots.duplicateIds === 0 },
        { label: 'Cantidades o precios inválidos', value: invalidPositions, ok: invalidPositions === 0 },
        { label: 'Consultas pendientes', value: stale, ok: stale === 0 },
        { label: 'Histórico utilizado', value: hasArchivedHistory
            ? `${historicalHistory.points.length} valoraciones · ${historicalHistory.dcaCount} flujos registrados`
            : `${history.length} registros${hasEstimates ? ' · incluye estimaciones' : ' verificados'}`, ok: history.length >= 2 },
        { label: 'Snapshots en vivo', value: `${history.filter(p => p.source === 'quotes-v2').length}`, ok: history.filter(p => p.source === 'quotes-v2').length >= 2 },
        { label: 'Operaciones registradas', value: transactions.length, ok: transactions.length > 0 },
        { label: 'Divisa normalizada', value: assets.every((asset) => !asset.currency || asset.currency === 'EUR') ? 'EUR' : 'Revisar', ok: assets.every((asset) => !asset.currency || asset.currency === 'EUR') },
    ];

    return (
        <Card className="portfolio-excel-insights">
            <CardHeader title="Análisis avanzado" subtitle={hasArchivedHistory
                ? 'Cartera actual e histórico guardado'
                : hasEstimates ? 'Incluye histórico estimado' : 'Histórico verificado'} />
            <CardContent>
                {hasArchivedHistory && !analytics.historyLinked && <div className="portfolio-excel-insights__workbook-notice" role="status">
                    <AlertTriangle size={20} aria-hidden="true" />
                    <div><strong>Vincular el histórico</strong><p>Confirma que el histórico importado pertenece a estas posiciones para continuar su evolución con las valoraciones diarias.</p></div>
                    <button type="button" onClick={() => { try { analytics.linkHistory(); setLinkError(''); } catch { setLinkError('No se ha podido guardar la vinculación del histórico.'); } }}>Usar este histórico</button>
                </div>}
                {linkError && <p className="portfolio-excel-insights__link-error" role="alert">{linkError}</p>}
                <p className="portfolio-excel-insights__chart-note" role="status">
                    {hasArchivedHistory
                        ? `Histórico · ${historicalMonthlyCount ? `${historicalMonthlyCount} cierres mensuales` : `${historicalDailyCount} valoraciones diarias`} · ${formatHistoryDate(historicalHistory.startDate)}–${formatHistoryDate(historicalHistory.endDate)}`
                        : history.length
                            ? `Seguimiento verificado desde ${formatHistoryDate(series[0]?.date)}.`
                            : 'Pendiente de una actualización completa de cotizaciones.'}
                </p>
                {(hasArchivedHistory || history.length > 0) && <details className="portfolio-excel-insights__history-details">
                    <summary>Detalles del histórico</summary>
                    <p>{hasArchivedHistory
                        ? `${historicalDailyCount} valoraciones diarias · ${historicalHistory.dcaCount} flujos sin duplicar. Los datos sin fecha exacta se conservan como resúmenes mensuales.`
                        : 'El histórico antiguo se conserva. Solo las valoraciones con posiciones y origen identificados se usan para calcular retornos.'}</p>
                </details>}
                <div className="portfolio-excel-insights__kpis">
                    {kpis.map((kpi) => (
                        <div key={kpi.label}>
                            <span className="portfolio-excel-insights__kpi-icon">{kpi.icon}</span>
                            <span>{kpi.label}</span>
                            <strong className={kpi.tone}>{kpi.value}</strong>
                            {kpi.value === 'N/D' ? <details className="portfolio-excel-insights__missing"><summary>¿Por qué no hay dato?</summary><p>{missingMetricReason(kpi.label, recentMonthly.length)}</p></details> : kpi.detail && <small>{kpi.detail}</small>}
                        </div>
                    ))}
                </div>

                <div className="portfolio-excel-insights__tabs" role="tablist" aria-label="Análisis avanzado de cartera">
                    {tabs.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            role="tab"
                            id={`${tabId}-${item.value}`}
                            aria-controls={`${tabId}-panel`}
                            tabIndex={tab === item.value ? 0 : -1}
                            onKeyDown={event => {
                                const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
                                if (!keys.includes(event.key)) return;
                                event.preventDefault();
                                const index = tabs.findIndex(t => t.value === item.value);
                                const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
                                changeTab(tabs[next].value);
                                document.getElementById(`${tabId}-${tabs[next].value}`)?.focus();
                            }}
                            aria-selected={tab === item.value}
                            className={tab === item.value ? 'is-active' : ''}
                            onClick={() => changeTab(item.value)}
                        >
                            {item.icon}{item.label}
                        </button>
                    ))}
                </div>

                {(changingPanel||(tab==='benchmark'&&apiEnabled&&loadingBenchmark))&&<div className="portfolio-excel-insights__loading" role="status"><LoaderCircle size={16} aria-hidden="true" />{changingPanel?'Cargando análisis…':'Consultando histórico del benchmark…'}</div>}
                <div role="tabpanel" id={`${tabId}-panel`} aria-labelledby={`${tabId}-${tab}`} aria-busy={changingPanel||(tab==='benchmark'&&apiEnabled&&loadingBenchmark)}>
                {tab === 'evolution' && (
                    <section className="portfolio-excel-insights__panel">
                        <div className="portfolio-excel-insights__panel-heading">
                            <div>
                                <h3><CalendarClock size={16} /> Evolución registrada de la cartera</h3>
                                <p>{hasArchivedHistory
                                    ? 'Cierres mensuales y valoraciones diarias. Los movimientos con fecha exacta se aplican ese día; los resúmenes mensuales, al cierre.'
                                    : 'Valoraciones completas guardadas con tus cotizaciones y operaciones.'}</p>
                            </div>
                            <div className="portfolio-excel-insights__panel-actions">
                                <div className="portfolio-excel-insights__period-summary">
                                    <span>Rentabilidad del periodo</span>
                                    <strong className={selectedPeriodPerformance.returnPercent !== null && selectedPeriodPerformance.returnPercent < 0 ? 'is-negative' : ''}>{percent(selectedPeriodPerformance.returnPercent)}</strong>
                                    <small>{selectedPeriodPerformance.observations} intervalos válidos · base {formatHistoryDate(selectedPeriodPerformance.baseDate)}{selectedPeriodPerformance.missingIntervals > 0 && ` · ${selectedPeriodPerformance.missingIntervals} sin base verificable`}{selectedPeriod.incompleteSince && ` · hasta ${formatChartDate(selectedPeriodPerformance.endDate ?? '')}`}</small>
                                </div>
                                <strong>{evolutionSeries.length} observaciones</strong>
                                <div className="portfolio-excel-insights__periods" role="group" aria-label="Periodo de evolución">
                                    {evolutionPeriods.map((period) => (
                                        <button
                                            key={period.value}
                                            type="button"
                                            aria-pressed={evolutionPeriod === period.value}
                                            className={evolutionPeriod === period.value ? 'is-active' : ''}
                                            onClick={() => startPanelTransition(()=>setEvolutionPeriod(period.value))}
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
                                    <XAxis dataKey="timestamp" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={formatChartDate} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} minTickGap={28} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={formatAxisCurrency} width={48} />
                                    <Tooltip {...tooltipTheme} labelFormatter={label => formatChartDate(Number(label))} formatter={(value: number | string | undefined, name?: string) => [currency(Number(value || 0)), name === 'value' ? 'Valor actual' : 'Capital invertido']} />
                                    <Legend formatter={(value) => value === 'value' ? 'Valor actual' : 'Capital invertido'} />
                                    <Area type="linear" isAnimationActive={false} dataKey="value" stroke="#10b981" fill="url(#liveValueFill)" strokeWidth={2} />
                                    <Line isAnimationActive={false} type="monotone" dataKey="invested" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="portfolio-excel-insights__empty">Necesitamos al menos dos actualizaciones de precios para dibujar la evolución.</div>
                        )}
                        {significantCapitalFlow && (
                            <p className="portfolio-excel-insights__chart-note">
                                El cierre de {formatHistoryDate(significantCapitalFlow.date)} incluye una {significantCapitalFlow.amount >= 0 ? 'aportación' : 'retirada'} neta de {currency(Math.abs(significantCapitalFlow.amount))}; se excluye del cálculo de rentabilidad.
                            </p>
                        )}
                    </section>
                )}

                {tab === 'benchmark' && (
                    <section className="portfolio-excel-insights__panel">
                        <div className="portfolio-excel-insights__panel-heading">
                            <div>
                                <h3><BarChart3 size={16} /> Comparativa automática</h3>
                                <p>{benchmarkUsesWorkbook ? 'Fuente: histórico importado.' : benchmarkUsesExtension ? 'Fuente: histórico y valores liquidativos del fondo.' : `${BENCHMARK_NAME} (${BENCHMARK_ISIN}).`}</p>
                            </div>
                            <div className="portfolio-excel-insights__panel-actions">
                                <div className="portfolio-excel-insights__periods" role="group" aria-label="Periodo de benchmark">
                                    {evolutionPeriods.map((period) => (
                                        <button
                                            key={period.value}
                                            type="button"
                                            aria-pressed={evolutionPeriod === period.value}
                                            className={evolutionPeriod === period.value ? 'is-active' : ''}
                                            onClick={() => startPanelTransition(()=>setEvolutionPeriod(period.value))}
                                        >
                                            {period.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="portfolio-excel-insights__benchmark-portfolio">
                            <span>Tu cartera · {evolutionPeriod === 'YTD' ? 'YTD' : 'periodo seleccionado'}{selectedPeriod.incompleteSince && ` hasta ${formatChartDate(selectedPeriod.performance.endDate ?? '')}`}</span>
                            <strong>{percent(selectedPeriod.performance.returnPercent)}</strong>
                        </div>
                        {selectedPeriod.incompleteSince && <p className="portfolio-excel-insights__chart-note" role="status">Datos pendientes de verificar desde {formatChartDate(selectedPeriod.incompleteSince)}.</p>}
                        {hasPortfolioBenchmark && <p className="portfolio-excel-insights__comparison-dates">
                            {benchmarkPartial ? 'Benchmark' : 'Comparación'} del {formatChartDate(benchmarkLine[0].date)} al {formatChartDate(benchmarkLine.at(-1)!.date)}
                        </p>}
                        {benchmarkPartial && <p className="portfolio-excel-insights__chart-note" role="status">
                            {benchmarkHasPeriodBase
                                ? `Tu cartera incluye el último dato. La diferencia se calcula hasta ${formatChartDate(benchmarkLine.at(-1)!.date)}.`
                                : 'Falta el cierre inicial del benchmark para comparar este periodo. La gráfica muestra tu cartera.'}
                        </p>}
                        {!hasPortfolioBenchmark && <p className="portfolio-excel-insights__chart-note" role="status">Benchmark sin histórico suficiente para este periodo.</p>}
                        {['3M', 'YTD', 'ALL'].includes(evolutionPeriod) && <p className="portfolio-excel-insights__chart-note">
                            Cierres mensuales · mes en curso provisional.
                            {benchmarkChart.at(-1)?.date.slice(0, 10) !== selectedPeriod.performance.endDate?.slice(0, 10)
                                && ` Gráfico hasta ${formatChartDate(benchmarkChart.at(-1)?.date ?? '')}; tu rentabilidad superior incluye el ${formatChartDate(selectedPeriod.performance.endDate ?? '')}.`}
                        </p>}
                        <div className="portfolio-excel-insights__benchmark-kpis">
                            <div><span>Fidelity MSCI World{benchmarkPartial ? ' · datos disponibles' : ''}</span><strong>{percent(benchmarkReturn)}</strong></div>
                            <div><span>{comparison&&benchmarkPartial?`Diferencia hasta ${formatChartDate(comparison.endDate)}`:'Diferencia del periodo'}</span><strong className={benchmarkDifference === null ? '' : benchmarkDifference >= 0 ? 'is-positive' : 'is-negative'}>{percent(benchmarkDifference).replace('%', ' pp')}</strong></div>
                        </div>
                        {benchmarkChart.length > 1 ? (
                            <ResponsiveContainer width="100%" height={230}>
                                <LineChart data={benchmarkChart} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                                    <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={formatChartDate} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} interval="preserveStartEnd" minTickGap={28} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={(value) => value + '%'} width={45} />
                                    <Tooltip {...tooltipTheme} filterNull={false} labelFormatter={label => typeof label === 'string' || typeof label === 'number' ? formatChartDate(label) : ''} formatter={(value: number | string | undefined, name?: string) => [percent(value == null ? null : Number(value)), benchmarkSeriesLabel(name)]} />
                                    <Legend formatter={(value) => benchmarkSeriesLabel(String(value))} />
                                    <Line isAnimationActive={false} type="linear" dataKey="portfolio" name="Tu cartera" stroke="#10b981" strokeWidth={2} dot={false} />
                                    {benchmarkHasPeriodBase && <Line isAnimationActive={false} type="linear" dataKey="benchmark" name="Fidelity MSCI World" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls />}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="portfolio-excel-insights__empty">No hay histórico suficiente para dibujar la rentabilidad del periodo seleccionado.</div>
                        )}
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
                                    <Bar isAnimationActive={false} dataKey="actual" name="Peso actual" fill="#10b981" radius={[0, 6, 6, 0]} />
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
                                <p>Meses cerrados consecutivos, retornos ajustados por flujos y tasa libre de riesgo del {plainPercent(riskFreeAnnual)} anual.</p>
                            </div>
                            <strong>{recentMonthly.length} meses</strong>
                        </div>
                        {recentMonthly.length > 1 ? (
                            <ResponsiveContainer width="100%" height={270}>
                                <ComposedChart data={recentMonthly} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                                    <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} minTickGap={28} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={(value) => value + '%'} width={45} />
                                    <Tooltip {...tooltipTheme} formatter={(value: number | string | undefined, name?: string) => [percent(Number(value || 0)), name || 'Valor']} />
                                    <Legend />
                                    <Bar isAnimationActive={false} dataKey="monthlyReturn" name="Retorno mensual" fill="#10b981" radius={[5, 5, 0, 0]} />
                                    <Line isAnimationActive={false} type="monotone" dataKey="drawdown" name="Drawdown" stroke="#ef4444" strokeWidth={2} dot={false} />
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
                            <span>Observaciones <strong>{history.length}</strong></span>
                            <span>Pendientes de consulta <strong>{stale}</strong></span>
                        </div>
                        {(sharpe === null || sortino === null) && <details className="portfolio-excel-insights__missing"><summary>¿Por qué hay ratios sin dato?</summary>{sharpe === null && <p>Sharpe: {missingMetricReason('Ratio Sharpe', recentMonthly.length)}</p>}{sortino === null && <p>Sortino: {missingMetricReason('Ratio Sortino', recentMonthly.length)}</p>}</details>}
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
                            {transactions.length ? [...transactions]
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
                            <p>{stale ? 'Hay posiciones sin cotización reciente. Pulsa Actualizar precios para reintentar.' : 'Todas las posiciones se han consultado recientemente; la fecha de valoración puede ser anterior.'}</p>
                            <div className="portfolio-excel-insights__live-status">
                                <Activity size={15} />
                                <strong>{lastPriceUpdate ? lastPriceUpdate.toLocaleString('es-ES') : 'Pendiente'}</strong>
                            </div>
                        </div>
                    </section>
                )}
                </div>
            </CardContent>
        </Card>
    );
}
