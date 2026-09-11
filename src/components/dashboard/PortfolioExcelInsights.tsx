import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, AlertTriangle, BarChart3, CalendarClock, CheckCircle2, Layers3, ListChecks, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader } from '../ui';
import { usePortfolio } from '../../context/PortfolioContext';
import { getHistory } from '../../services/storageService';
import { getAssetChartData } from '../../services/apiService';
import { performanceSeries } from '../../services/portfolioPerformance';
import type { HistoricalDataPoint } from '../../types/types';
import './PortfolioExcelInsights.css';

type InsightTab = 'evolution' | 'benchmark' | 'allocation' | 'risk' | 'controls';
const currency = (value: number) => value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const percent = (value: number | null | undefined) => value === null || value === undefined || !Number.isFinite(value) ? 'N/D' : (value >= 0 ? '+' : '') + value.toLocaleString('es-ES', { maximumFractionDigits: 2 }) + '%';
const tooltipTheme = { contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }, labelStyle: { color: 'var(--text-primary)' } };

export function PortfolioExcelInsights() {
    const { state: { assets, transactions, lastPriceUpdate } } = usePortfolio();
    const [tab, setTab] = useState<InsightTab>('evolution');
    const [benchmark, setBenchmark] = useState<HistoricalDataPoint[]>([]);
    const totalValue = useMemo(() => assets.reduce((sum, asset) => sum + (asset.currentPrice || asset.purchasePrice) * asset.quantity, 0), [assets]);
    const investedValue = useMemo(() => assets.reduce((sum, asset) => sum + asset.purchasePrice * asset.quantity, 0), [assets]);

    useEffect(() => {
        const controller = new AbortController();
        getAssetChartData('URTH', 'YTD', controller.signal)
            .then(data => { if (!controller.signal.aborted) setBenchmark(data); })
            .catch(() => { if (!controller.signal.aborted) setBenchmark([]); });
        return () => controller.abort();
    }, [lastPriceUpdate]);

    const history = useMemo(() => {
        const stored = getHistory();
        return stored.length || !assets.length
            ? stored
            : [{ date: new Date().toISOString(), value: totalValue, invested: investedValue }];
    }, [assets.length, investedValue, lastPriceUpdate, totalValue]);
    const series = useMemo(() => performanceSeries(history, transactions), [history, transactions]);
    const monthly = useMemo(() => {
        const rows = new Map<string, { month: string; value: number; invested: number; factor: number; observations: number; drawdown: number }>();
        let peak = 100;
        series.forEach(point => {
            peak = Math.max(peak, point.index);
            const month = point.date.slice(0, 7);
            const current = rows.get(month) || { month, value: 0, invested: 0, factor: 1, observations: 0, drawdown: 0 };
            current.value = point.value;
            current.invested = point.invested;
            current.drawdown = Math.min(current.drawdown, point.index / peak * 100 - 100);
            if (point.dailyReturn !== null) {
                current.factor *= 1 + point.dailyReturn / 100;
                current.observations += 1;
            }
            rows.set(month, current);
        });
        return [...rows.values()].map(row => ({ ...row, monthlyReturn: (row.factor - 1) * 100 })).reverse();
    }, [series]);
    const returns = series.map(point => point.dailyReturn).filter((value): value is number => value !== null && Number.isFinite(value));
    const mean = returns.length ? returns.reduce((sum, value) => sum + value, 0) / returns.length : 0;
    const variance = returns.length > 1 ? returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (returns.length - 1) : 0;
    const downside = returns.filter(value => value < 0);
    const downsideDeviation = downside.length ? Math.sqrt(downside.reduce((sum, value) => sum + value ** 2, 0) / downside.length) : 0;
    const sharpe = variance > 0 ? mean / Math.sqrt(variance) * Math.sqrt(252) : null;
    const sortino = downsideDeviation > 0 ? mean / downsideDeviation * Math.sqrt(252) : null;
    const currentReturn = investedValue > 0 ? (totalValue / investedValue - 1) * 100 : 0;
    const bestMonth = monthly.length ? monthly.reduce((best, row) => row.monthlyReturn > best.monthlyReturn ? row : best) : null;
    const worstMonth = monthly.length ? monthly.reduce((worst, row) => row.monthlyReturn < worst.monthlyReturn ? row : worst) : null;
    const negativeMonths = monthly.filter(row => row.monthlyReturn < 0).length;
    const stale = assets.filter(asset => !asset.lastQuoteAt || Date.now() - new Date(asset.lastQuoteAt).getTime() > 15 * 60 * 1000).length;
    const duplicateSymbols = assets.length - new Set(assets.map(asset => asset.symbol.toUpperCase())).size;
    const invalidPositions = assets.filter(asset => asset.quantity <= 0 || asset.purchasePrice <= 0).length;
    const allocations = useMemo(() => {
        const values = new Map<string, number>();
        assets.forEach(asset => values.set(asset.type, (values.get(asset.type) || 0) + (asset.currentPrice || asset.purchasePrice) * asset.quantity));
        return [...values.entries()].map(([type, value]) => ({ name: ({ stock: 'Acciones', fund: 'Fondos', etf: 'ETF', crypto: 'Cripto' } as Record<string, string>)[type] || type, actual: totalValue ? value / totalValue * 100 : 0 })).sort((a, b) => b.actual - a.actual);
    }, [assets, totalValue]);
    const leaders = useMemo(() => assets.map(asset => ({ symbol: asset.symbol, name: asset.name, value: (asset.currentPrice || asset.purchasePrice) * asset.quantity })).sort((a, b) => b.value - a.value).slice(0, 5), [assets]);
    const benchmarkReturn = benchmark.length > 1 ? (benchmark.at(-1)!.close / benchmark[0].close - 1) * 100 : null;
    const benchmarkLine = benchmark.map((point, index) => ({ date: point.date, benchmark: benchmark.length && benchmark[0].close ? (point.close / benchmark[0].close - 1) * 100 : 0, index }));
    const tabs: Array<{ value: InsightTab; label: string; icon: ReactNode }> = [
        { value: 'evolution', label: 'Evolución', icon: <TrendingUp size={15} /> },
        { value: 'benchmark', label: 'Benchmark', icon: <BarChart3 size={15} /> },
        { value: 'allocation', label: 'Asignación', icon: <Layers3 size={15} /> },
        { value: 'risk', label: 'Riesgo', icon: <AlertTriangle size={15} /> },
        { value: 'controls', label: 'Controles', icon: <ListChecks size={15} /> },
    ];
    const controls = [
        { label: 'Posiciones duplicadas', value: duplicateSymbols, ok: duplicateSymbols === 0 },
        { label: 'Cantidades o precios inválidos', value: invalidPositions, ok: invalidPositions === 0 },
        { label: 'Cotizaciones sin actualizar', value: stale, ok: stale === 0 },
        { label: 'Histórico de la cartera', value: history.length + ' registros', ok: history.length >= 2 },
        { label: 'Operaciones registradas', value: transactions.length, ok: transactions.length > 0 },
        { label: 'Divisa normalizada', value: assets.every(asset => !asset.currency || asset.currency === 'EUR') ? 'EUR' : 'Revisar', ok: assets.every(asset => !asset.currency || asset.currency === 'EUR') },
    ];

    return <Card className="portfolio-excel-insights">
        <CardHeader title="Analítica viva de cartera" subtitle="Las mismas lecturas del Portfolio, recalculadas con tus activos, operaciones, histórico y cotizaciones" />
        <CardContent>
            <div className="portfolio-excel-insights__kpis">
                <div><span>Valor actual</span><strong>{currency(totalValue)}</strong><small>{assets.length} posiciones</small></div>
                <div><span>Capital invertido</span><strong>{currency(investedValue)}</strong><small>{transactions.length} operaciones</small></div>
                <div><span>Rentabilidad total</span><strong className={currentReturn >= 0 ? 'is-positive' : 'is-negative'}>{percent(currentReturn)}</strong><small>{currency(totalValue - investedValue)} de resultado</small></div>
                <div><span>Mejor mes</span><strong className="is-positive">{percent(bestMonth?.monthlyReturn)}</strong><small>{bestMonth?.month || 'Sin histórico'}</small></div>
                <div><span>Actualización</span><strong className={stale ? 'is-warning' : 'is-positive'}>{stale ? 'Revisar' : 'Al día'}</strong><small>{lastPriceUpdate ? lastPriceUpdate.toLocaleTimeString('es-ES') : 'Pendiente'}</small></div>
            </div>
            <div className="portfolio-excel-insights__tabs" role="tablist" aria-label="Analítica viva de cartera">
                {tabs.map(item => <button key={item.value} type="button" role="tab" aria-selected={tab === item.value} className={tab === item.value ? 'is-active' : ''} onClick={() => setTab(item.value)}>{item.icon}{item.label}</button>)}
            </div>
            {tab === 'evolution' && <section className="portfolio-excel-insights__panel"><div className="portfolio-excel-insights__panel-heading"><div><h3><CalendarClock size={16} /> Evolución real de la cartera</h3><p>Valor y capital invertido a partir de los snapshots generados por tus cotizaciones.</p></div><strong>{series.length} registros</strong></div>{series.length > 1 ? <ResponsiveContainer width="100%" height={270}><ComposedChart data={series} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}><defs><linearGradient id="liveValueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" /><XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} minTickGap={28} /><YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={value => Math.round(value / 1000) + 'k'} width={42} /><Tooltip {...tooltipTheme} formatter={(value: number | string | undefined, name?: string) => [currency(Number(value || 0)), name === 'value' ? 'Valor actual' : 'Capital invertido']} /><Legend formatter={(value) => value === 'value' ? 'Valor actual' : 'Capital invertido'} /><Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#liveValueFill)" strokeWidth={2} /><Line type="monotone" dataKey="invested" stroke="#8b5cf6" strokeWidth={2} dot={false} /></ComposedChart></ResponsiveContainer> : <div className="portfolio-excel-insights__empty">Necesitamos al menos dos actualizaciones de precios para dibujar la evolución.</div>}</section>}
            {tab === 'benchmark' && <section className="portfolio-excel-insights__panel"><div className="portfolio-excel-insights__panel-heading"><div><h3><BarChart3 size={16} /> Comparativa automática</h3><p>Tu cartera frente a URTH como proxy del MSCI World, usando datos vivos del mercado.</p></div><strong>{benchmark.length} puntos</strong></div><div className="portfolio-excel-insights__benchmark-kpis"><div><span>Tu cartera</span><strong>{percent(currentReturn)}</strong></div><div><span>MSCI World proxy</span><strong>{percent(benchmarkReturn)}</strong></div><div><span>Diferencia</span><strong className={benchmarkReturn !== null && currentReturn - benchmarkReturn >= 0 ? 'is-positive' : 'is-negative'}>{benchmarkReturn === null ? 'N/D' : percent(currentReturn - benchmarkReturn)}</strong></div></div>{benchmarkLine.length > 1 ? <ResponsiveContainer width="100%" height={220}><LineChart data={benchmarkLine} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" /><XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} minTickGap={28} /><YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={value => value + '%'} width={45} /><Tooltip {...tooltipTheme} formatter={(value: number | string | undefined) => percent(Number(value || 0))} /><Line type="monotone" dataKey="benchmark" name="MSCI World proxy" stroke="#3b82f6" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer> : <div className="portfolio-excel-insights__empty">Aún no hay histórico de mercado suficiente para comparar.</div>}</section>}
            {tab === 'allocation' && <section className="portfolio-excel-insights__allocation"><div className="portfolio-excel-insights__mini-chart"><h3><Layers3 size={16} /> Distribución por tipo</h3><ResponsiveContainer width="100%" height={230}><BarChart data={allocations} layout="vertical" margin={{ left: 10, right: 12 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" horizontal={false} /><XAxis type="number" tickFormatter={value => value + '%'} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} /><YAxis dataKey="name" type="category" width={90} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} /><Tooltip {...tooltipTheme} formatter={(value: number | string | undefined) => percent(Number(value || 0))} /><Bar dataKey="actual" name="Peso actual" fill="#10b981" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div><div className="portfolio-excel-insights__mini-chart"><h3><Target size={16} /> Mayores posiciones</h3>{leaders.map(leader => <div className="portfolio-excel-insights__leader-row" key={leader.symbol}><span><strong>{leader.symbol}</strong><small>{leader.name}</small></span><b>{currency(leader.value)}</b></div>)}</div></section>}
            {tab === 'risk' && <section className="portfolio-excel-insights__panel"><div className="portfolio-excel-insights__panel-heading"><div><h3><AlertTriangle size={16} /> Riesgo y consistencia</h3><p>Calculado con los retornos de tus snapshots, no con datos del Excel.</p></div><strong>{monthly.length} meses</strong></div>{monthly.length > 1 ? <ResponsiveContainer width="100%" height={270}><ComposedChart data={monthly} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" /><XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} minTickGap={28} /><YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={value => value + '%'} width={45} /><Tooltip {...tooltipTheme} formatter={(value: number | string | undefined, name?: string) => [percent(Number(value || 0)), name || 'Valor']} /><Legend /><Bar dataKey="monthlyReturn" name="Retorno mensual" fill="#10b981" radius={[5, 5, 0, 0]} /><Line type="monotone" dataKey="drawdown" name="Drawdown" stroke="#ef4444" strokeWidth={2} dot={false} /></ComposedChart></ResponsiveContainer> : <div className="portfolio-excel-insights__empty">Necesitamos más actualizaciones para calcular el riesgo mensual.</div>}<div className="portfolio-excel-insights__stats"><span>Sharpe <strong>{sharpe === null ? 'N/D' : sharpe.toFixed(2)}</strong></span><span>Sortino <strong>{sortino === null ? 'N/D' : sortino.toFixed(2)}</strong></span><span>Peor mes <strong>{percent(worstMonth?.monthlyReturn)}</strong></span><span>Meses negativos <strong>{negativeMonths} de {monthly.length}</strong></span><span>Histórico <strong>{history.length}</strong></span><span>Stale <strong>{stale}</strong></span></div></section>}
            {tab === 'controls' && <section className="portfolio-excel-insights__controls"><div className="portfolio-excel-insights__control-column"><h3><ListChecks size={16} /> Controles vivos</h3>{controls.map(control => <div className="portfolio-excel-insights__control-row" key={control.label}>{control.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}<span>{control.label}</span><strong className={control.ok ? 'is-ok' : 'is-warn'}>{control.value}</strong></div>)}</div><div className="portfolio-excel-insights__control-column"><h3><Target size={16} /> Operaciones recientes</h3>{transactions.length ? [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7).map(transaction => <div className="portfolio-excel-insights__movement-row" key={transaction.id}><span>{transaction.date}<small>{transaction.assetSymbol} · {transaction.type}</small></span><strong>{currency(transaction.total || 0)}</strong></div>) : <p>Aún no hay operaciones registradas.</p>}</div><div className="portfolio-excel-insights__control-column"><h3><ShieldCheck size={16} /> Estado de actualización</h3><p>{stale ? 'Hay posiciones sin cotización reciente. Pulsa Actualizar precios para reintentar.' : 'Todas las posiciones tienen una cotización reciente.'}</p><div className="portfolio-excel-insights__live-status"><Activity size={15} /><strong>{lastPriceUpdate ? lastPriceUpdate.toLocaleString('es-ES') : 'Pendiente'}</strong></div></div></section>}
        </CardContent>
    </Card>;
}
