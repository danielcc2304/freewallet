import { CalculatorField } from './CalculatorField';
import { useEffect, useMemo, useState } from 'react';
import { PiggyBank, ShieldCheck, AlertCircle, TrendingUp, HelpCircle, Home, Utensils, Zap, Plus, Users } from 'lucide-react';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { validateCalculatorInputs } from './calculatorValidation';
import { CalculatorPanel, CalculatorMetric } from './CalculatorPanel';
import { cn } from '../../../utils/cn';
import { emergencyStyles as styles } from './emergencyStyles';

interface EmergencyFundCalculatorStorage {
    monthlyRent: number | string;
    monthlyFood: number | string;
    monthlyBills: number | string;
    monthlyOther: number | string;
    jobStability: 'high' | 'medium' | 'low';
    dependents: number | string;
    currentSavings: number | string;
}

const EMERGENCY_FUND_STORAGE_KEY = 'freewallet_emergency_fund_calculator';

function readStoredEmergencyFund(): Partial<EmergencyFundCalculatorStorage> {
    if (typeof window === 'undefined') return {};

    try {
        const raw = window.localStorage.getItem(EMERGENCY_FUND_STORAGE_KEY);
        if (!raw) return {};

        const stored = JSON.parse(raw) as unknown;
        return stored && typeof stored === 'object'
            ? stored as Partial<EmergencyFundCalculatorStorage>
            : {};
    } catch {
        return {};
    }
}

