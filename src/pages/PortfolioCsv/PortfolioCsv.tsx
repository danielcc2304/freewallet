import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    CalendarClock,
    Download,
    FileSpreadsheet,
    Layers3,
    RefreshCw,
    TrendingUp,
    Upload,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import * as XLSX from 'xlsx';
import './PortfolioCsv.css';

type HoldingCategory = 'equity' | 'fixedIncome' | 'cash' | 'alternatives' | 'other';
type HoldingBucket = 'longTerm' | 'income' | 'liquidity' | 'goal';
type Holding = { asset: string; amount: number; weight: number; category: HoldingCategory };
type HoldingControl = Holding & { categoryOverride?: HoldingCategory; bucket: HoldingBucket };
type EvolutionPoint = {
    period: string;
    totalValue: number;
    initialCapital: number;
    monthlyContribution: number;
    profit: number;
    monthlyReturnPct: number;
    twrYtdPct: number;
};
type EnrichedEvolutionPoint = EvolutionPoint & { investedValue: number; gainVsInvested: number; drawdownPct: number };
type PieRow = { name: string; value: number; weight: number; color: string };
type ParsedPeriod = { monthKey: string; monthIndex: number; year?: number };

const STORAGE_KEYS = {
    holdingsRaw: 'freewallet_portfolio_csv_holdings_raw',
    evolutionRaw: 'freewallet_portfolio_csv_evolution_raw',
    workbookFile: 'freewallet_portfolio_csv_workbook_file',
    updatedAt: 'freewallet_portfolio_csv_updated_at',
    categoryOverrides: 'freewallet_portfolio_csv_category_overrides',
    bucketTargets: 'freewallet_portfolio_csv_bucket_targets',
} as const;

const CATEGORY_LABELS: Record<HoldingCategory, string> = {
    equity: 'Renta variable',
    fixedIncome: 'Renta fija',
    cash: 'Liquidez',
    alternatives: 'Alternativos',
    other: 'Otros',
};

const BUCKET_LABELS: Record<HoldingBucket, string> = {
    longTerm: 'Largo plazo',
    income: 'Medio plazo',
    liquidity: 'Liquidez',
    goal: 'Objetivo',
};

const DEFAULT_BUCKET_TARGETS: Record<HoldingBucket, number> = {
    longTerm: 55,
    income: 20,
    liquidity: 10,
    goal: 15,
};

const DEFAULT_HOLDINGS_CSV = `Activo,Importe (EUR),Peso %
"ETF Global Equity","3.200,00EUR","32,00%"
"ETF USA Quality","1.800,00EUR","18,00%"
"ETF Europe Dividend","1.250,00EUR","12,50%"
"ETF Emerging Markets","950,00EUR","9,50%"
"Global Bond Fund","1.450,00EUR","14,50%"
"Short Duration Bond","550,00EUR","5,50%"
"Gold ETC","300,00EUR","3,00%"
"Cash Reserve","500,00EUR","5,00%"
TOTAL,"10.000,00EUR",`;

const DEFAULT_EVOLUTION_CSV = `Mes,Valor Total,Capital Inicial,Capital Aportado,Plusvalias,% mens.,TWR YTD
Mar,8200,8000,200,0,"0,000","0,000"
Abr,8450,8200,200,50,"0,610","0,610"
May,8615,8450,200,-35,"-0,414","0,193"
Jun,8890,8615,200,75,"0,871","1,066"
Jul,9120,8890,200,30,"0,337","1,407"
Ago,9345,9120,200,25,"0,274","1,685"
Sep,9580,9345,200,35,"0,375","2,066"
Oct,9790,9580,200,10,"0,104","2,173"
Nov,9650,9790,200,-340,"-3,473","-1,375"
Dic,9885,9650,200,35,"0,363","-1,017"
Ene,10090,9885,200,5,"0,051","0,033"
Feb,10180,10090,0,90,"0,892","0,925"
"Mar 2026",10000,10180,0,-180,"-1,768","-0,859"`;

const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#84cc16', '#64748b'];
const MONTH_KEYS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;

function readStoredValue(key: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    try {
        return localStorage.getItem(key) || fallback;
    } catch {
        return fallback;
    }
}

function readStoredMap<T extends string>(key: string): Record<string, T> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) as Record<string, T> : {};
    } catch {
        return {};
    }
}

function readStoredNumberMap(key: string, fallback: Record<string, number>): Record<string, number> {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? { ...fallback, ...(JSON.parse(raw) as Record<string, number>) } : fallback;
    } catch {
        return fallback;
    }
}

