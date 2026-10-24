import {AcademyToolLink} from '../ui/AcademyToolLink';
import { AcademyNumberedHeading, AcademyRoadmap, AcademyInsight, AcademyCopyDetail } from '../ui/AcademyGuideParts';
import { AcademyGrid } from '../ui/AcademyGrid';
import { AcademyPanel } from '../ui/AcademyPanel';
import { Shield, AlertTriangle, Layers, Clock, Globe, BarChart, Zap, Scale, ArrowRight } from 'lucide-react';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import './RiskManagement.css';

const CORRELATION_ASSETS = ['RV Global', 'Bonos IG', 'REITs', 'Oro', 'Cash', 'Cripto'];
const CORRELATION_MATRIX = [
    [1.0, -0.2, 0.6, 0.1, 0.0, 0.5],
    [-0.2, 1.0, 0.2, 0.1, 0.5, -0.1],
    [0.6, 0.2, 1.0, 0.0, 0.1, 0.3],
    [0.1, 0.1, 0.0, 1.0, 0.1, 0.0],
    [0.0, 0.5, 0.1, 0.1, 1.0, 0.0],
    [0.5, -0.1, 0.3, 0.0, 0.0, 1.0]
];

const RISK_TYPES = [
    { icon: Zap, title: 'Mercado', description: 'Caídas que afectan a gran parte del mercado. La recuperación puede tardar y no está garantizada.', action: 'Ajusta la exposición a tu horizonte y capacidad de asumir pérdidas.' },
    { icon: Layers, title: 'Concentración', description: 'Depender demasiado de una empresa, un sector o un país, incluso a través de varios fondos.', action: 'Revisa las posiciones subyacentes y los solapamientos.' },
    { icon: Scale, title: 'Inflación', description: 'Que tus ahorros pierdan poder adquisitivo aunque su saldo no disminuya.', action: 'Valora la rentabilidad después de inflación, costes e impuestos.' },
    { icon: Shield, title: 'Liquidez', description: 'No poder vender a tiempo o tener que aceptar un precio muy inferior al esperado.', action: 'Separa el dinero para imprevistos del capital que puedes invertir.' },
];
const DIVERSIFICATION = [
    { icon: Globe, title: 'Por regiones', description: 'Reparte la exposición entre países y economías. Varios fondos del mismo mercado pueden duplicar posiciones.' },
    { icon: Layers, title: 'Por activos', description: 'Combina renta variable, renta fija y liquidez según tus objetivos. Cada bloque cumple una función distinta.' },
    { icon: BarChart, title: 'Por sectores', description: 'Tecnología, salud, energía o consumo responden de forma diferente al ciclo económico.' },
];
function SectionHeading({ number, id, title, description }: { number: string; id: string; title: string; description: string }) {
    return <AcademyNumberedHeading variant="risk" number={number} headingId={id} title={title} description={description} decorative />;
}
function correlationBand(value: number) {
    return value >= .6 ? 'high' : value >= .3 ? 'medium' : value > -.1 ? 'neutral' : 'low';
}

