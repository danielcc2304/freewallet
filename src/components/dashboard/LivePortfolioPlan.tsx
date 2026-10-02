import { portfolioStorage } from '../../services/portfolioCloudStorage';
import { useMemo, useState } from 'react';
import { Button, Card, CardContent, CardHeader } from '../ui';
import { usePortfolio } from '../../context/PortfolioContext';
import type { DashboardAnalytics } from './useDashboardAnalytics';
import { formatQuantity, hasValidPrice } from '../../services/assetValuation';
import { useEffect } from 'react';
import { calculateContributionPlan, migratePlanTargets, PLAN_TARGETS_KEY, LEGACY_PLAN_TARGETS_KEY, parsePlanNumber, targetsFromCurrentWeights } from '../../services/portfolioPlan';
import type { Asset } from '../../types/types';
import './LivePortfolioPlan.css';

const money = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const pct = (n: number) => n.toLocaleString('es-ES', { maximumFractionDigits: 2 }) + '%';
const intervalLabel = (row: DashboardAnalytics['monthly'][number]) => [
    row.monthlyIntervals ? `${row.monthlyIntervals} mensual${row.monthlyIntervals === 1 ? '' : 'es'}` : '',
    row.dailyIntervals ? `${row.dailyIntervals} diario${row.dailyIntervals === 1 ? '' : 's'}` : '',
    row.otherIntervals ? `${row.otherIntervals} entre valoraciones` : '',
].filter(Boolean).join(' · ') || 'Sin intervalos válidos';
function readTargets(assets: Asset[]): Record<string, string> {
    const stored = JSON.parse(portfolioStorage.getItem(PLAN_TARGETS_KEY) || '{}');
    let legacy: Record<string, number> = {};
    try { legacy = JSON.parse(portfolioStorage.getItem(LEGACY_PLAN_TARGETS_KEY) || '{}'); } catch { /* A damaged legacy key must not hide valid current targets. */ }
    const current = stored && typeof stored === 'object' && !Array.isArray(stored)
        ? Object.fromEntries(Object.entries(stored).filter(([, v]) => typeof v === 'string' || typeof v === 'number').map(([k, v]) => [k, String(v)])) : {};
    return migratePlanTargets(assets, current, legacy && typeof legacy === 'object' ? legacy : {});
}
const operationName = { buy: 'Compra', sell: 'Venta', edit: 'Corrección', delete: 'Eliminación' } as const;

type LivePortfolioPlanSection = 'all' | 'plan' | 'monthly' | 'recent';

