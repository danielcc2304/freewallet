import { useEffect, useMemo, useState } from 'react';
import { Info, TrendingUp, Wallet, ShieldCheck, Flame, Banknote } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './FIRECalculator.css';

type ProjectionMode = 'nominal' | 'real';

interface FIRECalculatorStorage {
    monthlyExpenses: number | string;
    currentSavings: number | string;
    monthlySavings: number | string;
    annualReturn: number | string;
    inflationRate: number | string;
    withdrawalRate: number | string;
    includeInflation: boolean;
    projectionMode: ProjectionMode;
}

const FIRE_CALCULATOR_STORAGE_KEY = 'freewallet_fire_calculator';

export function FIRECalculator() {
    const [monthlyExpenses, setMonthlyExpenses] = useState<number | string>(2000);
    const [currentSavings, setCurrentSavings] = useState<number | string>(10000);
    const [monthlySavings, setMonthlySavings] = useState<number | string>(500);
    const [annualReturn, setAnnualReturn] = useState<number | string>(7);
    const [inflationRate, setInflationRate] = useState<number | string>(2.5);
    const [withdrawalRate, setWithdrawalRate] = useState<number | string>(4);
    const [includeInflation, setIncludeInflation] = useState(false);
    const [projectionMode, setProjectionMode] = useState<ProjectionMode>('real');

    useEffect(() => {
        try {
            const raw = localStorage.getItem(FIRE_CALCULATOR_STORAGE_KEY);
            if (!raw) return;

            const stored = JSON.parse(raw) as Partial<FIRECalculatorStorage>;
            if (stored.monthlyExpenses !== undefined) setMonthlyExpenses(stored.monthlyExpenses);
            if (stored.currentSavings !== undefined) setCurrentSavings(stored.currentSavings);
            if (stored.monthlySavings !== undefined) setMonthlySavings(stored.monthlySavings);
            if (stored.annualReturn !== undefined) setAnnualReturn(stored.annualReturn);
            if (stored.inflationRate !== undefined) setInflationRate(stored.inflationRate);
            if (stored.withdrawalRate !== undefined) setWithdrawalRate(stored.withdrawalRate);
            if (stored.includeInflation !== undefined) setIncludeInflation(stored.includeInflation);
            if (stored.projectionMode !== undefined) setProjectionMode(stored.projectionMode);
        } catch {
            // Ignore localStorage failures or malformed saved values.
        }
    }, []);

    useEffect(() => {
        const payload: FIRECalculatorStorage = {
            monthlyExpenses,
            currentSavings,
            monthlySavings,
            annualReturn,
            inflationRate,
            withdrawalRate,
            includeInflation,
            projectionMode
        };

        try {
            localStorage.setItem(FIRE_CALCULATOR_STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // Ignore localStorage failures.
        }
    }, [monthlyExpenses, currentSavings, monthlySavings, annualReturn, inflationRate, withdrawalRate, includeInflation, projectionMode]);

    const expensesNum = Number(monthlyExpenses) || 0;
    const savingsNum = Number(currentSavings) || 0;
    const monthlySavingsNum = Number(monthlySavings) || 0;
    const annualReturnNum = Number(annualReturn) || 0;
    const inflationRateNum = Number(inflationRate) || 0;
    const withdrawalRateNum = Number(withdrawalRate) || 0;

    const annualExpenses = expensesNum * 12;
    const fireNumber = withdrawalRateNum > 0 ? annualExpenses / (withdrawalRateNum / 100) : 0;
    const leanFireNumber = fireNumber * 0.8;
    const fatFireNumber = fireNumber * 1.5;

    const nominalAnnualFactor = 1 + annualReturnNum / 100;
    const inflationAnnualFactor = 1 + inflationRateNum / 100;
    const nominalMonthlyRate = Math.pow(Math.max(nominalAnnualFactor, 0), 1 / 12) - 1;
    const shouldAdjustForInflation = includeInflation && inflationRateNum > 0;
    const realAnnualReturn = inflationAnnualFactor > 0
        ? ((nominalAnnualFactor / inflationAnnualFactor) - 1) * 100
        : annualReturnNum;

    const projectionDescriptor = shouldAdjustForInflation
        ? (projectionMode === 'real' ? 'euros de hoy' : 'euros ajustados por inflación')
        : 'euros actuales sin ajuste por inflación';

    const calculateYearsToFire = (adjustForInflation: boolean) => {
        if (fireNumber <= 0) return 0;

        let nominalBalance = savingsNum;
        for (let month = 0; month <= 1200; month++) {
            const elapsedYears = month / 12;
            const inflationFactorForElapsedTime = adjustForInflation
                ? Math.pow(inflationAnnualFactor, elapsedYears)
                : 1;
            const nominalTarget = fireNumber * inflationFactorForElapsedTime;
            const meetsTarget = nominalBalance >= nominalTarget;

            if (meetsTarget) {
                return elapsedYears;
            }

            nominalBalance = (nominalBalance + monthlySavingsNum) * (1 + nominalMonthlyRate);
        }

        return Infinity;
    };

    const yearsToFIREWithoutInflation = useMemo(
        () => calculateYearsToFire(false),
        [fireNumber, inflationAnnualFactor, monthlySavingsNum, nominalMonthlyRate, savingsNum]
    );

    const yearsToFIREWithInflation = useMemo(
        () => calculateYearsToFire(true),
        [fireNumber, inflationAnnualFactor, monthlySavingsNum, nominalMonthlyRate, savingsNum]
    );

    const yearsToFIRE = shouldAdjustForInflation ? yearsToFIREWithInflation : yearsToFIREWithoutInflation;

    const projectionMaxYear = useMemo(() => {
        if (!Number.isFinite(yearsToFIRE)) {
            return 40;
        }

        const paddedYears = yearsToFIRE <= 5
            ? yearsToFIRE + 5
            : yearsToFIRE + 7;

        return Math.max(10, Math.min(60, Math.ceil(paddedYears / 5) * 5));
    }, [yearsToFIRE]);

    const metricTargetYears = Number.isFinite(yearsToFIRE) ? yearsToFIRE : projectionMaxYear;
    const metricInflationFactor = shouldAdjustForInflation && projectionMode === 'nominal'
        ? Math.pow(inflationAnnualFactor, metricTargetYears)
        : 1;
    const displayedFireNumber = fireNumber * metricInflationFactor;
    const displayedLeanFireNumber = leanFireNumber * metricInflationFactor;
    const displayedFatFireNumber = fatFireNumber * metricInflationFactor;
    const metricDescriptor = shouldAdjustForInflation && projectionMode === 'nominal'
        ? `Objetivo ajustado al año ${metricTargetYears.toFixed(1)}`
        : 'Objetivo base en euros de hoy';

    const projectionData = useMemo(() => {
        const data = [];
        let nominalBalance = savingsNum;

        for (let year = 0; year <= projectionMaxYear; year++) {
            const inflationFactorForYear = shouldAdjustForInflation ? Math.pow(inflationAnnualFactor, year) : 1;
            const realBalance = inflationFactorForYear > 0
                ? nominalBalance / inflationFactorForYear
                : nominalBalance;
            const nominalFireTarget = fireNumber * inflationFactorForYear;

            data.push({
                year,
                balance: Math.round(shouldAdjustForInflation && projectionMode === 'real' ? realBalance : nominalBalance),
                fireNumber: Math.round(shouldAdjustForInflation && projectionMode === 'real' ? fireNumber : nominalFireTarget),
                leanFire: Math.round(shouldAdjustForInflation && projectionMode === 'real' ? leanFireNumber : leanFireNumber * inflationFactorForYear),
                fatFire: Math.round(shouldAdjustForInflation && projectionMode === 'real' ? fatFireNumber : fatFireNumber * inflationFactorForYear)
            });

            for (let month = 0; month < 12; month++) {
                nominalBalance = (nominalBalance + monthlySavingsNum) * (1 + nominalMonthlyRate);
            }
        }

        return data;
    }, [
        fatFireNumber,
        fireNumber,
        inflationAnnualFactor,
        leanFireNumber,
        monthlySavingsNum,
        nominalMonthlyRate,
        projectionMaxYear,
        projectionMode,
        savingsNum,
        shouldAdjustForInflation
    ]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const simulationSummary = useMemo(() => {
        const yearsLabel = yearsToFIRE < 100 ? `${yearsToFIRE.toFixed(1)} años` : 'más de 100 años';
        const yearsWithoutInflationLabel = yearsToFIREWithoutInflation < 100 ? `${yearsToFIREWithoutInflation.toFixed(1)} años` : 'más de 100 años';
        const yearsWithInflationLabel = yearsToFIREWithInflation < 100 ? `${yearsToFIREWithInflation.toFixed(1)} años` : 'más de 100 años';

        if (!shouldAdjustForInflation) {
            return `Si quieres vivir con ${formatCurrency(expensesNum)} al mes (${formatCurrency(annualExpenses)} al año) y aplicas una tasa de retirada del ${withdrawalRateNum.toFixed(1)}%, tu objetivo FIRE es ${formatCurrency(displayedFireNumber)}. Partiendo de ${formatCurrency(savingsNum)} y aportando ${formatCurrency(monthlySavingsNum)} al mes con una rentabilidad anual estimada del ${annualReturnNum.toFixed(1)}%, necesitarías ${yearsLabel}.`;
        }

        return `Si quieres vivir con ${formatCurrency(expensesNum)} al mes (${formatCurrency(annualExpenses)} al año) y aplicas una tasa de retirada del ${withdrawalRateNum.toFixed(1)}%, el objetivo mostrado en ${projectionDescriptor} es ${formatCurrency(displayedFireNumber)}. Partiendo de ${formatCurrency(savingsNum)} y aportando ${formatCurrency(monthlySavingsNum)} al mes con una rentabilidad nominal estimada del ${annualReturnNum.toFixed(1)}% y una inflación del ${inflationRateNum.toFixed(1)}%, necesitarías ${yearsLabel}. Como referencia, el mismo escenario serían ${yearsWithoutInflationLabel} sin inflación y ${yearsWithInflationLabel} ajustando inflación.`;
    }, [
        annualExpenses,
        annualReturnNum,
        displayedFireNumber,
        expensesNum,
        inflationRateNum,
        monthlySavingsNum,
        projectionDescriptor,
        savingsNum,
        shouldAdjustForInflation,
        withdrawalRateNum,
        yearsToFIRE,
        yearsToFIREWithInflation,
        yearsToFIREWithoutInflation
    ]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="fire-tooltip">
                    <p className="fire-tooltip__label">Año {label}</p>
                    <p className="fire-tooltip__value balance">
                        Patrimonio {shouldAdjustForInflation && projectionMode === 'real' ? 'en euros de hoy' : 'ajustado por inflación'}: {formatCurrency(payload[0].value)}
                    </p>
                    <p className="fire-tooltip__value target">
                        Objetivo FIRE {shouldAdjustForInflation && projectionMode === 'real' ? 'en euros de hoy' : 'ajustado por inflación'}: {formatCurrency(payload[1].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fire">
            <header className="fire__header">
                <div className="fire__title-group">
                    <Flame className="fire__title-icon" />
                    <div>
                        <h1 className="fire__title">Calculadora FIRE</h1>
                        <p className="fire__subtitle">Independencia Financiera, Jubilación Temprana</p>
                    </div>
                </div>
                <div className="fire__years-badge">
                    <span className="fire__years-value">{yearsToFIRE < 100 ? yearsToFIRE.toFixed(1) : '∞'}</span>
                    <span className="fire__years-label">Años para FIRE</span>
                    {includeInflation && (
                        <div className="fire__years-compare">
                            <span>Sin inflación: {yearsToFIREWithoutInflation < 100 ? `${yearsToFIREWithoutInflation.toFixed(1)}` : '∞'}</span>
                            <span>Con inflación: {yearsToFIREWithInflation < 100 ? `${yearsToFIREWithInflation.toFixed(1)}` : '∞'}</span>
                        </div>
                    )}
                </div>
            </header>

            <div className="fire__grid">
                <section className="fire__inputs">
                    <h2 className="fire__section-title">Parámetros de Simulación</h2>

                    <div className="calc__input-group">
                        <label>Gastos Mensuales</label>
                        <div className="calc__input-wrapper">
                            <Wallet size={18} />
                            <input
                                type="number"
                                value={monthlyExpenses}
                                onChange={(e) => setMonthlyExpenses(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                            <span className="unit">€</span>
                        </div>
                        <input
                            type="range"
                            min="500"
                            max="10000"
                            step="100"
                            value={expensesNum}
                            onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                            className="custom-slider"
                            style={{ '--progress': `${((expensesNum - 500) / (10000 - 500)) * 100}%` } as any}
                        />
                    </div>

                    <div className="calc__input-group">
                        <label>Ahorro Mensual</label>
                        <div className="calc__input-wrapper">
                            <Banknote size={18} />
                            <input
                                type="number"
                                value={monthlySavings}
                                onChange={(e) => setMonthlySavings(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                            <span className="unit">€</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="10000"
                            step="100"
                            value={monthlySavingsNum}
                            onChange={(e) => setMonthlySavings(Number(e.target.value))}
                            className="custom-slider"
                            style={{ '--progress': `${(monthlySavingsNum / 10000) * 100}%` } as any}
                        />
                    </div>

                    <div className="calc__input-group">
                        <label>Capital Actual</label>
                        <div className="calc__input-wrapper">
                            <Banknote size={18} />
                            <input
                                type="number"
                                value={currentSavings}
                                onChange={(e) => setCurrentSavings(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                            <span className="unit">€</span>
                        </div>
                    </div>

                    <div className="fire__input-grid">
                        <div className="calc__input-group">
                            <label>Rentab. Anual</label>
                            <div className="calc__input-wrapper">
                                <TrendingUp size={18} />
                                <input
                                    type="number"
                                    value={annualReturn}
                                    onChange={(e) => setAnnualReturn(e.target.value === '' ? '' : Number(e.target.value))}
                                />
                                <span className="unit">%</span>
                            </div>
                        </div>
                        <div className="calc__input-group">
                            <label>Tasa Retirada</label>
                            <div className="calc__input-wrapper">
                                <Info size={18} />
                                <input
                                    type="number"
                                    value={withdrawalRate}
                                    onChange={(e) => setWithdrawalRate(e.target.value === '' ? '' : Number(e.target.value))}
                                />
                                <span className="unit">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="fire__optional-card">
                        <label className="fire__optional-toggle">
                            <input
                                type="checkbox"
                                checked={includeInflation}
                                onChange={(e) => setIncludeInflation(e.target.checked)}
                            />
                            <span className="fire__optional-copy">
                                <strong>Ajustar por inflación</strong>
                                <small>Activa la proyección en euros de hoy o con objetivo ajustado por inflación.</small>
                            </span>
                        </label>

                        {includeInflation && (
                            <div className="fire__optional-content">
                                <div className="calc__input-group">
                                    <label>Inflación Anual</label>
                                    <div className="calc__input-wrapper">
                                        <Info size={18} />
                                        <input
                                            type="number"
                                            value={inflationRate}
                                            onChange={(e) => setInflationRate(e.target.value === '' ? '' : Number(e.target.value))}
                                        />
                                        <span className="unit">%</span>
                                    </div>
                                    <small className="fire__input-hint">
                                        Rentabilidad real estimada: {realAnnualReturn.toFixed(2)}% anual.
                                    </small>
                                </div>

                                <div className="calc__input-group fire__optional-group">
                                    <label>Modo de Proyección</label>
                                    <div className="fire__projection-toggle">
                                        <button
                                            type="button"
                                            className={`fire__projection-btn ${projectionMode === 'nominal' ? 'fire__projection-btn--active' : ''}`}
                                            onClick={() => setProjectionMode('nominal')}
                                        >
                                            Ajustado
                                            <span>Por inflación</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`fire__projection-btn ${projectionMode === 'real' ? 'fire__projection-btn--active' : ''}`}
                                            onClick={() => setProjectionMode('real')}
                                        >
                                            Euros de hoy
                                            <span>Valor constante</span>
                                        </button>
                                    </div>
                                    <small className="fire__input-hint">
                                        Euros de hoy = valor constante actual. Ajustado por inflación = capital futuro necesario para mantener ese nivel de gasto.
                                    </small>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="fire__info-card">
                        <Info size={16} />
                        <p>La <strong>Regla del 4%</strong> sugiere que puedes retirar el 4% de tu capital anualmente ajustado por inflación durante 30 años sin agotar tus fondos.</p>
                    </div>
                </section>

                <main className="fire__results">
                    <div className="fire__metrics">
                        <div className="fire__metric-card fire__metric-card--lean">
                            <span className="fire__metric-label">Lean FIRE (80%)</span>
                            <span className="fire__metric-value">{formatCurrency(displayedLeanFireNumber)}</span>
                            <p className="fire__metric-desc">{metricDescriptor}</p>
                        </div>
                        <div className="fire__metric-card fire__metric-card--main">
                            <span className="fire__metric-label">Tu Número FIRE</span>
                            <span className="fire__metric-value">{formatCurrency(displayedFireNumber)}</span>
                            <p className="fire__metric-desc">{metricDescriptor}</p>
                        </div>
                        <div className="fire__metric-card fire__metric-card--fat">
                            <span className="fire__metric-label">Fat FIRE (150%)</span>
                            <span className="fire__metric-value">{formatCurrency(displayedFatFireNumber)}</span>
                            <p className="fire__metric-desc">{metricDescriptor}</p>
                        </div>
                    </div>

                    <div className="fire__chart-container">
                        <div className="fire__chart-header">
                            <h3 className="fire__chart-title">Proyección de Patrimonio vs Objetivo</h3>
                            <span className="fire__chart-badge">{projectionDescriptor}</span>
                        </div>
                        <div className="fire__chart-canvas">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-primary)" />
                                    <XAxis
                                        dataKey="year"
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
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="balance"
                                        stroke="var(--accent-primary)"
                                        fillOpacity={1}
                                        fill="url(#colorBalance)"
                                        strokeWidth={3}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="fireNumber"
                                        stroke="#ffc107"
                                        strokeDasharray="5 5"
                                        fill="none"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="fire__scenario-card">
                        <h3 className="fire__scenario-title">Lectura de la simulación</h3>
                        <p className="fire__scenario-text">{simulationSummary}</p>
                    </div>
                </main>
            </div>

            <section className="fire__theory">
                <h2 className="fire__section-title">Entendiendo el camino al FIRE</h2>
                <div className="fire__theory-grid">
                    <div className="fire__theory-card">
                        <Wallet className="fire__theory-icon" />
                        <h3>La Regla de los 25</h3>
                        <p>Tu número FIRE es multiplicar tus gastos anuales por 25. Eso equivale a retirar aproximadamente un 4% anual.</p>
                    </div>
                    <div className="fire__theory-card">
                        <TrendingUp className="fire__theory-icon" />
                        <h3>La Tasa de Ahorro</h3>
                        <p>Es el factor más determinante. Cuanto mayor sea el porcentaje que ahorras sobre tus ingresos netos, más rápido alcanzarás la libertad.</p>
                    </div>
                    <div className="fire__theory-card">
                        <ShieldCheck className="fire__theory-icon" />
                        <h3>Fase de Retirada</h3>
                        <p>Al llegar a FIRE, el rendimiento de tus inversiones debería cubrir tus gastos, permitiéndote decidir si quieres seguir trabajando.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
