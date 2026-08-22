import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    Activity,
    CalendarClock,
    Download,
    FileSpreadsheet,
    Gauge,
    Layers3,
    RefreshCw,
    ShieldCheck,
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
import {
    BUCKET_LABELS,
    CATEGORY_LABELS,
    DEFAULT_ADVANCED_STATS_CSV,
    DEFAULT_BUCKET_TARGETS,
    DEFAULT_COMPARISON_CSV,
    DEFAULT_DAILY_CSV,
    DEFAULT_EVOLUTION_CSV,
    DEFAULT_HOLDINGS_CSV,
    PIE_COLORS,
    STORAGE_KEYS,
} from './portfolioCsvConstants';
import {
    readStoredMap,
    readStoredNumberMap,
    readStoredValue,
} from './portfolioCsvStorage';
import type {
    AdvancedPortfolioStats,
    EnrichedEvolutionPoint,
    HoldingBucket,
    HoldingCategory,
    HoldingControl,
    PieRow,
} from './portfolioCsvTypes';
import {
    classifyAsset,
    defaultBucketForCategory,
    formatCurrency,
    formatPct,
    formatPeriodLabel,
    normalizeSheetName,
    calculateAdvancedPortfolioStats,
    parseAdvancedStats,
    parseBenchmarkComparison,
    parseDailyData,
    parseEvolution,
    parseHoldings,
    parsePeriodParts,
    resolveEvolutionPeriods,
    standardDeviation,
} from './portfolioCsvUtils';
import './PortfolioCsv.css';

function readBucketTargets(): Record<string, number> {
    const stored = readStoredNumberMap(STORAGE_KEYS.bucketTargets, DEFAULT_BUCKET_TARGETS);
    const { goal: legacyGoal, ...storedTargets } = stored;
    const migratedLongTerm = Number(storedTargets.longTerm ?? DEFAULT_BUCKET_TARGETS.longTerm) + Number(legacyGoal ?? 0);

    return {
        ...DEFAULT_BUCKET_TARGETS,
        ...storedTargets,
        longTerm: Number.isFinite(migratedLongTerm) ? migratedLongTerm : DEFAULT_BUCKET_TARGETS.longTerm,
    };
}

