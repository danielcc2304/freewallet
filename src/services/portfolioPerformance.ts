import type { Asset, PortfolioHistoryPoint, PortfolioTransaction } from '../types/types';

/**
 * Returns the calendar day on which an operation belongs to the portfolio.
 * The date entered by the user is authoritative; createdAt is only the
 * fallback for legacy transactions that did not have an operation date.
 */
export function getTransactionEventDay(transaction: PortfolioTransaction): string {
    const enteredDate = transaction.date?.slice(0, 10) || '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(enteredDate)) return enteredDate;
    return transaction.createdAt?.slice(0, 10) || '';
}

function transactionFlow(transaction: PortfolioTransaction): number {
    const amount = transaction.total || 0;
    return transaction.type === 'buy' ? amount : transaction.type === 'sell' ? -amount : 0;
}

const MAX_OBSERVATION_GAP_MS = 45 * 24 * 60 * 60 * 1000;

/**
 * Keeps the live analytics ledger scoped to active positions. If an imported
 * transaction history does not reconcile with the current cost of a position,
 * replace that position's noisy ledger with one authoritative purchase flow.
 */
export function normalizePortfolioTransactions(assets: Asset[], transactions: PortfolioTransaction[]): PortfolioTransaction[] {
    const normalized: PortfolioTransaction[] = [];

    assets.forEach((asset) => {
        const assetTransactions = transactions.filter((transaction) => transaction.assetId === asset.id);
        const cashTransactions = assetTransactions.filter((transaction) => transaction.type === 'buy' || transaction.type === 'sell');
        const currentCost = asset.purchasePrice * asset.quantity;

        if (cashTransactions.length > 0) {
            const buys = cashTransactions.filter((transaction) => transaction.type === 'buy');
            const sells = cashTransactions.filter((transaction) => transaction.type === 'sell');
            const buyTotal = buys.reduce((sum, transaction) => sum + (transaction.total || 0), 0);
            const sellTotal = sells.reduce((sum, transaction) => sum + (transaction.total || 0), 0);
            const netFlow = buyTotal - sellTotal;
            if (Math.abs(netFlow - currentCost) <= 0.01 || buyTotal <= 0) {
                // Keep the dated ledger whenever it already reconciles. A
                // sale remains a cash withdrawal even when its proceeds differ
                // from the cost basis removed from the position.
                normalized.push(...assetTransactions);
                if (buyTotal <= 0 && currentCost > 0) {
                    normalized.push({
                        id: `position-${asset.id}`,
                        assetId: asset.id,
                        assetSymbol: asset.symbol,
                        assetName: asset.name,
                        assetType: asset.type,
                        type: 'buy',
                        date: asset.purchaseDate,
                        quantity: asset.quantity,
                        price: asset.purchasePrice,
                        total: currentCost + sellTotal,
                        notes: 'Flujo normalizado desde la posición activa',
                        createdAt: `${asset.purchaseDate}T00:00:00.000Z`,
                    });
                }
                return;
            }

            // Imported workbooks can contain duplicated/rounded operations.
            // Reconcile only the cash amounts while retaining every operation
            // date, so period returns still start on the dates entered by the
            // user instead of jumping to the date the asset was saved.
            const targetBuyTotal = currentCost + sellTotal;
            const scale = targetBuyTotal / buyTotal;
            normalized.push(...assetTransactions.map((transaction) => {
                if (transaction.type !== 'buy') return transaction;
                const total = (transaction.total || 0) * scale;
                return {
                    ...transaction,
                    total,
                    price: transaction.quantity ? total / transaction.quantity : transaction.price,
                    notes: transaction.notes ? `${transaction.notes} · importe reconciliado` : 'Importe reconciliado con la posición activa',
                };
            }));
            return;
        }

        if (assetTransactions.length > 0) normalized.push(...assetTransactions);
        if (currentCost > 0) {
            normalized.push({
                id: `position-${asset.id}`,
                assetId: asset.id,
                assetSymbol: asset.symbol,
                assetName: asset.name,
                assetType: asset.type,
                type: 'buy',
                date: asset.purchaseDate,
                quantity: asset.quantity,
                price: asset.purchasePrice,
                total: currentCost,
                notes: 'Flujo normalizado desde la posición activa',
                createdAt: `${asset.purchaseDate}T00:00:00.000Z`,
            });
        }
    });

    return normalized;
}

