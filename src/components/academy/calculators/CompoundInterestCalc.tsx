import { useEffect, useState, useMemo } from 'react';
import { Banknote, TrendingUp, Calendar, Target, ChevronDown, ChevronUp } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { CalculatorCard } from './CalculatorCard';
import {
    COMPOUNDING_FREQUENCY_OPTIONS,
    calculateCompoundInterestProjection,
    calculateRequiredMonthly,
    calculateTimeToGoal,
    getRateConversion,
    isCompoundingFrequency,
    isInterestRateType,
    type CompoundingFrequency,
    type InterestRateType,
    type WithdrawalType
} from './compoundInterestUtils';
import './CompoundInterestCalc.css';

type CalculationMode = 'normal' | 'timeToGoal' | 'requiredContribution';

interface YearlyDetailRow {
    year: number;
    startingBalance: number;
    yearlyDeposits: number;
    interestEarned: number;
    grossInterestEarned: number;
    withdrawalAmount: number;
    endingBalance: number;
    balanceChange: number;
    totalContributed: number;
    totalDeposits: number;
    totalInterest: number;
}

interface CompoundInterestCalcStorage {
    initialCapital: number | string;
    monthlyContribution: number | string;
    annualRate: number | string;
    years: number | string;
    showAdvanced: boolean;
    interestRateType: InterestRateType;
    compoundingFrequency: CompoundingFrequency;
    withdrawalType: WithdrawalType;
    withdrawalValue: number | string;
    calculationMode: CalculationMode;
    targetAmount: number | string;
    expandedYear: number | null;
}

const COMPOUND_INTEREST_STORAGE_KEY = 'freewallet_compound_interest_calc';

