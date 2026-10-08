import { usePortfolioHistoryArchive } from '../../hooks/usePortfolioHistoryArchive';
import { useEffect, useMemo, useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { getHistory, isApiEnabled } from '../../services/storageService';
import { getAssetChartData } from '../../services/apiService';
import { historicalBundle, historyScopeMatches, linkPortfolioHistory } from '../../services/portfolioHistoryArchive';
import { accountingDay, buildPortfolioAnalyticsHistory, createMarketPortfolioHistory, createQuoteSnapshot, normalizePortfolioTransactions, performanceSeries, portfolioMonthlyRows } from '../../services/portfolioPerformance';
import { continuePortfolioHistory } from '../../services/dashboardHistory';
import type { HistoricalDataPoint } from '../../types/types';
import { convertHistoryToCurrency } from '../../services/assetValuation';
import { useLocalDataVersion, notifyLocalDataChange } from '../../hooks/useLocalDataVersion';
import { useDailyMarketData } from '../../hooks/useDailyMarketData';
import { dailyHistory, dailySnapshots } from '../../services/dailyMarketData';
import { dashboardMarketHistory } from '../../services/dashboardMarketHistory';
import { PRICE_REFRESH_INTERVAL_MS } from '../../constants/app';

export function useDashboardAnalytics(now: number) {
    const { state: { assets, transactions, lastPriceUpdate } } = usePortfolio();
    const localRevision = useLocalDataVersion();
    const apiEnabled = isApiEnabled();
    const dailyMarket = useDailyMarketData(lastPriceUpdate ? Math.floor(lastPriceUpdate.getTime()/PRICE_REFRESH_INTERVAL_MS) : null);
    const day = accountingDay(now);
    const {archive,error:historyError} = usePortfolioHistoryArchive(localRevision);
    const historicalHistory = useMemo(() => { void day; return historicalBundle(archive,now); }, [archive,day,now]);
    const hasArchivedHistory = historicalHistory.points.length >= 2;
    const portfolioTransactions = useMemo(() => normalizePortfolioTransactions(assets, transactions), [assets, transactions]);
    const historyLinked = useMemo(() => historyScopeMatches(archive,assets,portfolioTransactions),[archive,assets,portfolioTransactions]);
    const linkHistory = () => {
        linkPortfolioHistory([...assets.map(a=>a.id),...transactions.map(t=>t.assetId)]);
        notifyLocalDataChange();
    };
    const [marketCache, setMarket] = useState<Map<string, { symbol: string; prices: HistoricalDataPoint[] }>>(new Map());
    const signature = JSON.stringify([...new Map([
        ...portfolioTransactions.map(t => [t.assetId, t.assetSymbol] as const),
        ...assets.filter(a => a.type !== 'cash').map(a => [a.id, a.isin || a.symbol] as const),
    ]).entries()].sort());
    const market = useMemo(() => new Map((JSON.parse(signature) as [string, string][]).flatMap(([id, symbol]) => {
        const cached = marketCache.get(id);
        return cached?.symbol === symbol ? [[id, cached.prices] as const] : [];
    })), [signature, marketCache]);
    useEffect(() => {
        if (hasArchivedHistory || !apiEnabled) return;
        const controller = new AbortController();
        const entries = JSON.parse(signature) as [string, string][];
        // Bound concurrency and preserve successful histories if another provider fails.
        let next = 0;
        const results = new Map<string, { symbol: string; prices: HistoricalDataPoint[] }>();
        const requests = new Map<string, Promise<HistoricalDataPoint[]>>();
        const load = (symbol: string) => {
            if (!requests.has(symbol)) requests.set(symbol, dashboardMarketHistory.load(symbol, controller.signal, getAssetChartData));
            return requests.get(symbol)!;
        };
        const worker = async () => {
            while (next < entries.length && !controller.signal.aborted) {
                const [id, symbol] = entries[next++];
                try {
                    const prices = await load(symbol);
                    const currency = prices[0]?.currency;
                    if (currency && currency !== 'EUR' && currency !== 'Unknown') {
                        const fx = await load(currency + 'EUR=X');
                        const converted = convertHistoryToCurrency(prices, fx);
                        if (converted.length) results.set(id, { symbol, prices: converted });
                    } else if (prices.length) results.set(id, { symbol, prices });
                }
                catch { /* Missing histories remain unavailable. */ }
            }
        };
        void Promise.all(Array.from({ length: Math.min(4, entries.length) }, worker)).then(() => {
            if (!controller.signal.aborted) setMarket(previous => {
                const next = new Map(entries.flatMap(([id, symbol]) => previous.get(id)?.symbol === symbol ? [[id, previous.get(id)!] as const] : []));
                results.forEach((prices, id) => next.set(id, prices));
                return next;
            });
        });
        return () => controller.abort();
    }, [signature, hasArchivedHistory, apiEnabled, lastPriceUpdate]);

    const analytics = useMemo(() => {
        void localRevision;
        const quoteTimes = assets.map(a => Date.parse(a.quotedAt || a.lastQuoteAt || ''));
        const workbookEnd = Date.parse(historicalHistory.endDate || '');
        const quotesAlreadyImported = hasArchivedHistory && quoteTimes.length > 0
            && quoteTimes.every(time => Number.isFinite(time) && time <= workbookEnd);
        // Opening the page must not turn yesterday's unchanged prices into a new valuation today.
        const currentSnapshot = quotesAlreadyImported ? null
            : createQuoteSnapshot(assets, portfolioTransactions, new Date(now).toISOString());
        const recorded = buildPortfolioAnalyticsHistory([...getHistory(), ...dailySnapshots(dailyMarket.data)], portfolioTransactions, currentSnapshot ?? undefined);
        const verifiedDays = new Set(recorded.map(p => accountingDay(p.date)));
        const datedMarket = new Map(market);
        for (const asset of assets) {
            const saved = dailyHistory(dailyMarket.data, asset.type === 'fund' ? asset.isin || asset.symbol : asset.symbol);
            if (saved.length) {
                const prices = new Map((datedMarket.get(asset.id) || []).map(p => [accountingDay(p.date), p]));
                saved.forEach(p => prices.set(accountingDay(p.date), p));
                datedMarket.set(asset.id, [...prices.values()].sort((a, b) => a.date.localeCompare(b.date)));
            }
        }
        const estimated = createMarketPortfolioHistory(assets, portfolioTransactions, datedMarket)
            .filter(p => !verifiedDays.has(accountingDay(p.date)) && Date.parse(p.date) <= now);
        const liveHistory = buildPortfolioAnalyticsHistory([...estimated, ...recorded], portfolioTransactions, undefined, assets, true);
        const combined = hasArchivedHistory
            ? continuePortfolioHistory(historicalHistory, recorded, portfolioTransactions, now, historyLinked)
            : { history: liveHistory, transactions: portfolioTransactions };
        const series = performanceSeries(combined.history, combined.transactions, assets, {
            maxGapDays: hasArchivedHistory ? 45 : 16,
        });
        return { historicalHistory, hasArchivedHistory, portfolioTransactions, history: combined.history, series,
            liveSeries: performanceSeries(recorded, portfolioTransactions, assets), monthly: portfolioMonthlyRows(series, now),
            hasEstimates: combined.history.some(p => p.source === 'market-estimate') };
    }, [assets, portfolioTransactions, market, now, historicalHistory, hasArchivedHistory, localRevision, historyLinked, dailyMarket.data]);
    return { ...analytics, archive, historyError, localRevision, historyLinked, linkHistory, dailyMarket };
}

export type DashboardAnalytics = ReturnType<typeof useDashboardAnalytics>;
