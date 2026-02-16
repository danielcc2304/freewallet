import { useState } from 'react';
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
    ChevronDown,
    CheckCircle2,
    AlertTriangle,
    Zap,
    Globe,
    Clock
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
        return: '7-10% (histórico)',
        detail: {
            whatIs: 'Comprar acciones es ser copropietario de una empresa. Cuando la empresa crece en valor, tus acciones se revalorizan. Muchas además reparten dividendos (una parte de los beneficios).',
            examples: ['ETF MSCI World (iShares, Vanguard)', 'ETF S&P 500 (SPY, VOO)', 'ETF Europa (Vanguard FTSE Europe)', 'Acciones individuales (Apple, LVMH…)'],
            pros: ['Mayor rentabilidad histórica a largo plazo', 'Protección contra la inflación', 'Liquidez inmediata en mercados cotizados', 'Posibilidad de dividendos periódicos'],
            cons: ['Alta volatilidad: caídas del 30-50% son normales', 'Requiere horizonte mínimo de 7-10 años', 'Riesgo de pérdida permanente en acciones individuales', 'Puede generar estrés emocional en crisis'],
            tip: 'Para la mayoría de inversores, un ETF indexado global es la mejor forma de acceder a acciones. Evita stock-picking si no tienes experiencia.',
            metrics: { volatilidad: 'Alta (15-20% anual)', liquidez: 'Muy Alta', horizonte: '7+ años', correlación: 'Referencia (1.0)' }
        }
    },
    {
        name: 'Renta Fija (Bonos)',
        icon: Landmark,
        color: '#10b981',
        desc: 'Préstamos a gobiernos o empresas. Actúan como el "seguro" de tu cartera, reduciendo la volatilidad y aportando estabilidad.',
        risk: 'Bajo/Medio',
        return: '2-4% (histórico)',
        detail: {
            whatIs: 'Cuando compras un bono, estás prestando dinero a un gobierno o empresa a cambio de un interés fijo (cupón) durante un plazo determinado. Al vencimiento, te devuelven el capital.',
            examples: ['Bonos del Tesoro Español', 'Letras del Tesoro (corto plazo)', 'ETF iShares Core Euro Govt Bond', 'Bonos corporativos (investment grade)', 'Bonos high yield (más riesgo/rentabilidad)'],
            pros: ['Estabilidad y previsibilidad de rentas', 'Menor volatilidad que las acciones', 'Diversificación: históricamente baja correlación con RV', 'Protección parcial en caídas bursátiles'],
            cons: ['Rentabilidad real baja (puede no superar inflación)', 'Sensibles a subidas de tipos de interés', 'Riesgo de crédito en emisores privados', 'Bonos a largo plazo pueden ser muy volátiles'],
            tip: 'Diferencia entre bonos de corto plazo (más estables) y largo plazo (más sensibles a tipos). En entornos de tipos altos, las letras y bonos cortos son refugio efectivo.',
            metrics: { volatilidad: 'Baja-Media (3-8%)', liquidez: 'Alta', horizonte: '1-5 años', correlación: 'Baja con RV (-0.2 a 0.3)' }
        }
    },
    {
        name: 'Liquidez (Cash)',
        icon: Wallet,
        color: '#64748b',
        desc: 'Efectivo, cuentas remuneradas o fondos monetarios. Máxima seguridad y disponibilidad, pero riesgo de perder poder adquisitivo por inflación.',
        risk: 'Muy Bajo',
        return: '0-2%',
        detail: {
            whatIs: 'Incluye dinero en efectivo, depósitos bancarios, cuentas remuneradas y fondos monetarios. Es la parte más accesible y segura de tu cartera, pero la que menos crece.',
            examples: ['Cuentas remuneradas (Trade Republic, MyInvestor)', 'Fondos monetarios (Groupama, BNP Paribas)', 'Depósitos bancarios a plazo fijo', 'Letras del Tesoro a 3-6 meses'],
            pros: ['Disponibilidad inmediata', 'Sin volatilidad (valor estable)', 'Perfecto para fondo de emergencia', 'Permite aprovechar oportunidades si el mercado cae'],
            cons: ['La inflación erosiona su valor real cada año', 'Coste de oportunidad: el dinero parado no trabaja', 'Rentabilidad real frecuentemente negativa', 'Tentación de gastar si está muy accesible'],
            tip: 'Mantén entre 3-6 meses de gastos en liquidez como fondo de emergencia. Todo lo que exceda eso probablamente debería estar invertido.',
            metrics: { volatilidad: 'Nula', liquidez: 'Máxima', horizonte: 'Inmediato', correlación: 'Nula (0.0)' }
        }
    },
    {
        name: 'Real Estate (REITs)',
        icon: Building2,
        color: '#8b5cf6',
        desc: 'Inversión en bienes inmuebles a través de fondos cotizados. Gran protección contra la inflación y rentas periódicas.',
        risk: 'Medio/Alto',
        return: '6-8%',
        detail: {
            whatIs: 'Los REITs (Real Estate Investment Trusts) son fondos que poseen y gestionan inmuebles (oficinas, centros comerciales, residencias, logística…). Se compran como una acción pero representan propiedad inmobiliaria diversificada.',
            examples: ['Vanguard Real Estate ETF (VNQ)', 'iShares Developed Markets Property Yield', 'Amundi FTSE EPRA/NAREIT Global', 'Prologis (logística), Realty Income (comercial)'],
            pros: ['Exposición inmobiliaria sin gestionar propiedades', 'Dividendos elevados (obligados a repartir >90% beneficios)', 'Protección natural contra la inflación', 'Diversificación respecto a acciones y bonos tradicionales'],
            cons: ['Sensibles a subidas de tipos de interés', 'Correlación media-alta con RV en crisis', 'Fiscalidad de dividendos puede ser desfavorable', 'Ciclos inmobiliarios pueden ser largos'],
            tip: 'Los REITs globales ofrecen la mejor diversificación. No confundas invertir en REITs con comprar un piso: la liquidez y diversificación son incomparables.',
            metrics: { volatilidad: 'Media-Alta (12-18%)', liquidez: 'Alta (cotizado)', horizonte: '5+ años', correlación: 'Media con RV (0.5-0.7)' }
        }
    },
    {
        name: 'Criptoactivos',
        icon: Coins,
        color: '#f59e0b',
        desc: 'Activos digitales descentralizados. Altísima volatilidad y riesgo, pero descorrelacionados con el mercado tradicional.',
        risk: 'Muy Alto',
        return: 'Impredecible',
        detail: {
            whatIs: 'Activos digitales basados en blockchain. Bitcoin es la reserva de valor digital; Ethereum la plataforma de contratos inteligentes. Miles de proyectos más, la mayoría especulativos.',
            examples: ['Bitcoin (BTC) — oro digital', 'Ethereum (ETH) — plataforma smart contracts', 'ETFs de Bitcoin Spot (BlackRock, Fidelity)', 'Stablecoins (USDC, USDT) para yield farming'],
            pros: ['Descorrelación potencial con mercados tradicionales', 'Rentabilidad explosiva histórica (Bitcoin)', 'Accesibilidad 24/7, sin intermediarios', 'Opcionalidad sobre tecnología disruptiva (blockchain)'],
            cons: ['Volatilidad extrema (caídas del 70-80% son normales)', 'Riesgo regulatorio y de fraude', 'Custodia compleja y riesgo de hackeo', 'La mayoría de altcoins pierden todo su valor a largo plazo'],
            tip: 'Si inviertes en cripto, limítalo al 5-15% de tu cartera como máximo. Solo Bitcoin y Ethereum tienen track record significativo. Nunca inviertas lo que no puedas perder.',
            metrics: { volatilidad: 'Extrema (50-80% anual)', liquidez: 'Alta (24/7)', horizonte: 'Incierto', correlación: 'Variable (0.0-0.5)' }
        }
    }
];

