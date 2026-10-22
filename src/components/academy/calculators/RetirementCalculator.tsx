import { CalculatorField } from './CalculatorField';
import { CalculatorResultCard } from './CalculatorResultCard';
import { useEffect, useMemo, useState } from 'react';
import { Calendar, Info, ShieldAlert, BadgeInfo, Wallet2, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CalculatorCard } from './CalculatorCard';
import { validateCalculatorInputs } from './calculatorValidation';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import './RetirementCalculator.css';
import { ScenarioComparison } from './ScenarioComparison';

interface RetirementCalculatorStorage {
    currentAge: number | string;
    retirementAge: number | string;
    currentSavings: number | string;
    monthlyContribution: number | string;
    annualReturn: number | string;
    inflationRate: number | string;
}

const RETIREMENT_CALCULATOR_STORAGE_KEY = 'freewallet_retirement_calculator';

function readStoredRetirementCalculator(): Partial<RetirementCalculatorStorage> {
    if (typeof window === 'undefined') return {};

    try {
        const raw = window.localStorage.getItem(RETIREMENT_CALCULATOR_STORAGE_KEY);
        if (!raw) return {};

        const stored = JSON.parse(raw) as unknown;
        return stored && typeof stored === 'object'
            ? stored as Partial<RetirementCalculatorStorage>
            : {};
    } catch {
        return {};
    }
}

function formatRetirementCurrency(value: number) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
    }).format(value);
}

interface RetirementTooltipProps {
    active?: boolean;
    payload?: ReadonlyArray<{ value?: number | string }>;
    label?: number | string;
}

function RetirementTooltip({ active, payload, label }: RetirementTooltipProps) {
    if (!active || !payload?.length) return null;

    return (
        <div className="retirement-tooltip">
            <p className="retirement-tooltip__label">Edad: {label} años</p>
            <p className="retirement-tooltip__value nominal">Valor Futuro: {formatRetirementCurrency(Number(payload[0]?.value ?? 0))}</p>
            <p className="retirement-tooltip__value real">Poder de Compra Hoy: {formatRetirementCurrency(Number(payload[1]?.value ?? 0))}</p>
        </div>
    );
}

