import {AcademyToolLink} from '../ui/AcademyToolLink';
import {AcademyCrisisTab,AcademyCrisisDecision,AcademySimulationInsight,AcademySimulationHeading,AcademyImpactRow,AcademyDecisionExplanation} from '../ui/AcademySimulatorParts';
import { AcademyControlField } from '../ui/AcademyControlField';
import { AcademyMetric } from '../ui/AcademyMetric';
import { AcademyGrid } from '../ui/AcademyGrid';
import { AcademyPanel } from '../ui/AcademyPanel';
import { useState } from 'react';
import { TrendingDown, TrendingUp, Euro, Info, ArrowRight, CalendarDays, Repeat, Shield, BookOpen } from 'lucide-react';
import { CRISIS_DATA } from '../../../data/academyData';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { calculateCrisisImpact } from './crisisImpact';
import './CrisisSimulator.css';

type ScenarioType = 'panic' | 'hold' | 'dca';
const money = (value: number) => value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const percent = (value: number) => value.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + '%';
const SHORT_NAMES: Record<number, string> = { 2008: 'Crisis financiera', 2020: 'Pandemia', 2022: 'Inflación y tipos' };
const EXPLANATIONS: Record<ScenarioType, { title: string; text: string }> = {
    panic: { title: 'Vender convierte la caída en una pérdida realizada', text: 'El ejemplo supone una venta justo en el mínimo, que solo se identifica a posteriori. Después mantienes el importe en efectivo, sin intereses, impuestos ni comisiones.' },
    hold: { title: 'Mantener conserva la exposición, también al riesgo', text: 'En el mínimo, la posición vale lo mismo que antes de vender en el otro escenario. La diferencia es que sigues invertido. La recuperación del índice no garantiza la de un activo concreto ni que llegue dentro de tu plazo.' },
    dca: { title: 'Aportar más dinero no es obtener más rentabilidad', text: 'Mostramos la suma de las aportaciones durante los meses de caída. Sin una serie de precios y fechas de compra no se puede calcular su valor final ni una rentabilidad DCA fiable.' },
};

