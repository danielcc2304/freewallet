import { useState, useMemo } from 'react';
import { PiggyBank, ShieldCheck, AlertCircle, TrendingUp, HelpCircle, Home, Utensils, Zap, Plus, Users } from 'lucide-react';
import './EmergencyFundCalculator.css';

export function EmergencyFundCalculator() {
    // Inputs
    const [monthlyRent, setMonthlyRent] = useState<number | string>(800);
    const [monthlyFood, setMonthlyFood] = useState<number | string>(400);
    const [monthlyBills, setMonthlyBills] = useState<number | string>(200);
    const [monthlyOther, setMonthlyOther] = useState<number | string>(300);

    // Risk factors
    const [jobStability, setJobStability] = useState('high'); // high, medium, low
    const [dependents, setDependents] = useState<number | string>(0);
    const [currentSavings, setCurrentSavings] = useState<number | string>(1000);

    // Numeric versions
    const rentNum = Number(monthlyRent) || 0;
    const foodNum = Number(monthlyFood) || 0;
    const billsNum = Number(monthlyBills) || 0;
    const otherNum = Number(monthlyOther) || 0;
    const savingsNum = Number(currentSavings) || 0;
    const dependentsNum = Number(dependents) || 0;

    // Calculations
    const totalExpenses = rentNum + foodNum + billsNum + otherNum;

    // Multiplier logic
    const monthsMultiplier = useMemo(() => {
        let base = 3;
        if (jobStability === 'medium') base += 3;
        if (jobStability === 'low') base += 6;
        if (dependentsNum > 0) base += Math.min(dependentsNum * 1, 3);
        return Math.min(base, 12); // Cap at 12 months
    }, [jobStability, dependentsNum]);

    const recommendedAmount = totalExpenses * monthsMultiplier;
    const progressPercent = recommendedAmount > 0 ? Math.min((savingsNum / recommendedAmount) * 100, 100) : 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="emergency">
            <header className="emergency__header">
                <div className="emergency__title-group">
                    <div className="emergency__icon-container">
                        <PiggyBank className="emergency__title-icon" />
                    </div>
                    <div>
                        <h1 className="emergency__title">Fondo de Emergencia</h1>
                        <p className="emergency__subtitle">El colchón que te permite dormir tranquilo.</p>
                    </div>
                </div>
            </header>

            <div className="emergency__grid">
                <section className="emergency__inputs">
                    <div className="emergency__card">
                        <h3 className="emergency__card-title">Tus Gastos Mensuales</h3>
                        <div className="emergency__input-list">
                            <div className="calc__input-group">
                                <label>Vivienda (Alquiler/Hipoteca)</label>
                                <div className="calc__input-wrapper">
                                    <Home size={18} />
                                    <input type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value === '' ? '' : Number(e.target.value))} />
                                    <span className="unit">€</span>
                                </div>
                            </div>
                            <div className="calc__input-group">
                                <label>Alimentación</label>
                                <div className="calc__input-wrapper">
                                    <Utensils size={18} />
                                    <input type="number" value={monthlyFood} onChange={(e) => setMonthlyFood(e.target.value === '' ? '' : Number(e.target.value))} />
                                    <span className="unit">€</span>
                                </div>
                            </div>
                            <div className="calc__input-group">
                                <label>Suministros (Luz, Agua, Internet)</label>
                                <div className="calc__input-wrapper">
                                    <Zap size={18} />
                                    <input type="number" value={monthlyBills} onChange={(e) => setMonthlyBills(e.target.value === '' ? '' : Number(e.target.value))} />
                                    <span className="unit">€</span>
                                </div>
                            </div>
                            <div className="calc__input-group">
                                <label>Otros Gastos Fijos</label>
                                <div className="calc__input-wrapper">
                                    <Plus size={18} />
                                    <input type="number" value={monthlyOther} onChange={(e) => setMonthlyOther(e.target.value === '' ? '' : Number(e.target.value))} />
                                    <span className="unit">€</span>
                                </div>
                            </div>
                        </div>
                        <div className="emergency__total-expenses">
                            <span>Gastos Totales:</span>
                            <strong>{formatCurrency(totalExpenses)}/mes</strong>
                        </div>
                    </div>

                    <div className="emergency__card">
                        <h3 className="emergency__card-title">Perfil de Riesgo</h3>
                        <div className="emergency__input-list">
                            <div className="calc__input-group">
                                <label>Estabilidad Laboral</label>
                                <div className="calc__input-wrapper">
                                    <ShieldCheck size={18} />
                                    <select value={jobStability} onChange={(e) => setJobStability(e.target.value)}>
                                        <option value="high">Alta (Estable)</option>
                                        <option value="medium">Media (Empleado)</option>
                                        <option value="low">Baja (Autónomo)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="calc__input-group">
                                <label>Personas a tu cargo</label>
                                <div className="calc__input-wrapper">
                                    <Users size={18} />
                                    <input type="number" min="0" value={dependents} onChange={(e) => setDependents(e.target.value === '' ? '' : Number(e.target.value))} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="emergency__card">
                        <h3 className="emergency__card-title">Estado Actual</h3>
                        <div className="calc__input-group">
                            <label>Dinero ahorrado para el fondo</label>
                            <div className="calc__input-wrapper">
                                <PiggyBank size={18} />
                                <input type="number" value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value === '' ? '' : Number(e.target.value))} />
                                <span className="unit">€</span>
                            </div>
                        </div>
                    </div>
                </section>

                <main className="emergency__results">
                    <div className="emergency__recommendation-box">
                        <div className="emergency__rec-header">
                            <ShieldCheck className="emergency__rec-icon" />
                            <h3>Recomendación de Seguridad</h3>
                        </div>
                        <div className="emergency__rec-main">
                            <div className="emergency__rec-amount">
                                <span className="label">Tu Fondo Objetivo:</span>
                                <span className="value">{formatCurrency(recommendedAmount)}</span>
                            </div>
                            <div className="emergency__rec-months">
                                <span className="label">Equivalente a:</span>
                                <span className="value">{monthsMultiplier} meses</span>
                            </div>
                        </div>

                        <div className="emergency__progress-section">
                            <div className="emergency__progress-labels">
                                <span>Progreso: {formatCurrency(savingsNum)}</span>
                                <span>{progressPercent.toFixed(0)}%</span>
                            </div>
                            <div className="emergency__progress-bar">
                                <div
                                    className="emergency__progress-fill"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="emergency__insights">
                        <div className="emergency__insight-card">
                            <AlertCircle className="blue" />
                            <div>
                                <h4>¿Por qué {monthsMultiplier} meses?</h4>
                                <p>
                                    Basado en tu estabilidad <strong>{jobStability === 'high' ? 'alta' : jobStability === 'medium' ? 'media' : 'baja'}</strong>
                                    {dependentsNum > 0 ? ` y en tener ${dependentsNum} personas a tu cargo, ` : ' y tu situación personal, '}
                                    este colchón te protege ante imprevistos graves.
                                </p>
                            </div>
                        </div>

                        <div className="emergency__insight-card">
                            <TrendingUp className="green" />
                            <div>
                                <h4>Siguiente Paso</h4>
                                <p>
                                    {progressPercent < 100
                                        ? `Te faltan ${formatCurrency(recommendedAmount - savingsNum)} para completar tu tranquilidad.`
                                        : '¡Felicidades! Tienes tu fondo completo. Ahora puedes centrarte en la inversión a largo plazo.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="emergency__theory">
                        <h4 className="emergency__theory-title">
                            <HelpCircle size={18} /> ¿Dónde guardar este dinero?
                        </h4>
                        <div className="emergency__theory-grid">
                            <div className="theory-item">
                                <strong>Disponibilidad Total:</strong>
                                <p>Debe ser dinero accesible en menos de 48h (cuenta remunerada o fondo monetario).</p>
                            </div>
                            <div className="theory-item">
                                <strong>Riesgo Cero:</strong>
                                <p>Nunca inviertas este dinero en activos volátiles (cripto, bolsa).</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
