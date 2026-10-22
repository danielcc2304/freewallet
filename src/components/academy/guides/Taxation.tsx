import { AcademyGrid } from '../ui/AcademyGrid';
import { AcademyPanel, AcademyLinkCard } from '../ui/AcademyPanel';
import { Receipt, ShieldCheck, Landmark, ArrowDownRight, ArrowUpRight, Scale, Calculator, ArrowRight } from 'lucide-react';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import './Taxation.css';

export function Taxation() {
    return (
        <div className="tax-info">
            <AcademyPageHeader className="tax-info__header" section="Construir">
                <h1 className="tax-info__title">Fiscalidad del Inversor</h1>
                <p className="tax-info__subtitle">
                    En España, entender cómo tributan tus inversiones es clave para optimizar tu rentabilidad neta.
                    No es lo que ganas, sino lo que te queda después de impuestos.
                </p>
            </AcademyPageHeader>

            <section className="tax-info__brackets">
                <h2 className="tax-info__section-title">1. Base Imponible del Ahorro</h2>
                <p>La mayoría de los beneficios por inversiones (dividendos, intereses, ganancias patrimoniales) tributan en la base del ahorro con tipos progresivos.</p>

                <AcademyGrid variant="taxBrackets" className="tax-info__brackets-grid">
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
                </AcademyGrid>
            </section>

            <section className="tax-info__compensation">
                <h2 className="tax-info__section-title">2. Compensación de Ganancias y Pérdidas</h2>
                <AcademyPanel variant="tax" className="tax-info__card">
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
                </AcademyPanel>
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

            <section className="tax-info__tools" aria-labelledby="tax-tools-title">
                <h2 id="tax-tools-title" className="tax-info__section-title">Ponlo en práctica</h2>
                <AcademyGrid variant="taxTools" className="tax-info__tools-grid">
                    <AcademyLinkCard variant="taxTool" to="/academy/taxes" className="tax-info__tool-card">
                        <span className="tax-info__tool-icon"><Receipt size={24} aria-hidden="true" /></span>
                        <span className="tax-info__tool-category">Inversiones</span>
                        <h3>Simulador fiscal</h3>
                        <p>Estima los impuestos sobre tus beneficios y compara el efecto del diferimiento fiscal.</p>
                        <span className="tax-info__tool-action">Abrir simulador <ArrowRight size={18} aria-hidden="true" /></span>
                    </AcademyLinkCard>
                    <AcademyLinkCard variant="taxTool" to="/academy/salary-calculator" className="tax-info__tool-card">
                        <span className="tax-info__tool-icon"><Calculator size={24} aria-hidden="true" /></span>
                        <span className="tax-info__tool-category">Sueldo e IRPF</span>
                        <h3>Calculadora de IRPF y sueldo neto</h3>
                        <p>Estima tu sueldo neto, retención de IRPF y cotizaciones según tu salario, comunidad y situación personal.</p>
                        <span className="tax-info__tool-action">Calcular sueldo neto <ArrowRight size={18} aria-hidden="true" /></span>
                    </AcademyLinkCard>
                </AcademyGrid>
            </section>
        </div>
    );
}
