import { useState, useMemo } from 'react';
import { Percent, Info, ShieldCheck, Landmark, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './TaxSimulator.css';

export function TaxSimulator() {
    const [gain, setGain] = useState(10000);
    const [holdingYears, setHoldingYears] = useState(5);

    // Spanish IRPF Brackets (Ahorro) - 2024
    const calculateTaxes = (amount: number) => {
        let tax = 0;
        const brackets = [
            { limit: 6000, rate: 0.19 },
            { limit: 50000, rate: 0.21 },
            { limit: 200000, rate: 0.23 },
            { limit: 300000, rate: 0.27 },
            { limit: Infinity, rate: 0.30 }
        ];

        let remaining = amount;
        let previousLimit = 0;

        for (const bracket of brackets) {
            const rangeSize = bracket.limit - previousLimit;
            const taxableInRange = Math.min(remaining, rangeSize);

            if (taxableInRange <= 0) break;

            tax += taxableInRange * bracket.rate;
            remaining -= taxableInRange;
            previousLimit = bracket.limit;
        }

        return tax;
    };

    const taxAmount = useMemo(() => calculateTaxes(gain), [gain]);
    const netProfit = gain - taxAmount;
    const effectiveRate = gain > 0 ? (taxAmount / gain) * 100 : 0;

    // Simulation: Fund vs ETF (Tax Deferral Benefit)
    // Assumes 7% annual growth, and we realize it after X years
    const deferralAnalysis = useMemo(() => {
        const principal = 10000;
        const rate = 0.07;

        // Scenario A: Fund (Mutual Fund) - No taxes until the end
        const finalFundPreTax = principal * Math.pow(1 + rate, holdingYears);
        const fundGain = finalFundPreTax - principal;
        const fundTax = calculateTaxes(fundGain);
        const fundNet = finalFundPreTax - fundTax;

        // Scenario B: Asset with recurring tax (simulating "leakage" or selling/rebuying)
        // This is a simplification to show the power of compound interest without tax friction
        let finalETFNet = principal;
        for (let i = 0; i < holdingYears; i++) {
            const annualGain = finalETFNet * rate;
            const annualTax = annualGain * 0.19; // Simplified fixed rate for annual hit
            finalETFNet = finalETFNet + annualGain - annualTax;
        }

        return {
            fundNet,
            etfNet: finalETFNet,
            difference: fundNet - finalETFNet
        };
    }, [holdingYears]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const chartData = [
        { name: 'Bruto', value: gain, fill: 'var(--text-secondary)' },
        { name: 'Impuestos', value: taxAmount, fill: '#ef4444' },
        { name: 'Neto', value: netProfit, fill: '#10b981' }
    ];

    return (
        <div className="tax-sim">
            <header className="tax-sim__header">
                <div className="tax-sim__title-group">
                    <div className="tax-sim__icon-container">
                        <Receipt className="tax-sim__title-icon" />
                    </div>
                    <div>
                        <h1 className="tax-sim__title">Simulador de Impacto Fiscal</h1>
                        <p className="tax-sim__subtitle">¿Cuánto se lleva Hacienda de tus beneficios? (IRPF España)</p>
                    </div>
                </div>
            </header>

            <div className="tax-sim__grid">
                <aside className="tax-sim__inputs">
                    <div className="tax-sim__card">
                        <h3 className="tax-sim__card-title">Tus Beneficios</h3>
                        <div className="tax-sim__input-group">
                            <label>Plusvalía Bruta (Ganancias)</label>
                            <input
                                type="number"
                                value={gain}
                                onChange={(e) => setGain(Math.max(0, Number(e.target.value)))}
                                className="tax-sim__main-input"
                            />
                            <p className="tax-sim__input-hint">Solo tributas por lo ganado, no por lo invertido.</p>
                        </div>
                    </div>

                    <div className="tax-sim__card">
                        <h3 className="tax-sim__card-title">Poder del Diferimiento</h3>
                        <div className="tax-sim__input-group">
                            <label>Años de Inversión: {holdingYears}</label>
                            <input
                                type="range"
                                min="1"
                                max="40"
                                value={holdingYears}
                                onChange={(e) => setHoldingYears(Number(e.target.value))}
                            />
                        </div>
                        <div className="tax-sim__deferral-info">
                            <Info size={16} />
                            <p>Los fondos de inversión en España no pagan impuestos al traspasarlos.</p>
                        </div>
                    </div>

                    <div className="tax-sim__brackets">
                        <h4 className="tax-sim__brackets-title">Tramos IRPF 2024</h4>
                        <ul className="tax-sim__brackets-list">
                            <li>0 - 6.000€: <span>19%</span></li>
                            <li>6.000 - 50.000€: <span>21%</span></li>
                            <li>50.000 - 200.000€: <span>23%</span></li>
                            <li>200.000 - 300.000€: <span>27%</span></li>
                            <li>+300.000€: <span>30%</span></li>
                        </ul>
                    </div>
                </aside>

                <main className="tax-sim__results">
                    <div className="tax-sim__summary">
                        <div className="tax-sim__metric">
                            <span className="label">Total Impuestos</span>
                            <span className="value tax">{formatCurrency(taxAmount)}</span>
                            <span className="sub">Tipo efectivo: {effectiveRate.toFixed(1)}%</span>
                        </div>
                        <div className="tax-sim__metric">
                            <span className="label">Dinero Neto</span>
                            <span className="value net">{formatCurrency(netProfit)}</span>
                            <span className="sub">Lo que llega a tu bolsillo</span>
                        </div>
                    </div>

                    <div className="tax-sim__chart-container">
                        <h3 className="tax-sim__chart-title">Desglose Fiscal</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(Number(value))}
                                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="tax-sim__strategy">
                        <header className="tax-sim__strategy-header">
                            <Landmark className="icon" />
                            <h3>Estrategia: Fondos vs Otros Activos</h3>
                        </header>
                        <p className="tax-sim__strategy-desc">
                            Invertir en Fondos de Inversión permite el <b>traspaso sin tributar</b>. Al no pagar impuestos cada vez que rebalanceas, tu capital crece más rápido.
                        </p>
                        <div className="tax-sim__comparison">
                            <div className="compare-card">
                                <span>Beneficio de Diferir</span>
                                <strong>+{formatCurrency(deferralAnalysis.difference)}</strong>
                                <p>Extra ganado tras {holdingYears} años</p>
                            </div>
                            <div className="compare-card highlight">
                                <ShieldCheck size={20} />
                                <span>Ventaja Fiscal</span>
                                <p>Evitar la tributación anual acelera el interés compuesto.</p>
                            </div>
                        </div>
                    </div>

                    <div className="tax-sim__footer-info">
                        <div className="info-item">
                            <Percent size={18} />
                            <div>
                                <strong>Compensación de Pérdidas</strong>
                                <p>Recuerda que puedes restar tus pérdidas de tus ganancias para pagar menos impuestos.</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
