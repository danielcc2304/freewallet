import type { Asset, PortfolioTransaction } from '../types/types';
import { comparePortfolioTransactions, getTransactionEventDay } from './portfolioPerformance';

const round = (value: number) => Number(value.toFixed(12));

/** Reconstruct only an explicit opening basis and trades, never manual corrections. */
function replay(trades: PortfolioTransaction[], assetId: string) {
    let quantity = 0, cost = 0, purchaseDate: string | undefined;
    const ids = new Set<string>();
    for (const trade of [...trades].sort(comparePortfolioTransactions)) {
        const date = getTransactionEventDay(trade);
        const time = Date.parse(date);
        const units = trade.quantity ?? NaN;
        const amount = trade.total ?? units * (trade.price ?? NaN);
        if (!date || !Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== date
            || !trade.id || ids.has(trade.id)) return null;
        ids.add(trade.id);
        const transferOut = trade.type === 'transfer' && trade.assetId === assetId;
        const transferIn = trade.type === 'transfer' && trade.transferToAssetId === assetId;
        if (trade.type === 'transfer') {
            const transferUnits = transferOut ? trade.quantity : trade.transferQuantity;
            const basis = trade.transferBasis;
            if ((!transferOut && !transferIn) || !Number.isFinite(transferUnits) || transferUnits! <= 0
                || !Number.isFinite(basis) || basis! < 0 || !Number.isFinite(trade.total) || trade.total! <= 0
                || !Number.isFinite(trade.price) || trade.price! <= 0 || !trade.transferToAssetId
                || (trade.transferToPrice !== undefined && (!Number.isFinite(trade.transferToPrice) || trade.transferToPrice <= 0))
                || !Number.isFinite(trade.quantity) || trade.quantity! <= 0 || !Number.isFinite(trade.transferQuantity) || trade.transferQuantity! <= 0
                || trade.assetType !== 'fund' || trade.transferToAssetType !== 'fund') return null;
            if (transferOut) {
                if (quantity <= 0 || transferUnits! > quantity + 1e-8 || basis! > cost + Math.max(.01, cost * 1e-7)) return null;
                quantity = Math.max(0, quantity - transferUnits!);
                cost = Math.max(0, cost - basis!);
            } else {
                quantity += transferUnits!;
                cost += basis!;
            }
            continue;
        }
        if (!['buy', 'sell'].includes(trade.type)
            || !Number.isFinite(units) || !Number.isFinite(amount) || amount < 0) return null;
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
    if (operation.type !== 'buy' && operation.type !== 'sell' && operation.type !== 'transfer') return proposed;
    const affectedIds = operation.type === 'transfer' ? [operation.assetId, operation.transferToAssetId || ''] : [operation.assetId];
    if (affectedIds.some(id => !id) || new Set(affectedIds).size !== affectedIds.length) throw new Error('El traspaso necesita dos posiciones distintas.');
    const resolved = new Map<string, Asset | null>();
    for (const assetId of affectedIds) {
        const trades = ledger.filter(t => t.assetId === assetId || (t.type === 'transfer' && t.transferToAssetId === assetId));
        const prior = trades.filter(t => t.id !== operation.id);
        const retroactive = prior.some(t => getTransactionEventDay(t) > getTransactionEventDay(operation));
        const old = previous.find(a => a.id === assetId);
        const baseline = replay(prior, assetId);
        if (!baseline || Math.abs(baseline.quantity - (old?.quantity ?? 0)) > 1e-8) {
            if (retroactive) throw new Error('No se puede registrar esta operación antigua: falta un coste inicial verificable o hay correcciones manuales.');
            return proposed;
        }
        const position = replay(trades, assetId);
        if (!position) throw new Error(operation.type === 'transfer'
            ? 'El traspaso no coincide con las participaciones o el coste disponible en la fecha indicada.'
            : 'La operación dejaría una venta sin suficientes unidades en su fecha. Revisa las fechas y cantidades de las operaciones.');
        const template = proposed.find(a => a.id === assetId) ?? old;
        if (position.quantity > 1e-8 && !template) throw new Error('No se encuentra la posición de esta operación.');
        const quantity = round(position.quantity);
        const next = quantity > 1e-10 && template ? { ...template, quantity,
            purchasePrice: round(position.cost / position.quantity), purchaseDate: position.purchaseDate ?? template.purchaseDate } : null;
        resolved.set(assetId, next);
    }
    const assets = proposed.flatMap(a => resolved.has(a.id) ? resolved.get(a.id) ? [resolved.get(a.id)!] : [] : [a]);
    for (const [assetId, position] of resolved) {
        if (position && !proposed.some(a => a.id === assetId)) assets.push(position);
    }
    return assets;
}