/**
 * Builds the history used by live portfolio analytics.
 *
 * Snapshots are only created when prices are refreshed, while a user can
 * enter a purchase date in the past. When that happens, keep the chart from
 * starting at the save timestamp: add a cost baseline on the first operation
 * day and ignore snapshots that predate the portfolio.
 */
export function buildPortfolioAnalyticsHistory(
    history: PortfolioHistoryPoint[],
    transactions: PortfolioTransaction[],
    currentSnapshot?: PortfolioHistoryPoint,
    assets: Asset[] = [],
): PortfolioHistoryPoint[] {
    const validHistory = [...history]
        .filter((point) => Number.isFinite(new Date(point.date).getTime()) && Number.isFinite(point.value) && point.value >= 0 && Number.isFinite(point.invested) && point.invested >= 0)
        .sort((left, right) => left.date.localeCompare(right.date));
    const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
    const operations = transactions
        .filter((transaction) => transaction.type === 'buy' || transaction.type === 'sell')
        .map((transaction) => ({
            day: getTransactionEventDay(transaction),
            flow: transactionFlow(transaction),
            // The invested series follows cost basis. On a sale, the cash
            // proceeds and the cost removed from invested capital are not
            // necessarily equal (the position may have gained or lost).
            investedFlow: transaction.type === 'sell'
                ? -(transaction.quantity || 0) * (assetsById.get(transaction.assetId)?.purchasePrice || transaction.price || 0)
                : transactionFlow(transaction),
        }))
        .filter((operation) => /^\d{4}-\d{2}-\d{2}$/.test(operation.day))
        .sort((left, right) => left.day.localeCompare(right.day));
    const operationDays = operations.map((operation) => operation.day);
    const firstOperationDay = operationDays[0];

    let relevantHistory = firstOperationDay
        ? [
            // Retain the last valuation before the first operation as the
            // return base. Dropping it makes the first purchase appear as the
            // first point and prevents TWR from separating its cash flow.
            ...validHistory.filter((point) => point.date.slice(0, 10) < firstOperationDay).slice(-1),
            ...validHistory.filter((point) => point.date.slice(0, 10) >= firstOperationDay),
        ]
        : validHistory;

    if (currentSnapshot && (!firstOperationDay || currentSnapshot.date.slice(0, 10) >= firstOperationDay)) {
        relevantHistory = [...relevantHistory, currentSnapshot];
    }

    if (relevantHistory.length === 0 && currentSnapshot) {
        relevantHistory = [currentSnapshot];
    }

    const deduplicated = new Map<string, PortfolioHistoryPoint>();
    relevantHistory.forEach((point) => deduplicated.set(point.date.slice(0, 10), point));
    let normalizedHistory = [...deduplicated.values()].sort((left, right) => left.date.localeCompare(right.date));

    const flowUntil = (day: string) => operations
        .filter((operation) => operation.day <= day)
        .reduce((sum, operation) => sum + operation.investedFlow, 0);

    // Anchor the expected invested series on the latest live snapshot. This
    // keeps the current portfolio value authoritative even when the ledger
    // contains old positions or a snapshot predates a backdated purchase.
    if (operations.length > 0 && normalizedHistory.length > 0) {
        const lastDay = normalizedHistory.at(-1)!.date.slice(0, 10);
        const baseInvested = normalizedHistory.at(-1)!.invested - flowUntil(lastDay);

        if (baseInvested >= -0.01) {
            const operationBaselines = [...new Set(operationDays)]
                // A current snapshot can already occupy the operation day.
                // Keep a midnight cost baseline as a separate point so the
                // same-day purchase cannot absorb the whole prior period.
                .filter((day) => !normalizedHistory.some((point) => point.date === `${day}T00:00:00.000Z`))
                .map((day) => {
                    const baseline = Math.max(0, baseInvested + flowUntil(day));
                    return { date: `${day}T00:00:00.000Z`, value: baseline, invested: baseline };
                });
            normalizedHistory = [...normalizedHistory, ...operationBaselines]
                .sort((left, right) => left.date.localeCompare(right.date));

            normalizedHistory = normalizedHistory.map((point) => {
                const expectedInvested = Math.max(0, baseInvested + flowUntil(point.date.slice(0, 10)));
                const missingCapital = expectedInvested - point.invested;
                if (Math.abs(missingCapital) <= 0.01) return point;
                return {
                    ...point,
                    invested: expectedInvested,
                    value: Math.max(0, point.value + missingCapital),
                };
            });
        }
    }

    return normalizedHistory;
}

