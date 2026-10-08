import type { Asset, HistoricalDataPoint, PortfolioHistoryPoint, PortfolioTransaction, TimePeriod } from '../types/types';
import { accountingDay } from './portfolioCalendar';
import { portfolioQuoteStatus } from './portfolioQuoteStatus';
export { accountingDay } from './portfolioCalendar';

const DAY_MS = 86400000;
export { WORKBOOK_RISK_FREE_ANNUAL_PCT, workbookRiskStats } from './portfolioRisk';

/**
 * Keep every dashboard period on the same calendar/time basis. The one and
 * seven day ranges are rolling windows; month ranges are rolling calendar
 * months with end-of-month clamping, and YTD starts at local 1 January.
 */
export function getPeriodCutoff(period: TimePeriod, nowMs: number): number | null {
    if (period === 'ALL') return null;
    const now = new Date(nowMs);
    if (period === 'YTD') return new Date(now.getFullYear(), 0, 1).getTime();
    if (period === '1D') return nowMs - DAY_MS;
    if (period === '7D') return nowMs - 7 * DAY_MS;

    const months = period === '3M' ? 3 : 1;
    const day = now.getDate();
    now.setDate(1);
    now.setMonth(now.getMonth() - months);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    now.setDate(Math.min(day, lastDay));
    return now.getTime();
}

export function getTransactionEventDay(transaction: PortfolioTransaction): string {
    // createdAt describes data entry, never an investment date.
    return /^\d{4}-\d{2}-\d{2}$/.test(transaction.date?.slice(0, 10)) ? transaction.date.slice(0, 10) : '';
}

/** Stable order shared with PostgreSQL's UTF-8 C collation, including ties. */
export function comparePortfolioTransactions(a: PortfolioTransaction, b: PortfolioTransaction): number {
    const compare = (left: string, right: string) => {
        if (left === right) return 0;
        const l = Array.from(left), r = Array.from(right);
        for (let i = 0; i < Math.min(l.length, r.length); i++) {
            const difference = l[i].codePointAt(0)! - r[i].codePointAt(0)!;
            if (difference) return difference;
        }
        return l.length - r.length;
    };
    return compare(getTransactionEventDay(a), getTransactionEventDay(b))
        || compare(a.createdAt || '', b.createdAt || '') || compare(a.id || '', b.id || '');
}

function transactionFlow(transaction: PortfolioTransaction): number {
    return transaction.type === 'buy' ? transaction.total ?? NaN : transaction.type === 'sell' ? -(transaction.total ?? NaN) : 0;
}