export function RetirementCalculator() {
    // Inputs
    const stored = useMemo(() => readStoredRetirementCalculator(), []);
    const [currentAge, setCurrentAge] = useState<number | string>(stored.currentAge ?? 30);
    const [retirementAge, setRetirementAge] = useState<number | string>(stored.retirementAge ?? 67);
    const [currentSavings, setCurrentSavings] = useState<number | string>(stored.currentSavings ?? 5000);
    const [monthlyContribution, setMonthlyContribution] = useState<number | string>(stored.monthlyContribution ?? 300);
    const [annualReturn, setAnnualReturn] = useState<number | string>(stored.annualReturn ?? 7);
    const [inflationRate, setInflationRate] = useState<number | string>(stored.inflationRate ?? 2.5);

    useEffect(() => {
        const payload: RetirementCalculatorStorage = {
            currentAge,
            retirementAge,
            currentSavings,
            monthlyContribution,
            annualReturn,
            inflationRate
        };

        try {
            localStorage.setItem(RETIREMENT_CALCULATOR_STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // Ignore localStorage failures.
        }
    }, [currentAge, retirementAge, currentSavings, monthlyContribution, annualReturn, inflationRate]);

    // Numeric versions
    const ageNum = Number(currentAge) || 0;
    const retAgeNum = Number(retirementAge) || 0;
    const savingsNum = Number(currentSavings) || 0;
    const contributionNum = Number(monthlyContribution) || 0;
    const returnNum = Number(annualReturn) || 0;
    const inflationNum = Number(inflationRate) || 0;
    const calculationError = validateCalculatorInputs([
        { label: 'Edad actual', value: currentAge, max: 120, integer: true },
        { label: 'Edad de jubilación', value: retirementAge, min: ageNum, max: 120, integer: true },
        { label: 'Ahorro actual', value: currentSavings },
        { label: 'Aportación mensual', value: monthlyContribution },
        { label: 'Rentabilidad', value: annualReturn, min: -99.99, max: 100 },
        { label: 'Inflación', value: inflationRate, min: -99, max: 100 },
    ]);

    // Derived values
    const yearsToRetire = Math.max(0, retAgeNum - ageNum);

    // Projection Data
    const projectionData = useMemo(() => {
        const data: Array<{ age: number; nominal: number; real: number }> = [];
        if (calculationError) return data;
        let balanceNominal = savingsNum;
        const monthlyRate = Math.pow(1 + returnNum / 100, 1 / 12) - 1;

        for (let year = 0; year <= yearsToRetire; year++) {
            // Adjust balance for inflation to show "Current Purchasing Power"
            const purchasingPower = balanceNominal / Math.pow(1 + inflationNum / 100, year);

            data.push({
                age: ageNum + year,
                nominal: Math.round(balanceNominal),
                real: Math.round(purchasingPower)
            });

            if (year < yearsToRetire) {
                for (let m = 0; m < 12; m++) {
                    balanceNominal = (balanceNominal + contributionNum) * (1 + monthlyRate);
                }
            }
        }
        return data;
    }, [ageNum, savingsNum, contributionNum, returnNum, inflationNum, yearsToRetire, calculationError]);

    const finalNominal = projectionData[projectionData.length - 1]?.nominal || 0;
    const finalReal = projectionData[projectionData.length - 1]?.real || 0;

    return (
        <div className="retirement">
            <AcademyPageHeader className="retirement__header" section="Herramientas">
                <div className="retirement__title-group">
                    <div className="retirement__icon-container">
                        <Calendar className="retirement__title-icon" />
                    </div>
                    <div>
                        <h1 className="retirement__title">Planificador de Jubilación</h1>
                        <p className="retirement__subtitle">¿Cuánto valdrán tus ahorros cuando te retires?</p>
                    </div>
                </div>
                <div className="retirement__summary-badge">
                    <span className="retirement__summary-label">Objetivo en {yearsToRetire} años</span>
                    <span className="retirement__summary-value">{calculationError ? 'N/D' : formatRetirementCurrency(finalNominal)}</span>
                </div>
            </AcademyPageHeader>

            <div className="retirement__grid">
                <aside className="retirement__inputs">
                    <CalculatorCard className="retirement__input-section">
                        <h3 className="retirement__section-header">Edades</h3>
                        <div className="retirement__input-grid retirement__input-grid--stacked">
                            <CalculatorField controlId="retirementcalculator-currentAge" label="Edad Actual" icon={<Calendar size={18} />} unit="años">
                                <input
                                    id="retirementcalculator-currentAge"
                                    type="number"
                                    value={currentAge}
                                    onChange={(e) => setCurrentAge(e.target.value === '' ? '' : Number(e.target.value))}
                                />
                            </CalculatorField>
                            <CalculatorField controlId="retirementcalculator-retirementAge" label="Edad Jubilación" icon={<Calendar size={18} />} unit="años">
                                <input
                                    id="retirementcalculator-retirementAge"
                                    type="number"
                                    value={retirementAge}
                                    onChange={(e) => setRetirementAge(e.target.value === '' ? '' : Number(e.target.value))}
                                />
                            </CalculatorField>
                        </div>
                    </CalculatorCard>

                    <CalculatorCard className="retirement__input-section">
                        <h3 className="retirement__section-header">Ahorro y Aportaciones</h3>
                        <CalculatorField controlId="retirementcalculator-currentSavings" label="Ahorro Actual" icon={<Wallet2 size={18} />} unit="€">
                            <input
                                id="retirementcalculator-currentSavings"
                                type="number"
                                value={currentSavings}
                                onChange={(e) => setCurrentSavings(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                        </CalculatorField>
                        <CalculatorField controlId="retirementcalculator-monthlyContribution" label="Aportación Mensual" icon={<TrendingUp size={18} />} unit="€">
                            <input
                                id="retirementcalculator-monthlyContribution"
                                type="number"
                                value={monthlyContribution}
                                onChange={(e) => setMonthlyContribution(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                        </CalculatorField>
                    </CalculatorCard>

                    <CalculatorCard className="retirement__input-section">
                        <h3 className="retirement__section-header">Mercado e Inflación</h3>
                        <div className="retirement__input-grid">
                            <CalculatorField controlId="retirementcalculator-annualReturn" label="Rentabilidad Anual" icon={<TrendingUp size={18} />} unit="%">
                                <input
                                    id="retirementcalculator-annualReturn"
                                    type="number"
                                    step="0.5"
                                    value={annualReturn}
                                    onChange={(e) => setAnnualReturn(e.target.value === '' ? '' : Number(e.target.value))}
                                />
                            </CalculatorField>
                            <CalculatorField controlId="retirementcalculator-inflationRate" label="Inflación Estimada" icon={<Info size={18} />} unit="%">
                                <input
                                    id="retirementcalculator-inflationRate"
                                    type="number"
                                    step="0.1"
                                    value={inflationRate}
                                    onChange={(e) => setInflationRate(e.target.value === '' ? '' : Number(e.target.value))}
                                />
                            </CalculatorField>
                        </div>
                    </CalculatorCard>

                    <CalculatorCard className="retirement__note">
                        <Info size={16} />
                        <p>La inflación reduce tu poder adquisitivo. 100.000€ en el futuro no comprarán lo mismo que hoy.</p>
                    </CalculatorCard>
                </aside>

                <main className="retirement__main">
                    {calculationError ? <p role="alert">{calculationError}</p> : <>
                    <div className="retirement__metrics">
                            <CalculatorResultCard layout="icon" className="retirement__metric-card"
                                label="Capital Nominal" value={<>{formatRetirementCurrency(finalNominal)}</>} description={<>La cifra que verás en tu cuenta</>} icon={<Wallet2 />}
                                slotClasses={{ label: 'retirement__metric-label', value: 'retirement__metric-value', description: 'retirement__metric-desc', content: 'retirement__metric-info', icon: 'retirement__metric-icon' }} />
                            <CalculatorResultCard layout="icon" className="retirement__metric-card retirement__metric-card--highlight" highlight
                                label="Poder Adquisitivo Real" value={<>{formatRetirementCurrency(finalReal)}</>} description={<>Equivalente a dinero de HOY</>} icon={<ShieldAlert />}
                                slotClasses={{ label: 'retirement__metric-label', value: 'retirement__metric-value', description: 'retirement__metric-desc', content: 'retirement__metric-info', icon: 'retirement__metric-icon' }} />
                    </div>

                    <CalculatorCard className="retirement__chart-box">
                        <h3 className="retirement__chart-title">Evolución del Patrimonio</h3>
                        <div className="retirement__chart-legend">
                            <span className="legend-item"><span className="dot nominal"></span> Valor Futuro</span>
                            <span className="legend-item"><span className="dot real"></span> Poder Adquisitivo</span>
                        </div>
                        <div className="retirement__chart-wrapper">
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-primary)" />
                                    <XAxis
                                        dataKey="age"
                                        stroke="var(--text-secondary)"
                                        tick={{ fontSize: 11, fill: '#a1a1aa' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="var(--text-secondary)"
                                        tick={{ fontSize: 11, fill: '#a1a1aa' }}
                                        tickFormatter={(value) =>
                                            new Intl.NumberFormat('es-ES', {
                                                notation: 'compact',
                                                compactDisplay: 'short'
                                            }).format(value)
                                        }
                                        width={50}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<RetirementTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="nominal"
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#colorNominal)"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        name="Valor Futuro"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="real"
                                        stroke="#8b5cf6"
                                        fillOpacity={1}
                                        fill="url(#colorReal)"
                                        strokeWidth={3}
                                        name="Poder de Compra Real"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CalculatorCard>

                    <CalculatorCard className="retirement__insight">
                        <BadgeInfo className="retirement__insight-icon" />
                        <div className="retirement__insight-content">
                            <h4>Proyección de Retirada</h4>
                            <p>
                                Con un capital de <strong>{formatRetirementCurrency(finalReal)}</strong> (ajustado), podrías retirar aproximadamente
                                <strong> {formatRetirementCurrency(finalReal * 0.04 / 12)}/mes</strong> como referencia inicial al aplicar el 4% anual. Es una simulación, no una garantía de duración del capital.
                            </p>
                        </div>
                    </CalculatorCard>
                    </>}
                    <ScenarioComparison current={calculationError ? null : {
                        parametersKey: JSON.stringify([ageNum, retAgeNum, savingsNum, contributionNum, returnNum, inflationNum]),
                        assumptions: [
                            { label: 'Edad actual / jubilación', value: `${ageNum} / ${retAgeNum} años` },
                            { label: 'Ahorro actual', value: formatRetirementCurrency(savingsNum) },
                            { label: 'Aportación mensual', value: formatRetirementCurrency(contributionNum) },
                            { label: 'Rentabilidad anual efectiva', value: `${returnNum}%` },
                            { label: 'Inflación anual', value: `${inflationNum}%` },
                        ],
                        results: [
                            { label: 'Horizonte', value: `${yearsToRetire} ${yearsToRetire === 1 ? 'año' : 'años'}` },
                            { label: 'Capital futuro (nominal)', value: formatRetirementCurrency(finalNominal) },
                            { label: 'Poder de compra en euros de hoy', value: formatRetirementCurrency(finalReal) },
                        ],
                    }} />
                </main>
            </div>
        </div>
    );
}
