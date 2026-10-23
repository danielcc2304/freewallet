import { BondCategoryCard } from '../ui/BondCategoryCard';
import { AcademyListCard } from '../ui/AcademyListCard';
import { AcademyCallout } from '../ui/AcademyCallout';
import { AcademyStepCard } from '../ui/AcademyStepCard';
import { AcademyMetric } from '../ui/AcademyMetric';
import { AcademySection } from '../ui/AcademySection';
import { AcademyGrid } from '../ui/AcademyGrid';
import { AcademyPanel } from '../ui/AcademyPanel';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Landmark, ArrowLeft, Globe, Zap, CheckCircle2, AlertTriangle,
    Lightbulb, BarChart3, Clock, Shield, TrendingDown, TrendingUp, ArrowUpDown
} from 'lucide-react';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { AssetGuideNav } from './AssetGuideNav';
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

const CREDIT_SPREAD_REGIMES = [
    {
        name: 'Spreads Estrechos',
        range: '< 120 pb',
        meaning: 'Complacencia de mercado. Prima de riesgo baja y valoraciones exigentes en crédito.',
        implication: 'Mejor priorizar calidad (IG corto/medio) y no perseguir yield a cualquier precio.',
        color: '#10b981'
    },
    {
        name: 'Spreads Normales',
        range: '120 - 250 pb',
        meaning: 'Riesgo percibido razonable. Entorno neutro para crédito corporativo.',
        implication: 'Se puede combinar gobierno + IG + algo de high yield de forma táctica.',
        color: '#f59e0b'
    },
    {
        name: 'Spreads Amplios',
        range: '> 250 pb',
        meaning: 'Estrés financiero o miedo a recesión. El mercado exige mucha prima por riesgo.',
        implication: 'Suelen aparecer mejores oportunidades, pero con mayor volatilidad y defaults.',
        color: '#ef4444'
    }
];

const BOND_ETF_CHECKLIST = [
    {
        title: 'Duración',
        desc: 'Si esperas tipos altos más tiempo, evita duraciones largas por sensibilidad.'
    },
    {
        title: 'Calidad crediticia',
        desc: 'No es lo mismo AAA/AA que BBB o high yield. Mira la distribución por rating.'
    },
    {
        title: 'Spread actual',
        desc: 'Compara el spread con su media histórica: ¿estás cobrando suficiente prima?'
    },
    {
        title: 'Vencimiento medio',
        desc: 'Confirma que encaja con tu horizonte temporal y con tu necesidad de liquidez.'
    },
    {
        title: 'Costes',
        desc: 'En renta fija, 0.30% de comisión puede comerse gran parte del retorno real.'
    },
    {
        title: 'Riesgo divisa',
        desc: 'Si el fondo está en USD y tú gastas en EUR, valora cobertura de moneda.'
    }
];

const LADDER_MODEL = [
    { rung: 'Tramo 1', maturity: '0-1 años', objective: 'Liquidez inmediata', yieldHint: 'Baja duración, baja volatilidad' },
    { rung: 'Tramo 2', maturity: '1-3 años', objective: 'Estabilidad', yieldHint: 'Equilibrio entre cupón y riesgo' },
    { rung: 'Tramo 3', maturity: '3-5 años', objective: 'Renta intermedia', yieldHint: 'Más carry, algo más sensible' },
    { rung: 'Tramo 4', maturity: '5-7 años', objective: 'Mejorar yield', yieldHint: 'Duración moderada-alta' },
    { rung: 'Tramo 5', maturity: '7-10 años', objective: 'Tramo largo táctico', yieldHint: 'Más riesgo de tipos' }
];

