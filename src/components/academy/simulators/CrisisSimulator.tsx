import { useState } from 'react';
import { TrendingDown, TrendingUp, Euro, Info, ArrowRight, CalendarDays, Repeat, Shield, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
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
                <div className="crisis__tabs" role="group" aria-label="Crisis de referencia">
                    {Object.values(CRISIS_DATA).map(item => (
                        <button type="button" key={item.year} className={`crisis__tab ${selectedCrisis === item.year ? 'crisis__tab--active' : ''}`} aria-pressed={selectedCrisis === item.year} onClick={() => setSelectedCrisis(item.year)}>
                            <span className="crisis__tab-year">{item.year}</span><span className="crisis__tab-name">{SHORT_NAMES[item.year] ?? item.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="crisis__info-card" aria-labelledby="crisis-episode-title">
                <span className="crisis__eyebrow">Episodio {crisis.year}</span>
                <h2 id="crisis-episode-title">{crisis.name}</h2>
                <p className="crisis__copy">{crisis.description}</p>
                <div className="crisis__stats">
                    <div className="crisis__stat"><TrendingDown size={20} aria-hidden="true" /><span>Caída máxima</span><strong>{percent(crisis.maxDrawdown)}</strong></div>
                    <div className="crisis__stat"><CalendarDays size={20} aria-hidden="true" /><span>Duración de la caída</span><strong>{crisis.monthsDown} meses</strong></div>
                    <div className="crisis__stat"><TrendingUp size={20} aria-hidden="true" /><span>Recuperación desde el mínimo*</span><strong>{crisis.monthsRecovery} meses</strong></div>
                </div>
                <p className="crisis__footnote">*Referencias aproximadas del S&amp;P 500 incluidas en la app. La recuperación se cuenta desde el mínimo hasta volver al máximo previo, no desde el inicio de la caída. No es una reconstrucción histórica exacta.</p>
            </section>

            <aside className="crisis__insight"><Info size={20} aria-hidden="true" /><p><strong>Una recuperación pasada no es una promesa.</strong> El plazo, la diversificación y el dinero que necesitas a corto plazo importan tanto como tu capacidad para soportar caídas.</p></aside>

            <section className="crisis__simulator-card" aria-labelledby="crisis-simulation-title">
                <div className="crisis__section-heading"><span className="crisis__icon"><Euro size={24} aria-hidden="true" /></span><div><h2 id="crisis-simulation-title">Pon la caída en euros</h2><p>Ejercicio educativo con el porcentaje del episodio seleccionado.</p></div></div>
                <div className="crisis__inputs">
                    <div className="crisis__input-group"><label htmlFor="crisis-capital">Capital antes de la caída</label><div className="crisis__input-wrapper"><input id="crisis-capital" type="number" inputMode="decimal" value={capital} onChange={e => setAmount(e.target.value, setCapital)} min="0" max="1000000000000" step="100" /><span>€</span></div></div>
                    <div className="crisis__input-group"><label htmlFor="crisis-dca">Aportación mensual durante la caída</label><div className="crisis__input-wrapper"><input id="crisis-dca" type="number" inputMode="decimal" value={monthlyDCA} onChange={e => setAmount(e.target.value, setMonthlyDCA)} min="0" max="1000000000000" step="50" /><span>€/mes</span></div></div>
                </div>
                <div className="crisis__impact">
                    <div className="crisis__impact-row"><span>Capital inicial</span><strong>{money(capital)}</strong><div className="crisis__bar"><span style={{ width: '100%' }} /></div></div>
                    <div className="crisis__impact-row crisis__impact-row--low"><span>En el mínimo · sin nuevas aportaciones</span><strong data-testid="crisis-low-value">{money(impact.lowValue)}</strong><div className="crisis__bar"><span style={{ width: `${100 + crisis.maxDrawdown}%` }} /></div></div>
                    <p>Una caída del <strong>{percent(Math.abs(crisis.maxDrawdown))}</strong> exige después una subida del <strong data-testid="crisis-recovery">{percent(impact.recoveryPercent)}</strong> para volver al punto de partida.</p>
                </div>
                <h3 className="crisis__decision-title">¿Qué cambia según tu decisión?</h3>
                <div className="crisis__scenarios" role="group" aria-label="Decisiones durante la caída">
                    <button type="button" className={`crisis__scenario ${selectedScenario === 'panic' ? 'crisis__scenario--selected' : ''}`} aria-pressed={selectedScenario === 'panic'} onClick={() => setSelectedScenario('panic')}><span className="crisis__scenario-title">Vender en el mínimo</span><span className="crisis__scenario-label">Efectivo tras vender</span><strong>{money(impact.lowValue)}</strong><span>Pérdida realizada: {money(impact.loss)}</span></button>
                    <button type="button" className={`crisis__scenario ${selectedScenario === 'hold' ? 'crisis__scenario--selected' : ''}`} aria-pressed={selectedScenario === 'hold'} onClick={() => setSelectedScenario('hold')}><span className="crisis__scenario-title">Mantener la inversión</span><span className="crisis__scenario-label">Valor de la posición en el mínimo</span><strong>{money(impact.lowValue)}</strong><span>Pérdida no realizada: {money(impact.loss)}</span></button>
                    <button type="button" className={`crisis__scenario ${selectedScenario === 'dca' ? 'crisis__scenario--selected' : ''}`} aria-pressed={selectedScenario === 'dca'} onClick={() => setSelectedScenario('dca')}><span className="crisis__scenario-title">Seguir aportando</span><span className="crisis__scenario-label">Capital total aportado · no valoración</span><strong data-testid="crisis-contributed">{money(impact.totalContributed)}</strong><span>Incluye {money(impact.contributions)} en {crisis.monthsDown} aportaciones mensuales.</span></button>
                </div>
                <div className="crisis__explanation" role="status"><strong>{EXPLANATIONS[selectedScenario].title}</strong><p>{EXPLANATIONS[selectedScenario].text}</p></div>
                <p className="crisis__footnote">Importes nominales en euros por simplicidad. Sin efecto divisa, inflación, comisiones ni impuestos; no simula tu cartera real.</p>
            </section>

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
                <Link to="/academy/risk" className="crisis__next-card"><Shield size={24} aria-hidden="true" /><h3>Gestiona el riesgo</h3><p>Revisa el colchón, la concentración y el plazo.</p><span>Revisar mi plan <ArrowRight size={18} aria-hidden="true" /></span></Link>
                <Link to="/academy/strategies" className="crisis__next-card"><Repeat size={24} aria-hidden="true" /><h3>Define tus reglas</h3><p>Aportaciones y reequilibrio con un criterio previo.</p><span>Ver estrategias <ArrowRight size={18} aria-hidden="true" /></span></Link>
                <Link to="/academy/scenarios" className="crisis__next-card"><BookOpen size={24} aria-hidden="true" /><h3>Qué hacer si…</h3><p>Ensaya decisiones cuando el mercado se complica.</p><span>Explorar escenarios <ArrowRight size={18} aria-hidden="true" /></span></Link>
            </div></section>
        </div>
    );
}
