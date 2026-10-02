import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
    Ghost, TrendingDown,
    ArrowLeft, Info, Lightbulb, TrendingUp,
    Banknote, Calendar, Percent
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { validateCalculatorInputs } from './calculatorValidation';
import './InflationPredator.css';

interface InflationPredatorStorage {
    amount: number | string;
    years: number | string;
    inflation: number | string;
}

const INFLATION_PREDATOR_STORAGE_KEY = 'freewallet_inflation_predator';

function readStoredInflationPredator(): Partial<InflationPredatorStorage> {
    if (typeof window === 'undefined') return {};

    try {
        const raw = window.localStorage.getItem(INFLATION_PREDATOR_STORAGE_KEY);
        if (!raw) return {};

        const stored = JSON.parse(raw) as unknown;
        return stored && typeof stored === 'object'
            ? stored as Partial<InflationPredatorStorage>
            : {};
    } catch {
        return {};
    }
}

export function InflationPredator() {
    const navigate = useNavigate();
    const stored = useMemo(() => readStoredInflationPredator(), []);
    const [amount, setAmount] = useState<number | string>(stored.amount ?? 10000);
    const [years, setYears] = useState<number | string>(stored.years ?? 10);
    const [inflation, setInflation] = useState<number | string>(stored.inflation ?? 3);

    useEffect(() => {
        const payload: InflationPredatorStorage = { amount, years, inflation };
        try {
            localStorage.setItem(INFLATION_PREDATOR_STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // Ignore localStorage failures.
        }
    }, [amount, years, inflation]);

    // Calculation: P = Amount / (1 + r)^n
    const amountNum = Number(amount) || 0;
    const yearsNum = Number(years) || 0;
    const inflationNum = Number(inflation) || 0;
    const r = inflationNum / 100;
    const n = yearsNum;
    const calculationError = validateCalculatorInputs([
        { label: 'Capital inicial', value: amount },
        { label: 'Plazo', value: years, max: 100, integer: true },
        { label: 'Inflación', value: inflation, min: -99, max: 100 },
    ]);
    const purchasingPower = calculationError ? 0 : amountNum / Math.pow(1 + r, n);
    const loss = amountNum - purchasingPower;
    const lossPercentage = amountNum > 0 ? (loss / amountNum) * 100 : 0;

    // Visual scale factor (from 1 to 0.2)
    const scaleFactor = amountNum > 0 ? Math.max(0.2, Math.min(1, purchasingPower / amountNum)) : 1;
    const opacityFactor = amountNum > 0 ? Math.max(0.4, Math.min(1, purchasingPower / amountNum)) : 1;

    return (
        <div className="inflation-predator">
            <button onClick={() => navigate(-1)} className="valuation-guide__back" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '2rem' }}>
                <ArrowLeft size={18} /> Volver a Fundamentos
            </button>

            <AcademyPageHeader className="inflation-predator__hero" section="Escenarios">
                <h1>El Depredador Silencioso</h1>
                <p>
                    La inflación no te quita billetes de la cartera, pero les quita su poder.
                    Mira cómo desaparece el valor de tu dinero si decides NO invertirlo.
                </p>
            </AcademyPageHeader>

            <div className="inflation-predator__grid">
                <aside className="inflation-predator__controls">
                    <div className="calc__input-group">
                        <label htmlFor="amount">Capital Inicial</label>
                        <div className="calc__input-wrapper">
                            <Banknote size={18} />
                            <input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                min="0"
                                step="any"
                            />
                            <span className="unit">€</span>
                        </div>
                        <input
                            type="range"
                            min="1000"
                            max="100000"
                            step="1000"
                            aria-label="Capital inicial (deslizador)"
                            value={amountNum}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="custom-slider"
                            style={{ '--progress': `${Math.max(0, Math.min(100, (amountNum / 100000) * 100))}%` } as CSSProperties}
                        />
                    </div>

                    <div className="calc__input-group">
                        <label htmlFor="years">Tiempo (Años)</label>
                        <div className="calc__input-wrapper">
                            <Calendar size={18} />
                            <input
                                id="years"
                                type="number"
                                value={years}
                                onChange={(e) => setYears(e.target.value === '' ? '' : Number(e.target.value))}
                                min="0"
                                max="100"
                                step="1"
                            />
                            <span className="unit">años</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="40"
                            step="1"
                            aria-label="Tiempo en años (deslizador)"
                            value={yearsNum}
                            onChange={(e) => setYears(Number(e.target.value))}
                            className="custom-slider"
                            style={{ '--progress': `${Math.max(0, Math.min(100, ((yearsNum - 1) / 39) * 100))}%` } as CSSProperties}
                        />
                    </div>

                    <div className="calc__input-group">
                        <label htmlFor="inflation">Inflación Anual Media</label>
                        <div className="calc__input-wrapper">
                            <Percent size={18} />
                            <input
                                id="inflation"
                                type="number"
                                value={inflation}
                                onChange={(e) => setInflation(e.target.value === '' ? '' : Number(e.target.value))}
                                min="-99"
                                max="100"
                                step="any"
                            />
                            <span className="unit">%</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="15"
                            step="0.5"
                            aria-label="Inflación anual (deslizador)"
                            value={inflationNum}
                            onChange={(e) => setInflation(Number(e.target.value))}
                            className="custom-slider"
                            style={{ '--progress': `${Math.max(0, Math.min(100, ((inflationNum - 0.5) / 14.5) * 100))}%` } as CSSProperties}
                        />
                    </div>

                    <div className="inflation-info">
                        <h3><Info size={18} /> ¿Sabías que?</h3>
                        <p>
                            El objetivo oficial del Banco Central Europeo es una inflación del 2%.
                            Incluso a ese ritmo "bajo", tu dinero pierde casi la mitad de su valor en 35 años.
                        </p>
                    </div>
                </aside>

                <main className="inflation-predator__visualizer">
                    {calculationError ? <p role="alert">{calculationError}</p> : <>
                    <div className="money-display">
                        <div
                            className={`ghost-overlay ${inflationNum > 5 ? 'ghost-overlay--active' : ''}`}
                        >
                            <Ghost size={60} />
                        </div>

                        {/* Final Visual Value (Wad of money) */}
                        <div
                            className="bill-stack"
                            style={{
                                transform: `scale(${scaleFactor})`,
                                opacity: opacityFactor,
                                filter: `grayscale(${(1 - scaleFactor) * 80}%)`
                            }}
                        >
                        </div>
                    </div>

                    <div className="visual-result">
                        <div className="result-sub">Tu poder de compra será de:</div>
                        <div className="result-main">
                            {purchasingPower.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €
                        </div>
                        <div className="result-sub">
                            En {yearsNum} años, con esos {amountNum.toLocaleString('es-ES')} € <br />
                            <strong>solo podrás comprar lo que hoy valdría {purchasingPower.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</strong>.
                        </div>

                        <div className="loss-tag">
                            <TrendingDown size={18} style={{ marginRight: '8px' }} />
                            {lossPercentage < 0 ? 'Ganancia de poder de compra' : 'Pérdida de valor'}: {(-lossPercentage).toLocaleString('es-ES', { maximumFractionDigits: 1, signDisplay: 'exceptZero' })}%
                        </div>
                    </div>

                    <div className="inflation-predator__cta-box">
                        <Lightbulb size={24} color="var(--accent-primary)" className="icon" />
                        <div className="cta-text">
                            <h4>La solución: Invertir</h4>
                            <p>
                                Invertir no es opcional si quieres mantener tu nivel de vida futuro.
                            </p>
                        </div>
                        <Link to="/academy/compound-interest" className="quiz-button">
                            Combatir Inflación <TrendingUp size={16} />
                        </Link>
                    </div>
                    </>}
                </main>
            </div>
        </div>
    );
}

export default InflationPredator;
