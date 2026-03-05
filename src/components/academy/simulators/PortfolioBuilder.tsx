import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
    TrendingUp,
    Shield,
    Wallet,
    Building2,
    Coins,
    PieChart as PieChartIcon,
    ArrowRight,
    Scale,
    Landmark,
    Target,
    Lightbulb,
    TrendingDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './PortfolioBuilder.css';

type CategoryId = 'classic' | 'strategic' | 'objective';
type Horizon = 'short' | 'medium' | 'long';
type Style = 'balanced' | 'index' | 'macro' | 'asymmetric' | 'income' | 'sustainable';
type RiskAppetite = 'conservative' | 'moderate' | 'aggressive';

type PortfolioModel = {
    category: CategoryId;
    title: string;
    desc: string;
    data: Array<{ name: string; value: number; color: string }>;
    highlight?: string;
    horizons: Horizon[];
    styles: Style[];
    risk: RiskAppetite[];
};

const HORIZON_FILTERS: Array<{ value: 'all' | Horizon; label: string }> = [
    { value: 'all', label: 'Cualquiera' },
    { value: 'short', label: 'Corto (0-3 años)' },
    { value: 'medium', label: 'Medio (3-10 años)' },
    { value: 'long', label: 'Largo (+10 años)' }
];

const STYLE_FILTERS: Array<{ value: 'all' | Style; label: string }> = [
    { value: 'all', label: 'Cualquiera' },
    { value: 'balanced', label: 'Balanceada' },
    { value: 'index', label: 'Indexada' },
    { value: 'macro', label: 'Macro/Defensiva' },
    { value: 'asymmetric', label: 'Asimétrica' },
    { value: 'income', label: 'Rentas/Dividendos' },
    { value: 'sustainable', label: 'Sostenible (ESG)' }
];

const RISK_FILTERS: Array<{ value: 'all' | RiskAppetite; label: string }> = [
    { value: 'all', label: 'Cualquiera' },
    { value: 'conservative', label: 'Conservador' },
    { value: 'moderate', label: 'Moderado' },
    { value: 'aggressive', label: 'Agresivo' }
];

const ASSET_CLASSES = [
    {
        name: 'Renta Variable (Acciones)',
        icon: TrendingUp,
        color: '#3b82f6',
        desc: 'Representan la propiedad de una empresa. Ofrecen el mayor potencial de crecimiento a largo plazo, pero con mayor volatilidad.',
        risk: 'Alto',
        return: '7-10% (histórico)',
        path: '/academy/assets/equities'
    },
    {
        name: 'Renta Fija (Bonos)',
        icon: Landmark,
        color: '#10b981',
        desc: 'Préstamos a gobiernos o empresas. Actúan como el "seguro" de tu cartera, reduciendo la volatilidad y aportando estabilidad.',
        risk: 'Bajo/Medio',
        return: '2-10% (histórico)',
        path: '/academy/assets/bonds'
    },
    {
        name: 'Liquidez (Cash)',
        icon: Wallet,
        color: '#64748b',
        desc: 'Efectivo, cuentas remuneradas o fondos monetarios. Máxima seguridad y disponibilidad, pero riesgo de perder poder adquisitivo por inflación.',
        risk: 'Muy Bajo',
        return: '0-2%',
        path: '/academy/assets/cash'
    },
    {
        name: 'Real Estate (REITs)',
        icon: Building2,
        color: '#8b5cf6',
        desc: 'Inversión en bienes inmuebles a través de fondos cotizados. Gran protección contra la inflación y rentas periódicas.',
        risk: 'Medio/Alto',
        return: '6-8%',
        path: '/academy/assets/reits'
    },
    {
        name: 'Criptoactivos',
        icon: Coins,
        color: '#f59e0b',
        desc: 'Activos digitales descentralizados. Altísima volatilidad y riesgo, pero descorrelacionados con el mercado tradicional.',
        risk: 'Muy Alto',
        return: 'Incierto',
        path: '/academy/assets/crypto'
    }
];

const CATEGORIES = [
    { id: 'classic', name: 'Clásicas', color: '#3b82f6', icon: Landmark },
    { id: 'strategic', name: 'Estratégicas', color: '#8b5cf6', icon: Target },
    { id: 'objective', name: 'Por Objetivo', color: '#10b981', icon: PieChartIcon }
] as const;

