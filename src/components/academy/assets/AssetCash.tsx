import {AcademyAssetVisual} from '../ui/AcademyBondParts';
import {AcademyAssetBar} from '../ui/AcademyAssetBars';
import {AcademyAssetHero,AcademyAssetBackLink,AcademyAssetText,AcademyAssetInlineLink} from '../ui/AcademyAssetReading';
import { AcademyFinalTip } from '../ui/AcademyAssetExplainers';

import { AssetCategoryCard } from '../ui/AssetCategoryCard';
import { AcademyListCard } from '../ui/AcademyListCard';
import { AcademyCallout } from '../ui/AcademyCallout';
import { AcademyStepCard } from '../ui/AcademyStepCard';
import { AcademyMetric } from '../ui/AcademyMetric';
import { AcademySection } from '../ui/AcademySection';
import { AcademyGrid } from '../ui/AcademyGrid';
import {
    Wallet, ArrowLeft, Globe, CheckCircle2, AlertTriangle,
    Lightbulb, BarChart3, Clock, Shield, Activity
} from 'lucide-react';
import { AssetGuideNav } from './AssetGuideNav';
import './AssetPage.css';

const CASH_INSTRUMENTS = [
    {
        name: 'Cuentas Remuneradas',
        yield: '1-2%',
        liquidity: 'Inmediata',
        risk: 'Mínimo',
        desc: 'Dinero disponible al instante con interés. Trade Republic, MyInvestor, Openbank ofrecen las mejores condiciones.',
        icon: '🏧',
        color: '#3b82f6'
    },
    {
        name: 'Fondos Monetarios',
        yield: '2-3%',
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
        yield: '0-2%',
        liquidity: 'Al vencimiento',
        risk: 'Mínimo',
        desc: 'Máxima seguridad respaldada por el Estado. Se compran directamente en el Tesoro Público sin comisiones.',
        icon: '🏛️',
        color: '#f59e0b'
    }
];

