import { useId, useState } from 'react';
import { Button, DefinitionList } from '../../ui';
import { CalculatorCard } from './CalculatorCard';

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
        <CalculatorCard className="scenario-comparison tw:[--calculator-card-padding:var(--spacing-lg)] tw:[--calculator-card-radius:var(--radius-lg)] tw:[--calculator-card-border:var(--border-primary)] tw:[&_h3]:text-main tw:[&_h4]:text-main tw:[&_h3]:m-[0_0_.75rem] tw:[&_h4]:m-[0_0_.75rem] tw:[&_h3]:wrap-anywhere tw:[&_h4]:wrap-anywhere tw:[&_.btn]:min-h-[44px] tw:[&_.btn]:min-w-[44px]" role="region" aria-labelledby={`${id}-title`}>
            <h3 id={`${id}-title`}>Comparar escenarios</h3>
            <p className="tw:text-secondary tw:text-[.875rem]">Guarda hasta tres simulaciones, cambia los parámetros y compara los resultados. Se conservan mientras estés en esta pantalla; no son previsiones ni garantías.</p>
            <div className="scenario-comparison__controls tw:flex tw:gap-[1rem] tw:items-end tw:flex-wrap tw:mt-[1rem]">
                <div className="tw:flex-[1_1_220px] tw:min-w-0">
                    <label className="tw:block tw:text-secondary tw:text-[.875rem] tw:mb-[.5rem]" htmlFor={`${id}-name`}>Nombre del escenario (opcional)</label>
                    <input className="tw:w-full tw:min-h-[44px] tw:min-w-0 tw:p-[.6rem] tw:text-main tw:ui-fill-muted tw:ui-border tw:rounded-control" id={`${id}-name`} type="text" maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder="Por ejemplo, mayor ahorro mensual" />
                </div>
                <Button onClick={save} disabled={!current || duplicate || scenarios.length >= 3}>Guardar escenario</Button>
            </div>
            <p className="scenario-comparison__status tw:min-h-[1.3em] tw:text-secondary tw:text-[.875rem]" role="status">{!current ? 'Completa los parámetros para guardar un escenario.' : duplicate ? 'Este escenario ya está guardado. Cambia algún parámetro para comparar.' : scenarios.length >= 3 ? 'Comparación completa. Quita un escenario para añadir otro.' : message}</p>
            {scenarios.length > 0 && <div className="scenario-comparison__grid tw:grid tw:grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] tw:gap-[1rem]">
                {scenarios.map(scenario => (
                    <article className="scenario-comparison__item tw:min-w-0 tw:p-[1rem] tw:ui-border tw:rounded-control" key={scenario.signature}>
                        <h4>{scenario.name}</h4>
                        <DefinitionList items={scenario.results} />
                        <details><summary className="tw:text-secondary tw:text-[.875rem] tw:cursor-pointer tw:min-h-[44px] tw:ui-row">Parámetros guardados</summary><DefinitionList items={scenario.assumptions} /></details>
                        <Button variant="ghost" size="sm" aria-label={`Quitar ${scenario.name}`} onClick={() => { setScenarios(previous => previous.filter(s => s.signature !== scenario.signature)); setMessage(`${scenario.name} eliminado de la comparación.`); }}>Quitar</Button>
                    </article>
                ))}
            </div>}
        </CalculatorCard>
    );
}
