import type { PortfolioHistoryPoint, PortfolioTransaction } from '../types/types';
import type { WorkbookHistoryBundle } from './portfolioWorkbookHistory';
import { accountingDay, getTransactionEventDay } from './portfolioPerformance';

/** The imported closing day owns all its flows; local operations take over afterwards. */
export function continueWorkbookHistory(workbook: WorkbookHistoryBundle, live: PortfolioHistoryPoint[], ledger: PortfolioTransaction[], now: number) {
    const imported = workbook.points.filter(p => Date.parse(p.date) <= now);
    const last = imported.at(-1);
    if (!last) return { history: live, transactions: ledger };
    const cutoff = accountingDay(last.date);
    const later = ledger.filter(t => getTransactionEventDay(t) > cutoff);
    const history = [
        ...imported,
        ...live.filter(p => accountingDay(p.date) > cutoff && Date.parse(p.date) <= now).map(p => ({
            ...p,
            // Excel capital is cumulative contributed capital, not the cost of open positions.
            invested: last.invested + later.filter(t => getTransactionEventDay(t) <= accountingDay(p.date))
                .reduce((sum, t) => sum + (t.type === 'buy' ? t.total ?? 0 : t.type === 'sell' ? -(t.total ?? 0) : 0), 0),
        })),
    ];
    return { history, transactions: [...workbook.flowTransactions.filter(t => getTransactionEventDay(t) <= cutoff), ...later] };
}

export function latestContinuousMonths<T extends { month: string; monthlyReturn: number }>(rows: T[]): T[] {
    let start = rows.length - 1;
    const ordinal = (month: string) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5));
    while (start > 0 && ordinal(rows[start].month) - ordinal(rows[start - 1].month) === 1) start--;
    return rows.slice(Math.max(0, start));
}
