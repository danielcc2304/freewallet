import type { Asset, HistoricalDataPoint } from '../types/types';
import { assetValue } from './assetValuation';
import { accountingDay } from './portfolioCalendar';
import type { FinectFundRelevance } from './finect/finectService';

export const EQUITY_BENCHMARK_ISIN = 'IE00BYX5NX33';
export const EQUITY_BENCHMARK_NAME = 'Fidelity MSCI World';
export const DEFENSIVE_BENCHMARK_ISIN = 'FR0000989626';
export const DEFENSIVE_BENCHMARK_NAME = 'Groupama Trésorerie';

const BENCHMARK_MODE_KEY = 'freewallet_benchmark_mode_v1';
const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{10}$/;

export type PortfolioBenchmarkMode = 'allocation' | 'msci';

export interface FundBenchmarkAllocation {
    equityPercent: number;
    unclassifiedPercent: number;
    source: 'breakdown' | 'category' | 'unavailable';
}

export interface PortfolioBenchmarkWeights {
    equityPercent: number;
    groupamaPercent: number;
    unclassifiedPercent: number;
}

function normalizeLabel(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function isEquityLabel(value: string): boolean {
    return /\b(equities|equity|stocks?|shares?|renta variable|acciones)\b/.test(normalizeLabel(value));
}

function isDefensiveLabel(value: string): boolean {
    return /\b(fixed income|renta fija|bonds?|bonos?|obligaciones|deuda|money market|monetario|cash|liquidez|liquidity)\b/.test(normalizeLabel(value));
}

function categoryAllocation(fund: Pick<FinectFundRelevance, 'category' | 'categoryDescription' | 'description' | 'strategy'>): FundBenchmarkAllocation | null {
    // Prefer the provider's actual category. Broader descriptions are only a
    // fallback because a mixed fund can mention both asset classes.
    for (const label of [fund.category, fund.categoryDescription, fund.description, fund.strategy]) {
        if (!label) continue;
        const equity = isEquityLabel(label);
        const defensive = isDefensiveLabel(label);
        if (equity !== defensive) {
            return { equityPercent: equity ? 100 : 0, unclassifiedPercent: 0, source: 'category' };
        }
    }
    return null;
}

/** Extracts the verified equity share from Finect's asset-allocation breakdown. */
export function fundBenchmarkAllocation(fund: Pick<FinectFundRelevance, 'breakdowns' | 'category' | 'categoryDescription' | 'description' | 'strategy'>): FundBenchmarkAllocation {
    const allocation = fund.breakdowns.find(item => item.type === 'asset-allocation');
    const items = allocation?.items.filter(item => Number.isFinite(item.value) && item.value > 0) ?? [];
    const total = items.reduce((sum, item) => sum + item.value, 0);

    if (total > 0) {
        const scale = total > 100 ? 100 / total : 1;
        const equity = items.filter(item => isEquityLabel(item.label)).reduce((sum, item) => sum + item.value, 0) * scale;
        const classified = items.filter(item => isEquityLabel(item.label) || isDefensiveLabel(item.label))
            .reduce((sum, item) => sum + item.value, 0) * scale;
        return {
            equityPercent: Math.max(0, Math.min(100, equity)),
            unclassifiedPercent: Math.max(0, Math.min(100, 100 - classified)),
            source: 'breakdown',
        };
    }

    return categoryAllocation(fund) ?? { equityPercent: 0, unclassifiedPercent: 100, source: 'unavailable' };
}

/** A valid fund ISIN is used to join assets to Finect's public class metadata. */
export function benchmarkFundIsin(asset: Pick<Asset, 'type' | 'isin' | 'symbol'>): string | null {
    if (asset.type !== 'fund' && asset.type !== 'etf') return null;
    const value = (asset.isin || asset.symbol || '').replace(/\s+/g, '').toUpperCase();
    return ISIN_PATTERN.test(value) ? value : null;
}

/** Current weights use the same EUR market values as the dashboard allocation. */
export function portfolioBenchmarkWeights(
    assets: readonly Asset[],
    fundAllocations: Readonly<Record<string, FundBenchmarkAllocation | null>>,
): PortfolioBenchmarkWeights {
    const values = assets.map(asset => ({ asset, value: assetValue(asset) }))
        .filter(item => Number.isFinite(item.value) && item.value > 0);
    const total = values.reduce((sum, item) => sum + item.value, 0);
    if (total <= 0) return { equityPercent: 0, groupamaPercent: 0, unclassifiedPercent: 0 };

    let equityValue = 0;
    let unclassifiedValue = 0;
    for (const { asset, value } of values) {
        if (asset.type === 'stock') {
            equityValue += value;
            continue;
        }
        if (asset.type === 'fund' || asset.type === 'etf') {
            const isin = benchmarkFundIsin(asset);
            const allocation = isin ? fundAllocations[isin] : undefined;
            if (!allocation) {
                unclassifiedValue += value;
                continue;
            }
            equityValue += value * allocation.equityPercent / 100;
            unclassifiedValue += value * allocation.unclassifiedPercent / 100;
            continue;
        }
        // Crypto and other non-equity holdings are placed in the defensive
        // leg for the two-index comparison, and remain visible as unclassified.
        if (asset.type === 'crypto') unclassifiedValue += value;
    }

    const equityPercent = Math.max(0, Math.min(100, equityValue / total * 100));
    return {
        equityPercent,
        groupamaPercent: 100 - equityPercent,
        unclassifiedPercent: Math.max(0, Math.min(100, unclassifiedValue / total * 100)),
    };
}

export function readPortfolioBenchmarkMode(): PortfolioBenchmarkMode {
    if (typeof window === 'undefined') return 'allocation';
    try {
        return window.localStorage.getItem(BENCHMARK_MODE_KEY) === 'msci' ? 'msci' : 'allocation';
    } catch {
        return 'allocation';
    }
}

export function savePortfolioBenchmarkMode(mode: PortfolioBenchmarkMode): void {
    try {
        window.localStorage.setItem(BENCHMARK_MODE_KEY, mode);
    } catch {
        // The active view still changes if browser storage is unavailable.
    }
}

function datedHistory(points: HistoricalDataPoint[]): Map<string, HistoricalDataPoint> {
    const sorted = [...points].sort((a, b) => (a.timestamp ?? Date.parse(a.date)) - (b.timestamp ?? Date.parse(b.date)));
    const byDay = new Map<string, HistoricalDataPoint>();
    for (const point of sorted) {
        const timestamp = point.timestamp ?? Date.parse(point.date);
        const day = accountingDay(timestamp);
        if (!day || !Number.isFinite(timestamp) || !Number.isFinite(point.close) || point.close <= 0
            || (point.currency && point.currency !== 'EUR')) continue;
        byDay.set(day, point);
    }
    return byDay;
}

/**
 * Builds a daily rebalanced two-fund index from real, coincident EUR NAV dates.
 * No prices are interpolated; non-overlapping dates do not create synthetic returns.
 */
export function weightedBenchmarkHistory(
    equityHistory: HistoricalDataPoint[],
    groupamaHistory: HistoricalDataPoint[],
    equityPercent: number,
): HistoricalDataPoint[] {
    if (!Number.isFinite(equityPercent) || equityPercent < 0 || equityPercent > 100) return [];
    const equityWeight = equityPercent / 100;
    if (equityWeight === 0) return [...datedHistory(groupamaHistory).values()];
    if (equityWeight === 1) return [...datedHistory(equityHistory).values()];

    const equityByDay = datedHistory(equityHistory);
    const groupamaByDay = datedHistory(groupamaHistory);
    const days = [...equityByDay.keys()].filter(day => groupamaByDay.has(day)).sort();
    if (days.length < 2) return [];

    const firstEquity = equityByDay.get(days[0])!;
    const firstGroupama = groupamaByDay.get(days[0])!;
    let index = 100;
    const firstPoint: HistoricalDataPoint = {
        date: firstEquity.date,
        ...(Number.isFinite(firstEquity.timestamp) ? { timestamp: firstEquity.timestamp } : {}),
        open: index, high: index, low: index, close: index, volume: 0, currency: 'EUR',
    };
    const previousEquity = firstEquity.previousClose;
    const previousGroupama = firstGroupama.previousClose;
    if (Number.isFinite(previousEquity) && previousEquity! > 0
        && Number.isFinite(previousGroupama) && previousGroupama! > 0) {
        const previousReturn = equityWeight * (firstEquity.close / previousEquity! - 1)
            + (1 - equityWeight) * (firstGroupama.close / previousGroupama! - 1);
        if (previousReturn > -1) firstPoint.previousClose = index / (1 + previousReturn);
    }

    const result = [firstPoint];
    for (let i = 1; i < days.length; i += 1) {
        const previousDay = days[i - 1];
        const day = days[i];
        const previousEquityClose = equityByDay.get(previousDay)!.close;
        const previousGroupamaClose = groupamaByDay.get(previousDay)!.close;
        const currentEquity = equityByDay.get(day)!;
        const currentGroupama = groupamaByDay.get(day)!;
        const intervalReturn = equityWeight * (currentEquity.close / previousEquityClose - 1)
            + (1 - equityWeight) * (currentGroupama.close / previousGroupamaClose - 1);
        index *= 1 + intervalReturn;
        if (!Number.isFinite(index) || index <= 0) return [];

        result.push({
            date: currentEquity.date,
            ...(Number.isFinite(currentEquity.timestamp) ? { timestamp: currentEquity.timestamp } : {}),
            open: index, high: index, low: index, close: index, volume: 0, currency: 'EUR',
        });
    }
    return result;
}
