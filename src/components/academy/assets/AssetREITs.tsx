import { Link } from 'react-router-dom';
import {
    Building2, ArrowLeft, Globe, Zap, CheckCircle2, AlertTriangle,
    Lightbulb, Home, Building, Factory, Truck, Shield
} from 'lucide-react';
import './AssetPage.css';

const REIT_TYPES = [
    {
        title: 'Residencial',
        desc: 'Alquiler de apartamentos, residencias de estudiantes y viviendas unifamiliares.',
        examples: ['Equity Residential', 'AvalonBay Communities'],
        icon: Home,
        color: '#3b82f6'
    },
    {
        title: 'Oficinas',
        desc: 'Gestión de edificios corporativos en centros de negocios (CBD).',
        examples: ['Boston Properties', 'Cousins Properties'],
        icon: Building,
        color: '#10b981'
    },
    {
        title: 'Industrial y Logística',
        desc: 'Almacenes y centros de distribución para e-commerce. Alta demanda actual.',
        examples: ['Prologis', 'Segro'],
        icon: Factory,
        color: '#f59e0b'
    },
    {
        title: 'Retail / Centros Comerciales',
        desc: 'Locales comerciales y grandes superficies de ocio y compras.',
        examples: ['Realty Income', 'Simon Property Group'],
        icon: Truck,
        color: '#ef4444'
    }
];

export function AssetREITs() {
    return (
        <div className="asset-page">
            <Link to="/academy/portfolio" className="asset-page__back">
                <ArrowLeft size={18} /> Volver a Carteras
            </Link>

            <header className="asset-page__hero" style={{ '--hero-color': '#8b5cf6' } as React.CSSProperties}>
                <div className="asset-page__hero-icon">
                    <Building2 size={48} />
                </div>
                <h1>Real Estate (REITs)</h1>
                <p className="asset-page__hero-sub">
                    Inversión inmobiliaria profesional con la liquidez de una acción. Descubre cómo
                    generar rentas periódicas sin las complicaciones de gestionar un piso.
                </p>
                <div className="asset-page__hero-stats">
                    <div className="hero-stat">
                        <span className="hero-stat__value">6-8%</span>
                        <span className="hero-stat__label">Retorno histórico total</span>
                    </div>
                    <div className="hero-stat">
                        <span className="hero-stat__value">12-18%</span>
                        <span className="hero-stat__label">Volatilidad</span>
                    </div>
                    <div className="hero-stat">
                        <span className="hero-stat__value">5+ años</span>
                        <span className="hero-stat__label">Horizonte recomendado</span>
                    </div>
                </div>
            </header>

            <section className="asset-page__section">
                <h2><Globe size={22} /> ¿Qué son los REITs?</h2>
                <div className="asset-page__text-block">
                    <p>
                        Los <strong>REITs</strong> (Real Estate Investment Trusts), conocidos en España como <strong>SOCIMIs</strong>,
                        son empresas que poseen, operan o financian bienes raíces que generan ingresos.
                    </p>
                    <p>
                        A diferencia de la inversión tradicional en ladrillo, los REITs se compran y venden en bolsa
                        como cualquier acción. Esto permite al pequeño inversor participar de grandes proyectos
                        inmobiliarios (rascacielos, centros logísticos, hospitales) con capitales muy reducidos.
                    </p>
                </div>

                <div className="asset-page__callout asset-page__callout--info">
                    <Lightbulb size={20} />
                    <div>
                        <strong>La Regla del 90%</strong>
                        <p>Por ley, los REITs deben repartir al menos el 90% de sus beneficios imponibles en forma de dividendos a sus accionistas. Esto los convierte en activos ideales para quienes buscan flujo de caja.</p>
                    </div>
                </div>
            </section>

            <section className="asset-page__section">
                <h2><Building size={22} /> Sectores Inmobiliarios</h2>
                <div className="asset-page__subtype-grid">
                    {REIT_TYPES.map((type) => (
                        <div key={type.title} className="subtype-card" style={{ '--subtype-color': type.color } as React.CSSProperties}>
                            <div className="subtype-card__header">
                                <type.icon size={24} color={type.color} />
                                <h3>{type.title}</h3>
                            </div>
                            <p className="subtype-card__desc">{type.desc}</p>
                            <div className="subtype-card__examples">
                                <span className="subtype-card__tag-label">Principales REITs:</span>
                                <div className="subtype-card__tags">
                                    {type.examples.map((ex, i) => (
                                        <span key={i} className="subtype-card__tag">{ex}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="asset-page__section">
                <h2><Shield size={22} /> Ventajas y Riesgos</h2>
                <div className="asset-page__pros-cons">
                    <div className="pc-column pc-column--pros">
                        <h3><CheckCircle2 size={18} /> Ventajas</h3>
                        <ul>
                            <li>Alta yield (dividendos constantes y crecientes)</li>
                            <li>Protección natural contra la inflación vía rentas</li>
                            <li>Diversificación geográfica y sectorial masiva</li>
                            <li>Liquidez inmediata (vendes en segundos, no meses)</li>
                            <li>Sin costes de mantenimiento ni gestión de inquilinos</li>
                        </ul>
                    </div>
                    <div className="pc-column pc-column--cons">
                        <h3><AlertTriangle size={18} /> Riesgos</h3>
                        <ul>
                            <li>Muy sensibles a subidas de tipos de interés</li>
                            <li>Ciclos inmobiliarios largos y a veces volátiles</li>
                            <li>Correlación media-alta con la bolsa en grandes crisis</li>
                            <li>Fiscalidad de dividendos (no son tan eficientes como fondos de acumulación)</li>
                            <li>Riesgo de concentración si el sector elegido sufre (ej. oficinas post-COVID)</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="asset-page__section">
                <h2><Zap size={22} /> ¿Cómo invertir profesionalmente?</h2>
                <div className="asset-page__steps">
                    <div className="step-card">
                        <div className="step-card__number">1</div>
                        <h4>ETFs de REITs Globales</h4>
                        <p>Inviertes en cientos de inmobiliarias de todo el mundo en un solo clic. Máxima diversificación.</p>
                        <span className="step-card__badge step-card__badge--recommended">Recomendado</span>
                    </div>
                    <div className="step-card">
                        <div className="step-card__number">2</div>
                        <h4>REITs Individuales</h4>
                        <p>Solo para quienes quieren elegir sectores específicos (ej. Logística o centros de datos).</p>
                    </div>
                </div>
            </section>

            <section className="asset-page__final-tip">
                <Lightbulb size={28} />
                <div>
                    <h3>Consejo Final</h3>
                    <p>
                        Los REITs son el complemento perfecto para una cartera diversificada, aportando una descorrelación
                        parcial con las acciones tradicionales y un flujo de caja real. <strong>Un 5-10% de exposición
                            suele ser suficiente para la mayoría de perfiles.</strong>
                    </p>
                </div>
            </section>
        </div>
    );
}
