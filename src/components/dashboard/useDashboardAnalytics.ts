import { useEffect, useMemo, useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { getHistory, isApiEnabled } from '../../services/storageService';
import { getAssetChartData } from '../../services/apiService';
import { readWorkbookHistory } from '../../services/portfolioWorkbookHistory';
import { accountingDay, buildPortfolioAnalyticsHistory, createMarketPortfolioHistory, createQuoteSnapshot, normalizePortfolioTransactions, performanceSeries, portfolioMonthlyRows } from '../../services/portfolioPerformance';
import { continueWorkbookHistory } from '../../services/dashboardHistory';
import type { HistoricalDataPoint } from '../../types/types';

export function useDashboardAnalytics(now: number) {
    const { state: { assets, transactions } } = usePortfolio();
    const workbookHistory = readWorkbookHistory();
    const usingWorkbookHistory = workbookHistory.points.length >= 2;
    const portfolioTransactions = useMemo(() => normalizePortfolioTransactions(assets, transactions), [assets, transactions]);
    const [market, setMarket] = useState<Map<string, HistoricalDataPoint[]>>(new Map());
    const signature = JSON.stringify([...new Map([
        ...portfolioTransactions.map(t => [t.assetId, t.assetSymbol] as const),
        ...assets.map(a => [a.id, a.isin || a.symbol] as const),
    ]).entries()].sort());
    useEffect(() => {
        if (usingWorkbookHistory || !isApiEnabled()) return;
        const controller = new AbortController();
        const entries = JSON.parse(signature) as [string, string][];
        // Bound concurrency and preserve successful histories if another provider fails.
        let next = 0;
        const results = new Map<string, HistoricalDataPoint[]>();
        const fxRequests = new Map<string, Promise<HistoricalDataPoint[]>>();
        const worker = async () => {
            while (next < entries.length && !controller.signal.aborted) {
                const [id, symbol] = entries[next++];
                try {
                    const prices = await getAssetChartData(symbol, 'ALL', controller.signal);
                    const currency = prices[0]?.currency;
                    if (currency && currency !== 'EUR' && currency !== 'Unknown') {
                        if (!fxRequests.has(currency)) fxRequests.set(currency, getAssetChartData(currency + 'EUR=X', 'ALL', controller.signal));
                        const fx = await fxRequests.get(currency)!;
                        results.set(id, prices.flatMap(p => {
                            const time = p.timestamp ?? Date.parse(p.date);
                            const rate = fx.filter(f => (f.timestamp ?? Date.parse(f.date)) <= time).at(-1);
                            if (!rate || rate.close <= 0 || time - (rate.timestamp ?? Date.parse(rate.date)) > 8 * 86400000) return [];
                            return [{ ...p, close: p.close * rate.close, currency: 'EUR' }];
                        }));
                    } else results.set(id, prices);
                }
                catch { /* Missing histories remain unavailable. */ }
            }
        };
        void Promise.all(Array.from({ length: Math.min(4, entries.length) }, worker)).then(() => {
            if (!controller.signal.aborted) setMarket(results);
        });
        return () => controller.abort();
    }, [signature, usingWorkbookHistory]);

    return useMemo(() => {
        const currentSnapshot = createQuoteSnapshot(assets, portfolioTransactions, new Date(now).toISOString());
        const recorded = buildPortfolioAnalyticsHistory(getHistory(), portfolioTransactions, currentSnapshot ?? undefined);
        const verifiedDays = new Set(recorded.map(p => accountingDay(p.date)));
        const estimated = createMarketPortfolioHistory(assets, portfolioTransactions, market)
            .filter(p => !verifiedDays.has(accountingDay(p.date)) && Date.parse(p.date) <= now);
        const liveHistory = buildPortfolioAnalyticsHistory([...estimated, ...recorded], portfolioTransactions, undefined, assets, true);
        const combined = usingWorkbookHistory
            ? continueWorkbookHistory(workbookHistory, recorded, portfolioTransactions, now)
            : { history: liveHistory, transactions: portfolioTransactions };
        const series = performanceSeries(combined.history, combined.transactions, assets, {
            maxGapDays: usingWorkbookHistory && workbookHistory.source === 'monthly' ? 45 : 16,
        });
        return { workbookHistory, usingWorkbookHistory, portfolioTransactions, history: combined.history, series,
            liveSeries: performanceSeries(recorded, portfolioTransactions), monthly: portfolioMonthlyRows(series, now),
            hasEstimates: combined.history.some(p => p.source === 'market-estimate') };
    }, [assets, portfolioTransactions, market, now, workbookHistory, usingWorkbookHistory]);
}

export type DashboardAnalytics = ReturnType<typeof useDashboardAnalytics>;
