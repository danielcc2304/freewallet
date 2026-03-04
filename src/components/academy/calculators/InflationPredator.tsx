import { useState } from 'react';
import {
    Ghost, TrendingDown,
    ArrowLeft, Info, Lightbulb, TrendingUp,
    DollarSign, Calendar, Percent
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './InflationPredator.css';

export function InflationPredator() {
    const navigate = useNavigate();
    const [amount, setAmount] = useState<number>(10000);
    const [years, setYears] = useState<number>(10);
    const [inflation, setInflation] = useState<number>(3);

    // Calculation: P = Amount / (1 + r)^n
    const r = inflation / 100;
    const n = years;
    const purchasingPower = amount / Math.pow(1 + r, n);
    const loss = amount - purchasingPower;
    const lossPercentage = (loss / amount) * 100;

    // Visual scale factor (from 1 to 0.2)
    const scaleFactor = Math.max(0.2, (purchasingPower / amount));
    const opacityFactor = Math.max(0.4, (purchasingPower / amount));

    return (
        <div className="inflation-predator">
            <button onClick={() => navigate(-1)} className="valuation-guide__back" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '2rem' }}>
                <ArrowLeft size={18} /> Volver a Fundamentos
            </button>

            <header className="inflation-predator__hero">
                <h1>El Depredador Silencioso</h1>
                <p>
                    La inflación no te quita billetes de la cartera, pero les quita su poder.
                    Mira cómo desaparece el valor de tu dinero si decides NO invertirlo.
                </p>
            </header>

            <div className="inflation-predator__grid">
                <aside className="inflation-predator__controls">
                    <div className="calc__input-group">
                        <label htmlFor="amount">Capital Inicial</label>
                        <div className="calc__input-wrapper">
                            <DollarSign size={18} />
                            <input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                min="1000"
                                step="1000"
                            />
                            <span className="unit">€</span>
                        </div>
                        <input
                            type="range"
                            min="1000"
                            max="100000"
                            step="1000"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="custom-slider"
                            style={{ '--progress': `${(amount / 100000) * 100}%` } as any}
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
                                onChange={(e) => setYears(Number(e.target.value))}
                                min="1"
                                max="40"
                                step="1"
                            />
                            <span className="unit">años</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="40"
                            step="1"
                            value={years}
                            onChange={(e) => setYears(Number(e.target.value))}
                            className="custom-slider"
                            style={{ '--progress': `${((years - 1) / (40 - 1)) * 100}%` } as any}
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
                                onChange={(e) => setInflation(Number(e.target.value))}
                                min="0.5"
                                max="15"
                                step="0.5"
                            />
                            <span className="unit">%</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="15"
                            step="0.5"
                            value={inflation}
                            onChange={(e) => setInflation(Number(e.target.value))}
                            className="custom-slider"
                            style={{ '--progress': `${((inflation - 0.5) / (15 - 0.5)) * 100}%` } as any}
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
                    <div className="money-display">
                        <div
                            className={`ghost-overlay ${inflation > 5 ? 'ghost-overlay--active' : ''}`}
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
                            En {years} años, con esos {amount.toLocaleString()} € <br />
                            <strong>solo podrás comprar lo que hoy valdría {purchasingPower.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</strong>.
                        </div>

                        <div className="loss-tag">
                            <TrendingDown size={18} style={{ marginRight: '8px' }} />
                            Pérdida de valor: -{lossPercentage.toFixed(1)}%
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
                </main>
            </div>
        </div>
    );
}

export default InflationPredator;
