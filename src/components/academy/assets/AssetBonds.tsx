import { Link } from 'react-router-dom';
import {
    Landmark, ArrowLeft, Globe, Zap, CheckCircle2, AlertTriangle,
    Lightbulb, BarChart3, Clock, Shield, TrendingDown, TrendingUp, ArrowUpDown
} from 'lucide-react';
import './AssetPage.css';

const BOND_TYPES = [
    {
        title: 'Deuda Gubernamental',
        desc: 'Emitida por Estados soberanos. Es la forma más segura de renta fija. El riesgo depende del país emisor.',
        subtypes: [
            { name: 'Letras del Tesoro', duration: '3-18 meses', risk: 'Mínimo', desc: 'Corto plazo, muy seguras, ideal para liquidez' },
            { name: 'Bonos del Estado', duration: '2-5 años', risk: 'Bajo', desc: 'Plazo medio, cupón fijo periódico' },
            { name: 'Obligaciones del Estado', duration: '10-30 años', risk: 'Medio', desc: 'Largo plazo, mayor sensibilidad a tipos' },
            { name: 'TIPS / Bonos Ligados a Inflación', duration: 'Variable', risk: 'Bajo', desc: 'El principal se ajusta con la inflación' }
        ],
        color: '#3b82f6',
        icon: '🏛️'
    },
    {
        title: 'Deuda Corporativa (Investment Grade)',
        desc: 'Emitida por empresas con alta calificación crediticia (BBB o superior). Más rentable que la gubernamental, con riesgo moderado.',
        subtypes: [
            { name: 'Corporativos AAA/AA', duration: '1-10 años', risk: 'Bajo', desc: 'Empresas de máxima calidad (Apple, Microsoft)' },
            { name: 'Corporativos A/BBB', duration: '2-7 años', risk: 'Medio', desc: 'Buen equilibrio rendimiento/riesgo' }
        ],
        color: '#10b981',
        icon: '🏢'
    },
    {
        title: 'High Yield (Bonos Basura)',
        desc: 'Emitida por empresas con calificación inferior a BBB. Rentabilidades altas pero con riesgo real de impago.',
        subtypes: [
            { name: 'BB (Especulativo)', duration: '3-7 años', risk: 'Alto', desc: 'Frontera con investment grade' },
            { name: 'B o inferior', duration: '2-5 años', risk: 'Muy Alto', desc: 'Riesgo de default significativo' }
        ],
        color: '#ef4444',
        icon: '⚠️'
    },
    {
        title: 'Bonos Municipales y Supranacionales',
        desc: 'Emitidos por entidades públicas locales o instituciones internacionales (BEI, Banco Mundial). Generalmente exentos de ciertos impuestos.',
        subtypes: [
            { name: 'Bonos Municipales', duration: 'Variable', risk: 'Bajo-Medio', desc: 'Financian infraestructura local' },
            { name: 'Bonos Supranacionales', duration: '5-15 años', risk: 'Muy Bajo', desc: 'Respaldados por múltiples países' }
        ],
        color: '#8b5cf6',
        icon: '🌍'
    }
];

const YIELD_CURVE_SCENARIOS = [
    {
        name: 'Normal (Pendiente Positiva)',
        desc: 'Lo más habitual. Los bonos a largo plazo pagan más que los de corto plazo. Refleja expectativas de crecimiento económico sano.',
        visual: [1.5, 2.0, 2.8, 3.5, 4.0, 4.3],
        signal: '✅ Economía sana',
        color: '#10b981'
    },
    {
        name: 'Invertida (Pendiente Negativa)',
        desc: 'Señal de alarma histórica: los bonos a corto plazo pagan MÁS que los de largo. Predice recesiones con ~80% de acierto.',
        visual: [4.5, 4.2, 3.8, 3.2, 2.8, 2.5],
        signal: '🚨 Señal de recesión',
        color: '#ef4444'
    },
    {
        name: 'Plana',
        desc: 'Todas las duraciones pagan similar. Indica incertidumbre: el mercado no sabe si vendrá crecimiento o recesión.',
        visual: [3.0, 3.1, 3.0, 3.1, 3.0, 3.1],
        signal: '⚠️ Incertidumbre',
        color: '#f59e0b'
    }
];

const DURATION_LABELS = ['3m', '1a', '2a', '5a', '10a', '30a'];

