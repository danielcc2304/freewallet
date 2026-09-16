import type { Asset, HistoricalDataPoint, PortfolioHistoryPoint, PortfolioTransaction } from '../types/types';

const DAY_MS = 86400000;
export const WORKBOOK_RISK_FREE_ANNUAL_PCT = 2.75;

/** Accounting days follow the workbook's Europe/Madrid calendar. */
export function accountingDay(date: string | number): string {
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const parsed = new Date(date);
    if (!Number.isFinite(parsed.getTime())) return '';
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(parsed);
}

export function getTransactionEventDay(transaction: PortfolioTransaction): string {
    // createdAt describes data entry, never an investment date.
    return /^\d{4}-\d{2}-\d{2}$/.test(transaction.date?.slice(0, 10)) ? transaction.date.slice(0, 10) : '';
}

function transactionFlow(transaction: PortfolioTransaction): number {
    return transaction.type === 'buy' ? transaction.total ?? NaN : transaction.type === 'sell' ? -(transaction.total ?? NaN) : 0;
}

/** Preserve the user's ledger, including sold positions and correction records. */
export function normalizePortfolioTransactions(assets: Asset[], transactions: PortfolioTransaction[]): PortfolioTransaction[] {
    const result = [...transactions];
    for (const asset of assets) {
        if (transactions.some(transaction => transaction.assetId === asset.id)) continue;
        result.push({ id: `position-${asset.id}`, assetId: asset.id, assetSymbol: asset.symbol, assetName: asset.name,
            assetType: asset.type, type: 'buy', date: asset.purchaseDate, quantity: asset.quantity,
            price: asset.purchasePrice, total: asset.purchasePrice * asset.quantity, createdAt: asset.purchaseDate });
    }
    return result;
}