export function CompoundInterestCalc() {
    // Basic inputs
    const [initialCapital, setInitialCapital] = useState<number | string>(10000);
    const [monthlyContribution, setMonthlyContribution] = useState<number | string>(500);
    const [annualRate, setAnnualRate] = useState<number | string>(7);
    const [years, setYears] = useState<number | string>(20);

    // Advanced options
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [interestRateType, setInterestRateType] = useState<InterestRateType>('cagr');
    const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>('monthly');
    const [withdrawalType, setWithdrawalType] = useState<WithdrawalType>('none');
    const [withdrawalValue, setWithdrawalValue] = useState<number | string>(0);

    // Calculation mode
    const [calculationMode, setCalculationMode] = useState<CalculationMode>('normal');
    const [targetAmount, setTargetAmount] = useState<number | string>(500000);
    const [expandedYear, setExpandedYear] = useState<number | null>(1);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(COMPOUND_INTEREST_STORAGE_KEY);
            if (!raw) return;

            const stored = JSON.parse(raw) as Partial<CompoundInterestCalcStorage>;

            if (stored.initialCapital !== undefined) setInitialCapital(stored.initialCapital);
            if (stored.monthlyContribution !== undefined) setMonthlyContribution(stored.monthlyContribution);
            if (stored.annualRate !== undefined) setAnnualRate(stored.annualRate);
            if (stored.years !== undefined) setYears(stored.years);
            if (typeof stored.showAdvanced === 'boolean') setShowAdvanced(stored.showAdvanced);
            if (isInterestRateType(stored.interestRateType)) {
                setInterestRateType(stored.interestRateType);
            }
            if (isCompoundingFrequency(stored.compoundingFrequency)) {
                setCompoundingFrequency(stored.compoundingFrequency);
            }
            if (stored.withdrawalType === 'none' || stored.withdrawalType === 'percentage' || stored.withdrawalType === 'fixed') {
                setWithdrawalType(stored.withdrawalType);
            }
            if (stored.withdrawalValue !== undefined) setWithdrawalValue(stored.withdrawalValue);
            if (stored.calculationMode === 'normal' || stored.calculationMode === 'timeToGoal' || stored.calculationMode === 'requiredContribution') {
                setCalculationMode(stored.calculationMode);
            }
            if (stored.targetAmount !== undefined) setTargetAmount(stored.targetAmount);
            if (typeof stored.expandedYear === 'number' || stored.expandedYear === null) {
                setExpandedYear(stored.expandedYear);
            }
        } catch {
            // Ignore localStorage failures or malformed saved values.
        }
    }, []);

    useEffect(() => {
        const payload: CompoundInterestCalcStorage = {
            initialCapital,
            monthlyContribution,
            annualRate,
            years,
            showAdvanced,
            interestRateType,
            compoundingFrequency,
            withdrawalType,
            withdrawalValue,
            calculationMode,
            targetAmount,
            expandedYear
        };

        try {
            localStorage.setItem(COMPOUND_INTEREST_STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // Ignore localStorage failures.
        }
    }, [
        initialCapital,
        monthlyContribution,
        annualRate,
        years,
        showAdvanced,
        interestRateType,
        compoundingFrequency,
        withdrawalType,
        withdrawalValue,
        calculationMode,
        targetAmount,
        expandedYear
    ]);

    const rateConversion = useMemo(() => getRateConversion(
        (Number(annualRate) || 0) / 100,
        interestRateType,
        compoundingFrequency
    ), [annualRate, interestRateType, compoundingFrequency]);

    const effectiveAnnualRatePercent = rateConversion.effectiveAnnualRate * 100;

    const chartData = useMemo(() => {
        const initial = Number(initialCapital) || 0;
        const monthly = Number(monthlyContribution) || 0;
        const periods = Number(years) || 0;
        const target = Number(targetAmount) || 0;
        const wValue = Number(withdrawalValue) || 0;

        if (calculationMode === 'normal') {
            return calculateCompoundInterestProjection({
                initial,
                monthly,
                monthlyRate: rateConversion.monthlyRate,
                periods,
                withdrawalType,
                withdrawalValue: wValue
            });
        } else if (calculationMode === 'timeToGoal') {
            const yearsToGoal = Math.ceil(calculateTimeToGoal(
                initial,
                monthly,
                rateConversion.monthlyRate,
                target
            ));
            return calculateCompoundInterestProjection({
                initial,
                monthly,
                monthlyRate: rateConversion.monthlyRate,
                periods: yearsToGoal || 1,
                withdrawalType: 'none',
                withdrawalValue: 0
            });
        } else { // calculationMode === 'requiredContribution'
            const requiredMonthly = calculateRequiredMonthly(
                initial,
                rateConversion.monthlyRate,
                periods,
                target
            );
            return calculateCompoundInterestProjection({
                initial,
                monthly: requiredMonthly,
                monthlyRate: rateConversion.monthlyRate,
                periods,
                withdrawalType: 'none',
                withdrawalValue: 0
            });
        }
    }, [initialCapital, monthlyContribution, years, targetAmount, withdrawalValue, withdrawalType, calculationMode, rateConversion]);

    const finalData = chartData[chartData.length - 1];

    const timeToGoalYears = useMemo(() => {
        if (calculationMode !== 'timeToGoal') return null;
        const initial = Number(initialCapital) || 0;
        const monthly = Number(monthlyContribution) || 0;
        const target = Number(targetAmount) || 0;
        return calculateTimeToGoal(initial, monthly, rateConversion.monthlyRate, target);
    }, [calculationMode, initialCapital, monthlyContribution, targetAmount, rateConversion]);

    const requiredMonthlyAmount = useMemo(() => {
        if (calculationMode !== 'requiredContribution') return null;
        const initial = Number(initialCapital) || 0;
        const periods = Number(years) || 0;
        const target = Number(targetAmount) || 0;
        return calculateRequiredMonthly(initial, rateConversion.monthlyRate, periods, target);
    }, [calculationMode, initialCapital, years, targetAmount, rateConversion]);

    const yearlyDetailRows = useMemo<YearlyDetailRow[]>(() => {
        if (chartData.length <= 1) return [];

        return chartData.slice(1).map((point, index) => {
            const previousPoint = chartData[index];
            const yearlyDeposits = point.contributed - previousPoint.contributed;
            const interestEarned = point.interest - previousPoint.interest;
            const grossInterestEarned = point.grossInterest - previousPoint.grossInterest;
            const withdrawalAmount = point.withdrawal - previousPoint.withdrawal;

            return {
                year: point.year,
                startingBalance: previousPoint.total,
                yearlyDeposits,
                interestEarned,
                grossInterestEarned,
                withdrawalAmount,
                endingBalance: point.total,
                balanceChange: point.total - previousPoint.total,
                totalContributed: point.contributed,
                totalDeposits: point.contributed - (Number(initialCapital) || 0),
                totalInterest: point.interest
            };
        });
    }, [chartData, initialCapital]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatPercent = (value: number) => `${value.toFixed(2)}%`;

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
                    <p style={{ margin: '8px 0 0 0', fontWeight: 700, color: '#5280c7', fontSize: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
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
                <CalculatorCard className="compound__inputs">
                    <h3>Parámetros</h3>

                    <div className="calc__input-group">
                        <label htmlFor="initial">Patrimonio Inicial</label>
                        <div className="calc__input-wrapper">
                            <Banknote size={18} />
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
                                <Banknote size={18} />
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
                        <label htmlFor="rate">
                            {interestRateType === 'cagr'
                                ? 'Rentabilidad Anual Esperada (CAGR)'
                                : 'Tipo de Interés Nominal Anual (TIN)'}
                        </label>
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
                            {interestRateType === 'cagr'
                                ? 'La tasa se interpreta como rentabilidad efectiva de un año completo.'
                                : 'La tasa efectiva resultante depende de la frecuencia de capitalización.'}
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
                                type="button"
                                className="compound__advanced-toggle"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                            >
                                <span>Opciones Avanzadas</span>
                                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {showAdvanced && (
                                <div className="compound__advanced-content">
                                    <div className="calc__input-group">
                                        <label>Tipo de rentabilidad</label>
                                        <div className="compound__radio-group">
                                            <label className="compound__radio">
                                                <input
                                                    type="radio"
                                                    name="interest-rate-type"
                                                    checked={interestRateType === 'cagr'}
                                                    onChange={() => setInterestRateType('cagr')}
                                                />
                                                <span>Rentabilidad anual efectiva (CAGR)</span>
                                            </label>
                                            <label className="compound__radio">
                                                <input
                                                    type="radio"
                                                    name="interest-rate-type"
                                                    checked={interestRateType === 'tin'}
                                                    onChange={() => setInterestRateType('tin')}
                                                />
                                                <span>Tasa nominal anual (TIN)</span>
                                            </label>
                                        </div>
                                    </div>

                                    {interestRateType === 'tin' && (
                                        <div className="calc__input-group">
                                            <label htmlFor="compounding-frequency">Frecuencia de capitalización</label>
                                            <div className="calc__input-wrapper">
                                                <Calendar size={18} />
                                                <select
                                                    id="compounding-frequency"
                                                    value={compoundingFrequency}
                                                    onChange={(e) => {
                                                        if (isCompoundingFrequency(e.target.value)) {
                                                            setCompoundingFrequency(e.target.value);
                                                        }
                                                    }}
                                                >
                                                    {COMPOUNDING_FREQUENCY_OPTIONS.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <p className="compound__rate-equivalence">
                                                Rentabilidad anual efectiva equivalente:{' '}
                                                <strong>{formatPercent(effectiveAnnualRatePercent)}</strong>
                                            </p>
                                        </div>
                                    )}

                                    {interestRateType === 'cagr' && (
                                        <p className="compound__rate-equivalence">
                                            Rentabilidad efectiva anual:{' '}
                                            <strong>{formatPercent(effectiveAnnualRatePercent)}</strong>
                                        </p>
                                    )}

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
                                                <span>Sin retiradas</span>
                                            </label>
                                            <label className="compound__radio">
                                                <input
                                                    type="radio"
                                                    name="withdrawal"
                                                    checked={withdrawalType === 'percentage'}
                                                    onChange={() => setWithdrawalType('percentage')}
                                                />
                                                <span>% del capital</span>
                                            </label>
                                            <label className="compound__radio">
                                                <input
                                                    type="radio"
                                                    name="withdrawal"
                                                    checked={withdrawalType === 'fixed'}
                                                    onChange={() => setWithdrawalType('fixed')}
                                                />
                                                <span>Cantidad fija</span>
                                            </label>
                                        </div>
                                    </div>

                                    {withdrawalType !== 'none' && (
                                        <div className="calc__input-group">
                                            <label htmlFor="withdrawal">
                                                {withdrawalType === 'percentage' ? 'Porcentaje anual' : 'Cantidad anual'}
                                            </label>
                                            <div className="calc__input-wrapper">
                                                <Banknote size={18} />
                                                <input
                                                    id="withdrawal"
                                                    type="number"
                                                    value={withdrawalValue}
                                                    onChange={(e) => setWithdrawalValue(e.target.value === '' ? '' : Number(e.target.value))}
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
                </CalculatorCard>

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
                                {withdrawalType !== 'none' && (
                                    <div className="compound__result-card">
                                        <div className="compound__result-label">Retirada Anual</div>
                                        <div className="compound__result-value">
                                            {withdrawalType === 'percentage'
                                                ? formatPercent(Number(withdrawalValue) || 0)
                                                : formatCurrency(Number(withdrawalValue) || 0)}
                                        </div>
                                        <div className="compound__result-subtext">
                                            {withdrawalType === 'percentage'
                                                ? 'Aplicada como porcentaje del capital al cierre de cada año'
                                                : 'Aplicada como importe fijo al cierre de cada año'}
                                        </div>
                                    </div>
                                )}
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
                    <CalculatorCard className="compound__chart">
                        <div className="compound__chart-header">
                            <h4>Evolución Temporal</h4>
                            <div className="compound__chart-legend" aria-label="Leyenda del gr?fico">
                                <span className="compound__chart-legend-item">
                                    <span className="compound__chart-legend-dot compound__chart-legend-dot--blue" />
                                    Capital Aportado
                                </span>
                                <span className="compound__chart-legend-item">
                                    <span className="compound__chart-legend-dot compound__chart-legend-dot--green" />
                                    Intereses Generados
                                </span>
                            </div>
                        </div>
                        <div className="compound__chart-canvas">
                            <ResponsiveContainer width="100%" height="100%">
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
                    </CalculatorCard>

                    {/* Breakdown Chart */}
                    <CalculatorCard className="compound__breakdown">
                        <div className="compound__breakdown-item">
                            <div className="compound__breakdown-bar" style={{
                                width: `${(finalData.contributed / finalData.total) * 100}%`,
                                background: '#3b82f6'
                            }}>
                                <span>{((finalData.contributed / finalData.total) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="compound__breakdown-label-row">
                                <div className="compound__breakdown-label">Tu dinero</div>
                                <div className="compound__breakdown-value">{formatCurrency(finalData.contributed)}</div>
                            </div>
                        </div>
                        <div className="compound__breakdown-item">
                            <div className="compound__breakdown-bar" style={{
                                width: `${(finalData.interest / finalData.total) * 100}%`,
                                background: '#10b981'
                            }}>
                                <span>{((finalData.interest / finalData.total) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="compound__breakdown-label-row">
                                <div className="compound__breakdown-label">Magia del interés compuesto</div>
                                <div className="compound__breakdown-value">{formatCurrency(finalData.interest)}</div>
                            </div>
                        </div>
                    </CalculatorCard>
                    <CalculatorCard className="compound__detail">
                        <div className="compound__detail-header">
                            <div>
                                <h4>Detalle año a año</h4>
                                <p>Cada fila resume saldo total y rendimiento del año.</p>
                            </div>
                        </div>

                        <div className="compound__detail-list">
                            {yearlyDetailRows.map((row) => {
                                const isOpen = expandedYear === row.year;

                                return (
                                    <article key={row.year} className={`compound__detail-item ${isOpen ? 'compound__detail-item--open' : ''}`}>
                                        <button
                                            type="button"
                                            className="compound__detail-summary"
                                            onClick={() => setExpandedYear(isOpen ? null : row.year)}
                                        >
                                            <div className="compound__detail-summary-main">
                                                <span className="compound__detail-year">Año {row.year}</span>
                                                <strong className="compound__detail-total">{formatCurrency(row.endingBalance)}</strong>
                                            </div>
                                            <div className="compound__detail-summary-side">
                                                <span className="compound__detail-yield">{formatCurrency(row.interestEarned)}</span>
                                                <span className="compound__detail-yield-label">Rendimiento</span>
                                            </div>
                                            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </button>

                                        {isOpen && (
                                            <div className="compound__detail-body">
                                                <div className="compound__detail-grid">
                                                    <div className="compound__detail-metric">
                                                        <span>Saldo inicial</span>
                                                        <strong>{formatCurrency(row.startingBalance)}</strong>
                                                    </div>
                                                    <div className="compound__detail-metric">
                                                        <span>Saldo final</span>
                                                        <strong>{formatCurrency(row.endingBalance)}</strong>
                                                    </div>
                                                    <div className="compound__detail-metric">
                                                        <span>Cambio de saldo</span>
                                                        <strong>{formatCurrency(row.balanceChange)}</strong>
                                                    </div>
                                                    <div className="compound__detail-metric">
                                                        <span>Aportes totales hasta el momento</span>
                                                        <strong>{formatCurrency(row.totalContributed)}</strong>
                                                    </div>
                                                    <div className="compound__detail-metric">
                                                        <span>Todos los depósitos hasta ahora</span>
                                                        <strong>{formatCurrency(row.totalDeposits)}</strong>
                                                    </div>
                                                    <div className="compound__detail-metric">
                                                        <span>Depósitos este año</span>
                                                        <strong>{formatCurrency(row.yearlyDeposits)}</strong>
                                                    </div>
                                                    {withdrawalType !== 'none' && (
                                                        <div className="compound__detail-metric">
                                                            <span>Retirada este año</span>
                                                            <strong>{formatCurrency(row.withdrawalAmount)}</strong>
                                                        </div>
                                                    )}
                                                    <div className="compound__detail-metric">
                                                        <span>Intereses recibidos hasta ahora</span>
                                                        <strong className="compound__detail-positive">{formatCurrency(row.totalInterest)}</strong>
                                                    </div>
                                                    <div className="compound__detail-metric">
                                                        <span>Intereses generados este año</span>
                                                        <strong className="compound__detail-positive">
                                                            {formatCurrency(row.grossInterestEarned)}
                                                        </strong>
                                                    </div>
                                                    <div className="compound__detail-metric">
                                                        <span>Resultado neto del año</span>
                                                        <strong className="compound__detail-positive">
                                                            {formatCurrency(row.interestEarned)} ({formatPercent(effectiveAnnualRatePercent)})
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    </CalculatorCard>
                </div>
            </div>

            <div className="compound__disclaimer">
                ⚠️ Esta calculadora es solo educativa. Los resultados asumen rentabilidad constante, lo cual es irreal.
                Los mercados fluctúan. Consulta un asesor antes de tomar decisiones de inversión.
            </div>
        </div>
    );
}