const CATEGORIES = [
    { id: 'classic', name: 'Clásicas', color: '#3b82f6', icon: Landmark },
    { id: 'strategic', name: 'Estratégicas', color: '#8b5cf6', icon: Target },
    { id: 'objective', name: 'Por Objetivo', color: '#10b981', icon: PieChartIcon }
];

const MODEL_PORTFOLIOS = [
    // CLÁSICAS
    {
        category: 'classic',
        title: 'Cartera 60/40 Clásica',
        desc: 'El estándar de oro para inversores moderados durante décadas. Equilibra crecimiento y protección.',
        data: [
            { name: 'Acciones', value: 60, color: '#3b82f6' },
            { name: 'Bonos', value: 40, color: '#10b981' }
        ]
    },
    {
        category: 'classic',
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
        category: 'classic',
        title: 'Bogleheads 3-Fund',
        desc: 'Máxima simplicidad y eficiencia. Cubre todo el mercado mundial con comisiones mínimas.',
        data: [
            { name: 'RV USA', value: 40, color: '#3b82f6' },
            { name: 'RV Int', value: 40, color: '#8b5cf6' },
            { name: 'Bonos', value: 20, color: '#10b981' }
        ]
    },

    // ESTRATÉGICAS
    {
        category: 'strategic',
        title: 'Cartera Barbell (Estrategia Asimétrica)',
        desc: 'Extremos y nada en el centro. Combina activos ultra seguros con apuestas agresivas para ser antifrágil.',
        data: [
            { name: 'Seguro (Monet/Bonos)', value: 85, color: '#10b981' },
            { name: 'Agresivo (Cripto/Growth)', value: 15, color: '#ef4444' }
        ],
        highlight: 'Ideal para mentalidad estratégica y opcionalidad explosiva.'
    },
    {
        category: 'strategic',
        title: 'All-Weather (Ray Dalio)',
        desc: 'Diseñada para rendir en cualquier entorno macro (inflación, deflación, crecimiento, recesión).',
        data: [
            { name: 'Acciones', value: 30, color: '#3b82f6' },
            { name: 'Bonos LP', value: 40, color: '#10b981' },
            { name: 'Bonos MP', value: 15, color: '#6366f1' },
            { name: 'Oro', value: 7.5, color: '#f59e0b' },
            { name: 'Materias Primas', value: 7.5, color: '#8b5cf6' }
        ]
    },
    {
        category: 'strategic',
        title: 'Core-Satellite',
        desc: 'Base sólida indexada con pequeñas apuestas personales. Disciplina con un toque de personalización.',
        data: [
            { name: 'Núcleo Indexado', value: 80, color: '#3b82f6' },
            { name: 'Small Caps', value: 10, color: '#8b5cf6' },
            { name: 'Satélites (Value/Cripto)', value: 10, color: '#f59e0b' }
        ]
    },
    {
        category: 'strategic',
        title: 'Risk Parity',
        desc: 'Asigna por contribución al riesgo, no por capital. Busca un balance real de volatilidad entre activos.',
        data: [
            { name: 'Bonos', value: 60, color: '#10b981' },
            { name: 'Acciones', value: 20, color: '#3b82f6' },
            { name: 'Mat. Primas', value: 10, color: '#8b5cf6' },
            { name: 'Oro', value: 10, color: '#f59e0b' }
        ]
    },
    {
        category: 'strategic',
        title: 'Cartera ESG',
        desc: 'Enfocada en impacto positivo. Sigue criterios Ambientales, Sociales y de Gobernanza sin renunciar al mercado.',
        data: [
            { name: 'Acciones ESG World', value: 80, color: '#10b981' },
            { name: 'Bonos Verdes', value: 20, color: '#8b5cf6' }
        ]
    },

    // POR OBJETIVO
    {
        category: 'objective',
        title: '100% Indexada Global',
        desc: 'Simplicidad brutal. Todo el mercado mundial en un solo clic. Para horizontes de muy largo plazo (>20 años).',
        data: [
            { name: 'RV Desarrollada', value: 85, color: '#3b82f6' },
            { name: 'RV Emergente', value: 15, color: '#8b5cf6' }
        ]
    },
    {
        category: 'objective',
        title: 'Dividend Growth',
        desc: 'Enfocada en flujo de caja creciente. Psicológicamente atractiva para el perfil FIRE.',
        data: [
            { name: 'Acciones Dividendo', value: 75, color: '#3b82f6' },
            { name: 'REITs (Inmuebles)', value: 15, color: '#8b5cf6' },
            { name: 'Cash', value: 10, color: '#64748b' }
        ]
    },
    {
        category: 'objective',
        title: 'Cartera Bucket (Cubos)',
        desc: 'Divide el dinero por horizonte temporal del objetivo. Claridad mental sobre la volatilidad.',
        data: [
            { name: 'Liquidez (1-3 años)', value: 20, color: '#64748b' },
            { name: 'Medio Plazo (Bonos)', value: 30, color: '#10b981' },
            { name: 'Largo Plazo (Acciones)', value: 50, color: '#3b82f6' }
        ]
    }
];

