import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, Filter, ExternalLink, Info,
    ArrowLeft, Landmark, Award, BarChart3,
    ChevronDown, ChevronUp, Star, Trophy
} from 'lucide-react';
import { BEST_FUNDS } from '../../data/academyData';
import type { Fund } from '../../types/types';
import './FundRadar.css';

interface FundCardProps {
    fund: Fund;
    getRiskColor: (risk: number) => string;
    isExpanded: boolean;
    onToggle: () => void;
    score: number;
    rank?: number;
}

const formatPercent = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return { text: '—', className: '' };
    const formatted = val.toFixed(2);
    const sign = val > 0 ? '+' : '';
    const className = val > 0 ? 'pos' : val < 0 ? 'neg' : '';
    return { text: `${sign}${formatted}%`, className };
};

function FundCard({ fund, getRiskColor, isExpanded, onToggle, score, rank }: FundCardProps) {
    return (
        <div className={`fund-card ${isExpanded ? 'fund-card--expanded' : ''} ${rank === 1 ? 'fund-card--gold' : ''}`} onClick={onToggle}>
            {rank && rank <= 3 && (
                <div className={`fund-card__rank-badge rank-${rank}`}>
                    <Trophy size={14} />
                    <span>Top {rank}</span>
                </div>
            )}

            <div className="fund-card__header">
                <div className="fund-card__title-row">
                    <span className="fund-card__category">{fund.category}</span>
                    <div className="fund-card__risk" style={{ background: getRiskColor(fund.risk) }}>
                        Riesgo SRRI {fund.risk}
                    </div>
                </div>
                <h3 className="fund-card__name">{fund.name}</h3>
                <div className="fund-card__meta">
                    <div className="fund-card__isin">
                        <Landmark size={12} />
                        <span>{fund.isin}</span>
                    </div>
                    {isExpanded && fund.aum && (
                        <div className="fund-card__aum">
                            <BarChart3 size={12} />
                            <span>Patr: {fund.aum}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="fund-card__body">
                <div className="fund-card__summary">
                    <div className="fund-card__metrics-grid">
                        <div className="fund-stat">
                            <span className="fund-stat__label">Rent. YTD</span>
                            <span className={`fund-stat__value ${formatPercent(fund.returns.ytd).className}`}>
                                {formatPercent(fund.returns.ytd).text}
                            </span>
                        </div>
                        <div className="fund-stat">
                            <span className="fund-stat__label">Rent. 1Y</span>
                            <span className={`fund-stat__value ${formatPercent(fund.returns.y1).className}`}>
                                {formatPercent(fund.returns.y1).text}
                            </span>
                        </div>
                        <div className="fund-stat fund-stat--highlight">
                            <span className="fund-stat__label">Volatilidad</span>
                            <span className="fund-stat__value">{fund.volatility}%</span>
                        </div>
                        <div className="fund-stat">
                            <span className="fund-stat__label">Máx. Caída</span>
                            <span className={`fund-stat__value ${formatPercent(fund.maxDrawdown).className}`}>
                                {formatPercent(fund.maxDrawdown).text}
                            </span>
                        </div>
                        <div className="fund-stat">
                            <span className="fund-stat__label">TER (Costes)</span>
                            <span className="fund-stat__value">{fund.ter}%</span>
                        </div>
                        <div className="fund-stat fund-stat--score">
                            <span className="fund-stat__label">Puntuación</span>
                            <span className="fund-stat__value score">{score.toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <div className="fund-card__expanded-content">
                        <div className="expanded-divider">Analítica Avanzada</div>

                        <div className="fund-card__metrics-grid">
                            <div className="fund-stat">
                                <span className="fund-stat__label">Sharpe Ratio</span>
                                <span className="fund-stat__value">{fund.sharpe ?? '--'}</span>
                            </div>
                            {fund.returns.y3 !== undefined && (
                                <div className="fund-stat">
                                    <span className="fund-stat__label">Rent. 3Y (An.)</span>
                                    <span className={`fund-stat__value ${formatPercent(fund.returns.y3).className}`}>
                                        {formatPercent(fund.returns.y3).text}
                                    </span>
                                </div>
                            )}
                            {fund.returns.y5 !== undefined && (
                                <div className="fund-stat">
                                    <span className="fund-stat__label">Rent. 5Y (An.)</span>
                                    <span className={`fund-stat__value ${formatPercent(fund.returns.y5).className}`}>
                                        {formatPercent(fund.returns.y5).text}
                                    </span>
                                </div>
                            )}
                            {fund.duration !== undefined && (
                                <div className="fund-stat">
                                    <span className="fund-stat__label">Duración</span>
                                    <span className="fund-stat__value">{fund.duration}y</span>
                                </div>
                            )}
                        </div>

                        {fund.allocation && fund.allocation.length > 0 && (
                            <div className="fund-card__allocation">
                                <h4 className="section-title">Distribución de Cartera</h4>
                                <div className="allocation-bar">
                                    {fund.allocation.map((item, i) => (
                                        <div
                                            key={i}
                                            className="allocation-segment"
                                            style={{ width: `${item.value}%`, backgroundColor: `hsl(${i * 60 + 200}, 70%, 45%)` }}
                                        />
                                    ))}
                                </div>
                                <div className="allocation-labels">
                                    {fund.allocation.map((item, i) => (
                                        <span key={i} className="alloc-label">
                                            {item.label} <strong>{item.value}%</strong>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <p className="fund-card__desc">{fund.description}</p>
                    </div>
                )}
            </div>

            <div className="fund-card__footer">
                <div className="fund-card__toggle-hint">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span>{isExpanded ? 'Menos info' : 'Análisis completo'}</span>
                </div>
                <div className="fund-card__actions">
                    <a
                        href={fund.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="fund-card__link"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Finect <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        </div>
    );
}

const clamp = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));

const percentile = (arr: number[], p: number) => {
    if (arr.length === 0) return 0;
    const a = [...arr].sort((x, y) => x - y);
    const idx = (a.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return a[lo];
    return a[lo] + (a[hi] - a[lo]) * (idx - lo);
};

const calculateRawScore = (f: Fund) => {
    const y5 = f.returns.y5 ?? f.returns.y3 ?? f.returns.y1;
    const y3 = f.returns.y3 ?? f.returns.y1;
    const R = 0.6 * y5 + 0.4 * y3;

    const vol = f.volatility ?? NaN;
    const dd = f.maxDrawdown !== undefined ? Math.abs(f.maxDrawdown) : NaN;

    // Missing-data penalty suave: si falta, usa un valor neutral (0) pero con pequeño castigo fijo
    const volTerm = Number.isFinite(vol) ? vol : 0;
    const ddTerm = Number.isFinite(dd) ? dd : 0;
    const missingPenalty = (!Number.isFinite(vol) ? 0.75 : 0) + (!Number.isFinite(dd) ? 0.75 : 0);

    return R - 0.30 * volTerm - 0.10 * ddTerm - 2 * f.ter - missingPenalty;
};

export function FundRadar() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('Todas');
    const [allExpanded, setAllExpanded] = useState(false);

    const categories = useMemo(() => {
        const cats = new Set(BEST_FUNDS.map(fund => fund.category));
        const sortedCats = Array.from(cats).sort((a, b) => {
            if (a.includes('Monetario') && !b.includes('Monetario')) return -1;
            if (!a.includes('Monetario') && b.includes('Monetario')) return 1;
            if (a.includes('Mixto') && !b.includes('Mixto')) return -1;
            if (!a.includes('Mixto') && b.includes('Mixto')) return 1;
            return a.localeCompare(b);
        });
        return ['Todas', ...sortedCats];
    }, []);

    const processedFunds = useMemo(() => {
        // 1. Calcular Score Bruto
        const scored = BEST_FUNDS.map(f => ({ fund: f, raw: calculateRawScore(f) }));

        // 2. Normalizar 0–100 por categoría con winsorization p5–p95
        const catStats = new Map<string, { p5: number; p95: number; min: number; max: number; size: number }>();
        const uniqueCats = Array.from(new Set(scored.map(x => x.fund.category)));

        uniqueCats.forEach(cat => {
            const raws = scored.filter(x => x.fund.category === cat).map(x => x.raw);
            const p5 = percentile(raws, 0.05);
            const p95 = percentile(raws, 0.95);

            const clipped = raws.map(r => clamp(r, p5, p95));
            const min = Math.min(...clipped);
            const max = Math.max(...clipped);

            catStats.set(cat, { p5, p95, min, max, size: raws.length });
        });

        // 3. Precalcular Ranks por categoría
        const rankMaps = new Map<string, Map<string, number>>();
        uniqueCats.forEach(cat => {
            const catRankMap = new Map<string, number>();
            scored
                .filter(item => item.fund.category === cat)
                .sort((a, b) => b.raw - a.raw)
                .forEach((item, index) => {
                    catRankMap.set(item.fund.id, index + 1);
                });
            rankMaps.set(cat, catRankMap);
        });

        return scored.map(({ fund, raw }) => {
            const stats = catStats.get(fund.category)!;
            const clipped = clamp(raw, stats.p5, stats.p95);

            // Si hay un solo fondo o todos son iguales, score = 100
            let finalScore = 100;
            if (stats.size > 1 && stats.max !== stats.min) {
                const denom = stats.max - stats.min;
                const score01 = (clipped - stats.min) / denom;

                if (stats.size < 4) {
                    // Escala comprimida 40-100 para evitar que el 'peor' de una muestra pequeña parezca un 0
                    finalScore = 40 + (score01 * 60);
                } else {
                    finalScore = score01 * 100;
                }
            }

            const rank = rankMaps.get(fund.category)?.get(fund.id) || 999;

            return {
                ...fund,
                calculatedScore: finalScore,
                rank
            };
        });
    }, []);

    const filteredFunds = useMemo(() => {
        return processedFunds.filter(fund => {
            const matchesSearch = fund.name.toLowerCase().includes(search.toLowerCase()) ||
                fund.isin.toLowerCase().includes(search.toLowerCase()) ||
                fund.manager.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = activeCategory === 'Todas' || fund.category === activeCategory;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => {
            // Default sort by category priority, then by rank within category
            if (a.category !== b.category) {
                const cats = categories.slice(1);
                return cats.indexOf(a.category) - cats.indexOf(b.category);
            }
            return a.rank - b.rank;
        });
    }, [search, activeCategory, processedFunds, categories]);

    const getRiskColor = (risk: number) => {
        if (risk <= 2) return '#10b981';
        if (risk <= 4) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="fund-radar">
            <Link to="/academy" className="fund-radar__back">
                <ArrowLeft size={18} /> Volver a la Academia
            </Link>

            <header className="fund-radar__header">

                <h1>Ranking de Fondos por Categorías</h1>
                <div className="fund-radar__last-update">
                    <Star size={12} />
                    <span>Última actualización: 17 de Febrero del 2026</span>
                </div>
                <p>
                    Clasificamos cada fondo mediante una métrica de eficiencia que considera
                    rentabilidad a largo plazo, riesgo gestionado y costes.
                </p>
                <div className="fund-radar__srri-info">
                    <Star size={14} />
                    <span>Esta puntuación es un <strong>análisis cuantitativo</strong> basado en datos históricos. No constituye una recomendación de compra.</span>
                </div>
            </header>

            <div className="fund-radar__filters">
                <div className="fund-radar__search-row">
                    <div className="fund-radar__search">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, ISIN o gestora..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        className={`expand-all-btn ${allExpanded ? 'active' : ''}`}
                        onClick={() => setAllExpanded(!allExpanded)}
                    >
                        {allExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {allExpanded ? 'Colapsar Detalles' : 'Ver Análisis Avanzado'}
                    </button>
                </div>

                <div className="fund-radar__categories">
                    <Filter size={16} />
                    <div className="categories-list">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="fund-radar__grid">
                {filteredFunds.map(fund => (
                    <FundCard
                        key={fund.id}
                        fund={fund}
                        getRiskColor={getRiskColor}
                        isExpanded={allExpanded}
                        onToggle={() => setAllExpanded(!allExpanded)}
                        score={fund.calculatedScore}
                        rank={fund.rank}
                    />
                ))}
            </div>

            {filteredFunds.length === 0 && (
                <div className="fund-radar__empty">
                    <Info size={48} />
                    <p>No se han encontrado fondos con esos criterios.</p>
                </div>
            )}

            <footer className="fund-radar__footer-info">
                <div className="info-box info-box--formula">
                    <div className="info-text">
                        <p><strong>Fórmula de Eficiencia:</strong> Siendo y5/y3 las rentabilidades anualizadas.</p>
                        <code className="formula-code">Score (Winsorized) = Normalización p5–p95 por Categoría</code>
                        <p className="formula-note">Penalización suave por datos faltantes y recorte de outliers. Costes (TER) ponderados a 2x para priorizar eficiencia operativa sin castigar en exceso la gestión activa.</p>
                    </div>
                </div>

                <div className="info-box">
                    <div className="info-icon-wrapper">
                        <Info size={24} />
                    </div>
                    <div className="info-text">
                        <p>
                            Los datos se basan en registros históricos de Finect y Morningstar.
                            Las puntuaciones reflejan la eficiencia relativa del gestor dentro de su categoría de activos.
                        </p>
                        <span className="disclaimer">
                            <strong>Aviso Legal:</strong> Este ranking es exclusivamente informativo. FreeWallet no ofrece asesoramiento financiero.
                            La elección de cualquier producto de inversión debe basarse en un estudio personal y/o con un asesor certificado.
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
