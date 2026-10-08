import { useId, useState, type ReactNode } from 'react';
import { ArrowDownToLine, ChevronDown, CircleHelp, Plus, Receipt, RotateCcw, Trash2, Wallet } from 'lucide-react';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { calculateSalary, DEFAULT_SALARY_INPUT, validateSalaryInput, type Dependent, type SalaryInput, type SalaryResult } from '../../../services/irpf/salaryCalculator';
import { TAX_REGIONS, TAX_REVIEW_DATE, TAX_SOURCES, TAX_YEAR, type TaxScale, STATE_SCALE } from '../../../services/irpf/taxData2026';
import './SalaryCalculator.css';

const money = (value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
const percent = (value: number) => `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(value)} %`;
type NumberKey = { [K in keyof SalaryInput]: SalaryInput[K] extends number ? K : never }[keyof SalaryInput];

function NumericField({ label, value, onChange, hint, min = 0, max = 10000000, step = 0.01, suffix = '€' }: {
    label: string; value: number; onChange: (value: number) => void; hint?: string; min?: number; max?: number; step?: number; suffix?: string;
}) {
    const id = useId();
    return <div className="salary-calc__field">
        <label htmlFor={id}>{label}</label>
        <div className="salary-calc__input-wrap"><input id={id} type="number" inputMode={step === 1 ? 'numeric' : 'decimal'} min={min} max={max} step={step}
            value={Number.isFinite(value) ? value : ''} onChange={e => onChange(e.target.value === '' ? NaN : Number(e.target.value))} aria-describedby={hint ? `${id}-hint` : undefined} /><span>{suffix}</span></div>
        {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>;
}
function SelectField({ label, value, onChange, children, hint }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode; hint?: string }) {
    const id = useId();
    return <div className="salary-calc__field"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={e => onChange(e.target.value)} aria-describedby={hint ? `${id}-hint` : undefined}>{children}</select>{hint && <small id={`${id}-hint`}>{hint}</small>}</div>;
}
function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
    return <label className="salary-calc__check"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /><span>{label}</span></label>;
}
function Fold({ title, children, summary }: { title: string; children: ReactNode; summary?: string }) {
    return <details className="salary-calc__fold"><summary><span>{title}{summary && <small>{summary}</small>}</span><ChevronDown size={18} /></summary><div className="salary-calc__fold-body">{children}</div></details>;
}
function ScaleTable({ title, scale, base }: { title: string; scale: TaxScale; base: number }) {
    return <div><h4>{title}</h4><div className="salary-calc__table-wrap"><table><thead><tr><th>Base liquidable</th><th>Tipo marginal</th></tr></thead><tbody>{scale.map(([from, , rate], index) =>
        <tr key={from} className={base >= from && (index === scale.length - 1 || base < scale[index + 1][0]) ? 'salary-calc__current-bracket' : undefined}><td>{money(from)}{scale[index + 1] ? ` – ${money(scale[index + 1][0])}` : ' en adelante'}</td><td>{percent(rate)}</td></tr>)}</tbody></table></div></div>;
}
function FamilyFields({ people, onChange, ascendants = false }: { people: Dependent[]; onChange: (people: Dependent[]) => void; ascendants?: boolean }) {
    const update = (index: number, patch: Partial<Dependent>) => onChange(people.map((p, i) => i === index ? { ...p, ...patch } : p));
    return <div className="salary-calc__family">
        <p className="salary-calc__hint">{ascendants ? 'Añade ascendientes que convivan contigo al menos medio año, mayores de 65 años o con discapacidad.' : 'Añade descendientes menores de 25 años, o con discapacidad, que convivan contigo o dependan económicamente de ti.'} Sus rentas no deben superar 8.000 € y no deben declarar con rentas superiores a 1.800 €.</p>
        {people.map((person, index) => <fieldset className="salary-calc__person" key={index}><legend>{ascendants ? 'Ascendiente' : 'Descendiente'} {index + 1}</legend>
            <div className="salary-calc__fields"><NumericField label="Edad a 31 de diciembre" value={person.age} onChange={age => update(index, { age })} max={120} step={1} suffix="años" />
                <SelectField label="Tu parte del mínimo" value={String(person.share)} onChange={share => update(index, { share: Number(share) })}>
                    <option value="1">100 % · solo tú tienes derecho</option><option value="0.5">50 % · compartido entre dos</option>{ascendants && <><option value={String(1 / 3)}>Un tercio · entre tres</option><option value="0.25">25 % · entre cuatro</option></>}
                </SelectField>
                <SelectField label="Discapacidad reconocida" value={person.disability} onChange={disability => update(index, { disability: disability as Dependent['disability'] })}><option value="none">Sin discapacidad</option><option value="33">Del 33 % al 64 %</option><option value="65">65 % o superior</option></SelectField>
            </div>
            {person.disability !== 'none' && <CheckField label="Necesita ayuda de terceros o tiene movilidad reducida" checked={person.assistance} onChange={assistance => update(index, { assistance })} />}
            {!ascendants && person.age >= 3 && <CheckField label="Adoptado en 2024, 2025 o 2026: incremento por adopción" checked={!!person.adoptedUnder3} onChange={adoptedUnder3 => update(index, { adoptedUnder3 })} />}
            <button className="salary-calc__text-button" type="button" onClick={() => onChange(people.filter((_, i) => i !== index))}><Trash2 size={15} /> Quitar {ascendants ? 'ascendiente' : 'descendiente'}</button>
        </fieldset>)}
        <button className="salary-calc__button salary-calc__button--secondary" type="button" disabled={people.length >= (ascendants ? 6 : 16)} onClick={() => onChange([...people, { age: ascendants ? 70 : 5, share: ascendants ? 1 : 0.5, disability: 'none', assistance: false }])}><Plus size={16} /> Añadir {ascendants ? 'ascendiente' : 'descendiente'}</button>
    </div>;
}

