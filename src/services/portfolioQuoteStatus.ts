import type { Asset } from '../types/types';
import { hasValidPrice } from './assetValuation';

const DAY = 86400000;
const CONSULTATION_WINDOW = 15 * 60000;
export function portfolioQuoteStatus(asset: Asset, now: number) {
    const checkedAt = Date.parse(asset.lastCheckedAt || '');
    const pricedAt = Date.parse(asset.quotedAt || asset.lastQuoteAt || '');
    const recentlyChecked = Number.isFinite(checkedAt) && checkedAt <= now + 5 * 60000 && now - checkedAt <= CONSULTATION_WINDOW;
    // Calendar-day margins tolerate weekends and fund NAV publication delays.
    const staleAfter = (asset.type === 'fund' ? 7 : asset.type === 'crypto' ? 2 : 4) * DAY;
    const stalePrice = asset.type !== 'cash' && Number.isFinite(pricedAt) && now - pricedAt > staleAfter;
    const unknownPriceDate = asset.type !== 'cash' && !Number.isFinite(pricedAt);
    const futurePrice = asset.type !== 'cash' && Number.isFinite(pricedAt) && pricedAt > now + 5 * 60000;
    const blockers: string[] = [];
    if (!hasValidPrice(asset) || asset.currency !== 'EUR') blockers.push('sin cotización válida en euros');
    if (stalePrice) blockers.push('precio caducado');
    if (unknownPriceDate) blockers.push('fecha del precio desconocida');
    if (futurePrice) blockers.push('fecha del precio futura');
    if (!Number.isFinite(asset.quantity) || asset.quantity < 0 || !Number.isFinite(asset.purchasePrice) || asset.purchasePrice < 0) blockers.push('cantidad o coste inválidos');
    // A stored batch quote can value positions without pretending the provider
    // was checked just now. Only a recent provider check creates a new snapshot.
    const valuationBlockers = [...blockers];
    const checkWindow = asset.quoteOrigin === 'batch' ? 36 * 3600000 : CONSULTATION_WINDOW;
    if (asset.type !== 'cash' && (!Number.isFinite(checkedAt) || checkedAt > now + 5 * 60000 || now - checkedAt > checkWindow)) valuationBlockers.push('consulta al proveedor pendiente o caducada');
    if (asset.type !== 'cash' && !recentlyChecked) blockers.push('consulta al proveedor pendiente o caducada');
    return { checkedAt, pricedAt, recentlyChecked, stalePrice, unknownPriceDate, futurePrice, valuationBlockers, blockers };
}

export function quoteDateLabel(value: string | undefined): string {
    const timestamp = Date.parse(value || '');
    return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleString('es-ES') : 'No disponible';
}
