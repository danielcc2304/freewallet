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
import { buildPortfolioAnalyticsHistory, calculatePeriodPerformance, createMarketPortfolioHistory, createQuoteSnapshot, normalizePortfolioTransactions, performanceSeries, portfolioMonthlyRows, workbookRiskStats, alignedBenchmark } from '../../services/portfolioPerformance';
import { readWorkbookHistory } from '../../services/portfolioWorkbookHistory';
import type { HistoricalDataPoint } from '../../types/types';
import './PortfolioExcelInsights.css';

type InsightTab = 'evolution' | 'benchmark' | 'allocation' | 'risk' | 'controls';
type EvolutionPeriod = '1D' | '7D' | '1M' | '3M' | 'YTD' | 'ALL';

const QUOTE_WINDOW_MS = 15 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const RISK_FREE_ANNUAL_PCT = 2.75;
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
        ? new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric', timeZone: 'Europe/Madrid' }).format(date).replace('.', '')
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
    const [assetHistory, setAssetHistory] = useState<Map<string, HistoricalDataPoint[]>>(new Map());
    const portfolioTransactions = useMemo(() => normalizePortfolioTransactions(assets, transactions), [transactions, assets]);
    const workbookHistory = useMemo(() => readWorkbookHistory(), []);
    const usingWorkbookHistory = workbookHistory.points.length >= 2;
    const assetSignature = assets.map((asset) => `${asset.id}:${asset.symbol}:${asset.isin || ''}:${asset.purchaseDate}`).sort().join('|');

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

    useEffect(() => {
        if (!assets.length) {
            return undefined;
        }
        const controller = new AbortController();
        Promise.all(assets.map(async (asset) => {
            const symbol = asset.isin || asset.symbol;
            const points = await getAssetChartData(symbol, 'ALL', controller.signal);
            return [asset.id, points] as const;
        })).then((entries) => {
            if (!controller.signal.aborted) setAssetHistory(new Map(entries));
        }).catch(() => {
            if (!controller.signal.aborted) setAssetHistory(new Map());
        });
        return () => controller.abort();
    }, [assetSignature, assets]);

    const liveHistory = useMemo(() => {
        const currentSnapshot = createQuoteSnapshot(assets, portfolioTransactions, new Date(now).toISOString());
        const marketHistory = createMarketPortfolioHistory(assets, portfolioTransactions, assetHistory);
        return buildPortfolioAnalyticsHistory([...getHistory(), ...marketHistory], portfolioTransactions, currentSnapshot || undefined, assets);
    }, [assetHistory, assets, now, portfolioTransactions]);
    const history = usingWorkbookHistory ? workbookHistory.points : liveHistory;
    const analyticsTransactions = usingWorkbookHistory ? workbookHistory.flowTransactions : portfolioTransactions;
    const historyMaxGapDays = usingWorkbookHistory && workbookHistory.source === 'monthly' ? 45 : 16;
    const series = useMemo(
        () => performanceSeries(history, analyticsTransactions, assets, { maxGapDays: historyMaxGapDays }),
        [analyticsTransactions, assets, history, historyMaxGapDays],
    );

    const monthly = useMemo(() => portfolioMonthlyRows(series, now), [series, now]);
    const dailyReturns = series.map(p => p.dailyReturn).filter((r): r is number => r !== null);
    const validMonthly = monthly.filter(row => row.closed && row.complete && row.monthlyReturn !== null)
        .map(row => ({ ...row, monthlyReturn: row.monthlyReturn! }));
    const monthlyReturns = validMonthly.map(row => row.monthlyReturn);
    // Only the most recent continuous run is eligible for aggregate risk.
    const contiguous = validMonthly.every((row, i) => {
        if (!i) return true;
        const previous = validMonthly[i - 1].month;
        return Number(row.month.slice(0, 4)) * 12 + Number(row.month.slice(5)) -
            (Number(previous.slice(0, 4)) * 12 + Number(previous.slice(5))) === 1;
    });
    const { volatility, sharpe, sortino, annualized, maxDrawdown } = workbookRiskStats(contiguous ? monthlyReturns : [], RISK_FREE_ANNUAL_PCT);
    const historyYears = monthlyReturns.length ? monthlyReturns.length / 12 : null;
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
    const ledgerFlow = portfolioTransactions.reduce((sum, transaction) => {
        const amount = transaction.total || 0;
        return sum + (transaction.type === 'buy' ? amount : transaction.type === 'sell' ? -amount : 0);
    }, 0);
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

    const benchmarkLine = useMemo(() => alignedBenchmark(series, benchmark), [series, benchmark]);
    const benchmarkReturn = benchmarkLine.at(-1)?.benchmark ?? null;
    const portfolioBenchmarkReturn = benchmarkLine.at(-1)?.portfolio ?? null;
    const hasPortfolioBenchmark = benchmarkLine.length > 1;
    const benchmarkDifference = benchmarkReturn !== null && portfolioBenchmarkReturn !== null ? portfolioBenchmarkReturn - benchmarkReturn : null;

    const evolutionSeries = useMemo(() => {
        const cutoff = getPeriodCutoff(evolutionPeriod, now);
        if (cutoff === null) return series;
        return series.filter((point) => new Date(point.date).getTime() >= cutoff);
    }, [evolutionPeriod, now, series]);
    const selectedPeriodPerformance = useMemo(() => {
        const cutoff = getPeriodCutoff(evolutionPeriod, now);
        const maxBaseGap = cutoff === null
            ? Number.POSITIVE_INFINITY
            : usingWorkbookHistory && workbookHistory.source === 'monthly'
                ? Math.max(45 * DAY_MS, (now - cutoff) * 1.5)
                : Math.max(3 * DAY_MS, (now - cutoff) * 1.5);
        return calculatePeriodPerformance(series, cutoff ?? Number.NEGATIVE_INFINITY, now, maxBaseGap);
    }, [evolutionPeriod, now, series, usingWorkbookHistory, workbookHistory.source]);
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
        { label: 'Capital invertido', value: currency(investedValue), detail: `${transactions.length} operaciones`, icon: <Coins size={17} /> },
        { label: 'Rentabilidad total', value: percent(currentReturn), detail: currency(totalValue - investedValue), icon: <ArrowUpRight size={17} />, tone: currentReturn >= 0 ? 'is-positive' : 'is-negative' },
        { label: 'Rentabilidad anualizada', value: percent(annualized), detail: historyYears === null ? 'Sin meses cerrados' : `${monthlyReturns.length} meses cerrados`, icon: <Gauge size={17} /> },
        { label: 'Volatilidad anualizada', value: plainPercent(volatility), detail: 'Riesgo estimado', icon: <BarChart3 size={17} /> },
        { label: 'Máximo drawdown', value: plainPercent(maxDrawdown), detail: 'Entre cierres mensuales', icon: <ArrowDownRight size={17} />, tone: maxDrawdown !== null && maxDrawdown < 0 ? 'is-negative' : undefined },
        { label: 'Periodos positivos', value: plainPercent(positiveDays), detail: `${dailyReturns.length} intervalos válidos`, icon: <ShieldCheck size={17} /> },
        { label: 'Ratio Sharpe', value: sharpe === null ? 'N/D' : sharpe.toFixed(2), detail: 'Retorno / riesgo', icon: <Gauge size={17} /> },
        { label: 'Ratio Sortino', value: sortino === null ? 'N/D' : sortino.toFixed(2), detail: 'Riesgo bajista', icon: <Gauge size={17} /> },
        { label: 'Mejor mes', value: percent(bestMonth?.monthlyReturn), detail: bestMonth?.month || 'Sin histórico', icon: <ArrowUpRight size={17} />, tone: bestMonth ? (bestMonth.monthlyReturn < 0 ? 'is-negative' : 'is-positive') : undefined },
        { label: 'Peor mes', value: plainPercent(worstMonth?.monthlyReturn), detail: worstMonth?.month || 'Sin histórico', icon: <ArrowDownRight size={17} />, tone: worstMonth && worstMonth.monthlyReturn < 0 ? 'is-negative' : undefined },
        { label: 'Meses negativos', value: validMonthly.length ? `${negativeMonths} de ${validMonthly.length}` : 'N/D', detail: 'Periodos cerrados', icon: <AlertTriangle size={17} /> },
        { label: 'Compras registradas', value: currency(buys), detail: 'Importes originales', icon: <WalletCards size={17} /> },
        { label: 'Ventas registradas', value: currency(sells), detail: 'Importes originales', icon: <Coins size={17} /> },
    ];
    const controls = [
        { label: 'Mayor posición', value: leaders[0] ? `${leaders[0].symbol} · ${largestWeight.toFixed(1)}%` : 'N/D', ok: largestWeight <= 35 },
        { label: 'Diversificación', value: `${assets.length} posiciones · ${assetTypes} tipos`, ok: assets.length > 1 },
        { label: 'Cobertura de precios', value: `${dataCoverage.toFixed(0)}%`, ok: stale === 0 },
        { label: 'Flujo neto registrado', value: currency(ledgerFlow), ok: Number.isFinite(ledgerFlow) },
        { label: 'Posiciones duplicadas', value: duplicateSymbols, ok: duplicateSymbols === 0 },
        { label: 'Cantidades o precios inválidos', value: invalidPositions, ok: invalidPositions === 0 },
        { label: 'Cotizaciones sin actualizar', value: stale, ok: stale === 0 },
        { label: 'Histórico utilizado', value: usingWorkbookHistory
            ? `${workbookHistory.evolutionCount} cierres · ${workbookHistory.dcaCount} flujos Excel`
            : `${history.length} registros verificados`, ok: history.length >= 2 },
        { label: 'Snapshots en vivo', value: `${getHistory().length}`, ok: getHistory().length >= 2 },
        { label: 'Operaciones registradas', value: transactions.length, ok: transactions.length > 0 },
        { label: 'Divisa normalizada', value: assets.every((asset) => !asset.currency || asset.currency === 'EUR') ? 'EUR' : 'Revisar', ok: assets.every((asset) => !asset.currency || asset.currency === 'EUR') },
    ];

    return (
        <Card className="portfolio-excel-insights">
            <CardHeader title="Análisis avanzado" subtitle={usingWorkbookHistory
                ? 'Posiciones actuales y evolución mensual importada de tu Excel'
                : 'Posiciones actuales y rentabilidad calculada con valoraciones verificadas'} />
            <CardContent>
                <p className="portfolio-excel-insights__chart-note" role="status">
                    {usingWorkbookHistory
                        ? `Histórico importado del Excel: ${workbookHistory.evolutionCount} cierres mensuales (${formatHistoryDate(workbookHistory.startDate)} a ${formatHistoryDate(workbookHistory.endDate)}). `
                            + `Las ${workbookHistory.dcaCount} aportaciones y retiradas se aplican en su fecha de cierre de la hoja Evolucion. `
                            + `El resumen superior sigue mostrando tus ${assets.length} posiciones y su valoración actual.`
                        : history.length
                            ? `Seguimiento verificable desde ${formatHistoryDate(series[0]?.date)}. `
                                + 'El histórico antiguo se conserva, pero no se usa para calcular retornos porque no identifica las posiciones ni el origen de cada valoración.'
                            : 'Pendiente de una actualización completa de cotizaciones.'}
                </p>
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
                                <h3><CalendarClock size={16} /> Evolución registrada de la cartera</h3>
                                <p>{usingWorkbookHistory
                                    ? 'Cierres mensuales importados de la hoja Evolucion, con cada DCA aplicado en su fecha.'
                                    : 'Valoraciones completas guardadas con tus cotizaciones y operaciones.'}</p>
                            </div>
                            <div className="portfolio-excel-insights__panel-actions">
                                <div className="portfolio-excel-insights__period-summary">
                                    <span>Rentabilidad del periodo</span>
                                    <strong className={selectedPeriodPerformance.returnPercent !== null && selectedPeriodPerformance.returnPercent < 0 ? 'is-negative' : ''}>{percent(selectedPeriodPerformance.returnPercent)}</strong>
                                    <small>{selectedPeriodPerformance.observations} intervalos · base {formatHistoryDate(selectedPeriodPerformance.baseDate)}</small>
                                </div>
                                <strong>{evolutionSeries.length} observaciones</strong>
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
                                    <XAxis dataKey="date" tickFormatter={formatChartDate} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} interval="preserveStartEnd" minTickGap={28} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={formatAxisCurrency} width={48} />
                                    <Tooltip {...tooltipTheme} formatter={(value: number | string | undefined, name?: string) => [currency(Number(value || 0)), name === 'value' ? 'Valor actual' : 'Capital invertido']} />
                                    <Legend formatter={(value) => value === 'value' ? 'Valor actual' : 'Capital invertido'} />
                                    <Area type="linear" isAnimationActive={false} dataKey="value" stroke="#10b981" fill="url(#liveValueFill)" strokeWidth={2} />
                                    <Line type="monotone" dataKey="invested" stroke="#8b5cf6" strokeWidth={2} dot={false} />
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
                                <p>Tu cartera frente al MSCI World (URTH), usando datos vivos del mercado.</p>
                            </div>
                            <strong>{benchmark.length} puntos</strong>
                        </div>
                        <div className="portfolio-excel-insights__benchmark-kpis">
                            <div><span>Tu cartera</span><strong>{percent(portfolioBenchmarkReturn)}</strong></div>
                            <div><span>MSCI World</span><strong>{percent(benchmarkReturn)}</strong></div>
                            <div><span>Diferencia</span><strong className={benchmarkDifference !== null && benchmarkDifference >= 0 ? 'is-positive' : 'is-negative'}>{percent(benchmarkDifference)}</strong></div>
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
                                <p>Meses cerrados, desviación mensual y €STR constante del 2,75% anual, igual que el Excel.</p>
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
                            <span>Observaciones <strong>{history.length}</strong></span>
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