export function CrisisSimulator() {
    const [selectedCrisis, setSelectedCrisis] = useState(2008);
    const [capital, setCapital] = useState(10000);
    const [monthlyDCA, setMonthlyDCA] = useState(300);
    const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('hold');
    const crisis = CRISIS_DATA[selectedCrisis];
    const impact = calculateCrisisImpact(capital, monthlyDCA, crisis.monthsDown, crisis.maxDrawdown);
    const setAmount = (raw: string, setter: (value: number) => void) => {
        const value = Number(raw);
        if (Number.isFinite(value) && value >= 0 && value <= 1e12) setter(value);
    };

    return (
        <div className="crisis">
            <AcademyPageHeader className="crisis__header" section="Escenarios">
                <h1>Mercado y crisis</h1>
                <p>Entiende el impacto de una caída, ponle cifras a tus decisiones y prepara un plan antes de necesitarlo.</p>
                <div className="crisis__header-tags"><span><CalendarDays size={16} aria-hidden="true" /> Tres episodios de mercado</span><span><Euro size={16} aria-hidden="true" /> Impacto en tu capital</span></div>
            </AcademyPageHeader>

            <section className="crisis__selector" aria-labelledby="crisis-picker-title">
                <h2 id="crisis-picker-title">Explora un episodio</h2>
                <AcademyGrid variant="crisisTabs" className="crisis__tabs" role="group" aria-label="Crisis de referencia">
                    {Object.values(CRISIS_DATA).map(item => (
                        <AcademyCrisisTab type="button" key={item.year} aria-pressed={selectedCrisis === item.year} onClick={() => setSelectedCrisis(item.year)} className={selectedCrisis === item.year ? 'crisis__tab--active' : ''} year={<>{item.year}</>} label={<>{SHORT_NAMES[item.year] ?? item.name}</>} />
                    ))}
                </AcademyGrid>
            </section>

            <AcademyPanel variant="crisis" as="section" className="crisis__info-card" aria-labelledby="crisis-episode-title">
                <span className="crisis__eyebrow">Episodio {crisis.year}</span>
                <h2 id="crisis-episode-title">{crisis.name}</h2>
                <p className="crisis__copy">{crisis.description}</p>
                <AcademyGrid variant="crisisStats" className="crisis__stats">
                    <AcademyMetric variant="crisis" label={<>Caída máxima</>} value={<>{percent(crisis.maxDrawdown)}</>} icon={<TrendingDown size={20} aria-hidden="true" />} />
                    <AcademyMetric variant="crisis" label={<>Duración de la caída</>} value={<>{crisis.monthsDown} meses</>} icon={<CalendarDays size={20} aria-hidden="true" />} />
                    <AcademyMetric variant="crisis" label={<>Recuperación desde el mínimo*</>} value={<>{crisis.monthsRecovery} meses</>} icon={<TrendingUp size={20} aria-hidden="true" />} />
                </AcademyGrid>
                <p className="crisis__footnote">*Referencias aproximadas del S&amp;P 500 incluidas en la app. La recuperación se cuenta desde el mínimo hasta volver al máximo previo, no desde el inicio de la caída. No es una reconstrucción histórica exacta.</p>
            </AcademyPanel>

            <AcademySimulationInsight variant="crisis" icon={<Info size={20} aria-hidden="true" />}><strong>Una recuperación pasada no es una promesa.</strong> El plazo, la diversificación y el dinero que necesitas a corto plazo importan tanto como tu capacidad para soportar caídas.</AcademySimulationInsight>

            <AcademyPanel variant="crisis" as="section" className="crisis__simulator-card" aria-labelledby="crisis-simulation-title">
                <AcademySimulationHeading icon={<><Euro size={24} aria-hidden="true" /></>} title={<>Pon la caída en euros</>} headingId="crisis-simulation-title" description={<>Ejercicio educativo con el porcentaje del episodio seleccionado.</>} />
                <AcademyGrid variant="crisisInputs" className="crisis__inputs">
                    <AcademyControlField variant="crisis" controlId="crisis-capital" label={<>Capital antes de la caída</>} unit={<>€</>} ><input id="crisis-capital" type="number" inputMode="decimal" value={capital} onChange={e => setAmount(e.target.value, setCapital)} min="0" max="1000000000000" step="100" /></AcademyControlField>
                    <AcademyControlField variant="crisis" controlId="crisis-dca" label={<>Aportación mensual durante la caída</>} unit={<>€/mes</>} ><input id="crisis-dca" type="number" inputMode="decimal" value={monthlyDCA} onChange={e => setAmount(e.target.value, setMonthlyDCA)} min="0" max="1000000000000" step="50" /></AcademyControlField>
                </AcademyGrid>
                <div className="crisis__impact">
                    <AcademyImpactRow label={<>Capital inicial</>} value={<>{money(capital)}</>}  width={'100%'} />
                    <AcademyImpactRow label={<>En el mínimo · sin nuevas aportaciones</>} value={<>{money(impact.lowValue)}</>} low valueProps={{"data-testid":"crisis-low-value"} as React.HTMLAttributes<HTMLElement>} width={`${100 + crisis.maxDrawdown}%`} />
                    <p>Una caída del <strong>{percent(Math.abs(crisis.maxDrawdown))}</strong> exige después una subida del <strong data-testid="crisis-recovery">{percent(impact.recoveryPercent)}</strong> para volver al punto de partida.</p>
                </div>
                <h3 className="crisis__decision-title">¿Qué cambia según tu decisión?</h3>
                <AcademyGrid variant="crisisScenarios" className="crisis__scenarios" role="group" aria-label="Decisiones durante la caída">
                    <AcademyCrisisDecision type="button" aria-pressed={selectedScenario === 'panic'} onClick={() => setSelectedScenario('panic')} className={selectedScenario === 'panic' ? 'crisis__scenario--selected' : ''} title={<>Vender en el mínimo</>} label={<>Efectivo tras vender</>} value={<>{money(impact.lowValue)}</>} >Pérdida realizada: {money(impact.loss)}</AcademyCrisisDecision>
                    <AcademyCrisisDecision type="button" aria-pressed={selectedScenario === 'hold'} onClick={() => setSelectedScenario('hold')} className={selectedScenario === 'hold' ? 'crisis__scenario--selected' : ''} title={<>Mantener la inversión</>} label={<>Valor de la posición en el mínimo</>} value={<>{money(impact.lowValue)}</>} >Pérdida no realizada: {money(impact.loss)}</AcademyCrisisDecision>
                    <AcademyCrisisDecision type="button" aria-pressed={selectedScenario === 'dca'} onClick={() => setSelectedScenario('dca')} className={selectedScenario === 'dca' ? 'crisis__scenario--selected' : ''} title={<>Seguir aportando</>} label={<>Capital total aportado · no valoración</>} value={<>{money(impact.totalContributed)}</>} valueProps={{"data-testid":"crisis-contributed"} as React.HTMLAttributes<HTMLElement>}>Incluye {money(impact.contributions)} en {crisis.monthsDown} aportaciones mensuales.</AcademyCrisisDecision>
                </AcademyGrid>
                <AcademyDecisionExplanation title={<>{EXPLANATIONS[selectedScenario].title}</>}>{EXPLANATIONS[selectedScenario].text}</AcademyDecisionExplanation>
                <p className="crisis__footnote">Importes nominales en euros por simplicidad. Sin efecto divisa, inflación, comisiones ni impuestos; no simula tu cartera real.</p>
            </AcademyPanel>

            <section className="crisis__comparison" aria-labelledby="crisis-comparison-title">
                <h2 id="crisis-comparison-title">Los episodios, de un vistazo</h2>
                <p className="crisis__copy">Referencias orientativas; los plazos de cada crisis fueron distintos.</p>
                <div className="crisis__table-wrapper" tabIndex={0} role="region" aria-label="Comparativa de crisis. Desplaza horizontalmente para ver todas las columnas.">
                    <table className="crisis__table"><caption>Caída y recuperación aproximadas del S&amp;P 500</caption><thead><tr><th scope="col">Episodio</th><th scope="col">Caída máxima</th><th scope="col">Caída (meses)</th><th scope="col">Desde el mínimo (meses)</th></tr></thead><tbody>
                        {Object.values(CRISIS_DATA).map(item => <tr key={item.year} className={item.year === selectedCrisis ? 'crisis__table-row--selected' : ''}><th scope="row">{item.year}<span>{SHORT_NAMES[item.year]}</span>{item.year === selectedCrisis && <small>Seleccionado</small>}</th><td>{percent(item.maxDrawdown)}</td><td>{item.monthsDown}</td><td>{item.monthsRecovery}</td></tr>)}
                    </tbody></table>
                </div>
            </section>

            <section className="crisis__next" aria-labelledby="crisis-next-title"><h2 id="crisis-next-title">Prepara tu próxima decisión</h2><div className="crisis__next-links">
                <AcademyToolLink to="/academy/risk" variant="crisis" icon={<Shield size={24} aria-hidden="true" />}  title={<>Gestiona el riesgo</>} description={<>Revisa el colchón, la concentración y el plazo.</>} action={<>Revisar mi plan <ArrowRight size={18} aria-hidden="true" /></>} />
                <AcademyToolLink to="/academy/strategies" variant="crisis" icon={<Repeat size={24} aria-hidden="true" />}  title={<>Define tus reglas</>} description={<>Aportaciones y reequilibrio con un criterio previo.</>} action={<>Ver estrategias <ArrowRight size={18} aria-hidden="true" /></>} />
                <AcademyToolLink to="/academy/scenarios" variant="crisis" icon={<BookOpen size={24} aria-hidden="true" />}  title={<>Qué hacer si…</>} description={<>Ensaya decisiones cuando el mercado se complica.</>} action={<>Explorar escenarios <ArrowRight size={18} aria-hidden="true" /></>} />
            </div></section>
        </div>
    );
}
