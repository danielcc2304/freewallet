import { useState, useMemo } from 'react';
import { Calendar, Info, ShieldAlert, BadgeInfo, Wallet2, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './RetirementCalculator.css';

export function RetirementCalculator() {
    // Inputs
    const [currentAge, setCurrentAge] = useState<number | string>(30);
    const [retirementAge, setRetirementAge] = useState<number | string>(67);
    const [currentSavings, setCurrentSavings] = useState<number | string>(5000);
    const [monthlyContribution, setMonthlyContribution] = useState<number | string>(300);
    const [annualReturn, setAnnualReturn] = useState<number | string>(7);
    const [inflationRate, setInflationRate] = useState<number | string>(2.5);

    // Numeric versions
    const ageNum = Number(currentAge) || 0;
    const retAgeNum = Number(retirementAge) || 0;
    const savingsNum = Number(currentSavings) || 0;
    const contributionNum = Number(monthlyContribution) || 0;
    const returnNum = Number(annualReturn) || 0;
    const inflationNum = Number(inflationRate) || 0;

    // Derived values
    const yearsToRetire = Math.max(0, retAgeNum - ageNum);

    // Projection Data
    const projectionData = useMemo(() => {
        const data = [];
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
    }, [ageNum, retAgeNum, savingsNum, contributionNum, returnNum, inflationNum, yearsToRetire]);

    const finalNominal = projectionData[projectionData.length - 1]?.nominal || 0;
    const finalReal = projectionData[projectionData.length - 1]?.real || 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="retirement-tooltip">
                    <p className="retirement-tooltip__label">Edad: {label} años</p>
                    <p className="retirement-tooltip__value nominal">Valor Futuro: {formatCurrency(payload[0].value)}</p>
                    <p className="retirement-tooltip__value real">Poder de Compra Hoy: {formatCurrency(payload[1].value)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="retirement">
            <header className="retirement__header">
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
                    <span className="retirement__summary-value">{formatCurrency(finalNominal)}</span>
                </div>
            </header>

            <div className="retirement__grid">
                <aside className="retirement__inputs">
                    <div className="retirement__input-section">
                        <h3 className="retirement__section-header">Tiempos</h3>
                        <div className="retirement__input-grid">
                            <div className="calc__input-group">
                                <label>Edad Actual</label>
                                <div className="calc__input-wrapper">
                                    <Calendar size={18} />
                                    <input
                                        type="number"
                                        value={currentAge}
                                        onChange={(e) => setCurrentAge(e.target.value === '' ? '' : Number(e.target.value))}
                                    />
                                    <span className="unit">años</span>
                                </div>
                            </div>
                            <div className="calc__input-group">
                                <label>Edad Jubilación</label>
                                <div className="calc__input-wrapper">
                                    <Calendar size={18} />
                                    <input
                                        type="number"
                                        value={retirementAge}
                                        onChange={(e) => setRetirementAge(e.target.value === '' ? '' : Number(e.target.value))}
                                    />
                                    <span className="unit">años</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="retirement__input-section">
                        <h3 className="retirement__section-header">Ahorro y Aportaciones</h3>
                        <div className="calc__input-group">
                            <label>Ahorro Actual</label>
                            <div className="calc__input-wrapper">
                                <Wallet2 size={18} />
                                <input
                                    type="number"
                                    value={currentSavings}
                                    onChange={(e) => setCurrentSavings(e.target.value === '' ? '' : Number(e.target.value))}
                                />
                                <span className="unit">€</span>
                            </div>
                        </div>
                        <div className="calc__input-group">
                            <label>Aportación Mensual</label>
                            <div className="calc__input-wrapper">
                                <TrendingUp size={18} />
                                <input
                                    type="number"
                                    value={monthlyContribution}
                                    onChange={(e) => setMonthlyContribution(e.target.value === '' ? '' : Number(e.target.value))}
                                />
                                <span className="unit">€</span>
                            </div>
                        </div>
                    </div>

                    <div className="retirement__input-section">
                        <h3 className="retirement__section-header">Mercado e Inflación</h3>
                        <div className="retirement__input-grid">
                            <div className="calc__input-group">
                                <label>Rentabilidad Anual</label>
                                <div className="calc__input-wrapper">
                                    <TrendingUp size={18} />
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={annualReturn}
                                        onChange={(e) => setAnnualReturn(e.target.value === '' ? '' : Number(e.target.value))}
                                    />
                                    <span className="unit">%</span>
                                </div>
                            </div>
                            <div className="calc__input-group">
                                <label>Inflación Estimada</label>
                                <div className="calc__input-wrapper">
                                    <Info size={18} />
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={inflationRate}
                                        onChange={(e) => setInflationRate(e.target.value === '' ? '' : Number(e.target.value))}
                                    />
                                    <span className="unit">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="retirement__note">
                        <Info size={16} />
                        <p>La inflación reduce tu poder adquisitivo. 100.000€ en el futuro no comprarán lo mismo que hoy.</p>
                    </div>
                </aside>

                <main className="retirement__main">
                    <div className="retirement__metrics">
                        <div className="retirement__metric-card">
                            <Wallet2 className="retirement__metric-icon" />
                            <div className="retirement__metric-info">
                                <span className="retirement__metric-label">Capital Nominal</span>
                                <span className="retirement__metric-value">{formatCurrency(finalNominal)}</span>
                                <p className="retirement__metric-desc">La cifra que verás en tu cuenta</p>
                            </div>
                        </div>
                        <div className="retirement__metric-card retirement__metric-card--highlight">
                            <ShieldAlert className="retirement__metric-icon" />
                            <div className="retirement__metric-info">
                                <span className="retirement__metric-label">Poder Adquisitivo Real</span>
                                <span className="retirement__metric-value">{formatCurrency(finalReal)}</span>
                                <p className="retirement__metric-desc">Equivalente a dinero de HOY</p>
                            </div>
                        </div>
                    </div>

                    <div className="retirement__chart-box">
                        <h3 className="retirement__chart-title">Evolución del Patrimonio</h3>
                        <div className="retirement__chart-legend">
                            <span className="legend-item"><span className="dot nominal"></span> Valor Futuro</span>
                            <span className="legend-item"><span className="dot real"></span> Poder Adquisitivo</span>
                        </div>
                        <div className="retirement__chart-wrapper">
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
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
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                        width={40}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
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
                    </div>

                    <div className="retirement__insight">
                        <BadgeInfo className="retirement__insight-icon" />
                        <div className="retirement__insight-content">
                            <h4>Proyección de Retirada</h4>
                            <p>
                                Con un capital de <strong>{formatCurrency(finalReal)}</strong> (ajustado), podrías retirar aproximadamente
                                <strong> {formatCurrency(finalReal * 0.04 / 12)}/mes</strong> indefinidamente siguiendo la regla del 4%.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
