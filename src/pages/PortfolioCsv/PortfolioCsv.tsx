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
import './PortfolioCsv.css';

type HoldingCategory = 'equity' | 'fixedIncome' | 'cash' | 'alternatives' | 'other';
type Holding = { asset: string; amount: number; weight: number; category: HoldingCategory };
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

const STORAGE_KEYS = {
    holdingsRaw: 'freewallet_portfolio_csv_holdings_raw',
    evolutionRaw: 'freewallet_portfolio_csv_evolution_raw',
    holdingsFile: 'freewallet_portfolio_csv_holdings_file',
    evolutionFile: 'freewallet_portfolio_csv_evolution_file',
    updatedAt: 'freewallet_portfolio_csv_updated_at',
} as const;

const DEFAULT_HOLDINGS_CSV = `Activo,Importe (EUR),Peso %
"Fidelity MSCI World (euros, no hedge)","18.759,00EUR","24,36%"
Vanguard Emerging Markets,"6.261,00EUR","8,13%"
Pictet China,"2.468,00EUR","3,20%"
MyInvestor Value C,"6.448,00EUR","8,37%"
Cobas Internacional,"4.747,00EUR","6,16%"
Evercapital UCITS,"3.000,00EUR","3,90%"
Carmignac Portfolio Credit,"10.312,00EUR","13,39%"
Abaco Renta Fija Mixta Global,"8.573,00EUR","11,13%"
Neuberger Berman Short Duration,"1.140,00EUR","1,48%"
Revolut,"470,00EUR","0,61%"
Nextil,"12.289,00EUR","15,96%"
Amper,"1.851,00EUR","2,40%"
Obrascon Huarte Lain,"701,00EUR","0,91%"
TOTAL,"77.019,00EUR",`;

const DEFAULT_EVOLUTION_CSV = `Mes,Valor Total,Capital Inicial,Capital Aportado,Plusvalias,% mens.,TWR YTD
Mar,55139,52428,700,2011,"3,785","3,785"
Abr,57033,55139,700,1194,"4,276","8,222"
May,59028,57033,700,1295,"2,243","10,649"
Jun,60385,59028,700,657,"1,099","11,865"
Jul,61988,60385,700,903,"1,478","13,518"
Ago,63184,61988,700,496,"0,791","14,415"
Sep,67169,63184,700,3285,"5,142","20,298"
Oct,69786,67169,700,1917,"2,824","23,695"
Nov,70299,69786,700,-187,"-0,265","23,367"
Dic,73708,70299,700,2709,"3,815","28,073"
Ene,76000,73708,500,1792,"2,414","2,414"
Feb,76422,76000,700,-278,"-0,362","2,043"
"Mar 2026",74710,76422,0,-1712,"-2,24","-0,242"`;

const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#84cc16', '#64748b'];

function readStoredValue(key: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    try {
        return localStorage.getItem(key) || fallback;
    } catch {
        return fallback;
    }
}

