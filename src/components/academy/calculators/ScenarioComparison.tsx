import { useId, useState } from 'react';
import { Button } from '../../ui';
import { CalculatorCard } from './CalculatorCard';
import './ScenarioComparison.css';

export interface CalculatorScenario {
    parametersKey: string;
    assumptions: Array<{ label: string; value: string }>;
    results: Array<{ label: string; value: string }>;
}

/** Snapshots are local to this comparison, never uploaded or recalculated with new inputs. */
export function ScenarioComparison({ current }: { current: CalculatorScenario | null }) {
    const id = useId();
    const [name, setName] = useState('');
    const [nextIndex, setNextIndex] = useState(1);
    const [scenarios, setScenarios] = useState<Array<CalculatorScenario & { name: string; signature: string }>>([]);
    const [message, setMessage] = useState('');
    const signature = JSON.stringify(current);
    const duplicate = scenarios.some(s => s.signature === signature);

    function save() {
        if (!current || duplicate || scenarios.length >= 3) return;
        const title = name.trim() || `Escenario ${nextIndex}`;
        setScenarios(previous => [...previous, { ...current, name: title, signature }]);
        setName('');
        setNextIndex(index => index + 1);
        setMessage(`${title} añadido a la comparación.`);
    }

    return (
        <CalculatorCard className="scenario-comparison" role="region" aria-labelledby={`${id}-title`}>
            <h3 id={`${id}-title`}>Comparar escenarios</h3>
            <p>Guarda hasta tres simulaciones, cambia los parámetros y compara los resultados. Se conservan mientras estés en esta pantalla; no son previsiones ni garantías.</p>
            <div className="scenario-comparison__controls">
                <div>
                    <label htmlFor={`${id}-name`}>Nombre del escenario (opcional)</label>
                    <input id={`${id}-name`} type="text" maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder="Por ejemplo, mayor ahorro mensual" />
                </div>
                <Button onClick={save} disabled={!current || duplicate || scenarios.length >= 3}>Guardar escenario</Button>
            </div>
            <p className="scenario-comparison__status" role="status">{!current ? 'Completa los parámetros para guardar un escenario.' : duplicate ? 'Este escenario ya está guardado. Cambia algún parámetro para comparar.' : scenarios.length >= 3 ? 'Comparación completa. Quita un escenario para añadir otro.' : message}</p>
            {scenarios.length > 0 && <div className="scenario-comparison__grid">
                {scenarios.map(scenario => (
                    <article className="scenario-comparison__item" key={scenario.signature}>
                        <h4>{scenario.name}</h4>
                        <dl>{scenario.results.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
                        <details><summary>Parámetros guardados</summary><dl>{scenario.assumptions.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></details>
                        <Button variant="ghost" size="sm" aria-label={`Quitar ${scenario.name}`} onClick={() => { setScenarios(previous => previous.filter(s => s.signature !== scenario.signature)); setMessage(`${scenario.name} eliminado de la comparación.`); }}>Quitar</Button>
                    </article>
                ))}
            </div>}
        </CalculatorCard>
    );
}
