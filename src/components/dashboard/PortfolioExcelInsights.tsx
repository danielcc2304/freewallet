import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, AlertTriangle, BarChart3, CalendarClock, CheckCircle2, FileSpreadsheet, Layers3, ListChecks, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader } from '../ui';
import { BUCKET_LABELS, CATEGORY_LABELS, DEFAULT_ADVANCED_STATS_CSV, DEFAULT_BUCKET_TARGETS, DEFAULT_COMPARISON_CSV, DEFAULT_CONTROL_CSV, DEFAULT_DAILY_CSV, DEFAULT_EVOLUTION_CSV, DEFAULT_HOLDINGS_CSV, DEFAULT_MOVEMENTS_CSV, DEFAULT_OBJECTIVES_CSV, STORAGE_KEYS } from '../../pages/PortfolioCsv/portfolioCsvConstants';
import { readStoredNumberMap, readStoredValue } from '../../pages/PortfolioCsv/portfolioCsvStorage';
import { calculateAdvancedPortfolioStats, defaultBucketForCategory, parseAdvancedStats, parseBenchmarkComparison, parseControlRows, parseDailyData, parseEvolution, parseHoldings, parseMovements, parseObjectives, resolveEvolutionPeriods } from '../../pages/PortfolioCsv/portfolioCsvUtils';
import type { HoldingBucket } from '../../pages/PortfolioCsv/portfolioCsvTypes';
import './PortfolioExcelInsights.css';

type InsightTab = 'evolution' | 'benchmark' | 'allocation' | 'risk' | 'controls';
const currency = (value: number) => value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const percent = (value: number | null | undefined) => value === null || value === undefined || !Number.isFinite(value) ? 'N/D' : (value >= 0 ? '+' : '') + value.toLocaleString('es-ES', { maximumFractionDigits: 2 }) + '%';
const tooltipTheme = { contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }, labelStyle: { color: 'var(--text-primary)' } };

function useExcelSnapshot() {
    const read = () => ({
        holdingsRaw: readStoredValue(STORAGE_KEYS.holdingsRaw, DEFAULT_HOLDINGS_CSV),
        evolutionRaw: readStoredValue(STORAGE_KEYS.evolutionRaw, DEFAULT_EVOLUTION_CSV),
        comparisonRaw: readStoredValue(STORAGE_KEYS.comparisonRaw, DEFAULT_COMPARISON_CSV),
        advancedRaw: readStoredValue(STORAGE_KEYS.advancedRaw, DEFAULT_ADVANCED_STATS_CSV),
        dailyRaw: readStoredValue(STORAGE_KEYS.dailyRaw, DEFAULT_DAILY_CSV),
        movementsRaw: readStoredValue(STORAGE_KEYS.movementsRaw, DEFAULT_MOVEMENTS_CSV),
        objectivesRaw: readStoredValue(STORAGE_KEYS.objectivesRaw, DEFAULT_OBJECTIVES_CSV),
        controlRaw: readStoredValue(STORAGE_KEYS.controlRaw, DEFAULT_CONTROL_CSV),
        workbookFile: readStoredValue(STORAGE_KEYS.workbookFile, 'Demo precargada'),
        updatedAt: readStoredValue(STORAGE_KEYS.updatedAt, ''),
        bucketTargets: readStoredNumberMap(STORAGE_KEYS.bucketTargets, DEFAULT_BUCKET_TARGETS),
    });
    const [snapshot, setSnapshot] = useState(read);
    useEffect(() => {
        const refresh = () => setSnapshot(read());
        window.addEventListener('storage', refresh);
        window.addEventListener('focus', refresh);
        return () => { window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); };
    }, []);
    return snapshot;
}

