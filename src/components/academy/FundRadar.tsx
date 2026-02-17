import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, Filter, ExternalLink, Info,
    ArrowLeft, Landmark, Award, BarChart3,
    ChevronDown, ChevronUp
} from 'lucide-react';
import { BEST_FUNDS } from '../../data/academyData';
import type { Fund } from '../../types/types';
import './FundRadar.css';

interface FundCardProps {
    fund: Fund;
    getRiskColor: (risk: number) => string;
    isExpanded: boolean;
    onToggle: () => void;
}

function FundCard({ fund, getRiskColor, isExpanded, onToggle }: FundCardProps) {
    return (
        <div className={`fund-card ${isExpanded ? 'fund-card--expanded' : ''}`} onClick={onToggle}>
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
                            <span className={`fund-stat__value ${fund.returns.ytd >= 0 ? 'pos' : 'neg'}`}>
                                {fund.returns.ytd > 0 ? '+' : ''}{fund.returns.ytd}%
                            </span>
                        </div>
                        <div className="fund-stat">
                            <span className="fund-stat__label">Rent. 1Y</span>
                            <span className={`fund-stat__value ${fund.returns.y1 >= 0 ? 'pos' : 'neg'}`}>
                                {fund.returns.y1 > 0 ? '+' : ''}{fund.returns.y1}%
                            </span>
                        </div>
                        <div className="fund-stat fund-stat--highlight">
                            <span className="fund-stat__label">Volatilidad</span>
                            <span className="fund-stat__value">{fund.volatility}%</span>
                        </div>
                        <div className="fund-stat">
                            <span className="fund-stat__label">Máx. Caída</span>
                            <span className="fund-stat__value neg">{fund.maxDrawdown}%</span>
                        </div>
                        <div className="fund-stat">
                            <span className="fund-stat__label">TER (Costes)</span>
                            <span className="fund-stat__value">{fund.ter}%</span>
                        </div>
                        {fund.yieldToMaturity !== undefined && (
                            <div className="fund-stat">
                                <span className="fund-stat__label">Yield (TIR)</span>
                                <span className="fund-stat__value pos">{fund.yieldToMaturity}%</span>
                            </div>
                        )}
                        {fund.rating && (
                            <div className="fund-stat">
                                <span className="fund-stat__label">Rating</span>
                                <span className="fund-stat__value">{fund.rating}</span>
                            </div>
                        )}
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
                                    <span className={`fund-stat__value ${fund.returns.y3 >= 0 ? 'pos' : 'neg'}`}>
                                        {fund.returns.y3 > 0 ? '+' : ''}{fund.returns.y3}%
                                    </span>
                                </div>
                            )}
                            {fund.returns.y5 !== undefined && (
                                <div className="fund-stat">
                                    <span className="fund-stat__label">Rent. 5Y (An.)</span>
                                    <span className={`fund-stat__value ${fund.returns.y5 >= 0 ? 'pos' : 'neg'}`}>
                                        {fund.returns.y5 > 0 ? '+' : ''}{fund.returns.y5}%
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

export function FundRadar() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('Todas');
    const [allExpanded, setAllExpanded] = useState(false);

    const categories = useMemo(() => {
        const cats = new Set(BEST_FUNDS.map(fund => fund.category));
        const sortedCats = Array.from(cats).sort((a, b) => {
            // Prioritize "Monetario"
            if (a.includes('Monetario') && !b.includes('Monetario')) return -1;
            if (!a.includes('Monetario') && b.includes('Monetario')) return 1;
            // Prioritize Mixed/Defensive
            if (a.includes('Mixto') && !b.includes('Mixto')) return -1;
            if (!a.includes('Mixto') && b.includes('Mixto')) return 1;
            return a.localeCompare(b);
        });
        return ['Todas', ...sortedCats];
    }, []);

    const filteredFunds = useMemo(() => {
        return BEST_FUNDS.filter(fund => {
            const matchesSearch = fund.name.toLowerCase().includes(search.toLowerCase()) ||
                fund.isin.toLowerCase().includes(search.toLowerCase()) ||
                fund.manager.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = activeCategory === 'Todas' || fund.category === activeCategory;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => {
            // Sort by risk (Monetary -> RF -> Mixed -> Equity) then by volatility
            if (a.risk !== b.risk) return a.risk - b.risk;
            return a.volatility - b.volatility;
        });
    }, [search, activeCategory]);

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
                <div className="fund-radar__icon-wrapper">
                    <Award size={48} />
                </div>
                <h1>Radar de Fondos de Inversión</h1>
                <p>
                    Usa esta herramienta para comparar instrumentos de inversión reales.
                    Ordenados por perfil de riesgo y volatilidad.
                </p>
                <div className="fund-radar__srri-info">
                    <Info size={14} />
                    <span>El <strong>SRRI</strong> (1-7) indica el riesgo histórico. A mayor número, más volatilidad.</span>
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
                        {allExpanded ? 'Colapsar Todos' : 'Expandir Todos'}
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
                <div className="info-box">
                    <div className="info-icon-wrapper">
                        <Info size={24} />
                    </div>
                    <div className="info-text">
                        <p>
                            Los datos se basan en registros históricos de Finect.
                            Usa las métricas de <strong>Sharpe</strong> y <strong>Drawdown</strong> para entender mejor la eficiencia de cada gestor.
                        </p>
                        <span className="disclaimer">Rentabilidades pasadas no garantizan retornos futuros.</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
