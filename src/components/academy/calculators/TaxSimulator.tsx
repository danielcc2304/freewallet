import { useEffect, useMemo, useState } from 'react';
import { Percent, Info, ShieldCheck, Landmark, Receipt, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './TaxSimulator.css';

interface TaxSimulatorStorage {
    gain: number | string;
    holdingYears: number | string;
    simulateAnnualTransfers: boolean;
}

const TAX_SIMULATOR_STORAGE_KEY = 'freewallet_tax_simulator';
const DEFERRAL_BENCHMARK_PRINCIPAL = 10000;
const DEFERRAL_BENCHMARK_RATE = 0.07;
const SAVINGS_TAX_BRACKETS = [
    { limit: 6000, rate: 0.19 },
    { limit: 50000, rate: 0.21 },
    { limit: 200000, rate: 0.23 },
    { limit: 300000, rate: 0.27 },
    { limit: Infinity, rate: 0.30 }
] as const;

function calculateSavingsTaxes(amount: number) {
    let tax = 0;
    let remaining = amount;
    let previousLimit = 0;

    for (const bracket of SAVINGS_TAX_BRACKETS) {
        const rangeSize = bracket.limit - previousLimit;
        const taxableInRange = Math.min(remaining, rangeSize);

        if (taxableInRange <= 0) break;

        tax += taxableInRange * bracket.rate;
        remaining -= taxableInRange;
        previousLimit = bracket.limit;
    }

    return tax;
}

export function TaxSimulator() {
    const [gain, setGain] = useState<number | string>(10000);
    const [holdingYears, setHoldingYears] = useState<number | string>(5);
    const [simulateAnnualTransfers, setSimulateAnnualTransfers] = useState(true);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(TAX_SIMULATOR_STORAGE_KEY);
            if (!raw) return;

            const stored = JSON.parse(raw) as Partial<TaxSimulatorStorage>;
            if (stored.gain !== undefined) setGain(stored.gain);
            if (stored.holdingYears !== undefined) setHoldingYears(stored.holdingYears);
            if (stored.simulateAnnualTransfers !== undefined) setSimulateAnnualTransfers(stored.simulateAnnualTransfers);
        } catch {
            // Ignore localStorage failures or malformed saved values.
        }
    }, []);

    useEffect(() => {
        const payload: TaxSimulatorStorage = { gain, holdingYears, simulateAnnualTransfers };
        try {
            localStorage.setItem(TAX_SIMULATOR_STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // Ignore localStorage failures.
        }
    }, [gain, holdingYears, simulateAnnualTransfers]);

    const gainNum = Number(gain) || 0;
    const yearsNum = Number(holdingYears) || 0;

    const taxAmount = useMemo(() => calculateSavingsTaxes(gainNum), [gainNum]);
    const netProfit = gainNum - taxAmount;
    const effectiveRate = gainNum > 0 ? (taxAmount / gainNum) * 100 : 0;

    const deferralAnalysis = useMemo(() => {
        const principal = DEFERRAL_BENCHMARK_PRINCIPAL;
        const rate = DEFERRAL_BENCHMARK_RATE;

        const finalPreTax = principal * Math.pow(1 + rate, yearsNum);
        const finalGain = finalPreTax - principal;
        const exitTax = calculateSavingsTaxes(finalGain);

        const fundNet = finalPreTax - exitTax;
        const etfBuyHoldNet = finalPreTax - exitTax;

        let annualRealisationNet = principal;
        for (let i = 0; i < yearsNum; i++) {
            const annualGain = annualRealisationNet * rate;
            const annualTax = calculateSavingsTaxes(annualGain);
            annualRealisationNet = annualRealisationNet + annualGain - annualTax;
        }

        return {
            principal,
            rate,
            fundNet,
            etfBuyHoldNet,
            annualRealisationNet,
            annualTaxDragDifference: fundNet - annualRealisationNet,
            selectedEtfNet: simulateAnnualTransfers ? annualRealisationNet : etfBuyHoldNet,
            selectedDifference: simulateAnnualTransfers ? fundNet - annualRealisationNet : fundNet - etfBuyHoldNet
        };
    }, [simulateAnnualTransfers, yearsNum]);

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
                                value={Math.max(1, yearsNum)}
                                onChange={(e) => setHoldingYears(Number(e.target.value))}
                                className="custom-slider"
                                style={{ '--progress': `${((Math.max(1, yearsNum) - 1) / (40 - 1)) * 100}%` } as any}
                            />
                        </div>
                        <label className="tax-sim__scenario-toggle">
                            <input
                                type="checkbox"
                                checked={simulateAnnualTransfers}
                                onChange={(e) => setSimulateAnnualTransfers(e.target.checked)}
                            />
                            <span className="tax-sim__scenario-toggle-copy">
                                <strong>Simular un traspaso anual</strong>
                                <small>En el fondo se traspasa sin tributar; en el ETF equivale a vender y recomprar cada año.</small>
                            </span>
                        </label>
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
                            En España, los <strong>Fondos de Inversión</strong> permiten el traspaso sin tributar. Eso reduce el peaje fiscal cuando haces cambios de asignación antes del reembolso final.
                            <br /><br />
                            Aquí comparamos una inversión de <strong>{formatCurrency(deferralAnalysis.principal)}</strong> al <strong>{(deferralAnalysis.rate * 100).toFixed(0)}% anual</strong> durante <strong>{yearsNum} años</strong> con el escenario fiscal {simulateAnnualTransfers ? 'de un traspaso o venta anual' : 'de mantener la posición hasta el final'}.
                        </p>
                        <div className="tax-sim__comparison">
                            <div className="compare-card">
                                <span>Fondo Traspasable</span>
                                <strong>{formatCurrency(deferralAnalysis.fundNet)}</strong>
                                <p>{simulateAnnualTransfers ? 'Un traspaso al año sin peaje fiscal y tributación solo al reembolso final.' : 'Sin tributar hasta el reembolso final.'}</p>
                            </div>
                            <div className="compare-card">
                                <span>{simulateAnnualTransfers ? 'ETF con Venta Anual' : 'ETF Acumulación Buy & Hold'}</span>
                                <strong>{formatCurrency(deferralAnalysis.selectedEtfNet)}</strong>
                                <p>{simulateAnnualTransfers ? 'Vendiendo y recomprando cada año, con tributación anual de las plusvalías.' : 'Si no vendes hasta el final, el resultado fiscal es prácticamente el mismo.'}</p>
                            </div>
                            <div className="compare-card highlight">
                                <Landmark size={24} />
                                <span>{simulateAnnualTransfers ? 'Ventaja del Fondo' : 'Diferencia Fiscal'}</span>
                                <strong>+{formatCurrency(deferralAnalysis.selectedDifference)}</strong>
                                <p>{simulateAnnualTransfers ? 'Dinero extra por diferir impuestos pese a hacer un cambio al año.' : 'Sin ventas intermedias, ambos vehículos quedan prácticamente igual.'}</p>
                            </div>
                        </div>
                        <div className="tax-sim__comparison-note">
                            <Info size={16} />
                            <p>
                                {simulateAnnualTransfers
                                    ? 'Con el escenario activo, el fondo conserva el diferimiento fiscal en cada traspaso mientras que el ETF sufre una venta fiscal anual equivalente.'
                                    : 'Sin ventas intermedias, el Fondo Traspasable y el ETF buy & hold terminan igual porque ambos tributan solo al final.'}
                            </p>
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
