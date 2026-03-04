import { Shield, AlertTriangle, Layers, Clock, Globe, BarChart, Zap, Scale, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './RiskManagement.css';

export function RiskManagement() {
    return (
        <div className="risk-mgmt">
            <header className="risk-mgmt__header">
                <h1 className="risk-mgmt__title">Gestión del Riesgo</h1>
                <p className="risk-mgmt__subtitle">
                    Invertir no es evitar el riesgo, sino saber qué riesgos merece la pena correr y cómo proteger tu patrimonio de los que no.
                </p>
            </header>

            <section className="risk-mgmt__vol-vs-risk">
                <h2 className="risk-mgmt__section-title">1. Volatilidad vs. Riesgo Real</h2>
                <div className="risk-mgmt__box">
                    <div className="comparison-item">
                        <div className="icon-badge vol">
                            <BarChart size={24} />
                        </div>
                        <h3>Volatilidad</h3>
                        <p>Es la fluctuación del precio en el corto plazo. Es el "precio de la entrada" para obtener rentabilidad. Si no la soportas, no deberías estar en RV.</p>
                    </div>
                    <div className="divider"></div>
                    <div className="comparison-item">
                        <div className="icon-badge risk">
                            <AlertTriangle size={24} />
                        </div>
                        <h3>Riesgo Real</h3>
                        <p>Es la pérdida permanente de capital. Ocurre por vender en pánico, por invertir en negocios que quiebran o por la inflación devorando tus ahorros.</p>
                    </div>
                </div>
            </section>

            <section className="risk-mgmt__types">
                <h2 className="risk-mgmt__section-title">2. Los 4 Jinetes del Riesgo</h2>
                <div className="risk-types-grid">
                    <div className="risk-type-card">
                        <Zap size={24} className="icon" />
                        <h4>Riesgo de Mercado</h4>
                        <p>Que el mercado entero baje (crisis sistémica). Es inevitable pero temporal.</p>
                    </div>
                    <div className="risk-type-card">
                        <Layers size={24} className="icon" />
                        <h4>Riesgo de Concentración</h4>
                        <p>Poner demasiado capital en un solo activo, sector o país. Se cura con diversificación.</p>
                    </div>
                    <div className="risk-type-card">
                        <Scale size={24} className="icon" />
                        <h4>Riesgo de Inflación</h4>
                        <p>El riesgo de que tu dinero pierda poder adquisitivo. Afecta especialmente al Cash y Bonos.</p>
                    </div>
                    <div className="risk-type-card">
                        <Shield size={24} className="icon" />
                        <h4>Riesgo de Liquidez</h4>
                        <p>No poder vender un activo rápidamente cuando necesitas el dinero (ej. inmuebles).</p>
                    </div>
                </div>
            </section>

            <section className="risk-mgmt__diversification">
                <h2 className="risk-mgmt__section-title">3. Diversificación: El "Almuerzo Gratis"</h2>
                <p>La diversificación es la única forma de reducir el riesgo sin reducir necesariamente la rentabilidad esperada.</p>
                <div className="div-levels">
                    <div className="div-level">
                        <Globe size={28} />
                        <h5>Geográfica</h5>
                        <p>No inviertas solo en tu país. El mundo es grande (USA, Europa, Emergentes).</p>
                    </div>
                    <div className="div-level">
                        <Layers size={28} />
                        <h5>Por Activos</h5>
                        <p>Combina Acciones, Bonos, Oro y Cash según tu perfil.</p>
                    </div>
                    <div className="div-level">
                        <BarChart size={28} />
                        <h5>Por Sectores</h5>
                        <p>Tecnología, Salud, Energía, Consumo... No todos se mueven igual.</p>
                    </div>
                </div>
            </section>

            <section className="risk-mgmt__time">
                <h2 className="risk-mgmt__section-title">4. El Tiempo: El mejor antídoto</h2>
                <div className="time-box">
                    <div className="time-box__content">
                        <p>
                            A corto plazo (1 día/1 mes), la inversión en bolsa es casi azar.
                            Sin embargo, <strong>cuanto mayor es tu horizonte temporal, menor es la probabilidad de perder dinero.</strong>
                        </p>
                        <div className="time-stats">
                            <div className="time-stat">
                                <span className="label">1 Año</span>
                                <span className="value">~25% prob. pérdidas</span>
                            </div>
                            <div className="time-stat">
                                <span className="label">10 Años</span>
                                <span className="value">{'>'}95% prob. ganancias</span>
                            </div>
                            <div className="time-stat">
                                <span className="label">20 Años</span>
                                <span className="value">~100% prob. ganancias</span>
                            </div>
                        </div>
                    </div>
                    <div className="time-box__icon">
                        <Clock size={64} />
                    </div>
                </div>
            </section>

            <section className="risk-mgmt__cta">
                <Shield className="icon" size={48} />
                <h2 className="cta__title">¿Estás asumiendo demasiado riesgo?</h2>
                <p className="cta__desc">
                    Mide tu tolerancia emocional y descubre qué asignación de activos encaja realmente contigo.
                </p>
                <div className="cta__actions">
                    <Link to="/academy/timeline" className="cta__link">
                        Ver mi Journey <ArrowRight size={18} />
                    </Link>
                    <Link to="/academy/portfolio" className="cta__button">
                        Configurar mi Cartera
                    </Link>
                </div>
            </section>
        </div>
    );
}