// Returns are calculated between recorded valuations, never from purchase cost.
// Backdated trades are applied to the date entered by the user so the series
// starts when the position was actually incorporated, not when it was saved.
export function performanceSeries(history: PortfolioHistoryPoint[], transactions: PortfolioTransaction[], assets: Asset[] = []) {
    const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
    const groupedByDay = new Map<string, PortfolioHistoryPoint[]>();
    [...history].filter(p => Number.isFinite(p.value) && p.value >= 0)
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((point) => {
            const day = point.date.slice(0, 10);
            groupedByDay.set(day, [...(groupedByDay.get(day) || []), point]);
        });
    const operationDays = new Set(
        transactions
            .filter((transaction) => transaction.type === 'buy' || transaction.type === 'sell')
            .map(getTransactionEventDay),
    );
    const points = [...groupedByDay.entries()].flatMap(([day, dayPoints]) => {
        if (!operationDays.has(day) || dayPoints.length < 2) return [dayPoints.at(-1)!];
        const baseline = dayPoints.find((point) => point.date.includes('T00:00:00.000Z') && point.value === point.invested);
        const last = dayPoints.at(-1)!;
        return baseline && baseline !== last ? [baseline, last] : [last];
    });
    let index = 100;
    return points.map((point, i) => {
        const previous = points[i - 1];
        const previousDay = previous?.date.slice(0, 10) || '';
        const pointDay = point.date.slice(0, 10);
        const operations = previous
            ? transactions.filter(t => {
                const eventDay = getTransactionEventDay(t);
                return eventDay > previousDay && eventDay <= pointDay;
            })
            : [];
        const declaredFlow = operations.reduce((sum, transaction) => {
            const eventDay = getTransactionEventDay(transaction);
            const asset = assetsById.get(transaction.assetId);
            // When a position is first quoted on the same day it is added, the
            // live value can already include a gain over the entered cost.
            // Use that day's market value as the TWR flow so the first quote
            // is not reported as a one-day portfolio return.
            const syntheticBaseline = point.date.includes('T00:00:00.000Z') && point.value === point.invested;
            if (!syntheticBaseline && transaction.type === 'buy' && eventDay === pointDay && asset && transaction.quantity) {
                return sum + (asset.currentPrice || asset.purchasePrice) * transaction.quantity;
            }
            return sum + transactionFlow(transaction);
        }, 0);
        const investedDelta = previous ? point.invested - previous.invested : 0;
        // A dated buy/sell is an external cash flow for TWR. The invested
        // series follows cost basis, so a profitable sale can legitimately
        // differ from its cash proceeds. Only use the invested delta when no
        // cash operation explains the snapshot (e.g. an imported contribution).
        const flow = operations.some((transaction) => transaction.type === 'buy' || transaction.type === 'sell')
            ? declaredFlow
            : investedDelta;
        const observationGap = previous ? new Date(point.date).getTime() - new Date(previous.date).getTime() : Number.POSITIVE_INFINITY;
        const valid = !!previous && previous.value > 0 && observationGap <= MAX_OBSERVATION_GAP_MS && !operations.some(t => t.type === 'edit' || t.type === 'delete');
        // A large contribution and its first quote can arrive in the same
        // snapshot. There is no observable holding period for that money, so
        // do not turn it into a fictitious one-day return.
        const materialCapitalFlow = Boolean(previous && !operations.some((transaction) => transaction.type === 'buy' || transaction.type === 'sell') && Math.abs(flow) > Math.max(100, previous.value * 0.5));
        const sameDayContinuation = Boolean(previous && previousDay === pointDay);
        const dailyReturn = valid
            ? sameDayContinuation || materialCapitalFlow
                ? 0
                : (point.value - previous.value - flow) / previous.value * 100
            : null;
        if (dailyReturn !== null) index *= 1 + dailyReturn / 100;
        return { ...point, date: point.date.slice(0, 10), timestamp: new Date(point.date).getTime(), dailyReturn, netFlow: flow, cumulativeReturn: index - 100, index };
    });
}

