import type { HistoricalDataPoint, PortfolioHistoryPoint, PortfolioTransaction } from '../types/types';
import { portfolioStorage } from './portfolioCloudStorage';
import { accountingDay } from './portfolioCalendar';

export const HISTORY_ARCHIVE_KEY = 'freewallet_history_archive_v1';
export interface HistoricalCashFlow {
    id: string;
    date: string;
    amount: number;
    precision: 'day' | 'month';
    source: string;
}
export interface HistoricalBenchmarkReturn {
    source?: string;
    date: string;
    portfolioAccumPct: number;
    benchmarkAccumPct: number;
}
export interface HistoricalBenchmarkNav {
    date: string;
    nav: number;
    currency: 'EUR';
    isin: string;
    source: string;
}
/** Independent of files, column names and the import screen. */
export interface PortfolioHistoryArchive {
    version: 1;
    identity: string;
    label: string;
    importedAt: string;
    linkedAssetIds: string[];
    valuations: PortfolioHistoryPoint[];
    cashFlows: HistoricalCashFlow[];
    benchmarkReturns: HistoricalBenchmarkReturn[];
    benchmarkNavs: HistoricalBenchmarkNav[];
    riskFreeAnnualPct: number | null;
    evolutionCount: number;
    dailyCount: number;
}
export interface PortfolioHistoricalBundle {
    identity?: string;
    points: PortfolioHistoryPoint[];
    flowTransactions: PortfolioTransaction[];
    source: 'daily' | 'monthly' | 'mixed' | null;
    evolutionCount: number;
    dailyCount: number;
    dcaCount: number;
    totalFlow: number;
    startDate: string | null;
    endDate: string | null;
}
export function emptyHistoryArchive(): PortfolioHistoryArchive {
    return { version: 1, identity: '', label: '', importedAt: '', linkedAssetIds: [], valuations: [], cashFlows: [], benchmarkReturns: [], benchmarkNavs: [], riskFreeAnnualPct: null, evolutionCount: 0, dailyCount: 0 };
}
const finite = (value: unknown, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const dated = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value)) && /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value);
export function validateHistoryArchive(value: unknown): asserts value is PortfolioHistoryArchive {
    if (!value || typeof value !== 'object') throw new Error('Histórico estructurado no válido.');
    const a = value as PortfolioHistoryArchive;
    if (a.version !== 1 || typeof a.identity !== 'string' || typeof a.label !== 'string' || typeof a.importedAt !== 'string'
        || !Array.isArray(a.linkedAssetIds) || a.linkedAssetIds.length > 21000 || a.linkedAssetIds.some(id => typeof id !== 'string' || !id || id.length > 200)
        || !finite(a.evolutionCount, 0, 50000) || !finite(a.dailyCount, 0, 50000)
        || (a.riskFreeAnnualPct !== null && !finite(a.riskFreeAnnualPct, -100, 100))) throw new Error('Metadatos del histórico no válidos.');
    for (const key of ['valuations', 'cashFlows', 'benchmarkReturns', 'benchmarkNavs'] as const) {
        if (!Array.isArray(a[key]) || a[key].length > 50000) throw new Error('El histórico supera el límite de registros.');
    }
    if(a.cashFlows.some(flow=>historicalFlowEffectiveDay(flow)!==flow.date))throw new Error('Precisión de fecha del flujo no válida.');
    if (a.valuations.some(p => !dated(p.date) || !finite(p.value, 0, 1e12) || !finite(p.invested, 0, 1e12) || !['daily', 'monthly'].includes(p.cadence ?? '') || (p.returnUnavailable !== undefined && typeof p.returnUnavailable !== 'boolean'))
        || a.cashFlows.some(p => !dated(p.date) || !/^\d{4}-\d{2}-\d{2}$/.test(p.date) || typeof p.id !== 'string' || !p.id || p.id.length > 200 || !finite(p.amount, -1e12, 1e12) || !['day', 'month'].includes(p.precision) || typeof p.source !== 'string')
        || a.benchmarkReturns.some(p => !dated(p.date) || !finite(p.portfolioAccumPct, -100, 1e9) || !finite(p.benchmarkAccumPct, -100, 1e9))
        || a.benchmarkNavs.some(p => !dated(p.date) || !finite(p.nav, Number.MIN_VALUE, 1e12) || p.currency !== 'EUR' || !/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(p.isin) || typeof p.source !== 'string')) throw new Error('Observaciones del histórico no válidas.');
    for (const [rows, key] of [[a.valuations, 'date'], [a.cashFlows, 'id'], [a.benchmarkReturns, 'date']] as const) {
        const ids = rows.map(row => {const id=(row as unknown as Record<string, unknown>)[key];return key==='date' ? Date.parse(id as string) : id;});
        if (new Set(ids).size !== ids.length) throw new Error('El histórico contiene registros duplicados.');
    }
    if(new Set(a.benchmarkNavs.map(p=>p.isin+':'+Date.parse(p.date))).size!==a.benchmarkNavs.length)throw new Error('El histórico contiene NAV duplicados.');
}
let cachedKey = '';
let cachedArchive: PortfolioHistoryArchive | null = null;
export function readPortfolioHistoryArchive(): PortfolioHistoryArchive {
    const raw = portfolioStorage.getItem(HISTORY_ARCHIVE_KEY);
    if (!raw) return emptyHistoryArchive();
    const key = `${portfolioStorage.epoch}:${raw}`;
    if (cachedArchive && key === cachedKey) return cachedArchive;
    const archive: unknown = JSON.parse(raw);
    validateHistoryArchive(archive);
    cachedKey = key; cachedArchive = archive;
    return archive;
}
export function historicalBundle(archive: PortfolioHistoryArchive, now: number): PortfolioHistoricalBundle {
    const points = archive.valuations.filter(p => Date.parse(p.date) <= now).sort((a,b) => Date.parse(a.date)-Date.parse(b.date));
    const flowTransactions: PortfolioTransaction[] = archive.cashFlows.map(flow => ({
        id: flow.id, assetId: 'historical-cash-flow', assetSymbol: 'FLOW', assetName: flow.amount >= 0 ? 'Aportación' : 'Retirada', assetType: 'fund', type: flow.amount >= 0 ? 'buy' : 'sell',
        date: flow.date, total: Math.abs(flow.amount), createdAt: flow.date, notes: `${flow.source} · precisión ${flow.precision}`,
    }));
    const monthly = points.some(p => p.cadence === 'monthly'), daily = points.some(p => p.cadence === 'daily');
    return { identity: archive.identity, points, flowTransactions, source: monthly && daily ? 'mixed' : monthly ? 'monthly' : daily ? 'daily' : null,
        evolutionCount: archive.evolutionCount, dailyCount: archive.dailyCount, dcaCount: flowTransactions.length,
        totalFlow: archive.cashFlows.reduce((sum,p) => sum+p.amount,0), startDate: points[0]?.date ?? null, endDate: points.at(-1)?.date ?? null };
}
export function archiveBenchmarkHistory(archive: PortfolioHistoryArchive, isin: string): HistoricalDataPoint[] {
    return archive.benchmarkNavs.filter(p => p.isin === isin).map(p => ({ date:p.date,close:p.nav,open:p.nav,high:p.nav,low:p.nav,volume:0,currency:p.currency }));
}
export function historyScopeMatches(archive: PortfolioHistoryArchive, assets: Array<{id:string}>, transactions: PortfolioTransaction[]): boolean {
    return archive.linkedAssetIds.length > 0 && transactions.some(t => archive.linkedAssetIds.includes(t.assetId))
        && assets.every(a => archive.linkedAssetIds.includes(a.id) || transactions.some(t => t.assetId === a.id && t.type === 'buy' && t.provenance !== 'initial-position' && !/^(bootstrap|position)-/.test(t.id)));
}
export function linkPortfolioHistory(assetIds: string[]): void {
    const archive = readPortfolioHistoryArchive();
    portfolioStorage.setItem(HISTORY_ARCHIVE_KEY, JSON.stringify({ ...archive, linkedAssetIds: [...new Set(assetIds)] }));
}
/** Month-level flows keep a month-level effective close, never an invented day. */
export function historicalFlowEffectiveDay(flow: HistoricalCashFlow): string {
    if (flow.precision === 'day') return accountingDay(flow.date);
    const [year, month] = flow.date.split('-').map(Number);
    return new Date(Date.UTC(year, month, 0)).toISOString().slice(0,10);
}
