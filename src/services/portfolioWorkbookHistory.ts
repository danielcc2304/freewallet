import { DEFAULT_COMPARISON_CSV, DEFAULT_EVOLUTION_CSV, STORAGE_KEYS } from '../pages/PortfolioCsv/portfolioCsvConstants';
import { readStoredValue } from '../pages/PortfolioCsv/portfolioCsvStorage';
import { parseBenchmarkComparison, parseDailyData, parseDateLabel, parseEvolution, parseMovements, parsePeriodParts, resolveEvolutionPeriods } from '../pages/PortfolioCsv/portfolioCsvUtils';
import type { BenchmarkComparisonPoint, DailyPortfolioPoint, EvolutionPoint } from '../pages/PortfolioCsv/portfolioCsvTypes';
import type { PortfolioHistoryPoint, PortfolioTransaction } from '../types/portfolio';

export type WorkbookHistorySource = 'daily' | 'monthly' | 'mixed';

export interface WorkbookHistoryBundle {
    identity?: string;
    points: PortfolioHistoryPoint[];
    flowTransactions: PortfolioTransaction[];
    source: WorkbookHistorySource | null;
    evolutionCount: number;
    dailyCount: number;
    dcaCount: number;
    totalFlow: number;
    startDate: string | null;
    endDate: string | null;
}

export interface WorkbookBenchmarkPoint {
    date: string;
    portfolioAccumPct: number;
    benchmarkAccumPct: number;
}

type NormalizedWorkbookPoint = PortfolioHistoryPoint & { flowDate: string; netFlow: number };

const EMPTY_BUNDLE: WorkbookHistoryBundle = {
    points: [],
    flowTransactions: [],
    source: null,
    evolutionCount: 0,
    dailyCount: 0,
    dcaCount: 0,
    totalFlow: 0,
    startDate: null,
    endDate: null,
};

let cachedReadKey = '';
let cachedReadBundle: WorkbookHistoryBundle | null = null;
let cachedBenchmarkKey = '';
let cachedBenchmark: WorkbookBenchmarkPoint[] = [];

function monthEndDate(period: string): string | null {
    const parsed = parsePeriodParts(period);
    if (!parsed || parsed.year === undefined) return null;
    return new Date(Date.UTC(parsed.year, parsed.monthIndex + 1, 0, 18)).toISOString();
}

function validNumericPoint(point: PortfolioHistoryPoint): boolean {
    return Number.isFinite(Date.parse(point.date))
        && Number.isFinite(point.value)
        && point.value >= 0
        && Number.isFinite(point.invested)
        && point.invested >= 0;
}

function normalizeEvolution(points: EvolutionPoint[]): NormalizedWorkbookPoint[] {
    const periodMap = resolveEvolutionPeriods(points);
    const dated = points.flatMap((row, index) => {
        const resolvedPeriod = periodMap.get(row.period) || row.period;
        const date = monthEndDate(resolvedPeriod);
        if (!date || !Number.isFinite(row.totalValue) || row.totalValue < 0) return [];
        return [{ row, date, index }];
    }).sort((left, right) => Date.parse(left.date) - Date.parse(right.date) || left.index - right.index);

    if (!dated.length) return [];
    const baseInitial = Math.max(0, dated[0].row.initialCapital);
    let cumulativeContribution = 0;
    const pointsByTimestamp = new Map<number, NormalizedWorkbookPoint>();

    dated.forEach(({ row, date }) => {
        cumulativeContribution += row.monthlyContribution;
        const point: NormalizedWorkbookPoint = {
            cadence: 'monthly',
            date,
            flowDate: date.slice(0, 10),
            value: row.totalValue,
            invested: Math.max(0, baseInitial + cumulativeContribution),
            netFlow: row.monthlyContribution,
        };
        if (validNumericPoint(point)) pointsByTimestamp.set(Date.parse(date), point);
    });

    return [...pointsByTimestamp.values()].sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
}

