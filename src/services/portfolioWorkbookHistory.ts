import { DEFAULT_EVOLUTION_CSV, STORAGE_KEYS } from '../pages/PortfolioCsv/portfolioCsvConstants';
import { readStoredValue } from '../pages/PortfolioCsv/portfolioCsvStorage';
import { parseDailyData, parseEvolution, parsePeriodParts, resolveEvolutionPeriods } from '../pages/PortfolioCsv/portfolioCsvUtils';
import type { DailyPortfolioPoint, EvolutionPoint } from '../pages/PortfolioCsv/portfolioCsvTypes';
import type { PortfolioHistoryPoint, PortfolioTransaction } from '../types/portfolio';

export type WorkbookHistorySource = 'daily' | 'monthly';

export interface WorkbookHistoryBundle {
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
    if (points.length < 2 || monthly.length === 0) return [];
    const dated = points
        .filter((row) => Number.isFinite(Date.parse(row.date)) && row.totalValue >= 0)
        .sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
    if (dated.length < 2) return [];

    const firstDailyTimestamp = Date.parse(dated[0].date);
    const base = monthly.filter((point) => Date.parse(point.date) < firstDailyTimestamp).at(-1);
    if (!base) return [];

    let invested = base.invested;
    const dailyPoints = dated.map((row) => {
        invested += row.netFlow;
        return {
            date: `${row.date}T18:00:00.000Z`,
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

export function buildWorkbookHistory(evolutionRaw: string, dailyRaw: string): WorkbookHistoryBundle {
    const evolution = parseEvolution(evolutionRaw);
    const monthly = normalizeEvolution(evolution);
    const daily = parseDailyData(dailyRaw);
    const dailyCandidate = normalizeDaily(daily, monthly);
    // Evolucion is the authoritative monthly ledger for this screen: it has
    // the month-end valuation and the DCA/withdrawal entered for that month.
    // Datos diarios can contain a partial month or a monthly checkpoint, so it
    // must not replace a complete monthly evolution just because it has more rows.
    const source: WorkbookHistorySource | null = monthly.length >= 2
        ? 'monthly'
        : dailyCandidate.length >= 2
            ? 'daily'
            : null;
    if (!source) return EMPTY_BUNDLE;
    const points = source === 'daily'
        ? [
            ...monthly.filter((point) => Date.parse(point.date) < Date.parse(dailyCandidate[0].date)),
            ...dailyCandidate,
        ]
        : monthly;
    const uniquePoints = [...new Map(points.filter(validNumericPoint).map((point) => [Date.parse(point.date), point])).values()]
        .sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
    const flowTransactions = makeFlowTransactions(uniquePoints, source);
    const totalFlow = flowTransactions.reduce((sum, transaction) => sum + (transaction.type === 'buy' ? transaction.total || 0 : -(transaction.total || 0)), 0);

    return {
        points: uniquePoints,
        flowTransactions,
        source,
        evolutionCount: monthly.length,
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
    const workbookFile = readStoredValue(STORAGE_KEYS.workbookFile, '');
    const isDemoEvolution = workbookFile === 'Demo precargada' && evolutionRaw.trim() === DEFAULT_EVOLUTION_CSV.trim();
    if (isDemoEvolution) return EMPTY_BUNDLE;
    return buildWorkbookHistory(evolutionRaw, dailyRaw);
}
