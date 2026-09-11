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
import { performanceSeries } from '../../services/portfolioPerformance';
import type { HistoricalDataPoint } from '../../types/types';
import './PortfolioExcelInsights.css';

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
const tooltipTheme = {
    contentStyle: {
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
    },
    labelStyle: { color: 'var(--text-primary)' },
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
    if (period === '1D') now.setDate(now.getDate() - 1);
    else if (period === '7D') now.setDate(now.getDate() - 7);
    else now.setMonth(now.getMonth() - (period === '3M' ? 3 : 1));
    return now.getTime();
}

export function PortfolioExcelInsights({ now }: { now: number }) {
    const { state: { assets, transactions, lastPriceUpdate } } = usePortfolio();
    const [tab, setTab] = useState<InsightTab>('evolution');
    const [evolutionPeriod, setEvolutionPeriod] = useState<EvolutionPeriod>('ALL');
    const [benchmark, setBenchmark] = useState<HistoricalDataPoint[]>([]);

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
        const stored = getHistory();
        return stored.length || !assets.length
            ? stored
            : [{ date: new Date(now).toISOString(), value: totalValue, invested: investedValue }];
    }, [assets.length, investedValue, now, totalValue]);
    const series = useMemo(() => performanceSeries(history, transactions), [history, transactions]);

    const monthly = useMemo(() => {
        const rows = new Map<string, {
            month: string;
            value: number;
            invested: number;
            factor: number;
            observations: number;
            drawdown: number;
        }>();
        let peak = 100;

        series.forEach((point) => {
            peak = Math.max(peak, point.index);
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
            current.drawdown = Math.min(current.drawdown, point.index / peak * 100 - 100);
            if (point.dailyReturn !== null) {
                current.factor *= 1 + point.dailyReturn / 100;
                current.observations += 1;
            }
            rows.set(month, current);
        });

        return [...rows.values()].map((row) => ({
            ...row,
            monthlyReturn: (row.factor - 1) * 100,
        }));
    }, [series]);

    const returns = series
        .map((point) => point.dailyReturn)
        .filter((value): value is number => value !== null && Number.isFinite(value));
    const mean = returns.length ? returns.reduce((sum, value) => sum + value, 0) / returns.length : 0;
    const variance = returns.length > 1
        ? returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (returns.length - 1)
        : 0;
    const downside = returns.filter((value) => value < 0);
    const downsideDeviation = downside.length
        ? Math.sqrt(downside.reduce((sum, value) => sum + value ** 2, 0) / downside.length)
        : 0;
    const volatility = returns.length > 1 ? Math.sqrt(variance) * Math.sqrt(252) : null;
    const sharpe = variance > 0 ? mean / Math.sqrt(variance) * Math.sqrt(252) : null;
    const sortino = downsideDeviation > 0 ? mean / downsideDeviation * Math.sqrt(252) : null;

    let peak = 0;
    let maxDrawdown = 0;
    series.forEach((point) => {
        peak = Math.max(peak, point.index);
        if (peak > 0) maxDrawdown = Math.min(maxDrawdown, (point.index / peak - 1) * 100);
    });
    const firstDate = series[0] ? new Date(series[0].date).getTime() : 0;
    const years = firstDate
        ? Math.max((now - firstDate) / (365.25 * 24 * 60 * 60 * 1000), 1 / 365.25)
        : 0;
    const annualized = years >= 1
        ? ((Math.pow((series.at(-1)?.index || 100) / 100, 1 / years) - 1) * 100)
        : null;
    const positiveDays = returns.length ? returns.filter((value) => value > 0).length / returns.length * 100 : null;
    const currentReturn = investedValue > 0 ? (totalValue / investedValue - 1) * 100 : 0;
    const bestMonth = monthly.length
        ? monthly.reduce((best, row) => row.monthlyReturn > best.monthlyReturn ? row : best)
        : null;
    const worstMonth = monthly.length
        ? monthly.reduce((worst, row) => row.monthlyReturn < worst.monthlyReturn ? row : worst)
        : null;
    const negativeMonths = monthly.filter((row) => row.monthlyReturn < 0).length;
    const stale = assets.filter((asset) => {
        if (!asset.lastQuoteAt) return true;
        return now - new Date(asset.lastQuoteAt).getTime() > QUOTE_WINDOW_MS;
    }).length;
    const freshQuotes = assets.length - stale;
    const dataCoverage = assets.length ? freshQuotes / assets.length * 100 : 0;
    const duplicateSymbols = assets.length - new Set(assets.map((asset) => asset.symbol.toUpperCase())).size;
    const invalidPositions = assets.filter((asset) => asset.quantity <= 0 || asset.purchasePrice <= 0).length;
    const assetTypes = new Set(assets.map((asset) => asset.type)).size;
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
    const buys = transactions
        .filter((transaction) => transaction.type === 'buy')
        .reduce((sum, transaction) => sum + (transaction.total || 0), 0);
    const sells = transactions
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
        { label: 'Rentabilidad anualizada', value: percent(annualized), detail: 'Mínimo 1 año', icon: <Gauge size={17} /> },
        { label: 'Volatilidad anualizada', value: percent(volatility), detail: 'Riesgo estimado', icon: <BarChart3 size={17} /> },
        { label: 'Máximo drawdown', value: series.length > 1 ? percent(maxDrawdown) : 'N/D', detail: 'Caída desde máximos', icon: <ArrowDownRight size={17} />, tone: 'is-negative' },
        { label: 'Días positivos', value: percent(positiveDays), detail: `${returns.length} intervalos válidos`, icon: <ShieldCheck size={17} /> },
        { label: 'Ratio Sharpe', value: sharpe === null ? 'N/D' : sharpe.toFixed(2), detail: 'Retorno / riesgo', icon: <Gauge size={17} /> },
        { label: 'Ratio Sortino', value: sortino === null ? 'N/D' : sortino.toFixed(2), detail: 'Riesgo bajista', icon: <Gauge size={17} /> },
        { label: 'Mejor mes', value: percent(bestMonth?.monthlyReturn), detail: bestMonth?.month || 'Sin histórico', icon: <ArrowUpRight size={17} />, tone: 'is-positive' },
        { label: 'Peor mes', value: percent(worstMonth?.monthlyReturn), detail: worstMonth?.month || 'Sin histórico', icon: <ArrowDownRight size={17} />, tone: 'is-negative' },
        { label: 'Meses negativos', value: monthly.length ? `${negativeMonths} de ${monthly.length}` : 'N/D', detail: 'Periodos cerrados', icon: <AlertTriangle size={17} /> },
        { label: 'Compras registradas', value: currency(buys), detail: 'Flujo de entrada', icon: <WalletCards size={17} /> },
        { label: 'Ventas registradas', value: currency(sells), detail: 'Flujo de salida', icon: <Coins size={17} /> },
    ];
    const controls = [
        { label: 'Mayor posición', value: leaders[0] ? `${leaders[0].symbol} · ${largestWeight.toFixed(1)}%` : 'N/D', ok: largestWeight <= 35 },
        { label: 'Diversificación', value: `${assets.length} posiciones · ${assetTypes} tipos`, ok: assets.length > 1 },
        { label: 'Cobertura de precios', value: `${dataCoverage.toFixed(0)}%`, ok: stale === 0 },
        { label: 'Posiciones duplicadas', value: duplicateSymbols, ok: duplicateSymbols === 0 },
        { label: 'Cantidades o precios inválidos', value: invalidPositions, ok: invalidPositions === 0 },
        { label: 'Cotizaciones sin actualizar', value: stale, ok: stale === 0 },
        { label: 'Histórico de la cartera', value: `${history.length} registros`, ok: history.length >= 2 },
        { label: 'Operaciones registradas', value: transactions.length, ok: transactions.length > 0 },
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
                                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} minTickGap={28} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={(value) => Math.round(value / 1000) + 'k'} width={42} />
                                    <Tooltip {...tooltipTheme} formatter={(value: number | string | undefined, name?: string) => [currency(Number(value || 0)), name === 'value' ? 'Valor actual' : 'Capital invertido']} />
                                    <Legend formatter={(value) => value === 'value' ? 'Valor actual' : 'Capital invertido'} />
                                    <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#liveValueFill)" strokeWidth={2} />
                                    <Line type="monotone" dataKey="invested" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="portfolio-excel-insights__empty">Necesitamos al menos dos actualizaciones de precios para dibujar la evolución.</div>
                        )}
                    </section>
                )}

                {tab === 'benchmark' && (
                    <section className="portfolio-excel-insights__panel">
                        <div className="portfolio-excel-insights__panel-heading">
                            <div>
                                <h3><BarChart3 size={16} /> Comparativa automática</h3>
                                <p>Tu cartera frente a URTH como proxy del MSCI World, usando datos vivos del mercado.</p>
                            </div>
                            <strong>{benchmark.length} puntos</strong>
                        </div>
                        <div className="portfolio-excel-insights__benchmark-kpis">
                            <div><span>Tu cartera</span><strong>{percent(portfolioBenchmarkReturn)}</strong></div>
                            <div><span>MSCI World proxy</span><strong>{percent(benchmarkReturn)}</strong></div>
                            <div><span>Diferencia</span><strong className={benchmarkReturn !== null && portfolioBenchmarkReturn - benchmarkReturn >= 0 ? 'is-positive' : 'is-negative'}>{benchmarkReturn === null ? 'N/D' : percent(portfolioBenchmarkReturn - benchmarkReturn)}</strong></div>
                        </div>
                        {benchmarkLine.length > 1 ? (
                            <ResponsiveContainer width="100%" height={230}>
                                <LineChart data={benchmarkLine} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} minTickGap={28} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={(value) => value + '%'} width={45} />
                                    <Tooltip {...tooltipTheme} formatter={(value: number | string | undefined, name?: string) => [percent(Number(value || 0)), name === 'portfolio' ? 'Tu cartera' : 'MSCI World proxy']} />
                                    <Legend formatter={(value) => value === 'portfolio' ? 'Tu cartera' : 'MSCI World proxy'} />
                                    {hasPortfolioBenchmark && <Line type="monotone" dataKey="portfolio" name="Tu cartera" stroke="#10b981" strokeWidth={2} dot={false} connectNulls />}
                                    <Line type="monotone" dataKey="benchmark" name="MSCI World proxy" stroke="#3b82f6" strokeWidth={2} dot={false} />
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
                                <p>Calculado con los retornos de tus snapshots y operaciones registradas.</p>
                            </div>
                            <strong>{monthly.length} meses</strong>
                        </div>
                        {monthly.length > 1 ? (
                            <ResponsiveContainer width="100%" height={270}>
                                <ComposedChart data={monthly} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}>
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
                            <span>Peor mes <strong>{percent(worstMonth?.monthlyReturn)}</strong></span>
                            <span>Meses negativos <strong>{monthly.length ? `${negativeMonths} de ${monthly.length}` : 'N/D'}</strong></span>
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