export function AssetBonds() {
    return (
        <div className="asset-page">
            <Link to="/academy/portfolio" className="asset-page__back">
                <ArrowLeft size={18} /> Volver a Carteras
            </Link>

            <header className="asset-page__hero" style={{ '--hero-color': '#10b981' } as React.CSSProperties}>
                <div className="asset-page__hero-icon">
                    <Landmark size={48} />
                </div>
                <h1>Renta Fija (Bonos)</h1>
                <p className="asset-page__hero-sub">
                    El ancla de estabilidad de tu cartera. Comprende los tipos de bonos, cómo funcionan los tipos de interés,
                    y por qué la curva de tipos puede predecir recesiones.
                </p>
                <div className="asset-page__hero-stats">
                    <div className="hero-stat">
                        <span className="hero-stat__value">2-5%</span>
                        <span className="hero-stat__label">Retorno típico</span>
                    </div>
                    <div className="hero-stat">
                        <span className="hero-stat__value">3-8%</span>
                        <span className="hero-stat__label">Volatilidad</span>
                    </div>
                    <div className="hero-stat">
                        <span className="hero-stat__value">1-5 años</span>
                        <span className="hero-stat__label">Horizonte recomendado</span>
                    </div>
                </div>
            </header>

            {/* What is it */}
            <section className="asset-page__section">
                <h2><Globe size={22} /> ¿Qué es un Bono?</h2>
                <div className="asset-page__text-block">
                    <p>
                        Un bono es un <strong>préstamo que tú haces a un gobierno o empresa</strong>. A cambio, te pagan
                        un interés periódico (el <strong>cupón</strong>) y al vencimiento te devuelven el dinero prestado
                        (el <strong>nominal</strong>).
                    </p>
                    <p>
                        Es como ser el banco: tú prestas dinero y cobras intereses. La diferencia es que hay un mercado
                        secundario donde puedes comprar y vender bonos antes de su vencimiento. Aquí es donde entran
                        los conceptos de precio, yield y duración.
                    </p>
                </div>

                {/* Bond anatomy visual */}
                <div className="bond-anatomy">
                    <h3>Anatomía de un Bono</h3>
                    <div className="bond-anatomy__grid">
                        <div className="bond-anatomy__item">
                            <span className="bond-anatomy__label">Nominal (Face Value)</span>
                            <span className="bond-anatomy__value">1.000€</span>
                            <span className="bond-anatomy__desc">Lo que te devuelven al vencimiento</span>
                        </div>
                        <div className="bond-anatomy__item">
                            <span className="bond-anatomy__label">Cupón</span>
                            <span className="bond-anatomy__value">3.5%</span>
                            <span className="bond-anatomy__desc">Interés anual que recibes</span>
                        </div>
                        <div className="bond-anatomy__item">
                            <span className="bond-anatomy__label">Vencimiento</span>
                            <span className="bond-anatomy__value">10 años</span>
                            <span className="bond-anatomy__desc">Plazo hasta recuperar el nominal</span>
                        </div>
                        <div className="bond-anatomy__item">
                            <span className="bond-anatomy__label">Precio</span>
                            <span className="bond-anatomy__value">98.50</span>
                            <span className="bond-anatomy__desc">Lo que pagas hoy (puede ser {'≠'} 100)</span>
                        </div>
                        <div className="bond-anatomy__item">
                            <span className="bond-anatomy__label">Yield (TIR)</span>
                            <span className="bond-anatomy__value">3.67%</span>
                            <span className="bond-anatomy__desc">Rentabilidad real si mantienes a vencimiento</span>
                        </div>
                        <div className="bond-anatomy__item">
                            <span className="bond-anatomy__label">Rating</span>
                            <span className="bond-anatomy__value">AA+</span>
                            <span className="bond-anatomy__desc">Calidad crediticia del emisor</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Inverse relationship */}
            <section className="asset-page__section">
                <h2><ArrowUpDown size={22} /> La Regla de Oro: Precio vs Yield</h2>
                <div className="asset-page__text-block">
                    <p>
                        Esta es <strong>la relación más importante</strong> que debes entender sobre bonos:
                        cuando los tipos de interés <strong>suben</strong>, el precio de los bonos existentes <strong>baja</strong>, y viceversa.
                    </p>
                </div>

                <div className="inverse-relationship">
                    <div className="inverse-card inverse-card--up">
                        <TrendingUp size={32} />
                        <h4>Tipos Suben</h4>
                        <div className="inverse-card__arrow">→</div>
                        <TrendingDown size={32} />
                        <h4>Precio Baja</h4>
                        <p>Los bonos nuevos pagan más, así que los viejos pierden atractivo.</p>
                    </div>
                    <div className="inverse-card inverse-card--down">
                        <TrendingDown size={32} />
                        <h4>Tipos Bajan</h4>
                        <div className="inverse-card__arrow">→</div>
                        <TrendingUp size={32} />
                        <h4>Precio Sube</h4>
                        <p>Los bonos existentes con cupones altos se vuelven más valiosos.</p>
                    </div>
                </div>

                <div className="asset-page__callout asset-page__callout--info">
                    <Lightbulb size={20} />
                    <div>
                        <strong>¿Por qué importa?</strong>
                        <p>Si compras un bono a 10 años y los tipos suben un 2%, podrías ver una caída del ~15% en el precio de mercado de tu bono. Si lo mantienes a vencimiento, no importa (cobras cupón + nominal). Pero si necesitas vender antes, puedes perder dinero.</p>
                    </div>
                </div>
            </section>

            {/* Duration & Convexity */}
            <section className="asset-page__section">
                <h2><BarChart3 size={22} /> Duración y Convexidad</h2>
                <div className="asset-page__text-block">
                    <p>
                        La <strong>duración</strong> mide cuánto cambia el precio de un bono cuando los tipos se mueven.
                        A mayor duración, mayor sensibilidad.
                    </p>
                </div>

                <div className="duration-visual">
                    <h3>Impacto de una subida de tipos del 1%</h3>
                    <div className="duration-bars">
                        {[
                            { label: 'Letras 6m', duration: 0.5, loss: -0.5, color: '#10b981' },
                            { label: 'Bono 2a', duration: 1.9, loss: -1.9, color: '#3b82f6' },
                            { label: 'Bono 5a', duration: 4.5, loss: -4.5, color: '#8b5cf6' },
                            { label: 'Bono 10a', duration: 8.2, loss: -8.2, color: '#f59e0b' },
                            { label: 'Bono 30a', duration: 19.5, loss: -19.5, color: '#ef4444' },
                        ].map(item => (
                            <div key={item.label} className="duration-bar">
                                <span className="duration-bar__label">{item.label}</span>
                                <div className="duration-bar__track">
                                    <div
                                        className="duration-bar__fill"
                                        style={{ width: `${Math.min(Math.abs(item.loss) * 5, 100)}%`, backgroundColor: item.color }}
                                    />
                                </div>
                                <span className="duration-bar__value" style={{ color: item.color }}>{item.loss}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="convexity-explainer">
                    <h3>¿Qué es la Convexidad?</h3>
                    <div className="convexity-content">
                        <div className="convexity-text">
                            <p>
                                La convexidad mide la <strong>curvatura</strong> de la relación precio-yield.
                                Una convexidad positiva alta es deseable porque significa que:
                            </p>
                            <ul>
                                <li>Cuando los tipos <strong>bajan</strong>, el precio sube <strong>más</strong> de lo que la duración predice</li>
                                <li>Cuando los tipos <strong>suben</strong>, el precio baja <strong>menos</strong> de lo esperado</li>
                            </ul>
                            <p>
                                En resumen: <strong>la convexidad es tu amiga</strong>. Los bonos de mayor vencimiento
                                tienen más convexidad, lo que actúa como un «colchón asimétrico» a tu favor.
                            </p>
                        </div>
                        <div className="convexity-chart">
                            <div className="convexity-chart__visual">
                                <div className="convexity-chart__label convexity-chart__label--top">Beneficio por convexidad ↑</div>
                                <svg viewBox="0 0 200 120" className="convexity-svg">
                                    {/* Linear (duration only) */}
                                    <line x1="20" y1="100" x2="180" y2="20" stroke="#64748b" strokeDasharray="5,5" strokeWidth="2" />
                                    {/* Curved (with convexity) */}
                                    <path d="M20,100 Q60,85 100,60 Q140,35 180,15" stroke="#10b981" strokeWidth="3" fill="none" />
                                    <text x="90" y="115" fill="#64748b" fontSize="9" textAnchor="middle">Duración (lineal)</text>
                                    <text x="140" y="25" fill="#10b981" fontSize="9" textAnchor="middle">Con convexidad</text>
                                </svg>
                                <div className="convexity-chart__label convexity-chart__label--bottom">Yield →</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Yield Curve */}
            <section className="asset-page__section">
                <h2><TrendingUp size={22} /> La Curva de Tipos</h2>
                <div className="asset-page__text-block">
                    <p>
                        La <strong>curva de rendimientos</strong> (yield curve) muestra qué rentabilidad ofrecen
                        los bonos según su plazo. Su forma nos dice mucho sobre las expectativas económicas del mercado.
                    </p>
                </div>

                <div className="yield-curves">
                    {YIELD_CURVE_SCENARIOS.map(scenario => (
                        <div key={scenario.name} className="yield-curve-card" style={{ '--curve-color': scenario.color } as React.CSSProperties}>
                            <div className="yield-curve-card__header">
                                <h4>{scenario.name}</h4>
                                <span className="yield-curve-card__signal">{scenario.signal}</span>
                            </div>
                            <p className="yield-curve-card__desc">{scenario.desc}</p>
                            <div className="yield-curve-card__chart">
                                <div className="mini-curve">
                                    {scenario.visual.map((val, i) => (
                                        <div key={i} className="mini-curve__bar-group">
                                            <div
                                                className="mini-curve__bar"
                                                style={{
                                                    height: `${val * 18}px`,
                                                    backgroundColor: scenario.color,
                                                }}
                                            />
                                            <span className="mini-curve__label">{DURATION_LABELS[i]}</span>
                                            <span className="mini-curve__val" style={{ color: scenario.color }}>{val}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="asset-page__callout asset-page__callout--warning">
                    <AlertTriangle size={20} />
                    <div>
                        <strong>Curva invertida = señal de recesión</strong>
                        <p>Históricamente, cada vez que la curva de tipos se ha invertido (el bono a 2 años rinde más que el de 10 años), una recesión ha seguido en los 6-18 meses siguientes. Ocurrió antes de 2001, 2008, y 2020.</p>
                    </div>
                </div>
            </section>

            {/* Bond types deep dive */}
            <section className="asset-page__section">
                <h2><Shield size={22} /> Tipos de Bonos en Detalle</h2>
                <p className="asset-page__section-desc">
                    No todos los bonos son iguales. La diferencia entre deuda gubernamental y high yield
                    es como la diferencia entre un depósito y una criptomoneda.
                </p>

                {BOND_TYPES.map((type) => (
                    <div key={type.title} className="bond-type-block" style={{ '--bond-color': type.color } as React.CSSProperties}>
                        <div className="bond-type-block__header">
                            <span className="bond-type-block__emoji">{type.icon}</span>
                            <div>
                                <h3>{type.title}</h3>
                                <p>{type.desc}</p>
                            </div>
                        </div>
                        <div className="bond-type-block__subtypes">
                            {type.subtypes.map(sub => (
                                <div key={sub.name} className="bond-subtype">
                                    <div className="bond-subtype__header">
                                        <h4>{sub.name}</h4>
                                        <span className={`bond-subtype__risk bond-subtype__risk--${sub.risk.toLowerCase().replace(/[^a-z]/g, '')}`}>
                                            {sub.risk}
                                        </span>
                                    </div>
                                    <p>{sub.desc}</p>
                                    <span className="bond-subtype__duration">
                                        <Clock size={14} /> {sub.duration}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </section>

            {/* Credit Rating */}
            <section className="asset-page__section">
                <h2><BarChart3 size={22} /> Ratings Crediticios</h2>
                <div className="asset-page__text-block">
                    <p>Las agencias de calificación (Moody's, S&P, Fitch) evalúan la probabilidad de que un emisor pague sus deudas. La calificación determina el interés que debe pagar el emisor.</p>
                </div>

                <div className="rating-scale">
                    {[
                        { rating: 'AAA', label: 'Máxima calidad', example: 'Alemania, Microsoft', color: '#10b981', width: '100%' },
                        { rating: 'AA', label: 'Muy alta calidad', example: 'Francia, Apple', color: '#22c55e', width: '92%' },
                        { rating: 'A', label: 'Alta calidad', example: 'España, BBVA', color: '#3b82f6', width: '84%' },
                        { rating: 'BBB', label: 'Grado inversión (límite)', example: 'Italia, muchas empresas', color: '#f59e0b', width: '72%' },
                        { rating: 'BB', label: 'Especulativo', example: 'Grecia, empresas mid-cap', color: '#f97316', width: '58%' },
                        { rating: 'B', label: 'Alto riesgo', example: 'Empresas en dificultad', color: '#ef4444', width: '40%' },
                        { rating: 'CCC-D', label: 'Riesgo de impago', example: 'Default inminente', color: '#991b1b', width: '20%' },
                    ].map(r => (
                        <div key={r.rating} className="rating-row">
                            <span className="rating-row__badge" style={{ backgroundColor: r.color }}>{r.rating}</span>
                            <div className="rating-row__bar-container">
                                <div className="rating-row__bar" style={{ width: r.width, backgroundColor: r.color }} />
                            </div>
                            <div className="rating-row__info">
                                <span className="rating-row__label">{r.label}</span>
                                <span className="rating-row__example">{r.example}</span>
                            </div>
                        </div>
                    ))}
                    <div className="rating-scale__divider">
                        <span>↑ Investment Grade</span>
                        <span>↓ High Yield (Basura)</span>
                    </div>
                </div>
            </section>

            {/* Pros and Cons */}
            <section className="asset-page__section">
                <h2><Shield size={22} /> Ventajas y Riesgos</h2>
                <div className="asset-page__pros-cons">
                    <div className="pc-column pc-column--pros">
                        <h3><CheckCircle2 size={18} /> Ventajas</h3>
                        <ul>
                            <li>Estabilidad y previsibilidad de rentas</li>
                            <li>Menor volatilidad que acciones</li>
                            <li>Diversificación: baja correlación con RV en periodos normales</li>
                            <li>Protección parcial en caídas bursátiles (flight to quality)</li>
                            <li>Letras del Tesoro: alternativa superior a depósitos bancarios</li>
                            <li>Si mantienes a vencimiento, conoces exactamente tu retorno</li>
                        </ul>
                    </div>
                    <div className="pc-column pc-column--cons">
                        <h3><AlertTriangle size={18} /> Riesgos</h3>
                        <ul>
                            <li>Rentabilidad real puede no superar inflación</li>
                            <li>Extrema sensibilidad a tipos en bonos largos</li>
                            <li>2022: los bonos largos cayeron ~25% (algo «imposible» según muchos)</li>
                            <li>Riesgo de crédito en emisores privados</li>
                            <li>Liquidez variable según el mercado</li>
                            <li>Fiscalidad: cupones tributan como rendimiento del capital</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* How to invest */}
            <section className="asset-page__section">
                <h2><Zap size={22} /> ¿Cómo Invertir en Renta Fija?</h2>
                <div className="asset-page__steps">
                    <div className="step-card">
                        <div className="step-card__number">1</div>
                        <h4>ETFs de Bonos</h4>
                        <p>Forma más accesible. Un ETF como iShares Core Euro Govt Bond te da diversificación en decenas de emisiones gubernamentales europeas.</p>
                        <span className="step-card__badge step-card__badge--recommended">Recomendado</span>
                    </div>
                    <div className="step-card">
                        <div className="step-card__number">2</div>
                        <h4>Letras del Tesoro Directas</h4>
                        <p>Se compran directamente en el Tesoro Público español. Sin comisiones, máxima seguridad. Ideal para plazos cortos (3-12 meses).</p>
                        <span className="step-card__badge step-card__badge--fiscal">Sin comisiones</span>
                    </div>
                    <div className="step-card">
                        <div className="step-card__number">3</div>
                        <h4>Fondos de Renta Fija</h4>
                        <p>Gestionados activamente o indexados. Ventaja fiscal en España por traspasos. Cuidado con las comisiones de gestión activa.</p>
                        <span className="step-card__badge step-card__badge--fiscal">Ventaja Fiscal 🇪🇸</span>
                    </div>
                    <div className="step-card">
                        <div className="step-card__number">4</div>
                        <h4>Bonos Individuales</h4>
                        <p>Comprar bonos concretos en el mercado secundario. Requiere más capital y conocimiento. Solo para inversores experimentados.</p>
                        <span className="step-card__badge step-card__badge--advanced">Avanzado</span>
                    </div>
                </div>
            </section>

            {/* Final tip */}
            <section className="asset-page__final-tip">
                <Lightbulb size={28} />
                <div>
                    <h3>Consejo Final</h3>
                    <p>
                        En un entorno de tipos altos, las <strong>Letras del Tesoro y los bonos de corto plazo</strong> son
                        tu mejor refugio en renta fija. Ofrecen rentabilidad decente sin el riesgo de duración.
                        Si quieres RF a largo plazo, usa ETFs indexados y acepta la volatilidad temporal.
                        <strong> La renta fija NO es fija si vendes antes del vencimiento.</strong>
                    </p>
                </div>
            </section>
        </div>
    );
}
