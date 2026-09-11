import type { PortfolioHistoryPoint, PortfolioTransaction } from '../types/types';

// Returns are calculated between recorded valuations, never from purchase cost.
// Use registration time: backdated trades only enter the live valuation when recorded.
export function performanceSeries(history: PortfolioHistoryPoint[], transactions: PortfolioTransaction[]) {
    const days = new Map<string, PortfolioHistoryPoint>();
    [...history].filter(p => Number.isFinite(p.value) && p.value >= 0)
        .sort((a, b) => a.date.localeCompare(b.date)).forEach(p => days.set(p.date.slice(0, 10), p));
    let index = 100;
    return [...days.values()].map((point, i, points) => {
        const previous = points[i - 1];
        const operations = previous ? transactions.filter(t => t.createdAt > previous.date && t.createdAt <= point.date) : [];
        const flow = operations.reduce((sum, t) => sum + (t.type === 'buy' ? t.total || 0 : t.type === 'sell' ? -(t.total || 0) : 0), 0);
        const unexplainedCostChange = previous && operations.length === 0 && Math.abs(point.invested - previous.invested) > .01;
        const valid = !!previous && previous.value > 0 && !unexplainedCostChange && !operations.some(t => t.type === 'edit' || t.type === 'delete');
        const dailyReturn = valid ? (point.value - previous.value - flow) / previous.value * 100 : null;
        if (dailyReturn !== null) index *= 1 + dailyReturn / 100;
        return { ...point, date: point.date.slice(0, 10), dailyReturn, cumulativeReturn: index - 100, index };
    });
}
