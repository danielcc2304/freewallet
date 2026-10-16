import { BarChart3, TrendingUp, Zap, Repeat, Target, ArrowRight, ShieldCheck, Info, CalendarDays, Scale, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
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
                <nav className="strategies__roadmap" aria-label="Secciones de estrategias">
                    <a href="#gestion"><ShieldCheck size={18} aria-hidden="true" /> Cómo invertir</a>
                    <a href="#aportaciones"><Repeat size={18} aria-hidden="true" /> Cómo aportar</a>
                    <a href="#reequilibrio"><Scale size={18} aria-hidden="true" /> Cómo ajustar</a>
                </nav>
            </AcademyPageHeader>

            <section id="gestion" className="strategies__section" aria-labelledby="gestion-title">
                <div className="strategies__section-heading">
                    <span className="strategies__number">01</span>
                    <div><h2 id="gestion-title">Elige cómo se gestiona tu dinero</h2><p>Dos enfoques que también puedes combinar.</p></div>
                </div>
                <div className="strategies__grid">
                    <article className="strategies__approach-card">
                        <div className="strategies__card-heading"><span className="strategies__icon"><ShieldCheck size={24} aria-hidden="true" /></span><span className="strategies__tag">Seguir el mercado</span></div>
                        <h3>Gestión pasiva</h3>
                        <p>Replica un índice mediante fondos o ETFs, sin intentar elegir a los próximos ganadores.</p>
                        <dl className="strategies__facts">
                            <div><dt>Costes</dt><dd>Generalmente bajos; compara el coste total.</dd></div>
                            <div><dt>Seguimiento</dt><dd>Elegir la distribución y revisar sus pesos.</dd></div>
                            <div><dt>A vigilar</dt><dd>También asumes las caídas y concentraciones del índice.</dd></div>
                        </dl>
                        <div className="strategies__takeaway">Encaja si buscas sencillez y una exposición amplia.</div>
                    </article>
                    <article className="strategies__approach-card strategies__approach-card--active">
                        <div className="strategies__card-heading"><span className="strategies__icon"><Zap size={24} aria-hidden="true" /></span><span className="strategies__tag">Seleccionar oportunidades</span></div>
                        <h3>Gestión activa</h3>
                        <p>Un gestor, o tú mismo, selecciona activos para intentar mejorar un objetivo o índice de referencia.</p>
                        <dl className="strategies__facts">
                            <div><dt>Costes</dt><dd>Suelen ser mayores; revisa comisiones y rotación.</dd></div>
                            <div><dt>Seguimiento</dt><dd>Entender el proceso y evaluar sus resultados.</dd></div>
                            <div><dt>A vigilar</dt><dd>Puede quedarse por debajo del índice tras costes.</dd></div>
                        </dl>
                        <div className="strategies__takeaway">Encaja si entiendes y puedes evaluar la selección.</div>
                    </article>
                </div>
                <aside className="strategies__insight"><Info size={20} aria-hidden="true" /><p>Compara siempre resultados netos de costes con un índice de riesgo y exposición similares. Una buena racha no demuestra que una estrategia sea mejor.</p></aside>
            </section>

            <section id="aportaciones" className="strategies__section" aria-labelledby="aportaciones-title">
                <div className="strategies__section-heading">
                    <span className="strategies__number">02</span>
                    <div><h2 id="aportaciones-title">Decide cómo entrar al mercado</h2><p>Ahorrar cada mes y tener ya un capital disponible son situaciones distintas.</p></div>
                </div>
                <div className="strategies__grid">
                    <article className="strategies__entry-card">
                        <span className="strategies__icon"><Repeat size={24} aria-hidden="true" /></span>
                        <h3>Aportaciones periódicas</h3>
                        <span className="strategies__term">DCA · una cantidad a intervalos regulares</span>
                        <p>Invierte el ahorro que vas generando sin necesitar acertar el mejor día de compra.</p>
                        <div className="strategies__entry-detail"><strong>A favor</strong><p>Facilita el hábito y reparte las compras en el tiempo.</p></div>
                        <div className="strategies__entry-detail"><strong>Ten en cuenta</strong><p>Si el capital ya está disponible, escalonarlo mantiene una parte fuera del mercado. No elimina el riesgo de pérdidas.</p></div>
                    </article>
                    <article className="strategies__entry-card">
                        <span className="strategies__icon"><Wallet size={24} aria-hidden="true" /></span>
                        <h3>Inversión de una vez</h3>
                        <span className="strategies__term">Lump sum · todo el capital previsto</span>
                        <p>Pone a trabajar desde el inicio el dinero que ya has reservado para invertir.</p>
                        <div className="strategies__entry-detail"><strong>A favor</strong><p>Evita esperar con parte del capital sin invertir.</p></div>
                        <div className="strategies__entry-detail"><strong>Ten en cuenta</strong><p>Una caída inmediata afecta a toda la inversión. Necesitas un nivel de riesgo que puedas sostener.</p></div>
                    </article>
                </div>
            </section>

            <section id="reequilibrio" className="strategies__section" aria-labelledby="reequilibrio-title">
                <div className="strategies__section-heading">
                    <span className="strategies__number">03</span>
                    <div><h2 id="reequilibrio-title">Ajusta el riesgo, no persigas las subidas</h2><p>Reequilibrar devuelve cada bloque a su peso objetivo.</p></div>
                </div>
                <div className="strategies__rebalance-card">
                    <div className="strategies__chart-heading"><h3>Un ejemplo de cartera 60 / 40</h3><span>Ejemplo ilustrativo</span></div>
                    <div className="strategies__balance-grid">
                        {REBALANCING_EXAMPLE.map(({ label, equity, bonds, note }) => (
                            <div className="strategies__balance-stage" key={label}>
                                <h4>{label}</h4>
                                <div className="strategies__balance-bar" role="img" aria-label={`${label}: ${equity}% renta variable y ${bonds}% renta fija`}>
                                    <span style={{ width: `${equity}%` }}>{equity}%</span><span style={{ width: `${bonds}%` }}>{bonds}%</span>
                                </div>
                                <p>{note}</p>
                            </div>
                        ))}
                    </div>
                    <div className="strategies__legend"><span><i /> Renta variable</span><span><i /> Renta fija</span></div>
                    <ol className="strategies__rules">
                        <li><Target size={20} aria-hidden="true" /><div><strong>Fija tus pesos</strong><p>Según tu horizonte, objetivos y tolerancia a pérdidas.</p></div></li>
                        <li><CalendarDays size={20} aria-hidden="true" /><div><strong>Define una regla</strong><p>Por calendario o por desviación; por ejemplo, una revisión anual o un umbral de 5 puntos porcentuales.</p></div></li>
                        <li><Scale size={20} aria-hidden="true" /><div><strong>Prioriza las aportaciones</strong><p>Dirígelas al bloque con menos peso. Si necesitas vender, revisa impuestos, comisiones y posibles traspasos.</p></div></li>
                    </ol>
                </div>
            </section>

            <section className="strategies__section" aria-labelledby="strategy-tools-title">
                <div className="strategies__section-heading"><span className="strategies__number"><BarChart3 size={20} aria-hidden="true" /></span><div><h2 id="strategy-tools-title">Lleva la estrategia a tu cartera</h2><p>Define la distribución y comprueba cómo encaja con tus objetivos.</p></div></div>
                <div className="strategies__tools">
                    <Link to="/academy/portfolio" className="strategies__tool-card"><Target size={24} aria-hidden="true" /><h3>Estrategia y cartera</h3><p>Explora bloques y construye tu distribución.</p><span>Diseñar cartera <ArrowRight size={18} aria-hidden="true" /></span></Link>
                    <Link to="/academy/compound-interest" className="strategies__tool-card"><TrendingUp size={24} aria-hidden="true" /><h3>Interés compuesto</h3><p>Proyecta tus aportaciones con distintos supuestos.</p><span>Simular evolución <ArrowRight size={18} aria-hidden="true" /></span></Link>
                    <Link to="/academy/fire-calculator" className="strategies__tool-card"><ShieldCheck size={24} aria-hidden="true" /><h3>Plan FIRE</h3><p>Estima el capital para tu independencia financiera.</p><span>Explorar objetivo <ArrowRight size={18} aria-hidden="true" /></span></Link>
                </div>
            </section>
        </div>
    );
}
