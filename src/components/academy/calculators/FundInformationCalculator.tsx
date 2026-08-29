import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
    BarChart3,
    BookOpenText,
    CheckCircle2,
    CircleAlert,
    ExternalLink,
    FileSearch,
    FileText,
    Gauge,
    Info,
    Layers3,
    Search,
    ShieldCheck,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { Button, Input } from '../../ui';
import {
    FinectError,
    getFundRelevance,
    type FinectBreakdown,
    type FinectFundRelevance,
    type FinectMetricPoint,
    type FinectStatisticKey,
} from '../../../services/finect/finectService';
import './FundInformationCalculator.css';

const SAMPLE_ISIN = 'IE00BYX5NX33';
const STATISTIC_PERIODS = ['M12', 'M36', 'M60'] as const;

const riskBands: Record<number, { range: string; explanation: string }> = {
    1: { range: '0–0,5 % anualizada', explanation: 'Volatilidad muy baja.' },
    2: { range: 'más de 0,5 % y hasta 2 % anualizada', explanation: 'Volatilidad baja.' },
    3: { range: 'más de 2 % y hasta 5 % anualizada', explanation: 'Volatilidad moderada-baja.' },
    4: { range: 'más de 5 % y hasta 10 % anualizada', explanation: 'Volatilidad moderada.' },
    5: { range: 'más de 10 % y hasta 15 % anualizada', explanation: 'Volatilidad moderada-alta.' },
    6: { range: 'más de 15 % y hasta 25 % anualizada', explanation: 'Volatilidad alta.' },
    7: { range: 'más de 25 % anualizada', explanation: 'Volatilidad muy alta.' },
};

const statisticRows: Array<{
    key: FinectStatisticKey;
    label: string;
    format: 'percent' | 'ratio';
}> = [
    { key: 'maxDrawdown', label: 'Máxima caída', format: 'percent' },
    { key: 'standardDeviation', label: 'Volatilidad', format: 'percent' },
    { key: 'sharpeRatio', label: 'Sharpe', format: 'ratio' },
    { key: 'beta', label: 'Beta', format: 'ratio' },
    { key: 'trackingError', label: 'Tracking error', format: 'percent' },
];

const breakdownTitles: Record<string, string> = {
    'asset-allocation': 'Distribución por tipo de activo',
    'market-capitalization': 'Capitalización de las posiciones',
    'regional-exposure': 'Exposición regional',
    'stock-sector': 'Distribución sectorial',
};

function formatNumber(value: number, maximumFractionDigits = 2): string {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits }).format(value);
}

function formatPercentage(value: number, signed = false): string {
    const prefix = signed && value > 0 ? '+' : '';
    return `${prefix}${formatNumber(value)}%`;
}

function formatRatio(value: number): string {
    return formatNumber(value, 2);
}

function formatCurrency(value: number, currencyCode = 'EUR'): string {
    const safeCurrency = /^[A-Z]{3}$/.test(currencyCode) ? currencyCode : 'EUR';
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: safeCurrency,
        maximumFractionDigits: value < 10 ? 4 : 2,
    }).format(value);
}

function formatAssets(value: number | undefined, currencyCode = 'EUR'): string | undefined {
    if (value === undefined) return undefined;

    if (Math.abs(value) >= 1_000_000_000) {
        return `${formatNumber(value / 1_000_000_000, 2)} mil M ${currencyCode}`;
    }

    if (Math.abs(value) >= 1_000_000) {
        return `${formatNumber(value / 1_000_000, 2)} M ${currencyCode}`;
    }

    if (Math.abs(value) >= 1_000) {
        return `${formatNumber(value / 1_000, 1)} mil ${currencyCode}`;
    }

    return formatCurrency(value, currencyCode);
}

function formatDate(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;

    return new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'medium',
    }).format(date);
}