export function PortfolioExcelInsights() {
    const snapshot = useExcelSnapshot();
    const [tab, setTab] = useState<InsightTab>('evolution');
    const holdings = useMemo(() => parseHoldings(snapshot.holdingsRaw), [snapshot.holdingsRaw]);
    const evolutionBase = useMemo(() => parseEvolution(snapshot.evolutionRaw), [snapshot.evolutionRaw]);
    const comparison = useMemo(() => parseBenchmarkComparison(snapshot.comparisonRaw), [snapshot.comparisonRaw]);
    const controls = useMemo(() => parseControlRows(snapshot.controlRaw), [snapshot.controlRaw]);
    const objectives = useMemo(() => parseObjectives(snapshot.objectivesRaw), [snapshot.objectivesRaw]);
    const movements = useMemo(() => parseMovements(snapshot.movementsRaw), [snapshot.movementsRaw]);
    const daily = useMemo(() => parseDailyData(snapshot.dailyRaw), [snapshot.dailyRaw]);
    const advancedSource = useMemo(() => parseAdvancedStats(snapshot.advancedRaw), [snapshot.advancedRaw]);
    const advanced = useMemo(() => calculateAdvancedPortfolioStats(evolutionBase, comparison, daily, advancedSource.riskFreeAnnualPct), [advancedSource.riskFreeAnnualPct, comparison, daily, evolutionBase]);
    const periods = useMemo(() => resolveEvolutionPeriods(evolutionBase), [evolutionBase]);
    const evolution = useMemo(() => {
        let contributed = 0;
        let peak = 0;
        const initial = evolutionBase[0]?.initialCapital || 0;
        return evolutionBase.map(point => {
            contributed += point.monthlyContribution;
            const invested = initial + contributed;
            peak = Math.max(peak, point.totalValue);
            return { period: periods.get(point.period) || point.period, totalValue: point.totalValue, investedValue: invested, gain: point.totalValue - invested, monthlyReturnPct: point.monthlyReturnPct, twrYtdPct: point.twrYtdPct, drawdownPct: peak ? (point.totalValue / peak - 1) * 100 : 0 };
        });
    }, [evolutionBase, periods]);
    const latest = evolution.at(-1);
    const previous = evolution.at(-2);
    const latestComparison = comparison.at(-1);
    const currentValue = latest?.totalValue || holdings.reduce((sum, holding) => sum + holding.amount, 0);
    const investedValue = latest?.investedValue || holdings.reduce((sum, holding) => sum + holding.amount, 0);
    const statusControl = controls.find(control => control.label.toLowerCase().includes('general') || control.label.toLowerCase().includes('estado'));
    const warningCount = controls.filter(control => control.status === 'warn').length;
    const allocationByCategory = useMemo(() => {
        const totals = new Map<string, number>();
        holdings.forEach(holding => totals.set(holding.category, (totals.get(holding.category) || 0) + holding.weight));
        return Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ name: label, actual: totals.get(key) || 0 })).filter(row => row.actual > 0);
    }, [holdings]);
    const allocationByBucket = useMemo(() => {
        const totals: Record<HoldingBucket, number> = { longTerm: 0, income: 0, liquidity: 0 };
        holdings.forEach(holding => { totals[defaultBucketForCategory(holding.category)] += holding.weight; });
        return (Object.keys(BUCKET_LABELS) as HoldingBucket[]).map(bucket => ({ name: BUCKET_LABELS[bucket], actual: totals[bucket], target: Number(snapshot.bucketTargets[bucket] || 0) }));
    }, [holdings, snapshot.bucketTargets]);
    const tabs: Array<{ value: InsightTab; label: string; icon: ReactNode }> = [
        { value: 'evolution', label: 'Evolución', icon: <TrendingUp size={15} /> },
        { value: 'benchmark', label: 'Benchmark', icon: <BarChart3 size={15} /> },
        { value: 'allocation', label: 'Asignación', icon: <Layers3 size={15} /> },
        { value: 'risk', label: 'Riesgo', icon: <AlertTriangle size={15} /> },
        { value: 'controls', label: 'Controles', icon: <ListChecks size={15} /> },
    ];

    return <Card className="portfolio-excel-insights">
        <CardHeader title="Lectura del Excel en vivo" subtitle="Evolución, benchmark, objetivos y controles importados junto a los precios actualizados" action={<span className="portfolio-excel-insights__source"><FileSpreadsheet size={14} /> {snapshot.workbookFile}</span>} />
        <CardContent>
            <div className="portfolio-excel-insights__kpis">
                <div><span>Último valor del Excel</span><strong>{currency(currentValue)}</strong><small>{latest?.period || 'Sin periodo'}</small></div>
                <div><span>Capital invertido estimado</span><strong>{currency(investedValue)}</strong><small>{latest ? percent(latest.gain / Math.max(investedValue, 1) * 100) + ' desde la base' : 'N/D'}</small></div>
                <div><span>Variación mensual</span><strong className={latest && latest.monthlyReturnPct >= 0 ? 'is-positive' : 'is-negative'}>{percent(latest?.monthlyReturnPct)}</strong><small>Anterior: {percent(previous?.monthlyReturnPct)}</small></div>
                <div><span>Vs MSCI World</span><strong className={latestComparison && latestComparison.relativeReturnPct >= 0 ? 'is-positive' : 'is-negative'}>{percent(latestComparison?.relativeReturnPct)}</strong><small>{latestComparison?.period || 'Sin comparativa'}</small></div>
                <div><span>Estado del Excel</span><strong className={warningCount ? 'is-warning' : 'is-positive'}>{statusControl?.value || (warningCount ? 'REVISAR' : 'OK')}</strong><small>{warningCount} avisos · {daily.length} datos diarios</small></div>
            </div>
            <div className="portfolio-excel-insights__tabs" role="tablist" aria-label="Lecturas del Excel">
                {tabs.map(item => <button key={item.value} type="button" role="tab" aria-selected={tab === item.value} className={tab === item.value ? 'is-active' : ''} onClick={() => setTab(item.value)}>{item.icon}{item.label}</button>)}
            </div>
            {tab === 'evolution' && <section className="portfolio-excel-insights__panel"><div className="portfolio-excel-insights__panel-heading"><div><h3><CalendarClock size={16} /> Valor total vs capital invertido</h3><p>Serie mensual importada del Excel, con plusvalía y capital aportado visibles.</p></div><strong>{evolution.length} periodos</strong></div>{evolution.length > 1 ? <ResponsiveContainer width="100%" height={270}><ComposedChart data={evolution} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}><defs><linearGradient id="excelValueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" /><XAxis dataKey="period" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} minTickGap={28} /><YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={value => Math.round(value / 1000) + 'k'} width={42} /><Tooltip {...tooltipTheme} formatter={(value: number | string | undefined, name?: string) => [currency(Number(value || 0)), name === 'totalValue' ? 'Valor total' : 'Capital invertido']} /><Legend formatter={(value) => value === 'totalValue' ? 'Valor total' : 'Capital invertido'} /><Area type="monotone" dataKey="totalValue" stroke="#10b981" fill="url(#excelValueFill)" strokeWidth={2} /><Line type="monotone" dataKey="investedValue" stroke="#8b5cf6" strokeWidth={2} dot={false} /></ComposedChart></ResponsiveContainer> : <div className="portfolio-excel-insights__empty">Añade más de un periodo a la hoja Evolución para dibujar la serie.</div>}</section>}
            {tab === 'benchmark' && <section className="portfolio-excel-insights__panel"><div className="portfolio-excel-insights__panel-heading"><div><h3><BarChart3 size={16} /> Comparativa vs MSCI World</h3><p>Retorno mensual, acumulado y diferencia relativa del Excel.</p></div><strong>{comparison.length} periodos</strong></div>{comparison.length > 1 ? <ResponsiveContainer width="100%" height={270}><ComposedChart data={comparison} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" /><XAxis dataKey="period" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} minTickGap={28} /><YAxis yAxisId="accum" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={value => value + '%'} width={45} /><YAxis yAxisId="relative" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={value => value + '%'} width={45} /><Tooltip {...tooltipTheme} formatter={(value: number | string | undefined, name?: string) => [percent(Number(value || 0)), name || 'Valor']} /><Legend /><Bar yAxisId="relative" dataKey="relativeReturnPct" name="Diferencia mensual" fill="#f59e0b" radius={[5, 5, 0, 0]} /><Line yAxisId="accum" type="monotone" dataKey="portfolioAccumPct" name="Cartera acumulada" stroke="#10b981" strokeWidth={2.2} dot={false} /><Line yAxisId="accum" type="monotone" dataKey="benchmarkAccumPct" name="MSCI World acumulado" stroke="#3b82f6" strokeWidth={2.2} dot={false} /></ComposedChart></ResponsiveContainer> : <div className="portfolio-excel-insights__empty">Añade la hoja Comparativa para mostrar la evolución frente al benchmark.</div>}</section>}
            {tab === 'allocation' && <section className="portfolio-excel-insights__allocation"><div className="portfolio-excel-insights__mini-chart"><h3><Layers3 size={16} /> Distribución por categoría</h3><ResponsiveContainer width="100%" height={230}><BarChart data={allocationByCategory} layout="vertical" margin={{ left: 10, right: 12 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" horizontal={false} /><XAxis type="number" tickFormatter={value => value + '%'} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} /><YAxis dataKey="name" type="category" width={90} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} /><Tooltip {...tooltipTheme} formatter={(value: number | string | undefined) => percent(Number(value || 0))} /><Bar dataKey="actual" name="Peso actual" fill="#10b981" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div><div className="portfolio-excel-insights__mini-chart"><h3><Target size={16} /> Buckets actuales vs objetivo</h3><ResponsiveContainer width="100%" height={230}><BarChart data={allocationByBucket} margin={{ left: 2, right: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" /><XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} /><YAxis tickFormatter={value => value + '%'} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} /><Tooltip {...tooltipTheme} formatter={(value: number | string | undefined) => percent(Number(value || 0))} /><Legend /><Bar dataKey="actual" name="Actual" fill="#3b82f6" radius={[6, 6, 0, 0]} /><Bar dataKey="target" name="Objetivo" fill="#8b5cf6" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></section>}
            {tab === 'risk' && <section className="portfolio-excel-insights__panel"><div className="portfolio-excel-insights__panel-heading"><div><h3><AlertTriangle size={16} /> Mapa de riesgo mensual</h3><p>Retorno mensual y drawdown de la serie importada.</p></div><strong>{advanced.analyzedMonths} meses analizados</strong></div>{evolution.length > 1 ? <ResponsiveContainer width="100%" height={270}><ComposedChart data={evolution} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" /><XAxis dataKey="period" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} minTickGap={28} /><YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={value => value + '%'} width={45} /><Tooltip {...tooltipTheme} formatter={(value: number | string | undefined, name?: string) => [percent(Number(value || 0)), name || 'Valor']} /><Legend /><Bar dataKey="monthlyReturnPct" name="Retorno mensual" fill="#10b981" radius={[5, 5, 0, 0]} /><Line type="monotone" dataKey="drawdownPct" name="Drawdown" stroke="#ef4444" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="twrYtdPct" name="TWR YTD" stroke="#8b5cf6" strokeWidth={2} dot={false} /></ComposedChart></ResponsiveContainer> : <div className="portfolio-excel-insights__empty">Necesitamos más periodos para calcular el riesgo mensual.</div>}<div className="portfolio-excel-insights__stats"><span>Sharpe <strong>{advanced.sharpeRatio === null ? 'N/D' : advanced.sharpeRatio.toFixed(2)}</strong></span><span>Sortino <strong>{advanced.sortinoRatio === null ? 'N/D' : advanced.sortinoRatio.toFixed(2)}</strong></span><span>Beta <strong>{advanced.beta === null ? 'N/D' : advanced.beta.toFixed(2)}</strong></span><span>Máximo drawdown <strong>{percent(advanced.maxDrawdownPct)}</strong></span><span>Volatilidad anual <strong>{percent(advanced.annualizedVolatilityPct)}</strong></span><span>Tracking error <strong>{percent(advanced.trackingErrorAnnualPct)}</strong></span></div></section>}
            {tab === 'controls' && <section className="portfolio-excel-insights__controls"><div className="portfolio-excel-insights__control-column"><h3><ListChecks size={16} /> Checks automáticos</h3>{controls.length ? controls.slice(0, 10).map(control => <div className="portfolio-excel-insights__control-row" key={control.label}>{control.status === 'ok' ? <CheckCircle2 size={15} /> : control.status === 'warn' ? <AlertTriangle size={15} /> : <ShieldCheck size={15} />}<span>{control.label}</span><strong className={'is-' + control.status}>{control.value}</strong></div>) : <p>Este Excel no incluye controles importados.</p>}</div><div className="portfolio-excel-insights__control-column"><h3><Target size={16} /> Objetivos y aportaciones</h3>{objectives.length ? objectives.slice(0, 10).map(objective => <div className="portfolio-excel-insights__objective-row" key={objective.asset}><span><strong>{objective.asset}</strong><small>{objective.currentWeight.toFixed(1)}% actual · {objective.targetWeight.toFixed(1)}% objetivo</small></span><b>{currency(objective.contributionAmount || objective.shortfallAmount || 0)}</b></div>) : <p>Este Excel no incluye objetivos por activo.</p>}</div><div className="portfolio-excel-insights__control-column"><h3><Activity size={16} /> Últimos movimientos importados</h3>{movements.length ? movements.slice(-6).reverse().map(movement => <div className="portfolio-excel-insights__movement-row" key={movement.date + '-' + movement.concept}><span>{movement.date}<small>{movement.concept}</small></span><strong>{currency(movement.amount)}</strong></div>) : <p>Este Excel no incluye movimientos de capital.</p>}</div></section>}
            <p className="portfolio-excel-insights__footnote">Fuente: {snapshot.workbookFile}. {snapshot.updatedAt ? 'Importado el ' + new Date(snapshot.updatedAt).toLocaleString('es-ES') + '.' : 'Se muestran los datos demo de la plantilla.'}</p>
        </CardContent>
    </Card>;
}