function downloadResult(input: SalaryInput, result: SalaryResult, payments: 12 | 14) {
    const payroll = payments === 12 ? result.twelve : result.fourteen;
    const rows: Array<[string, string | number]> = [
        ['Ejercicio', TAX_YEAR], ['Comunidad', TAX_REGIONS.find(r => r.id === input.region)!.name], ['Pagas', payments],
        ['Bruto anual EUR', result.gross], ['Retencion IRPF porcentaje', result.withholdingRate], ['IRPF retenido anual EUR', result.withheldAnnual],
        ['Seguridad Social anual EUR', result.socialSecurity], ['Neto nomina anual EUR', result.netAnnual],
        ['Bruto paga ordinaria EUR', payroll.gross], ['IRPF paga ordinaria EUR', payroll.irpf], ['SS paga ordinaria EUR', payroll.socialSecurity], ['Neto paga ordinaria EUR', payroll.net],
        ...(payments === 14 ? [['Neto cada paga extra EUR', result.extra.net] as [string, number]] : []),
        ['IRPF declaracion estimado EUR', result.finalTax ?? 'No calculado'], ['Saldo renta positivo a pagar EUR', result.balance ?? 'No calculado'],
        ['Alcance', 'Estimacion individual; un pagador; ano completo; pagas de igual bruto; sin otras rentas'], ['Reglas revisadas', TAX_REVIEW_DATE],
    ];
    const content = '\uFEFF' + rows.map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `freewallet-sueldo-neto-${TAX_YEAR}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SalaryCalculator() {
    const [input, setInput] = useState<SalaryInput>(() => structuredClone(DEFAULT_SALARY_INPUT));
    const [payments, setPayments] = useState<12 | 14>(12);
    const [scenarios, setScenarios] = useState<Array<{ gross: number; name: string; net: number; withheld: number; finalTax: number | null }>>([]);
    const set = <K extends keyof SalaryInput>(key: K, value: SalaryInput[K]) => setInput(previous => ({ ...previous, [key]: value }));
    const numeric = (key: NumberKey, label: string, hint?: string, options?: { min?: number; max?: number; step?: number; suffix?: string }) =>
        <NumericField label={label} value={input[key]} onChange={value => set(key, value)} hint={hint} {...options} />;
    const region = TAX_REGIONS.find(r => r.id === input.region)!;
    const error = validateSalaryInput(input) ?? (region.foral && input.manualWithholding === null ? 'Introduce la retención de tu nómina para calcular el neto en territorio foral.' : null);
    const result = error ? null : calculateSalary(input);
    const payroll = result ? payments === 12 ? result.twelve : result.fourteen : null;
    const saveScenario = () => { if (result) setScenarios(previous => [...previous, { gross: result.gross, name: region.name, net: result.netAnnual, withheld: result.withheldAnnual, finalTax: result.finalTax }].slice(-3)); };

    return <div className="salary-calc">
        <AcademyPageHeader section="Herramientas" className="salary-calc__header"><h1>Calculadora de IRPF y sueldo neto</h1><p>De tu salario bruto a lo que recibes en la cuenta.</p><span className="salary-calc__year">Ejercicio {TAX_YEAR} · Asalariados</span></AcademyPageHeader>
        <div className="salary-calc__layout">
            <section className="salary-calc__form" aria-label="Preguntas para calcular el sueldo">
                <div className="salary-calc__panel"><div className="salary-calc__section-title"><Receipt size={21} /><h2>Tu sueldo y contrato</h2></div>
                    <div className="salary-calc__fields">
                        {numeric('grossAnnual', '¿Cuál es tu sueldo bruto anual?', 'Incluye las pagas extra y el variable sujeto a IRPF. Simulamos un año completo.')}
                        <SelectField label="¿Dónde tienes tu residencia fiscal?" value={input.region} onChange={value => { setInput(previous => ({ ...previous, region: value, territorialRelief: false, manualWithholding: TAX_REGIONS.find(r => r.id === value)?.foral ? NaN : null })); }}>
                            {TAX_REGIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </SelectField>
                        <SelectField label="¿Qué contrato tienes?" value={input.contract} onChange={value => set('contract', value as SalaryInput['contract'])}><option value="permanent">Indefinido</option><option value="temporary">Temporal de un año o más</option><option value="under-year">Temporal inferior a un año</option></SelectField>
                        {numeric('workingTime', '¿Qué porcentaje de jornada trabajas?', 'El bruto es el que cobras con esa jornada; no se vuelve a reducir.', { min: 1, max: 100, suffix: '%' })}
                    </div>
                    <div className="salary-calc__field"><span>¿Cómo quieres repartir las pagas?</span><div className="salary-calc__segmented" role="group" aria-label="Número de pagas"><button type="button" aria-pressed={payments === 12} onClick={() => setPayments(12)}>12 pagas</button><button type="button" aria-pressed={payments === 14} onClick={() => setPayments(14)}>14 pagas</button></div></div>
                </div>

                <Fold title="Tu situación personal y familiar" summary={input.children.length || input.ascendants.length ? `${input.children.length} descendientes · ${input.ascendants.length} ascendientes` : 'Edad, hijos y discapacidad'}>
                    <div className="salary-calc__fields">{numeric('age', 'Edad a 31 de diciembre de 2026', undefined, { min: 16, max: 100, step: 1, suffix: 'años' })}
                        <SelectField label="Situación familiar · Modelo 145" value={input.familySituation} onChange={value => set('familySituation', value as SalaryInput['familySituation'])}><option value="3">Soltero, pareja u otras situaciones</option><option value="2">Casado: cónyuge con rentas de hasta 1.500 €</option><option value="1">Sin cónyuge: hijos menores solo a mi cargo</option></SelectField>
                        <SelectField label="Tu discapacidad reconocida" value={input.disability} onChange={value => set('disability', value as SalaryInput['disability'])}><option value="none">Sin discapacidad</option><option value="33">Del 33 % al 64 %</option><option value="65">65 % o superior</option></SelectField>
                    </div>
                    {input.disability !== 'none' && <CheckField label="Necesitas ayuda de terceros o tienes movilidad reducida" checked={input.assistance} onChange={value => set('assistance', value)} />}
                    <h3>Descendientes con derecho al mínimo</h3><FamilyFields people={input.children} onChange={value => set('children', value)} />
                    <h3>Ascendientes a tu cargo</h3><FamilyFields ascendants people={input.ascendants} onChange={value => set('ascendants', value)} />
                </Fold>

                <Fold title="Ajustes de nómina" summary="Retención real, cotización y vivienda">
                    <div className="salary-calc__fields"><SelectField label="Grupo de cotización" value={String(input.contributionGroup)} onChange={value => set('contributionGroup', Number(value))} hint="Figura en tu nómina. Se simula cotización mensual del Régimen General."><option value="1">1 · Ingenieros, licenciados y alta dirección</option><option value="2">2 · Ingenieros técnicos y ayudantes titulados</option><option value="3">3 · Jefes administrativos y de taller</option><option value="4">4 · Ayudantes no titulados</option><option value="5">5 · Oficiales administrativos</option><option value="6">6 · Subalternos</option><option value="7">7 · Auxiliares administrativos</option></SelectField>
                        {numeric('employerAccidentRate', 'Accidentes de trabajo · tipo de la empresa', 'Solo afecta al coste empresarial. 1,50 % corresponde a trabajos exclusivos de oficina.', { max: 10, suffix: '%' })}
                    </div>
                    <CheckField label="Usar el porcentaje de IRPF que aparece en mi nómina" checked={input.manualWithholding !== null} onChange={checked => set('manualWithholding', checked ? 15 : null)} />
                    {input.manualWithholding !== null && <NumericField label="Retención de IRPF de tu nómina" value={input.manualWithholding} onChange={value => set('manualWithholding', value)} max={100} suffix="%" />}
                    {region.foral && <p className="salary-calc__hint">Consulta tu porcentaje en <a href={region.source} target="_blank" rel="noreferrer">Hacienda de {region.name}</a>. El régimen de retención puede depender del lugar de trabajo; si tu empresa aplica la AEAT, introduce el porcentaje de su cálculo.</p>}
                    <CheckField label="Movilidad geográfica: desempleado que acepta un empleo que exige cambiar de municipio (año del traslado o siguiente)" checked={input.geographicMobility} onChange={value => set('geographicMobility', value)} />
                    <CheckField label="He comunicado en el Modelo 145 pagos por vivienda habitual con derecho a la deducción anterior a 2013" checked={input.housingBefore2013} onChange={value => set('housingBefore2013', value)} />
                    {['ceuta', 'melilla', 'canarias'].includes(input.region) && <CheckField label={input.region === 'canarias' ? 'Resido en La Palma y todo este sueldo tiene derecho a la deducción territorial de 2026' : 'Resido aquí y todo este sueldo tiene derecho a la deducción por rentas de Ceuta o Melilla'} checked={input.territorialRelief} onChange={value => set('territorialRelief', value)} />}
                    <div className="salary-calc__fields">{numeric('spousePension', 'Pensión compensatoria al excónyuge al año', 'Solo la establecida por resolución judicial.')}{numeric('childSupport', 'Anualidades por alimentos a hijos al año', 'Por resolución judicial y sin aplicar mínimo por esos descendientes.')}</div>
                </Fold>

                <Fold title="Ajustes de la declaración de renta" summary="Planes de pensiones, gastos y deducciones">
                    <p className="salary-calc__hint">Estos ajustes modifican la estimación de renta; el ingreso mensual de tu nómina se mantiene.</p>
                    <div className="salary-calc__fields">{numeric('personalPension', 'Aportación a plan de pensiones individual al año', 'Reducción máxima: 1.500 € y 30 % del rendimiento neto. No incluye planes de empleo ni EPSV.')}
                        {numeric('unionFees', 'Cuotas sindicales al año')}{numeric('professionalFees', 'Colegiación obligatoria al año', 'Solo la obligatoria para trabajar. Máximo deducible: 500 €.')} {numeric('legalExpenses', 'Defensa jurídica laboral al año', 'Máximo deducible: 300 €.')}
                        {numeric('stateDeductions', 'Deducciones de cuota estatal ya verificadas', 'Introduce solo el importe estatal al que tienes derecho, no el gasto realizado.')}
                        {numeric('regionalDeductions', 'Deducciones de cuota autonómica ya verificadas', 'Introduce solo el importe autonómico al que tienes derecho, no el gasto realizado.')}
                    </div>
                    <p className="salary-calc__hint">Las deducciones por alquiler, nacimiento, maternidad o donativos requieren comprobar sus propios requisitos. Los abonos anticipados y las deducciones reembolsables no se incluyen en el saldo calculado.</p>
                </Fold>
                <button className="salary-calc__text-button" type="button" onClick={() => { setInput(structuredClone(DEFAULT_SALARY_INPUT)); setPayments(12); }}><RotateCcw size={16} /> Restablecer ejemplo</button>
                <p className="salary-calc__privacy">Tus respuestas se calculan en este dispositivo y no se guardan.</p>
            </section>

            <section className="salary-calc__results" aria-label="Resultado del sueldo neto">
                {error && <div className="salary-calc__error" role="alert"><CircleHelp size={22} /><div><strong>Revisa tus respuestas</strong><p>{error}</p>{region.foral && <p>Abre «Ajustes de nómina» e introduce la retención.</p>}</div></div>}
                {result && payroll && <>
                    <div className="salary-calc__hero"><div className="salary-calc__section-title"><Wallet size={22} /><span>Neto mensual estimado · {payments} pagas</span></div><strong data-testid="salary-monthly-net">{money(payroll.net)}</strong><p>{payments === 14 ? `12 mensualidades + 2 extras de ${money(result.extra.net)}` : 'Pagas extra prorrateadas en las 12 mensualidades'}</p>
                        <div className="salary-calc__hero-footer"><span>Neto anual en nómina <b data-testid="salary-annual-net">{money(result.netAnnual)}</b></span><span>Retención IRPF <b data-testid="salary-withholding-rate">{percent(result.withholdingRate)}</b></span></div>
                    </div>
                    <div className="salary-calc__panel"><h2>Así se reparte tu bruto</h2><div className="salary-calc__distribution" role="img" aria-label={`Neto ${money(result.netAnnual)}, IRPF ${money(result.withheldAnnual)}, Seguridad Social ${money(result.socialSecurity)} al año`}>
                        {[['net', result.netAnnual], ['irpf', result.withheldAnnual], ['ss', result.socialSecurity]].map(([name, value]) => <span key={name} className={`salary-calc__distribution--${name}`} style={{ flexGrow: result.gross > 0 ? Math.max(0, Number(value)) / result.gross : 0 }} />)}
                    </div>
                        <dl className="salary-calc__breakdown"><div><dt>Bruto anual</dt><dd>{money(result.gross)}</dd></div><div><dt><i className="salary-calc__dot salary-calc__dot--irpf" />IRPF retenido</dt><dd>{money(result.withheldAnnual)}<small>{percent(result.withholdingRate)} del bruto</small></dd></div><div><dt><i className="salary-calc__dot salary-calc__dot--ss" />Seguridad Social</dt><dd>{money(result.socialSecurity)}</dd></div><div className="salary-calc__total"><dt><i className="salary-calc__dot salary-calc__dot--net" />Neto en nómina</dt><dd>{money(result.netAnnual)}</dd></div></dl>
                        <div className="salary-calc__payment-comparison"><div className={payments === 12 ? 'is-selected' : undefined}><span>En 12 pagas</span><strong>{money(result.twelve.net)}</strong><small>al mes</small></div><div className={payments === 14 ? 'is-selected' : undefined}><span>En 14 pagas</span><strong>{money(result.fourteen.net)}</strong><small>al mes + 2 × {money(result.extra.net)}</small></div></div>
                        <p className="salary-calc__hint">En 14 pagas, la Seguridad Social de las extras ya se descuenta en las 12 nóminas ordinarias. Cambiar el reparto mantiene el neto anual.</p>
                    </div>
                    <Fold title="Desglose de una nómina" summary={`Bruto ${money(payroll.gross)} · ${payments} pagas`}><dl className="salary-calc__breakdown"><div><dt>Bruto de la paga ordinaria</dt><dd>{money(payroll.gross)}</dd></div><div><dt>IRPF retenido</dt><dd>−{money(payroll.irpf)}</dd></div>{result.contributions.map(c => <div key={c.name}><dt>{c.name}{c.rate !== null ? ` · ${percent(c.rate)}` : ' · por tramos'}</dt><dd>−{money(c.monthly)}</dd></div>)}<div className="salary-calc__total"><dt>Neto</dt><dd>{money(payroll.net)}</dd></div></dl><p className="salary-calc__hint">Base de cotización mensual: {money(result.monthlyBase)}, con las extras prorrateadas. Los redondeos de cada nómina pueden generar diferencias de céntimos.</p></Fold>

                    <div className="salary-calc__panel salary-calc__tax"><h2>IRPF de la declaración</h2><p className="salary-calc__hint">Estimación individual con este sueldo como única renta.</p>{result.finalTax !== null && result.balance !== null ? <><div className="salary-calc__tax-value"><span>IRPF anual estimado</span><strong data-testid="salary-final-tax">{money(result.finalTax)}</strong><small>{percent(result.gross > 0 ? result.finalTax / result.gross * 100 : 0)} efectivo sobre el bruto</small></div>
                        <div className="salary-calc__settlement"><span>{Math.abs(result.balance) < 0.01 ? 'Retención ajustada' : result.balance > 0 ? 'Diferencia estimada a pagar' : 'Diferencia estimada a devolver'}</span><strong>{money(Math.abs(result.balance))}</strong></div>
                        <p className="salary-calc__hint">La empresa adelanta {money(result.withheldAnnual)} vía retenciones. La comunidad afecta a la declaración; la retención general se calcula con las reglas de la AEAT.</p></> : <p>La renta foral requiere el simulador de tu Hacienda. No se aplica la escala estatal a {region.name}.</p>}
                        {result.finalTax !== null && <Fold title="Cómo se calcula la renta"><dl className="salary-calc__breakdown"><div><dt>Gastos generales y adicionales</dt><dd>{money(result.annualGeneralExpenses)}</dd></div><div><dt>Otros gastos deducibles</dt><dd>{money(result.annualOtherExpenses)}</dd></div><div><dt>Reducción por rentas del trabajo</dt><dd>{money(result.annualWorkReduction)}</dd></div><div><dt>Reducción por plan individual</dt><dd>{money(result.pensionReduction)}</dd></div><div><dt>Base liquidable general</dt><dd>{money(result.annualTaxBase)}</dd></div><div><dt>Mínimo estatal personal y familiar</dt><dd>{money(result.stateMinimum)}</dd></div><div><dt>Mínimo autonómico</dt><dd>{money(result.regionalMinimum)}</dd></div>{result.stateQuota !== null && <div><dt>Cuota estatal tras el mínimo</dt><dd>{money(result.stateQuota)}</dd></div>}{result.regionalQuota !== null && <div><dt>Cuota autonómica tras el mínimo</dt><dd>{money(result.regionalQuota)}</dd></div>}{result.lowSalaryDeduction !== null && <div><dt>Deducción por salarios bajos</dt><dd>{money(result.lowSalaryDeduction)}</dd></div>}{result.marginalRate !== null && <div><dt>Tipo marginal sobre la base</dt><dd>{percent(result.marginalRate)}</dd></div>}</dl>
                            <p className="salary-calc__hint">El mínimo personal y familiar reduce la cuota aplicando su propia escala; no se resta directamente del bruto. El tipo marginal solo afecta al siguiente euro de base, no a todo el sueldo.</p>
                            {region.scale && <div className="salary-calc__scales"><ScaleTable title="Escala estatal" scale={STATE_SCALE} base={result.annualTaxBase} /><ScaleTable title={region.name} scale={region.scale} base={result.annualTaxBase} /></div>}
                        </Fold>}
                    </div>
                    {result.warnings.length > 0 && <div className="salary-calc__notes">{result.warnings.map(warning => <p key={warning}>{warning}</p>)}</div>}
                    <Fold title="Calendario de cobros y coste empresarial"><div className="salary-calc__table-wrap"><table><thead><tr><th>Mes</th><th>Neto ordinario</th><th>Extra</th><th>Total</th></tr></thead><tbody>{['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((month, index) => { const extra = payments === 14 && (index === 5 || index === 11) ? result.extra.net : 0; return <tr key={month}><td>{month}</td><td>{money(payroll.net)}</td><td>{extra > 0 ? money(extra) : '—'}</td><td>{money(payroll.net + extra)}</td></tr>; })}</tbody></table></div><p className="salary-calc__hint">Extras iguales, en junio y diciembre. La empresa puede usar otros meses o importes según tu convenio.</p><dl className="salary-calc__breakdown"><div><dt>Cotizaciones empresariales anuales</dt><dd>{money(result.employerContributions)}</dd></div><div><dt>Coste total estimado de la empresa</dt><dd>{money(result.employerCost)}</dd></div></dl><p className="salary-calc__hint">Las cotizaciones de la empresa no se descuentan de tu neto. No incluye bonificaciones, recargos de contratos muy cortos ni otros costes laborales.</p></Fold>
                    <div className="salary-calc__actions"><button type="button" className="salary-calc__button" onClick={() => downloadResult(input, result, payments)}><ArrowDownToLine size={17} /> Descargar desglose</button><button type="button" className="salary-calc__button salary-calc__button--secondary" onClick={saveScenario} disabled={scenarios.length >= 3}><Plus size={17} /> Comparar escenario</button></div>
                </>}
            </section>
        </div>
        {scenarios.length > 0 && <section className="salary-calc__panel salary-calc__scenarios"><h2>Compara hasta tres escenarios</h2><div className="salary-calc__scenario-grid">{scenarios.map((scenario, index) => <article key={index}><div><h3>Escenario {index + 1}</h3><button type="button" aria-label={`Eliminar escenario ${index + 1}`} onClick={() => setScenarios(previous => previous.filter((_, i) => i !== index))}><Trash2 size={17} /></button></div><p>{scenario.name} · {money(scenario.gross)} brutos</p><strong>{money(scenario.net / 12)}<small>neto equivalente en 12 pagas</small></strong><dl className="salary-calc__breakdown"><div><dt>IRPF retenido al año</dt><dd>{money(scenario.withheld)}</dd></div><div><dt>IRPF de renta estimado</dt><dd>{scenario.finalTax === null ? 'No calculado' : money(scenario.finalTax)}</dd></div></dl></article>)}</div></section>}
        <Fold title="Alcance y fuentes oficiales" summary={`Reglas de 2026 · revisadas el ${TAX_REVIEW_DATE}`}><p>Simulación para un asalariado del Régimen General, un pagador y un año completo, con pagas de igual bruto. La jornada sirve para estimar la base mínima. La retención sigue el cálculo inicial de la AEAT aplicable desde el 10 de septiembre de 2026; no reconstruye regularizaciones ni cambios de empleo durante el año.</p><p>La estimación de renta usa las escalas y mínimos autonómicos de 2026. No incluye otras rentas, tributación conjunta, autónomos, retribución en especie, horas extra, regímenes especiales, cotización diaria ni todos los beneficios fiscales. Para territorios forales se requiere una retención indicada y no se estima la declaración. Los ajustes por vivienda del Modelo 145 reducen la retención, pero su deducción en renta debe introducirse en los importes verificados.</p><div className="salary-calc__sources"><a href={TAX_SOURCES.withholding} target="_blank" rel="noreferrer">AEAT · algoritmo de retenciones 2026</a><a href={TAX_SOURCES.regions} target="_blank" rel="noreferrer">Hacienda · escalas y mínimos autonómicos 2026</a><a href={TAX_SOURCES.socialSecurity} target="_blank" rel="noreferrer">BOE · cotización a la Seguridad Social 2026</a><a href={TAX_SOURCES.incomeTax} target="_blank" rel="noreferrer">BOE · Ley del IRPF y deducción por salarios bajos</a><a href={TAX_SOURCES.aeatCalculator} target="_blank" rel="noreferrer">Comprobar la retención en el simulador oficial</a></div></Fold>
    </div>;
}