function parseLooseNumber(value: string): number {
    const normalized = value
        .replace(/\uFEFF/g, '')
        .replace(/EUR|€|â‚¬/gi, '')
        .replace(/%/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
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

function classifyAsset(asset: string): HoldingCategory {
    const name = asset.toLowerCase();
    if (name.includes('renta fija') || name.includes('credit') || name.includes('short duration') || name.includes('bond')) return 'fixedIncome';
    if (name.includes('revolut') || name.includes('cash') || name.includes('liquidez')) return 'cash';
    if (name.includes('reits') || name.includes('commodity') || name.includes('gold') || name.includes('crypto')) return 'alternatives';
    if (name.includes('world') || name.includes('emerging') || name.includes('china') || name.includes('value') || name.includes('nextil') || name.includes('amper') || name.includes('obrascon')) return 'equity';
    return 'other';
}

function parseHoldings(raw: string): Holding[] {
    const rows = parseCsvRows(raw);
    if (rows.length <= 1) return [];
    const base = rows
        .slice(1)
        .map((row) => ({ asset: (row[0] || '').replace(/"/g, '').trim(), amount: parseLooseNumber(row[1] || ''), weight: parseLooseNumber(row[2] || '') }))
        .filter((row) => row.asset && row.asset.toUpperCase() !== 'TOTAL' && row.amount > 0);
    const totalAmount = base.reduce((acc, row) => acc + row.amount, 0);
    return base
        .map((row) => ({ asset: row.asset, amount: row.amount, weight: row.weight > 0 ? row.weight : (totalAmount > 0 ? (row.amount / totalAmount) * 100 : 0), category: classifyAsset(row.asset) }))
        .sort((a, b) => b.amount - a.amount);
}

function isMonthLabel(value: string): boolean {
    return /^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/i.test(value.trim());
}

function parseEvolution(raw: string): EvolutionPoint[] {
    const rows = parseCsvRows(raw);
    if (rows.length <= 1) return [];
    return rows
        .slice(1)
        .map((row) => {
            const period = (row[0] || '').replace(/"/g, '').trim();
            let monthlyReturnRaw = row[5] || '';
            let twrRaw = row[6] || '';
            if (row.length >= 9) {
                monthlyReturnRaw = `${row[5] || ''},${row[6] || ''}`;
                twrRaw = `${row[7] || ''},${row[8] || ''}`;
            } else if (row.length === 8) {
                twrRaw = `${row[6] || ''},${row[7] || ''}`;
            }
            return {
                period,
                totalValue: parseLooseNumber(row[1] || ''),
                initialCapital: parseLooseNumber(row[2] || ''),
                monthlyContribution: parseLooseNumber(row[3] || ''),
                profit: parseLooseNumber(row[4] || ''),
                monthlyReturnPct: parseLooseNumber(monthlyReturnRaw),
                twrYtdPct: parseLooseNumber(twrRaw),
            };
        })
        .filter((point) => isMonthLabel(point.period) && point.totalValue > 0);
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
    const [holdingsFileLabel, setHoldingsFileLabel] = useState(() => readStoredValue(STORAGE_KEYS.holdingsFile, 'Demo precargada'));
    const [evolutionFileLabel, setEvolutionFileLabel] = useState(() => readStoredValue(STORAGE_KEYS.evolutionFile, 'Demo precargada'));
    const [updatedAt, setUpdatedAt] = useState(() => readStoredValue(STORAGE_KEYS.updatedAt, ''));
    const [error, setError] = useState('');
    const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 700 : false));

    const holdingsInputRef = useRef<HTMLInputElement | null>(null);
    const evolutionInputRef = useRef<HTMLInputElement | null>(null);

    const deferredHoldingsRaw = useDeferredValue(holdingsRaw);
    const deferredEvolutionRaw = useDeferredValue(evolutionRaw);

    const holdings = useMemo(() => parseHoldings(deferredHoldingsRaw), [deferredHoldingsRaw]);
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

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.holdingsRaw, holdingsRaw);
            localStorage.setItem(STORAGE_KEYS.evolutionRaw, evolutionRaw);
            localStorage.setItem(STORAGE_KEYS.holdingsFile, holdingsFileLabel);
            localStorage.setItem(STORAGE_KEYS.evolutionFile, evolutionFileLabel);
            localStorage.setItem(STORAGE_KEYS.updatedAt, updatedAt);
        } catch {
            // Ignore localStorage errors.
        }
    }, [holdingsRaw, evolutionRaw, holdingsFileLabel, evolutionFileLabel, updatedAt]);

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

    const onUploadCsv = async (file: File, type: 'holdings' | 'evolution') => {
        try {
            const text = await file.text();
            if (!text.trim()) {
                setError('El archivo esta vacio. Sube un CSV con contenido.');
                return;
            }
            if (type === 'holdings') {
                if (parseHoldings(text).length === 0) {
                    setError('No pude interpretar el CSV de cartera. Revisa cabeceras y formato.');
                    return;
                }
                setHoldingsRaw(text);
                setHoldingsFileLabel(file.name);
            } else {
                if (parseEvolution(text).length === 0) {
                    setError('No pude interpretar el CSV de evolucion. Revisa cabeceras y formato.');
                    return;
                }
                setEvolutionRaw(text);
                setEvolutionFileLabel(file.name);
            }
            setUpdatedAt(new Date().toISOString());
            setError('');
        } catch {
            setError('Error leyendo el archivo. Asegura CSV UTF-8 o ANSI exportado desde Excel.');
        }
    };

    const resetToDemo = () => {
        setHoldingsRaw(DEFAULT_HOLDINGS_CSV);
        setEvolutionRaw(DEFAULT_EVOLUTION_CSV);
        setHoldingsFileLabel('Demo precargada');
        setEvolutionFileLabel('Demo precargada');
        setUpdatedAt(new Date().toISOString());
        setError('');
    };

    const downloadTemplate = (type: 'holdings' | 'evolution') => {
        const content = type === 'holdings' ? DEFAULT_HOLDINGS_CSV : DEFAULT_EVOLUTION_CSV;
        const filename = type === 'holdings' ? 'plantilla-cartera.csv' : 'plantilla-evolucion.csv';
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const tooltipTheme = {
        contentStyle: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: '10px' },
        labelStyle: { color: 'var(--text-primary)', fontWeight: 600 },
        itemStyle: { color: 'var(--text-secondary)' },
    };

    const legendFormatter = (value: string) => (<span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{value}</span>);
    const formatPeriodTick = (value: string) => (!isMobile ? value : value.replace(' 2025', '').replace(' 2026', ''));

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

        return (
            <div className="portfolio-csv-tooltip">
                <div className="portfolio-csv-tooltip__label">{label}</div>
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
                <div className="portfolio-csv-hero__badge">Portfolio Intelligence Lab</div>
                <h1>Analisis visual completo de tu cartera con CSV mensuales</h1>
                <p>Esta pantalla esta fuera de Academia para uso operativo. Sube tus CSV cada mes y obtendras una lectura directa de concentracion, drivers de rentabilidad, consistencia, drawdown y evolucion real.</p>
            </header>

            <section className="portfolio-csv-upload">
                <article className="portfolio-csv-upload__card">
                    <h3><FileSpreadsheet size={18} /> CSV de Cartera</h3>
                    <p>Columnas esperadas: Activo, Importe, Peso.</p>
                    <div className="portfolio-csv-upload__actions">
                        <button type="button" className="portfolio-csv-btn" onClick={() => holdingsInputRef.current?.click()}>
                            <Upload size={16} /> Subir CSV
                        </button>
                        <button type="button" className="portfolio-csv-btn portfolio-csv-btn--ghost" onClick={() => downloadTemplate('holdings')}>
                            <Download size={16} /> Plantilla
                        </button>
                    </div>
                    <small>{holdingsFileLabel}</small>
                    <input
                        ref={holdingsInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        hidden
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void onUploadCsv(file, 'holdings');
                            event.target.value = '';
                        }}
                    />
                </article>

                <article className="portfolio-csv-upload__card">
                    <h3><CalendarClock size={18} /> CSV de Evolucion</h3>
                    <p>Columnas esperadas: Mes, Valor Total, Capital Inicial, Capital Aportado, Plusvalias, % mens., TWR YTD.</p>
                    <div className="portfolio-csv-upload__actions">
                        <button type="button" className="portfolio-csv-btn" onClick={() => evolutionInputRef.current?.click()}>
                            <Upload size={16} /> Subir CSV
                        </button>
                        <button type="button" className="portfolio-csv-btn portfolio-csv-btn--ghost" onClick={() => downloadTemplate('evolution')}>
                            <Download size={16} /> Plantilla
                        </button>
                    </div>
                    <small>{evolutionFileLabel}</small>
                    <input
                        ref={evolutionInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        hidden
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void onUploadCsv(file, 'evolution');
                            event.target.value = '';
                        }}
                    />
                </article>

                <article className="portfolio-csv-upload__card portfolio-csv-upload__card--utility">
                    <h3><RefreshCw size={18} /> Estado y persistencia</h3>
                    <p>Los CSV quedan guardados en localStorage y siguen tras recargar.</p>
                    <div className="portfolio-csv-upload__actions">
                        <button type="button" className="portfolio-csv-btn" onClick={resetToDemo}>
                            Restaurar demo
                        </button>
                    </div>
                    <small>Ultima actualizacion: {updatedAt ? new Date(updatedAt).toLocaleString('es-ES') : 'sin registrar'}</small>
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
                <article className="portfolio-csv-kpi"><span>Top 3 concentracion</span><strong>{formatPct(topConcentration)}</strong></article>
                <article className="portfolio-csv-kpi"><span>Diversificacion efectiva</span><strong>{effectivePositions.toFixed(1)} posiciones</strong></article>
                <article className="portfolio-csv-kpi"><span>Meses positivos</span><strong>{formatPct(positiveMonthRatio)}</strong></article>
                <article className="portfolio-csv-kpi"><span>Retorno medio mensual</span><strong>{formatPct(avgMonthlyReturn)}</strong></article>
                <article className="portfolio-csv-kpi"><span>Volatilidad mensual</span><strong>{formatPct(monthlyVolatility)}</strong></article>
            </section>

            <section className="portfolio-csv-grid">
                <article className="portfolio-csv-card">
                    <h2><Layers3 size={18} /> Composicion por activos (peso real)</h2>
                    <p>Se cuida el margen del donut y los nombres para evitar cortes en desktop y movil.</p>
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
                    <h2><TrendingUp size={18} /> Asignacion por bloques</h2>
                    <p>Lectura tactica por tipo de activo. En movil las etiquetas se abrevian para mantener legibilidad.</p>
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
                    <p>Compara patrimonio frente a capital invertido para separar efecto mercado de efecto aportacion.</p>
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
                                <Tooltip content={<SeriesTooltip valueType="currency" />} />
                                <Area type="monotone" dataKey="totalValue" stroke="#10b981" fill="url(#portfolioCsvTotal)" strokeWidth={2.3} />
                                <Area type="monotone" dataKey="investedValue" stroke="#3b82f6" fill="url(#portfolioCsvInvested)" strokeWidth={2.1} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </article>

                <article className="portfolio-csv-card">
                    <h2><TrendingUp size={18} /> Drivers del mes: aportado vs plusvalia</h2>
                    <p>Descompone el avance mensual entre nuevo ahorro y comportamiento de mercado.</p>
                    <div className="portfolio-csv-chart">
                        <ResponsiveContainer width="100%" height={320}>
                            <ComposedChart data={evolution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="period" tickFormatter={formatPeriodTick} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={isMobile ? 22 : 12} />
                                <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<SeriesTooltip valueType="currency" />} />
                                <Legend formatter={legendFormatter} wrapperStyle={{ color: 'var(--text-secondary)' }} />
                                <Bar dataKey="monthlyContribution" name="Aportacion" fill="#3b82f6" radius={[6, 6, 0, 0]} />
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
                    <p>Cruza retorno mensual, drawdown y TWR YTD para detectar deterioro de calidad en la serie.</p>
                    <div className="portfolio-csv-chart">
                        <ResponsiveContainer width="100%" height={320}>
                            <ComposedChart data={evolution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="period" tickFormatter={formatPeriodTick} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={isMobile ? 22 : 12} />
                                <YAxis yAxisId="left" tickFormatter={(value) => `${value}%`} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip {...tooltipTheme} formatter={(value: number | string | undefined) => formatPct(Number(value ?? 0))} />
                                <Legend formatter={legendFormatter} wrapperStyle={{ color: 'var(--text-secondary)' }} />
                                <Bar yAxisId="left" dataKey="monthlyReturnPct" name="% Mensual" fill="#10b981" radius={[6, 6, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="drawdownPct" name="Drawdown %" stroke="#ef4444" strokeWidth={2.1} dot={false} />
                                <Line yAxisId="right" type="monotone" dataKey="twrYtdPct" name="TWR YTD %" stroke="#8b5cf6" strokeWidth={2.1} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </article>

                <article className="portfolio-csv-card">
                    <h2><Layers3 size={18} /> Lecturas de utilidad mensual</h2>
                    <ul className="portfolio-csv-insights">
                        <li><span>Concentracion Top 3</span><strong>{formatPct(topConcentration)} ({concentrationLevel})</strong></li>
                        <li><span>Mejor mes registrado</span><strong>{bestMonth ? `${bestMonth.period} (${formatPct(bestMonth.monthlyReturnPct)})` : 'N/D'}</strong></li>
                        <li><span>Peor mes registrado</span><strong>{worstMonth ? `${worstMonth.period} (${formatPct(worstMonth.monthlyReturnPct)})` : 'N/D'}</strong></li>
                        <li><span>Ganancia neta vs invertido</span><strong>{latestEvolution ? formatCurrency(latestEvolution.gainVsInvested) : 'N/D'}</strong></li>
                        <li><span>Proyeccion 12 meses (escenario base)</span><strong>{formatCurrency(projection12m)}</strong></li>
                    </ul>
                    <div className="portfolio-csv-note">
                        <p>
                            Sugerencia: si sube la concentracion, empeora el drawdown y cae el porcentaje de meses positivos a la vez,
                            prioriza rebalanceo y control de riesgo antes de escalar exposicion.
                        </p>
                    </div>
                </article>
            </section>
        </div>
    );
}