export function PortfolioBuilder() {
    const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

    const toggleAsset = (name: string) => {
        setExpandedAsset(prev => prev === name ? null : name);
    };

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
                <p className="portfolio-builder__section-hint">Pulsa en cada activo para descubrir más detalles</p>
                <div className="portfolio-builder__assets-grid">
                    {ASSET_CLASSES.map((asset) => {
                        const isExpanded = expandedAsset === asset.name;
                        return (
                            <div
                                key={asset.name}
                                className={`asset-card ${isExpanded ? 'asset-card--expanded' : ''}`}
                                style={{ '--asset-color': asset.color } as React.CSSProperties}
                            >
                                <div
                                    className="asset-card__clickable"
                                    onClick={() => toggleAsset(asset.name)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && toggleAsset(asset.name)}
                                >
                                    <div className="asset-card__header">
                                        <div className="asset-card__icon" style={{ backgroundColor: asset.color }}>
                                            <asset.icon size={24} />
                                        </div>
                                        <h3 className="asset-card__name">{asset.name}</h3>
                                        <ChevronDown
                                            size={20}
                                            className={`asset-card__chevron ${isExpanded ? 'asset-card__chevron--open' : ''}`}
                                        />
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

                                {/* Expandable detail panel */}
                                <div className={`asset-detail ${isExpanded ? 'asset-detail--open' : ''}`}>
                                    <div className="asset-detail__inner">
                                        {/* What is it */}
                                        <div className="asset-detail__section">
                                            <h4 className="asset-detail__heading">
                                                <Globe size={16} /> ¿Qué es exactamente?
                                            </h4>
                                            <p>{asset.detail.whatIs}</p>
                                        </div>

                                        {/* Examples */}
                                        <div className="asset-detail__section">
                                            <h4 className="asset-detail__heading">
                                                <Zap size={16} /> Ejemplos concretos
                                            </h4>
                                            <ul className="asset-detail__list">
                                                {asset.detail.examples.map((ex, i) => (
                                                    <li key={i}>{ex}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Pros & Cons side by side */}
                                        <div className="asset-detail__pros-cons">
                                            <div className="asset-detail__section asset-detail__section--pros">
                                                <h4 className="asset-detail__heading asset-detail__heading--pros">
                                                    <CheckCircle2 size={16} /> Ventajas
                                                </h4>
                                                <ul className="asset-detail__list asset-detail__list--pros">
                                                    {asset.detail.pros.map((pro, i) => (
                                                        <li key={i}>{pro}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="asset-detail__section asset-detail__section--cons">
                                                <h4 className="asset-detail__heading asset-detail__heading--cons">
                                                    <AlertTriangle size={16} /> Riesgos
                                                </h4>
                                                <ul className="asset-detail__list asset-detail__list--cons">
                                                    {asset.detail.cons.map((con, i) => (
                                                        <li key={i}>{con}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Key Metrics */}
                                        <div className="asset-detail__section">
                                            <h4 className="asset-detail__heading">
                                                <Clock size={16} /> Métricas Clave
                                            </h4>
                                            <div className="asset-detail__metrics">
                                                {Object.entries(asset.detail.metrics).map(([key, val]) => (
                                                    <div key={key} className="asset-detail__metric">
                                                        <span className="asset-detail__metric-label">{key}</span>
                                                        <span className="asset-detail__metric-value">{val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Pro Tip */}
                                        <div className="asset-detail__tip">
                                            <Lightbulb size={18} />
                                            <div>
                                                <strong>Consejo</strong>
                                                <p>{asset.detail.tip}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
                <h2 className="portfolio-builder__section-title">3. Modelos de Cartera</h2>

                {CATEGORIES.map(category => (
                    <div key={category.id} className="category-block">
                        <div className="category-header" style={{ borderColor: category.color }}>
                            <category.icon size={22} color={category.color} />
                            <h3 className="category-title" style={{ color: category.color }}>{category.name}</h3>
                        </div>

                        <div className="portfolio-builder__models">
                            {MODEL_PORTFOLIOS.filter(m => m.category === category.id).map((model) => (
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
                                                            backgroundColor: 'var(--bg-secondary)',
                                                            borderColor: 'var(--border-color)',
                                                            borderRadius: '8px',
                                                            color: 'var(--text-primary)'
                                                        }}
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
