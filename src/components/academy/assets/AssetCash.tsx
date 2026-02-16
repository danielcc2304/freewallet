import { Link } from 'react-router-dom';
import {
    Wallet, ArrowLeft, Globe, Zap, CheckCircle2, AlertTriangle,
    Lightbulb, BarChart3, Clock, Shield
} from 'lucide-react';
import './AssetPage.css';

const CASH_INSTRUMENTS = [
    {
        name: 'Cuentas Remuneradas',
        yield: '2-3.5%',
        liquidity: 'Inmediata',
        risk: 'Mínimo',
        desc: 'Dinero disponible al instante con interés. Trade Republic, MyInvestor, Openbank ofrecen las mejores condiciones.',
        icon: '🏧',
        color: '#3b82f6'
    },
    {
        name: 'Fondos Monetarios',
        yield: '3-4%',
        liquidity: '1-2 días',
        risk: 'Mínimo',
        desc: 'Fondos que invierten en deuda a muy corto plazo. Rendimiento superior a depósitos, sin penalización por retirada.',
        icon: '💰',
        color: '#10b981'
    },
    {
        name: 'Depósitos a Plazo Fijo',
        yield: '2-3%',
        liquidity: 'Al vencimiento',
        risk: 'Mínimo',
        desc: 'Bloqueas tu dinero durante un plazo a cambio de un interés garantizado. Penalización si retiras antes.',
        icon: '🔒',
        color: '#8b5cf6'
    },
    {
        name: 'Letras del Tesoro (3-6m)',
        yield: '3-3.8%',
        liquidity: 'Al vencimiento',
        risk: 'Mínimo',
        desc: 'Máxima seguridad respaldada por el Estado. Se compran directamente en el Tesoro Público sin comisiones.',
        icon: '🏛️',
        color: '#f59e0b'
    }
];

