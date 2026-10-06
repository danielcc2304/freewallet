import type { AssetHolding } from '../types/types';
import type { FinectBreakdown, FinectFundRelevance } from './finect/finectService';

export function normalizeFundHoldings(fund: Pick<FinectFundRelevance, 'holdings'>): AssetHolding[] {
    return fund.holdings.filter(h => h.name.trim() && Number.isFinite(h.weight) && h.weight > 0)
        .map(h => ({ symbol: h.symbol || h.isin || h.name, name: h.name, percentage: h.weight, isin: h.isin }));
}

export function holdingsCoverage(holdings: readonly AssetHolding[]): number {
    return Math.min(100, holdings.reduce((sum, h) => sum + (Number.isFinite(h.percentage) && h.percentage > 0 ? Math.min(100, h.percentage) : 0), 0));
}

/** Choose one reported portfolio, never combine weights from different dates.
 * A smaller provider response must not erase a more complete saved breakdown.
 */
export function selectFundHoldings(saved: readonly AssetHolding[] = [], remote: readonly AssetHolding[] = []) {
    const valid = (rows: readonly AssetHolding[]) => rows.filter(h => h.name.trim() && Number.isFinite(h.percentage) && h.percentage > 0);
    const stored = valid(saved), live = valid(remote);
    const useRemote = live.length > 0 && holdingsCoverage(live) >= holdingsCoverage(stored) - .000001;
    return { holdings: useRemote ? live : stored, source: useRemote ? 'provider' as const : 'saved' as const };
}

export function availableFundDistributions(groups: readonly FinectBreakdown[] = []): FinectBreakdown[] {
    return groups.map(g => ({ ...g, items: g.items.filter(i => Number.isFinite(i.value) && i.value > 0) })).filter(g => g.items.length > 0);
}
export function fundDistributionLabel(type: string): string {
    return ({ 'asset-allocation': 'Tipos de activo', 'market-capitalization': 'Tamaño de empresas',
        'regional-exposure': 'Distribución geográfica', 'stock-sector': 'Sectores',
        'bond-sector': 'Tipos de deuda', 'bond-maturity': 'Vencimientos', 'bond-credit-quality': 'Calidad crediticia' } as Record<string, string>)[type] || type.replace(/-/g, ' ');
}
