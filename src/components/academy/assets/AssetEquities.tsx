import { AcademyMetric } from '../ui/AcademyMetric';
import { AcademySection } from '../ui/AcademySection';
import { AcademyGrid } from '../ui/AcademyGrid';
import { AcademyPanel } from '../ui/AcademyPanel';
import { Link } from 'react-router-dom';
import {
    TrendingUp, ArrowLeft, Globe, Zap, CheckCircle2, AlertTriangle,
    Lightbulb, BarChart3, PieChart, Clock, Target, Shield
} from 'lucide-react';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { AssetGuideNav } from './AssetGuideNav';
import './AssetPage.css';

const SUB_TYPES = [
    {
        title: 'Acciones de Gran Capitalización (Large Cap)',
        desc: 'Empresas consolidadas con capitalización >10.000M€. Son el núcleo de cualquier cartera.',
        examples: ['Apple, Microsoft, LVMH, Nestlé', 'ETF: iShares Core MSCI World', 'ETF: Vanguard S&P 500'],
        risk: 'Medio-Alto',
        returnRange: '7-10%',
        color: '#3b82f6'
    },
    {
        title: 'Acciones de Mediana Cap (Mid Cap)',
        desc: 'Empresas en fase de crecimiento con capitalización entre 2.000M y 10.000M€. Mayor potencial pero más volátiles.',
        examples: ['ETF: iShares MSCI World Mid Cap', 'Empresas regionales líderes'],
        risk: 'Alto',
        returnRange: '8-12%',
        color: '#8b5cf6'
    },
    {
        title: 'Acciones de Pequeña Cap (Small Cap)',
        desc: 'Empresas pequeñas (<2.000M€). Históricamente mayor retorno (Small Cap Premium) pero con volatilidad considerable.',
        examples: ['ETF: iShares MSCI World Small Cap', 'ETF: SPDR Russell 2000'],
        risk: 'Muy Alto',
        returnRange: '9-13%',
        color: '#f59e0b'
    },
    {
        title: 'Acciones Value (Valor)',
        desc: 'Empresas infravaloradas por el mercado respecto a sus fundamentales. Estrategia popularizada por Warren Buffett y Benjamin Graham.',
        examples: ['ETF: iShares Edge MSCI World Value', 'Berkshire Hathaway, bancos, energéticas'],
        risk: 'Medio-Alto',
        returnRange: '8-11%',
        color: '#10b981'
    },
    {
        title: 'Acciones Growth (Crecimiento)',
        desc: 'Empresas con alto crecimiento de ingresos que reinvierten todo. No suelen pagar dividendo. Altísima valoración.',
        examples: ['NVIDIA, Tesla, Meta', 'ETF: iShares S&P 500 Growth'],
        risk: 'Muy Alto',
        returnRange: 'Variable',
        color: '#ef4444'
    },
    {
        title: 'Acciones de Dividendo',
        desc: 'Empresas maduras que reparten una parte significativa de sus beneficios. Generan flujo de caja constante.',
        examples: ['Procter & Gamble, Johnson & Johnson', 'ETF: SPDR S&P Euro Dividend Aristocrats', 'ETF: Vanguard High Dividend Yield'],
        risk: 'Medio',
        returnRange: '5-8% + dividendo',
        color: '#6366f1'
    }
];

const GEOGRAPHIC_ZONES = [
    { name: 'MSCI World', region: 'Desarrollados (23 países)', weight: '~70% EE.UU.', color: '#3b82f6' },
    { name: 'S&P 500', region: 'EE.UU. (500 mayores)', weight: '100% EE.UU.', color: '#ef4444' },
    { name: 'MSCI Europe', region: 'Europa Desarrollada', weight: 'UK, Francia, Alemania…', color: '#10b981' },
    { name: 'MSCI Emerging', region: 'Emergentes (24 países)', weight: 'China, India, Brasil…', color: '#f59e0b' },
    { name: 'Nikkei 225', region: 'Japón', weight: '100% Japón', color: '#8b5cf6' },
];