function LivePortfolioPlanEditor({ analytics, section = 'all' }: { analytics: DashboardAnalytics; section?: LivePortfolioPlanSection }) {
    const { state: { assets } } = usePortfolio();
    const { portfolioTransactions } = analytics;
    const [targets, setTargets] = useState<Record<string, string>>(() => { try { return readTargets(assets); } catch { return {}; } });
    const [budgetInput, setBudgetInput] = useState('');
    const [saveError, setSaveError] = useState(false);
    useEffect(() => {
        const sync = (event?: Event) => {
            if (event instanceof StorageEvent && event.key !== PLAN_TARGETS_KEY && event.key !== LEGACY_PLAN_TARGETS_KEY && event.key !== null) return;
            try {
                const stored = readTargets(assets);
                const serialized = JSON.stringify(stored);
                if (portfolioStorage.getItem(PLAN_TARGETS_KEY) !== serialized) portfolioStorage.setItem(PLAN_TARGETS_KEY, serialized);
                setTargets(previous => JSON.stringify(previous) === serialized ? previous : stored);
            } catch { setSaveError(true); }
        };
        sync();
        window.addEventListener('storage', sync);
        window.addEventListener('freewallet-plan-targets-change', sync);
        return () => { window.removeEventListener('storage', sync); window.removeEventListener('freewallet-plan-targets-change', sync); };
    }, [assets]);
    const plan = useMemo(() => calculateContributionPlan(assets, targets, budgetInput), [assets, targets, budgetInput]);
    const { targetTotal, validTargets, canCalculate } = plan;
    const rows = useMemo(() => plan.rows.map(r => {
        const cost = r.assets.reduce((s, a) => s + a.purchasePrice * a.quantity, 0);
        const quantity = r.assets.reduce((s, a) => s + a.quantity, 0);
        return { ...r, a: { ...r.assets[0], quantity }, cost, weight: plan.total ? r.value / plan.total * 100 : 0 };
    }).sort((a, b) => b.value - a.value), [plan]);
    const invested = rows.reduce((s, r) => s + r.cost, 0);
    const { buys, sells } = useMemo(() => ({
        buys: portfolioTransactions.filter(t => t.type === 'buy' && t.provenance !== 'initial-position' && !/^(position|bootstrap)-/.test(t.id)).reduce((s, t) => s + (t.total || 0), 0),
        sells: portfolioTransactions.filter(t => t.type === 'sell' && t.provenance !== 'initial-position').reduce((s, t) => s + (t.total || 0), 0),
    }), [portfolioTransactions]);
    const setTarget = (id: string, raw: string) => {
        const next = { ...targets };
        next[id] = raw;
        setTargets(next);
        try { portfolioStorage.setItem(PLAN_TARGETS_KEY, JSON.stringify(next)); window.dispatchEvent(new Event('freewallet-plan-targets-change')); setSaveError(false); } catch { setSaveError(true); }
    };
    const useCurrentWeights = () => {
        if (plan.total <= 0 || !rows.length) return;
        const next = { ...targets, ...targetsFromCurrentWeights(assets) };
        setTargets(next);
        try { portfolioStorage.setItem(PLAN_TARGETS_KEY, JSON.stringify(next)); window.dispatchEvent(new Event('freewallet-plan-targets-change')); setSaveError(false); } catch { setSaveError(true); }
    };
    const currentResult = useMemo(() => rows.reduce((sum, row) => sum + row.value - row.cost, 0), [rows]);
    const initialCost = portfolioTransactions.filter(t => t.provenance === 'initial-position' || /^(position|bootstrap)-/.test(t.id)).reduce((s, t) => s + (t.total || 0), 0);
    const ledgerDifference = initialCost + buys - sells - invested;

    const showPlan = section === 'all' || section === 'plan';

    return <div className="live-plan-stack">
        {showPlan && <Card className="live-plan">
            <CardHeader title="Plan y control de cartera" subtitle="Objetivos, desviaciones y reparto de la próxima aportación con precios actuales" />
            <CardContent>
                <div className="live-plan__summary">
                    {initialCost > 0 && <div><span>Posiciones iniciales importadas</span><strong>{money(initialCost)}</strong></div>}
                    <div><span>Compras registradas</span><strong>{money(buys)}</strong></div>
                    <div><span>Ventas registradas</span><strong>{money(sells)}</strong></div>
                    <div><span>Flujo neto registrado</span><strong>{money(buys - sells)}</strong></div>
                    <div><span>Resultado abierto</span><strong>{money(currentResult)}</strong></div>
                </div>
                {Math.abs(ledgerDifference) > 0.01 && <p role="status">El flujo neto y el coste de las posiciones difieren en {money(Math.abs(ledgerDifference))}. Las ventas con ganancias o pérdidas pueden explicar esa diferencia; no se modifican los importes registrados.</p>}
                {!assets.length && <p role="status">El Excel aporta el histórico, pero el plan necesita posiciones en el Dashboard. Añade tus activos para definir objetivos.</p>}
                {assets.some(a => !hasValidPrice(a)) && <p role="status">La propuesta es orientativa: algunas posiciones se valoran al coste porque falta una cotización en euros.</p>}
                {assets.length > 0 && <Button className="live-plan__use-weights" variant="secondary" type="button" onClick={useCurrentWeights} disabled={plan.total <= 0}>Usar pesos actuales como objetivos</Button>}
                <label className="live-plan__budget">Próxima aportación (€)<input type="text" inputMode="decimal" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} aria-invalid={!!budgetInput && parsePlanNumber(budgetInput) === null} /></label>
                <p role="status">Objetivos: {pct(targetTotal)} / 100%. {validTargets ? 'Plan listo para distribuir la aportación entre posiciones infraponderadas.' : 'Completa los pesos hasta el 100% para calcular la propuesta.'}</p>
                {validTargets && !canCalculate && <p role="status">Introduce una aportación mayor que cero para calcular el reparto.</p>}
                {saveError && <p role="alert">No se han podido guardar los objetivos en este navegador.</p>}
                <div className="live-plan__scroll"><table>
                    <caption>Posiciones y asignación objetivo</caption>
                    <thead><tr>{['Activo', 'Cantidad', 'Coste', 'Valor actual', 'Resultado', 'Rentabilidad', 'Peso actual', 'Objetivo %', 'Desviación (pp)', 'Aportar'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>{rows.map(r => <tr key={r.key}>
                        <th scope="row">{r.a.name}<small>{r.a.symbol}{!r.a.lastQuoteAt ? ' · Sin cotización verificada' : ''}</small></th>
                        <td>{formatQuantity(r.a)}</td><td>{money(r.cost)}</td><td>{money(r.value)}</td>
                        <td className={r.value >= r.cost ? 'is-positive' : 'is-negative'}>{money(r.value - r.cost)}</td><td>{r.cost ? pct((r.value / r.cost - 1) * 100) : '—'}</td><td>{pct(r.weight)}</td>
                        <td><input aria-label={'Peso objetivo de ' + r.a.name} type="text" inputMode="decimal" value={targets[r.key] ?? ''} onChange={e => setTarget(r.key, e.target.value)} aria-invalid={!!targets[r.key] && (r.target === null || r.target > 100)} /></td>
                        <td>{r.target !== null ? (r.weight - r.target).toFixed(2) : '—'}</td>
                        <td>{canCalculate ? money(r.contribution) : '—'}</td>
                    </tr>)}</tbody>
                </table></div>
                <p>La propuesta usa aportaciones sin ventas ni comisiones. Las cantidades cambian al registrar operaciones y los pesos con cada cotización.</p>
            </CardContent>
        </Card>}

        {section === 'all' && <LivePortfolioHistory analytics={analytics} section="all" />}
    </div>;
}

function LivePortfolioHistory({ analytics, section }: { analytics: DashboardAnalytics; section: LivePortfolioPlanSection }) {
    const { workbookHistory, usingWorkbookHistory, portfolioTransactions, monthly: months } = analytics;
    const showMonthly = section === 'all' || section === 'monthly';
    const showRecent = section === 'all' || section === 'recent';
    const recentTransactions = useMemo(() => [...portfolioTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8), [portfolioTransactions]);
    return <div className="live-plan-stack">
        {showMonthly && <Card className="live-plan">
             <CardHeader title="Resumen mensual" subtitle={usingWorkbookHistory
                 ? 'Cierres mensuales y DCA importados desde la hoja Evolucion'
                 : 'Valor, capital y rentabilidad ajustada por las operaciones registradas'} />
            <CardContent>
                <div className="live-plan__scroll"><table>
                    <thead><tr><th>Mes</th><th>Último valor</th><th>{usingWorkbookHistory ? 'Capital de referencia' : 'Coste de posiciones'}</th><th>Rentabilidad observada*</th><th>Drawdown</th><th>Intervalos válidos</th></tr></thead>
                    <tbody>{[...months].reverse().map(m => <tr key={m.month}><th scope="row">{m.month}{!m.closed ? ' · provisional' : ''}</th><td>{money(m.value)}</td><td>{money(m.invested)}</td><td>{m.monthlyReturn !== null ? pct(m.monthlyReturn) : 'N/D'}</td><td>{m.drawdown !== null ? pct(m.drawdown) : 'N/D'}</td><td>{intervalLabel(m)}</td></tr>)}</tbody>
                </table></div>
                <p>Los intervalos cuentan comparaciones entre valoraciones, no días cubiertos. Un cierre mensual del Excel equivale a un intervalo mensual.</p>
                 <p>*Retornos enlazados entre valoraciones, con flujos al final de cada intervalo. Con un único cierre mensual coincide con la fórmula del Excel. {usingWorkbookHistory
                     ? `Se muestran ${workbookHistory.evolutionCount} cierres de Evolucion y sus ${workbookHistory.dcaCount} flujos.`
                     : 'N/D cuando falta una base verificable. El mes abierto es provisional.'}</p>
            </CardContent>
        </Card>}

        {showRecent && <Card className="live-plan">
            <CardHeader title="Últimos movimientos" subtitle="Compras, ventas y correcciones que explican los cambios de la cartera" />
            <CardContent>
                {recentTransactions.length ? <div className="live-plan__scroll"><table>
                    <thead><tr><th>Fecha</th><th>Operación</th><th>Activo</th><th>Cantidad</th><th>Precio</th><th>Importe</th></tr></thead>
                    <tbody>{recentTransactions.map(t => <tr key={t.id}><td>{t.date?.slice(0, 10) || 'Fecha no registrada'}</td><td>{t.provenance === 'initial-position' || /^(position|bootstrap)-/.test(t.id) ? 'Posición inicial importada' : operationName[t.type]}</td><th scope="row">{t.assetName}<small>{t.assetSymbol}</small></th><td>{t.quantity !== undefined ? formatQuantity({quantity: t.quantity, type: t.assetType}) : '—'}</td><td>{t.price !== undefined ? money(t.price) : '—'}</td><td>{money(t.total || 0)}</td></tr>)}</tbody>
                </table></div> : <p>No hay operaciones registradas todavía.</p>}
            </CardContent>
        </Card>}
    </div>;
}

export function LivePortfolioPlan(props: { analytics: DashboardAnalytics; section?: LivePortfolioPlanSection }) {
    return props.section === 'monthly' || props.section === 'recent'
        ? <LivePortfolioHistory analytics={props.analytics} section={props.section} />
        : <LivePortfolioPlanEditor {...props} />;
}
