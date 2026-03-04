import { useState, useMemo } from 'react';
import { Percent, Info, ShieldCheck, Landmark, Receipt, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './TaxSimulator.css';

export function TaxSimulator() {
    const [gain, setGain] = useState<number | string>(10000);
    const [holdingYears, setHoldingYears] = useState<number | string>(5);

    // Helper to get numeric value for calculations
    const gainNum = Number(gain) || 0;
    const yearsNum = Number(holdingYears) || 0;

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

    const taxAmount = useMemo(() => calculateTaxes(gainNum), [gainNum]);
    const netProfit = gainNum - taxAmount;
    const effectiveRate = gainNum > 0 ? (taxAmount / gainNum) * 100 : 0;

    // Simulation: Fund vs ETF (Tax Deferral Benefit)
    // Assumes 7% annual growth, and we realize it after X years
    const deferralAnalysis = useMemo(() => {
        const principal = 10000;
        const rate = 0.07;

        // Scenario A: Fund (Mutual Fund) - No taxes until the end
        const finalFundPreTax = principal * Math.pow(1 + rate, yearsNum);
        const fundGain = finalFundPreTax - principal;
        const fundTax = calculateTaxes(fundGain);
        const fundNet = finalFundPreTax - fundTax;

        // Scenario B: Asset with recurring tax (simulating "leakage" or yearly rebalancing)
        // We simulate that every year we realize gains and pay taxes on them.
        let finalETFNet = principal;
        for (let i = 0; i < yearsNum; i++) {
            const annualGain = finalETFNet * rate;
            const annualTax = calculateTaxes(annualGain); // Use actual brackets for realism
            finalETFNet = finalETFNet + annualGain - annualTax;
        }

        return {
            fundNet,
            etfNet: finalETFNet,
            difference: fundNet - finalETFNet
        };
    }, [yearsNum, calculateTaxes]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const chartData = [
        { name: 'Bruto', value: gainNum, fill: 'var(--text-secondary)' },
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
                        <div className="calc__input-group">
                            <label>Plusvalía Bruta (Ganancias)</label>
                            <div className="calc__input-wrapper">
                                <TrendingUp size={18} />
                                <input
                                    type="number"
                                    value={gain}
                                    onChange={(e) => setGain(e.target.value === '' ? '' : Number(e.target.value))}
                                />
                                <span className="unit">€</span>
                            </div>
                            <p className="tax-sim__input-hint">Solo tributas por lo ganado, no por lo invertido.</p>
                        </div>
                    </div>

                    <div className="tax-sim__card">
                        <h3 className="tax-sim__card-title">Poder del Diferimiento</h3>
                        <div className="calc__input-group">
                            <label>Años de Inversión</label>
                            <div className="calc__input-wrapper">
                                <Landmark size={18} />
                                <input
                                    type="number"
                                    value={holdingYears}
                                    onChange={(e) => setHoldingYears(e.target.value === '' ? '' : Number(e.target.value))}
                                />
                                <span className="unit">años</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="40"
                                value={yearsNum}
                                onChange={(e) => setHoldingYears(Number(e.target.value))}
                                className="custom-slider"
                                style={{ '--progress': `${((yearsNum - 1) / (40 - 1)) * 100}%` } as any}
                            />
                        </div>
                        <div className="tax-sim__deferral-info">
                            <Info size={16} />
                            <p>Los fondos de inversión en España no pagan impuestos al traspasarlos.</p>
                        </div>
                    </div>

                    <div className="tax-sim__brackets">
                        <h4 className="tax-sim__brackets-title">Tramos IRPF 2026</h4>
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
                            <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 30, top: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-primary)" />
                                <XAxis
                                    type="number"
                                    stroke="var(--text-secondary)"
                                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                                    tickFormatter={(value) =>
                                        new Intl.NumberFormat('es-ES', {
                                            notation: 'compact',
                                            compactDisplay: 'short'
                                        }).format(value)
                                    }
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    stroke="var(--text-secondary)"
                                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                                    width={70}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--border-primary)' }}
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-card)',
                                        border: '1px solid var(--border-primary)',
                                        borderRadius: '10px',
                                        color: 'var(--text-primary)'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                    formatter={(val: any) => formatCurrency(Number(val))}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="tax-sim__strategy">
                        <div className="tax-sim__strategy-header">
                            <ShieldCheck className="icon" size={24} />
                            <h3>Beneficio del Diferimiento Fiscal</h3>
                        </div>
                        <p className="tax-sim__strategy-desc">
                            En España, los <strong>Fondos de Inversión</strong> permiten el traspaso sin tributar. Esto significa que puedes mover tu dinero de un fondo a otro sin pagar impuestos hasta que finalmente retires el capital.
                            <br /><br />
                            El dato de <strong>"Beneficio de Diferir"</strong> compara invertir 10.000€ a un 7% anual en un Fondo (pago único al final) frente a un activo donde pagaras impuestos cada año.
                        </p>
                        <div className="tax-sim__comparison">
                            <div className="compare-card">
                                <span>Capital Final Diferido</span>
                                <strong>{formatCurrency(deferralAnalysis.fundNet)}</strong>
                                <p>Pagando impuestos solo al final (Fondo de Inversión)</p>
                            </div>
                            <div className="compare-card">
                                <span>Capital Final No Diferido</span>
                                <strong>{formatCurrency(deferralAnalysis.etfNet)}</strong>
                                <p>Pagando impuestos anualmente (Eficiencia baja)</p>
                            </div>
                            <div className="compare-card highlight">
                                <Landmark size={24} />
                                <span>Ventaja Fiscal Extra</span>
                                <strong>+{formatCurrency(deferralAnalysis.difference)}</strong>
                                <p>Dinero extra gracias al interés compuesto sobre los impuestos no pagados.</p>
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
