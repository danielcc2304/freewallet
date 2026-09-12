import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui';
import { usePortfolio } from '../../context/PortfolioContext';
import { getHistory } from '../../services/storageService';
import { buildPortfolioAnalyticsHistory, createQuoteSnapshot, normalizePortfolioTransactions, performanceSeries, portfolioMonthlyRows } from '../../services/portfolioPerformance';
import './LivePortfolioPlan.css';

const money = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const pct = (n: number) => n.toLocaleString('es-ES', { maximumFractionDigits: 2 }) + '%';
const KEY = 'freewallet_live_targets';
const operationName = { buy: 'Compra', sell: 'Venta', edit: 'Corrección', delete: 'Eliminación' } as const;

export function LivePortfolioPlan({ now }: { now: number }) {
    const { state: { assets, transactions } } = usePortfolio();
    const [targets, setTargets] = useState<Record<string, number>>(() => {
        try {
            const data: unknown = JSON.parse(localStorage.getItem(KEY) || '{}');
            return data && typeof data === 'object' && !Array.isArray(data)
                ? Object.fromEntries(Object.entries(data).filter(([, v]) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100)) : {};
        } catch { return {}; }
    });
    const [budget, setBudget] = useState(0);
    const [saveError, setSaveError] = useState(false);
    const portfolioTransactions = normalizePortfolioTransactions(assets, transactions);
    const total = assets.reduce((sum, a) => sum + (a.currentPrice ?? a.purchasePrice) * a.quantity, 0);
    const invested = assets.reduce((sum, a) => sum + a.purchasePrice * a.quantity, 0);
    const targetTotal = assets.reduce((sum, a) => sum + (targets[a.id] || 0), 0);
    const validTargets = Math.abs(targetTotal - 100) < .01;
    const rows = assets.map(a => {
        const value = (a.currentPrice ?? a.purchasePrice) * a.quantity;
        const cost = a.purchasePrice * a.quantity;
        const target = targets[a.id] || 0;
        return { a, value, cost, target, weight: total ? value / total * 100 : 0, gap: (total + budget) * target / 100 - value };
    }).sort((a, b) => b.value - a.value);
    const shortfall = rows.reduce((sum, r) => sum + Math.max(0, r.gap), 0);
    const liveHistory = buildPortfolioAnalyticsHistory(
        getHistory(),
        portfolioTransactions,
        createQuoteSnapshot(assets, portfolioTransactions, new Date(now).toISOString()) || undefined,
        assets,
    );
    const series = performanceSeries(liveHistory, portfolioTransactions, assets);
    const months = portfolioMonthlyRows(series, now);
    const buys = portfolioTransactions.filter(t => t.type === 'buy').reduce((s, t) => s + (t.total || 0), 0);
    const sells = portfolioTransactions.filter(t => t.type === 'sell').reduce((s, t) => s + (t.total || 0), 0);
    const setTarget = (id: string, value: number) => {
        const next = { ...targets, [id]: Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0)) };
        setTargets(next);
        try { localStorage.setItem(KEY, JSON.stringify(next)); setSaveError(false); } catch { setSaveError(true); }
    };
    const currentResult = rows.reduce((sum, row) => sum + row.value - row.cost, 0);
    const recentTransactions = [...portfolioTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
    const ledgerDifference = buys - sells - invested;

    return <div className="live-plan-stack">
        <Card className="live-plan">
            <CardHeader title="Plan y control de cartera" subtitle="Objetivos, desviaciones y reparto de la próxima aportación con precios actuales" />
            <CardContent>
                <div className="live-plan__summary">
                    <div><span>Compras registradas</span><strong>{money(buys)}</strong></div>
                    <div><span>Ventas registradas</span><strong>{money(sells)}</strong></div>
                    <div><span>Flujo neto registrado</span><strong>{money(buys - sells)}</strong></div>
                    <div><span>Resultado abierto</span><strong>{money(currentResult)}</strong></div>
                </div>
                {Math.abs(ledgerDifference) > 0.01 && <p role="status">El flujo neto y el coste de las posiciones difieren en {money(Math.abs(ledgerDifference))}. Las ventas con ganancias o pérdidas pueden explicar esa diferencia; no se modifican los importes registrados.</p>}
                <label className="live-plan__budget">Próxima aportación (€)<input type="number" min="0" step="10" value={budget} onChange={e => setBudget(Math.max(0, Number(e.target.value) || 0))} /></label>
                <p role="status">Objetivos: {pct(targetTotal)} / 100%. {validTargets ? 'Plan listo para distribuir la aportación entre posiciones infraponderadas.' : 'Completa los pesos hasta el 100% para calcular la propuesta.'}</p>
                {saveError && <p role="alert">No se han podido guardar los objetivos en este navegador.</p>}
                <div className="live-plan__scroll"><table>
                    <caption>Posiciones y asignación objetivo</caption>
                    <thead><tr>{['Activo', 'Cantidad', 'Coste', 'Valor actual', 'Resultado', 'Rentabilidad', 'Peso actual', 'Objetivo %', 'Desviación (pp)', 'Aportar'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>{rows.map(r => <tr key={r.a.id}>
                        <th scope="row">{r.a.name}<small>{r.a.symbol}{!r.a.lastQuoteAt ? ' · Sin cotización verificada' : ''}</small></th>
                        <td>{r.a.quantity.toLocaleString('es-ES', { maximumFractionDigits: 6 })}</td><td>{money(r.cost)}</td><td>{money(r.value)}</td>
                        <td className={r.value >= r.cost ? 'is-positive' : 'is-negative'}>{money(r.value - r.cost)}</td><td>{r.cost ? pct((r.value / r.cost - 1) * 100) : '—'}</td><td>{pct(r.weight)}</td>
                        <td><input aria-label={'Peso objetivo de ' + r.a.name} type="number" min="0" max="100" step="0.1" value={targets[r.a.id] ?? ''} onChange={e => setTarget(r.a.id, Number(e.target.value))} /></td>
                        <td>{targets[r.a.id] !== undefined ? (r.weight - r.target).toFixed(2) : '—'}</td>
                        <td>{validTargets ? money(shortfall ? budget * Math.max(0, r.gap) / shortfall : 0) : '—'}</td>
                    </tr>)}</tbody>
                </table></div>
                <p>La propuesta usa aportaciones sin ventas ni comisiones. Las cantidades cambian al registrar operaciones y los pesos con cada cotización.</p>
            </CardContent>
        </Card>

        <Card className="live-plan">
            <CardHeader title="Resumen mensual" subtitle="Valor, capital y rentabilidad ajustada por las operaciones registradas" />
            <CardContent>
                <div className="live-plan__scroll"><table>
                    <thead><tr><th>Mes</th><th>Último valor</th><th>Coste de posiciones</th><th>Rentabilidad observada*</th><th>Drawdown</th><th>Intervalos válidos</th></tr></thead>
                    <tbody>{[...months].reverse().map(m => <tr key={m.month}><th scope="row">{m.month}{!m.closed ? ' · provisional' : ''}</th><td>{money(m.value)}</td><td>{money(m.invested)}</td><td>{m.monthlyReturn !== null ? pct(m.monthlyReturn) : 'N/D'}</td><td>{m.drawdown !== null ? pct(m.drawdown) : 'N/D'}</td><td>{m.observations}</td></tr>)}</tbody>
                </table></div>
                <p>*Misma fórmula mensual del Excel: (cierre − flujos − cierre anterior) / cierre anterior, suponiendo flujos al final del mes. N/D cuando falta una base verificable. El mes abierto es provisional.</p>
            </CardContent>
        </Card>

        <Card className="live-plan">
            <CardHeader title="Últimos movimientos" subtitle="Compras, ventas y correcciones que explican los cambios de la cartera" />
            <CardContent>
                {recentTransactions.length ? <div className="live-plan__scroll"><table>
                    <thead><tr><th>Fecha</th><th>Operación</th><th>Activo</th><th>Cantidad</th><th>Precio</th><th>Importe</th></tr></thead>
                    <tbody>{recentTransactions.map(t => <tr key={t.id}><td>{t.date.slice(0, 10)}</td><td>{operationName[t.type]}</td><th scope="row">{t.assetName}<small>{t.assetSymbol}</small></th><td>{t.quantity?.toLocaleString('es-ES') || '—'}</td><td>{t.price ? money(t.price) : '—'}</td><td>{money(t.total || 0)}</td></tr>)}</tbody>
                </table></div> : <p>No hay operaciones registradas todavía.</p>}
            </CardContent>
        </Card>
    </div>;
}