function normalizeDaily(points: DailyPortfolioPoint[], monthly: NormalizedWorkbookPoint[]): NormalizedWorkbookPoint[] {
    if (points.length < 1 || monthly.length === 0) return [];
    const dated = points
        .filter((row) => Number.isFinite(Date.parse(row.date)) && row.totalValue >= 0)
        .sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
    if (dated.length < 1) return [];

    const firstDailyTimestamp = Date.parse(dated[0].date);
    const base = monthly.filter((point) => Date.parse(point.date) < firstDailyTimestamp).at(-1);
    if (!base) return [];

    let invested = base.invested;
    const dailyPoints = dated.map((row) => {
        invested += row.netFlow;
        return {
            date: `${row.date}T18:00:00.000Z`,
            cadence: 'daily',
            flowDate: row.date,
            value: row.totalValue,
            invested: Math.max(0, invested),
            netFlow: row.netFlow,
        } satisfies NormalizedWorkbookPoint;
    });
    return dailyPoints.filter(validNumericPoint);
}

function makeFlowTransactions(points: NormalizedWorkbookPoint[], source: WorkbookHistorySource): PortfolioTransaction[] {
    return points.flatMap((point, index) => {
        const amount = point.netFlow;
        if (Math.abs(amount) <= 0.01) return [];
        return [{
            id: `workbook-${source === 'daily' ? 'daily-flow' : 'dca'}-${point.flowDate}-${index}`,
            assetId: 'workbook-history',
            assetSymbol: 'DCA',
            assetName: amount >= 0 ? 'Aportación desde Excel' : 'Retirada desde Excel',
            assetType: 'fund',
            type: amount >= 0 ? 'buy' : 'sell',
            date: point.flowDate,
            total: Math.abs(amount),
            notes: source === 'daily'
                ? 'Flujo importado de la hoja Datos diarios'
                : 'Aportación importada de la hoja Evolucion',
            createdAt: point.date,
        } satisfies PortfolioTransaction];
    });
}

export function buildWorkbookHistory(evolutionRaw: string, dailyRaw: string, movementsRaw = '', now = Date.now()): WorkbookHistoryBundle {
    const evolution = parseEvolution(evolutionRaw);
    const monthly = normalizeEvolution(evolution);
    const daily = parseDailyData(dailyRaw);
    const movements = parseMovements(movementsRaw);
    const currentMonth = new Date(now).toISOString().slice(0, 7);
    const closedMonthly = monthly.filter(p => p.date.slice(0, 7) < currentMonth);
    const lastClose = closedMonthly.at(-1);
    // Monthly closes remain authoritative; append actual daily observations,
    // never the synthetic monthly checkpoints from Datos diarios.
    const continuation = daily.filter(p => !/hist[oó]rico mensual/i.test(p.dataType)
        && (!lastClose || p.date > lastClose.flowDate) && Date.parse(`${p.date}T18:00:00Z`) <= now);
    if (!/flujo\s*neto|net\s*flow/i.test(dailyRaw)) {
        let previousDate = lastClose?.flowDate || '';
        for (const row of [...continuation].sort((a, b) => a.date.localeCompare(b.date))) {
            row.netFlow = movements.reduce((sum, movement) => {
                const date = movement.exactDate ? parseDateLabel(movement.date) : null;
                return date && date > previousDate && date <= row.date ? sum + movement.amount : sum;
            }, 0);
            previousDate = row.date;
        }
    }
    const dailyCandidate = normalizeDaily(continuation, closedMonthly);
    for (const point of dailyCandidate) {
        const inMonth = movements.filter(m => (parseDateLabel(m.date) || m.date).slice(0, 7) === point.flowDate.slice(0, 7));
        // A monthly aggregate cannot be assigned a made-up daily date.
        point.returnUnavailable = inMonth.some(m => !m.exactDate);
    }
    // Never replace a completed monthly close with a partial daily checkpoint.
    const source: WorkbookHistorySource | null = dailyCandidate.length >= 1
        ? 'mixed'
        : monthly.length >= 2
        ? 'monthly'
        : null;
    if (!source) return EMPTY_BUNDLE;
    const points = source === 'mixed'
        ? [
            ...monthly.filter((point) => Date.parse(point.date) < Date.parse(dailyCandidate[0].date)),
            ...dailyCandidate,
        ]
        : monthly;
    const uniquePoints = [...new Map(points.filter(validNumericPoint).map((point) => [Date.parse(point.date), point])).values()]
        .sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
    const flowTransactions = makeFlowTransactions(uniquePoints, source).flatMap(transaction => {
        const point = uniquePoints.find(p => p.flowDate === transaction.date)!;
        if (!closedMonthly.includes(point)) return [transaction];
        const monthMovements = movements.filter(m => (parseDateLabel(m.date) || m.date).slice(0, 7) === point.flowDate.slice(0, 7));
        const total = monthMovements.reduce((sum, m) => sum + m.amount, 0);
        if (!monthMovements.length || Math.abs(total - point.netFlow) > 0.01 || monthMovements.some(m => !m.exactDate || !parseDateLabel(m.date))) return [transaction];
        return monthMovements.map((m, index) => ({ ...transaction, id: `${transaction.id}-movement-${index}`,
            date: parseDateLabel(m.date)!, type: m.amount >= 0 ? 'buy' as const : 'sell' as const,
            total: Math.abs(m.amount), notes: m.concept || 'Movimiento importado con fecha exacta' }));
    });
    const totalFlow = flowTransactions.reduce((sum, transaction) => sum + (transaction.type === 'buy' ? transaction.total || 0 : -(transaction.total || 0)), 0);

    return {
        points: uniquePoints,
        flowTransactions,
        source,
        evolutionCount: source === 'mixed' ? closedMonthly.length : monthly.length,
        dailyCount: daily.length,
        dcaCount: flowTransactions.length,
        totalFlow,
        startDate: uniquePoints[0]?.date || null,
        endDate: uniquePoints.at(-1)?.date || null,
    };
}

