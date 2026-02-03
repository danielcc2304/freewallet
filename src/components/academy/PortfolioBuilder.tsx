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
    Landmark
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './PortfolioBuilder.css';

const ASSET_CLASSES = [
    {
        name: 'Renta Variable (Acciones)',
        icon: TrendingUp,
        color: '#3b82f6',
        desc: 'Representan la propiedad de una empresa. Ofrecen el mayor potencial de crecimiento a largo plazo, pero con mayor volatilidad.',
        risk: 'Alto',
        return: '7-10% (histórico)'
    },
    {
        name: 'Renta Fija (Bonos)',
        icon: Landmark,
        color: '#10b981',
        desc: 'Préstamos a gobiernos o empresas. Actúan como el "seguro" de tu cartera, reduciendo la volatilidad y aportando estabilidad.',
        risk: 'Bajo/Medio',
        return: '2-4% (histórico)'
    },
    {
        name: 'Liquidez (Cash)',
        icon: Wallet,
        color: '#64748b',
        desc: 'Efectivo, cuentas remuneradas o fondos monetarios. Máxima seguridad y disponibilidad, pero riesgo de perder poder adquisitivo por inflación.',
        risk: 'Muy Bajo',
        return: '0-2%'
    },
    {
        name: 'Real Estate (REITs)',
        icon: Building2,
        color: '#8b5cf6',
        desc: 'Inversión en bienes inmuebles a través de fondos cotizados. Gran protección contra la inflación y rentas periódicas.',
        risk: 'Medio/Alto',
        return: '6-8%'
    },
    {
        name: 'Criptoactivos',
        icon: Coins,
        color: '#f59e0b',
        desc: 'Activos digitales descentralizados. Altísima volatilidad y riesgo, pero descorrelacionados con el mercado tradicional.',
        risk: 'Muy Alto',
        return: 'Impredecible'
    }
];

const MODEL_PORTFOLIOS = [
    {
        title: 'Cartera 60/40 Clásica',
        desc: 'El estándar de oro para inversores moderados durante décadas. Equilibra crecimiento y protección.',
        data: [
            { name: 'Acciones', value: 60, color: '#3b82f6' },
            { name: 'Bonos', value: 40, color: '#10b981' }
        ]
    },
    {
        title: 'Cartera Permanente',
        desc: 'Diseñada por Harry Browne para prosperar en cualquier escenario económico (deflación, inflación, crecimiento o crisis).',
        data: [
            { name: 'Acciones', value: 25, color: '#3b82f6' },
            { name: 'Bonos', value: 25, color: '#10b981' },
            { name: 'Oro', value: 25, color: '#f59e0b' },
            { name: 'Efectivo', value: 25, color: '#64748b' }
        ]
    },
    {
        title: 'Bogleheads 3-Fund',
        desc: 'Máxima simplicidad y eficiencia. Cubre todo el mercado mundial con comisiones mínimas.',
        data: [
            { name: 'RV USA', value: 40, color: '#3b82f6' },
            { name: 'RV Int', value: 40, color: '#8b5cf6' },
            { name: 'Bonos', value: 20, color: '#10b981' }
        ]
    }
];

export function PortfolioBuilder() {
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
                <div className="portfolio-builder__assets-grid">
                    {ASSET_CLASSES.map((asset) => (
                        <div key={asset.name} className="asset-card">
                            <div className="asset-card__header">
                                <div className="asset-card__icon" style={{ backgroundColor: asset.color }}>
                                    <asset.icon size={24} />
                                </div>
                                <h3 className="asset-card__name">{asset.name}</h3>
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
                        <TrendingUp className="risk-item__icon" size={48} />
                        <h3 className="risk-item__name">Agresivo</h3>
                        <p className="risk-item__allocation">100% RV / 0% RF</p>
                    </div>
                </div>
            </section>

            <section className="portfolio-builder__models-section">
                <h2 className="portfolio-builder__section-title">3. Modelos Históricos Notables</h2>
                <div className="portfolio-builder__models">
                    {MODEL_PORTFOLIOS.map((model) => (
                        <div key={model.title} className="model-card">
                            <div>
                                <h3 className="model-card__title">{model.title}</h3>
                                <p className="model-card__desc">{model.desc}</p>
                            </div>
                            <div className="model-card__chart">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={model.data}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {model.data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
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
                        </div>
                    ))}
                </div>
            </section>

            <section className="portfolio-builder__cta">
                <PieChartIcon className="risk-item__icon" size={48} />
                <h2 className="cta__title">¿Listo para simular la tuya?</h2>
                <p className="cta__desc">
                    Usa nuestra herramienta interactiva para jugar con diferentes porcentajes
                    y ver el riesgo y retorno estimado de tu propia estrategia.
                </p>
                <Link to="/academy/asset-allocation" className="cta__button">
                    Ir al Simulador de Allocation <ArrowRight size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
                </Link>
            </section>
        </div>
    );
}
