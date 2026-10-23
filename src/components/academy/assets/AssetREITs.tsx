import { AcademyListCard } from '../ui/AcademyListCard';
import { AcademyCallout } from '../ui/AcademyCallout';
import { AcademyStepCard } from '../ui/AcademyStepCard';
import { AcademyMetric } from '../ui/AcademyMetric';
import { AcademySection } from '../ui/AcademySection';
import { AcademyGrid } from '../ui/AcademyGrid';
import { AcademyPanel } from '../ui/AcademyPanel';
import { Link } from 'react-router-dom';
import {
    Building2, ArrowLeft, Globe, Zap, CheckCircle2, AlertTriangle,
    Lightbulb, Home, Building, Factory, Truck, Shield
} from 'lucide-react';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { AssetGuideNav } from './AssetGuideNav';
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
        <div className="asset-page asset-page--reits" style={{ '--asset-color': '#8b5cf6' } as React.CSSProperties}>
            <Link to="/academy/portfolio" className="asset-page__back">
                <ArrowLeft size={18} /> Estrategia y cartera
            </Link>

            <AcademyPageHeader className="asset-page__hero" section="Aprender" style={{ '--hero-color': '#8b5cf6' } as React.CSSProperties}>
                <div className="asset-page__hero-icon">
                    <Building2 size={48} />
                </div>
                <h1>Inmobiliario cotizado</h1>
                <p className="asset-page__hero-sub">
                    Inversión inmobiliaria profesional con la liquidez de una acción. Descubre cómo
                    generar rentas periódicas sin las complicaciones de gestionar un piso.
                </p>
                <div className="asset-page__hero-stats">
                    <AcademyMetric variant="hero" label={<>Retorno histórico total</>} value={<>6-8%</>} valueProps={{"className":"hero-stat__value"}} />
                    <AcademyMetric variant="hero" label={<>Volatilidad</>} value={<>12-18%</>} valueProps={{"className":"hero-stat__value"}} />
                    <AcademyMetric variant="hero" label={<>Horizonte recomendado</>} value={<>5+ años</>} valueProps={{"className":"hero-stat__value"}} />
                </div>
            </AcademyPageHeader>

            <AssetGuideNav sections={[
                { id: 'section-1', label: 'Conceptos' },
                { id: 'section-2', label: 'Sectores' },
                { id: 'section-3', label: 'Ventajas y riesgos' },
                { id: 'section-4', label: 'Cómo invertir' },
            ]} />

            <AcademySection title={<><Globe size={22} /> ¿Qué son los REITs?</>} id="section-1" className="asset-page__section">

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

                <AcademyCallout tone="info" icon={<Lightbulb size={20} />} title={<>La Regla del 90%</>}>
                    <p>Por ley, los REITs deben repartir al menos el 90% de sus beneficios imponibles en forma de dividendos a sus accionistas. Esto los convierte en activos ideales para quienes buscan flujo de caja.</p>
                </AcademyCallout>
            </AcademySection>

            <AcademySection title={<><Building size={22} /> Sectores Inmobiliarios</>} id="section-2" className="asset-page__section">

                <AcademyGrid variant="subtypes" className="asset-page__subtype-grid">
                    {REIT_TYPES.map((type) => (
                        <AcademyPanel variant="subtype" key={type.title} className="subtype-card" style={{ '--subtype-color': type.color } as React.CSSProperties}>
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
                        </AcademyPanel>
                    ))}
                </AcademyGrid>

                <AcademyCallout tone="info" icon={<Lightbulb size={20} />} title={<>REITs globales = también riesgo divisa</>} style={{ marginTop: '1.5rem' }}>
                    <p>Si compras REITs USA o globales desde EUR, parte del resultado vendrá de la moneda. Decide conscientemente si quieres versión cubierta (hedged) o no cubierta.</p>
                    <Link to="/academy/risk" className="asset-page__cta-link">
                        Revisar cuándo cubrir divisa →
                    </Link>
                </AcademyCallout>
            </AcademySection>

            <AcademySection title={<><Shield size={22} /> Ventajas y Riesgos</>} id="section-3" className="asset-page__section">

                <AcademyGrid variant="prosCons" className="asset-page__pros-cons">
                    <AcademyListCard kind="pros" title={<><CheckCircle2 size={18} /> Ventajas</>}>
                            <li>Alta yield (dividendos constantes y crecientes)</li>
                            <li>Protección natural contra la inflación vía rentas</li>
                            <li>Diversificación geográfica y sectorial masiva</li>
                            <li>Liquidez inmediata (vendes en segundos, no meses)</li>
                            <li>Sin costes de mantenimiento ni gestión de inquilinos</li>
                        </AcademyListCard>
                    <AcademyListCard kind="cons" title={<><AlertTriangle size={18} /> Riesgos</>}>
                            <li>Muy sensibles a subidas de tipos de interés</li>
                            <li>Ciclos inmobiliarios largos y a veces volátiles</li>
                            <li>Correlación media-alta con la bolsa en grandes crisis</li>
                            <li>Fiscalidad de dividendos (no son tan eficientes como fondos de acumulación)</li>
                            <li>Riesgo de concentración si el sector elegido sufre (ej. oficinas post-COVID)</li>
                        </AcademyListCard>
                </AcademyGrid>
            </AcademySection>

            <AcademySection title={<><Zap size={22} /> ¿Cómo invertir profesionalmente?</>} id="section-4" className="asset-page__section">

                <AcademyGrid variant="steps" className="asset-page__steps">
                    <AcademyStepCard number={'1'} title={'ETFs de REITs Globales'} badgeTone="recommended" badge={'Recomendado'}>Inviertes en cientos de inmobiliarias de todo el mundo en un solo clic. Máxima diversificación.</AcademyStepCard>
                    <AcademyStepCard number={'2'} title={'REITs Individuales'}>Solo para quienes quieren elegir sectores específicos (ej. Logística o centros de datos).</AcademyStepCard>
                </AcademyGrid>
            </AcademySection>

            <section className="asset-page__final-tip">
                <Lightbulb size={28} />
                <div>
                    <h3>Para tu cartera</h3>
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
