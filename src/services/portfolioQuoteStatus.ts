import type { Asset } from '../types/types';
import { hasValidPrice } from './assetValuation';

const DAY = 86400000;
const CONSULTATION_WINDOW = 15 * 60000;
export function portfolioQuoteStatus(asset: Asset, now: number) {
    const checkedAt = Date.parse(asset.lastCheckedAt || '');
    const pricedAt = Date.parse(asset.quotedAt || asset.lastQuoteAt || '');
    const recentlyChecked = Number.isFinite(checkedAt) && checkedAt <= now && now - checkedAt <= CONSULTATION_WINDOW;
    // Calendar-day margins tolerate weekends and fund NAV publication delays.
    const staleAfter = (asset.type === 'fund' ? 7 : asset.type === 'crypto' ? 2 : 4) * DAY;
    const stalePrice = asset.type !== 'cash' && Number.isFinite(pricedAt) && now - pricedAt > staleAfter;
    const blockers: string[] = [];
    if (!hasValidPrice(asset) || asset.currency !== 'EUR') blockers.push('sin cotización válida en euros');
    if (asset.type !== 'cash') {
        const verification = Date.parse(asset.lastCheckedAt || asset.quotedAt || asset.lastQuoteAt || '');
        if (!Number.isFinite(verification) || verification > now || now - verification > CONSULTATION_WINDOW) blockers.push('consulta pendiente o caducada');
    }
    if (!Number.isFinite(asset.quantity) || asset.quantity < 0 || !Number.isFinite(asset.purchasePrice) || asset.purchasePrice < 0) blockers.push('cantidad o coste inválidos');
    return { checkedAt, pricedAt, recentlyChecked, stalePrice, unknownPriceDate: asset.type !== 'cash' && !Number.isFinite(pricedAt), blockers };
}

export function quoteDateLabel(value: string | undefined): string {
    const timestamp = Date.parse(value || '');
    return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleString('es-ES') : 'No disponible';
}
