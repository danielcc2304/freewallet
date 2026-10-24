import {AcademyToolLink} from '../ui/AcademyToolLink';
import { AcademyBalanceStage, AcademyRuleList } from '../ui/AcademyGuideParts';
import { AcademyNumberedHeading, AcademyRoadmap, AcademyInsight, AcademyCopyDetail, AcademyGuideFacts } from '../ui/AcademyGuideParts';
import { AcademyPanel } from '../ui/AcademyPanel';
import { BarChart3, TrendingUp, Zap, Repeat, Target, ArrowRight, ShieldCheck, Info, CalendarDays, Scale, Wallet } from 'lucide-react';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import './Strategies.css';

const REBALANCING_EXAMPLE = [
    { label: 'Tu objetivo', equity: 60, bonds: 40, note: 'La distribución que elegiste.' },
    { label: 'Tras los movimientos', equity: 70, bonds: 30, note: 'La bolsa gana peso: asumes más riesgo.' },
    { label: 'Después de ajustar', equity: 60, bonds: 40, note: 'Recuperas el riesgo previsto.' },
];

export function Strategies() {
    return (
        <div className="strategies">
            <AcademyPageHeader className="strategies__header" section="Construir">
                <h1>Estrategias de inversión</h1>
                <p>Una estrategia que puedas mantener. Decide cómo invertir, cómo aportar y cuándo ajustar tu cartera.</p>
                <AcademyRoadmap variant="strategy" aria-label="Secciones de estrategias" items={[{href:"#gestion",content:<><ShieldCheck size={18} aria-hidden="true" /> Cómo invertir</>},{href:"#aportaciones",content:<><Repeat size={18} aria-hidden="true" /> Cómo aportar</>},{href:"#reequilibrio",content:<><Scale size={18} aria-hidden="true" /> Cómo ajustar</>}]} />
            </AcademyPageHeader>

            <section id="gestion" className="strategies__section" aria-labelledby="gestion-title">
                <AcademyNumberedHeading variant="strategy" number={<>01</>} headingId="gestion-title" title={<>Elige cómo se gestiona tu dinero</>} description={<>Dos enfoques que también puedes combinar.</>} />
                <div className="strategies__grid">
                    <AcademyPanel variant="strategy" as="article" className="strategies__approach-card">
                        <div className="strategies__card-heading"><span className="strategies__icon"><ShieldCheck size={24} aria-hidden="true" /></span><span className="strategies__tag">Seguir el mercado</span></div>
                        <h3>Gestión pasiva</h3>
                        <p>Replica un índice mediante fondos o ETFs, sin intentar elegir a los próximos ganadores.</p>
                        <AcademyGuideFacts items={[{label:<>Costes</>,value:<>Generalmente bajos; compara el coste total.</>},{label:<>Seguimiento</>,value:<>Elegir la distribución y revisar sus pesos.</>},{label:<>A vigilar</>,value:<>También asumes las caídas y concentraciones del índice.</>}]} />
                        <div className="strategies__takeaway">Encaja si buscas sencillez y una exposición amplia.</div>
                    </AcademyPanel>
                    <AcademyPanel variant="strategy" as="article" className="strategies__approach-card strategies__approach-card--active">
                        <div className="strategies__card-heading"><span className="strategies__icon"><Zap size={24} aria-hidden="true" /></span><span className="strategies__tag">Seleccionar oportunidades</span></div>
                        <h3>Gestión activa</h3>
                        <p>Un gestor, o tú mismo, selecciona activos para intentar mejorar un objetivo o índice de referencia.</p>
                        <AcademyGuideFacts items={[{label:<>Costes</>,value:<>Suelen ser mayores; revisa comisiones y rotación.</>},{label:<>Seguimiento</>,value:<>Entender el proceso y evaluar sus resultados.</>},{label:<>A vigilar</>,value:<>Puede quedarse por debajo del índice tras costes.</>}]} />
                        <div className="strategies__takeaway">Encaja si entiendes y puedes evaluar la selección.</div>
                    </AcademyPanel>
                </div>
                <AcademyInsight variant="strategy" icon={<Info size={20} aria-hidden="true" />}>Compara siempre resultados netos de costes con un índice de riesgo y exposición similares. Una buena racha no demuestra que una estrategia sea mejor.</AcademyInsight>
            </section>

            <section id="aportaciones" className="strategies__section" aria-labelledby="aportaciones-title">
                <AcademyNumberedHeading variant="strategy" number={<>02</>} headingId="aportaciones-title" title={<>Decide cómo entrar al mercado</>} description={<>Ahorrar cada mes y tener ya un capital disponible son situaciones distintas.</>} />
                <div className="strategies__grid">
                    <AcademyPanel variant="strategy" as="article" className="strategies__entry-card">
                        <span className="strategies__icon"><Repeat size={24} aria-hidden="true" /></span>
                        <h3>Aportaciones periódicas</h3>
                        <span className="strategies__term">DCA · una cantidad a intervalos regulares</span>
                        <p>Invierte el ahorro que vas generando sin necesitar acertar el mejor día de compra.</p>
                        <AcademyCopyDetail variant="strategyEntry" label={<>A favor</>}>Facilita el hábito y reparte las compras en el tiempo.</AcademyCopyDetail>
                        <AcademyCopyDetail variant="strategyEntry" label={<>Ten en cuenta</>}>Si el capital ya está disponible, escalonarlo mantiene una parte fuera del mercado. No elimina el riesgo de pérdidas.</AcademyCopyDetail>
                    </AcademyPanel>
                    <AcademyPanel variant="strategy" as="article" className="strategies__entry-card">
                        <span className="strategies__icon"><Wallet size={24} aria-hidden="true" /></span>
                        <h3>Inversión de una vez</h3>
                        <span className="strategies__term">Lump sum · todo el capital previsto</span>
                        <p>Pone a trabajar desde el inicio el dinero que ya has reservado para invertir.</p>
                        <AcademyCopyDetail variant="strategyEntry" label={<>A favor</>}>Evita esperar con parte del capital sin invertir.</AcademyCopyDetail>
                        <AcademyCopyDetail variant="strategyEntry" label={<>Ten en cuenta</>}>Una caída inmediata afecta a toda la inversión. Necesitas un nivel de riesgo que puedas sostener.</AcademyCopyDetail>
                    </AcademyPanel>
                </div>
            </section>

            <section id="reequilibrio" className="strategies__section" aria-labelledby="reequilibrio-title">
                <AcademyNumberedHeading variant="strategy" number={<>03</>} headingId="reequilibrio-title" title={<>Ajusta el riesgo, no persigas las subidas</>} description={<>Reequilibrar devuelve cada bloque a su peso objetivo.</>} />
                <AcademyPanel variant="strategy" className="strategies__rebalance-card">
                    <div className="strategies__chart-heading"><h3>Un ejemplo de cartera 60 / 40</h3><span>Ejemplo ilustrativo</span></div>
                    <div className="strategies__balance-grid">
                        {REBALANCING_EXAMPLE.map(({ label, equity, bonds, note }) => (
                            <AcademyBalanceStage key={label} title={<>{label}</>} barLabel={`${label}: ${equity}% renta variable y ${bonds}% renta fija`} segments={[{width:equity,label:<>{equity}%</>},{width:bonds,label:<>{bonds}%</>}]}>{note}</AcademyBalanceStage>
                        ))}
                    </div>
                    <div className="strategies__legend"><span><i /> Renta variable</span><span><i /> Renta fija</span></div>
                    <AcademyRuleList items={[{icon:<Target size={20} aria-hidden="true" />,label:<>Fija tus pesos</>,description:<>Según tu horizonte, objetivos y tolerancia a pérdidas.</>},{icon:<CalendarDays size={20} aria-hidden="true" />,label:<>Define una regla</>,description:<>Por calendario o por desviación; por ejemplo, una revisión anual o un umbral de 5 puntos porcentuales.</>},{icon:<Scale size={20} aria-hidden="true" />,label:<>Prioriza las aportaciones</>,description:<>Dirígelas al bloque con menos peso. Si necesitas vender, revisa impuestos, comisiones y posibles traspasos.</>}]} />
                </AcademyPanel>
            </section>

            <section className="strategies__section" aria-labelledby="strategy-tools-title">
                <AcademyNumberedHeading variant="strategy" number={<><BarChart3 size={20} aria-hidden="true" /></>} headingId="strategy-tools-title" title={<>Lleva la estrategia a tu cartera</>} description={<>Define la distribución y comprueba cómo encaja con tus objetivos.</>} />
                <div className="strategies__tools">
                    <AcademyToolLink to="/academy/portfolio" variant="strategy" icon={<Target size={24} aria-hidden="true" />}  title={<>Estrategia y cartera</>} description={<>Explora bloques y construye tu distribución.</>} action={<>Diseñar cartera <ArrowRight size={18} aria-hidden="true" /></>} />
                    <AcademyToolLink to="/academy/compound-interest" variant="strategy" icon={<TrendingUp size={24} aria-hidden="true" />}  title={<>Interés compuesto</>} description={<>Proyecta tus aportaciones con distintos supuestos.</>} action={<>Simular evolución <ArrowRight size={18} aria-hidden="true" /></>} />
                    <AcademyToolLink to="/academy/fire-calculator" variant="strategy" icon={<ShieldCheck size={24} aria-hidden="true" />}  title={<>Plan FIRE</>} description={<>Estima el capital para tu independencia financiera.</>} action={<>Explorar objetivo <ArrowRight size={18} aria-hidden="true" /></>} />
                </div>
            </section>
        </div>
    );
}