export function RiskManagement() {
    return (
        <div className="risk-mgmt">
            <AcademyPageHeader section="Construir">
                <h1>Gestión del riesgo</h1>
                <p>Entiende qué puede afectar a tu patrimonio y construye una cartera que puedas mantener, también cuando el mercado cae.</p>
                <AcademyRoadmap variant="risk" aria-label="Secciones de gestión del riesgo" items={[{href:"#risk-types",content:<><Shield size={18} aria-hidden="true" /> Identifica los riesgos</>},{href:"#risk-diversification",content:<><Layers size={18} aria-hidden="true" /> Diversifica</>},{href:"#risk-currency",content:<><Globe size={18} aria-hidden="true" /> Revisa la divisa</>}]} />
            </AcademyPageHeader>

            <section className="risk-mgmt__section" aria-labelledby="risk-volatility-title">
                <SectionHeading number="01" id="risk-volatility-title" title="Una caída no cuenta toda la historia" description="Distingue el movimiento del precio de la pérdida permanente de capital." />
                <AcademyGrid variant="risk" className="risk-mgmt__grid">
                    <AcademyPanel variant="risk" as="article" className="risk-mgmt__card risk-mgmt__comparison">
                        <span className="risk-mgmt__icon"><BarChart size={24} aria-hidden="true" /></span>
                        <h3>Volatilidad</h3>
                        <p>Es la fluctuación de los precios. Puede generar pérdidas temporales y poner a prueba tu tolerancia al riesgo.</p>
                        <AcademyCopyDetail variant="riskTakeaway" label={<>Qué revisar</>}>Si necesitarás ese dinero antes de que tu inversión tenga tiempo para recuperarse.</AcademyCopyDetail>
                    </AcademyPanel>
                    <AcademyPanel variant="risk" as="article" className="risk-mgmt__card risk-mgmt__comparison risk-mgmt__comparison--loss">
                        <span className="risk-mgmt__icon"><AlertTriangle size={24} aria-hidden="true" /></span>
                        <h3>Pérdida permanente</h3>
                        <p>Ocurre cuando el capital no se recupera: por una quiebra, una venta forzada o el deterioro duradero de una inversión.</p>
                        <AcademyCopyDetail variant="riskTakeaway" label={<>Qué revisar</>}>La calidad del activo, la concentración y tu reserva para imprevistos.</AcademyCopyDetail>
                    </AcademyPanel>
                </AcademyGrid>
            </section>

            <section id="risk-types" className="risk-mgmt__section" aria-labelledby="risk-types-title">
                <SectionHeading number="02" id="risk-types-title" title="Cuatro riesgos que conviene vigilar" description="Reconocerlos te ayuda a decidir qué protección necesita tu cartera." />
                <AcademyGrid variant="risk" className="risk-mgmt__grid">
                    {RISK_TYPES.map(({icon: Icon,title,description,action}) => <AcademyPanel variant="risk" as="article" className="risk-mgmt__card" key={title}>
                        <span className="risk-mgmt__icon"><Icon size={24} aria-hidden="true" /></span><h3>{title}</h3><p>{description}</p>
                        <AcademyCopyDetail variant="riskAction" label={<>Cómo gestionarlo</>}>{action}</AcademyCopyDetail>
                    </AcademyPanel>)}
                </AcademyGrid>
            </section>

            <section id="risk-diversification" className="risk-mgmt__section" aria-labelledby="risk-diversification-title">
                <SectionHeading number="03" id="risk-diversification-title" title="Diversifica la exposición, no solo el número de fondos" description="Tener muchos productos no garantiza que estés asumiendo riesgos diferentes." />
                <AcademyGrid variant="risk" className="risk-mgmt__grid risk-mgmt__grid--three">
                    {DIVERSIFICATION.map(({icon: Icon,title,description}) => <AcademyPanel variant="risk" as="article" className="risk-mgmt__card" key={title}>
                        <span className="risk-mgmt__icon"><Icon size={24} aria-hidden="true" /></span><h3>{title}</h3><p>{description}</p>
                    </AcademyPanel>)}
                </AcademyGrid>
                <AcademyPanel variant="risk" className="risk-mgmt__card risk-mgmt__correlations">
                    <div className="risk-mgmt__matrix-heading"><h3>Cómo se mueven juntos</h3><span>Ejemplo ilustrativo · no son datos de mercado</span></div>
                    <p>La correlación va de −1 a +1. Una correlación menor puede suavizar los movimientos de la cartera, pero cambia con el tiempo y puede aumentar durante una crisis.</p>
                    <div className="risk-mgmt__matrix-scroll" role="region" aria-label="Matriz de correlaciones ilustrativas, desplazable horizontalmente" tabIndex={0}>
                        <table className="risk-mgmt__matrix">
                            <caption>Matriz de correlación ilustrativa entre clases de activos</caption>
                            <thead><tr><th scope="col">Activo</th>{CORRELATION_ASSETS.map(asset => <th key={asset} scope="col">{asset}</th>)}</tr></thead>
                            <tbody>{CORRELATION_MATRIX.map((row,i) => <tr key={CORRELATION_ASSETS[i]}><th scope="row">{CORRELATION_ASSETS[i]}</th>
                                {row.map((value,j) => <td key={j} className={`risk-mgmt__correlation risk-mgmt__correlation--${correlationBand(value)}`}>{value.toFixed(1).replace('.',',')}</td>)}
                            </tr>)}</tbody>
                        </table>
                    </div>
                    <div className="risk-mgmt__legend"><span><i className="risk-mgmt__swatch--high" /> Alta: se mueven juntos</span><span><i className="risk-mgmt__swatch--medium" /> Media: diversificación parcial</span><span><i className="risk-mgmt__swatch--low" /> Baja o negativa: menor relación</span></div>
                    <p className="risk-mgmt__note">En móvil, desliza la tabla para ver todos los activos. Una correlación baja no garantiza protección frente a pérdidas.</p>
                </AcademyPanel>
            </section>

            <section className="risk-mgmt__section" aria-labelledby="risk-time-title">
                <SectionHeading number="04" id="risk-time-title" title="Adapta el riesgo al tiempo que tienes" description="El horizonte ayuda a decidir qué caídas puedes asumir, pero no elimina el riesgo." />
                <AcademyPanel variant="risk" className="risk-mgmt__card">
                    <div className="risk-mgmt__card-heading"><span className="risk-mgmt__icon"><Clock size={24} aria-hidden="true" /></span><h3>Cuándo necesitarás el dinero importa</h3></div>
                    <div className="risk-mgmt__horizons">
                        <div><span className="risk-mgmt__tag">Corto plazo</span><h4>Prioriza la disponibilidad</h4><p>El ahorro para gastos próximos necesita estabilidad y liquidez.</p></div>
                        <div><span className="risk-mgmt__tag">Medio plazo</span><h4>Equilibra los bloques</h4><p>Combina activos según la flexibilidad de tu objetivo y las pérdidas que puedas asumir.</p></div>
                        <div><span className="risk-mgmt__tag">Largo plazo</span><h4>Prepárate para las caídas</h4><p>Más tiempo permite atravesar ciclos, aunque no garantiza recuperar cualquier inversión.</p></div>
                    </div>
                </AcademyPanel>
            </section>

            <section id="risk-currency" className="risk-mgmt__section" aria-labelledby="risk-currency-title">
                <SectionHeading number="05" id="risk-currency-title" title="La divisa también forma parte del riesgo" description="Tu resultado en euros depende del activo y de las monedas a las que está expuesto. Que el fondo cotice en EUR no implica que esté cubierto." />
                <AcademyGrid variant="risk" className="risk-mgmt__grid">
                    <AcademyPanel variant="risk" as="article" className="risk-mgmt__card risk-mgmt__currency"><span className="risk-mgmt__tag">Hedged</span><h3>Con cobertura de divisa</h3><p>Utiliza derivados para reducir el efecto del cambio de moneda. La cobertura tiene costes y puede no ser perfecta.</p><ul><li>Puede ayudar a estabilizar la renta fija global en EUR.</li><li>Revisa qué monedas cubre y el coste total.</li><li>No elimina el riesgo de mercado ni el de crédito.</li></ul></AcademyPanel>
                    <AcademyPanel variant="risk" as="article" className="risk-mgmt__card risk-mgmt__currency"><span className="risk-mgmt__tag">Unhedged</span><h3>Sin cobertura de divisa</h3><p>El movimiento de las monedas puede aumentar o reducir tu rentabilidad en euros.</p><ul><li>Mantienes la exposición al tipo de cambio.</li><li>Evitas el coste específico de la cobertura.</li><li>Valora el horizonte y la moneda de tus futuros gastos.</li></ul></AcademyPanel>
                </AcademyGrid>
                <AcademyInsight variant="risk" icon={<Globe size={20} aria-hidden="true" />}>Cuanto más próximo esté un gasto en euros, más importante es limitar la incertidumbre de la divisa en el dinero reservado para ese objetivo.</AcademyInsight>
            </section>

            <section className="risk-mgmt__section" aria-labelledby="risk-tools-title">
                <SectionHeading number="06" id="risk-tools-title" title="Llévalo a tu cartera" description="Define tus límites antes de que llegue una caída." />
                <AcademyGrid variant="risk" className="risk-mgmt__grid risk-mgmt__grid--three">
                    <AcademyToolLink to="/academy/portfolio" variant="risk" icon={<Layers size={24} aria-hidden="true" />}  title={<>Estrategia y cartera</>} description={<>Elige una distribución coherente con tus objetivos y tolerancia a pérdidas.</>} action={<>Definir mi cartera <ArrowRight size={18} aria-hidden="true" /></>} />
                    <AcademyToolLink to="/academy/crisis" variant="risk" icon={<BarChart size={24} aria-hidden="true" />}  title={<>Mercado y crisis</>} description={<>Explora qué significaría una caída para tu capital y tus decisiones.</>} action={<>Explorar escenarios <ArrowRight size={18} aria-hidden="true" /></>} />
                    <AcademyToolLink to="/" variant="risk" icon={<Shield size={24} aria-hidden="true" />}  title={<>Tu Dashboard</>} description={<>Revisa la asignación y la concentración de tus posiciones actuales.</>} action={<>Ver mi cartera <ArrowRight size={18} aria-hidden="true" /></>} />
                </AcademyGrid>
            </section>
        </div>
    );
}
