import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Calendar, Target, ChevronDown, ChevronUp } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import './CompoundInterestCalc.css';

type CalculationMode = 'normal' | 'timeToGoal' | 'requiredContribution';

interface ChartDataPoint {
    year: number;
    contributed: number;
    interest: number;
    total: number;
    yearLabel: string;
}

export function CompoundInterestCalc() {
    // Basic inputs
    const [initialCapital, setInitialCapital] = useState<number>(10000);
    const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
    const [annualRate, setAnnualRate] = useState<number>(7);
    const [years, setYears] = useState<number>(20);

    // Advanced options
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [withdrawalType, setWithdrawalType] = useState<'none' | 'percentage' | 'fixed'>('none');
    const [withdrawalValue, setWithdrawalValue] = useState<number>(0);

    // Calculation mode
    const [calculationMode, setCalculationMode] = useState<CalculationMode>('normal');
    const [targetAmount, setTargetAmount] = useState<number>(500000);

    const calculateCompoundInterest = (
        initial: number,
        monthly: number,
        rate: number,
        periods: number,
        withdrawalT: 'none' | 'percentage' | 'fixed',
        withdrawalV: number
    ) => {
        const monthlyRate = rate / 100 / 12;
        const data: ChartDataPoint[] = [];

        let totalContributed = initial;
        let totalInterest = 0;
        let currentValue = initial;

        for (let year = 0; year <= periods; year++) {
            if (year > 0) {
                // Calculate for each month in the year
                for (let month = 1; month <= 12; month++) {
                    // Add monthly contribution
                    currentValue += monthly;
                    totalContributed += monthly;

                    // Apply interest
                    const interestEarned = currentValue * monthlyRate;
                    currentValue += interestEarned;
                    totalInterest += interestEarned;

                    // Apply withdrawal if configured (at year end)
                    if (month === 12 && withdrawalT !== 'none') {
                        let withdrawalAmount = 0;
                        if (withdrawalT === 'percentage') {
                            withdrawalAmount = currentValue * (withdrawalV / 100);
                        } else if (withdrawalT === 'fixed') {
                            withdrawalAmount = withdrawalV;
                        }
                        currentValue -= withdrawalAmount;
                        totalInterest -= withdrawalAmount; // Adjust interest tracking
                    }
                }
            }

            data.push({
                year,
                contributed: totalContributed,
                interest: totalInterest,
                total: currentValue,
                yearLabel: `Año ${year}`
            });
        }

        return data;
    };

    const calculateTimeToGoal = (
        initial: number,
        monthly: number,
        rate: number,
        goal: number
    ): number => {
        const monthlyRate = rate / 100 / 12;
        let currentValue = initial;
        let months = 0;
        const maxMonths = 100 * 12; // Safety limit: 100 years

        while (currentValue < goal && months < maxMonths) {
            currentValue += monthly;
            currentValue *= (1 + monthlyRate);
            months++;
        }

        return months / 12; // Convert to years
    };

    const calculateRequiredMonthly = (
        initial: number,
        rate: number,
        years: number,
        goal: number
    ): number => {
        const monthlyRate = rate / 100 / 12;
        const totalMonths = years * 12;

        // Formula: FV = PV(1+r)^n + PMT * [((1+r)^n - 1) / r]
        // Solving for PMT: PMT = (FV - PV(1+r)^n) / [((1+r)^n - 1) / r]

        const futureValueOfInitial = initial * Math.pow(1 + monthlyRate, totalMonths);
        const numerator = goal - futureValueOfInitial;
        const denominator = (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate;

        return numerator / denominator;
    };

    const chartData = useMemo(() => {
        if (calculationMode === 'normal') {
            return calculateCompoundInterest(
                initialCapital,
                monthlyContribution,
                annualRate,
                years,
                withdrawalType,
                withdrawalValue
            );
        } else if (calculationMode === 'timeToGoal') {
            const yearsToGoal = Math.ceil(calculateTimeToGoal(
                initialCapital,
                monthlyContribution,
                annualRate,
                targetAmount
            ));
            return calculateCompoundInterest(
                initialCapital,
                monthlyContribution,
                annualRate,
                yearsToGoal,
                'none',
                0
            );
        } else {
            const requiredMonthly = calculateRequiredMonthly(
                initialCapital,
                annualRate,
                years,
                targetAmount
            );
            return calculateCompoundInterest(
                initialCapital,
                requiredMonthly,
                annualRate,
                years,
                'none',
                0
            );
        }
    }, [initialCapital, monthlyContribution, annualRate, years, withdrawalType, withdrawalValue, calculationMode, targetAmount]);

    const finalData = chartData[chartData.length - 1];
    const timeToGoalYears = calculationMode === 'timeToGoal'
        ? calculateTimeToGoal(initialCapital, monthlyContribution, annualRate, targetAmount)
        : null;
    const requiredMonthlyAmount = calculationMode === 'requiredContribution'
        ? calculateRequiredMonthly(initialCapital, annualRate, years, targetAmount)
        : null;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="compound">
            <header className="compound__header">
                <h1 className="compound__title">Calculadora de Interés Compuesto</h1>
                <p className="compound__description">
                    Visualiza el poder del interés compuesto. Tu capital trabajando para ti a lo largo del tiempo.
                </p>
            </header>

            {/* Calculation Mode Selector */}
            <div className="compound__mode-selector">
                <button
                    className={`compound__mode-btn ${calculationMode === 'normal' ? 'compound__mode-btn--active' : ''}`}
                    onClick={() => setCalculationMode('normal')}
                >
                    <TrendingUp size={20} />
                    Calcular Capital Final
                </button>
                <button
                    className={`compound__mode-btn ${calculationMode === 'timeToGoal' ? 'compound__mode-btn--active' : ''}`}
                    onClick={() => setCalculationMode('timeToGoal')}
                >
                    <Calendar size={20} />
                    Tiempo para Objetivo
                </button>
                <button
                    className={`compound__mode-btn ${calculationMode === 'requiredContribution' ? 'compound__mode-btn--active' : ''}`}
                    onClick={() => setCalculationMode('requiredContribution')}
                >
                    <Target size={20} />
                    Aportación Necesaria
                </button>
            </div>

            <div className="compound__container">
                {/* Inputs Section */}
                <div className="compound__inputs">
                    <h3>Parámetros</h3>

                    <div className="compound__input-group">
                        <label htmlFor="initial">Patrimonio Inicial</label>
                        <div className="compound__input-wrapper">
                            <DollarSign size={18} />
                            <input
                                id="initial"
                                type="number"
                                value={initialCapital}
                                onChange={(e) => setInitialCapital(Number(e.target.value))}
                                min="0"
                                step="1000"
                            />
                            <span>€</span>
                        </div>
                    </div>

                    {calculationMode !== 'requiredContribution' && (
                        <div className="compound__input-group">
                            <label htmlFor="monthly">Aportación Mensual</label>
                            <div className="compound__input-wrapper">
                                <DollarSign size={18} />
                                <input
                                    id="monthly"
                                    type="number"
                                    value={monthlyContribution}
                                    onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                                    min="0"
                                    step="50"
                                />
                                <span>€/mes</span>
                            </div>
                        </div>
                    )}

                    <div className="compound__input-group">
                        <label htmlFor="rate">Rentabilidad Anual</label>
                        <div className="compound__input-wrapper">
                            <TrendingUp size={18} />
                            <input
                                id="rate"
                                type="number"
                                value={annualRate}
                                onChange={(e) => setAnnualRate(Number(e.target.value))}
                                min="0"
                                max="30"
                                step="0.5"
                            />
                            <span>%</span>
                        </div>
                        <small className="compound__input-hint">
                            Histórico S&P 500: ~10% anual. Conservador: 5-7%
                        </small>
                    </div>

                    {calculationMode !== 'timeToGoal' && (
                        <div className="compound__input-group">
                            <label htmlFor="years">Horizonte Temporal</label>
                            <div className="compound__input-wrapper">
                                <Calendar size={18} />
                                <input
                                    id="years"
                                    type="number"
                                    value={years}
                                    onChange={(e) => setYears(Number(e.target.value))}
                                    min="1"
                                    max="50"
                                    step="1"
                                />
                                <span>años</span>
                            </div>
                            <input
                                type="range"
                                value={years}
                                onChange={(e) => setYears(Number(e.target.value))}
                                min="1"
                                max="50"
                                className="compound__slider"
                            />
                        </div>
                    )}

                    {(calculationMode === 'timeToGoal' || calculationMode === 'requiredContribution') && (
                        <div className="compound__input-group">
                            <label htmlFor="target">Objetivo de Capital</label>
                            <div className="compound__input-wrapper">
                                <Target size={18} />
                                <input
                                    id="target"
                                    type="number"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                                    min="1000"
                                    step="10000"
                                />
                                <span>€</span>
                            </div>
                        </div>
                    )}

                    {/* Advanced Options */}
                    {calculationMode === 'normal' && (
                        <div className="compound__advanced">
                            <button
                                className="compound__advanced-toggle"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                            >
                                <span>Opciones Avanzadas</span>
                                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {showAdvanced && (
                                <div className="compound__advanced-content">
                                    <div className="compound__input-group">
                                        <label>Retiradas Anuales</label>
                                        <div className="compound__radio-group">
                                            <label className="compound__radio">
                                                <input
                                                    type="radio"
                                                    name="withdrawal"
                                                    checked={withdrawalType === 'none'}
                                                    onChange={() => setWithdrawalType('none')}
                                                />
                                                Sin retiradas
                                            </label>
                                            <label className="compound__radio">
                                                <input
                                                    type="radio"
                                                    name="withdrawal"
                                                    checked={withdrawalType === 'percentage'}
                                                    onChange={() => setWithdrawalType('percentage')}
                                                />
                                                % del capital
                                            </label>
                                            <label className="compound__radio">
                                                <input
                                                    type="radio"
                                                    name="withdrawal"
                                                    checked={withdrawalType === 'fixed'}
                                                    onChange={() => setWithdrawalType('fixed')}
                                                />
                                                Cantidad fija
                                            </label>
                                        </div>
                                    </div>

                                    {withdrawalType !== 'none' && (
                                        <div className="compound__input-group">
                                            <label htmlFor="withdrawal">
                                                {withdrawalType === 'percentage' ? 'Porcentaje anual' : 'Cantidad anual'}
                                            </label>
                                            <div className="compound__input-wrapper">
                                                <DollarSign size={18} />
                                                <input
                                                    id="withdrawal"
                                                    type="number"
                                                    value={withdrawalValue}
                                                    onChange={(e) => setWithdrawalValue(Number(e.target.value))}
                                                    min="0"
                                                    step={withdrawalType === 'percentage' ? '0.5' : '1000'}
                                                />
                                                <span>{withdrawalType === 'percentage' ? '%' : '€'}</span>
                                            </div>
                                            {withdrawalType === 'percentage' && (
                                                <small className="compound__input-hint">
                                                    Regla del 4%: retirada sostenible para jubilación
                                                </small>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Results Section */}
                <div className="compound__results">
                    {calculationMode === 'normal' && (
                        <>
                            <div className="compound__result-cards">
                                <div className="compound__result-card compound__result-card--contributed">
                                    <div className="compound__result-label">Capital Aportado</div>
                                    <div className="compound__result-value">{formatCurrency(finalData.contributed)}</div>
                                </div>
                                <div className="compound__result-card compound__result-card--interest">
                                    <div className="compound__result-label">Intereses Generados</div>
                                    <div className="compound__result-value">{formatCurrency(finalData.interest)}</div>
                                    <div className="compound__result-subtext">
                                        {((finalData.interest / finalData.contributed) * 100).toFixed(1)}% sobre lo aportado
                                    </div>
                                </div>
                                <div className="compound__result-card compound__result-card--total">
                                    <div className="compound__result-label">Capital Final</div>
                                    <div className="compound__result-value">{formatCurrency(finalData.total)}</div>
                                </div>
                            </div>
                        </>
                    )}

                    {calculationMode === 'timeToGoal' && timeToGoalYears !== null && (
                        <div className="compound__goal-result">
                            <div className="compound__goal-icon">🎯</div>
                            <div className="compound__goal-content">
                                <h3>Alcanzarás {formatCurrency(targetAmount)} en:</h3>
                                <div className="compound__goal-years">
                                    {timeToGoalYears.toFixed(1)} años
                                </div>
                                <p className="compound__goal-details">
                                    Con {formatCurrency(initialCapital)} iniciales + {formatCurrency(monthlyContribution)}/mes al {annualRate}% anual
                                </p>
                            </div>
                        </div>
                    )}

                    {calculationMode === 'requiredContribution' && requiredMonthlyAmount !== null && (
                        <div className="compound__goal-result">
                            <div className="compound__goal-icon">💼</div>
                            <div className="compound__goal-content">
                                <h3>Necesitas aportar mensualmente:</h3>
                                <div className="compound__goal-years">
                                    {formatCurrency(requiredMonthlyAmount)}
                                </div>
                                <p className="compound__goal-details">
                                    Para alcanzar {formatCurrency(targetAmount)} en {years} años al {annualRate}% (desde {formatCurrency(initialCapital)})
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Chart */}
                    <div className="compound__chart">
                        <h4>Evolución Temporal</h4>
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis
                                    dataKey="yearLabel"
                                    stroke="var(--text-secondary)"
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    stroke="var(--text-secondary)"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="contributed"
                                    stackId="1"
                                    stroke="#3b82f6"
                                    fill="#3b82f6"
                                    fillOpacity={0.6}
                                    name="Capital Aportado"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="interest"
                                    stackId="1"
                                    stroke="#10b981"
                                    fill="#10b981"
                                    fillOpacity={0.6}
                                    name="Intereses Generados"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Breakdown Chart */}
                    <div className="compound__breakdown">
                        <div className="compound__breakdown-item">
                            <div className="compound__breakdown-bar" style={{
                                width: `${(finalData.contributed / finalData.total) * 100}%`,
                                background: '#3b82f6'
                            }}>
                                <span>{((finalData.contributed / finalData.total) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="compound__breakdown-label">Tu dinero</div>
                        </div>
                        <div className="compound__breakdown-item">
                            <div className="compound__breakdown-bar" style={{
                                width: `${(finalData.interest / finalData.total) * 100}%`,
                                background: '#10b981'
                            }}>
                                <span>{((finalData.interest / finalData.total) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="compound__breakdown-label">Magia del compuesto</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="compound__disclaimer">
                ⚠️ Esta calculadora es solo educativa. Los resultados asumen rentabilidad constante, lo cual es irreal.
                Los mercados fluctúan. Consulta un asesor antes de tomar decisiones de inversión.
            </div>
        </div>
    );
}
