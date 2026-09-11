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
        .filter((point) => Number.isFinite(point.value) && point.value >= 0 && Number.isFinite(point.invested) && point.invested >= 0)
        .sort((left, right) => left.date.localeCompare(right.date));
    const operationDays = transactions
        .filter((transaction) => transaction.type === 'buy' || transaction.type === 'sell')
        .map(getTransactionEventDay)
        .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day))
        .sort();
    const firstOperationDay = operationDays[0];

    let relevantHistory = firstOperationDay
        ? validHistory.filter((point) => point.date.slice(0, 10) >= firstOperationDay)
        : validHistory;

    if (firstOperationDay && !relevantHistory.some((point) => point.date.slice(0, 10) === firstOperationDay)) {
        const baselineInvested = transactions
            .filter((transaction) => getTransactionEventDay(transaction) === firstOperationDay)
            .reduce((sum, transaction) => {
                const amount = transaction.total || 0;
                return sum + (transaction.type === 'buy' ? amount : transaction.type === 'sell' ? -amount : 0);
            }, 0);
        const fallbackBaseline = currentSnapshot?.invested || 0;
        const baseline = Math.max(0, baselineInvested || fallbackBaseline);
        relevantHistory = [
            { date: `${firstOperationDay}T00:00:00.000Z`, value: baseline, invested: baseline },
            ...relevantHistory,
        ];
    }

    if (relevantHistory.length === 0 && currentSnapshot) {
        relevantHistory = [currentSnapshot];
    }

    const deduplicated = new Map<string, PortfolioHistoryPoint>();
    relevantHistory.forEach((point) => deduplicated.set(point.date.slice(0, 10), point));
    return [...deduplicated.values()].sort((left, right) => left.date.localeCompare(right.date));
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
        const flow = operations.reduce((sum, t) => sum + (t.type === 'buy' ? t.total || 0 : t.type === 'sell' ? -(t.total || 0) : 0), 0);
        const unexplainedCostChange = previous && operations.length === 0 && Math.abs(point.invested - previous.invested) > .01;
        const valid = !!previous && previous.value > 0 && !unexplainedCostChange && !operations.some(t => t.type === 'edit' || t.type === 'delete');
        const dailyReturn = valid ? (point.value - previous.value - flow) / previous.value * 100 : null;
        if (dailyReturn !== null) index *= 1 + dailyReturn / 100;
        return { ...point, date: point.date.slice(0, 10), dailyReturn, cumulativeReturn: index - 100, index };
    });
}