function parseLooseNumber(value: string): number {
    const normalized = value
        .replace(/\uFEFF/g, '')
        .replace(/EUR/gi, '')
        .replace(/%/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function parseFlexibleNumber(value: string): number {
    const sanitized = value
        .replace(/\uFEFF/g, '')
        .replace(/EUR/gi, '')
        .replace(/%/g, '')
        .replace(/\s/g, '')
        .replace(/[^0-9,.-]/g, '');
    const lastComma = sanitized.lastIndexOf(',');
    const lastDot = sanitized.lastIndexOf('.');
    let normalized = sanitized;

    if (lastComma >= 0 && lastDot >= 0) {
        const decimalSeparator = lastComma > lastDot ? ',' : '.';
        const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
        normalized = sanitized.replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '');
        if (decimalSeparator === ',') normalized = normalized.replace(',', '.');
    } else if (lastComma >= 0) {
        const decimalDigits = sanitized.length - lastComma - 1;
        normalized = decimalDigits === 3 ? sanitized.replace(/,/g, '') : sanitized.replace(',', '.');
    } else if (lastDot >= 0) {
        const decimalDigits = sanitized.length - lastDot - 1;
        normalized = decimalDigits === 3 ? sanitized.replace(/\./g, '') : sanitized;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : parseLooseNumber(value);
}

function parsePercentNumber(value: string): number {
    const sanitized = value
        .replace(/\uFEFF/g, '')
        .replace(/%/g, '')
        .replace(/\s/g, '')
        .replace(/[^0-9,.-]/g, '');
    if (!sanitized) return 0;

    const normalized = sanitized.includes(',')
        ? sanitized.replace(/\./g, '').replace(',', '.')
        : sanitized;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : parseLooseNumber(value);
}

function parseCsvRows(raw: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;
    const normalized = raw.replace(/\uFEFF/g, '');

    for (let i = 0; i < normalized.length; i += 1) {
        const ch = normalized[i];
        if (ch === '"') {
            if (inQuotes && normalized[i + 1] === '"') {
                cell += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (ch === ',' && !inQuotes) {
            row.push(cell.trim());
            cell = '';
            continue;
        }
        if ((ch === '\n' || ch === '\r') && !inQuotes) {
            if (ch === '\r' && normalized[i + 1] === '\n') i += 1;
            row.push(cell.trim());
            if (row.some((v) => v.length > 0)) rows.push(row);
            row = [];
            cell = '';
            continue;
        }
        cell += ch;
    }
    row.push(cell.trim());
    if (row.some((v) => v.length > 0)) rows.push(row);
    return rows;
}

function normalizeSheetName(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/gi, '')
        .toLowerCase();
}

function classifyAsset(asset: string): HoldingCategory {
    const name = asset.toLowerCase();
    if (name.includes('renta fija') || name.includes('credit') || name.includes('short duration') || name.includes('bond')) return 'fixedIncome';
    if (name.includes('revolut') || name.includes('cash') || name.includes('liquidez')) return 'cash';
    if (name.includes('reits') || name.includes('commodity') || name.includes('gold') || name.includes('crypto')) return 'alternatives';
    if (name.includes('world') || name.includes('emerging') || name.includes('china') || name.includes('value') || name.includes('nextil') || name.includes('amper') || name.includes('obrascon')) return 'equity';
    return 'other';
}

function defaultBucketForCategory(category: HoldingCategory): HoldingBucket {
    if (category === 'cash') return 'liquidity';
    if (category === 'fixedIncome') return 'income';
    return 'longTerm';
}

function parseHoldings(raw: string): Holding[] {
    const rows = parseCsvRows(raw);
    if (rows.length <= 1) return [];
    const base = rows
        .slice(1)
        .map((row) => ({ asset: (row[0] || '').replace(/"/g, '').trim(), amount: parseFlexibleNumber(row[1] || ''), weight: parseFlexibleNumber(row[2] || '') }))
        .filter((row) => row.asset && row.asset.toUpperCase() !== 'TOTAL' && row.amount > 0);
    const totalAmount = base.reduce((acc, row) => acc + row.amount, 0);
    return base
        .map((row) => ({ asset: row.asset, amount: row.amount, weight: row.weight > 0 ? row.weight : (totalAmount > 0 ? (row.amount / totalAmount) * 100 : 0), category: classifyAsset(row.asset) }))
        .sort((a, b) => b.amount - a.amount);
}

function isMonthLabel(value: string): boolean {
    return /^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/i.test(value.trim());
}

function parsePeriodParts(value: string): ParsedPeriod | null {
    const match = value.trim().toLowerCase().match(/^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)(?:\s+(\d{2,4}))?$/i);
    if (!match) return null;
    const monthKey = match[1].toLowerCase();
    const monthIndex = MONTH_KEYS.indexOf(monthKey as typeof MONTH_KEYS[number]);
    if (monthIndex < 0) return null;
    const rawYear = match[2];
    const year = rawYear ? (rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear)) : undefined;
    return { monthKey, monthIndex, year: Number.isFinite(year) ? year : undefined };
}

function formatPeriodLabel(period: string, compactYear = false): string {
    const parsed = parsePeriodParts(period);
    if (!parsed) return period;
    const month = parsed.monthKey.charAt(0).toUpperCase() + parsed.monthKey.slice(1);
    if (!parsed.year) return month;
    return compactYear ? `${month} ${String(parsed.year).slice(-2)}` : `${month} ${parsed.year}`;
}

function resolveEvolutionPeriods(points: EvolutionPoint[]): Map<string, string> {
    const parsed = points.map((point) => parsePeriodParts(point.period));
    const explicitYearIndex = parsed.findIndex((item) => item?.year !== undefined);
    if (explicitYearIndex === -1) {
        return new Map(points.map((point) => [point.period, formatPeriodLabel(point.period)]));
    }

    const resolved = parsed.map((item) => (item ? { ...item } : null));

    let currentYear = resolved[explicitYearIndex]?.year;
    let currentMonth = resolved[explicitYearIndex]?.monthIndex;
    for (let i = explicitYearIndex - 1; i >= 0; i -= 1) {
        const item = resolved[i];
        if (!item || currentYear === undefined || currentMonth === undefined) continue;
        if (item.year !== undefined) {
            currentYear = item.year;
            currentMonth = item.monthIndex;
            continue;
        }
        if (item.monthIndex > currentMonth) currentYear -= 1;
        item.year = currentYear;
        currentMonth = item.monthIndex;
    }

    currentYear = resolved[explicitYearIndex]?.year;
    currentMonth = resolved[explicitYearIndex]?.monthIndex;
    for (let i = explicitYearIndex + 1; i < resolved.length; i += 1) {
        const item = resolved[i];
        if (!item || currentYear === undefined || currentMonth === undefined) continue;
        if (item.year !== undefined) {
            currentYear = item.year;
            currentMonth = item.monthIndex;
            continue;
        }
        if (item.monthIndex < currentMonth) currentYear += 1;
        item.year = currentYear;
        currentMonth = item.monthIndex;
    }

    return new Map(points.map((point, index) => {
        const item = resolved[index];
        if (!item) return [point.period, point.period];
        const month = item.monthKey.charAt(0).toUpperCase() + item.monthKey.slice(1);
        return [point.period, item.year ? `${month} ${item.year}` : month];
    }));
}

function parseEvolution(raw: string): EvolutionPoint[] {
    const rows = parseCsvRows(raw);
    if (rows.length <= 1) return [];
    const points: EvolutionPoint[] = [];
    let currentYear: number | undefined;

    for (const row of rows.slice(1)) {
        const rawPeriod = (row[0] || '').replace(/"/g, '').trim();
        if (!rawPeriod) continue;

        const yearSectionMatch = rawPeriod.match(/^(20\d{2})$/);
        if (yearSectionMatch) {
            currentYear = Number(yearSectionMatch[1]);
            continue;
        }

        const ytdYearMatch = rawPeriod.match(/^ytd\s+(20\d{2})$/i);
        if (ytdYearMatch) {
            currentYear = Number(ytdYearMatch[1]);
            continue;
        }

        if (/^mes$/i.test(rawPeriod)) continue;
        if (!isMonthLabel(rawPeriod)) continue;

        const period = /\d{2,4}$/.test(rawPeriod) || currentYear === undefined
            ? rawPeriod
            : `${rawPeriod} ${currentYear}`;

        let monthlyReturnRaw = row[5] || '';
        let twrRaw = row[6] || '';
        if (row.length >= 9) {
            monthlyReturnRaw = `${row[5] || ''},${row[6] || ''}`;
            twrRaw = `${row[7] || ''},${row[8] || ''}`;
        } else if (row.length === 8) {
            twrRaw = `${row[6] || ''},${row[7] || ''}`;
        }

        const point = {
            period,
            totalValue: parseFlexibleNumber(row[1] || ''),
            initialCapital: parseFlexibleNumber(row[2] || ''),
            monthlyContribution: parseFlexibleNumber(row[3] || ''),
            profit: parseFlexibleNumber(row[4] || ''),
            monthlyReturnPct: parsePercentNumber(monthlyReturnRaw),
            twrYtdPct: parsePercentNumber(twrRaw),
        };

        if (point.totalValue > 0) points.push(point);
    }

    return points;
}

function formatCurrency(value: number): string {
    return value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatPct(value: number): string {
    return `${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
    const variance = values.reduce((acc, value) => acc + ((value - mean) ** 2), 0) / values.length;
    return Math.sqrt(variance);
}

export function PortfolioCsv() {
    const [holdingsRaw, setHoldingsRaw] = useState(() => readStoredValue(STORAGE_KEYS.holdingsRaw, DEFAULT_HOLDINGS_CSV));
    const [evolutionRaw, setEvolutionRaw] = useState(() => readStoredValue(STORAGE_KEYS.evolutionRaw, DEFAULT_EVOLUTION_CSV));
    const [workbookFileLabel, setWorkbookFileLabel] = useState(() => readStoredValue(STORAGE_KEYS.workbookFile, 'Demo precargada'));
    const [updatedAt, setUpdatedAt] = useState(() => readStoredValue(STORAGE_KEYS.updatedAt, ''));
    const [categoryOverrides, setCategoryOverrides] = useState<Record<string, HoldingCategory>>(() => readStoredMap<HoldingCategory>(STORAGE_KEYS.categoryOverrides));
    const [bucketTargets, setBucketTargets] = useState<Record<string, number>>(() => readStoredNumberMap(STORAGE_KEYS.bucketTargets, DEFAULT_BUCKET_TARGETS));
    const [error, setError] = useState('');
    const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 700 : false));

    const workbookInputRef = useRef<HTMLInputElement | null>(null);

    const deferredHoldingsRaw = useDeferredValue(holdingsRaw);
    const deferredEvolutionRaw = useDeferredValue(evolutionRaw);

    const holdings = useMemo<HoldingControl[]>(() => parseHoldings(deferredHoldingsRaw).map((holding) => {
        const categoryOverride = categoryOverrides[holding.asset];
        const category = categoryOverride || holding.category;
        return {
            ...holding,
            category,
            categoryOverride,
            bucket: defaultBucketForCategory(category),
        };
    }), [categoryOverrides, deferredHoldingsRaw]);
    const evolutionBase = useMemo(() => parseEvolution(deferredEvolutionRaw), [deferredEvolutionRaw]);

    const evolution = useMemo<EnrichedEvolutionPoint[]>(() => {
        if (evolutionBase.length === 0) return [];
        const baseInitial = evolutionBase[0].initialCapital;
        let cumulativeContribution = 0;
        let peak = evolutionBase[0].totalValue;
        return evolutionBase.map((row) => {
            cumulativeContribution += row.monthlyContribution;
            const investedValue = baseInitial + cumulativeContribution;
            peak = Math.max(peak, row.totalValue);
            return { ...row, investedValue, gainVsInvested: row.totalValue - investedValue, drawdownPct: peak > 0 ? ((row.totalValue - peak) / peak) * 100 : 0 };
        });
    }, [evolutionBase]);
    const resolvedPeriodMap = useMemo(() => resolveEvolutionPeriods(evolutionBase), [evolutionBase]);
    const mobilePeriodMap = useMemo(() => {
        const monthCounts = evolutionBase.reduce<Record<string, number>>((acc, point) => {
            const parsed = parsePeriodParts(point.period);
            const key = parsed?.monthKey ?? point.period;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        return new Map(evolutionBase.map((point) => {
            const parsed = parsePeriodParts(point.period);
            if (!parsed) return [point.period, point.period];
            const resolvedLabel = resolvedPeriodMap.get(point.period) || formatPeriodLabel(point.period);
            const needsYear = monthCounts[parsed.monthKey] > 1 || /\d{2,4}/.test(point.period);
            return [point.period, needsYear ? formatPeriodLabel(resolvedLabel, true) : formatPeriodLabel(resolvedLabel)];
        }));
    }, [evolutionBase, resolvedPeriodMap]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.holdingsRaw, holdingsRaw);
            localStorage.setItem(STORAGE_KEYS.evolutionRaw, evolutionRaw);
            localStorage.setItem(STORAGE_KEYS.workbookFile, workbookFileLabel);
            localStorage.setItem(STORAGE_KEYS.updatedAt, updatedAt);
            localStorage.setItem(STORAGE_KEYS.categoryOverrides, JSON.stringify(categoryOverrides));
            localStorage.setItem(STORAGE_KEYS.bucketTargets, JSON.stringify(bucketTargets));
        } catch {
            // localStorage puede fallar en modo privado o por limites de cuota.
        }
    }, [bucketTargets, categoryOverrides, holdingsRaw, evolutionRaw, workbookFileLabel, updatedAt]);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 700);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const totalPortfolioValue = useMemo(() => holdings.reduce((acc, row) => acc + row.amount, 0), [holdings]);
    const topConcentration = useMemo(() => holdings.slice(0, 3).reduce((acc, row) => acc + row.weight, 0), [holdings]);
    const effectivePositions = useMemo(() => {
        const hhi = holdings.reduce((acc, row) => acc + ((row.weight / 100) ** 2), 0);
        return hhi > 0 ? 1 / hhi : 0;
    }, [holdings]);

    const categoryAllocationData = useMemo(() => {
        const byCategory: Record<HoldingCategory, number> = { equity: 0, fixedIncome: 0, cash: 0, alternatives: 0, other: 0 };
        holdings.forEach((row) => { byCategory[row.category] += row.weight; });
        return [
            { name: 'Renta variable', weight: byCategory.equity },
            { name: 'Renta fija', weight: byCategory.fixedIncome },
            { name: 'Liquidez', weight: byCategory.cash },
            { name: 'Alternativos', weight: byCategory.alternatives },
            { name: 'Otros', weight: byCategory.other },
        ];
    }, [holdings]);

    const bucketAllocationData = useMemo(() => {
        const byBucket: Record<HoldingBucket, number> = { longTerm: 0, income: 0, liquidity: 0, goal: 0 };
        holdings.forEach((row) => { byBucket[row.bucket] += row.weight; });
        return [
            { name: BUCKET_LABELS.longTerm, weight: byBucket.longTerm },
            { name: BUCKET_LABELS.income, weight: byBucket.income },
            { name: BUCKET_LABELS.liquidity, weight: byBucket.liquidity },
            { name: BUCKET_LABELS.goal, weight: byBucket.goal },
        ];
    }, [holdings]);

    const bucketPlanData = useMemo(() => {
        return (Object.keys(BUCKET_LABELS) as HoldingBucket[]).map((bucket) => {
            const currentWeight = holdings
                .filter((holding) => holding.bucket === bucket)
                .reduce((acc, holding) => acc + holding.weight, 0);
            const targetWeight = Number(bucketTargets[bucket] ?? 0);
            const deviation = currentWeight - targetWeight;
            const amountDelta = (deviation / 100) * totalPortfolioValue;
            return {
                bucket,
                label: BUCKET_LABELS[bucket],
                currentWeight,
                targetWeight,
                deviation,
                amountDelta,
            };
        });
    }, [bucketTargets, holdings, totalPortfolioValue]);

    const compositionLegendData = useMemo<PieRow[]>(() => {
        const baseRows = holdings.length <= 8
            ? holdings.map((row) => ({ name: row.asset, value: row.amount, weight: row.weight }))
            : [
                ...holdings.slice(0, 8).map((row) => ({ name: row.asset, value: row.amount, weight: row.weight })),
                { name: 'Otros activos', value: holdings.slice(8).reduce((acc, row) => acc + row.amount, 0), weight: holdings.slice(8).reduce((acc, row) => acc + row.weight, 0) },
            ];
        return baseRows.map((row, index) => ({ ...row, color: PIE_COLORS[index % PIE_COLORS.length] }));
    }, [holdings]);

    const latestEvolution = evolution.length > 0 ? evolution[evolution.length - 1] : null;
    const bestMonth = evolution.length > 0 ? [...evolution].sort((a, b) => b.monthlyReturnPct - a.monthlyReturnPct)[0] : null;
    const worstMonth = evolution.length > 0 ? [...evolution].sort((a, b) => a.monthlyReturnPct - b.monthlyReturnPct)[0] : null;
    const avgMonthlyReturn = useMemo(() => (evolution.length ? evolution.reduce((acc, row) => acc + row.monthlyReturnPct, 0) / evolution.length : 0), [evolution]);
    const monthlyVolatility = useMemo(() => standardDeviation(evolution.map((row) => row.monthlyReturnPct)), [evolution]);
    const positiveMonthRatio = useMemo(() => {
        if (evolution.length === 0) return 0;
        const positives = evolution.filter((row) => row.monthlyReturnPct > 0).length;
        return (positives / evolution.length) * 100;
    }, [evolution]);
    const projection12m = useMemo(() => {
        if (!latestEvolution) return 0;
        const monthlyContribution = evolution.length ? evolution.reduce((acc, row) => acc + row.monthlyContribution, 0) / evolution.length : 0;
        const rate = avgMonthlyReturn / 100;
        if (Math.abs(rate) < 0.0001) return latestEvolution.totalValue + (monthlyContribution * 12);
        const futureValue = latestEvolution.totalValue * ((1 + rate) ** 12);
        const annuity = monthlyContribution * ((((1 + rate) ** 12) - 1) / rate);
        return futureValue + annuity;
    }, [latestEvolution, evolution, avgMonthlyReturn]);

    const concentrationLevel = topConcentration >= 55 ? 'Alta' : topConcentration >= 40 ? 'Media' : 'Baja';
    const totalTargetWeight = useMemo(
        () => (Object.keys(BUCKET_LABELS) as HoldingBucket[]).reduce((acc, bucket) => acc + Number(bucketTargets[bucket] ?? 0), 0),
        [bucketTargets]
    );

    const riskChecks = useMemo(() => {
        const maxDrawdown = evolution.length ? Math.min(...evolution.map((row) => row.drawdownPct)) : 0;
        const liquidityWeight = holdings.filter((row) => row.category === 'cash').reduce((acc, row) => acc + row.weight, 0);
        const uncategorizedWeight = holdings.filter((row) => row.category === 'other').reduce((acc, row) => acc + row.weight, 0);
        const topHolding = holdings[0];
        return [
            {
                title: 'Concentración principal',
                value: topHolding ? formatPct(topHolding.weight) : 'N/D',
                tone: topHolding && topHolding.weight > 20 ? 'warn' : 'good',
                detail: topHolding ? `${topHolding.asset} es la mayor posicion.` : 'Sin posiciones cargadas.',
            },
            {
                title: 'Top 3 agregado',
                value: formatPct(topConcentration),
                tone: topConcentration >= 55 ? 'warn' : 'good',
                detail: topConcentration >= 55 ? 'La cartera depende mucho de tres posiciones.' : 'La concentración está contenida.',
            },
            {
                title: 'Liquidez en cartera',
                value: formatPct(liquidityWeight),
                tone: liquidityWeight < 2 ? 'warn' : 'good',
                detail: liquidityWeight < 2 ? 'El peso de liquidez es muy bajo.' : 'Hay reserva visible dentro del CSV.',
            },
            {
                title: 'Drawdown máximo',
                value: formatPct(maxDrawdown),
                tone: maxDrawdown <= -15 ? 'warn' : 'good',
                detail: maxDrawdown <= -15 ? 'La serie registra caidas relevantes.' : 'El drawdown historico es moderado.',
            },
            {
                title: 'Meses positivos',
                value: formatPct(positiveMonthRatio),
                tone: positiveMonthRatio < 55 ? 'warn' : 'good',
                detail: positiveMonthRatio < 55 ? 'La consistencia mensual es mejorable.' : 'Predominan los meses positivos.',
            },
            {
                title: 'Peso sin clasificar',
                value: formatPct(uncategorizedWeight),
                tone: uncategorizedWeight > 10 ? 'warn' : 'good',
                detail: uncategorizedWeight > 10 ? 'Conviene revisar categorías manualmente.' : 'La clasificación actual cubre casi toda la cartera.',
            },
        ] as const;
    }, [evolution, holdings, positiveMonthRatio, topConcentration]);

    const setHoldingCategoryOverride = (asset: string, category: HoldingCategory) => {
        setCategoryOverrides((current) => {
            const next = { ...current };
            const inferred = classifyAsset(asset);
            if (category === inferred) {
                delete next[asset];
            } else {
                next[asset] = category;
            }
            return next;
        });
    };

    const setBucketTarget = (bucket: HoldingBucket, value: string) => {
        const parsed = Number(value);
        setBucketTargets((current) => ({
            ...current,
            [bucket]: Number.isFinite(parsed) ? parsed : 0,
        }));
    };

    const onUploadWorkbook = async (file: File) => {
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const normalizedNames = workbook.SheetNames.reduce<Record<string, string>>((acc, sheetName) => {
                acc[normalizeSheetName(sheetName)] = sheetName;
                return acc;
            }, {});

            const holdingsSheetName = normalizedNames.cartera;
            const evolutionSheetName = normalizedNames.evolucion || normalizedNames.evolution;

            if (!holdingsSheetName || !evolutionSheetName) {
                setError('El Excel debe incluir las hojas "Cartera" y "Evolución".');
                return;
            }

            const holdingsText = XLSX.utils.sheet_to_csv(workbook.Sheets[holdingsSheetName]);
            const evolutionText = XLSX.utils.sheet_to_csv(workbook.Sheets[evolutionSheetName]);

            if (parseHoldings(holdingsText).length === 0) {
                setError('No pude interpretar la hoja de cartera del Excel. Revisa cabeceras y formato.');
                return;
            }
            if (parseEvolution(evolutionText).length === 0) {
                setError('No pude interpretar la hoja de evolucion del Excel. Revisa cabeceras y formato.');
                return;
            }

            setHoldingsRaw(holdingsText);
            setEvolutionRaw(evolutionText);
            setWorkbookFileLabel(file.name);
            setUpdatedAt(new Date().toISOString());
            setError('');
        } catch {
            setError('Error leyendo el Excel. Sube un .xlsx valido con hojas de cartera y evolucion.');
        }
    };

    const resetToDemo = () => {
        setHoldingsRaw(DEFAULT_HOLDINGS_CSV);
        setEvolutionRaw(DEFAULT_EVOLUTION_CSV);
        setWorkbookFileLabel('Demo precargada');
        setUpdatedAt(new Date().toISOString());
        setError('');
    };

    const downloadWorkbookTemplate = () => {
        const workbook = XLSX.utils.book_new();
        const holdingsSheet = XLSX.utils.aoa_to_sheet(parseCsvRows(DEFAULT_HOLDINGS_CSV));
        const evolutionSheet = XLSX.utils.aoa_to_sheet(parseCsvRows(DEFAULT_EVOLUTION_CSV));

        XLSX.utils.book_append_sheet(workbook, holdingsSheet, 'Cartera');
        XLSX.utils.book_append_sheet(workbook, evolutionSheet, 'Evolución');
        XLSX.writeFile(workbook, 'plantilla-cartera-evolucion.xlsx');
    };

    const tooltipTheme = {
        contentStyle: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: '10px' },
        labelStyle: { color: 'var(--text-primary)', fontWeight: 600 },
        itemStyle: { color: 'var(--text-secondary)' },
    };

    const legendFormatter = (value: string) => (<span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{value}</span>);
    const formatPeriodTick = (value: string) => {
        if (isMobile) return mobilePeriodMap.get(value) || value;
        return resolvedPeriodMap.get(value) || formatPeriodLabel(value);
    };
    const mobileChartMargin = isMobile
        ? { top: 8, right: 2, left: 0, bottom: 34 }
        : { top: 8, right: 10, left: 0, bottom: 18 };
    const mobilePinnedTooltipPosition = isMobile ? { x: 12, y: 12 } : undefined;

    const SeriesTooltip = ({
        active,
        payload,
        label,
        valueType,
    }: {
        active?: boolean;
        payload?: Array<{ name?: string; value?: number | string; color?: string }>;
        label?: string;
        valueType: 'currency' | 'percent';
    }) => {
        if (!active || !payload || payload.length === 0) return null;

        const formatValue = (raw: number | string | undefined) => {
            const value = Number(raw ?? 0);
            return valueType === 'currency' ? formatCurrency(value) : formatPct(value);
        };
        const formattedLabel = label ? (resolvedPeriodMap.get(label) || formatPeriodLabel(label)) : '';

        return (
            <div className="portfolio-csv-tooltip">
                <div className="portfolio-csv-tooltip__label">{formattedLabel}</div>
                <div className="portfolio-csv-tooltip__rows">
                    {payload.map((entry, index) => (
                        <div key={`${entry.name}-${index}`} className="portfolio-csv-tooltip__row">
                            <span
                                className="portfolio-csv-tooltip__dot"
                                style={{ backgroundColor: entry.color || 'var(--text-muted)' }}
                            />
                            <span className="portfolio-csv-tooltip__name">{entry.name || 'Serie'}</span>
                            <strong className="portfolio-csv-tooltip__value">{formatValue(entry.value)}</strong>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="portfolio-csv-page">
            <header className="portfolio-csv-hero">
                <div className="portfolio-csv-hero__badge">Portfolio CSV</div>
                <h1>Análisis de cartera con Excel único</h1>
                <p>Sube un Excel con las hojas `Cartera` y `Evolución` para ver concentración, rendimiento, drawdown y tendencia del patrimonio.</p>
            </header>

            <section className="portfolio-csv-upload">
                <article className="portfolio-csv-upload__card portfolio-csv-upload__card--utility">
                    <h3><FileSpreadsheet size={18} /> Excel único</h3>
                    <p>Sube un archivo `.xlsx` con hojas `Cartera` y `Evolución`, o descarga una plantilla lista para rellenar.</p>
                    <div className="portfolio-csv-upload__actions">
                        <button type="button" className="portfolio-csv-btn" onClick={() => workbookInputRef.current?.click()}>
                            <Upload size={16} /> Subir Excel
                        </button>
                        <button type="button" className="portfolio-csv-btn portfolio-csv-btn--ghost" onClick={downloadWorkbookTemplate}>
                            <Download size={16} /> Descargar plantilla
                        </button>
                        <button type="button" className="portfolio-csv-btn" onClick={resetToDemo}>
                            <RefreshCw size={16} /> Restaurar demo
                        </button>
                    </div>
                    <input
                        ref={workbookInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        hidden
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void onUploadWorkbook(file);
                            event.target.value = '';
                        }}
                    />
                    <small>{workbookFileLabel}</small>
                    <small>Última actualización: {updatedAt ? new Date(updatedAt).toLocaleString('es-ES') : 'sin registrar'}</small>
                </article>
            </section>

            {error && (
                <div className="portfolio-csv-error">
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <section className="portfolio-csv-kpis">
                <article className="portfolio-csv-kpi"><span>Patrimonio actual</span><strong>{formatCurrency(totalPortfolioValue)}</strong></article>
                <article className="portfolio-csv-kpi"><span>Top 3 concentración</span><strong>{formatPct(topConcentration)}</strong></article>
                <article className="portfolio-csv-kpi"><span>Diversificación efectiva</span><strong>{effectivePositions.toFixed(1)} posiciones</strong></article>
                <article className="portfolio-csv-kpi"><span>Meses positivos</span><strong>{formatPct(positiveMonthRatio)}</strong></article>
                <article className="portfolio-csv-kpi"><span>Retorno medio mensual</span><strong>{formatPct(avgMonthlyReturn)}</strong></article>
                <article className="portfolio-csv-kpi"><span>Volatilidad mensual</span><strong>{formatPct(monthlyVolatility)}</strong></article>
            </section>

            <section className="portfolio-csv-grid">
                <article className="portfolio-csv-card">
                    <h2><Layers3 size={18} /> Composición por activos</h2>
                    <p>Distribución de pesos por posición.</p>
                    <div className="portfolio-csv-chart portfolio-csv-chart--composition">
                        <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                            <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                                <Pie data={compositionLegendData} dataKey="weight" nameKey="name" outerRadius={isMobile ? 86 : 108} innerRadius={isMobile ? 48 : 58} paddingAngle={2}>
                                    {compositionLegendData.map((row) => (
                                        <Cell key={row.name} fill={row.color} />
                                    ))}
                                </Pie>
                                <Tooltip {...tooltipTheme} formatter={(value: number | string | undefined) => formatPct(Number(value ?? 0))} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="portfolio-csv-pie-legend">
                        {compositionLegendData.map((row) => (
                            <div key={row.name} className="portfolio-csv-pie-legend__item">
                                <span className="portfolio-csv-pie-legend__dot" style={{ backgroundColor: row.color }} />
                                <span className="portfolio-csv-pie-legend__name" title={row.name}>{row.name}</span>
                                <span className="portfolio-csv-pie-legend__weight">{formatPct(row.weight)}</span>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="portfolio-csv-card">
                    <h2><TrendingUp size={18} /> Asignación por bloques</h2>
                    <p>Peso agregado por tipo de activo.</p>
                    <div className="portfolio-csv-chart">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={categoryAllocationData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                    tickFormatter={(value) => (isMobile ? value.replace('Renta ', 'R. ') : value)}
                                    axisLine={false}
                                    tickLine={false}
                                    interval="preserveStartEnd"
                                    minTickGap={14}
                                />
                                <YAxis tickFormatter={(value) => `${value}%`} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip {...tooltipTheme} formatter={(value: number | string | undefined) => formatPct(Number(value ?? 0))} />
                                <Bar dataKey="weight" fill="var(--accent-primary)" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </article>
            </section>

            <section className="portfolio-csv-grid">
                <article className="portfolio-csv-card">
                    <h2><CalendarClock size={18} /> Valor total vs capital invertido</h2>
                    <p>Separa el efecto mercado del efecto aportaciones.</p>
                    <div className="portfolio-csv-chart">
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={evolution}>
                                <defs>
                                    <linearGradient id="portfolioCsvTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="portfolioCsvInvested" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="period" tickFormatter={formatPeriodTick} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={isMobile ? 22 : 12} />
                                <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<SeriesTooltip valueType="currency" />} position={mobilePinnedTooltipPosition} />
                                <Area type="monotone" dataKey="totalValue" name="Valor total" stroke="#10b981" fill="url(#portfolioCsvTotal)" strokeWidth={2.3} />
                                <Area type="monotone" dataKey="investedValue" name="Capital invertido" stroke="#3b82f6" fill="url(#portfolioCsvInvested)" strokeWidth={2.1} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </article>

                <article className="portfolio-csv-card">
                    <h2><TrendingUp size={18} /> Drivers del mes: aportado vs plusvalía</h2>
                    <p>Desglose mensual entre aportacion y resultado de mercado.</p>
                    <div className="portfolio-csv-chart">
                        <ResponsiveContainer width="100%" height={320}>
                            <ComposedChart data={evolution} margin={mobileChartMargin}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="period" tickFormatter={formatPeriodTick} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={isMobile ? 22 : 12} />
                                <YAxis
                                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                                    tick={{ fill: 'var(--text-secondary)', fontSize: isMobile ? 11 : 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={6}
                                    width={isMobile ? 40 : 48}
                                />
                                <Tooltip content={<SeriesTooltip valueType="currency" />} />
                                <Legend formatter={legendFormatter} wrapperStyle={{ color: 'var(--text-secondary)' }} />
                                <Bar dataKey="monthlyContribution" name="Aportación" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="profit" name="Plusvalia" fill="#10b981" radius={[6, 6, 0, 0]} />
                                <Line type="monotone" dataKey="gainVsInvested" name="Ganancia acumulada" stroke="#f59e0b" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </article>
            </section>

            <section className="portfolio-csv-grid">
                <article className="portfolio-csv-card">
                    <h2><AlertTriangle size={18} /> Mapa de riesgo: retorno mensual y drawdown</h2>
                    <p>Compara retorno mensual, drawdown y TWR YTD.</p>
                    <div className="portfolio-csv-chart portfolio-csv-chart--risk-map">
                        <ResponsiveContainer width="100%" height={320}>
                            <ComposedChart
                                data={evolution}
                                margin={mobileChartMargin}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis
                                    dataKey="period"
                                    tickFormatter={formatPeriodTick}
                                    tick={{ fill: 'var(--text-secondary)', fontSize: isMobile ? 11 : 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval="preserveStartEnd"
                                    minTickGap={isMobile ? 28 : 14}
                                />
                                <YAxis
                                    yAxisId="left"
                                    tickFormatter={(value) => `${value}%`}
                                    tick={{ fill: 'var(--text-secondary)', fontSize: isMobile ? 11 : 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={6}
                                    width={isMobile ? 36 : 44}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tickFormatter={(value) => `${value}%`}
                                    tick={{ fill: 'var(--text-secondary)', fontSize: isMobile ? 11 : 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={6}
                                    width={isMobile ? 36 : 44}
                                />
                                <Tooltip content={<SeriesTooltip valueType="percent" />} />
                                <Legend formatter={legendFormatter} wrapperStyle={{ color: 'var(--text-secondary)' }} />
                                <Bar yAxisId="left" dataKey="monthlyReturnPct" name="% Mensual" fill="#10b981" radius={[6, 6, 0, 0]} barSize={isMobile ? 10 : 18} />
                                <Line yAxisId="right" type="monotone" dataKey="drawdownPct" name="Drawdown %" stroke="#ef4444" strokeWidth={2.1} dot={false} />
                                <Line yAxisId="right" type="monotone" dataKey="twrYtdPct" name="TWR YTD %" stroke="#8b5cf6" strokeWidth={2.1} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </article>

                <article className="portfolio-csv-card">
                    <h2><Layers3 size={18} /> Resumen mensual</h2>
                    <ul className="portfolio-csv-insights">
                        <li><span>Concentracion Top 3</span><strong>{formatPct(topConcentration)} ({concentrationLevel})</strong></li>
                        <li><span>Mejor mes registrado</span><strong>{bestMonth ? `${bestMonth.period} (${formatPct(bestMonth.monthlyReturnPct)})` : 'N/D'}</strong></li>
                        <li><span>Peor mes registrado</span><strong>{worstMonth ? `${worstMonth.period} (${formatPct(worstMonth.monthlyReturnPct)})` : 'N/D'}</strong></li>
                        <li><span>Ganancia neta vs invertido</span><strong>{latestEvolution ? formatCurrency(latestEvolution.gainVsInvested) : 'N/D'}</strong></li>
                        <li><span>Proyección 12 meses (escenario base)</span><strong>{formatCurrency(projection12m)}</strong></li>
                    </ul>
                    <div className="portfolio-csv-note">
                        <p>
                            Si sube la concentración y empeora el drawdown, revisa rebalanceo y riesgo antes de aumentar exposición.
                        </p>
                    </div>
                </article>
            </section>

            <section className="portfolio-csv-grid">
                <article className="portfolio-csv-card">
                    <h2><AlertTriangle size={18} /> Checks automáticos</h2>
                    <p>Lectura rápida de concentración, liquidez y consistencia del CSV actual.</p>
                    <div className="portfolio-csv-checks">
                        {riskChecks.map((check) => (
                            <div key={check.title} className={`portfolio-csv-check portfolio-csv-check--${check.tone}`}>
                                <div className="portfolio-csv-check__top">
                                    <span className="portfolio-csv-check__title">{check.title}</span>
                                    <strong className="portfolio-csv-check__value">{check.value}</strong>
                                </div>
                                <p>{check.detail}</p>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="portfolio-csv-card">
                    <h2><Layers3 size={18} /> Buckets por objetivo</h2>
                    <p>Agrupa las posiciones en largo plazo, medio plazo, liquidez y objetivos concretos.</p>
                    <div className="portfolio-csv-chart">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={bucketAllocationData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} interval={0} />
                                <YAxis tickFormatter={(value) => `${value}%`} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip {...tooltipTheme} formatter={(value: number | string | undefined) => formatPct(Number(value ?? 0))} />
                                <Bar dataKey="weight" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <ul className="portfolio-csv-insights">
                        {bucketAllocationData.map((row) => (
                            <li key={row.name}><span>{row.name}</span><strong>{formatPct(row.weight)}</strong></li>
                        ))}
                    </ul>
                </article>
            </section>

            <section className="portfolio-csv-card portfolio-csv-card--full">
                <h2><FileSpreadsheet size={18} /> Tabla de control de posiciones</h2>
                <p>Corrige categorías cuando la heurística falle.</p>
                <div className="portfolio-csv-controls-table">
                    <div className="portfolio-csv-controls-table__head">
                        <span>Activo</span>
                        <span>Peso</span>
                        <span>Categoría</span>
                    </div>
                    {holdings.map((holding) => (
                        <div key={holding.asset} className="portfolio-csv-controls-table__row">
                            <div className="portfolio-csv-controls-table__asset">
                                <strong>{holding.asset}</strong>
                                <small>{formatCurrency(holding.amount)}</small>
                            </div>
                            <strong>{formatPct(holding.weight)}</strong>
                            <select className="portfolio-csv-select" value={holding.category} onChange={(event) => setHoldingCategoryOverride(holding.asset, event.target.value as HoldingCategory)}>
                                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            </section>
            <section className="portfolio-csv-grid">
                <article className="portfolio-csv-card">
                    <h2><TrendingUp size={18} /> Asignación objetivo</h2>
                    <p>Define el peso deseado para cada bloque.</p>
                    <div className="portfolio-csv-targets">
                        {(Object.keys(BUCKET_LABELS) as HoldingBucket[]).map((bucket) => (
                            <label key={bucket} className="portfolio-csv-targets__item">
                                <span>{BUCKET_LABELS[bucket]}</span>
                                <input
                                    className="portfolio-csv-select"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    value={bucketTargets[bucket] ?? 0}
                                    onChange={(event) => setBucketTarget(bucket, event.target.value)}
                                />
                            </label>
                        ))}
                    </div>
                    <div className={`portfolio-csv-targets__total ${Math.abs(totalTargetWeight - 100) > 0.01 ? 'portfolio-csv-targets__total--warn' : ''}`}>
                        <span>Suma objetivo</span>
                        <strong>{formatPct(totalTargetWeight)}</strong>
                    </div>
                </article>

                <article className="portfolio-csv-card">
                    <h2><Layers3 size={18} /> Desviación vs Objetivo</h2>
                    <p>Lectura practica para saber que bloque pesa de mas o de menos respecto al plan.</p>
                    <div className="portfolio-csv-plan-table">
                        <div className="portfolio-csv-plan-table__head">
                            <span>Bucket</span>
                            <span>Actual</span>
                            <span>Objetivo</span>
                            <span>Desvío</span>
                        </div>
                        {bucketPlanData.map((row) => (
                            <div key={row.bucket} className="portfolio-csv-plan-table__row">
                                <strong className="portfolio-csv-plan-table__bucket">{row.label}</strong>
                                <span data-label="Actual">{formatPct(row.currentWeight)}</span>
                                <span data-label="Objetivo">{formatPct(row.targetWeight)}</span>
                                <span
                                    data-label="Desvío"
                                    className={row.deviation > 0.25 ? 'portfolio-csv-plan-table__delta--over' : row.deviation < -0.25 ? 'portfolio-csv-plan-table__delta--under' : ''}
                                >
                                    {row.deviation > 0 ? '+' : ''}{formatPct(row.deviation)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="portfolio-csv-note">
                        <p>
                            Rebalanceo orientativo:
                            {' '}
                            {bucketPlanData
                                .filter((row) => Math.abs(row.amountDelta) >= Math.max(totalPortfolioValue * 0.01, 100))
                                .map((row) => `${row.amountDelta > 0 ? 'reducir' : 'aumentar'} ${row.label} en ${formatCurrency(Math.abs(row.amountDelta))}`)
                                .join(' | ') || 'la cartera ya está cerca del objetivo definido.'}
                        </p>
                    </div>
                </article>
            </section>
        </div>
    );
}