/** A later backdated trade invalidates affected valuations, not earlier ones. */
export function portfolioLedgerKey(transactions: PortfolioTransaction[], date: string): string {
    const day = accountingDay(date);
    const canonical = JSON.stringify(transactions.filter(t => !getTransactionEventDay(t) || getTransactionEventDay(t) <= day)
        .map(t => [t.id, t.assetId, t.assetSymbol, t.type, t.date, t.quantity, t.price, t.total])
        .sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
    // Two independent 32-bit checksums keep minute snapshots small enough for
    // localStorage. This is a change detector, not an authentication token.
    let first = 2166136261, second = 5381;
    for (let i = 0; i < canonical.length; i++) {
        first = Math.imul(first ^ canonical.charCodeAt(i), 16777619);
        second = Math.imul(second, 33) ^ canonical.charCodeAt(i);
    }
    return `${canonical.length}:${first >>> 0}:${second >>> 0}`;
}

export function createQuoteSnapshot(assets: Asset[], transactions: PortfolioTransaction[], date: string): PortfolioHistoryPoint | null {
    if (!assets.length || assets.some(a => !Number.isFinite(a.currentPrice) || a.currentPrice! <= 0 || a.currency !== 'EUR')) return null;
    return { date, value: assets.reduce((sum, a) => sum + a.currentPrice! * a.quantity, 0),
        invested: assets.reduce((sum, a) => sum + a.purchasePrice * a.quantity, 0),
        source: 'quotes-v2', ledgerKey: portfolioLedgerKey(normalizePortfolioTransactions(assets, transactions), date) };
}

/**
 * Uses each holding's latest quote against its previous market close. This is
 * the reliable fallback when there is not yet a complete portfolio history for
 * the current day (for example after importing monthly workbook data).
 */
export function calculatePreviousClosePerformance(assets: Asset[]) {
    const values = assets.map((asset) => {
        const currentPrice = Number.isFinite(asset.currentPrice) && asset.currentPrice! > 0
            ? asset.currentPrice!
            : asset.purchasePrice;
        const previousPrice = Number.isFinite(asset.previousClose) && asset.previousClose! > 0
            ? asset.previousClose!
            : asset.purchasePrice;
        return {
            current: currentPrice * asset.quantity,
            previous: previousPrice * asset.quantity,
        };
    });
    const currentValue = values.reduce((sum, value) => sum + value.current, 0);
    const previousValue = values.reduce((sum, value) => sum + value.previous, 0);
    if (!assets.length || !Number.isFinite(currentValue) || !Number.isFinite(previousValue) || previousValue <= 0) {
        return { change: null as number | null, returnPercent: null as number | null };
    }
    const change = currentValue - previousValue;
    return { change, returnPercent: change / previousValue * 100 };
}

/**
 * Builds a portfolio curve from each holding's historical candles. Historical
 * providers return the listing currency, while holdings are stored in EUR; the
 * latest known EUR quote is therefore used as a conservative scale factor so
 * the curve remains comparable with the dashboard valuation.
 */
export function createMarketPortfolioHistory(
    assets: Asset[],
    transactions: PortfolioTransaction[],
    assetHistory: Map<string, HistoricalDataPoint[]>,
): PortfolioHistoryPoint[] {
    if (!assets.length) return [];
    const ledger = normalizePortfolioTransactions(assets, transactions);
    const days = new Set<string>();
    assetHistory.forEach((points) => points.forEach((point) => {
        const day = accountingDay(point.date);
        if (day) days.add(day);
    }));

    return [...days].sort().flatMap((day) => {
        const active = assets.filter((asset) => accountingDay(asset.purchaseDate) <= day);
        if (!active.length) return [];
        let hasMarketData = false;
        const value = active.reduce((sum, asset) => {
            const fullHistory = assetHistory.get(asset.id) || [];
            const points = fullHistory.filter((point) => accountingDay(point.date) <= day);
            const latest = points.at(-1);
            const rawLatest = fullHistory.at(-1);
            if (latest?.close && latest.close > 0) hasMarketData = true;
            const scale = rawLatest?.close && asset.currentPrice && asset.currentPrice > 0
                ? asset.currentPrice / rawLatest.close
                : 1;
            const price = latest?.close && latest.close > 0 ? latest.close * scale : asset.purchasePrice;
            return sum + price * asset.quantity;
        }, 0);
        if (!hasMarketData || !Number.isFinite(value) || value <= 0) return [];
        const date = `${day}T18:00:00.000Z`;
        const invested = active.reduce((sum, asset) => sum + asset.purchasePrice * asset.quantity, 0);
        return [{
            date,
            value,
            invested,
            source: 'quotes-v2' as const,
            ledgerKey: portfolioLedgerKey(ledger, date),
        }];
    });
}

/** Legacy totals have no provenance and may contain demo data. Never rewrite them. */
export function buildPortfolioAnalyticsHistory(history: PortfolioHistoryPoint[], transactions: PortfolioTransaction[],
    currentSnapshot?: PortfolioHistoryPoint, _assets: Asset[] = []): PortfolioHistoryPoint[] {
    void _assets;
    const points = currentSnapshot?.source === 'quotes-v2' ? [...history, currentSnapshot] : history;
    const timestamps = new Map<number, PortfolioHistoryPoint>();
    for (const point of points) {
        const timestamp = Date.parse(point.date);
        if (point.source !== 'quotes-v2' || point.ledgerKey !== portfolioLedgerKey(transactions, point.date) ||
            !Number.isFinite(timestamp) || !Number.isFinite(point.value) || point.value < 0 ||
            !Number.isFinite(point.invested) || point.invested < 0) continue;
        timestamps.set(timestamp, point);
    }
    return [...timestamps].sort(([a], [b]) => a - b).map(([, point]) => ({ ...point }));
}

export function performanceSeries(history: PortfolioHistoryPoint[], transactions: PortfolioTransaction[], _assets: Asset[] = [], options: { maxGapDays?: number } = {}) {
    void _assets;
    const maxGapDays = options.maxGapDays ?? 16;
    const days = new Map<string, PortfolioHistoryPoint>();
    [...history].sort((a, b) => Date.parse(a.date) - Date.parse(b.date)).forEach(point => {
        if (accountingDay(point.date) && Number.isFinite(point.value) && point.value >= 0) days.set(accountingDay(point.date), point);
    });
    let index = 100;
    let segment = 0;
    return [...days].map(([date, point], i, points) => {
        const previous = points[i - 1];
        const operations = previous ? transactions.filter(t => {
            const day = getTransactionEventDay(t);
            return !day || (day > previous[0] && day <= date);
        }) : [];
        const flow = operations.reduce((sum, t) => sum + transactionFlow(t), 0);
        const gap = previous ? (Date.parse(date) - Date.parse(previous[0])) / DAY_MS : 0;
        const unexplainedCostChange = previous && !operations.length && Math.abs(point.invested - previous[1].invested) > 0.01;
        // ALL-period market candles are weekly; allow a holiday fortnight but
        // still reject monthly/unknown gaps that would fabricate a return.
        const valid = !!previous && previous[1].value > 0 && gap > 0 && gap <= maxGapDays && Number.isFinite(flow) &&
            !unexplainedCostChange && !operations.some(t => !getTransactionEventDay(t) || t.type === 'edit' || t.type === 'delete');
        const intervalReturn = valid ? (point.value - previous[1].value - flow) / previous[1].value * 100 : null;
        if (intervalReturn !== null) index *= 1 + intervalReturn / 100;
        else if (i > 0) { segment++; index = 100; }
        return { ...point, date, timestamp: Date.parse(point.date), dailyReturn: intervalReturn,
            netFlow: flow, cumulativeReturn: index - 100, index, segment };
    });
}

export function calculatePeriodPerformance(series: ReturnType<typeof performanceSeries>, startMs: number,
    endMs = Infinity, maxBaseGapMs = 4 * DAY_MS) {
    const points = series.filter(p => p.timestamp <= endMs);
    const empty = { hasBase: false, baseDate: null as string | null, endDate: points.at(-1)?.date ?? null,
        change: null as number | null, returnPercent: null as number | null, netFlow: 0, observations: 0 };
    const baseIndex = startMs === -Infinity ? 0 : points.reduce((index, p, i) => p.timestamp <= startMs ? i : index, -1);
    const base = points[baseIndex];
    if (!base || (Number.isFinite(startMs) && startMs - base.timestamp > maxBaseGapMs)) return empty;
    const selected = points.slice(baseIndex + 1);
    // Never join returns across an unknown interval.
    if (!selected.length || selected.some(p => p.dailyReturn === null)) return empty;
    const flow = selected.reduce((sum, p) => sum + p.netFlow, 0);
    const growth = selected.reduce((factor, p) => factor * (1 + p.dailyReturn! / 100), 1);
    return { hasBase: true, baseDate: base.date, endDate: points.at(-1)!.date,
        change: points.at(-1)!.value - base.value - flow, returnPercent: (growth - 1) * 100,
        netFlow: flow, observations: selected.length };
}

/** Evolucion!F: (month-end value - net flows - previous close) / previous close.
 * The workbook assumes flows at period end; this is an approximation when trades occur within the month.
 */
export function portfolioMonthlyRows(series: ReturnType<typeof performanceSeries>, now: number) {
    const groups = new Map<string, typeof series>();
    series.forEach(p => groups.set(p.date.slice(0, 7), [...(groups.get(p.date.slice(0, 7)) ?? []), p]));
    let wealth = 1, peak = 1;
    return [...groups].map(([month, points]) => {
        const end = points.at(-1)!;
        const base = series.filter(p => p.date.slice(0, 7) < month).at(-1);
        const startDay = `${month}-01`;
        const lastDay = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).toISOString().slice(0, 10);
        const closed = month < accountingDay(now).slice(0, 7);
        const complete = !!base && base.value > 0 && Date.parse(startDay) - Date.parse(base.date) <= 8 * DAY_MS &&
            (!closed || Date.parse(lastDay) - Date.parse(end.date) <= 8 * DAY_MS) && points.every(p => p.dailyReturn !== null);
        const flow = points.reduce((sum, p) => sum + p.netFlow, 0);
        const monthlyReturn = complete ? (end.value - flow - base!.value) / base!.value * 100 : null;
        if (monthlyReturn !== null) wealth *= 1 + monthlyReturn / 100;
        else { wealth = 1; peak = 1; }
        peak = Math.max(peak, wealth);
        return { month, value: end.value, invested: end.invested, monthlyReturn, closed, complete,
            observations: points.filter(p => p.dailyReturn !== null).length,
            drawdown: monthlyReturn === null ? null : (wealth / peak - 1) * 100 };
    });
}

