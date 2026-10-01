import type { PortfolioHistoryPoint, PortfolioTransaction } from '../types/types';
import type { WorkbookHistoryBundle } from './portfolioWorkbookHistory';
import { accountingDay, getTransactionEventDay } from './portfolioPerformance';

/** The imported closing day owns all its flows; local operations take over afterwards. */
export function continueWorkbookHistory(workbook: WorkbookHistoryBundle, live: PortfolioHistoryPoint[], ledger: PortfolioTransaction[], now: number, scopeVerified = false) {
    const imported = workbook.points.filter(p => Date.parse(p.date) <= now);
    const last = imported.at(-1);
    if (!last) return { history: live, transactions: ledger };
    if (!scopeVerified) return { history: imported, transactions: workbook.flowTransactions };
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

export { latestContinuousMonths } from './portfolioRisk';