const MODEL_PORTFOLIOS: PortfolioModel[] = [
    // CLÁSICAS
    {
        category: 'classic',
        title: 'Cartera 60/40 Clásica',
        desc: 'Balance directo para perfil moderado: acciones para crecer y bonos para amortiguar caídas.',
        data: [
            { name: 'Acciones', value: 60, color: '#3b82f6' },
            { name: 'Bonos', value: 40, color: '#10b981' }
        ],
        horizons: ['medium', 'long'],
        styles: ['balanced'],
        risk: ['moderate']
    },
    {
        category: 'classic',
        title: 'Cartera Permanente',
        desc: 'Cuatro bloques al 25% para resistir distintos escenarios sin necesidad de acertar el ciclo.',
        data: [
            { name: 'Acciones', value: 25, color: '#3b82f6' },
            { name: 'Bonos', value: 25, color: '#10b981' },
            { name: 'Oro', value: 25, color: '#f59e0b' },
            { name: 'Efectivo', value: 25, color: '#64748b' }
        ],
        horizons: ['short', 'medium', 'long'],
        styles: ['macro', 'balanced'],
        risk: ['conservative', 'moderate']
    },
    {
        category: 'classic',
        title: 'Bogleheads 3-Fund',
        desc: 'Indexación global en 3 fondos (USA + internacional + bonos) con foco en diversificación y comisiones bajas.',
        data: [
            { name: 'RV USA', value: 40, color: '#3b82f6' },
            { name: 'RV Int', value: 40, color: '#8b5cf6' },
            { name: 'Bonos', value: 20, color: '#10b981' }
        ],
        horizons: ['medium', 'long'],
        styles: ['index', 'balanced'],
        risk: ['moderate']
    },

    // ESTRATÉGICAS
    {
        category: 'strategic',
        title: 'Cartera Barbell (Estrategia Asimétrica)',
        desc: 'Mucho ultra-seguro y una parte pequeña muy agresiva para buscar opcionalidad sin arriesgar el conjunto.',
        data: [
            { name: 'Seguro (Monet/Bonos)', value: 85, color: '#10b981' },
            { name: 'Agresivo (Cripto/Growth)', value: 15, color: '#ef4444' }
        ],
        highlight: 'Funciona si respetas el tamaño de las apuestas.',
        horizons: ['medium', 'long'],
        styles: ['asymmetric'],
        risk: ['aggressive']
    },
    {
        category: 'strategic',
        title: 'All-Weather (Ray Dalio)',
        desc: 'Diversificación macro con más piezas y más peso en bonos; busca estabilidad entre regímenes.',
        data: [
            { name: 'Acciones', value: 30, color: '#3b82f6' },
            { name: 'Bonos LP', value: 40, color: '#10b981' },
            { name: 'Bonos MP', value: 15, color: '#6366f1' },
            { name: 'Oro', value: 7.5, color: '#f59e0b' },
            { name: 'Materias Primas', value: 7.5, color: '#8b5cf6' }
        ],
        horizons: ['short', 'medium', 'long'],
        styles: ['macro', 'balanced'],
        risk: ['conservative', 'moderate']
    },
    {
        category: 'strategic',
        title: 'Core-Satellite',
        desc: 'Núcleo indexado y satélites acotados: personalización sin perder el control del riesgo total.',
        data: [
            { name: 'Núcleo Indexado', value: 80, color: '#3b82f6' },
            { name: 'Small Caps', value: 10, color: '#8b5cf6' },
            { name: 'Satélites (Value/Cripto)', value: 10, color: '#f59e0b' }
        ],
        horizons: ['medium', 'long'],
        styles: ['index', 'asymmetric'],
        risk: ['moderate', 'aggressive']
    },
    {
        category: 'strategic',
        title: 'Risk Parity',
        desc: 'Asigna por contribución al riesgo, no por capital. El objetivo es equilibrar volatilidad entre bloques.',
        data: [
            { name: 'Bonos', value: 60, color: '#10b981' },
            { name: 'Acciones', value: 20, color: '#3b82f6' },
            { name: 'Mat. Primas', value: 10, color: '#8b5cf6' },
            { name: 'Oro', value: 10, color: '#f59e0b' }
        ],
        horizons: ['medium', 'long'],
        styles: ['macro'],
        risk: ['conservative', 'moderate']
    },
    {
        category: 'strategic',
        title: 'Cartera ESG',
        desc: 'Similar a una indexada global, pero filtrada por criterios ESG (ambiental, social y gobernanza).',
        data: [
            { name: 'Acciones ESG World', value: 80, color: '#10b981' },
            { name: 'Bonos Verdes', value: 20, color: '#8b5cf6' }
        ],
        horizons: ['medium', 'long'],
        styles: ['index', 'sustainable'],
        risk: ['moderate']
    },

    // POR OBJETIVO
    {
        category: 'objective',
        title: '100% Indexada Global',
        desc: 'Solo renta variable global (desarrollados + emergentes). Para horizontes largos y tolerancia alta a caídas.',
        data: [
            { name: 'RV Desarrollada', value: 85, color: '#3b82f6' },
            { name: 'RV Emergente', value: 15, color: '#8b5cf6' }
        ],
        horizons: ['long'],
        styles: ['index'],
        risk: ['aggressive']
    },
    {
        category: 'objective',
        title: 'Dividend Growth',
        desc: 'Prioriza flujo de caja y dividendos crecientes; suele sacrificar algo de crecimiento por estabilidad.',
        data: [
            { name: 'Acciones Dividendo', value: 75, color: '#3b82f6' },
            { name: 'REITs (Inmuebles)', value: 15, color: '#8b5cf6' },
            { name: 'Cash', value: 10, color: '#64748b' }
        ],
        horizons: ['medium', 'long'],
        styles: ['income'],
        risk: ['moderate']
    },
    {
        category: 'objective',
        title: 'Cartera Bucket (Cubos)',
        desc: 'Separa por horizontes (corto/medio/largo) para evitar vender en mal momento y tener liquidez cuando toca.',
        data: [
            { name: 'Liquidez (1-3 años)', value: 20, color: '#64748b' },
            { name: 'Medio Plazo (Bonos)', value: 30, color: '#10b981' },
            { name: 'Largo Plazo (Acciones)', value: 50, color: '#3b82f6' }
        ],
        horizons: ['short', 'medium', 'long'],
        styles: ['balanced'],
        risk: ['conservative', 'moderate']
    }
];