const COMMON_BOND_ERRORS = [
    {
        mistake: 'Perseguir el cupón más alto',
        impact: 'Suele esconder más riesgo de crédito o liquidez.',
        fix: 'Mirar retorno ajustado a riesgo: rating, spread y drawdowns históricos.'
    },
    {
        mistake: 'Comprar duración larga sin querer',
        impact: 'Una subida de tipos puede generar pérdidas fuertes temporales.',
        fix: 'Alinear duración con horizonte y tolerancia a volatilidad.'
    },
    {
        mistake: 'Ignorar comisiones en renta fija',
        impact: 'Con retornos esperados bajos, los costes pesan mucho.',
        fix: 'Priorizar vehículos de bajo TER y revisar coste total (TER + spread).'
    },
    {
        mistake: 'No revisar calidad media del fondo',
        impact: 'Un ETF puede llamarse "bond" pero asumir demasiado high yield.',
        fix: 'Comprobar porcentaje en IG/HY y concentración por emisor.'
    },
    {
        mistake: 'Confundir “bono” con “sin riesgo”',
        impact: 'Hay riesgo de tipos, crédito, liquidez e inflación.',
        fix: 'Diversificar por plazo, calidad y emisor; no depender de una sola pata.'
    },
    {
        mistake: 'No planificar vencimientos',
        impact: 'Puedes verte obligado a vender en mal momento.',
        fix: 'Usar una escalera (ladder) para escalonar liquidez y reinversión.'
    }
];

const STRESS_PRESETS = [
    { label: 'Liquidez tensa', shock: 50 },
    { label: 'Risk-off serio', shock: 100 },
    { label: 'Credito bajo presion', shock: 200 },
    { label: 'Capitulacion', shock: 300 }
];