export function AssetCash() {
    return (
        <div className="asset-page">
            <Link to="/academy/portfolio" className="asset-page__back">
                <ArrowLeft size={18} /> Volver a Carteras
            </Link>

            <header className="asset-page__hero" style={{ '--hero-color': '#64748b' } as React.CSSProperties}>
                <div className="asset-page__hero-icon">
                    <Wallet size={48} />
                </div>
                <h1>Liquidez (Cash)</h1>
                <p className="asset-page__hero-sub">
                    El oxígeno de tu cartera. La liquidez te da tranquilidad, capacidad de reacción ante oportunidades
                    y es el primer pilar de toda estrategia financiera sólida.
                </p>
                <div className="asset-page__hero-stats">
                    <div className="hero-stat">
                        <span className="hero-stat__value">0-4%</span>
                        <span className="hero-stat__label">Rendimiento actual</span>
                    </div>
                    <div className="hero-stat">
                        <span className="hero-stat__value">0%</span>
                        <span className="hero-stat__label">Volatilidad</span>
                    </div>
                    <div className="hero-stat">
                        <span className="hero-stat__value">Inmediato</span>
                        <span className="hero-stat__label">Disponibilidad</span>
                    </div>
                </div>
            </header>

            <section className="asset-page__section">
                <h2><Globe size={22} /> ¿Por qué tener Liquidez?</h2>
                <div className="asset-page__text-block">
                    <p>
                        La liquidez no es una inversión, es un <strong>colchón de seguridad</strong>. Su función no es
                        generar rentabilidad, sino <strong>darte estabilidad emocional y capacidad de respuesta</strong>.
                    </p>
                    <p>
                        Tener un fondo de emergencia evita que tengas que vender inversiones en el peor momento (cuando
                        el mercado ha caído) para cubrir gastos inesperados. Es la diferencia entre sobrevivir una crisis
                        y salir reforzado de ella.
                    </p>
                </div>

                <div className="asset-page__callout asset-page__callout--info">
                    <Lightbulb size={20} />
                    <div>
                        <strong>Regla de los 3-6 meses</strong>
                        <p>Mantén entre 3 y 6 meses de gastos indispensables en liquidez. Si tienes ingresos variables o eres autónomo, sube a 6-12 meses. Este colchón debe ser intocable salvo emergencias reales.</p>
                    </div>
                </div>
            </section>

            <section className="asset-page__section">
                <h2><BarChart3 size={22} /> Instrumentos de Liquidez</h2>
                <p className="asset-page__section-desc">No todo el cash es igual. Hay formas de mantener liquidez que rinden significativamente más que el dinero en una cuenta corriente.</p>

                <div className="asset-page__subtype-grid">
                    {CASH_INSTRUMENTS.map((inst) => (
                        <div key={inst.name} className="subtype-card" style={{ '--subtype-color': inst.color } as React.CSSProperties}>
                            <div className="subtype-card__header">
                                <span style={{ fontSize: '1.5rem' }}>{inst.icon}</span>
                                <h3>{inst.name}</h3>
                            </div>
                            <p className="subtype-card__desc">{inst.desc}</p>
                            <div className="subtype-card__footer">
                                <span>Yield: <strong>{inst.yield}</strong></span>
                                <span>Liquidez: <strong>{inst.liquidity}</strong></span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="asset-page__section">
                <h2><AlertTriangle size={22} /> El Enemigo Silencioso: La Inflación</h2>
                <div className="asset-page__text-block">
                    <p>
                        Si la inflación es del 3% y tu cuenta paga un 1%, estás <strong>perdiendo un 2% de poder adquisitivo cada año</strong>.
                        10.000€ hoy comprarán lo mismo que 8.170€ dentro de 10 años con inflación del 2%.
                    </p>
                </div>

                <div className="inflation-visual">
                    <h3>Erosión del poder adquisitivo: 10.000€ con inflación del 3%</h3>
                    <div className="inflation-bars">
                        {[
                            { year: 'Año 0', value: 10000, pct: 100 },
                            { year: 'Año 3', value: 9135, pct: 91 },
                            { year: 'Año 5', value: 8587, pct: 86 },
                            { year: 'Año 10', value: 7374, pct: 74 },
                            { year: 'Año 20', value: 5438, pct: 54 },
                            { year: 'Año 30', value: 4012, pct: 40 },
                        ].map(item => (
                            <div key={item.year} className="inflation-bar">
                                <span className="inflation-bar__label">{item.year}</span>
                                <div className="inflation-bar__track">
                                    <div className="inflation-bar__fill" style={{ width: `${item.pct}%` }} />
                                </div>
                                <span className="inflation-bar__value">{item.value.toLocaleString('es-ES')}€</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="asset-page__section">
                <h2><Shield size={22} /> Ventajas y Riesgos</h2>
                <div className="asset-page__pros-cons">
                    <div className="pc-column pc-column--pros">
                        <h3><CheckCircle2 size={18} /> Ventajas</h3>
                        <ul>
                            <li>Disponibilidad inmediata para emergencias</li>
                            <li>Sin volatilidad ni riesgo de mercado</li>
                            <li>Tranquilidad emocional en periodos de crisis</li>
                            <li>Permite aprovechar oportunidades de compra</li>
                            <li>Imprescindible como fondo de emergencia</li>
                        </ul>
                    </div>
                    <div className="pc-column pc-column--cons">
                        <h3><AlertTriangle size={18} /> Riesgos</h3>
                        <ul>
                            <li>Rentabilidad real frecuentemente negativa (inflación)</li>
                            <li>Coste de oportunidad: dinero que no trabaja para ti</li>
                            <li>Tentación de gastar si está demasiado accesible</li>
                            <li>Garantía de depósitos limitada a 100.000€ por entidad</li>
                            <li>Falsa sensación de seguridad (pierdes vs inflación)</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="asset-page__section">
                <h2><Clock size={22} /> Estrategia de Escalera (Ladder)</h2>
                <div className="asset-page__text-block">
                    <p>
                        Una forma inteligente de gestionar liquidez es crear una «escalera» de vencimientos.
                        Divides tu cash entre instrumentos con diferentes plazos para maximizar rentabilidad
                        sin perder accesibilidad total.
                    </p>
                </div>

                <div className="asset-page__steps">
                    <div className="step-card">
                        <div className="step-card__number">1</div>
                        <h4>Inmediato (33%)</h4>
                        <p>Cuenta remunerada para gastos inesperados. Disponibilidad instantánea.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-card__number">2</div>
                        <h4>3 meses (33%)</h4>
                        <p>Fondo monetario o Letras del Tesoro a 3 meses. Mejor rendimiento con alta liquidez.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-card__number">3</div>
                        <h4>6-12 meses (33%)</h4>
                        <p>Letras del Tesoro a 6-12 meses o depósito. Máximo rendimiento del cash.</p>
                    </div>
                </div>
            </section>

            <section className="asset-page__final-tip">
                <Lightbulb size={28} />
                <div>
                    <h3>Consejo Final</h3>
                    <p>
                        El cash no es una inversión, es un <strong>seguro</strong>. Tener demasiado te empobrece lentamente
                        (inflación), pero tener muy poco te obliga a malvender inversiones en el peor momento.
                        <strong> Encuentra tu equilibrio: 3-6 meses de gastos es la regla de oro.</strong>
                    </p>
                </div>
            </section>
        </div>
    );
}
