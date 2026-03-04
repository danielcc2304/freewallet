import { BarChart3, TrendingUp, Zap, Repeat, Target, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Strategies.css';

export function Strategies() {
    return (
        <div className="strategies">
            <header className="strategies__header">
                <h1 className="strategies__title">Estrategias de Inversión</h1>
                <p className="strategies__subtitle">
                    No existe una "mejor" estrategia universal, pero sí una que se adapta mejor a tus objetivos y temperamento.
                    Elige tu camino y mantén el rumbo.
                </p>
            </header>

            <section className="strategies__active-passive">
                <h2 className="strategies__section-title">1. Gestión Pasiva vs. Activa</h2>
                <div className="strategies__comparison-grid">
                    <div className="strategy-card passive">
                        <div className="strategy-card__header">
                            <ShieldCheck size={32} />
                            <h3>Gestión Pasiva (Indexación)</h3>
                        </div>
                        <p>Busca replicar un índice (como el S&P 500) en lugar de batirlo.</p>
                        <ul>
                            <li><strong>Costes:</strong> Muy bajos (0.1% - 0.3%).</li>
                            <li><strong>Esfuerzo:</strong> Mínimo, apto para el 99% de los inversores.</li>
                            <li><strong>Filosofía:</strong> "Si no puedes con el mercado, únete a él".</li>
                        </ul>
                    </div>
                    <div className="strategy-card active">
                        <div className="strategy-card__header">
                            <Zap size={32} />
                            <h3>Gestión Activa</h3>
                        </div>
                        <p>Un gestor elige activos específicos para intentar obtener retornos superiores al mercado.</p>
                        <ul>
                            <li><strong>Costes:</strong> Altos (1.5% - 2.5%).</li>
                            <li><strong>Riesgo:</strong> Posibilidad de batir al mercado... o quedar muy por debajo.</li>
                            <li><strong>Filosofía:</strong> Búsqueda de ineficiencias y "alfa".</li>
                        </ul>
                    </div>
                </div>
                <div className="strategies__insight">
                    <HelpCircle size={20} />
                    <p>Históricamente, más del 90% de los fondos activos no consiguen batir a su índice de referencia a 10 años vista tras comisiones.</p>
                </div>
            </section>

            <section className="strategies__entry">
                <h2 className="strategies__section-title">2. ¿Cómo entrar al mercado?</h2>
                <div className="strategies__entry-grid">
                    <div className="entry-method">
                        <div className="entry-method__icon">
                            <Repeat size={24} />
                        </div>
                        <div className="entry-method__content">
                            <h3>DCA (Dollar Cost Averaging)</h3>
                            <p>Invertir una cantidad fija cada mes, independientemente de si el mercado sube o baja.</p>
                            <span className="badge">Recomendado para la mayoría</span>
                        </div>
                    </div>
                    <div className="entry-method">
                        <div className="entry-method__icon">
                            <Target size={24} />
                        </div>
                        <div className="entry-method__content">
                            <h3>Lump Sum</h3>
                            <p>Invertir todo el capital disponible de una sola vez.</p>
                            <span className="badge warning">Mayor riesgo emocional</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="strategies__rebalancing">
                <h2 className="strategies__section-title">3. El Rebalanceo: La clave de la Disciplina</h2>
                <div className="rebalancing-box">
                    <div className="rebalancing-box__text">
                        <p>
                            Con el tiempo, los activos que más suben ganan peso en tu cartera, aumentando tu riesgo.
                            <strong> Rebalancear</strong> significa vender lo que ha subido y comprar lo que ha bajado para
                            volver a tu asignación original.
                        </p>
                        <div className="rebalancing-steps">
                            <div className="step">
                                <span className="step-num">1</span>
                                <span>Define tu allocation (ej. 60/40)</span>
                            </div>
                            <div className="step">
                                <span className="step-num">2</span>
                                <span>Revisa una vez al año</span>
                            </div>
                            <div className="step">
                                <span className="step-num">3</span>
                                <span>Ajusta desviaciones {'>'} 5%</span>
                            </div>
                        </div>
                    </div>
                    <div className="rebalancing-box__icon">
                        <BarChart3 size={64} />
                    </div>
                </div>
            </section>

            <section className="strategies__cta">
                <TrendingUp className="icon" size={48} />
                <h2 className="cta__title">Diseña tu propia estrategia</h2>
                <p className="cta__desc">
                    No dejes tu futuro al azar. Utiliza nuestras calculadoras para proyectar tu libertad financiera según tu estrategia.
                </p>
                <div className="cta__buttons">
                    <Link to="/academy/fire-calculator" className="cta__button">
                        Plan FIRE <ArrowRight size={18} />
                    </Link>
                    <Link to="/academy/compound-interest" className="cta__button secondary">
                        Interés Compuesto <ArrowRight size={18} />
                    </Link>
                </div>
            </section>
        </div>
    );
}