function periodLabel(period: string): string {
    const labels: Record<string, string> = {
        D1: '1 día',
        W1: '1 semana',
        M1: '1 mes',
        M3: '3 meses',
        M6: '6 meses',
        M12: '1 año',
        M24: '2 años',
        M36: '3 años',
        M48: '4 años',
        M60: '5 años',
        M84: '7 años',
        M255: 'Desde inicio',
    };

    return labels[period] ?? period;
}

function findPoint(points: FinectMetricPoint[], period: string, type?: string): number | undefined {
    return points.find((point) => point.period === period && (!type || point.type === type))?.value;
}

function isRequestCancelled(error: unknown): boolean {
    return error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError');
}

function Metric({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
    return (
        <div className="fund-info__metric">
            <span className="fund-info__metric-label">{label}</span>
            <strong className="fund-info__metric-value">{value}</strong>
            {detail && <span className="fund-info__metric-detail">{detail}</span>}
        </div>
    );
}

function InfoItem({ label, value }: { label: string; value?: ReactNode }) {
    return (
        <div className="fund-info__data-item">
            <span>{label}</span>
            <strong>{value ?? '—'}</strong>
        </div>
    );
}

function Section({ icon, title, children, className = '' }: {
    icon: ReactNode;
    title: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={`fund-info__section ${className}`}>
            <div className="fund-info__section-heading">
                <span className="fund-info__section-icon">{icon}</span>
                <h2>{title}</h2>
            </div>
            {children}
        </section>
    );
}

function RiskLevel({ level }: { level: number }) {
    const band = riskBands[level];
    if (!band) return <span className="fund-info__badge">Riesgo {level}/7</span>;

    const tooltipId = `fund-info-risk-tooltip-${level}`;
    const tooltipText = `Riesgo ${level} de 7. Volatilidad anualizada: ${band.range}`;

    return (
        <span className="fund-info__risk-help">
            <button
                type="button"
                className="fund-info__risk-trigger"
                aria-describedby={tooltipId}
                title={tooltipText}
            >
                Riesgo {level}/7
                <Info size={14} aria-hidden="true" />
            </button>
            <span id={tooltipId} className="fund-info__risk-tooltip" role="tooltip">
                <strong>Riesgo {level}/7</strong>
                <span>Volatilidad: {band.range}</span>
                <small>{band.explanation} Es una referencia histórica y no predice pérdidas ni rentabilidades futuras.</small>
            </span>
        </span>
    );
}

function FeeItem({ label, value }: { label: string; value: number | undefined }) {
    if (value === undefined) return null;

    return (
        <div className="fund-info__fee-item">
            <span>{label}</span>
            <strong>{formatPercentage(value)}</strong>
        </div>
    );
}

function BreakdownCard({ breakdown }: { breakdown: FinectBreakdown }) {
    const title = breakdownTitles[breakdown.type] ?? breakdown.type;

    return (
        <article className="fund-info__breakdown-card">
            <h3>{title}</h3>
            <div className="fund-info__breakdown-list">
                {breakdown.items.slice(0, 8).map((item) => (
                    <div className="fund-info__breakdown-item" key={`${breakdown.type}-${item.label}`}>
                        <div className="fund-info__breakdown-label">
                            <span>{item.label}</span>
                            <strong>{formatPercentage(item.value)}</strong>
                        </div>
                        <div className="fund-info__breakdown-track" aria-hidden="true">
                            <span style={{ width: `${Math.min(Math.max(item.value, 0), 100)}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </article>
    );
}

function StrategyText({ text }: { text: string }) {
    return (
        <div className="fund-info__long-text">
            {text.split(/\n+/).filter(Boolean).map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
            ))}
        </div>
    );
}

function FundResults({ fund }: { fund: FinectFundRelevance }) {
    const quoteDate = formatDate(fund.lastQuote?.datetime);
    const availableDate = formatDate(fund.availableDate);
    const currencyCode = fund.currencyCode ?? 'EUR';
    const annualizedThreeYears = findPoint(fund.performance, 'M36', 'annualized');
    const volatilityThreeYears = findPoint(fund.statistics.standardDeviation, 'M36');
    const ytdReturn = findPoint(fund.performance, 'M0', 'accumulated')
        ?? findPoint(fund.performance, 'YTD', 'accumulated');
    const statsWithData = STATISTIC_PERIODS.some((period) =>
        statisticRows.some(({ key }) => findPoint(fund.statistics[key], period) !== undefined),
    );
    const feeCount = Object.values(fund.fees).filter((value) => value !== undefined).length;

    return (
        <div className="fund-info__results">
            <section className="fund-info__fund-hero">
                <div className="fund-info__fund-hero-copy">
                    <div className="fund-info__badge-row">
                        {fund.category && <span className="fund-info__badge">{fund.category}</span>}
                        {fund.indexed !== undefined && (
                            <span className="fund-info__badge fund-info__badge--accent">
                                {fund.indexed ? 'Indexado' : 'Gestión activa'}
                            </span>
                        )}
                        {fund.srri !== undefined && <RiskLevel level={fund.srri} />}
                    </div>
                    <h2>{fund.name}</h2>
                    <p className="fund-info__class-name">{fund.className}</p>
                    <code>{fund.isin}</code>
                </div>
                <a
                    className="fund-info__source-link"
                    href={fund.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Ver ficha en Finect <ExternalLink size={16} />
                </a>
            </section>

            <Section icon={<Gauge size={20} />} title="Resumen de la clase">
                <div className="fund-info__metric-grid fund-info__metric-grid--summary">
                    <Metric
                        label="Último valor liquidativo"
                        value={fund.lastQuote?.price !== undefined ? formatCurrency(fund.lastQuote.price, currencyCode) : '—'}
                        detail={quoteDate ? `Dato de ${quoteDate}` : undefined}
                    />
                    <Metric
                        label="Variación diaria"
                        value={fund.lastQuote?.percentChange !== undefined
                            ? formatPercentage(fund.lastQuote.percentChange, true)
                            : '—'}
                        detail={fund.lastQuote?.change !== undefined
                            ? `${fund.lastQuote.change >= 0 ? '+' : ''}${formatCurrency(fund.lastQuote.change, currencyCode)}`
                            : undefined}
                    />
                    <Metric
                        label="Rentabilidad anualizada 3 años"
                        value={annualizedThreeYears !== undefined ? formatPercentage(annualizedThreeYears, true) : '—'}
                    />
                    <Metric
                        label="Rentabilidad YTD"
                        value={ytdReturn !== undefined ? formatPercentage(ytdReturn, true) : '—'}
                    />
                    <Metric
                        label="Volatilidad anualizada 3 años"
                        value={volatilityThreeYears !== undefined ? formatPercentage(volatilityThreeYears) : '—'}
                        detail="Desviación estándar histórica"
                    />
                </div>
            </Section>

            <Section icon={<FileText size={20} />} title="Ficha del producto">
                <div className="fund-info__data-grid">
                    <InfoItem label="ISIN" value={<code>{fund.isin}</code>} />
                    <InfoItem label="Gestora" value={fund.manager} />
                    <InfoItem label="Divisa" value={fund.currencyName ? `${fund.currencyName} (${currencyCode})` : currencyCode} />
                    <InfoItem label="Benchmark" value={fund.benchmarks.join(', ') || undefined} />
                    <InfoItem label="Patrimonio del fondo" value={formatAssets(fund.totalNetAsset, currencyCode)} />
                    <InfoItem label="Patrimonio de la clase" value={formatAssets(fund.classTotalNetAsset, currencyCode)} />
                    <InfoItem label="Inversión mínima" value={fund.minimumInvestment !== undefined ? formatCurrency(fund.minimumInvestment, currencyCode) : undefined} />
                    <InfoItem label="Disponible desde" value={availableDate} />
                    <InfoItem label="Valoración Finect" value={fund.finectScore !== undefined ? `${formatNumber(fund.finectScore, 1)}/5` : undefined} />
                    <InfoItem label="Rating Morningstar" value={fund.morningstarRating !== undefined ? `${formatNumber(fund.morningstarRating, 0)}/5` : undefined} />
                </div>

                {fund.features.length > 0 && (
                    <div className="fund-info__features">
                        <span className="fund-info__subheading">Lecturas de Finect</span>
                        <div className="fund-info__feature-list">
                            {fund.features.map((feature) => (
                                <span className="fund-info__feature" key={feature.name}>
                                    <CheckCircle2 size={15} />
                                    {feature.name}{feature.score !== undefined ? ` · ${feature.score}/5` : ''}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </Section>

            {feeCount > 0 && (
                <Section icon={<Layers3 size={20} />} title="Costes de la clase">
                    <div className="fund-info__fee-grid">
                        <FeeItem label="TER" value={fund.fees.totalExpenseRatio} />
                        <FeeItem label="Comisión de gestión" value={fund.fees.management} />
                        <FeeItem label="Coste corriente" value={fund.fees.ongoing} />
                        <FeeItem label="Entrada" value={fund.fees.entry} />
                        <FeeItem label="Reembolso" value={fund.fees.redemption} />
                        <FeeItem label="Custodia" value={fund.fees.custody} />
                        <FeeItem label="Éxito" value={fund.fees.success} />
                    </div>
                </Section>
            )}

            {statsWithData && (
                <Section icon={<BarChart3 size={20} />} title="Riesgo y comportamiento histórico">
                    <div className="fund-info__table-wrapper">
                        <table className="fund-info__stats-table">
                            <caption className="fund-info__sr-only">Estadísticas históricas por periodo</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Métrica</th>
                                    {STATISTIC_PERIODS.map((period) => <th scope="col" key={period}>{periodLabel(period)}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {statisticRows.map(({ key, label, format }) => {
                                    const hasRowData = STATISTIC_PERIODS.some((period) => findPoint(fund.statistics[key], period) !== undefined);
                                    if (!hasRowData) return null;

                                    return (
                                        <tr key={key}>
                                            <th scope="row">{label}</th>
                                            {STATISTIC_PERIODS.map((period) => {
                                                const value = findPoint(fund.statistics[key], period);
                                                return (
                                                    <td key={`${key}-${period}`}>
                                                        {value === undefined
                                                            ? '—'
                                                            : format === 'percent' ? formatPercentage(value) : formatRatio(value)}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <p className="fund-info__table-note">
                        Las métricas proceden de Finect y corresponden al periodo disponible en su ficha; no son una previsión.
                    </p>
                </Section>
            )}

            {fund.breakdowns.length > 0 && (
                <Section icon={<TrendingUp size={20} />} title="Composición de la cartera">
                    <div className="fund-info__breakdown-grid">
                        {fund.breakdowns.map((breakdown) => <BreakdownCard key={breakdown.type} breakdown={breakdown} />)}
                    </div>
                </Section>
            )}

            {fund.holdings.length > 0 && (
                <Section icon={<ShieldCheck size={20} />} title="Principales posiciones">
                    <div className="fund-info__holdings-list">
                        {fund.holdings.map((holding) => (
                            <div className="fund-info__holding" key={holding.name}>
                                <span>{holding.name}</span>
                                <strong>{formatPercentage(holding.weight)}</strong>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {(fund.description || fund.strategy) && (
                <Section icon={<BookOpenText size={20} />} title="Descripción y estrategia">
                    {fund.description && <p className="fund-info__description">{fund.description}</p>}
                    {fund.strategy && <StrategyText text={fund.strategy} />}
                </Section>
            )}

            {fund.documents.length > 0 && (
                <Section icon={<FileText size={20} />} title="Documentación disponible">
                    <div className="fund-info__documents">
                        {fund.documents.map((document) => (
                            <a
                                className="fund-info__document"
                                href={document.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                key={`${document.type}-${document.url}`}
                            >
                                <FileText size={17} />
                                <span>
                                    <strong>{document.type}</strong>
                                    <small>{document.language ?? 'Documento'}{document.updated ? ` · actualizado ${formatDate(document.updated) ?? document.updated}` : ''}</small>
                                </span>
                                <ExternalLink size={15} />
                            </a>
                        ))}
                    </div>
                </Section>
            )}

            <div className="fund-info__result-footnote">
                <Info size={16} />
                <span>
                    Información orientativa consultada en Finect. Comprueba siempre la documentación oficial antes de tomar una decisión.
                </span>
            </div>
        </div>
    );
}

export function FundInformationCalculator() {
    const [isin, setIsin] = useState('');
    const [fund, setFund] = useState<FinectFundRelevance | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const requestRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => requestRef.current?.abort();
    }, []);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        requestRef.current?.abort();

        const controller = new AbortController();
        requestRef.current = controller;
        setLoading(true);
        setError('');
        setFund(null);

        try {
            const result = await getFundRelevance(isin, controller.signal);
            if (!controller.signal.aborted) setFund(result);
        } catch (requestError) {
            if (isRequestCancelled(requestError)) return;

            if (requestError instanceof FinectError) {
                setError(requestError.message);
            } else {
                setError('No se ha podido consultar Finect. Prueba de nuevo en unos segundos.');
            }
        } finally {
            if (requestRef.current === controller) {
                requestRef.current = null;
                setLoading(false);
            }
        }
    };

    return (
        <div className="fund-info">
            <header className="fund-info__header">
                <h1>Información de fondo por ISIN</h1>
                <p>
                    Pega el ISIN de una clase de fondo para consultar su ficha pública de Finect y revisar sus datos más relevantes.
                </p>
            </header>

            <section className="fund-info__search-card">
                <div className="fund-info__search-title">
                    <Search size={20} />
                    <div>
                        <h2>Busca una clase concreta</h2>
                        <p>La consulta comprueba el ISIN exacto para no confundir divisa o cobertura.</p>
                    </div>
                </div>

                <form className="fund-info__form" onSubmit={handleSubmit}>
                    <Input
                        label="ISIN del fondo"
                        value={isin}
                        onChange={(event) => setIsin(event.target.value.toUpperCase())}
                        placeholder="Ejemplo: IE00BYX5NX33"
                        maxLength={14}
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        icon={<FileSearch size={18} />}
                        error={error && error.includes('ISIN válido') ? error : undefined}
                    />
                    <Button
                        type="submit"
                        size="lg"
                        loading={loading}
                        disabled={!isin.trim()}
                        icon={<Sparkles size={18} />}
                    >
                        Consultar Finect
                    </Button>
                </form>

                <div className="fund-info__sample">
                    <span>¿Quieres probarla?</span>
                    <button type="button" onClick={() => setIsin(SAMPLE_ISIN)}>{SAMPLE_ISIN}</button>
                </div>
            </section>

            {error && !error.includes('ISIN válido') && (
                <div className="fund-info__alert" role="alert">
                    <CircleAlert size={19} />
                    <span>{error}</span>
                </div>
            )}

            {loading && (
                <div className="fund-info__loading" role="status" aria-live="polite">
                    <span className="fund-info__loading-spinner" />
                    <span>Consultando la ficha pública de Finect…</span>
                </div>
            )}

            {fund ? (
                <FundResults fund={fund} />
            ) : !loading && !error ? (
                <section className="fund-info__empty-state">
                    <div className="fund-info__empty-icon"><Search size={28} /></div>
                    <h2>Introduce un ISIN para empezar</h2>
                    <p>Verás identidad de la clase, costes, riesgo, rentabilidades, composición y documentación cuando estén disponibles.</p>
                </section>
            ) : null}
        </div>
    );
}