/** Preserve the user's ledger, including sold positions and correction records. */
export function normalizePortfolioTransactions(assets: Asset[], transactions: PortfolioTransaction[]): PortfolioTransaction[] {
    const result = [...transactions];
    for (const asset of assets) {
        if (transactions.some(transaction => transaction.assetId === asset.id)) continue;
        result.push({ provenance: 'initial-position', id: `position-${asset.id}`, assetId: asset.id, assetSymbol: asset.symbol, assetName: asset.name,
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
    const now = Date.parse(date);
    if (!assets.length || !Number.isFinite(now) || assets.some(a => a.quoteOrigin === 'batch' || portfolioQuoteStatus(a, now).blockers.length > 0)) return null;
    // A recent successful consultation may verify an older fund NAV, but opening
    // the dashboard never counts as a new consultation.
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
    if (!assets.length || assets.some(a => (a.currency && a.currency !== 'EUR') || !Number.isFinite(a.quantity) || a.quantity < 0 || (a.type !== 'cash' && (!Number.isFinite(a.currentPrice) || a.currentPrice! < 0 || !Number.isFinite(a.previousClose) || a.previousClose! <= 0)))) {
        return { change: null as number | null, returnPercent: null as number | null };
    }
    const values = assets.map((asset) => {
        const currentPrice = asset.type === 'cash' ? 1 : asset.currentPrice!;
        const previousPrice = asset.type === 'cash' ? 1 : asset.previousClose!;
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
 * Estimated end-of-day valuations from dated trades and EUR market candles.
 * Missing prices, corrections and unknown currencies cannot produce a complete valuation.
 */
export function createMarketPortfolioHistory(
    assets: Asset[],
    transactions: PortfolioTransaction[],
    assetHistory: Map<string, HistoricalDataPoint[]>,
): PortfolioHistoryPoint[] {
    const ledger = normalizePortfolioTransactions(assets, transactions);
    if (ledger.some(t => !getTransactionEventDay(t))) return [];
    const ids = new Set([...assets.map(a => a.id), ...ledger.map(t => t.assetId)]);
    const positions = [...ids].map(id => ({
        isCash: assets.find(a => a.id === id)?.type === 'cash' || ledger.find(t => t.assetId === id)?.assetType === 'cash',
        operations: ledger.filter(t => t.assetId === id).sort(comparePortfolioTransactions),
        quotes: (assetHistory.get(id) || []).map(p => ({ ...p, day: accountingDay(p.date) })).filter(p => p.day).sort((a, b) => a.day.localeCompare(b.day)),
        operationIndex: 0, quoteIndex: -1, quantity: 0, cost: 0, invalid: false,
    }));
    const firstTrade = ledger.map(getTransactionEventDay).sort()[0];
    const days = [...new Set(positions.flatMap(p => p.quotes.map(q => q.day)))].filter(day => day >= firstTrade).sort();
    return days.flatMap(day => {
        let value = 0, invested = 0, complete = true;
        for (const position of positions) {
            while (position.operationIndex < position.operations.length && getTransactionEventDay(position.operations[position.operationIndex]) <= day) {
                const op = position.operations[position.operationIndex++];
                if (!['buy', 'sell'].includes(op.type) || !Number.isFinite(op.quantity) || op.quantity! <= 0 || !Number.isFinite(op.total)) { position.invalid = true; continue; }
                if (op.type === 'buy') { position.quantity += op.quantity!; position.cost += op.total!; }
                else if (op.quantity! > position.quantity + 1e-8 || position.quantity <= 0) position.invalid = true;
                else {
                    position.cost *= Math.max(0, position.quantity - op.quantity!) / position.quantity;
                    position.quantity = Math.max(0, position.quantity - op.quantity!);
                }
            }
            while (position.quoteIndex + 1 < position.quotes.length && position.quotes[position.quoteIndex + 1].day <= day) position.quoteIndex++;
            if (position.invalid) { complete = false; continue; }
            if (position.quantity <= 1e-8) continue;
            if (position.isCash) { value += position.quantity; invested += position.cost; continue; }
            const quote = position.quotes[position.quoteIndex];
            if (!quote || quote.close <= 0 || quote.currency !== 'EUR' || Date.parse(day) - Date.parse(quote.day) > 8 * DAY_MS) { complete = false; continue; }
            value += quote.close * position.quantity;
            invested += position.cost;
        }
        if (!complete || !Number.isFinite(value) || !Number.isFinite(invested)) return [];
        const date = day + 'T18:00:00.000Z';
        return [{ date, value, invested, source: 'market-estimate' as const, ledgerKey: portfolioLedgerKey(ledger, date) }];
    });
}

/** Legacy totals have no provenance and may contain demo data. Never rewrite them. */
export function buildPortfolioAnalyticsHistory(history: PortfolioHistoryPoint[], transactions: PortfolioTransaction[],
    currentSnapshot?: PortfolioHistoryPoint, _assets: Asset[] = [], includeEstimates = false): PortfolioHistoryPoint[] {
    void _assets;
    const points = currentSnapshot?.source === 'quotes-v2' ? [...history, currentSnapshot] : history;
    const timestamps = new Map<number, PortfolioHistoryPoint>();
    for (const point of points) {
        const timestamp = Date.parse(point.date);
        if ((point.source !== 'quotes-v2' && !(includeEstimates && point.source === 'market-estimate')) || point.ledgerKey !== portfolioLedgerKey(transactions, point.date) ||
            !Number.isFinite(timestamp) || !Number.isFinite(point.value) || point.value < 0 ||
            !Number.isFinite(point.invested) || point.invested < 0) continue;
        if (point.source === 'quotes-v2' || !timestamps.has(timestamp)) timestamps.set(timestamp, point);
    }
    return [...timestamps].sort(([a], [b]) => a - b).map(([, point]) => ({ ...point }));
}

export function performanceSeries(history: PortfolioHistoryPoint[], transactions: PortfolioTransaction[], _assets: Asset[] = [], options: { maxGapDays?: number } = {}) {
    const includesCash = _assets.some(a => a.type === 'cash');
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
        const ambiguousCashFlow = includesCash && operations.some(t => t.assetId !== 'workbook-history' && (t.type === 'buy' || t.type === 'sell'));
        // ALL-period market candles are weekly; allow a holiday fortnight but
        // still reject monthly/unknown gaps that would fabricate a return.
        const intervalGap = point.cadence === 'daily' ? Math.min(maxGapDays, 8) : point.cadence === 'monthly' ? 45 : maxGapDays;
        const valid = !!previous && previous[1].value > 0 && gap > 0 && gap <= intervalGap && Number.isFinite(flow) &&
            !point.returnUnavailable && !unexplainedCostChange && !ambiguousCashFlow && !operations.some(t => !getTransactionEventDay(t) || t.type === 'edit' || t.type === 'delete');
        const rawReturn = valid ? (point.value - previous[1].value - flow) / previous[1].value * 100 : null;
        const intervalReturn = rawReturn !== null && Math.abs(rawReturn) < 1e-10 ? 0 : rawReturn;
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
        change: null as number | null, returnPercent: null as number | null, netFlow: 0, observations: 0, missingIntervals: 0 };
    const baseIndex = startMs === -Infinity ? 0 : points.reduce((index, p, i) => p.timestamp <= startMs ? i : index, -1);
    const base = points[baseIndex];
    if (!base || (Number.isFinite(startMs) && startMs - base.timestamp > maxBaseGapMs)) return empty;
    const selected = points.slice(baseIndex + 1);
    // Never join returns across an unknown interval.
    const flow = selected.reduce((sum, p) => sum + p.netFlow, 0);
    const missingIntervals = selected.filter(p => p.dailyReturn === null).length;
    const metadata = { ...empty, hasBase: true, baseDate: base.date, netFlow: flow,
        observations: selected.length - missingIntervals, missingIntervals };
    if (!selected.length || missingIntervals) return metadata;
    const growth = selected.reduce((factor, p) => factor * (1 + p.dailyReturn! / 100), 1);
    return { hasBase: true, baseDate: base.date, endDate: points.at(-1)!.date,
        change: points.at(-1)!.value - base.value - flow, returnPercent: (growth - 1) * 100,
        netFlow: flow, observations: selected.length, missingIntervals: 0 };
}

/** Shared real base and coverage for summary, evolution and benchmark. */
export function selectPortfolioPeriod(series: ReturnType<typeof performanceSeries>, period: TimePeriod, now: number) {
    const cutoff = getPeriodCutoff(period, now);
    const available = series.filter(p => p.timestamp <= now);
    const previous = cutoff === null ? available[0] : available.filter(p => p.timestamp <= cutoff).at(-1);
    const following = cutoff === null ? undefined : available.find(p => p.timestamp > cutoff);
    const nearbyBase = cutoff === null ? previous : previous && cutoff - previous.timestamp <= 4 * DAY_MS ? previous
        : following && following.timestamp - cutoff <= 4 * DAY_MS ? following : undefined;
    // Imported monthly closes cannot provide a price on every rolling cutoff.
    // Use the preceding real close for month ranges, with explicit dates;
    // never relax daily/weekly windows or fabricate an observation at cutoff.
    const monthlyBase = !nearbyBase && cutoff !== null && (period === '1M' || period === '3M')
        && previous?.cadence === 'monthly' && cutoff - previous.timestamp <= 31 * DAY_MS;
    const base = nearbyBase || (monthlyBase ? previous : undefined);
    const points = base ? available.filter(p => p.timestamp >= base.timestamp) : available.filter(p => cutoff === null || p.timestamp >= cutoff);
    const performance = calculatePeriodPerformance(available, base?.timestamp ?? cutoff ?? -Infinity, now, period === 'ALL' ? Infinity : 4 * DAY_MS);
    // A new unresolved operation must not erase the verified year-to-date
    // history. Keep the same year-opening base, stop before the first unknown
    // interval, and expose that date so callers label this as the latest known
    // YTD, never as a return through the current valuation.
    const firstUnknown = points.findIndex((point, index) => index > 0 && point.dailyReturn === null);
    if (period === 'YTD' && base && performance.hasBase && performance.returnPercent === null && firstUnknown > 1) {
        const verifiedPoints = points.slice(0, firstUnknown);
        const verified = calculatePeriodPerformance(available, base.timestamp, verifiedPoints.at(-1)!.timestamp);
        if (verified.returnPercent !== null) {
            return { points: verifiedPoints, performance: verified, cutoff, monthlyBase: false, incompleteSince: points[firstUnknown].date };
        }
    }
    return { points, performance, cutoff, monthlyBase: !!monthlyBase, incompleteSince: null };
}

export interface BenchmarkPeriodPerformance {
    portfolioReturn: number | null;
    benchmarkReturn: number | null;
}

export interface AccumulatedBenchmarkPoint {
    date: string;
    portfolioAccumPct: number;
    benchmarkAccumPct: number;
}

function historicalPointTimestamp(point: HistoricalDataPoint): number {
    if (Number.isFinite(point.timestamp)) return point.timestamp!;
    const parsed = Date.parse(point.date);
    return Number.isFinite(parsed) ? parsed : NaN;
}

/**
 * Calculates the two KPI returns independently. Portfolio performance must
 * use its flow-aware series, while the benchmark uses the closest available
 * market close at/before the period start (or its first observation when the
 * provider does not return a preceding close, as is common for YTD).
 */
export function calculateBenchmarkPeriodPerformance(
    series: ReturnType<typeof performanceSeries>,
    benchmark: HistoricalDataPoint[],
    startMs: number,
    endMs = Infinity,
    maxBaseGapMs = 4 * DAY_MS,
): BenchmarkPeriodPerformance {
    const period = calculatePeriodPerformance(series, startMs, endMs, maxBaseGapMs);
    if (!period.hasBase || period.returnPercent === null) return { portfolioReturn: null, benchmarkReturn: null };
    const selected = series.filter(p => p.timestamp <= endMs && p.date >= period.baseDate!);
    const line = alignedBenchmark(selected, benchmark.filter(p => historicalPointTimestamp(p) <= endMs));
    const last = line.at(-1);
    return { portfolioReturn: last?.portfolio ?? null, benchmarkReturn: last?.benchmark ?? null };
}

/**
 * Re-bases imported accumulated benchmark values at the requested period.
 * When the workbook has no row before the cutoff, zero is the only honest
 * baseline: using January's accumulated value as the baseline would erase
 * the whole first month from YTD.
 */
export function normalizeAccumulatedBenchmark(
    points: AccumulatedBenchmarkPoint[],
    cutoff: number | null,
    endMs = Infinity,
) {
    const available = points
        .filter((point) => {
            const timestamp = Date.parse(point.date);
            return Number.isFinite(timestamp)
                && timestamp <= endMs
                && Number.isFinite(point.portfolioAccumPct)
                && Number.isFinite(point.benchmarkAccumPct);
        })
        .sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
    if (available.length < 2) return [];

    const base = cutoff === null
        ? available[0]
        : available.filter((point) => Date.parse(point.date) <= cutoff).at(-1);
    const selected = cutoff === null
        ? available
        : base
            ? [base, ...available.filter((point) => Date.parse(point.date) > cutoff)]
            : available;
    if (selected.length < 2) return [];

    const basePortfolio = base ? 1 + base.portfolioAccumPct / 100 : 1;
    const baseBenchmark = base ? 1 + base.benchmarkAccumPct / 100 : 1;
    if (basePortfolio <= 0 || baseBenchmark <= 0) return [];

    return selected.map((point) => ({
        date: point.date.slice(0, 10),
        portfolio: ((1 + point.portfolioAccumPct / 100) / basePortfolio - 1) * 100,
        benchmark: ((1 + point.benchmarkAccumPct / 100) / baseBenchmark - 1) * 100,
    }));
}

/** Imported monthly comparison supplies the index only. Match actual workbook
 * closing days; a monthly close must not become a quote on a later daily snapshot. */
export function alignImportedBenchmark(series: ReturnType<typeof performanceSeries>, points: AccumulatedBenchmarkPoint[]) {
    const market: HistoricalDataPoint[] = points.filter(p => Number.isFinite(Date.parse(p.date)) && Number.isFinite(p.benchmarkAccumPct) && p.benchmarkAccumPct > -100)
        .map(p => ({ date: p.date, close: 1 + p.benchmarkAccumPct / 100, open: 1, high: 1, low: 1, volume: 0, currency: 'EUR' }))
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    if (market.length < 2) return [];
    const closingDays = new Set(market.map(point => accountingDay(point.date)));
    const covered = series.filter(point => closingDays.has(accountingDay(point.date)));
    return alignedBenchmark(covered, market);
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
        const monthlyReturn = complete ? (points.reduce((growth, p) => growth * (1 + p.dailyReturn! / 100), 1) - 1) * 100 : null;
        if (monthlyReturn !== null) wealth *= 1 + monthlyReturn / 100;
        else { wealth = 1; peak = 1; }
        peak = Math.max(peak, wealth);
        return { month, value: end.value, invested: end.invested, monthlyReturn, closed, complete,
            observations: points.filter(p => p.dailyReturn !== null).length,
            monthlyIntervals: points.filter(p => p.dailyReturn !== null && p.cadence === 'monthly').length,
            dailyIntervals: points.filter(p => p.dailyReturn !== null && p.cadence === 'daily').length,
            otherIntervals: points.filter(p => p.dailyReturn !== null && !p.cadence).length,
            drawdown: monthlyReturn === null ? null : (wealth / peak - 1) * 100 };
    });
}

export function alignedBenchmark(series: ReturnType<typeof performanceSeries>, benchmark: HistoricalDataPoint[]) {
    const market = benchmark
        .map((point) => ({
            point,
            timestamp: historicalPointTimestamp(point),
            day: Number.isFinite(point.timestamp) ? accountingDay(point.timestamp!) : accountingDay(point.date),
        }))
        .filter(({ point, timestamp, day }) => point.close > 0 && Number.isFinite(timestamp) && !!day)
        .sort((left, right) => left.timestamp - right.timestamp);
    const latestMarketDay = market.at(-1)?.day;
    if (!latestMarketDay) return [];

    const findMarketPoint = (portfolioTimestamp: number, portfolioDay: string, cadence?: 'daily' | 'monthly') => {
        const sameDay = market.filter((candidate) => candidate.day === portfolioDay).at(-1);
        // Imported closes have an artificial 18:00 timestamp, not an intraday
        // valuation. Match their accounting day; real quote snapshots retain
        // the strict timestamp constraint against future market observations.
        if (sameDay && (cadence || sameDay.timestamp <= portfolioTimestamp)) return sameDay;
        const preceding = market.filter((candidate) => candidate.timestamp <= portfolioTimestamp).at(-1);
        if (preceding && portfolioTimestamp - preceding.timestamp <= 4 * DAY_MS) return preceding;
        if (preceding) return undefined;

        // Yahoo's chart range usually exposes the close immediately before
        // the first candle. Use it as a synthetic baseline so 1D/YTD can
        // still draw a two-point comparison when the range starts after the
        // portfolio's baseline observation.
        const first = market[0];
        return first && first.timestamp - portfolioTimestamp <= 4 * DAY_MS && Number.isFinite(first.point.previousClose) && first.point.previousClose! > 0
            ? { ...first, timestamp: portfolioTimestamp, day: portfolioDay, point: { ...first.point, close: first.point.previousClose! } }
            : undefined;
    };

    const common = series.flatMap((portfolioPoint) => {
        const portfolioTimestamp = portfolioPoint.timestamp;
        const portfolioDay = accountingDay(portfolioTimestamp);
        // Prior closes can bridge holidays within the observed market range,
        // but must never extend the benchmark beyond its last actual close.
        if (portfolioDay > latestMarketDay) return [];
        const marketPoint = findMarketPoint(portfolioTimestamp, portfolioDay, portfolioPoint.cadence);
        return marketPoint ? [{ portfolioPoint, marketPoint }] : [];
    });
    // Missing market observations limit coverage, not the validity of the
    // portfolio index. Never bridge an unknown portfolio return, however.
    if (common.length < 2 || common[0].portfolioPoint.segment !== common.at(-1)!.portfolioPoint.segment) return [];

    const first = common[0];
    return common.map(({ portfolioPoint, marketPoint }) => ({
        date: portfolioPoint.date,
        portfolio: (portfolioPoint.index / first.portfolioPoint.index - 1) * 100,
        benchmark: (marketPoint.point.close / first.marketPoint.point.close - 1) * 100,
    }));
}

/** Prefer coverage of the requested period, never just the provider priority. */
export function chooseBenchmarkLine(series: ReturnType<typeof performanceSeries>, automatic: ReturnType<typeof alignedBenchmark>, imported: ReturnType<typeof alignedBenchmark>) {
    const start = series[0]?.date;
    const end = series.at(-1)?.date;
    const score = (line: ReturnType<typeof alignedBenchmark>) => line.length < 2 ? -1
        : (Number(line[0].date === start) + Number(line.at(-1)!.date === end)) * 1e15
            + Date.parse(line.at(-1)!.date) - Date.parse(line[0].date);
    return score(imported) > score(automatic) ? imported : automatic;
}