export function AssetEquities() {
    return (
        <div className="asset-page asset-page--equities" style={{ '--asset-color': '#3b82f6' } as React.CSSProperties}>
            <Link to="/academy/portfolio" className="asset-page__back">
                <ArrowLeft size={18} /> Estrategia y cartera
            </Link>

            <AcademyPageHeader className="asset-page__hero" section="Aprender" style={{ '--hero-color': '#3b82f6' } as React.CSSProperties}>
                <div className="asset-page__hero-icon">
                    <TrendingUp size={48} />
                </div>
                <h1>Renta Variable (Acciones)</h1>
                <p className="asset-page__hero-sub">
                    El motor de crecimiento de cualquier cartera a largo plazo. Entiende sus variantes,
                    riesgos y cómo elegir la exposición correcta para ti.
                </p>
                <div className="asset-page__hero-stats">
                    <AcademyMetric variant="hero" label={<>Retorno histórico anual</>} value={<>7-10%</>} valueProps={{"className":"hero-stat__value"}} />
                    <AcademyMetric variant="hero" label={<>Volatilidad típica</>} value={<>15-20%</>} valueProps={{"className":"hero-stat__value"}} />
                    <AcademyMetric variant="hero" label={<>Horizonte recomendado</>} value={<>7+ años</>} valueProps={{"className":"hero-stat__value"}} />
                </div>
            </AcademyPageHeader>

            <AssetGuideNav sections={[
                { id: 'section-1', label: 'Conceptos' },
                { id: 'section-2', label: 'Tipos de acciones' },
                { id: 'section-3', label: 'Value y growth' },
                { id: 'section-4', label: 'Geografía' },
                { id: 'section-5', label: 'Ventajas y riesgos' },
                { id: 'section-6', label: 'Cómo invertir' },
                { id: 'section-7', label: 'Métricas' },
                { id: 'section-8', label: 'Valorar una empresa' },
            ]} />

            {/* What is it */}
            <AcademySection title={<><Globe size={22} /> ¿Qué es la Renta Variable?</>} id="section-1" className="asset-page__section">

                <div className="asset-page__text-block">
                    <p>
                        Comprar acciones es comprar <strong>una fracción de propiedad real de una empresa</strong>.
                        Si la empresa crece, tu participación se revaloriza. Si la empresa reparte beneficios,
                        recibes dividendos. Es el activo con mayor rendimiento histórico a largo plazo, pero también
                        el que más fluctúa a corto plazo.
                    </p>
                    <p>
                        Durante los últimos 100 años, las acciones globales han generado un retorno real
                        (descontando inflación) de aproximadamente el <strong>5-7% anual</strong>. Sin embargo,
                        en periodos cortos puedes ver caídas del 30-50% que requieren <strong>fortaleza emocional</strong>.
                    </p>
                </div>

                <div className="asset-page__callout asset-page__callout--info">
                    <Lightbulb size={20} />
                    <div>
                        <strong>Dato clave</strong>
                        <p>El S&P 500 ha caído más de un 20% en 12 ocasiones desde 1929, pero siempre ha recuperado máximos históricos. La paciencia es el superpoder del inversor en acciones.</p>
                    </div>
                </div>
            </AcademySection>

            {/* Sub-types */}
            <AcademySection title={<><BarChart3 size={22} /> Tipos de Acciones</>} id="section-2" className="asset-page__section">

                <p className="asset-page__section-desc">No todas las acciones son iguales. Entender las diferencias es clave para elegir tu exposición.</p>

                <AcademyGrid variant="subtypes" className="asset-page__subtype-grid">
                    {SUB_TYPES.map((type) => (
                        <AcademyPanel variant="subtype" key={type.title} className="subtype-card" style={{ '--subtype-color': type.color } as React.CSSProperties}>
                            <div className="subtype-card__header">
                                <div className="subtype-card__dot" />
                                <h3>{type.title}</h3>
                            </div>
                            <p className="subtype-card__desc">{type.desc}</p>
                            <div className="subtype-card__examples">
                                <span className="subtype-card__tag-label">Ejemplos:</span>
                                <div className="subtype-card__tags">
                                    {type.examples.map((ex, i) => (
                                        <span key={i} className="subtype-card__tag">{ex}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="subtype-card__footer">
                                <span>Riesgo: <strong>{type.risk}</strong></span>
                                <span>Retorno: <strong>{type.returnRange}</strong></span>
                            </div>
                        </AcademyPanel>
                    ))}
                </AcademyGrid>
            </AcademySection>

            {/* Value vs Growth visual */}
            <AcademySection title={<><Target size={22} /> Value vs Growth: El Eterno Debate</>} id="section-3" className="asset-page__section">

                <div className="asset-page__versus">
                    <AcademyPanel variant="comparison" className="versus-card versus-card--value">
                        <h3>📊 Value (Valor)</h3>
                        <ul>
                            <li>Empresas baratas según fundamentales (PER bajo)</li>
                            <li>Suelen pagar dividendos</li>
                            <li>Rendimiento superior a largo plazo históricamente</li>
                            <li>Sectores: banca, energía, utilities</li>
                            <li>Mentalidad: «comprar un euro por 50 céntimos»</li>
                        </ul>
                        <div className="versus-card__badge">Warren Buffett</div>
                    </AcademyPanel>
                    <div className="versus-divider">VS</div>
                    <AcademyPanel variant="comparison" className="versus-card versus-card--growth">
                        <h3>🚀 Growth (Crecimiento)</h3>
                        <ul>
                            <li>Empresas con alto crecimiento de ingresos</li>
                            <li>Raramente pagan dividendo (reinvierten todo)</li>
                            <li>Valoraciones elevadas (PER alto)</li>
                            <li>Sectores: tech, biotech, IA</li>
                            <li>Mentalidad: «la empresa del futuro»</li>
                        </ul>
                        <div className="versus-card__badge">Cathie Wood</div>
                    </AcademyPanel>
                </div>
            </AcademySection>

            {/* Geographic zones */}
            <AcademySection title={<><PieChart size={22} /> Zonas Geográficas</>} id="section-4" className="asset-page__section">

                <p className="asset-page__section-desc">
                    La diversificación geográfica reduce el riesgo de depender de un solo país o región.
                </p>
                <AcademyGrid variant="geography" className="asset-page__geo-grid">
                    {GEOGRAPHIC_ZONES.map(zone => (
                        <AcademyPanel variant="geography" key={zone.name} className="geo-card" style={{ borderLeftColor: zone.color }}>
                            <h4 style={{ color: zone.color }}>{zone.name}</h4>
                            <p className="geo-card__region">{zone.region}</p>
                            <p className="geo-card__weight">{zone.weight}</p>
                        </AcademyPanel>
                    ))}
                </AcademyGrid>

                <div className="asset-page__callout asset-page__callout--warning">
                    <AlertTriangle size={20} />
                    <div>
                        <strong>Sesgo doméstico (Home Bias)</strong>
                        <p>Los inversores tienden a sobreponderar su propio país. España representa solo el ~0.6% del mercado mundial. Si inviertes solo en el IBEX35, estás concentrando riesgo innecesariamente.</p>
                        <Link to="/academy/risk" className="asset-page__cta-link">
                            Ver guía de riesgo de divisa y cobertura →
                        </Link>
                    </div>
                </div>
            </AcademySection>

            {/* Pros and cons */}
            <AcademySection title={<><Shield size={22} /> Ventajas y Riesgos</>} id="section-5" className="asset-page__section">

                <AcademyGrid variant="prosCons" className="asset-page__pros-cons">
                    <AcademyPanel variant="prosCons" className="pc-column pc-column--pros">
                        <h3><CheckCircle2 size={18} /> Ventajas</h3>
                        <ul>
                            <li>Mayor rentabilidad histórica a largo plazo vs cualquier otro activo</li>
                            <li>Protección natural contra la inflación</li>
                            <li>Liquidez inmediata en mercados cotizados</li>
                            <li>Posibilidad de ingresos pasivos vía dividendos</li>
                            <li>Accesibilidad: desde 1€ con ETFs fraccionados</li>
                            <li>Fiscalidad favorable en España para fondos indexados (traspaso sin tributar)</li>
                        </ul>
                    </AcademyPanel>
                    <AcademyPanel variant="prosCons" className="pc-column pc-column--cons">
                        <h3><AlertTriangle size={18} /> Riesgos</h3>
                        <ul>
                            <li>Caídas del 30-50% son parte del juego</li>
                            <li>Necesitas horizonte mínimo de 7-10 años</li>
                            <li>Stock-picking individual tiene alto riesgo de pérdida permanente</li>
                            <li>El estrés emocional en crisis lleva a vender en el peor momento</li>
                            <li>Rendimientos pasados no garantizan rendimientos futuros</li>
                            <li>Riesgo divisa si inviertes fuera de la Eurozona</li>
                        </ul>
                    </AcademyPanel>
                </AcademyGrid>
            </AcademySection>

            {/* How to invest */}
            <AcademySection title={<><Zap size={22} /> ¿Cómo Invertir en Acciones?</>} id="section-6" className="asset-page__section">

                <AcademyGrid variant="steps" className="asset-page__steps">
                    <AcademyPanel variant="step" className="step-card">
                        <div className="step-card__number">1</div>
                        <h4>ETFs Indexados</h4>
                        <p>Un solo ETF como el MSCI World te da exposición a +1.500 empresas de 23 países.</p>
                    </AcademyPanel>
                    <AcademyPanel variant="step" className="step-card">
                        <div className="step-card__number">2</div>
                        <h4>Fondos Indexados</h4>
                        <p>La opción más recomendada para el 95% de inversores. Misma filosofía que ETFs pero con ventaja fiscal en España: puedes traspasar entre fondos sin tributar. Ideal para acumular a largo plazo.</p>
                        <span className="step-card__badge step-card__badge--fiscal">Ventaja Fiscal 🇪🇸</span>
                    </AcademyPanel>
                    <AcademyPanel variant="step" className="step-card">
                        <div className="step-card__number">3</div>
                        <h4>Acciones Individuales</h4>
                        <p>Solo si tienes conocimiento profundo del análisis fundamental. Riesgo de concentración muy alto. Máximo 10-20% de cartera.</p>
                        <span className="step-card__badge step-card__badge--advanced">Avanzado</span>
                    </AcademyPanel>
                </AcademyGrid>
            </AcademySection>

            {/* Key metrics */}
            <AcademySection title={<><Clock size={22} /> Métricas para Entender Acciones</>} id="section-7" className="asset-page__section">

                <AcademyGrid variant="metrics" className="asset-page__metrics-grid">
                    <AcademyPanel variant="explainer" className="metric-explainer">
                        <h4>PER (Price/Earnings Ratio)</h4>
                        <p>Cuántos años de beneficios estás pagando. PER 15 = pagas 15 años de beneficio actual. Menor = más barato.</p>
                        <div className="metric-explainer__range">
                            <span className="range-low">PER {'<'} 12 (Barato)</span>
                            <span className="range-high">PER {'>'} 25 (Caro)</span>
                        </div>
                    </AcademyPanel>
                    <AcademyPanel variant="explainer" className="metric-explainer">
                        <h4>Dividend Yield</h4>
                        <p>Porcentaje de dividendo anual respecto al precio. Una acción a 100€ que paga 4€ tiene yield del 4%.</p>
                        <div className="metric-explainer__range">
                            <span className="range-low">{'<'} 2% (Growth)</span>
                            <span className="range-high">{'>'} 4% (Income)</span>
                        </div>
                    </AcademyPanel>
                    <AcademyPanel variant="explainer" className="metric-explainer">
                        <h4>Beta</h4>
                        <p>Mide la volatilidad respecto al mercado. Beta 1 = igual al mercado. Beta 1.5 = 50% más volátil.</p>
                        <div className="metric-explainer__range">
                            <span className="range-low">{'<'} 0.8 (Defensivo)</span>
                            <span className="range-high">{'>'} 1.2 (Agresivo)</span>
                        </div>
                    </AcademyPanel>
                    <AcademyPanel variant="explainer" className="metric-explainer">
                        <h4>Sharpe Ratio</h4>
                        <p>Retorno por unidad de riesgo asumida. Mayor = mejor relación riesgo/recompensa. Ideal {'>'} 1.</p>
                        <div className="metric-explainer__range">
                            <span className="range-low">{'<'} 0.5 (Pobre)</span>
                            <span className="range-high">{'>'} 1.0 (Excelente)</span>
                        </div>
                    </AcademyPanel>
                </AcademyGrid>
            </AcademySection>

            {/* Deep Dive CTA */}
            <AcademySection id="section-8" className="asset-page__section asset-page__section--cta">
                <div className="cta-box">
                    <div className="cta-box__content">
                        <h3>🔍 ¿Quieres aprender a valorar empresas como un profesional?</h3>
                        <p>
                            Hemos preparado una guía detallada donde exploramos métricas avanzadas (ROIC, FCF Yield, Deuda/EBITDA)
                            y te enseñamos a distinguir entre un gran negocio y una trampa de valor.
                        </p>
                        <Link to="/academy/valuation" className="cta-box__button">
                            Ver Guía de Valoración <Zap size={18} />
                        </Link>
                    </div>
                </div>
            </AcademySection>

            {/* Final tip */}
            <section className="asset-page__final-tip">
                <Lightbulb size={28} />
                <div>
                    <h3>Consejo Final</h3>
                    <p>
                        Para la mayoría de inversores, un <strong>ETF indexado global (MSCI World o FTSE All-World)</strong> es
                        la forma más eficiente de acceder a renta variable. Simplicidad, diversificación máxima y costes
                        mínimos. No intentes batir al mercado: únete a él.
                    </p>
                </div>
            </section>
        </div>
    );
}