export function EmergencyFundCalculator() {
    const stored = useMemo(() => readStoredEmergencyFund(), []);
    const initialJobStability = stored.jobStability === 'medium' || stored.jobStability === 'low'
        ? stored.jobStability
        : 'high';

    // Inputs
    const [monthlyRent, setMonthlyRent] = useState<number | string>(stored.monthlyRent ?? 800);
    const [monthlyFood, setMonthlyFood] = useState<number | string>(stored.monthlyFood ?? 400);
    const [monthlyBills, setMonthlyBills] = useState<number | string>(stored.monthlyBills ?? 200);
    const [monthlyOther, setMonthlyOther] = useState<number | string>(stored.monthlyOther ?? 300);

    // Risk factors
    const [jobStability, setJobStability] = useState<'high' | 'medium' | 'low'>(initialJobStability);
    const [dependents, setDependents] = useState<number | string>(stored.dependents ?? 0);
    const [currentSavings, setCurrentSavings] = useState<number | string>(stored.currentSavings ?? 1000);

    useEffect(() => {
        const payload: EmergencyFundCalculatorStorage = {
            monthlyRent,
            monthlyFood,
            monthlyBills,
            monthlyOther,
            jobStability,
            dependents,
            currentSavings
        };

        try {
            localStorage.setItem(EMERGENCY_FUND_STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // Ignore localStorage failures.
        }
    }, [monthlyRent, monthlyFood, monthlyBills, monthlyOther, jobStability, dependents, currentSavings]);

    // Numeric versions
    const rentNum = Number(monthlyRent) || 0;
    const foodNum = Number(monthlyFood) || 0;
    const billsNum = Number(monthlyBills) || 0;
    const otherNum = Number(monthlyOther) || 0;
    const savingsNum = Number(currentSavings) || 0;
    const dependentsNum = Number(dependents) || 0;
    const calculationError = validateCalculatorInputs([
        { label: 'Vivienda', value: monthlyRent },
        { label: 'Alimentación', value: monthlyFood },
        { label: 'Suministros', value: monthlyBills },
        { label: 'Otros gastos', value: monthlyOther },
        { label: 'Ahorro actual', value: currentSavings },
        { label: 'Personas dependientes', value: dependents, max: 100, integer: true },
    ]);

    // Calculations
    const totalExpenses = rentNum + foodNum + billsNum + otherNum;

    // Multiplier logic
    const monthsMultiplier = useMemo(() => {
        let base = 3;
        if (jobStability === 'medium') base += 3;
        if (jobStability === 'low') base += 6;
        if (dependentsNum > 0) base += Math.min(dependentsNum * 1, 3);
        return Math.min(base, 12); // Cap at 12 months
    }, [jobStability, dependentsNum]);

    const recommendedAmount = totalExpenses * monthsMultiplier;
    const progressPercent = recommendedAmount > 0 ? Math.min((savingsNum / recommendedAmount) * 100, 100) : 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className={cn("emergency", styles["emergency"])}>
            <AcademyPageHeader className={cn("emergency__header", styles["emergency__header"])} section="Herramientas">
                <div className={cn("emergency__title-group", styles["emergency__title-group"])}>
                    <div className="emergency__icon-container">
                        <PiggyBank className={cn("emergency__title-icon", styles["emergency__title-icon"])} />
                    </div>
                    <div>
                        <h1 className={cn("emergency__title", styles["emergency__title"])}>Fondo de Emergencia</h1>
                        <p className={cn("emergency__subtitle", styles["emergency__subtitle"])}>El colchón que te permite dormir tranquilo.</p>
                    </div>
                </div>
            </AcademyPageHeader>

            <div className={cn("emergency__grid", styles["emergency__grid"])}>
                <section className={cn("emergency__inputs", styles["emergency__inputs"])}>
                    <CalculatorPanel className="emergency__card">
                        <h3 className={cn("emergency__card-title", styles["emergency__card-title"])}>Tus Gastos Mensuales</h3>
                        <div className={cn("emergency__input-list", styles["emergency__input-list"])}>
                            <CalculatorField controlId="emergencyfundcalculator-monthlyRent" label="Vivienda (Alquiler/Hipoteca)" icon={<Home size={18} />} unit="€">
                                <input id="emergencyfundcalculator-monthlyRent" type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value === '' ? '' : Number(e.target.value))} />
                            </CalculatorField>
                            <CalculatorField controlId="emergencyfundcalculator-monthlyFood" label="Alimentación" icon={<Utensils size={18} />} unit="€">
                                <input id="emergencyfundcalculator-monthlyFood" type="number" value={monthlyFood} onChange={(e) => setMonthlyFood(e.target.value === '' ? '' : Number(e.target.value))} />
                            </CalculatorField>
                            <CalculatorField controlId="emergencyfundcalculator-monthlyBills" label="Suministros (Luz, Agua, Internet)" icon={<Zap size={18} />} unit="€">
                                <input id="emergencyfundcalculator-monthlyBills" type="number" value={monthlyBills} onChange={(e) => setMonthlyBills(e.target.value === '' ? '' : Number(e.target.value))} />
                            </CalculatorField>
                            <CalculatorField controlId="emergencyfundcalculator-monthlyOther" label="Otros Gastos Fijos" icon={<Plus size={18} />} unit="€">
                                <input id="emergencyfundcalculator-monthlyOther" type="number" value={monthlyOther} onChange={(e) => setMonthlyOther(e.target.value === '' ? '' : Number(e.target.value))} />
                            </CalculatorField>
                        </div>
                        <div className={cn("emergency__total-expenses", styles["emergency__total-expenses"])}>
                            <span>Gastos Totales:</span>
                            <strong>{formatCurrency(totalExpenses)}/mes</strong>
                        </div>
                    </CalculatorPanel>

                    <CalculatorPanel className="emergency__card">
                        <h3 className={cn("emergency__card-title", styles["emergency__card-title"])}>Perfil de Riesgo</h3>
                        <div className={cn("emergency__input-list", styles["emergency__input-list"])}>
                            <CalculatorField controlId="emergency-job-stability" label="Estabilidad Laboral" icon={<ShieldCheck size={18} />}>
                                <select
                                        id="emergency-job-stability"
                                        value={jobStability}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === 'high' || value === 'medium' || value === 'low') {
                                                setJobStability(value);
                                            }
                                        }}
                                    >
                                        <option value="high">Alta (Estable)</option>
                                        <option value="medium">Media (Empleado)</option>
                                        <option value="low">Baja (Autónomo)</option>
                                    </select>
                            </CalculatorField>
                            <CalculatorField controlId="emergencyfundcalculator-dependents" label="Personas a tu cargo" icon={<Users size={18} />}>
                                <input id="emergencyfundcalculator-dependents" type="number" min="0" value={dependents} onChange={(e) => setDependents(e.target.value === '' ? '' : Number(e.target.value))} />
                            </CalculatorField>
                        </div>
                    </CalculatorPanel>

                    <CalculatorPanel className="emergency__card">
                        <h3 className={cn("emergency__card-title", styles["emergency__card-title"])}>Estado Actual</h3>
                        <CalculatorField controlId="emergencyfundcalculator-currentSavings" label="Dinero ahorrado para el fondo" icon={<PiggyBank size={18} />} unit="€">
                                <input id="emergencyfundcalculator-currentSavings" type="number" value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value === '' ? '' : Number(e.target.value))} />
                            </CalculatorField>
                    </CalculatorPanel>
                </section>

                <main className="emergency__results">
                    {calculationError ? <p role="alert">{calculationError}</p> : totalExpenses === 0 ? (
                        <CalculatorPanel className={cn("emergency__insight-card", styles["emergency__insight-card"])} role="status">
                            <HelpCircle />
                            <div><h3>Añade tus gastos mensuales</h3><p>Sin gastos registrados no podemos calcular el fondo que necesitas. Tu ahorro actual se conserva.</p></div>
                        </CalculatorPanel>
                    ) : <>
                    <CalculatorPanel border="strong" className={cn("emergency__recommendation-box", styles["emergency__recommendation-box"])}>
                        <div className={cn("emergency__rec-header", styles["emergency__rec-header"])}>
                            <ShieldCheck className={cn("emergency__rec-icon", styles["emergency__rec-icon"])} />
                            <h3>Recomendación de Seguridad</h3>
                        </div>
                        <div className={cn("emergency__rec-main", styles["emergency__rec-main"])}>
                            <CalculatorMetric className="emergency__rec-amount" label="Tu Fondo Objetivo:" value={formatCurrency(recommendedAmount)} />
                            <CalculatorMetric className="emergency__rec-months" label="Equivalente a:" value={<>{monthsMultiplier} meses</>} valueClassName="tw:text-[#3b82f6]" />
                        </div>

                        <div className={cn("emergency__progress-section", styles["emergency__progress-section"])}>
                            <div className={cn("emergency__progress-labels", styles["emergency__progress-labels"])}>
                                <span>Progreso: {formatCurrency(savingsNum)}</span>
                                <span>{progressPercent.toFixed(0)}%</span>
                            </div>
                            <div className={cn("emergency__progress-bar", styles["emergency__progress-bar"])}>
                                <div
                                    className={cn("emergency__progress-fill", styles["emergency__progress-fill"])}
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    </CalculatorPanel>

                    <div className={cn("emergency__insights", styles["emergency__insights"])}>
                        <CalculatorPanel className={cn("emergency__insight-card", styles["emergency__insight-card"])}>
                            <AlertCircle className="blue" />
                            <div>
                                <h4>¿Por qué {monthsMultiplier} meses?</h4>
                                <p>
                                    Basado en tu estabilidad <strong>{jobStability === 'high' ? 'alta' : jobStability === 'medium' ? 'media' : 'baja'}</strong>
                                    {dependentsNum > 0 ? ` y en tener ${dependentsNum} personas a tu cargo, ` : ' y tu situación personal, '}
                                    este colchón te protege ante imprevistos graves.
                                </p>
                            </div>
                        </CalculatorPanel>

                        <CalculatorPanel className={cn("emergency__insight-card", styles["emergency__insight-card"])}>
                            <TrendingUp className="green" />
                            <div>
                                <h4>Siguiente Paso</h4>
                                <p>
                                    {progressPercent < 100
                                        ? `Te faltan ${formatCurrency(Math.max(0, recommendedAmount - savingsNum))} para completar tu tranquilidad.`
                                        : '¡Felicidades! Tienes tu fondo completo. Ahora puedes centrarte en la inversión a largo plazo.'}
                                </p>
                            </div>
                        </CalculatorPanel>
                    </div>

                    <CalculatorPanel surface="muted" className="emergency__theory">
                        <h4 className={cn("emergency__theory-title", styles["emergency__theory-title"])}>
                            <HelpCircle size={18} /> ¿Dónde guardar este dinero?
                        </h4>
                        <div className={cn("emergency__theory-grid", styles["emergency__theory-grid"])}>
                            <div className={cn("theory-item", styles["theory-item"])}>
                                <strong>Disponibilidad Total:</strong>
                                <p>Debe ser dinero accesible en menos de 48h (cuenta remunerada o fondo monetario).</p>
                            </div>
                            <div className={cn("theory-item", styles["theory-item"])}>
                                <strong>Riesgo Cero:</strong>
                                <p>Nunca inviertas este dinero en activos volátiles (cripto, bolsa).</p>
                            </div>
                        </div>
                    </CalculatorPanel>
                    </>}
                </main>
            </div>
        </div>
    );
}
