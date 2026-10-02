import type { HistoricalDataPoint, TimePeriod } from '../types/types';

const SIX_HOURS = 6 * 60 * 60 * 1000;
const RETRY_DELAY = 5 * 60 * 1000;
const DAY = 86400000;
type Loader = (symbol: string, period: TimePeriod, signal: AbortSignal) => Promise<HistoricalDataPoint[]>;
type Entry = { points: HistoricalDataPoint[]; refreshed: number; attempted: number };

/** Market data only, memory bounded; no portfolio positions or user identifiers. */
export class DashboardMarketHistoryCache {
    private entries = new Map<string, Entry>();
    private capacity: number;
    constructor(capacity = 64) { this.capacity = Math.max(1, capacity); }

    async load(symbol: string, signal: AbortSignal, loader: Loader, now = Date.now()): Promise<HistoricalDataPoint[]> {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        const key = symbol.trim().toUpperCase();
        const existing = this.entries.get(key);
        if (existing && (now - existing.refreshed < SIX_HOURS || now - existing.attempted < RETRY_DELAY)) return existing.points;
        // Catch up only the recent window while it still overlaps the cache.
        const period = existing?.points.length && now - existing.refreshed < 25 * DAY ? '1M' : 'ALL';
        try {
            const incoming = await loader(key, period, signal);
            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
            if (!incoming.length) throw new Error('No market history');
            const pointTime = (p: HistoricalDataPoint) => p.timestamp ?? Date.parse(p.date);
            const earliest = Math.min(...incoming.map(pointTime).filter(Number.isFinite));
            if (!Number.isFinite(earliest)) throw new Error('Invalid market history dates');
            // Provider corrections replace the overlapping tail, including removed candles.
            const older = period === '1M' ? existing!.points.filter(p => pointTime(p) < earliest) : [];
            const merged = new Map([...older, ...incoming].filter(p => Number.isFinite(pointTime(p))).map(p => [pointTime(p), p]));
            const points = [...merged.values()].sort((a, b) => pointTime(a) - pointTime(b));
            this.entries.delete(key);
            this.entries.set(key, { points, refreshed: now, attempted: now });
            while (this.entries.size > this.capacity) this.entries.delete(this.entries.keys().next().value!);
            return points;
        } catch (error) {
            if (signal.aborted) throw error;
            // Keep a successful history on temporary provider failures and bound retries.
            this.entries.set(key, { points: existing?.points || [], refreshed: existing?.refreshed ?? -Infinity, attempted: now });
            while (this.entries.size > this.capacity) this.entries.delete(this.entries.keys().next().value!);
            return existing?.points || [];
        }
    }
}

export const dashboardMarketHistory = new DashboardMarketHistoryCache();
