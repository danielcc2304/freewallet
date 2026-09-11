import type { PortfolioHistoryPoint, PortfolioTransaction } from '../types/types';

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
): PortfolioHistoryPoint[] {
    const validHistory = [...history]
        .filter((point) => Number.isFinite(new Date(point.date).getTime()) && Number.isFinite(point.value) && point.value >= 0 && Number.isFinite(point.invested) && point.invested >= 0)
        .sort((left, right) => left.date.localeCompare(right.date));
    const operations = transactions
        .filter((transaction) => transaction.type === 'buy' || transaction.type === 'sell')
        .map((transaction) => ({ day: getTransactionEventDay(transaction), flow: transactionFlow(transaction) }))
        .filter((operation) => /^\d{4}-\d{2}-\d{2}$/.test(operation.day))
        .sort((left, right) => left.day.localeCompare(right.day));
    const operationDays = operations.map((operation) => operation.day);
    const firstOperationDay = operationDays[0];

    let relevantHistory = firstOperationDay
        ? validHistory.filter((point) => point.date.slice(0, 10) >= firstOperationDay)
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
        .reduce((sum, operation) => sum + operation.flow, 0);

    // Anchor the expected invested series on the latest live snapshot. This
    // keeps the current portfolio value authoritative even when the ledger
    // contains old positions or a snapshot predates a backdated purchase.
    if (operations.length > 0 && normalizedHistory.length > 0) {
        const lastDay = normalizedHistory.at(-1)!.date.slice(0, 10);
        const baseInvested = normalizedHistory.at(-1)!.invested - flowUntil(lastDay);

        if (baseInvested >= -0.01) {
            const historyDays = new Set(normalizedHistory.map((point) => point.date.slice(0, 10)));
            const operationBaselines = [...new Set(operationDays)]
                .filter((day) => !historyDays.has(day))
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
export function performanceSeries(history: PortfolioHistoryPoint[], transactions: PortfolioTransaction[]) {
    const days = new Map<string, PortfolioHistoryPoint>();
    [...history].filter(p => Number.isFinite(p.value) && p.value >= 0)
        .sort((a, b) => a.date.localeCompare(b.date)).forEach(p => days.set(p.date.slice(0, 10), p));
    let index = 100;
    return [...days.values()].map((point, i, points) => {
        const previous = points[i - 1];
        const previousDay = previous?.date.slice(0, 10) || '';
        const pointDay = point.date.slice(0, 10);
        const operations = previous
            ? transactions.filter(t => {
                const eventDay = getTransactionEventDay(t);
                return eventDay > previousDay && eventDay <= pointDay;
            })
            : [];
        const declaredFlow = operations.reduce((sum, transaction) => sum + transactionFlow(transaction), 0);
        const investedDelta = previous ? point.invested - previous.invested : 0;
        // Prefer the actual invested delta when the transaction ledger does
        // not explain the snapshot change (e.g. an imported contribution).
        const flow = Math.abs(investedDelta - declaredFlow) > 0.01 ? investedDelta : declaredFlow;
        const valid = !!previous && previous.value > 0 && !operations.some(t => t.type === 'edit' || t.type === 'delete');
        // A large contribution and its first quote can arrive in the same
        // snapshot. There is no observable holding period for that money, so
        // do not turn it into a fictitious one-day return.
        const materialCapitalFlow = Boolean(previous && Math.abs(flow) > Math.max(100, previous.value * 0.5));
        const dailyReturn = valid
            ? materialCapitalFlow
                ? 0
                : (point.value - previous.value - flow) / previous.value * 100
            : null;
        if (dailyReturn !== null) index *= 1 + dailyReturn / 100;
        return { ...point, date: point.date.slice(0, 10), dailyReturn, netFlow: flow, cumulativeReturn: index - 100, index };
    });
}