export function AssetCash() {
    return (
        <div className="asset-page asset-page--cash" style={{ '--asset-color': '#06b6d4' } as React.CSSProperties}>
            <AcademyAssetBackLink to="/academy/portfolio">
                <ArrowLeft size={18} /> Estrategia y cartera
            </AcademyAssetBackLink>

            <AcademyAssetHero style={{ '--hero-color': '#64748b' } as React.CSSProperties} icon={<>
                    <Wallet size={48} />
                </>} title={<>Liquidez</>} description={<>
                    El oxígeno de tu cartera. La liquidez te da tranquilidad, capacidad de reacción ante oportunidades
                    y es el primer pilar de toda estrategia financiera sólida.
                </>}>
                    <AcademyMetric variant="hero" label={<>Rendimiento actual</>} value={<>0-2%</>} valueProps={{"className":"hero-stat__value"}} />
                    <AcademyMetric variant="hero" label={<>Volatilidad</>} value={<>0%</>} valueProps={{"className":"hero-stat__value"}} />
                    <AcademyMetric variant="hero" label={<>Disponibilidad</>} value={<>Inmediato</>} valueProps={{"className":"hero-stat__value"}} />
                </AcademyAssetHero>

            <AssetGuideNav sections={[
                { id: 'section-1', label: 'Para qué sirve' },
                { id: 'section-2', label: 'Instrumentos' },
                { id: 'section-3', label: 'Inflación' },
                { id: 'section-4', label: 'Ventajas y riesgos' },
                { id: 'section-5', label: 'Escalera de vencimientos' },
            ]} />

            <AcademySection title={<><Globe size={22} /> ¿Por qué tener Liquidez?</>} id="section-1" className="asset-page__section">

                <AcademyAssetText >
                    <p>
                        La liquidez no es una inversión, es un <strong>colchón de seguridad</strong>. Su función no es
                        generar rentabilidad, sino <strong>darte estabilidad emocional y capacidad de respuesta</strong>.
                    </p>
                    <p>
                        Tener un fondo de emergencia evita que tengas que vender inversiones en el peor momento (cuando
                        el mercado ha caído) para cubrir gastos inesperados. Es la diferencia entre sobrevivir una crisis
                        y salir reforzado de ella.
                    </p>
                </AcademyAssetText>

                <AcademyCallout tone="info" icon={<Lightbulb size={20} />} title={<>Regla de los 3-6 meses</>}>
                    <p>Mantén entre 3 y 6 meses de gastos indispensables en liquidez. Si tienes ingresos variables o eres autónomo, sube a 6-12 meses. Este colchón debe ser intocable salvo emergencias reales.</p>
                </AcademyCallout>
            </AcademySection>

            <AcademySection title={<><BarChart3 size={22} /> Instrumentos de Liquidez</>} id="section-2" className="asset-page__section">

                <p className="asset-page__section-desc">No todo el cash es igual. Hay formas de mantener liquidez que rinden significativamente más que el dinero en una cuenta corriente.</p>

                <AcademyGrid variant="subtypes" className="asset-page__subtype-grid">
                    {CASH_INSTRUMENTS.map((inst) => (
                        <AssetCategoryCard key={inst.name} style={{ '--subtype-color': inst.color } as React.CSSProperties} icon={<span style={{ fontSize: '1.5rem' }}>{inst.icon}</span>} title={<>{inst.name}</>} description={<>{inst.desc}</>} footer={<>
                                <span>Yield: <strong>{inst.yield}</strong></span>
                                <span>Liquidez: <strong>{inst.liquidity}</strong></span>
                            </>} />
                    ))}
                </AcademyGrid>
            </AcademySection>

            <AcademySection title={<><AlertTriangle size={22} /> El Enemigo Silencioso: La Inflación</>} id="section-3" className="asset-page__section">

                <AcademyAssetText >
                    <p>
                        Si la inflación es del 3% y tu cuenta paga un 1%, estás <strong>perdiendo un 2% de poder adquisitivo cada año</strong>.
                        10.000€ hoy comprarán lo mismo que 8.170€ dentro de 10 años con inflación del 2%.
                    </p>
                </AcademyAssetText>

                <AcademyAssetVisual variant="inflation" title={<>Erosión del poder adquisitivo: 10.000€ con inflación del 3%</>}>
                        {[
                            { year: 'Año 0', value: 10000, pct: 100 },
                            { year: 'Año 3', value: 9135, pct: 91 },
                            { year: 'Año 5', value: 8587, pct: 86 },
                            { year: 'Año 10', value: 7374, pct: 74 },
                            { year: 'Año 20', value: 5438, pct: 54 },
                            { year: 'Año 30', value: 4012, pct: 40 },
                        ].map(item => (
                            <AcademyAssetBar key={item.year} variant="inflation" label={<>{item.year}</>} value={<>{item.value.toLocaleString('es-ES')}€</>} fillStyle={{ width: `${item.pct}%` }}  />
                        ))}
                    </AcademyAssetVisual>

                <AcademyCallout tone="warning" icon={<Activity size={24} />} title={<>¿Quieres ver cómo afecta la inflación a tus propios ahorros?</>} style={{ marginTop: '2rem' }}>
                    <p>
                        Usa nuestro simulador interactivo para calcular cuánto poder adquisitivo perderás en el tiempo si no inviertes tu dinero.
                    </p>
                    <AcademyAssetInlineLink to="/academy/inflation-predator" style={{
                        display: 'inline-block',
                        marginTop: '0.5rem',
                        color: 'var(--accent-primary)',
                        fontWeight: '600',
                        textDecoration: 'none'
                    }}>
                        Ir al Depredador de la Inflación →
                    </AcademyAssetInlineLink>
                </AcademyCallout>
            </AcademySection>

            <AcademySection title={<><Shield size={22} /> Ventajas y Riesgos</>} id="section-4" className="asset-page__section">

                <AcademyGrid variant="prosCons" className="asset-page__pros-cons">
                    <AcademyListCard kind="pros" title={<><CheckCircle2 size={18} /> Ventajas</>}>
                            <li>Disponibilidad inmediata para emergencias</li>
                            <li>Sin volatilidad ni riesgo de mercado</li>
                            <li>Tranquilidad emocional en periodos de crisis</li>
                            <li>Permite aprovechar oportunidades de compra</li>
                            <li>Imprescindible como fondo de emergencia</li>
                        </AcademyListCard>
                    <AcademyListCard kind="cons" title={<><AlertTriangle size={18} /> Riesgos</>}>
                            <li>Rentabilidad real frecuentemente negativa (inflación)</li>
                            <li>Coste de oportunidad: dinero que no trabaja para ti</li>
                            <li>Tentación de gastar si está demasiado accesible</li>
                            <li>Garantía de depósitos limitada a 100.000€ por entidad</li>
                            <li>Falsa sensación de seguridad (pierdes vs inflación)</li>
                        </AcademyListCard>
                </AcademyGrid>
            </AcademySection>

            <AcademySection title={<><Clock size={22} /> Estrategia de Escalera (Ladder)</>} id="section-5" className="asset-page__section">

                <AcademyAssetText >
                    <p>
                        Una forma inteligente de gestionar liquidez es crear una «escalera» de vencimientos.
                        Divides tu cash entre instrumentos con diferentes plazos para maximizar rentabilidad
                        sin perder accesibilidad total.
                    </p>
                </AcademyAssetText>

                <AcademyGrid variant="steps" className="asset-page__steps">
                    <AcademyStepCard number={'1'} title={'Inmediato (33%)'}>Cuenta remunerada para gastos inesperados. Disponibilidad instantánea.</AcademyStepCard>
                    <AcademyStepCard number={'2'} title={'3 meses (33%)'}>Fondo monetario o Letras del Tesoro a 3 meses. Mejor rendimiento con alta liquidez.</AcademyStepCard>
                    <AcademyStepCard number={'3'} title={'6-12 meses (33%)'}>Letras del Tesoro a 6-12 meses o depósito. Máximo rendimiento del cash.</AcademyStepCard>
                </AcademyGrid>
            </AcademySection>

            <AcademyFinalTip as="section" icon={<Lightbulb size={28} />} title={<>Consejo Final</>}>
                        El cash no es una inversión, es un <strong>seguro</strong>. Tener demasiado te empobrece lentamente
                        (inflación), pero tener muy poco te obliga a malvender inversiones en el peor momento.
                        <strong> Encuentra tu equilibrio: 3-6 meses de gastos es la regla de oro.</strong>
                    </AcademyFinalTip>
        </div>
    );
}
