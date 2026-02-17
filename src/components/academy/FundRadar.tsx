import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, Filter, ExternalLink, Info,
    ArrowLeft, Landmark, Award, BarChart3
} from 'lucide-react';
import { BEST_FUNDS } from '../../data/academyData';
import './FundRadar.css';

export function FundRadar() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('Todas');

    const categories = useMemo(() => {
        const cats = new Set(BEST_FUNDS.map(fund => fund.category));
        return ['Todas', ...Array.from(cats)].sort();
    }, []);

    const filteredFunds = useMemo(() => {
        return BEST_FUNDS.filter(fund => {
            const matchesSearch = fund.name.toLowerCase().includes(search.toLowerCase()) ||
                fund.isin.toLowerCase().includes(search.toLowerCase()) ||
                fund.manager.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = activeCategory === 'Todas' || fund.category === activeCategory;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => a.volatility - b.volatility);
    }, [search, activeCategory]);

    const getRiskColor = (risk: number) => {
        if (risk <= 2) return '#10b981'; // Green (Bajo)
        if (risk <= 4) return '#f59e0b'; // Amber (Medio)
        return '#ef4444'; // Red (Alto)
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
                    Una selección curada de los mejores instrumentos por categoría.
                    Listados de <strong>menor a mayor volatilidad</strong> para que elijas según tu perfil.
                </p>
                <div className="fund-radar__srri-info">
                    <Info size={14} />
                    <span>El <strong>SRRI</strong> es el Indicador Sintético de Riesgo (1-7). A mayor número, más riesgo pero más potencial de retorno.</span>
                </div>
            </header>

            <div className="fund-radar__filters">
                <div className="fund-radar__search">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, ISIN o gestora..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
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
                    <div key={fund.id} className="fund-card">
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
                                {fund.aum && (
                                    <div className="fund-card__aum">
                                        <BarChart3 size={12} />
                                        <span>Patr: {fund.aum}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="fund-card__body">
                            {/* 1. Métricas de Riesgo y Eficiencia */}
                            <div className="fund-card__metrics-section">
                                <h4 className="section-title">Análisis de Riesgo</h4>
                                <div className="fund-card__metrics-grid">
                                    <div className="fund-stat fund-stat--highlight">
                                        <span className="fund-stat__label">Volatilidad</span>
                                        <span className="fund-stat__value">{fund.volatility}%</span>
                                    </div>
                                    <div className="fund-stat">
                                        <span className="fund-stat__label">Máx. Caída</span>
                                        <span className="fund-stat__value neg">{fund.maxDrawdown}%</span>
                                    </div>
                                    <div className="fund-stat">
                                        <span className="fund-stat__label">Sharpe</span>
                                        <span className="fund-stat__value">{fund.sharpe ?? '--'}</span>
                                    </div>
                                    <div className="fund-stat">
                                        <span className="fund-stat__label">Costes (TER)</span>
                                        <span className="fund-stat__value">{fund.ter}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Métricas de Renta Fija (Si aplican) */}
                            {(fund.yieldToMaturity || fund.duration || fund.rating) && (
                                <div className="fund-card__metrics-section fund-card__metrics-section--rf">
                                    <h4 className="section-title">Métricas de Renta Fija</h4>
                                    <div className="fund-card__metrics-grid">
                                        <div className="fund-stat">
                                            <span className="fund-stat__label">TIR (Yield)</span>
                                            <span className="fund-stat__value pos">{fund.yieldToMaturity}%</span>
                                        </div>
                                        <div className="fund-stat">
                                            <span className="fund-stat__label">Duración</span>
                                            <span className="fund-stat__value">{fund.duration}y</span>
                                        </div>
                                        <div className="fund-stat">
                                            <span className="fund-stat__label">Rating</span>
                                            <span className="fund-stat__value">{fund.rating}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. Rentabilidades Históricas */}
                            <div className="fund-card__metrics-section">
                                <h4 className="section-title">Rentabilidades</h4>
                                <div className="fund-card__metrics-grid">
                                    <div className="fund-stat">
                                        <span className="fund-stat__label">1 Año</span>
                                        <span className={`fund-stat__value ${fund.returns.y1 >= 0 ? 'pos' : 'neg'}`}>
                                            {fund.returns.y1 > 0 ? '+' : ''}{fund.returns.y1}%
                                        </span>
                                    </div>
                                    <div className="fund-stat">
                                        <span className="fund-stat__label">3 Años (An.)</span>
                                        <span className={`fund-stat__value ${fund.returns.y3 >= 0 ? 'pos' : 'neg'}`}>
                                            {fund.returns.y3 > 0 ? '+' : ''}{fund.returns.y3}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Distribución / Asset Allocation */}
                            {fund.allocation && fund.allocation.length > 0 && (
                                <div className="fund-card__allocation">
                                    <h4 className="section-title">Distribución Principal</h4>
                                    <div className="allocation-bar">
                                        {fund.allocation.map((item, i) => (
                                            <div
                                                key={i}
                                                className="allocation-segment"
                                                style={{ width: `${item.value}%`, backgroundColor: `hsl(${i * 60 + 200}, 70%, 45%)` }}
                                                title={`${item.label}: ${item.value}%`}
                                            />
                                        ))}
                                    </div>
                                    <div className="allocation-labels">
                                        {fund.allocation.slice(0, 3).map((item, i) => (
                                            <span key={i} className="alloc-label">
                                                {item.label} <strong>{item.value}%</strong>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="fund-card__footer">
                            <div className="fund-card__manager">
                                <span className="manager-label">Gestora:</span>
                                <span className="manager-name">{fund.manager}</span>
                            </div>
                            <a
                                href={fund.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="fund-card__link"
                            >
                                Perfil Finect <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
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
                    <Info size={20} />
                    <p>
                        Los datos de rentabilidad y volatilidad son orientativos y se basan en registros históricos.
                        Rentabilidades pasadas no garantizan rentabilidades futuras. Datos actualizados vía Finect.
                    </p>
                </div>
            </footer>
        </div>
    );
}
