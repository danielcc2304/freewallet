import { useState, useMemo } from 'react';
import { Info, TrendingUp, Wallet, ShieldCheck, Flame } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './FIRECalculator.css';

export function FIRECalculator() {
    // Inputs
    const [monthlyExpenses, setMonthlyExpenses] = useState<number | string>(2000);
    const [currentSavings, setCurrentSavings] = useState<number | string>(10000);
    const [monthlySavings, setMonthlySavings] = useState<number | string>(500);
    const [annualReturn, setAnnualReturn] = useState<number | string>(7);
    const [withdrawalRate, setWithdrawalRate] = useState<number | string>(4); // 4% Rule

    // Numeric versions for calculations
    const expensesNum = Number(monthlyExpenses) || 0;
    const savingsNum = Number(currentSavings) || 0;
    const monthlySavingsNum = Number(monthlySavings) || 0;
    const annualReturnNum = Number(annualReturn) || 0;
    const withdrawalRateNum = Number(withdrawalRate) || 0;

    // Calculations
    const annualExpenses = expensesNum * 12;
    const fireNumber = annualExpenses / (withdrawalRateNum / 100);
    const leanFireNumber = fireNumber * 0.8; // 80% of expenses
    const fatFireNumber = fireNumber * 1.5; // 150% of expenses

    // Data for projection
    const projectionData = useMemo(() => {
        const data = [];
        let balance = savingsNum;
        const monthlyRate = Math.pow(1 + annualReturnNum / 100, 1 / 12) - 1;

        // Project for 40 years or until FIRE number is reached + 5 years
        for (let year = 0; year <= 40; year++) {
            data.push({
                year,
                balance: Math.round(balance),
                fireNumber: Math.round(fireNumber),
                leanFire: Math.round(leanFireNumber),
                fatFire: Math.round(fatFireNumber)
            });

            // Monthly compounding for 12 months
            for (let m = 0; m < 12; m++) {
                balance = (balance + monthlySavingsNum) * (1 + monthlyRate);
            }

            // If we've passed fat FIRE by a lot, stop
            if (balance > fatFireNumber * 2) break;
        }
        return data;
    }, [currentSavings, monthlySavings, annualReturn, fireNumber, leanFireNumber, fatFireNumber]);

    // Years to FIRE calculation
    const yearsToFIRE = useMemo(() => {
        const target = fireNumber;
        if (monthlySavingsNum <= 0 && savingsNum < target) return Infinity;

        let balance = savingsNum;
        let months = 0;
        const monthlyRate = Math.pow(1 + annualReturnNum / 100, 1 / 12) - 1;

        while (balance < target && months < 1200) { // Max 100 years
            balance = (balance + monthlySavingsNum) * (1 + monthlyRate);
            months++;
        }
        return months / 12;
    }, [currentSavings, monthlySavings, annualReturn, fireNumber]);

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
                <div className="fire-tooltip">
                    <p className="fire-tooltip__label">Año {label}</p>
                    <p className="fire-tooltip__value balance">Patrimonio: {formatCurrency(payload[0].value)}</p>
                    <p className="fire-tooltip__value target">Objetivo FIRE: {formatCurrency(payload[1].value)}</p>
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
                            <TrendingUp size={18} />
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
                            <ShieldCheck size={18} />
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

                    <div className="fire__info-card">
                        <Info size={16} />
                        <p>La <strong>Regla del 4%</strong> sugiere que puedes retirar el 4% de tu capital anualmente ajustado por inflación durante 30 años sin agotar tus fondos.</p>
                    </div>
                </section>

                <main className="fire__results">
                    <div className="fire__metrics">
                        <div className="fire__metric-card fire__metric-card--lean">
                            <span className="fire__metric-label">Lean FIRE (80%)</span>
                            <span className="fire__metric-value">{formatCurrency(leanFireNumber)}</span>
                            <p className="fire__metric-desc">Estilo de vida minimalista</p>
                        </div>
                        <div className="fire__metric-card fire__metric-card--main">
                            <span className="fire__metric-label">TU NÚMERO FIRE</span>
                            <span className="fire__metric-value">{formatCurrency(fireNumber)}</span>
                            <p className="fire__metric-desc">Cubriendo tus gastos actuales</p>
                        </div>
                        <div className="fire__metric-card fire__metric-card--fat">
                            <span className="fire__metric-label">Fat FIRE (150%)</span>
                            <span className="fire__metric-value">{formatCurrency(fatFireNumber)}</span>
                            <p className="fire__metric-desc">Sin limitaciones económicas</p>
                        </div>
                    </div>

                    <div className="fire__chart-container">
                        <h3 className="fire__chart-title">Proyección de Patrimonio vs Objetivo</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis
                                    dataKey="year"
                                    stroke="var(--text-secondary)"
                                    tick={{ fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="var(--text-secondary)"
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                    width={40}
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
                </main>
            </div>

            <section className="fire__theory">
                <h2 className="fire__section-title">Entendiendo el camino al FIRE</h2>
                <div className="fire__theory-grid">
                    <div className="fire__theory-card">
                        <Wallet className="fire__theory-icon" />
                        <h3>La Regla de los 25</h3>
                        <p>Tu número FIRE es simplemente multiplicar tus gastos anuales por 25. Esto es equivalente a retirar un 4% anual.</p>
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