export interface PortfolioPeriodPerformance {
    hasBase: boolean;
    baseDate: string | null;
    endDate: string | null;
    change: number | null;
    returnPercent: number | null;
    netFlow: number;
    observations: number;
}

/**
 * Calculates a period return from the nearest valuation at or before the
 * requested start. Returns are chained from the flow-adjusted daily series,
 * so contributions and withdrawals do not become fictitious performance.
 */
export function calculatePeriodPerformance(
    series: ReturnType<typeof performanceSeries>,
    startMs: number,
    endMs = Number.POSITIVE_INFINITY,
    maxBaseGapMs = Number.POSITIVE_INFINITY,
): PortfolioPeriodPerformance {
    const pointTimestamp = (point: (typeof series)[number]) => Number.isFinite(point.timestamp) ? point.timestamp : new Date(point.date).getTime();
    const validSeries = series.filter((point) => Number.isFinite(pointTimestamp(point)) && pointTimestamp(point) <= endMs);
    if (validSeries.length === 0) {
        return { hasBase: false, baseDate: null, endDate: null, change: null, returnPercent: null, netFlow: 0, observations: 0 };
    }

    const baseIndex = startMs === Number.NEGATIVE_INFINITY
        ? 0
        : validSeries.reduce((lastIndex, point, index) => {
            return pointTimestamp(point) <= startMs ? index : lastIndex;
        }, -1);
    if (baseIndex < 0) {
        return { hasBase: false, baseDate: null, endDate: validSeries.at(-1)!.date, change: null, returnPercent: null, netFlow: 0, observations: 0 };
    }

    const base = validSeries[baseIndex];
    const baseTimestamp = pointTimestamp(base);
    if (Number.isFinite(startMs) && Number.isFinite(maxBaseGapMs) && startMs - baseTimestamp > maxBaseGapMs) {
        return { hasBase: false, baseDate: null, endDate: validSeries.at(-1)!.date, change: null, returnPercent: null, netFlow: 0, observations: 0 };
    }
    const end = validSeries.at(-1)!;
    const periodPoints = validSeries.slice(baseIndex + 1);
    const observedPoints = periodPoints.filter((point) => point.dailyReturn !== null && Number.isFinite(point.dailyReturn));
    const factor = observedPoints.reduce((growth, point) => growth * (1 + point.dailyReturn! / 100), 1);
    const netFlow = periodPoints.reduce((sum, point) => sum + (Number.isFinite(point.netFlow) ? point.netFlow : 0), 0);

    return {
        hasBase: true,
        baseDate: base.date,
        endDate: end.date,
        // Express the monetary change on the starting capital. Subtracting
        // raw flows from end.value is misleading when a newly added position
        // is already marked to market on its first quote.
        change: observedPoints.length > 0 ? base.value * (factor - 1) : null,
        returnPercent: observedPoints.length > 0 ? (factor - 1) * 100 : null,
        netFlow,
        observations: observedPoints.length,
    };
}
