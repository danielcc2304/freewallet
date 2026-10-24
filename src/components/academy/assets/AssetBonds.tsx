import {AcademySpreadExperiment,AcademyDurationExperiment} from '../ui/AcademyBondExperiments';
import {AcademyAssetVisual,AcademyConvexityPanel,AcademyConvexityGraphic,AcademyYieldCurve,AcademyYieldBar,AcademyBondLadderStep,AcademyDurationInputs,AcademyBondMetric,AcademyDurationMix,AcademyBondRange,AcademyBondChoice} from '../ui/AcademyBondParts';
import {AcademyAssetBar,AcademyRatingRow,AcademyRatingDivider,AcademyDurationMixRow} from '../ui/AcademyAssetBars';
import {AcademyAssetHero,AcademyAssetBackLink,AcademyAssetText,AcademyAssetInlineLink} from '../ui/AcademyAssetReading';
import { AcademyFactCard, AcademyDirectionalCard, AcademyCreditCard, AcademyTextCard, AcademyFinalTip } from '../ui/AcademyAssetExplainers';

import { BondCategoryCard } from '../ui/BondCategoryCard';
import { AcademyListCard } from '../ui/AcademyListCard';
import { AcademyCallout } from '../ui/AcademyCallout';
import { AcademyStepCard } from '../ui/AcademyStepCard';
import { AcademyMetric } from '../ui/AcademyMetric';
import { AcademySection } from '../ui/AcademySection';
import { AcademyGrid } from '../ui/AcademyGrid';
import { useMemo, useState } from 'react';
import {
    Landmark, ArrowLeft, Globe, Zap, CheckCircle2, AlertTriangle,
    Lightbulb, BarChart3, Clock, Shield, TrendingDown, TrendingUp, ArrowUpDown
} from 'lucide-react';
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
            <AcademyAssetBackLink to="/academy/portfolio">
                <ArrowLeft size={18} /> Estrategia y cartera
            </AcademyAssetBackLink>

            <AcademyAssetHero style={{ '--hero-color': '#10b981' } as React.CSSProperties} icon={<>
                    <Landmark size={48} />
                </>} title={<>Renta Fija (Bonos)</>} description={<>
                    El ancla de estabilidad de tu cartera. Comprende los tipos de bonos, cómo funcionan los tipos de interés,
                    y por qué la curva de tipos puede predecir recesiones.
                </>}>
                    <AcademyMetric variant="hero" label={<>Retorno típico</>} value={<>2-10%</>} valueProps={{"className":"hero-stat__value"}} />
                    <AcademyMetric variant="hero" label={<>Volatilidad</>} value={<>3-8%</>} valueProps={{"className":"hero-stat__value"}} />
                    <AcademyMetric variant="hero" label={<>Horizonte recomendado</>} value={<>1-5 años</>} valueProps={{"className":"hero-stat__value"}} />
                </AcademyAssetHero>

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

                <AcademyAssetText >
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
                </AcademyAssetText>

                {/* Bond anatomy visual */}
                <AcademyAssetVisual variant="anatomy" title={<>Anatomía de un Bono</>}><AcademyGrid variant="bondAnatomy" className="bond-anatomy__grid">
                        <AcademyFactCard appearance="bond" label={<>Nominal (Face Value)</>} value={<>1.000€</>} description={<>Lo que te devuelven al vencimiento</>} />
                        <AcademyFactCard appearance="bond" label={<>Cupón</>} value={<>3.5%</>} description={<>Interés anual que recibes</>} />
                        <AcademyFactCard appearance="bond" label={<>Vencimiento</>} value={<>10 años</>} description={<>Plazo hasta recuperar el nominal</>} />
                        <AcademyFactCard appearance="bond" label={<>Precio</>} value={<>98.50</>} description={<>Lo que pagas hoy (puede ser {'≠'} 100)</>} />
                        <AcademyFactCard appearance="bond" label={<>Yield (TIR)</>} value={<>3.67%</>} description={<>Rentabilidad real si mantienes a vencimiento</>} />
                        <AcademyFactCard appearance="bond" label={<>Rating</>} value={<>AA+</>} description={<>Calidad crediticia del emisor</>} />
                    </AcademyGrid></AcademyAssetVisual>
            </AcademySection>

            {/* Inverse relationship */}
            <AcademySection title={<><ArrowUpDown size={22} /> La Regla de Oro: Precio vs Yield</>} id="section-2" className="asset-page__section">

                <AcademyAssetText >
                    <p>
                        Esta es <strong>la relación más importante</strong> que debes entender sobre bonos:
                        cuando los tipos de interés <strong>suben</strong>, el precio de los bonos existentes <strong>baja</strong>, y viceversa.
                    </p>
                </AcademyAssetText>

                <div className="inverse-relationship">
                    <AcademyDirectionalCard direction="up" fromIcon={<TrendingUp size={32} />} from={<>Tipos Suben</>} connector={<>→</>} toIcon={<TrendingDown size={32} />} to={<>Precio Baja</>}>Los bonos nuevos pagan más, así que los viejos pierden atractivo.</AcademyDirectionalCard>
                    <AcademyDirectionalCard direction="down" fromIcon={<TrendingDown size={32} />} from={<>Tipos Bajan</>} connector={<>→</>} toIcon={<TrendingUp size={32} />} to={<>Precio Sube</>}>Los bonos existentes con cupones altos se vuelven más valiosos.</AcademyDirectionalCard>
                </div>

                <AcademyCallout tone="info" icon={<Lightbulb size={20} />} title={<>¿Por qué importa?</>}>
                    <p>Si compras un bono a 10 años y los tipos suben un 2%, podrías ver una caída del ~15% en el precio de mercado de tu bono. Si lo mantienes a vencimiento, no importa (cobras cupón + nominal). Pero si necesitas vender antes, puedes perder dinero.</p>
                </AcademyCallout>
            </AcademySection>

            {/* Duration & Convexity */}
            <AcademySection title={<><BarChart3 size={22} /> Duración y Convexidad</>} id="section-3" className="asset-page__section">

                <AcademyAssetText >
                    <p>
                        La <strong>duración</strong> mide cuánto cambia el precio de un bono cuando los tipos se mueven.
                        A mayor duración, mayor sensibilidad.
                    </p>
                </AcademyAssetText>

                <AcademyAssetVisual variant="duration" title={<>Impacto de una subida de tipos del 1%</>}>
                        {[
                            { label: 'Letras 6m', duration: 0.5, loss: -0.5, color: '#10b981' },
                            { label: 'Bono 2a', duration: 1.9, loss: -1.9, color: '#3b82f6' },
                            { label: 'Bono 5a', duration: 4.5, loss: -4.5, color: '#8b5cf6' },
                            { label: 'Bono 10a', duration: 8.2, loss: -8.2, color: '#f59e0b' },
                            { label: 'Bono 30a', duration: 19.5, loss: -19.5, color: '#ef4444' },
                        ].map(item => (
                            <AcademyAssetBar key={item.label} variant="duration" label={<>{item.label}</>} value={<>{item.loss}%</>} fillStyle={{ width: `${Math.min(Math.abs(item.loss) * 5, 100)}%`, backgroundColor: item.color }} valueStyle={{ color: item.color }} />
                        ))}
                    </AcademyAssetVisual>

                <AcademyConvexityPanel title={<>¿Qué es la Convexidad?</>} copy={<>
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
                        </>} chart={<AcademyConvexityGraphic />} />
            </AcademySection>

            {/* Yield Curve */}
            <AcademySection title={<><TrendingUp size={22} /> La Curva de Tipos</>} id="section-4" className="asset-page__section">

                <AcademyAssetText >
                    <p>
                        La <strong>curva de rendimientos</strong> (yield curve) muestra qué rentabilidad ofrecen
                        los bonos según su plazo. Su forma nos dice mucho sobre las expectativas económicas del mercado.
                    </p>
                </AcademyAssetText>

                <div className="yield-curves">
                    {YIELD_CURVE_SCENARIOS.map(scenario => (
                        <AcademyYieldCurve key={scenario.name} title={scenario.name} signal={scenario.signal} description={scenario.desc} color={scenario.color}>
                                    {scenario.visual.map((val, i) => (
                                        <AcademyYieldBar key={i} label={<>{DURATION_LABELS[i]}</>} value={<>{val}%</>} height={`${val * 18}px`} color={scenario.color} />
                                    ))}
                                </AcademyYieldCurve>
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

                <AcademyAssetText >
                    <p>Las agencias de calificación (Moody's, S&P, Fitch) evalúan la probabilidad de que un emisor pague sus deudas. La calificación determina el interés que debe pagar el emisor.</p>
                </AcademyAssetText>

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
                        <AcademyRatingRow key={r.rating} rating={r.rating} color={r.color} width={r.width} label={r.label} example={r.example} />
                    ))}
                    <AcademyRatingDivider above={<>↑ Investment Grade</>} below={<>↓ High Yield (Basura)</>} />
                </div>
            </AcademySection>

            {/* Credit spread */}
            <AcademySection title={<><TrendingDown size={22} /> Spread de Crédito: El Termómetro del Riesgo</>} id="section-7" className="asset-page__section">

                <AcademyAssetText >
                    <p>
                        El <strong>spread de crédito</strong> es la prima extra que exige el mercado por prestar a una empresa
                        en lugar de a un Estado "libre de riesgo" (como Alemania o EE.UU.).
                    </p>
                    <p>
                        Fórmula rápida: <strong>Yield corporativo = Yield soberano + Spread</strong>.
                        Si un bono público a 5 años rinde 2.4% y un corporativo similar rinde 4.0%,
                        el spread es 1.6% (160 puntos básicos).
                    </p>
                </AcademyAssetText>

                <div className="credit-spreads-grid">
                    {CREDIT_SPREAD_REGIMES.map((regime) => (
                        <AcademyCreditCard key={regime.name} style={{ '--spread-color': regime.color } as React.CSSProperties} title={<>{regime.name}</>} range={<>{regime.range}</>} description={<>{regime.meaning}</>} implicationLabel={<>Lectura práctica:</>} implication={<>{regime.implication}</>} />
                    ))}
                </div>

                <AcademyCallout tone="warning" icon={<AlertTriangle size={20} />} title={<>Cuando el spread se abre rápido, manda el riesgo</>}>
                    <p>
                        Si los spreads se amplían de golpe, el crédito suele caer aunque los tipos oficiales no cambien.
                        En ese entorno, la calidad del emisor y la liquidez importan más que rascar unas décimas extra de yield.
                    </p>
                </AcademyCallout>

                <AcademySpreadExperiment title={<>Mini simulador: impacto de spread</>} intro={<>
                        Estimación rápida usando <strong>duración de spread</strong>:
                        impacto (%) ≈ - duración x cambio de spread (en %).
                    </>} mode={<>
                        <AcademyBondChoice type="button" aria-pressed={!isStressMode} onClick={() => setIsStressMode(false)} appearance="mode" active={!isStressMode}>
                            Normal
                        </AcademyBondChoice>
                        <AcademyBondChoice type="button" aria-pressed={isStressMode} onClick={() => {
                                setIsStressMode(true);
                                if (spreadShockBps < 0) setSpreadShockBps(100);
                            }} appearance="mode" active={isStressMode}>
                            Modo estrés
                        </AcademyBondChoice>
                    </>} presets={<>
                        <AcademyBondChoice type="button" aria-pressed={spreadClass === 'ig'} onClick={() => {
                                setSpreadClass('ig');
                                setSpreadDuration(spreadPresets.ig.duration);
                            }} appearance="preset" active={spreadClass === 'ig'}>
                            {spreadPresets.ig.label}
                        </AcademyBondChoice>
                        <AcademyBondChoice type="button" aria-pressed={spreadClass === 'hy'} onClick={() => {
                                setSpreadClass('hy');
                                setSpreadDuration(spreadPresets.hy.duration);
                            }} appearance="preset" active={spreadClass === 'hy'}>
                            {spreadPresets.hy.label}
                        </AcademyBondChoice>
                    </>} stressEnabled={isStressMode} stressChoices={<>
                            {STRESS_PRESETS.map((preset) => (
                                <AcademyBondChoice key={preset.label} type="button" onClick={() => setSpreadShockBps(preset.shock)} appearance="stress" active={spreadShockBps === preset.shock}>
                                    {preset.label} (+{preset.shock} pb)
                                </AcademyBondChoice>
                            ))}
                        </>} controls={<>
                        <AcademyBondRange label={<>Duración de spread: {spreadDuration.toFixed(1)}</>} type="range" min={1} max={8} step={0.1} value={spreadDuration} onChange={(e) => setSpreadDuration(Number(e.target.value))} />

                        <AcademyBondRange label={<>Shock de spread: {spreadShockBps > 0 ? `+${spreadShockBps}` : spreadShockBps} pb</>} type="range" min={shockMin} max={shockMax} step={10} value={spreadShockBps} onChange={(e) => setSpreadShockBps(Number(e.target.value))} />
                    </>} results={<>
                        <AcademyBondMetric appearance="spread" label={<>Spread inicial</>} value={<>{spreadPresets[spreadClass].spread} pb</>}  />
                        <AcademyBondMetric appearance="spread" label={<>Spread estimado final</>} value={<>{newSpread} pb</>}  />
                        <AcademyBondMetric appearance="spread" label={<>Impacto estimado en precio</>} value={<>
                                {estimatedPriceImpact > 0 ? '+' : ''}{estimatedPriceImpact.toFixed(2)}%
                            </>} valueClassName={estimatedPriceImpact <= 0 ? 'is-negative' : 'is-positive'} />
                    </>} note={<>
                        Aproximación de primer orden. No incluye cambios de tipos soberanos, convexidad, defaults ni efecto de cupones.
                    </>} />
            </AcademySection>

            {/* Checklist */}
            <AcademySection title={<><CheckCircle2 size={22} /> Checklist Antes de Comprar Bonos o ETFs</>} id="section-8" className="asset-page__section">

                <AcademyAssetText >
                    <p>
                        Esta revisión de 60 segundos evita la mayoría de errores típicos en renta fija:
                        comprar demasiada duración, asumir más crédito del que creías, o pagar comisiones altas para retornos bajos.
                    </p>
                </AcademyAssetText>
                <div className="bond-checklist-grid">
                    {BOND_ETF_CHECKLIST.map((item) => (
                        <AcademyTextCard appearance="checklist" key={item.title} title={<>{item.title}</>}><p>{item.desc}</p></AcademyTextCard>
                    ))}
                </div>

                <AcademyCallout tone="info" icon={<Lightbulb size={20} />} title={<>En bonos globales, cubrir divisa suele tener más sentido</>} style={{ marginTop: '1.5rem' }}>
                    <p>
                        Si tu objetivo de renta fija es estabilizar cartera en EUR, la cobertura de divisa
                        suele reducir ruido y hacer más predecible el comportamiento.
                    </p>
                    <AcademyAssetInlineLink to="/academy/risk">
                        Ver guía completa de cobertura de divisa →
                    </AcademyAssetInlineLink>
                </AcademyCallout>
            </AcademySection>

            {/* Ladder strategy */}
            <AcademySection title={<><Clock size={22} /> Estrategia Ladder (Escalera de Vencimientos)</>} id="section-9" className="asset-page__section">

                <AcademyAssetText >
                    <p>
                        La estrategia <strong>ladder</strong> consiste en repartir tu renta fija por vencimientos
                        escalonados. Así reduces el riesgo de entrar todo en un único momento de tipos y mantienes
                        liquidez recurrente para reinvertir.
                    </p>
                </AcademyAssetText>

                <div className="bond-ladder">
                    {LADDER_MODEL.map((step) => (
                        <AcademyBondLadderStep key={step.rung} rung={<>{step.rung}</>} title={<>{step.maturity}</>} description={<>{step.objective}</>} hint={<>{step.yieldHint}</>} />
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

                <AcademyAssetText >
                    <p>
                        Esta mini calculadora estima la sensibilidad conjunta de tu cartera de renta fija
                        ante movimientos paralelos de tipos.
                    </p>
                </AcademyAssetText>

                <AcademyDurationExperiment inputs={<>
                        <AcademyDurationInputs title={<>RF Corto Plazo</>}><label>
                                <span>Peso: {weightShort}%</span>
                                <input type="range" min={0} max={100} step={1} value={weightShort} onChange={(e) => setWeightShort(Number(e.target.value))} />
                            </label><label>
                                <span>Duración: {durShort.toFixed(1)}</span>
                                <input type="range" min={0.5} max={4} step={0.1} value={durShort} onChange={(e) => setDurShort(Number(e.target.value))} />
                            </label></AcademyDurationInputs>

                        <AcademyDurationInputs title={<>RF Media</>}><label>
                                <span>Peso: {weightMid}%</span>
                                <input type="range" min={0} max={100} step={1} value={weightMid} onChange={(e) => setWeightMid(Number(e.target.value))} />
                            </label><label>
                                <span>Duración: {durMid.toFixed(1)}</span>
                                <input type="range" min={2} max={8} step={0.1} value={durMid} onChange={(e) => setDurMid(Number(e.target.value))} />
                            </label></AcademyDurationInputs>

                        <AcademyDurationInputs title={<>RF Larga</>}><label>
                                <span>Peso: {weightLong}%</span>
                                <input type="range" min={0} max={100} step={1} value={weightLong} onChange={(e) => setWeightLong(Number(e.target.value))} />
                            </label><label>
                                <span>Duración: {durLong.toFixed(1)}</span>
                                <input type="range" min={5} max={15} step={0.1} value={durLong} onChange={(e) => setDurLong(Number(e.target.value))} />
                            </label></AcademyDurationInputs>
                    </>} summary={<>
                        <AcademyBondMetric appearance="duration" label={<>Total pesos introducidos</>} value={<>{portfolioWeightTotal}%</>}  />
                        <AcademyBondMetric appearance="duration" label={<>Duración agregada estimada</>} value={<>{portfolioDuration.toFixed(2)}</>}  />
                        <AcademyBondMetric appearance="duration" label={<>Impacto estimado con +1% tipos</>} value={<>{up100bpImpact.toFixed(2)}%</>} valueClassName="is-negative" />
                        <AcademyBondMetric appearance="duration" label={<>Impacto estimado con -1% tipos</>} value={<>+{down100bpImpact.toFixed(2)}%</>} valueClassName="is-positive" />
                    </>}><AcademyDurationMix title={<>Mix normalizado de cartera</>}>
                            <AcademyDurationMixRow label={<>Corto</>} value={<>{normalizedShort.toFixed(1)}%</>} width={`${normalizedShort}%`} term="short" />
                            <AcademyDurationMixRow label={<>Medio</>} value={<>{normalizedMid.toFixed(1)}%</>} width={`${normalizedMid}%`} term="mid" />
                            <AcademyDurationMixRow label={<>Largo</>} value={<>{normalizedLong.toFixed(1)}%</>} width={`${normalizedLong}%`} term="long" />
                        </AcademyDurationMix></AcademyDurationExperiment>
            </AcademySection>

            {/* Common mistakes */}
            <AcademySection title={<><AlertTriangle size={22} /> Errores Comunes en Renta Fija</>} id="section-11" className="asset-page__section">

                <div className="bond-mistakes-grid">
                    {COMMON_BOND_ERRORS.map((item) => (
                        <AcademyTextCard appearance="mistake" key={item.mistake} title={<>{item.mistake}</>}><p><strong>Qué pasa:</strong> {item.impact}</p><p><strong>Cómo evitarlo:</strong> {item.fix}</p></AcademyTextCard>
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
            <AcademyFinalTip as="section" icon={<Lightbulb size={28} />} title={<>Consejo Final</>}>
                        En un entorno de tipos altos, las <strong>Letras del Tesoro y los bonos de corto plazo</strong> son
                        tu mejor refugio en renta fija. Ofrecen rentabilidad decente sin el riesgo de duración.
                        Si quieres RF a largo plazo, usa ETFs indexados y acepta la volatilidad temporal.
                        <strong> La renta fija NO es fija si vendes antes del vencimiento.</strong>
                    </AcademyFinalTip>
        </div>
    );
}