export function AssetBonds() {
    const [spreadClass, setSpreadClass] = useState<'ig' | 'hy'>('ig');
    const [isStressMode, setIsStressMode] = useState(false);
    const [spreadDuration, setSpreadDuration] = useState(4.5);
    const [spreadShockBps, setSpreadShockBps] = useState(100);
    const [weightShort, setWeightShort] = useState(40);
    const [weightMid, setWeightMid] = useState(35);
    const [weightLong, setWeightLong] = useState(25);
    const [durShort, setDurShort] = useState(1.8);
    const [durMid, setDurMid] = useState(5.2);
    const [durLong, setDurLong] = useState(9.5);

    const spreadPresets = useMemo(() => ({
        ig: { label: 'Investment Grade', duration: 4.5, spread: 130 },
        hy: { label: 'High Yield', duration: 3.2, spread: 380 }
    }), []);

    const shockMin = isStressMode ? 0 : -150;
    const shockMax = isStressMode ? 500 : 300;
    const estimatedPriceImpact = -(spreadDuration * spreadShockBps) / 100;
    const newSpread = Math.max(0, spreadPresets[spreadClass].spread + spreadShockBps);
    const portfolioWeightTotal = weightShort + weightMid + weightLong;
    const portfolioDuration = portfolioWeightTotal > 0
        ? ((weightShort * durShort) + (weightMid * durMid) + (weightLong * durLong)) / portfolioWeightTotal
        : 0;
    const up100bpImpact = -portfolioDuration;
    const down100bpImpact = portfolioDuration;
    const normalizedShort = portfolioWeightTotal > 0 ? (weightShort / portfolioWeightTotal) * 100 : 0;
    const normalizedMid = portfolioWeightTotal > 0 ? (weightMid / portfolioWeightTotal) * 100 : 0;
    const normalizedLong = portfolioWeightTotal > 0 ? (weightLong / portfolioWeightTotal) * 100 : 0;

    return (
        <div className="asset-page asset-page--bonds" style={{ '--asset-color': '#10b981' } as React.CSSProperties}>
            <Link to="/academy/portfolio" className="asset-page__back">
                <ArrowLeft size={18} /> Estrategia y cartera
            </Link>

            <AcademyPageHeader className="asset-page__hero" section="Aprender" style={{ '--hero-color': '#10b981' } as React.CSSProperties}>
                <div className="asset-page__hero-icon">
                    <Landmark size={48} />
                </div>
                <h1>Renta Fija (Bonos)</h1>
                <p className="asset-page__hero-sub">
                    El ancla de estabilidad de tu cartera. Comprende los tipos de bonos, cómo funcionan los tipos de interés,
                    y por qué la curva de tipos puede predecir recesiones.
                </p>
                <div className="asset-page__hero-stats">
                    <AcademyMetric variant="hero" label={<>Retorno típico</>} value={<>2-10%</>} valueProps={{"className":"hero-stat__value"}} />
                    <AcademyMetric variant="hero" label={<>Volatilidad</>} value={<>3-8%</>} valueProps={{"className":"hero-stat__value"}} />
                    <AcademyMetric variant="hero" label={<>Horizonte recomendado</>} value={<>1-5 años</>} valueProps={{"className":"hero-stat__value"}} />
                </div>
            </AcademyPageHeader>

            <AssetGuideNav sections={[
                { id: 'section-1', label: 'Conceptos' },
                { id: 'section-2', label: 'Precio y rentabilidad' },
                { id: 'section-3', label: 'Duración y convexidad' },
                { id: 'section-4', label: 'Curva de tipos' },
                { id: 'section-5', label: 'Tipos de bonos' },
                { id: 'section-6', label: 'Ratings' },
                { id: 'section-7', label: 'Spreads y simulador' },
                { id: 'section-8', label: 'Antes de comprar' },
                { id: 'section-9', label: 'Escalera de vencimientos' },
                { id: 'section-10', label: 'Duración de cartera' },
                { id: 'section-11', label: 'Errores frecuentes' },
                { id: 'section-12', label: 'Ventajas y riesgos' },
                { id: 'section-13', label: 'Cómo invertir' },
            ]} />

            {/* What is it */}
            <AcademySection title={<><Globe size={22} /> ¿Qué es un Bono?</>} id="section-1" className="asset-page__section">

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
                    <AcademyGrid variant="bondAnatomy" className="bond-anatomy__grid">
                        <AcademyPanel variant="bondAnatomy" className="bond-anatomy__item">
                            <span className="bond-anatomy__label">Nominal (Face Value)</span>
                            <span className="bond-anatomy__value">1.000€</span>
                            <span className="bond-anatomy__desc">Lo que te devuelven al vencimiento</span>
                        </AcademyPanel>
                        <AcademyPanel variant="bondAnatomy" className="bond-anatomy__item">
                            <span className="bond-anatomy__label">Cupón</span>
                            <span className="bond-anatomy__value">3.5%</span>
                            <span className="bond-anatomy__desc">Interés anual que recibes</span>
                        </AcademyPanel>
                        <AcademyPanel variant="bondAnatomy" className="bond-anatomy__item">
                            <span className="bond-anatomy__label">Vencimiento</span>
                            <span className="bond-anatomy__value">10 años</span>
                            <span className="bond-anatomy__desc">Plazo hasta recuperar el nominal</span>
                        </AcademyPanel>
                        <AcademyPanel variant="bondAnatomy" className="bond-anatomy__item">
                            <span className="bond-anatomy__label">Precio</span>
                            <span className="bond-anatomy__value">98.50</span>
                            <span className="bond-anatomy__desc">Lo que pagas hoy (puede ser {'≠'} 100)</span>
                        </AcademyPanel>
                        <AcademyPanel variant="bondAnatomy" className="bond-anatomy__item">
                            <span className="bond-anatomy__label">Yield (TIR)</span>
                            <span className="bond-anatomy__value">3.67%</span>
                            <span className="bond-anatomy__desc">Rentabilidad real si mantienes a vencimiento</span>
                        </AcademyPanel>
                        <AcademyPanel variant="bondAnatomy" className="bond-anatomy__item">
                            <span className="bond-anatomy__label">Rating</span>
                            <span className="bond-anatomy__value">AA+</span>
                            <span className="bond-anatomy__desc">Calidad crediticia del emisor</span>
                        </AcademyPanel>
                    </AcademyGrid>
                </div>
            </AcademySection>

            {/* Inverse relationship */}
            <AcademySection title={<><ArrowUpDown size={22} /> La Regla de Oro: Precio vs Yield</>} id="section-2" className="asset-page__section">

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

                <AcademyCallout tone="info" icon={<Lightbulb size={20} />} title={<>¿Por qué importa?</>}>
                    <p>Si compras un bono a 10 años y los tipos suben un 2%, podrías ver una caída del ~15% en el precio de mercado de tu bono. Si lo mantienes a vencimiento, no importa (cobras cupón + nominal). Pero si necesitas vender antes, puedes perder dinero.</p>
                </AcademyCallout>
            </AcademySection>

            {/* Duration & Convexity */}
            <AcademySection title={<><BarChart3 size={22} /> Duración y Convexidad</>} id="section-3" className="asset-page__section">

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
            </AcademySection>

            {/* Yield Curve */}
            <AcademySection title={<><TrendingUp size={22} /> La Curva de Tipos</>} id="section-4" className="asset-page__section">

                <div className="asset-page__text-block">
                    <p>
                        La <strong>curva de rendimientos</strong> (yield curve) muestra qué rentabilidad ofrecen
                        los bonos según su plazo. Su forma nos dice mucho sobre las expectativas económicas del mercado.
                    </p>
                </div>

                <div className="yield-curves">
                    {YIELD_CURVE_SCENARIOS.map(scenario => (
                        <AcademyPanel variant="yieldCurve" key={scenario.name} className="yield-curve-card" style={{ '--curve-color': scenario.color } as React.CSSProperties}>
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
                        </AcademyPanel>
                    ))}
                </div>

                <AcademyCallout tone="warning" icon={<AlertTriangle size={20} />} title={<>Curva invertida = señal de recesión</>}>
                    <p>Históricamente, cada vez que la curva de tipos se ha invertido (el bono a 2 años rinde más que el de 10 años), una recesión ha seguido en los 6-18 meses siguientes. Ocurrió antes de 2001, 2008, y 2020.</p>
                </AcademyCallout>
            </AcademySection>

            {/* Bond types deep dive */}
            <AcademySection title={<><Shield size={22} /> Tipos de Bonos en Detalle</>} id="section-5" className="asset-page__section">

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
                        <AcademyGrid variant="bondSubtypes" className="bond-type-block__subtypes">
                            {type.subtypes.map(sub => (
                                <BondCategoryCard key={sub.name} title={sub.name} risk={sub.risk} description={<>{sub.desc}</>} duration={<>
                                        <Clock size={14} /> {sub.duration}
                                    </>} />
                            ))}
                        </AcademyGrid>
                    </div>
                ))}
            </AcademySection>

            {/* Credit Rating */}
            <AcademySection title={<><BarChart3 size={22} /> Ratings Crediticios</>} id="section-6" className="asset-page__section">

                <div className="asset-page__text-block">
                    <p>Las agencias de calificación (Moody's, S&P, Fitch) evalúan la probabilidad de que un emisor pague sus deudas. La calificación determina el interés que debe pagar el emisor.</p>
                </div>

                <div className="rating-scale">
                    {[
                        { rating: 'AAA', label: 'Máxima calidad', example: 'Alemania, Microsoft', color: '#10b981', width: '100%' },
                        { rating: 'AA', label: 'Muy alta calidad', example: 'Bélgica, Apple', color: '#22c55e', width: '92%' },
                        { rating: 'A', label: 'Alta calidad', example: 'España, BBVA', color: '#3b82f6', width: '84%' },
                        { rating: 'BBB', label: 'Grado inversión (límite)', example: 'Italia, muchas empresas', color: '#f59e0b', width: '72%' },
                        { rating: 'BB', label: 'Especulativo', example: 'Albania, empresas mid-cap', color: '#f97316', width: '58%' },
                        { rating: 'B', label: 'Alto riesgo', example: 'Turquía, Empresas en dificultad', color: '#ef4444', width: '40%' },
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
            </AcademySection>

            {/* Credit spread */}
            <AcademySection title={<><TrendingDown size={22} /> Spread de Crédito: El Termómetro del Riesgo</>} id="section-7" className="asset-page__section">

                <div className="asset-page__text-block">
                    <p>
                        El <strong>spread de crédito</strong> es la prima extra que exige el mercado por prestar a una empresa
                        en lugar de a un Estado "libre de riesgo" (como Alemania o EE.UU.).
                    </p>
                    <p>
                        Fórmula rápida: <strong>Yield corporativo = Yield soberano + Spread</strong>.
                        Si un bono público a 5 años rinde 2.4% y un corporativo similar rinde 4.0%,
                        el spread es 1.6% (160 puntos básicos).
                    </p>
                </div>

                <div className="credit-spreads-grid">
                    {CREDIT_SPREAD_REGIMES.map((regime) => (
                        <div
                            key={regime.name}
                            className="credit-spread-card"
                            style={{ '--spread-color': regime.color } as React.CSSProperties}
                        >
                            <h3>{regime.name}</h3>
                            <span className="credit-spread-card__range">{regime.range}</span>
                            <p>{regime.meaning}</p>
                            <div className="credit-spread-card__implication">
                                <strong>Lectura práctica:</strong> {regime.implication}
                            </div>
                        </div>
                    ))}
                </div>

                <AcademyCallout tone="warning" icon={<AlertTriangle size={20} />} title={<>Cuando el spread se abre rápido, manda el riesgo</>}>
                    <p>
                        Si los spreads se amplían de golpe, el crédito suele caer aunque los tipos oficiales no cambien.
                        En ese entorno, la calidad del emisor y la liquidez importan más que rascar unas décimas extra de yield.
                    </p>
                </AcademyCallout>

                <div className="spread-sim">
                    <h3>Mini simulador: impacto de spread</h3>
                    <p className="spread-sim__intro">
                        Estimación rápida usando <strong>duración de spread</strong>:
                        impacto (%) ≈ - duración x cambio de spread (en %).
                    </p>

                    <div className="spread-sim__mode">
                        <button
                            type="button"
                            aria-pressed={!isStressMode}
                            className={`spread-sim__mode-btn ${!isStressMode ? 'is-active' : ''}`}
                            onClick={() => setIsStressMode(false)}
                        >
                            Normal
                        </button>
                        <button
                            type="button"
                            aria-pressed={isStressMode}
                            className={`spread-sim__mode-btn ${isStressMode ? 'is-active' : ''}`}
                            onClick={() => {
                                setIsStressMode(true);
                                if (spreadShockBps < 0) setSpreadShockBps(100);
                            }}
                        >
                            Modo estrés
                        </button>
                    </div>

                    <div className="spread-sim__preset-buttons">
                        <button
                            type="button"
                            aria-pressed={spreadClass === 'ig'}
                            className={`spread-sim__preset ${spreadClass === 'ig' ? 'is-active' : ''}`}
                            onClick={() => {
                                setSpreadClass('ig');
                                setSpreadDuration(spreadPresets.ig.duration);
                            }}
                        >
                            {spreadPresets.ig.label}
                        </button>
                        <button
                            type="button"
                            aria-pressed={spreadClass === 'hy'}
                            className={`spread-sim__preset ${spreadClass === 'hy' ? 'is-active' : ''}`}
                            onClick={() => {
                                setSpreadClass('hy');
                                setSpreadDuration(spreadPresets.hy.duration);
                            }}
                        >
                            {spreadPresets.hy.label}
                        </button>
                    </div>

                    {isStressMode && (
                        <div className="spread-sim__stress-presets">
                            {STRESS_PRESETS.map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    className={`spread-sim__stress-btn ${spreadShockBps === preset.shock ? 'is-active' : ''}`}
                                    onClick={() => setSpreadShockBps(preset.shock)}
                                >
                                    {preset.label} (+{preset.shock} pb)
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="spread-sim__controls">
                        <label className="spread-sim__control">
                            <span>Duración de spread: {spreadDuration.toFixed(1)}</span>
                            <input
                                type="range"
                                min={1}
                                max={8}
                                step={0.1}
                                value={spreadDuration}
                                onChange={(e) => setSpreadDuration(Number(e.target.value))}
                            />
                        </label>

                        <label className="spread-sim__control">
                            <span>Shock de spread: {spreadShockBps > 0 ? `+${spreadShockBps}` : spreadShockBps} pb</span>
                            <input
                                type="range"
                                min={shockMin}
                                max={shockMax}
                                step={10}
                                value={spreadShockBps}
                                onChange={(e) => setSpreadShockBps(Number(e.target.value))}
                            />
                        </label>
                    </div>

                    <div className="spread-sim__result">
                        <div className="spread-sim__metric">
                            <span className="spread-sim__metric-label">Spread inicial</span>
                            <strong>{spreadPresets[spreadClass].spread} pb</strong>
                        </div>
                        <div className="spread-sim__metric">
                            <span className="spread-sim__metric-label">Spread estimado final</span>
                            <strong>{newSpread} pb</strong>
                        </div>
                        <div className="spread-sim__metric">
                            <span className="spread-sim__metric-label">Impacto estimado en precio</span>
                            <strong className={estimatedPriceImpact <= 0 ? 'is-negative' : 'is-positive'}>
                                {estimatedPriceImpact > 0 ? '+' : ''}{estimatedPriceImpact.toFixed(2)}%
                            </strong>
                        </div>
                    </div>

                    <p className="spread-sim__note">
                        Aproximación de primer orden. No incluye cambios de tipos soberanos, convexidad, defaults ni efecto de cupones.
                    </p>
                </div>
            </AcademySection>

            {/* Checklist */}
            <AcademySection title={<><CheckCircle2 size={22} /> Checklist Antes de Comprar Bonos o ETFs</>} id="section-8" className="asset-page__section">

                <div className="asset-page__text-block">
                    <p>
                        Esta revisión de 60 segundos evita la mayoría de errores típicos en renta fija:
                        comprar demasiada duración, asumir más crédito del que creías, o pagar comisiones altas para retornos bajos.
                    </p>
                </div>
                <div className="bond-checklist-grid">
                    {BOND_ETF_CHECKLIST.map((item) => (
                        <div key={item.title} className="bond-checklist-item">
                            <h4>{item.title}</h4>
                            <p>{item.desc}</p>
                        </div>
                    ))}
                </div>

                <AcademyCallout tone="info" icon={<Lightbulb size={20} />} title={<>En bonos globales, cubrir divisa suele tener más sentido</>} style={{ marginTop: '1.5rem' }}>
                    <p>
                        Si tu objetivo de renta fija es estabilizar cartera en EUR, la cobertura de divisa
                        suele reducir ruido y hacer más predecible el comportamiento.
                    </p>
                    <Link to="/academy/risk" className="asset-page__cta-link">
                        Ver guía completa de cobertura de divisa →
                    </Link>
                </AcademyCallout>
            </AcademySection>

            {/* Ladder strategy */}
            <AcademySection title={<><Clock size={22} /> Estrategia Ladder (Escalera de Vencimientos)</>} id="section-9" className="asset-page__section">

                <div className="asset-page__text-block">
                    <p>
                        La estrategia <strong>ladder</strong> consiste en repartir tu renta fija por vencimientos
                        escalonados. Así reduces el riesgo de entrar todo en un único momento de tipos y mantienes
                        liquidez recurrente para reinvertir.
                    </p>
                </div>

                <div className="bond-ladder">
                    {LADDER_MODEL.map((step) => (
                        <div key={step.rung} className="bond-ladder__step">
                            <span className="bond-ladder__rung">{step.rung}</span>
                            <h4>{step.maturity}</h4>
                            <p>{step.objective}</p>
                            <span className="bond-ladder__hint">{step.yieldHint}</span>
                        </div>
                    ))}
                </div>

                <AcademyCallout tone="info" icon={<Lightbulb size={20} />} title={<>Ventaja clave del ladder</>}>
                    <p>
                        Cada año vence una parte de la cartera. Puedes usar ese flujo para gasto,
                        o reinvertir al nuevo nivel de tipos sin tener que deshacer toda la posición.
                    </p>
                </AcademyCallout>
            </AcademySection>

            {/* Portfolio duration calculator */}
            <AcademySection title={<><BarChart3 size={22} /> Duración Total de tu Cartera de Bonos</>} id="section-10" className="asset-page__section">

                <div className="asset-page__text-block">
                    <p>
                        Esta mini calculadora estima la sensibilidad conjunta de tu cartera de renta fija
                        ante movimientos paralelos de tipos.
                    </p>
                </div>

                <div className="bond-duration-calc">
                    <div className="bond-duration-calc__inputs">
                        <div className="duration-input-card">
                            <h4>RF Corto Plazo</h4>
                            <label>
                                <span>Peso: {weightShort}%</span>
                                <input type="range" min={0} max={100} step={1} value={weightShort} onChange={(e) => setWeightShort(Number(e.target.value))} />
                            </label>
                            <label>
                                <span>Duración: {durShort.toFixed(1)}</span>
                                <input type="range" min={0.5} max={4} step={0.1} value={durShort} onChange={(e) => setDurShort(Number(e.target.value))} />
                            </label>
                        </div>

                        <div className="duration-input-card">
                            <h4>RF Media</h4>
                            <label>
                                <span>Peso: {weightMid}%</span>
                                <input type="range" min={0} max={100} step={1} value={weightMid} onChange={(e) => setWeightMid(Number(e.target.value))} />
                            </label>
                            <label>
                                <span>Duración: {durMid.toFixed(1)}</span>
                                <input type="range" min={2} max={8} step={0.1} value={durMid} onChange={(e) => setDurMid(Number(e.target.value))} />
                            </label>
                        </div>

                        <div className="duration-input-card">
                            <h4>RF Larga</h4>
                            <label>
                                <span>Peso: {weightLong}%</span>
                                <input type="range" min={0} max={100} step={1} value={weightLong} onChange={(e) => setWeightLong(Number(e.target.value))} />
                            </label>
                            <label>
                                <span>Duración: {durLong.toFixed(1)}</span>
                                <input type="range" min={5} max={15} step={0.1} value={durLong} onChange={(e) => setDurLong(Number(e.target.value))} />
                            </label>
                        </div>
                    </div>

                    <div className="bond-duration-calc__summary">
                        <div className="duration-summary-card">
                            <span>Total pesos introducidos</span>
                            <strong>{portfolioWeightTotal}%</strong>
                        </div>
                        <div className="duration-summary-card">
                            <span>Duración agregada estimada</span>
                            <strong>{portfolioDuration.toFixed(2)}</strong>
                        </div>
                        <div className="duration-summary-card">
                            <span>Impacto estimado con +1% tipos</span>
                            <strong className="is-negative">{up100bpImpact.toFixed(2)}%</strong>
                        </div>
                        <div className="duration-summary-card">
                            <span>Impacto estimado con -1% tipos</span>
                            <strong className="is-positive">+{down100bpImpact.toFixed(2)}%</strong>
                        </div>
                    </div>

                    <div className="duration-mix">
                        <h4>Mix normalizado de cartera</h4>
                        <div className="duration-mix__bars">
                            <div className="duration-mix__row">
                                <span>Corto</span>
                                <div className="duration-mix__track"><div className="duration-mix__fill duration-mix__fill--short" style={{ width: `${normalizedShort}%` }} /></div>
                                <strong>{normalizedShort.toFixed(1)}%</strong>
                            </div>
                            <div className="duration-mix__row">
                                <span>Medio</span>
                                <div className="duration-mix__track"><div className="duration-mix__fill duration-mix__fill--mid" style={{ width: `${normalizedMid}%` }} /></div>
                                <strong>{normalizedMid.toFixed(1)}%</strong>
                            </div>
                            <div className="duration-mix__row">
                                <span>Largo</span>
                                <div className="duration-mix__track"><div className="duration-mix__fill duration-mix__fill--long" style={{ width: `${normalizedLong}%` }} /></div>
                                <strong>{normalizedLong.toFixed(1)}%</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </AcademySection>

            {/* Common mistakes */}
            <AcademySection title={<><AlertTriangle size={22} /> Errores Comunes en Renta Fija</>} id="section-11" className="asset-page__section">

                <div className="bond-mistakes-grid">
                    {COMMON_BOND_ERRORS.map((item) => (
                        <article key={item.mistake} className="bond-mistake-card">
                            <h4>{item.mistake}</h4>
                            <p><strong>Qué pasa:</strong> {item.impact}</p>
                            <p><strong>Cómo evitarlo:</strong> {item.fix}</p>
                        </article>
                    ))}
                </div>
            </AcademySection>

            {/* Pros and Cons */}
            <AcademySection title={<><Shield size={22} /> Ventajas y Riesgos</>} id="section-12" className="asset-page__section">

                <AcademyGrid variant="prosCons" className="asset-page__pros-cons">
                    <AcademyListCard kind="pros" title={<><CheckCircle2 size={18} /> Ventajas</>}>
                            <li>Estabilidad y previsibilidad de rentas</li>
                            <li>Menor volatilidad que acciones</li>
                            <li>Diversificación: baja correlación con RV en periodos normales</li>
                            <li>Protección parcial en caídas bursátiles (flight to quality)</li>
                            <li>Letras del Tesoro: alternativa superior a depósitos bancarios</li>
                            <li>Si mantienes a vencimiento, conoces exactamente tu retorno</li>
                        </AcademyListCard>
                    <AcademyListCard kind="cons" title={<><AlertTriangle size={18} /> Riesgos</>}>
                            <li>Rentabilidad real puede no superar inflación</li>
                            <li>Extrema sensibilidad a tipos en bonos largos</li>
                            <li>2022: los bonos largos cayeron ~25% (algo «imposible» según muchos)</li>
                            <li>Riesgo de crédito en emisores privados</li>
                            <li>Liquidez variable según el mercado</li>
                            <li>Fiscalidad: cupones tributan como rendimiento del capital</li>
                        </AcademyListCard>
                </AcademyGrid>
            </AcademySection>

            {/* How to invest */}
            <AcademySection title={<><Zap size={22} /> ¿Cómo Invertir en Renta Fija?</>} id="section-13" className="asset-page__section">

                <AcademyGrid variant="steps" className="asset-page__steps">
                    <AcademyStepCard number={'1'} title={'ETFs de Bonos'} badgeTone="recommended" badge={'Recomendado'}>Forma más accesible. Un ETF como iShares Core Euro Govt Bond te da diversificación en decenas de emisiones gubernamentales europeas.</AcademyStepCard>
                    <AcademyStepCard number={'2'} title={'Letras del Tesoro Directas'} badgeTone="fiscal" badge={'Sin comisiones'}>Se compran directamente en el Tesoro Público español. Sin comisiones, máxima seguridad. Ideal para plazos cortos (3-12 meses).</AcademyStepCard>
                    <AcademyStepCard number={'3'} title={'Fondos de Renta Fija'} badgeTone="fiscal" badge={'Ventaja Fiscal 🇪🇸'}>Gestionados activamente o indexados. Ventaja fiscal en España por traspasos. Cuidado con las comisiones de gestión activa.</AcademyStepCard>
                    <AcademyStepCard number={'4'} title={'Bonos Individuales'} badgeTone="advanced" badge={'Avanzado'}>Comprar bonos concretos en el mercado secundario. Requiere más capital y conocimiento. Solo para inversores experimentados.</AcademyStepCard>
                </AcademyGrid>
            </AcademySection>

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
