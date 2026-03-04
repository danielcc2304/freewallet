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
    const [initialCapital, setInitialCapital] = useState<number | string>(10000);
    const [monthlyContribution, setMonthlyContribution] = useState<number | string>(500);
    const [annualRate, setAnnualRate] = useState<number | string>(7);
    const [years, setYears] = useState<number | string>(20);

    // Advanced options
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [withdrawalType, setWithdrawalType] = useState<'none' | 'percentage' | 'fixed'>('none');
    const [withdrawalValue, setWithdrawalValue] = useState<number | string>(0);

    // Calculation mode
    const [calculationMode, setCalculationMode] = useState<CalculationMode>('normal');
    const [targetAmount, setTargetAmount] = useState<number | string>(500000);

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
        const initial = Number(initialCapital) || 0;
        const monthly = Number(monthlyContribution) || 0;
        const rate = Number(annualRate) || 0;
        const periods = Number(years) || 0;
        const target = Number(targetAmount) || 0;
        const wValue = Number(withdrawalValue) || 0;

        if (calculationMode === 'normal') {
            return calculateCompoundInterest(
                initial,
                monthly,
                rate,
                periods,
                withdrawalType,
                wValue
            );
        } else if (calculationMode === 'timeToGoal') {
            const yearsToGoal = Math.ceil(calculateTimeToGoal(
                initial,
                monthly,
                rate,
                target
            ));
            return calculateCompoundInterest(
                initial,
                monthly,
                rate,
                yearsToGoal || 1,
                'none',
                0
            );
        } else { // calculationMode === 'requiredContribution'
            const requiredMonthly = calculateRequiredMonthly(
                initial,
                rate,
                periods,
                target
            );
            return calculateCompoundInterest(
                initial,
                requiredMonthly,
                rate,
                periods,
                'none',
                0
            );
        }
    }, [initialCapital, monthlyContribution, annualRate, years, withdrawalType, withdrawalValue, calculationMode, targetAmount]);

    const finalData = chartData[chartData.length - 1];

    const timeToGoalYears = useMemo(() => {
        if (calculationMode !== 'timeToGoal') return null;
        const initial = Number(initialCapital) || 0;
        const monthly = Number(monthlyContribution) || 0;
        const rate = Number(annualRate) || 0;
        const target = Number(targetAmount) || 0;
        return calculateTimeToGoal(initial, monthly, rate, target);
    }, [calculationMode, initialCapital, monthlyContribution, annualRate, targetAmount]);

    const requiredMonthlyAmount = useMemo(() => {
        if (calculationMode !== 'requiredContribution') return null;
        const initial = Number(initialCapital) || 0;
        const rate = Number(annualRate) || 0;
        const periods = Number(years) || 0;
        const target = Number(targetAmount) || 0;
        return calculateRequiredMonthly(initial, rate, periods, target);
    }, [calculationMode, initialCapital, annualRate, years, targetAmount]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

    // Custom Tooltip Component
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {data.yearLabel}
                    </p>
                    <p style={{ margin: '4px 0', color: '#3b82f6', fontSize: '0.9rem' }}>
                        Capital Aportado: {formatCurrency(data.contributed)}
                    </p>
                    <p style={{ margin: '4px 0', color: '#10b981', fontSize: '0.9rem' }}>
                        Intereses: {formatCurrency(data.interest)}
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                        Total: {formatCurrency(data.total)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="compound">
            <header className="compound__header">
                <div className="compound__title-group">
                    <TrendingUp className="compound__title-icon" size={32} />
                    <div className="compound__title-content">
                        <h1 className="compound__title">Calculadora de Interés Compuesto</h1>
                        <p className="compound__description">
                            Visualiza el poder del interés compuesto. Tu capital trabajando para ti a lo largo del tiempo.
                        </p>
                    </div>
                </div>
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

                    <div className="calc__input-group">
                        <label htmlFor="initial">Patrimonio Inicial</label>
                        <div className="calc__input-wrapper">
                            <DollarSign size={18} />
                            <input
                                id="initial"
                                type="number"
                                value={initialCapital}
                                onChange={(e) => setInitialCapital(e.target.value === '' ? '' : Number(e.target.value))}
                                min="0"
                                step="1000"
                            />
                            <span className="unit">€</span>
                        </div>
                    </div>

                    {calculationMode !== 'requiredContribution' && (
                        <div className="calc__input-group">
                            <label htmlFor="monthly">Aportación Mensual</label>
                            <div className="calc__input-wrapper">
                                <DollarSign size={18} />
                                <input
                                    id="monthly"
                                    type="number"
                                    value={monthlyContribution}
                                    onChange={(e) => setMonthlyContribution(e.target.value === '' ? '' : Number(e.target.value))}
                                    min="0"
                                    step="50"
                                />
                                <span className="unit">€/mes</span>
                            </div>
                        </div>
                    )}

                    <div className="calc__input-group">
                        <label htmlFor="rate">Rentabilidad Anual</label>
                        <div className="calc__input-wrapper">
                            <TrendingUp size={18} />
                            <input
                                id="rate"
                                type="number"
                                value={annualRate}
                                onChange={(e) => setAnnualRate(e.target.value === '' ? '' : Number(e.target.value))}
                                min="0"
                                max="30"
                                step="0.5"
                            />
                            <span className="unit">%</span>
                        </div>
                        <small className="compound__input-hint">
                            Histórico S&P 500: ~10% anual.
                        </small>
                    </div>

                    {calculationMode !== 'timeToGoal' && (
                        <div className="calc__input-group">
                            <label htmlFor="years">Horizonte Temporal</label>
                            <div className="calc__input-wrapper">
                                <Calendar size={18} />
                                <input
                                    id="years"
                                    type="number"
                                    value={years}
                                    onChange={(e) => setYears(e.target.value === '' ? '' : Number(e.target.value))}
                                    min="1"
                                    max="50"
                                    step="1"
                                />
                                <span className="unit">años</span>
                            </div>
                            <input
                                type="range"
                                value={Number(years) || 1}
                                onChange={(e) => setYears(Number(e.target.value))}
                                min="1"
                                max="50"
                                className="custom-slider"
                                style={{ '--progress': `${((Number(years) - 1) / (50 - 1)) * 100}%` } as any}
                            />
                        </div>
                    )}

                    {(calculationMode === 'timeToGoal' || calculationMode === 'requiredContribution') && (
                        <div className="calc__input-group">
                            <label htmlFor="target">Objetivo de Capital</label>
                            <div className="calc__input-wrapper">
                                <Target size={18} />
                                <input
                                    id="target"
                                    type="number"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                    min="1000"
                                    step="10000"
                                />
                                <span className="unit">€</span>
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
                                    <div className="calc__input-group">
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
                                        <div className="calc__input-group">
                                            <label htmlFor="withdrawal">
                                                {withdrawalType === 'percentage' ? 'Porcentaje anual' : 'Cantidad anual'}
                                            </label>
                                            <div className="calc__input-wrapper">
                                                <DollarSign size={18} />
                                                <input
                                                    id="withdrawal"
                                                    type="number"
                                                    value={withdrawalValue}
                                                    onChange={(e) => setWithdrawalValue(Number(e.target.value))}
                                                    min="0"
                                                    step={withdrawalType === 'percentage' ? '0.5' : '1000'}
                                                />
                                                <span className="unit">{withdrawalType === 'percentage' ? '%' : '€'}</span>
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
                        <div className={`compound__goal-result ${timeToGoalYears <= 0 ? 'compound__goal-result--achieved' : ''}`}>
                            {timeToGoalYears <= 0 ? (
                                <div className="compound__goal-achieved">
                                    <div className="compound__goal-badge">🎉</div>
                                    <div className="compound__goal-content">
                                        <h3>¡Objetivo Conseguido!</h3>
                                        <p>Tu patrimonio actual ya supera los {formatCurrency(Number(targetAmount) || 0)}.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="compound__goal-pending">
                                    <div className="compound__goal-years-vibe">
                                        <div className="number">{timeToGoalYears.toFixed(1)}</div>
                                        <div className="label">Años restantes</div>
                                    </div>
                                    <div className="compound__goal-text">
                                        <p>Para alcanzar <span className="highlight">{formatCurrency(Number(targetAmount) || 0)}</span> aportando <span className="highlight">{formatCurrency(Number(monthlyContribution) || 0)}</span> al mes.</p>
                                    </div>
                                </div>
                            )}
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
                                    Para alcanzar {formatCurrency(Number(targetAmount) || 0)} en {years} años al {annualRate}% (desde {formatCurrency(Number(initialCapital) || 0)})
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Chart */}
                    <div className="compound__chart">
                        <h4>Evolución Temporal</h4>
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis
                                    dataKey="yearLabel"
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
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Area
                                    type="monotone"
                                    dataKey="contributed"
                                    stackId="1"
                                    stroke="#3b82f6"
                                    fill="#3b82f6"
                                    fillOpacity={0.4}
                                    strokeWidth={2}
                                    name="Capital Aportado"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="interest"
                                    stackId="1"
                                    stroke="#10b981"
                                    fill="#10b981"
                                    fillOpacity={0.4}
                                    strokeWidth={2}
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
                            <div className="compound__breakdown-label">Magia del interés compuesto</div>
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
