import { Receipt, ShieldCheck, Landmark, ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Taxation.css';

export function Taxation() {
    return (
        <div className="tax-info">
            <header className="tax-info__header">
                <h1 className="tax-info__title">Fiscalidad del Inversor</h1>
                <p className="tax-info__subtitle">
                    En España, entender cómo tributan tus inversiones es clave para optimizar tu rentabilidad neta.
                    No es lo que ganas, sino lo que te queda después de impuestos.
                </p>
            </header>

            <section className="tax-info__brackets">
                <h2 className="tax-info__section-title">1. Base Imponible del Ahorro</h2>
                <p>La mayoría de los beneficios por inversiones (dividendos, intereses, ganancias patrimoniales) tributan en la base del ahorro con tipos progresivos.</p>

                <div className="tax-info__brackets-grid">
                    <div className="bracket-card">
                        <span className="bracket-range">Hasta 6.000€</span>
                        <strong className="bracket-rate">19%</strong>
                    </div>
                    <div className="bracket-card">
                        <span className="bracket-range">6.000€ - 50.000€</span>
                        <strong className="bracket-rate">21%</strong>
                    </div>
                    <div className="bracket-card">
                        <span className="bracket-range">50.000€ - 200.000€</span>
                        <strong className="bracket-rate">23%</strong>
                    </div>
                    <div className="bracket-card">
                        <span className="bracket-range">200.000€ - 300.000€</span>
                        <strong className="bracket-rate">27%</strong>
                    </div>
                    <div className="bracket-card highlight">
                        <span className="bracket-range">Más de 300.000€</span>
                        <strong className="bracket-rate">30%</strong>
                    </div>
                </div>
            </section>

            <section className="tax-info__compensation">
                <h2 className="tax-info__section-title">2. Compensación de Ganancias y Pérdidas</h2>
                <div className="tax-info__card">
                    <div className="tax-info__card-header">
                        <Scale size={24} className="icon" />
                        <h3>El escudo fiscal</h3>
                    </div>
                    <p>
                        Si vendes una inversión con pérdidas, puedes restarlas de tus ganancias para pagar menos impuestos.
                        Si el saldo total del año es negativo, tienes hasta <strong>4 años</strong> para compensar esas pérdidas con futuras ganancias.
                    </p>
                    <div className="compensation-viz">
                        <div className="viz-item">
                            <ArrowUpRight color="#10b981" />
                            <span>Ganancia: +1.000€</span>
                        </div>
                        <div className="viz-operator">-</div>
                        <div className="viz-item">
                            <ArrowDownRight color="#ef4444" />
                            <span>Pérdida: -400€</span>
                        </div>
                        <div className="viz-operator">=</div>
                        <div className="viz-item result">
                            <span>Tributas por: 600€</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="tax-info__comparison">
                <h2 className="tax-info__section-title">3. Fondos vs. ETFs: El "Diferimiento"</h2>
                <div className="tax-info__two-cols">
                    <div className="comparison-card fund">
                        <div className="header">
                            <ShieldCheck size={28} />
                            <h3>Fondos de Inversión</h3>
                        </div>
                        <ul>
                            <li><strong>Traspasabilidad:</strong> Puedes mover dinero de un fondo a otro sin pagar impuestos.</li>
                            <li><strong>Interés Compuesto:</strong> Los impuestos que no pagas siguen trabajando para ti.</li>
                            <li><strong>Tributación:</strong> Solo pagas al vender definitivamente (reintegro).</li>
                        </ul>
                    </div>
                    <div className="comparison-card etf">
                        <div className="header">
                            <Landmark size={28} />
                            <h3>ETFs / Acciones</h3>
                        </div>
                        <ul>
                            <li><strong>Sin Traspaso:</strong> Vender para comprar otro activo implica pasar por Hacienda.</li>
                            <li><strong>Eficiencia:</strong> Menor que los fondos tradicionales en España por la fricción fiscal.</li>
                            <li><strong>Dividendos:</strong> Tributan anualmente al recibirse (retención del 19%).</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="tax-info__cta">
                <Receipt className="icon" size={48} />
                <h2 className="cta__title">¿Quieres ver el impacto real?</h2>
                <p className="cta__desc">
                    Calcula cuánto pagarías exactamente por tus beneficios y descubre el ahorro potencial que supone el diferimiento fiscal.
                </p>
                <Link to="/academy/taxes" className="cta__button">
                    Ir al Simulador Fiscal <ArrowUpRight size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
                </Link>
            </section>
        </div>
    );
}
