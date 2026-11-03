import { AcademyReadingHeader } from '../ui/AcademyReadingHeader';
import { AcademyTaxBracket, AcademyTaxHeading, AcademyTaxSectionTitle, AcademyTaxEquation, AcademyTaxTerm, AcademyTaxOperator, AcademyTaxColumns } from '../ui/AcademyTaxReading';
import {AcademyToolLink,AcademyTaxComparison} from '../ui/AcademyToolLink';
import { AcademyGrid } from '../ui/AcademyGrid';
import { AcademyPanel } from '../ui/AcademyPanel';
import { Receipt, ShieldCheck, Landmark, ArrowDownRight, ArrowUpRight, Scale, Calculator, ArrowRight } from 'lucide-react';
import './Taxation.css';

export function Taxation() {
    return (
        <div className="tax-info">
            <AcademyReadingHeader appearance="tax" section="Construir" title={<>Fiscalidad del Inversor</>} description={<>
                    En España, entender cómo tributan tus inversiones es clave para optimizar tu rentabilidad neta.
                    No es lo que ganas, sino lo que te queda después de impuestos.
                </>} />

            <section className="tax-info__brackets">
                <AcademyTaxSectionTitle >1. Base Imponible del Ahorro</AcademyTaxSectionTitle>
                <p>La mayoría de los beneficios por inversiones (dividendos, intereses, ganancias patrimoniales) tributan en la base del ahorro con tipos progresivos.</p>

                <AcademyGrid variant="taxBrackets" className="tax-info__brackets-grid">
                    <AcademyTaxBracket  range={<>Hasta 6.000€</>} rate={<>19%</>} />
                    <AcademyTaxBracket  range={<>6.000€ - 50.000€</>} rate={<>21%</>} />
                    <AcademyTaxBracket  range={<>50.000€ - 200.000€</>} rate={<>23%</>} />
                    <AcademyTaxBracket  range={<>200.000€ - 300.000€</>} rate={<>27%</>} />
                    <AcademyTaxBracket highlight range={<>Más de 300.000€</>} rate={<>30%</>} />
                </AcademyGrid>
            </section>

            <section className="tax-info__compensation">
                <AcademyTaxSectionTitle >2. Compensación de Ganancias y Pérdidas</AcademyTaxSectionTitle>
                <AcademyPanel variant="tax" className="tax-info__card">
                    <AcademyTaxHeading icon={<Scale size={24} className="icon" />} title={<>El escudo fiscal</>} />
                    <p>
                        Si vendes una inversión con pérdidas, puedes restarlas de tus ganancias para pagar menos impuestos.
                        Si el saldo total del año es negativo, tienes hasta <strong>4 años</strong> para compensar esas pérdidas con futuras ganancias.
                    </p>
                    <AcademyTaxEquation >
                        <AcademyTaxTerm  icon={<ArrowUpRight color="#10b981" />}>Ganancia: +1.000€</AcademyTaxTerm>
                        <AcademyTaxOperator>-</AcademyTaxOperator>
                        <AcademyTaxTerm  icon={<ArrowDownRight color="#ef4444" />}>Pérdida: -400€</AcademyTaxTerm>
                        <AcademyTaxOperator>=</AcademyTaxOperator>
                        <AcademyTaxTerm result >Tributas por: 600€</AcademyTaxTerm>
                    </AcademyTaxEquation>
                </AcademyPanel>
            </section>

            <section className="tax-info__comparison">
                <AcademyTaxSectionTitle >3. Fondos vs. ETFs: El "Diferimiento"</AcademyTaxSectionTitle>
                <AcademyTaxColumns >
                    <AcademyTaxComparison kind="fund" icon={<ShieldCheck size={28} />} title={<>Fondos de Inversión</>}>
                            <li><strong>Traspasabilidad:</strong> Puedes mover dinero de un fondo a otro sin pagar impuestos.</li>
                            <li><strong>Interés Compuesto:</strong> Los impuestos que no pagas siguen trabajando para ti.</li>
                            <li><strong>Tributación:</strong> Solo pagas al vender definitivamente (reintegro).</li>
                        </AcademyTaxComparison>
                    <AcademyTaxComparison kind="etf" icon={<Landmark size={28} />} title={<>ETFs / Acciones</>}>
                            <li><strong>Sin Traspaso:</strong> Vender para comprar otro activo implica pasar por Hacienda.</li>
                            <li><strong>Eficiencia:</strong> Menor que los fondos tradicionales en España por la fricción fiscal.</li>
                            <li><strong>Dividendos:</strong> Tributan anualmente al recibirse (retención del 19%).</li>
                        </AcademyTaxComparison>
                </AcademyTaxColumns>
            </section>

            <section className="tax-info__tools" aria-labelledby="tax-tools-title">
                <AcademyTaxSectionTitle id="tax-tools-title">Ponlo en práctica</AcademyTaxSectionTitle>
                <AcademyGrid variant="taxTools" className="tax-info__tools-grid">
                    <AcademyToolLink to="/academy/taxes" variant="tax" icon={<><Receipt size={24} aria-hidden="true" /></>} category={<>Inversiones</>} title={<>Simulador fiscal</>} description={<>Estima los impuestos sobre tus beneficios y compara el efecto del diferimiento fiscal.</>} action={<>Abrir simulador <ArrowRight size={18} aria-hidden="true" /></>} />
                    <AcademyToolLink to="/academy/salary-calculator" variant="tax" icon={<><Calculator size={24} aria-hidden="true" /></>} category={<>Sueldo e IRPF</>} title={<>Calculadora de IRPF y sueldo neto</>} description={<>Estima tu sueldo neto, retención de IRPF y cotizaciones según tu salario, comunidad y situación personal.</>} action={<>Calcular sueldo neto <ArrowRight size={18} aria-hidden="true" /></>} />
                </AcademyGrid>
            </section>
        </div>
    );
}