export function PortfolioBuilder() {
    const [horizonFilter, setHorizonFilter] = useState<'all' | Horizon>('all');
    const [styleFilter, setStyleFilter] = useState<'all' | Style>('all');
    const [riskFilter, setRiskFilter] = useState<'all' | RiskAppetite>('all');

    const hasActiveFilters = horizonFilter !== 'all' || styleFilter !== 'all' || riskFilter !== 'all';

    const filteredModels = useMemo(
        () => MODEL_PORTFOLIOS.filter((model) => {
            const horizonMatch = horizonFilter === 'all' || model.horizons.includes(horizonFilter);
            const styleMatch = styleFilter === 'all' || model.styles.includes(styleFilter);
            const riskMatch = riskFilter === 'all' || model.risk.includes(riskFilter);
            return horizonMatch && styleMatch && riskMatch;
        }),
        [horizonFilter, styleFilter, riskFilter]
    );

    const categoriesWithModels = useMemo(
        () => CATEGORIES.map((category) => ({
            ...category,
            models: filteredModels.filter((model) => model.category === category.id)
        })).filter((category) => category.models.length > 0),
        [filteredModels]
    );

    return (
        <div className="portfolio-builder">
            <header className="portfolio-builder__header">
                <h1 className="portfolio-builder__title">Construir tu Cartera</h1>
                <p className="portfolio-builder__subtitle">
                    La <strong>Asset Allocation</strong> (asignación de activos) es responsable del 90% de la variabilidad
                    de los retornos de tu cartera. Aprende a diseñar la tuya.
                </p>
            </header>

            <section className="portfolio-builder__intro">
                <h2 className="portfolio-builder__section-title">1. Los Ladrillos: Tipos de Activos</h2>
                <p className="portfolio-builder__section-hint">Pulsa en cada activo para profundizar en su funcionamiento</p>
                <div className="portfolio-builder__assets-grid">
                    {ASSET_CLASSES.map((asset) => (
                        <Link
                            key={asset.name}
                            to={asset.path}
                            className="asset-card asset-card--link"
                            style={{ '--asset-color': asset.color } as React.CSSProperties}
                        >
                            <div className="asset-card__clickable">
                                <div className="asset-card__header">
                                    <div className="asset-card__icon" style={{ backgroundColor: asset.color }}>
                                        <asset.icon size={24} />
                                    </div>
                                    <h3 className="asset-card__name">{asset.name}</h3>
                                    <ArrowRight size={20} className="asset-card__arrow-icon" />
                                </div>
                                <p className="asset-card__desc">{asset.desc}</p>
                                <div className="asset-card__stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Riesgo</span>
                                        <span className="stat-value">{asset.risk}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Retorno</span>
                                        <span className="stat-value">{asset.return}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="risk-guide">
                <h2 className="portfolio-builder__section-title">2. Alineación con tu Perfil</h2>
                <p>Tu cartera debe reflejar tu capacidad emocional y financiera para soportar caídas.</p>
                <div className="risk-guide__grid">
                    <div className="risk-item">
                        <Shield className="risk-item__icon" size={48} />
                        <h3 className="risk-item__name">Conservador</h3>
                        <p className="risk-item__allocation">20% RV / 80% RF</p>
                    </div>
                    <div className="risk-item">
                        <Scale className="risk-item__icon" size={48} />
                        <h3 className="risk-item__name">Moderado</h3>
                        <p className="risk-item__allocation">60% RV / 40% RF</p>
                    </div>
                    <div className="risk-item">
                        <TrendingDown className="risk-item__icon" size={48} />
                        <h3 className="risk-item__name">Agresivo</h3>
                        <p className="risk-item__allocation">100% RV / 0% RF</p>
                    </div>
                </div>
            </section>

            <section className="portfolio-builder__models-section">
                <h2 className="portfolio-builder__section-title">3. Modelos de Cartera</h2>
                <div className="portfolio-builder__filters">
                    <div className="portfolio-builder__filters-head">
                        <p>Filtra por perfil para ver las carteras más adecuadas para tu caso.</p>
                        <span>{filteredModels.length} de {MODEL_PORTFOLIOS.length} carteras visibles</span>
                    </div>

                    <div className="portfolio-builder__filter-row">
                        <span className="portfolio-builder__filter-label">Horizonte</span>
                        <div className="portfolio-builder__filter-options">
                            {HORIZON_FILTERS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`portfolio-builder__filter-chip ${horizonFilter === option.value ? 'portfolio-builder__filter-chip--active' : ''}`}
                                    onClick={() => setHorizonFilter(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="portfolio-builder__filter-row">
                        <span className="portfolio-builder__filter-label">Estilo</span>
                        <div className="portfolio-builder__filter-options">
                            {STYLE_FILTERS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`portfolio-builder__filter-chip ${styleFilter === option.value ? 'portfolio-builder__filter-chip--active' : ''}`}
                                    onClick={() => setStyleFilter(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="portfolio-builder__filter-row">
                        <span className="portfolio-builder__filter-label">Riesgo</span>
                        <div className="portfolio-builder__filter-options">
                            {RISK_FILTERS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`portfolio-builder__filter-chip ${riskFilter === option.value ? 'portfolio-builder__filter-chip--active' : ''}`}
                                    onClick={() => setRiskFilter(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            className="portfolio-builder__filters-reset"
                            onClick={() => {
                                setHorizonFilter('all');
                                setStyleFilter('all');
                                setRiskFilter('all');
                            }}
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>

                {categoriesWithModels.map(category => (
                    <div key={category.id} className="category-block">
                        <div className="category-header" style={{ borderColor: category.color }}>
                            <category.icon size={22} color={category.color} />
                            <h3 className="category-title" style={{ color: category.color }}>{category.name}</h3>
                        </div>

                        <div className="portfolio-builder__models">
                            {category.models.map((model) => (
                                <div key={model.title} className="model-card">
                                    <div className="model-card__content">
                                        <div className="model-card__header">
                                            <h3 className="model-card__title">{model.title}</h3>
                                            <p className="model-card__desc">{model.desc}</p>
                                        </div>

                                        <div className="model-card__chart">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={model.data}
                                                        innerRadius={55}
                                                        outerRadius={75}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {model.data.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'var(--bg-card)',
                                                            border: '1px solid var(--border-primary)',
                                                            borderRadius: '10px',
                                                            boxShadow: 'var(--shadow-md)',
                                                            color: 'var(--text-primary)'
                                                        }}
                                                        itemStyle={{ color: 'var(--text-primary)' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <div className="model-card__allocation">
                                            {model.data.map((item) => (
                                                <div key={item.name} className="alloc-row">
                                                    <span className="alloc-label">
                                                        <div className="alloc-dot" style={{ backgroundColor: item.color }} />
                                                        {item.name}
                                                    </span>
                                                    <span className="alloc-val">{item.value}%</span>
                                                </div>
                                            ))}
                                        </div>

                                        {model.highlight && (
                                            <div className="model-card__highlight">
                                                <Lightbulb size={16} />
                                                <p>{model.highlight}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredModels.length === 0 && (
                    <div className="portfolio-builder__empty">
                        <h3>No hay carteras para ese perfil</h3>
                        <p>Ajusta horizonte, estilo o nivel de riesgo para ampliar resultados.</p>
                    </div>
                )}
            </section>

            <section className="portfolio-builder__cta">
                <PieChartIcon className="risk-item__icon" size={48} />
                <h2 className="cta__title">¿Listo para simular la tuya?</h2>
                <p className="cta__desc">
                    Utiliza nuestro simulador avanzado para ver cómo se comportaría tu asignación ideal
                    históricamente y bajo diferentes escenarios de crisis.
                </p>
                <Link to="/academy/asset-allocation" className="cta__button">
                    Ir al Simulador
                </Link>
            </section>
        </div>
    );
}