export function PortfolioCsv() {
    type RiskMapPoint = Omit<EnrichedEvolutionPoint, 'monthlyReturnPct' | 'twrYtdPct' | 'drawdownPct'> & {
        monthlyReturnPct: number | null;
        twrYtdPct: number | null;
        drawdownPct: number | null;
        twrYtdPctReset: number | null;
        drawdownPctReset: number | null;
    };

    const [holdingsRaw, setHoldingsRaw] = useState(() => readStoredValue(STORAGE_KEYS.holdingsRaw, DEFAULT_HOLDINGS_CSV));
    const [evolutionRaw, setEvolutionRaw] = useState(() => readStoredValue(STORAGE_KEYS.evolutionRaw, DEFAULT_EVOLUTION_CSV));
    const [comparisonRaw, setComparisonRaw] = useState(() => readStoredValue(STORAGE_KEYS.comparisonRaw, DEFAULT_COMPARISON_CSV));
    const [advancedRaw, setAdvancedRaw] = useState(() => readStoredValue(STORAGE_KEYS.advancedRaw, DEFAULT_ADVANCED_STATS_CSV));
    const [dailyRaw, setDailyRaw] = useState(() => readStoredValue(STORAGE_KEYS.dailyRaw, DEFAULT_DAILY_CSV));
    const [workbookFileLabel, setWorkbookFileLabel] = useState(() => readStoredValue(STORAGE_KEYS.workbookFile, 'Demo precargada'));
    const [updatedAt, setUpdatedAt] = useState(() => readStoredValue(STORAGE_KEYS.updatedAt, ''));
    const [categoryOverrides, setCategoryOverrides] = useState<Record<string, HoldingCategory>>(() => readStoredMap<HoldingCategory>(STORAGE_KEYS.categoryOverrides));
    const [bucketTargets, setBucketTargets] = useState<Record<string, number | string>>(readBucketTargets);
    const [error, setError] = useState('');
    const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 700 : false));

    const workbookInputRef = useRef<HTMLInputElement | null>(null);

    const deferredHoldingsRaw = useDeferredValue(holdingsRaw);
    const deferredEvolutionRaw = useDeferredValue(evolutionRaw);
    const deferredComparisonRaw = useDeferredValue(comparisonRaw);
    const deferredAdvancedRaw = useDeferredValue(advancedRaw);
    const deferredDailyRaw = useDeferredValue(dailyRaw);

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
    const benchmarkComparison = useMemo(() => parseBenchmarkComparison(deferredComparisonRaw), [deferredComparisonRaw]);
    const advancedSource = useMemo(() => parseAdvancedStats(deferredAdvancedRaw), [deferredAdvancedRaw]);
    const dailyPoints = useMemo(() => parseDailyData(deferredDailyRaw), [deferredDailyRaw]);
    const advancedStats = useMemo<AdvancedPortfolioStats>(
        () => calculateAdvancedPortfolioStats(evolutionBase, benchmarkComparison, dailyPoints, advancedSource.riskFreeAnnualPct),
        [advancedSource.riskFreeAnnualPct, benchmarkComparison, dailyPoints, evolutionBase],
    );

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
    const riskMapData = useMemo<RiskMapPoint[]>(() => {
        return evolution.flatMap((row, index) => {
            const previous = index > 0 ? evolution[index - 1] : null;
            const currentResolvedPeriod = resolvedPeriodMap.get(row.period) || row.period;
            const previousResolvedPeriod = previous ? (resolvedPeriodMap.get(previous.period) || previous.period) : null;
            const currentParts = parsePeriodParts(currentResolvedPeriod);
            const previousParts = previousResolvedPeriod ? parsePeriodParts(previousResolvedPeriod) : null;
            const startsNewYear = Boolean(
                previous
                && currentParts
                && previousParts
                && currentParts.year !== undefined
                && previousParts.year !== undefined
                && currentParts.year !== previousParts.year
            );

            if (index > 0 && !startsNewYear) {
                return [{
                    ...row,
                    twrYtdPctReset: null,
                    drawdownPctReset: null,
                }] as RiskMapPoint[];
            }

            return [
                {
                    ...row,
                    period: `${row.period}__reset`,
                    monthlyReturnPct: null,
                    drawdownPct: null,
                    twrYtdPct: null,
                    drawdownPctReset: 0,
                    twrYtdPctReset: 0,
                },
                {
                    ...row,
                    drawdownPctReset: row.drawdownPct,
                    twrYtdPctReset: row.twrYtdPct,
                },
            ] as RiskMapPoint[];
        });
    }, [evolution, resolvedPeriodMap]);
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.holdingsRaw, holdingsRaw);
            localStorage.setItem(STORAGE_KEYS.evolutionRaw, evolutionRaw);
            localStorage.setItem(STORAGE_KEYS.comparisonRaw, comparisonRaw);
            localStorage.setItem(STORAGE_KEYS.advancedRaw, advancedRaw);
            localStorage.setItem(STORAGE_KEYS.dailyRaw, dailyRaw);
            localStorage.setItem(STORAGE_KEYS.workbookFile, workbookFileLabel);
            localStorage.setItem(STORAGE_KEYS.updatedAt, updatedAt);
            localStorage.setItem(STORAGE_KEYS.categoryOverrides, JSON.stringify(categoryOverrides));
            localStorage.setItem(STORAGE_KEYS.bucketTargets, JSON.stringify(bucketTargets));
        } catch {
            // localStorage puede fallar en modo privado o por limites de cuota.
        }
    }, [advancedRaw, bucketTargets, categoryOverrides, comparisonRaw, dailyRaw, holdingsRaw, evolutionRaw, workbookFileLabel, updatedAt]);

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
        const byBucket: Record<HoldingBucket, number> = { longTerm: 0, income: 0, liquidity: 0 };
        holdings.forEach((row) => { byBucket[row.bucket] += row.weight; });
        return [
            { name: BUCKET_LABELS.longTerm, weight: byBucket.longTerm },
            { name: BUCKET_LABELS.income, weight: byBucket.income },
            { name: BUCKET_LABELS.liquidity, weight: byBucket.liquidity },
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
    const latestBenchmarkComparison = benchmarkComparison.length > 0 ? benchmarkComparison[benchmarkComparison.length - 1] : null;
    const relativeAccumPct = latestBenchmarkComparison
        ? latestBenchmarkComparison.portfolioAccumPct - latestBenchmarkComparison.benchmarkAccumPct
        : 0;
    const bestRelativeMonth = benchmarkComparison.length > 0
        ? [...benchmarkComparison].sort((a, b) => b.relativeReturnPct - a.relativeReturnPct)[0]
        : null;
    const worstRelativeMonth = benchmarkComparison.length > 0
        ? [...benchmarkComparison].sort((a, b) => a.relativeReturnPct - b.relativeReturnPct)[0]
        : null;
    const benchmarkWinRate = useMemo(() => {
        if (benchmarkComparison.length === 0) return 0;
        const wins = benchmarkComparison.filter((row) => row.portfolioReturnPct > row.benchmarkReturnPct).length;
        return (wins / benchmarkComparison.length) * 100;
    }, [benchmarkComparison]);

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
                detail: topHolding ? `${topHolding.asset} es la mayor posición.` : 'Sin posiciones cargadas.',
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
                detail: maxDrawdown <= -15 ? 'La serie registra caídas relevantes.' : 'El drawdown histórico es moderado.',
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
            [bucket]: value === '' ? '' : Number.isFinite(parsed) ? parsed : '',
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
            const comparisonSheetName = normalizedNames.comparativa || normalizedNames.benchmark || normalizedNames.comparison;
            const advancedSheetName = normalizedNames.estadisticasavanzadas || normalizedNames.advancedstats || normalizedNames.advancedstatistics;
            const dailySheetName = normalizedNames.datosdiarios || normalizedNames.dailydata || normalizedNames.diarios;

            if (!holdingsSheetName || !evolutionSheetName) {
                setError('El Excel debe incluir las hojas "Cartera" y "Evolución".');
                return;
            }

            const holdingsText = XLSX.utils.sheet_to_csv(workbook.Sheets[holdingsSheetName]);
            const evolutionText = XLSX.utils.sheet_to_csv(workbook.Sheets[evolutionSheetName]);
            const comparisonText = comparisonSheetName
                ? XLSX.utils.sheet_to_csv(workbook.Sheets[comparisonSheetName])
                : '';
            const advancedText = advancedSheetName
                ? XLSX.utils.sheet_to_csv(workbook.Sheets[advancedSheetName])
                : '';
            const dailyText = dailySheetName
                ? XLSX.utils.sheet_to_csv(workbook.Sheets[dailySheetName])
                : '';

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
            setComparisonRaw(comparisonText);
            setAdvancedRaw(advancedText);
            setDailyRaw(dailyText);
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
        setComparisonRaw(DEFAULT_COMPARISON_CSV);
        setAdvancedRaw(DEFAULT_ADVANCED_STATS_CSV);
        setDailyRaw(DEFAULT_DAILY_CSV);
        setWorkbookFileLabel('Demo precargada');
        setUpdatedAt(new Date().toISOString());
        setError('');
    };

    const downloadWorkbookTemplate = () => {
        const link = document.createElement('a');
        link.href = `${import.meta.env.BASE_URL}plantilla-portfolio.xlsx`;
        link.download = 'plantilla-portfolio-formato-completo.xlsx';
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const tooltipTheme = {
        contentStyle: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: '10px' },
        labelStyle: { color: 'var(--text-primary)', fontWeight: 600 },
        itemStyle: { color: 'var(--text-secondary)' },
    };

    const legendFormatter = (value: string) => (<span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{value}</span>);
    const getBasePeriodKey = (value: string) => value.replace(/__reset$/, '');
    const formatPeriodTick = (value: string) => {
        const rawValue = value;
        if (!rawValue || rawValue.endsWith('__reset')) return '';
        const baseValue = getBasePeriodKey(rawValue);
        if (isMobile) return mobilePeriodMap.get(baseValue) || baseValue;
        return resolvedPeriodMap.get(baseValue) || formatPeriodLabel(baseValue);
    };
    const riskMapChartMargin = isMobile
        ? { top: 26, right: 2, left: 0, bottom: 34 }
        : { top: 28, right: 10, left: 0, bottom: 18 };
    const mobilePinnedTooltipPosition = isMobile ? { x: 12, y: 12 } : undefined;
    const renderRiskMapTick = ({
        x,
        y,
        payload,
    }: {
        x?: string | number;
        y?: string | number;
        payload?: { value?: string };
    }) => {
        const rawValue = payload?.value || '';
        if (!rawValue || typeof x !== 'number' || typeof y !== 'number') return null;

        if (rawValue.endsWith('__reset')) {
            const baseValue = getBasePeriodKey(rawValue);
            const resolved = resolvedPeriodMap.get(baseValue) || baseValue;
            const parts = parsePeriodParts(resolved);
            if (!parts?.year) return null;

            return (
                <g transform={`translate(${x},${y})`}>
                    <line x1={0} y1={-26} x2={0} y2={-6} stroke="#a5b4fc" strokeWidth={1.5} strokeDasharray="4 3" />
                    <rect x={-18} y={-44} width={36} height={16} rx={8} fill="rgba(99, 102, 241, 0.22)" />
                    <text x={0} y={-33} textAnchor="middle" fill="#c7d2fe" fontSize={10} fontWeight={700}>
                        {parts.year}
                    </text>
                </g>
            );
        }

        return (
            <text
                x={x}
                y={y + 12}
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize={isMobile ? 11 : 12}
            >
                {formatPeriodTick(rawValue)}
            </text>
        );
    };
    const renderRiskLeftAxisTick = ({
        x,
        y,
        payload,
    }: {
        x?: string | number;
        y?: string | number;
        payload?: { value?: string | number };
    }) => {
        if (typeof x !== 'number' || typeof y !== 'number') return null;
        return (
            <text
                x={x}
                y={y}
                dy={4}
                textAnchor="end"
                fill="url(#portfolioCsvRiskAxisGradient)"
                fontSize={isMobile ? 11 : 12}
                fontWeight={600}
            >
                {`${payload?.value ?? 0}%`}
            </text>
        );
    };
    const renderRiskRightAxisTick = ({
        x,
        y,
        payload,
    }: {
        x?: string | number;
        y?: string | number;
        payload?: { value?: string | number };
    }) => {
        if (typeof x !== 'number' || typeof y !== 'number') return null;
        return (
            <text
                x={x}
                y={y}
                dy={4}
                textAnchor="start"
                fill="#f87171"
                fontSize={isMobile ? 11 : 12}
                fontWeight={600}
            >
                {`${payload?.value ?? 0}%`}
            </text>
        );
    };

    const SeriesTooltip = ({
        active,
        payload,
        label,
        valueType,
    }: {
        active?: boolean;
        payload?: Array<{ name?: string; value?: number | string; color?: string; payload?: { period?: string } }>;
        label?: string;
        valueType: 'currency' | 'percent';
    }) => {
        if (!active || !payload || payload.length === 0) return null;
        const rawLabel = typeof payload[0]?.payload?.period === 'string'
            ? payload[0].payload.period
            : (label || '');
        if (rawLabel.endsWith('__reset')) return null;

        const formatValue = (raw: number | string | undefined) => {
            const value = Number(raw ?? 0);
            return valueType === 'currency' ? formatCurrency(value) : formatPct(value);
        };
        const baseLabel = rawLabel ? getBasePeriodKey(rawLabel) : '';
        const formattedLabel = !rawLabel
            ? ''
            : (resolvedPeriodMap.get(baseLabel) || formatPeriodLabel(baseLabel));
        const uniquePayload = payload.filter((entry, index, entries) => {
            const name = entry.name || '';
            return entries.findIndex((candidate) => (candidate.name || '') === name) === index;
        });

        return (
            <div className="portfolio-csv-tooltip">
                <div className="portfolio-csv-tooltip__label">{formattedLabel}</div>
                <div className="portfolio-csv-tooltip__rows">
                    {uniquePayload.map((entry, index) => (
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

    const formatAdvancedRatio = (value: number | null) => value === null ? 'N/D' : value.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    const formatAdvancedPct = (value: number | null) => value === null ? 'N/D' : formatPct(value);
    const formatAdvancedDate = (value: string | undefined) => value
        ? new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
        : 'N/D';

    return (
        <div className="portfolio-csv-page">
            <header className="portfolio-csv-hero">
                <div className="portfolio-csv-hero__badge">Portfolio</div>
                <h1>Análisis de cartera</h1>
                <p>Sube tu Excel y dale un vistazo honesto a tu cartera: cómo está repartida, cuánto ha crecido, qué riesgo estás asumiendo y cómo se comporta frente al mercado. Con el detalle diario, además, podemos hilar un poco más fino.</p>
            </header>

            <section className="portfolio-csv-upload">
                <article className="portfolio-csv-upload__card portfolio-csv-upload__card--utility">
                    <h3><FileSpreadsheet size={18} /> Excel único</h3>
                    <p>Sube un `.xlsx` con `Cartera`, `Evolución`, `Comparativa` y, opcionalmente, `Estadísticas avanzadas` y `Datos diarios`, o descarga una plantilla lista para rellenar.</p>
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
                    <h2><Layers3 size={18} /> Lectura del benchmark</h2>
                    <ul className="portfolio-csv-insights">
                        <li><span>Cartera acumulada</span><strong>{latestBenchmarkComparison ? formatPct(latestBenchmarkComparison.portfolioAccumPct) : 'N/D'}</strong></li>
                        <li><span>MSCI World acumulado</span><strong>{latestBenchmarkComparison ? formatPct(latestBenchmarkComparison.benchmarkAccumPct) : 'N/D'}</strong></li>
                        <li><span>Diferencia acumulada</span><strong>{latestBenchmarkComparison ? formatPct(relativeAccumPct) : 'N/D'}</strong></li>
                        <li><span>Meses batiendo benchmark</span><strong>{benchmarkComparison.length ? formatPct(benchmarkWinRate) : 'N/D'}</strong></li>
                        <li><span>Mejor mes relativo</span><strong>{bestRelativeMonth ? `${bestRelativeMonth.period} (${formatPct(bestRelativeMonth.relativeReturnPct)})` : 'N/D'}</strong></li>
                        <li><span>Peor mes relativo</span><strong>{worstRelativeMonth ? `${worstRelativeMonth.period} (${formatPct(worstRelativeMonth.relativeReturnPct)})` : 'N/D'}</strong></li>
                    </ul>
                    <div className="portfolio-csv-note">
                        <p>
                            Un diferencial positivo sostenido indica que la cartera está compensando su riesgo frente al índice de referencia.
                        </p>
                    </div>
                </article>
            </section>

            <section className="portfolio-csv-grid">
                <article className="portfolio-csv-card portfolio-csv-card--wide">
                    <h2><TrendingUp size={18} /> Comparativa vs MSCI World</h2>
                    <p>Evolución acumulada de la cartera frente al benchmark y diferencia mensual relativa.</p>
                    {benchmarkComparison.length > 0 ? (
                        <div className="portfolio-csv-chart portfolio-csv-chart--benchmark">
                            <ResponsiveContainer width="100%" height={isMobile ? 360 : 330}>
                                <ComposedChart data={benchmarkComparison} margin={{ top: 20, right: isMobile ? 4 : 14, left: 0, bottom: isMobile ? 30 : 12 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis
                                        dataKey="period"
                                        tickFormatter={formatPeriodTick}
                                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        interval="preserveStartEnd"
                                        minTickGap={isMobile ? 28 : 14}
                                    />
                                    <YAxis yAxisId="left" tickFormatter={(value) => `${value}%`} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<SeriesTooltip valueType="percent" />} />
                                    <Legend formatter={legendFormatter} wrapperStyle={{ color: 'var(--text-secondary)' }} />
                                    <Bar yAxisId="right" dataKey="relativeReturnPct" name="Alpha mensual" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={isMobile ? 10 : 16} />
                                    <Line yAxisId="left" type="monotone" dataKey="portfolioAccumPct" name="Cartera acum." stroke="#10b981" strokeWidth={2.3} dot={false} />
                                    <Line yAxisId="left" type="monotone" dataKey="benchmarkAccumPct" name="MSCI World acum." stroke="#3b82f6" strokeWidth={2.2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="portfolio-csv-empty-state">
                            Añade una hoja `Comparativa` con columnas de rentabilidad mensual y acumulada para activar este análisis.
                        </div>
                    )}
                </article>
            </section>

            <section className="portfolio-csv-card portfolio-csv-card--full portfolio-csv-advanced">
                <div className="portfolio-csv-advanced__header">
                    <div>
                        <h2><Activity size={18} /> Estadísticas avanzadas</h2>
                        <p>Ratios recalculados con la serie mensual y el benchmark para evitar depender de fórmulas dinámicas del Excel.</p>
                    </div>
                    <span className="portfolio-csv-advanced__source">
                        {advancedStats.analyzedMonths} meses analizados
                    </span>
                </div>
                <div className="portfolio-csv-advanced__grid">
                    <div className="portfolio-csv-advanced__metric">
                        <span>Ratio Sharpe</span>
                        <strong>{formatAdvancedRatio(advancedStats.sharpeRatio)}</strong>
                        <small>Con €STR como referencia de riesgo</small>
                    </div>
                    <div className="portfolio-csv-advanced__metric">
                        <span>Ratio Sortino</span>
                        <strong>{formatAdvancedRatio(advancedStats.sortinoRatio)}</strong>
                        <small>Penaliza solo la volatilidad negativa</small>
                    </div>
                    <div className="portfolio-csv-advanced__metric">
                        <span>Alpha anual</span>
                        <strong>{formatAdvancedPct(advancedStats.annualAlphaPct)}</strong>
                        <small>Exceso estimado frente al benchmark</small>
                    </div>
                    <div className="portfolio-csv-advanced__metric">
                        <span>Beta vs MSCI World</span>
                        <strong>{formatAdvancedRatio(advancedStats.beta)}</strong>
                        <small>Sensibilidad relativa al mercado</small>
                    </div>
                    <div className="portfolio-csv-advanced__metric">
                        <span>Máximo drawdown</span>
                        <strong>{formatAdvancedPct(advancedStats.maxDrawdownPct)}</strong>
                        <small>Peor caída desde un máximo</small>
                    </div>
                    <div className="portfolio-csv-advanced__metric">
                        <span>Information ratio</span>
                        <strong>{formatAdvancedRatio(advancedStats.informationRatio)}</strong>
                        <small>Alpha relativo por unidad de tracking error</small>
                    </div>
                    <div className="portfolio-csv-advanced__metric">
                        <span>Tracking error anual</span>
                        <strong>{formatAdvancedPct(advancedStats.trackingErrorAnnualPct)}</strong>
                        <small>Desviación frente al benchmark</small>
                    </div>
                    <div className="portfolio-csv-advanced__metric">
                        <span>Correlación</span>
                        <strong>{formatAdvancedRatio(advancedStats.correlation)}</strong>
                        <small>Movimiento conjunto con el índice</small>
                    </div>
                    <div className="portfolio-csv-advanced__metric">
                        <span>Rentabilidad anualizada</span>
                        <strong>{formatAdvancedPct(advancedStats.annualizedReturnPct)}</strong>
                        <small>Compuesta a partir de los meses cargados</small>
                    </div>
                    <div className="portfolio-csv-advanced__metric">
                        <span>Volatilidad anualizada</span>
                        <strong>{formatAdvancedPct(advancedStats.annualizedVolatilityPct)}</strong>
                        <small>Volatilidad mensual anualizada</small>
                    </div>
                    <div className="portfolio-csv-advanced__metric">
                        <span>Ratio Treynor</span>
                        <strong>{formatAdvancedPct(advancedStats.treynorRatioPct)}</strong>
                        <small>Exceso de retorno por beta</small>
                    </div>
                    <div className="portfolio-csv-advanced__metric">
                        <span>Mejor mes</span>
                        <strong>{advancedStats.bestMonth ? formatAdvancedPct(advancedStats.bestMonth.returnPct) : 'N/D'}</strong>
                        <small>{advancedStats.bestMonth?.period || 'Sin datos'}</small>
                    </div>
                </div>
                <div className="portfolio-csv-advanced__daily">
                    <div><Gauge size={16} /><span>€STR / libre de riesgo</span><strong>{formatAdvancedPct(advancedStats.riskFreeAnnualPct)}</strong></div>
                    <div><ShieldCheck size={16} /><span>Observaciones diarias</span><strong>{advancedStats.dailyObservations || 'N/D'}</strong></div>
                    <div><TrendingUp size={16} /><span>Volatilidad diaria anualizada</span><strong>{formatAdvancedPct(advancedStats.dailyVolatilityAnnualPct)}</strong></div>
                    <div><CalendarClock size={16} /><span>Último dato diario</span><strong>{advancedStats.latestDailyPoint ? `${formatCurrency(advancedStats.latestDailyPoint.totalValue)} · ${formatAdvancedDate(advancedStats.latestDailyPoint.date)}` : 'N/D'}</strong></div>
                </div>
            </section>

            <section className="portfolio-csv-grid">
                <article className="portfolio-csv-card">
                    <h2><AlertTriangle size={18} /> Mapa de riesgo: retorno mensual y drawdown</h2>
                    <p>Compara retorno mensual, drawdown y TWR YTD.</p>
                    <div className="portfolio-csv-chart portfolio-csv-chart--risk-map">
                        <ResponsiveContainer width="100%" height={320}>
                            <ComposedChart
                                data={riskMapData}
                                margin={riskMapChartMargin}
                            >
                                <defs>
                                    <linearGradient id="portfolioCsvRiskAxisGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis
                                    dataKey="period"
                                    tickFormatter={formatPeriodTick}
                                    tick={renderRiskMapTick}
                                    axisLine={false}
                                    tickLine={false}
                                    interval="preserveStartEnd"
                                    minTickGap={isMobile ? 28 : 14}
                                />
                                <YAxis
                                    yAxisId="left"
                                    tickFormatter={(value) => `${value}%`}
                                    tick={renderRiskLeftAxisTick}
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={6}
                                    width={isMobile ? 36 : 44}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tickFormatter={(value) => `${value}%`}
                                    tick={renderRiskRightAxisTick}
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={6}
                                    width={isMobile ? 36 : 44}
                                />
                                <Tooltip content={<SeriesTooltip valueType="percent" />} />
                                <Legend formatter={legendFormatter} wrapperStyle={{ color: 'var(--text-secondary)' }} />
                                <Bar yAxisId="left" dataKey="monthlyReturnPct" name="% Mensual" fill="#10b981" radius={[6, 6, 0, 0]} barSize={isMobile ? 10 : 18} />
                                <Line yAxisId="right" type="monotone" dataKey="drawdownPct" name="Drawdown %" stroke="#ef4444" strokeWidth={2.1} dot={false} />
                                <Line yAxisId="right" type="monotone" dataKey="drawdownPctReset" name="Drawdown %" stroke="#ef4444" strokeWidth={2.1} dot={false} legendType="none" connectNulls={false} />
                                <Line yAxisId="left" type="monotone" dataKey="twrYtdPct" name="TWR YTD %" stroke="#8b5cf6" strokeWidth={2.1} dot={false} connectNulls={false} />
                                <Line yAxisId="left" type="monotone" dataKey="twrYtdPctReset" name="TWR YTD %" stroke="#8b5cf6" strokeWidth={2.1} dot={false} legendType="none" connectNulls={false} />
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
                    <p>Agrupa las posiciones por horizonte: largo plazo, medio plazo y liquidez.</p>
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





