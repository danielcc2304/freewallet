import {guideReadingStyle} from '../ui/GuideReading.styles';
import {GuideBlock,GuidePanel,GuideText} from '../ui/GuideReading';
import {AcademyToolLink} from '../ui/AcademyToolLink';
import { AcademyBalanceStage, AcademyRuleList } from '../ui/AcademyGuideParts';
import { AcademyNumberedHeading, AcademyRoadmap, AcademyInsight, AcademyCopyDetail, AcademyGuideFacts } from '../ui/AcademyGuideParts';
import { AcademyPanel } from '../ui/AcademyPanel';
import { BarChart3, TrendingUp, Zap, Repeat, Target, ArrowRight, ShieldCheck, Info, CalendarDays, Scale, Wallet } from 'lucide-react';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';

const REBALANCING_EXAMPLE = [
    { label: 'Tu objetivo', equity: 60, bonds: 40, note: 'La distribución que elegiste.' },
    { label: 'Tras los movimientos', equity: 70, bonds: 30, note: 'La bolsa gana peso: asumes más riesgo.' },
    { label: 'Después de ajustar', equity: 60, bonds: 40, note: 'Recuperas el riesgo previsto.' },
];

export function Strategies() {
    return (
        <GuideBlock appearance="strategies"  >
            <AcademyPageHeader className="strategies__header" section="Construir">
                <h1>Estrategias de inversión</h1>
                <p>Una estrategia que puedas mantener. Decide cómo invertir, cómo aportar y cuándo ajustar tu cartera.</p>
                <AcademyRoadmap variant="strategy" aria-label="Secciones de estrategias" items={[{href:"#gestion",content:<><ShieldCheck size={18} aria-hidden="true" /> Cómo invertir</>},{href:"#aportaciones",content:<><Repeat size={18} aria-hidden="true" /> Cómo aportar</>},{href:"#reequilibrio",content:<><Scale size={18} aria-hidden="true" /> Cómo ajustar</>}]} />
            </AcademyPageHeader>

            <GuideBlock appearance="strategiesSection" as="section" id="gestion" aria-labelledby="gestion-title">
                <AcademyNumberedHeading variant="strategy" number={<>01</>} headingId="gestion-title" title={<>Elige cómo se gestiona tu dinero</>} description={<>Dos enfoques que también puedes combinar.</>} />
                <GuideBlock appearance="strategiesGrid"  >
                    <GuidePanel appearance="strategiesApproachCard"  variant="strategy" as="article">
                        <GuideBlock appearance="strategiesCardHeading"  ><GuideText appearance="strategiesIcon" as="span" ><ShieldCheck size={24} aria-hidden="true" /></GuideText><GuideText appearance="strategiesTag" as="span" >Seguir el mercado</GuideText></GuideBlock>
                        <h3>Gestión pasiva</h3>
                        <p>Replica un índice mediante fondos o ETFs, sin intentar elegir a los próximos ganadores.</p>
                        <AcademyGuideFacts items={[{label:<>Costes</>,value:<>Generalmente bajos; compara el coste total.</>},{label:<>Seguimiento</>,value:<>Elegir la distribución y revisar sus pesos.</>},{label:<>A vigilar</>,value:<>También asumes las caídas y concentraciones del índice.</>}]} />
                        <GuideBlock appearance="strategiesTakeaway"  >Encaja si buscas sencillez y una exposición amplia.</GuideBlock>
                    </GuidePanel>
                    <GuidePanel appearance="strategiesApproachCard"  className={guideReadingStyle('strategiesApproachCardActive')} variant="strategy" as="article">
                        <GuideBlock appearance="strategiesCardHeading"  ><GuideText appearance="strategiesIcon" as="span" ><Zap size={24} aria-hidden="true" /></GuideText><GuideText appearance="strategiesTag" as="span" >Seleccionar oportunidades</GuideText></GuideBlock>
                        <h3>Gestión activa</h3>
                        <p>Un gestor, o tú mismo, selecciona activos para intentar mejorar un objetivo o índice de referencia.</p>
                        <AcademyGuideFacts items={[{label:<>Costes</>,value:<>Suelen ser mayores; revisa comisiones y rotación.</>},{label:<>Seguimiento</>,value:<>Entender el proceso y evaluar sus resultados.</>},{label:<>A vigilar</>,value:<>Puede quedarse por debajo del índice tras costes.</>}]} />
                        <GuideBlock appearance="strategiesTakeaway"  >Encaja si entiendes y puedes evaluar la selección.</GuideBlock>
                    </GuidePanel>
                </GuideBlock>
                <AcademyInsight variant="strategy" icon={<Info size={20} aria-hidden="true" />}>Compara siempre resultados netos de costes con un índice de riesgo y exposición similares. Una buena racha no demuestra que una estrategia sea mejor.</AcademyInsight>
            </GuideBlock>

            <GuideBlock appearance="strategiesSection" as="section" id="aportaciones" aria-labelledby="aportaciones-title">
                <AcademyNumberedHeading variant="strategy" number={<>02</>} headingId="aportaciones-title" title={<>Decide cómo entrar al mercado</>} description={<>Ahorrar cada mes y tener ya un capital disponible son situaciones distintas.</>} />
                <GuideBlock appearance="strategiesGrid"  >
                    <GuidePanel appearance="strategiesEntryCard"  variant="strategy" as="article">
                        <GuideText appearance="strategiesIcon" as="span" ><Repeat size={24} aria-hidden="true" /></GuideText>
                        <h3>Aportaciones periódicas</h3>
                        <GuideText appearance="strategiesTerm" as="span" >DCA · una cantidad a intervalos regulares</GuideText>
                        <p>Invierte el ahorro que vas generando sin necesitar acertar el mejor día de compra.</p>
                        <AcademyCopyDetail variant="strategyEntry" label={<>A favor</>}>Facilita el hábito y reparte las compras en el tiempo.</AcademyCopyDetail>
                        <AcademyCopyDetail variant="strategyEntry" label={<>Ten en cuenta</>}>Si el capital ya está disponible, escalonarlo mantiene una parte fuera del mercado. No elimina el riesgo de pérdidas.</AcademyCopyDetail>
                    </GuidePanel>
                    <GuidePanel appearance="strategiesEntryCard"  variant="strategy" as="article">
                        <GuideText appearance="strategiesIcon" as="span" ><Wallet size={24} aria-hidden="true" /></GuideText>
                        <h3>Inversión de una vez</h3>
                        <GuideText appearance="strategiesTerm" as="span" >Lump sum · todo el capital previsto</GuideText>
                        <p>Pone a trabajar desde el inicio el dinero que ya has reservado para invertir.</p>
                        <AcademyCopyDetail variant="strategyEntry" label={<>A favor</>}>Evita esperar con parte del capital sin invertir.</AcademyCopyDetail>
                        <AcademyCopyDetail variant="strategyEntry" label={<>Ten en cuenta</>}>Una caída inmediata afecta a toda la inversión. Necesitas un nivel de riesgo que puedas sostener.</AcademyCopyDetail>
                    </GuidePanel>
                </GuideBlock>
            </GuideBlock>

            <GuideBlock appearance="strategiesSection" as="section" id="reequilibrio" aria-labelledby="reequilibrio-title">
                <AcademyNumberedHeading variant="strategy" number={<>03</>} headingId="reequilibrio-title" title={<>Ajusta el riesgo, no persigas las subidas</>} description={<>Reequilibrar devuelve cada bloque a su peso objetivo.</>} />
                <AcademyPanel variant="strategy" className="strategies__rebalance-card">
                    <GuideBlock appearance="strategiesChartHeading"  ><h3>Un ejemplo de cartera 60 / 40</h3><span>Ejemplo ilustrativo</span></GuideBlock>
                    <GuideBlock appearance="strategiesBalanceGrid"  >
                        {REBALANCING_EXAMPLE.map(({ label, equity, bonds, note }) => (
                            <AcademyBalanceStage key={label} title={<>{label}</>} barLabel={`${label}: ${equity}% renta variable y ${bonds}% renta fija`} segments={[{width:equity,label:<>{equity}%</>},{width:bonds,label:<>{bonds}%</>}]}>{note}</AcademyBalanceStage>
                        ))}
                    </GuideBlock>
                    <GuideBlock appearance="strategiesLegend"  ><span><i /> Renta variable</span><span><i /> Renta fija</span></GuideBlock>
                    <AcademyRuleList items={[{icon:<Target size={20} aria-hidden="true" />,label:<>Fija tus pesos</>,description:<>Según tu horizonte, objetivos y tolerancia a pérdidas.</>},{icon:<CalendarDays size={20} aria-hidden="true" />,label:<>Define una regla</>,description:<>Por calendario o por desviación; por ejemplo, una revisión anual o un umbral de 5 puntos porcentuales.</>},{icon:<Scale size={20} aria-hidden="true" />,label:<>Prioriza las aportaciones</>,description:<>Dirígelas al bloque con menos peso. Si necesitas vender, revisa impuestos, comisiones y posibles traspasos.</>}]} />
                </AcademyPanel>
            </GuideBlock>

            <GuideBlock appearance="strategiesSection" as="section" aria-labelledby="strategy-tools-title">
                <AcademyNumberedHeading variant="strategy" number={<><BarChart3 size={20} aria-hidden="true" /></>} headingId="strategy-tools-title" title={<>Lleva la estrategia a tu cartera</>} description={<>Define la distribución y comprueba cómo encaja con tus objetivos.</>} />
                <GuideBlock appearance="strategiesTools"  >
                    <AcademyToolLink to="/academy/portfolio" variant="strategy" icon={<Target size={24} aria-hidden="true" />}  title={<>Estrategia y cartera</>} description={<>Explora bloques y construye tu distribución.</>} action={<>Diseñar cartera <ArrowRight size={18} aria-hidden="true" /></>} />
                    <AcademyToolLink to="/academy/compound-interest" variant="strategy" icon={<TrendingUp size={24} aria-hidden="true" />}  title={<>Interés compuesto</>} description={<>Proyecta tus aportaciones con distintos supuestos.</>} action={<>Simular evolución <ArrowRight size={18} aria-hidden="true" /></>} />
                    <AcademyToolLink to="/academy/fire-calculator" variant="strategy" icon={<ShieldCheck size={24} aria-hidden="true" />}  title={<>Plan FIRE</>} description={<>Estima el capital para tu independencia financiera.</>} action={<>Explorar objetivo <ArrowRight size={18} aria-hidden="true" /></>} />
                </GuideBlock>
            </GuideBlock>
        </GuideBlock>
    );
}
