import type { Asset, PortfolioTransaction } from '../types/types';
import { assetValue } from './assetValuation';
import { accountingDay, getTransactionEventDay, normalizePortfolioTransactions } from './portfolioPerformance';

/** Moving average cost, matching the app's purchasePrice on each open lot.
 * Cash movements, corrections and deletions never manufacture sale proceeds.
 */
export function calculatePortfolioResults(assets: Asset[], transactions: PortfolioTransaction[], now = Date.now()) {
    const totalInvested = assets.reduce((sum, a) => sum + a.purchasePrice * a.quantity, 0);
    const currentValue = assets.reduce((sum, a) => sum + assetValue(a), 0);
    const unrealizedGain = currentValue - totalInvested;
    const percentageGain = totalInvested > 0 ? unrealizedGain / totalInvested * 100 : NaN;
    const positions = new Map<string, { quantity: number; cost: number; corrected: boolean }>();
    const ids = new Set<string>();
    let realized = 0;
    let resultUnavailableReason: string | undefined;
    const fail = (reason: string) => { resultUnavailableReason ??= reason; };
    const today = accountingDay(now);
    const ledger = normalizePortfolioTransactions(assets, transactions).sort((a, b) =>
        getTransactionEventDay(a).localeCompare(getTransactionEventDay(b)) || (a.createdAt || '').localeCompare(b.createdAt || '') || (a.id || '').localeCompare(b.id || ''));
    for (const transaction of ledger) {
        const day = getTransactionEventDay(transaction);
        if (!day || !Number.isFinite(Date.parse(day)) || new Date(day).toISOString().slice(0, 10) !== day) {
            fail('Hay operaciones sin una fecha válida.'); continue;
        }
        if (day > today) continue;
        if (!transaction.id || !transaction.assetId) { fail('Hay operaciones sin identificar en el registro.'); continue; }
        if (ids.has(transaction.id)) { fail('Hay operaciones duplicadas en el registro.'); continue; }
        ids.add(transaction.id);
        const position = positions.get(transaction.assetId) ?? { quantity: 0, cost: 0, corrected: false };
        positions.set(transaction.assetId, position);
        if (transaction.assetType === 'cash') continue;
        if (transaction.type === 'edit') { position.corrected = true; continue; }
        if (transaction.type === 'delete') {
            if (position.quantity > 1e-8 || (transaction.quantity ?? 0) > 0) fail('Eliminar una posición no registra su venta.');
            position.quantity = 0; position.cost = 0; continue;
        }
        const quantity = transaction.quantity ?? NaN;
        const amount = transaction.total ?? quantity * (transaction.price ?? NaN);
        if (transaction.provenance === 'initial-position' && quantity === 0 && amount === 0) continue;
        if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(amount) || amount < 0) {
            fail('Faltan cantidades o importes válidos en las compras y ventas.'); continue;
        }
        if (transaction.type === 'buy') {
            position.quantity += quantity; position.cost += amount;
        } else if (transaction.type === 'sell') {
            if (position.corrected || quantity > position.quantity + 1e-8 || position.quantity <= 0) {
                fail('Falta el coste de compra verificable de alguna venta.'); continue;
            }
            const soldCost = position.cost * Math.min(1, quantity / position.quantity);
            realized += amount - soldCost;
            position.quantity = Math.max(0, position.quantity - quantity);
            position.cost = Math.max(0, position.cost - soldCost);
        }
    }
    const close = (a: number, b: number, absolute: number) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= Math.max(absolute, Math.max(Math.abs(a), Math.abs(b)) * 1e-7);
    const assetIds = new Set<string>();
    for (const asset of assets) {
        if (assetIds.has(asset.id)) fail('Hay posiciones duplicadas en la cartera.');
        assetIds.add(asset.id);
        if (asset.type === 'cash') continue;
        const recorded = positions.get(asset.id);
        if (!recorded || !close(recorded.quantity, asset.quantity, 1e-8) || !close(recorded.cost, asset.quantity * asset.purchasePrice, .01)) fail('El registro de compras y ventas no coincide con las posiciones actuales.');
    }
    for (const [id, position] of positions) {
        if (!assetIds.has(id) && position.quantity > 1e-8) fail('Hay posiciones retiradas sin una venta registrada.');
    }
    if (!Number.isFinite(totalInvested) || totalInvested < 0 || !Number.isFinite(realized)) fail('Hay costes o resultados inválidos.');
    const realizedGain = resultUnavailableReason ? NaN : realized;
    return { totalInvested, currentValue, unrealizedGain, realizedGain, totalGain: unrealizedGain + realizedGain, percentageGain, resultUnavailableReason };
}
