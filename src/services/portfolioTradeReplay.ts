import type { Asset, PortfolioTransaction } from '../types/types';
import { comparePortfolioTransactions, getTransactionEventDay } from './portfolioPerformance';

const round = (value: number) => Number(value.toFixed(12));

/** Reconstruct only an explicit opening basis and trades, never manual corrections. */
function replay(trades: PortfolioTransaction[]) {
    let quantity = 0, cost = 0, purchaseDate: string | undefined;
    const ids = new Set<string>();
    for (const trade of [...trades].sort(comparePortfolioTransactions)) {
        const date = getTransactionEventDay(trade);
        const time = Date.parse(date);
        const units = trade.quantity ?? NaN;
        const amount = trade.total ?? units * (trade.price ?? NaN);
        if (!date || !Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== date
            || !trade.id || ids.has(trade.id) || !['buy', 'sell'].includes(trade.type)
            || !Number.isFinite(units) || !Number.isFinite(amount) || amount < 0) return null;
        ids.add(trade.id);
        if (trade.provenance === 'initial-position' && units === 0 && amount === 0) continue;
        if (units <= 0) return null;
        if (trade.type === 'buy') {
            purchaseDate ??= date;
            quantity += units; cost += amount;
        } else {
            if (quantity <= 0 || units > quantity + 1e-8) return null;
            const remaining = Math.max(0, quantity - units);
            cost *= remaining / quantity;
            quantity = remaining;
        }
    }
    return { quantity, cost, purchaseDate };
}

/** Apply a dated trade to its whole ledger, preserving unrelated assets and quotes.
 * Incomplete legacy ledgers retain the existing forward-only behavior; a
 * retroactive change cannot guess an opening cost or cross a manual correction.
 */
export function reconcileTradePosition(previous: Asset[], proposed: Asset[], ledger: PortfolioTransaction[], operation: PortfolioTransaction): Asset[] {
    if (operation.type !== 'buy' && operation.type !== 'sell') return proposed;
    const trades = ledger.filter(t => t.assetId === operation.assetId);
    const prior = trades.filter(t => t.id !== operation.id);
    const retroactive = prior.some(t => getTransactionEventDay(t) > getTransactionEventDay(operation));
    const old = previous.find(a => a.id === operation.assetId);
    const baseline = replay(prior);
    if (!baseline || Math.abs(baseline.quantity - (old?.quantity ?? 0)) > 1e-8) {
        if (retroactive) throw new Error('No se puede registrar esta operación antigua: falta un coste inicial verificable o hay correcciones manuales.');
        return proposed;
    }
    const position = replay(trades);
    if (!position) throw new Error('La operación dejaría una venta sin suficientes unidades en su fecha. Revisa las fechas y cantidades de las operaciones.');
    const template = proposed.find(a => a.id === operation.assetId) ?? old;
    if (!template) throw new Error('No se encuentra la posición de esta operación.');
    const quantity = round(position.quantity);
    const next = quantity > 0 ? { ...template, quantity,
        purchasePrice: round(position.cost / position.quantity), purchaseDate: position.purchaseDate ?? template.purchaseDate } : null;
    const assets = proposed.flatMap(a => a.id === operation.assetId ? next ? [next] : [] : [a]);
    return next && !proposed.some(a => a.id === operation.assetId) ? [...assets, next] : assets;
}