export function readWorkbookHistory(): WorkbookHistoryBundle {
    const evolutionRaw = readStoredValue(STORAGE_KEYS.evolutionRaw, '');
    const dailyRaw = readStoredValue(STORAGE_KEYS.dailyRaw, '');
    const movementsRaw = readStoredValue(STORAGE_KEYS.movementsRaw, '');
    const workbookFile = readStoredValue(STORAGE_KEYS.workbookFile, '');
    const readKey = `${workbookFile}\u0000${evolutionRaw}\u0000${dailyRaw}\u0000${movementsRaw}\u0000${new Date().toISOString().slice(0, 10)}`;
    if (cachedReadBundle && cachedReadKey === readKey) return cachedReadBundle;

    const isDemoEvolution = workbookFile === 'Demo precargada' && evolutionRaw.trim() === DEFAULT_EVOLUTION_CSV.trim();
    const bundle = isDemoEvolution ? EMPTY_BUNDLE : buildWorkbookHistory(evolutionRaw, dailyRaw, movementsRaw);
    let hash = 2166136261;
    for (const char of workbookFile + '\u0000' + evolutionRaw + '\u0000' + dailyRaw + '\u0000' + movementsRaw) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    bundle.identity = String(hash >>> 0);
    cachedReadKey = readKey;
    cachedReadBundle = bundle;
    return bundle;
}

function benchmarkDate(point: BenchmarkComparisonPoint): string | null {
    const parsed = parsePeriodParts(point.period) || parsePeriodParts(`${point.month} ${point.year}`);
    if (!parsed || parsed.year === undefined) return null;
    return new Date(Date.UTC(parsed.year, parsed.monthIndex + 1, 0, 18)).toISOString();
}

export function buildWorkbookBenchmarkHistory(comparisonRaw: string): WorkbookBenchmarkPoint[] {
    const points = parseBenchmarkComparison(comparisonRaw)
        .flatMap((point) => {
            const date = benchmarkDate(point);
            return date && Number.isFinite(point.portfolioAccumPct) && Number.isFinite(point.benchmarkAccumPct)
                ? [{ date, portfolioAccumPct: point.portfolioAccumPct, benchmarkAccumPct: point.benchmarkAccumPct }]
                : [];
        });
    return [...new Map(points.map((point) => [Date.parse(point.date), point])).values()]
        .sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
}

export function readWorkbookBenchmarkHistory(): WorkbookBenchmarkPoint[] {
    const comparisonRaw = readStoredValue(STORAGE_KEYS.comparisonRaw, '');
    const workbookFile = readStoredValue(STORAGE_KEYS.workbookFile, '');
    const readKey = `${workbookFile}\u0000${comparisonRaw}`;
    if (cachedBenchmarkKey === readKey) return cachedBenchmark;

    if (workbookFile === 'Demo precargada' && comparisonRaw.trim() === DEFAULT_COMPARISON_CSV.trim()) {
        cachedBenchmarkKey = readKey;
        cachedBenchmark = [];
        return cachedBenchmark;
    }

    const points = buildWorkbookBenchmarkHistory(comparisonRaw);
    cachedBenchmarkKey = readKey;
    cachedBenchmark = points;
    return cachedBenchmark;
}
