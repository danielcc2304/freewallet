import { useEffect, useMemo, useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { getHistory, isApiEnabled } from '../../services/storageService';
import { getAssetChartData } from '../../services/apiService';
import { readWorkbookHistory } from '../../services/portfolioWorkbookHistory';
import { accountingDay, buildPortfolioAnalyticsHistory, createMarketPortfolioHistory, createQuoteSnapshot, normalizePortfolioTransactions, performanceSeries, portfolioMonthlyRows } from '../../services/portfolioPerformance';
import { continueWorkbookHistory } from '../../services/dashboardHistory';
import type { HistoricalDataPoint } from '../../types/types';
import { convertHistoryToCurrency } from '../../services/assetValuation';
import { useLocalDataVersion, notifyLocalDataChange } from '../../hooks/useLocalDataVersion';

export function useDashboardAnalytics(now: number) {
    const { state: { assets, transactions, lastPriceUpdate } } = usePortfolio();
    const localRevision = useLocalDataVersion();
    const apiEnabled = isApiEnabled();
    const day = accountingDay(now);
    const workbookHistory = useMemo(() => { void localRevision; void day; return readWorkbookHistory(); }, [localRevision, day]);
    const usingWorkbookHistory = workbookHistory.points.length >= 2;
    const portfolioTransactions = useMemo(() => normalizePortfolioTransactions(assets, transactions), [assets, transactions]);
    const workbookLinked = useMemo(() => {
        void localRevision;
        try {
            const link = JSON.parse(localStorage.getItem('freewallet_workbook_link') || 'null');
            return !!link && link.workbook === workbookHistory.identity && Array.isArray(link.ids)
                && portfolioTransactions.some(t => link.ids.includes(t.assetId))
                && assets.every(a => link.ids.includes(a.id) || transactions.some(t => t.assetId === a.id && t.type === 'buy' && t.provenance !== 'initial-position' && !/^(bootstrap|position)-/.test(t.id)));
        } catch { return false; }
    }, [assets, transactions, portfolioTransactions, workbookHistory, localRevision]);
    const linkWorkbook = () => {
        localStorage.setItem('freewallet_workbook_link', JSON.stringify({ workbook: workbookHistory.identity, ids: [...new Set([...assets.map(a => a.id), ...transactions.map(t => t.assetId)])] }));
        notifyLocalDataChange();
    };
    const [market, setMarket] = useState<Map<string, HistoricalDataPoint[]>>(new Map());
    const signature = JSON.stringify([...new Map([
        ...portfolioTransactions.map(t => [t.assetId, t.assetSymbol] as const),
        ...assets.filter(a => a.type !== 'cash').map(a => [a.id, a.isin || a.symbol] as const),
    ]).entries()].sort());
    useEffect(() => {
        if (usingWorkbookHistory || !apiEnabled) return;
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
                        const converted = convertHistoryToCurrency(prices, fx);
                        if (converted.length) results.set(id, converted);
                    } else if (prices.length) results.set(id, prices);
                }
                catch { /* Missing histories remain unavailable. */ }
            }
        };
        void Promise.all(Array.from({ length: Math.min(4, entries.length) }, worker)).then(() => {
            if (!controller.signal.aborted) setMarket(previous => {
                const next = new Map(entries.flatMap(([id]) => previous.has(id) ? [[id, previous.get(id)!] as const] : []));
                results.forEach((prices, id) => next.set(id, prices));
                return next;
            });
        });
        return () => controller.abort();
    }, [signature, usingWorkbookHistory, apiEnabled, lastPriceUpdate]);

    const analytics = useMemo(() => {
        void localRevision;
        const quoteTimes = assets.map(a => Date.parse(a.quotedAt || a.lastQuoteAt || ''));
        const workbookEnd = Date.parse(workbookHistory.endDate || '');
        const quotesAlreadyImported = usingWorkbookHistory && quoteTimes.length > 0
            && quoteTimes.every(time => Number.isFinite(time) && time <= workbookEnd);
        // Opening the page must not turn yesterday's unchanged prices into a new valuation today.
        const currentSnapshot = quotesAlreadyImported ? null
            : createQuoteSnapshot(assets, portfolioTransactions, new Date(now).toISOString());
        const recorded = buildPortfolioAnalyticsHistory(getHistory(), portfolioTransactions, currentSnapshot ?? undefined);
        const verifiedDays = new Set(recorded.map(p => accountingDay(p.date)));
        const estimated = createMarketPortfolioHistory(assets, portfolioTransactions, market)
            .filter(p => !verifiedDays.has(accountingDay(p.date)) && Date.parse(p.date) <= now);
        const liveHistory = buildPortfolioAnalyticsHistory([...estimated, ...recorded], portfolioTransactions, undefined, assets, true);
        const combined = usingWorkbookHistory
            ? continueWorkbookHistory(workbookHistory, recorded, portfolioTransactions, now, workbookLinked)
            : { history: liveHistory, transactions: portfolioTransactions };
        const series = performanceSeries(combined.history, combined.transactions, assets, {
            maxGapDays: usingWorkbookHistory ? 45 : 16,
        });
        return { workbookHistory, usingWorkbookHistory, portfolioTransactions, history: combined.history, series,
            liveSeries: performanceSeries(recorded, portfolioTransactions, assets), monthly: portfolioMonthlyRows(series, now),
            hasEstimates: combined.history.some(p => p.source === 'market-estimate') };
    }, [assets, portfolioTransactions, market, now, workbookHistory, usingWorkbookHistory, localRevision, workbookLinked]);
    return { ...analytics, workbookLinked, linkWorkbook };
}

export type DashboardAnalytics = ReturnType<typeof useDashboardAnalytics>;
