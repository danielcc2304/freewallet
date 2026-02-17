import { Link } from 'react-router-dom';
import {
    TrendingUp, ArrowLeft, Globe, Zap, CheckCircle2, AlertTriangle,
    Lightbulb, BarChart3, PieChart, Clock, Target, Shield
} from 'lucide-react';
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
        <div className="asset-page">
            <Link to="/academy/portfolio" className="asset-page__back">
                <ArrowLeft size={18} /> Volver a Carteras
            </Link>

            <header className="asset-page__hero" style={{ '--hero-color': '#3b82f6' } as React.CSSProperties}>
                <div className="asset-page__hero-icon">
                    <TrendingUp size={48} />
                </div>
                <h1>Renta Variable (Acciones)</h1>
                <p className="asset-page__hero-sub">
                    El motor de crecimiento de cualquier cartera a largo plazo. Entiende sus variantes,
                    riesgos y cómo elegir la exposición correcta para ti.
                </p>
                <div className="asset-page__hero-stats">
                    <div className="hero-stat">
                        <span className="hero-stat__value">7-10%</span>
                        <span className="hero-stat__label">Retorno histórico anual</span>
                    </div>
                    <div className="hero-stat">
                        <span className="hero-stat__value">15-20%</span>
                        <span className="hero-stat__label">Volatilidad típica</span>
                    </div>
                    <div className="hero-stat">
                        <span className="hero-stat__value">7+ años</span>
                        <span className="hero-stat__label">Horizonte recomendado</span>
                    </div>
                </div>
            </header>

            {/* What is it */}
            <section className="asset-page__section">
                <h2><Globe size={22} /> ¿Qué es la Renta Variable?</h2>
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
            </section>

            {/* Sub-types */}
            <section className="asset-page__section">
                <h2><BarChart3 size={22} /> Tipos de Acciones</h2>
                <p className="asset-page__section-desc">No todas las acciones son iguales. Entender las diferencias es clave para elegir tu exposición.</p>

                <div className="asset-page__subtype-grid">
                    {SUB_TYPES.map((type) => (
                        <div key={type.title} className="subtype-card" style={{ '--subtype-color': type.color } as React.CSSProperties}>
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
                        </div>
                    ))}
                </div>
            </section>

            {/* Value vs Growth visual */}
            <section className="asset-page__section">
                <h2><Target size={22} /> Value vs Growth: El Eterno Debate</h2>
                <div className="asset-page__versus">
                    <div className="versus-card versus-card--value">
                        <h3>📊 Value (Valor)</h3>
                        <ul>
                            <li>Empresas baratas según fundamentales (PER bajo)</li>
                            <li>Suelen pagar dividendos</li>
                            <li>Rendimiento superior a largo plazo históricamente</li>
                            <li>Sectores: banca, energía, utilities</li>
                            <li>Mentalidad: «comprar un euro por 50 céntimos»</li>
                        </ul>
                        <div className="versus-card__badge">Warren Buffett</div>
                    </div>
                    <div className="versus-divider">VS</div>
                    <div className="versus-card versus-card--growth">
                        <h3>🚀 Growth (Crecimiento)</h3>
                        <ul>
                            <li>Empresas con alto crecimiento de ingresos</li>
                            <li>Raramente pagan dividendo (reinvierten todo)</li>
                            <li>Valoraciones elevadas (PER alto)</li>
                            <li>Sectores: tech, biotech, IA</li>
                            <li>Mentalidad: «la empresa del futuro»</li>
                        </ul>
                        <div className="versus-card__badge">Cathie Wood</div>
                    </div>
                </div>
            </section>

            {/* Geographic zones */}
            <section className="asset-page__section">
                <h2><PieChart size={22} /> Zonas Geográficas</h2>
                <p className="asset-page__section-desc">
                    La diversificación geográfica reduce el riesgo de depender de un solo país o región.
                </p>
                <div className="asset-page__geo-grid">
                    {GEOGRAPHIC_ZONES.map(zone => (
                        <div key={zone.name} className="geo-card" style={{ borderLeftColor: zone.color }}>
                            <h4 style={{ color: zone.color }}>{zone.name}</h4>
                            <p className="geo-card__region">{zone.region}</p>
                            <p className="geo-card__weight">{zone.weight}</p>
                        </div>
                    ))}
                </div>

                <div className="asset-page__callout asset-page__callout--warning">
                    <AlertTriangle size={20} />
                    <div>
                        <strong>Sesgo doméstico (Home Bias)</strong>
                        <p>Los inversores tienden a sobreponderar su propio país. España representa solo el ~0.6% del mercado mundial. Si inviertes solo en el IBEX35, estás concentrando riesgo innecesariamente.</p>
                    </div>
                </div>
            </section>

            {/* Pros and cons */}
            <section className="asset-page__section">
                <h2><Shield size={22} /> Ventajas y Riesgos</h2>
                <div className="asset-page__pros-cons">
                    <div className="pc-column pc-column--pros">
                        <h3><CheckCircle2 size={18} /> Ventajas</h3>
                        <ul>
                            <li>Mayor rentabilidad histórica a largo plazo vs cualquier otro activo</li>
                            <li>Protección natural contra la inflación</li>
                            <li>Liquidez inmediata en mercados cotizados</li>
                            <li>Posibilidad de ingresos pasivos vía dividendos</li>
                            <li>Accesibilidad: desde 1€ con ETFs fraccionados</li>
                            <li>Fiscalidad favorable en España para fondos indexados (traspaso sin tributar)</li>
                        </ul>
                    </div>
                    <div className="pc-column pc-column--cons">
                        <h3><AlertTriangle size={18} /> Riesgos</h3>
                        <ul>
                            <li>Caídas del 30-50% son parte del juego</li>
                            <li>Necesitas horizonte mínimo de 7-10 años</li>
                            <li>Stock-picking individual tiene alto riesgo de pérdida permanente</li>
                            <li>El estrés emocional en crisis lleva a vender en el peor momento</li>
                            <li>Rendimientos pasados no garantizan rendimientos futuros</li>
                            <li>Riesgo divisa si inviertes fuera de la Eurozona</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* How to invest */}
            <section className="asset-page__section">
                <h2><Zap size={22} /> ¿Cómo Invertir en Acciones?</h2>
                <div className="asset-page__steps">
                    <div className="step-card">
                        <div className="step-card__number">1</div>
                        <h4>ETFs Indexados</h4>
                        <p>La opción más recomendada para el 95% de inversores. Un solo ETF como el MSCI World te da exposición a +1.500 empresas de 23 países.</p>
                        <span className="step-card__badge step-card__badge--recommended">Recomendado</span>
                    </div>
                    <div className="step-card">
                        <div className="step-card__number">2</div>
                        <h4>Fondos Indexados</h4>
                        <p>Misma filosofía que ETFs pero con ventaja fiscal en España: puedes traspasar entre fondos sin tributar. Ideal para acumular a largo plazo.</p>
                        <span className="step-card__badge step-card__badge--fiscal">Ventaja Fiscal 🇪🇸</span>
                    </div>
                    <div className="step-card">
                        <div className="step-card__number">3</div>
                        <h4>Acciones Individuales</h4>
                        <p>Solo si tienes conocimiento profundo del análisis fundamental. Riesgo de concentración muy alto. Máximo 10-20% de cartera.</p>
                        <span className="step-card__badge step-card__badge--advanced">Avanzado</span>
                    </div>
                </div>
            </section>

            {/* Key metrics */}
            <section className="asset-page__section">
                <h2><Clock size={22} /> Métricas para Entender Acciones</h2>
                <div className="asset-page__metrics-grid">
                    <div className="metric-explainer">
                        <h4>PER (Price/Earnings Ratio)</h4>
                        <p>Cuántos años de beneficios estás pagando. PER 15 = pagas 15 años de beneficio actual. Menor = más barato.</p>
                        <div className="metric-explainer__range">
                            <span className="range-low">PER {'<'} 12 (Barato)</span>
                            <span className="range-high">PER {'>'} 25 (Caro)</span>
                        </div>
                    </div>
                    <div className="metric-explainer">
                        <h4>Dividend Yield</h4>
                        <p>Porcentaje de dividendo anual respecto al precio. Una acción a 100€ que paga 4€ tiene yield del 4%.</p>
                        <div className="metric-explainer__range">
                            <span className="range-low">{'<'} 2% (Growth)</span>
                            <span className="range-high">{'>'} 4% (Income)</span>
                        </div>
                    </div>
                    <div className="metric-explainer">
                        <h4>Beta</h4>
                        <p>Mide la volatilidad respecto al mercado. Beta 1 = igual al mercado. Beta 1.5 = 50% más volátil.</p>
                        <div className="metric-explainer__range">
                            <span className="range-low">{'<'} 0.8 (Defensivo)</span>
                            <span className="range-high">{'>'} 1.2 (Agresivo)</span>
                        </div>
                    </div>
                    <div className="metric-explainer">
                        <h4>Sharpe Ratio</h4>
                        <p>Retorno por unidad de riesgo asumida. Mayor = mejor relación riesgo/recompensa. Ideal {'>'} 1.</p>
                        <div className="metric-explainer__range">
                            <span className="range-low">{'<'} 0.5 (Pobre)</span>
                            <span className="range-high">{'>'} 1.0 (Excelente)</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Deep Dive CTA */}
            <section className="asset-page__section asset-page__section--cta">
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
            </section>

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