/** Estadísticas avanzadas!A49/E49/A52/A55/E55, inputs in percentage points. */
export function workbookRiskStats(returns: number[], riskFreeAnnualPct = WORKBOOK_RISK_FREE_ANNUAL_PCT) {
    const n = returns.length;
    const mean = n ? returns.reduce((sum, r) => sum + r, 0) / n : 0;
    const sigma = n > 1 ? Math.sqrt(returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (n - 1)) : 0;
    const excess = mean - riskFreeAnnualPct / 12;
    const downside = n ? Math.sqrt(returns.reduce((sum, r) => sum + Math.min(r - riskFreeAnnualPct / 12, 0) ** 2, 0) / n) : 0;
    let wealth = 1, peak = 1, drawdown = 0;
    returns.forEach(r => { wealth *= 1 + r / 100; peak = Math.max(peak, wealth); drawdown = Math.min(drawdown, (wealth / peak - 1) * 100); });
    return { sharpe: sigma > 0 ? excess / sigma * Math.sqrt(12) : null,
        sortino: downside > 0 ? excess / downside * Math.sqrt(12) : null,
        volatility: n > 1 ? sigma * Math.sqrt(12) : null,
        annualized: n ? (wealth ** (12 / n) - 1) * 100 : null, maxDrawdown: n ? drawdown : null };
}

export function alignedBenchmark(series: ReturnType<typeof performanceSeries>, benchmark: HistoricalDataPoint[]) {
    const market = new Map(benchmark.filter(p => p.close > 0).map(p => [p.date.slice(0, 10), p.close]));
    const common = series.filter(p => market.has(p.date));
    if (common.length < 2 || common[0].segment !== common.at(-1)!.segment) return [];
    return common.map(p => ({ date: p.date, portfolio: (p.index / common[0].index - 1) * 100,
        benchmark: (market.get(p.date)! / market.get(common[0].date)! - 1) * 100 }));
}
