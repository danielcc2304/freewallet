import { Link } from 'react-router-dom';
import { Calculator, TrendingUp, Target, Calendar, PiggyBank, Percent } from 'lucide-react';
import './Calculators.css';

export function Calculators() {
    return (
        <div className="calculators">
            <header className="calculators__header">
                <h1 className="calculators__title">Calculadoras Financieras</h1>
                <p className="calculators__description">
                    Herramientas interactivas para planificar tu futuro financiero.
                </p>
            </header>

            <div className="calculators__disclaimer">
                ⚠️ <strong>Importante:</strong> Estas calculadoras asumen rentabilidades constantes, lo cual no refleja
                la realidad del mercado. Úsalas solo como herramientas educativas y orientativas.
            </div>

            <div className="calculators__grid">
                {/* Compound Interest - IMPLEMENTED */}
                <Link to="/academy/compound-interest" className="calculators__card calculators__card--available">
                    <div className="calculators__card-icon calculators__card-icon--green">
                        <TrendingUp size={32} />
                    </div>
                    <h3 className="calculators__card-title">Interés Compuesto</h3>
                    <p className="calculators__card-description">
                        Visualiza el crecimiento de tu capital a largo plazo.
                        Incluye aportaciones regulares y opciones de retirada.
                    </p>
                    <ul className="calculators__card-features">
                        <li>✓ Cálculo de capital final</li>
                        <li>✓ Tiempo para alcanzar objetivo</li>
                        <li>✓ Aportación necesaria</li>
                        <li>✓ Gráficos en tiempo real</li>
                    </ul>
                    <span className="calculators__card-badge calculators__card-badge--available">Disponible</span>
                </Link>

                {/* FIRE Calculator - IMPLEMENTED */}
                <Link to="/academy/fire-calculator" className="calculators__card calculators__card--available">
                    <div className="calculators__card-icon calculators__card-icon--blue">
                        <Target size={32} />
                    </div>
                    <h3 className="calculators__card-title">Independencia Financiera (FIRE)</h3>
                    <p className="calculators__card-description">
                        Calcula cuánto necesitas ahorrar para alcanzar la independencia financiera.
                        Basado en la regla del 4%.
                    </p>
                    <ul className="calculators__card-features">
                        <li>✓ Años hasta FIRE</li>
                        <li>✓ Capital necesario</li>
                        <li>✓ Tasa de ahorro óptima</li>
                        <li>✓ Simulación de gastos</li>
                    </ul>
                    <span className="calculators__card-badge calculators__card-badge--available">Disponible</span>
                </Link>

                {/* Retirement Calculator - IN PROCESS */}
                <Link to="/academy/retirement" className="calculators__card calculators__card--soon">
                    <div className="calculators__card-icon calculators__card-icon--purple">
                        <Calendar size={32} />
                    </div>
                    <h3 className="calculators__card-title">Planificador de Jubilación</h3>
                    <p className="calculators__card-description">
                        Planifica tu jubilación con proyecciones realistas ajustadas por inflación.
                    </p>
                    <ul className="calculators__card-features">
                        <li>• Ahorro mensual necesario</li>
                        <li>• Comparativa con pensión pública</li>
                        <li>• Ajuste por inflación</li>
                        <li>• Diferentes escenarios</li>
                    </ul>
                    <span className="calculators__card-badge calculators__card-badge--soon">Próximamente</span>
                </Link>

                {/* Emergency Fund - IN PROCESS */}
                <Link to="/academy/emergency-fund" className="calculators__card calculators__card--soon">
                    <div className="calculators__card-icon calculators__card-icon--orange">
                        <PiggyBank size={32} />
                    </div>
                    <h3 className="calculators__card-title">Fondo de Emergencia</h3>
                    <p className="calculators__card-description">
                        Calcula el colchón financiero que necesitas según tu situación personal.
                    </p>
                    <ul className="calculators__card-features">
                        <li>• Meses de gastos recomendados</li>
                        <li>• Evaluación de riesgos</li>
                        <li>• Prioridad vs inversión</li>
                        <li>• Consejos personalizados</li>
                    </ul>
                    <span className="calculators__card-badge calculators__card-badge--soon">Próximamente</span>
                </Link>

                {/* Tax Impact - IN PROCESS */}
                <Link to="/academy/taxes" className="calculators__card calculators__card--soon">
                    <div className="calculators__card-icon calculators__card-icon--red">
                        <Percent size={32} />
                    </div>
                    <h3 className="calculators__card-title">Simulador de Impacto Fiscal</h3>
                    <p className="calculators__card-description">
                        Estima el impacto fiscal de tus inversiones (contexto español).
                    </p>
                    <ul className="calculators__card-features">
                        <li>• IRPF sobre ganancias</li>
                        <li>• Comparación fondos vs ETFs</li>
                        <li>• Compensación minusvalías</li>
                        <li>• Ejemplos prácticos</li>
                    </ul>
                    <span className="calculators__card-badge calculators__card-badge--soon">Próximamente</span>
                </Link>

                {/* Asset Allocation - IN PROCESS */}
                <Link to="/academy/asset-allocation" className="calculators__card calculators__card--soon">
                    <div className="calculators__card-icon calculators__card-icon--teal">
                        <Calculator size={32} />
                    </div>
                    <h3 className="calculators__card-title">Simulador de Cartera</h3>
                    <p className="calculators__card-description">
                        Prueba diferentes combinaciones de activos y visualiza riesgo/rentabilidad esperados.
                    </p>
                    <ul className="calculators__card-features">
                        <li>• Asset allocation personalizado</li>
                        <li>• Riesgo esperado</li>
                        <li>• Rentabilidad histórica</li>
                        <li>• Necesidad de rebalanceo</li>
                    </ul>
                    <span className="calculators__card-badge calculators__card-badge--soon">Próximamente</span>
                </Link>
            </div>

            <div className="calculators__footer">
                <h3>¿Qué calculadora debería usar primero?</h3>
                <div className="calculators__recommendations">
                    <div className="calculators__recommendation">
                        <strong>🟢 Principiante:</strong>
                        <p>Empieza con <strong>Interés Compuesto</strong> para entender el poder del crecimiento exponencial.</p>
                    </div>
                    <div className="calculators__recommendation">
                        <strong>🟡 Intermedio:</strong>
                        <p>Salta a <strong>FIRE</strong> o <strong>Jubilación</strong> si ya tienes un colchón y quieres objetivos claros.</p>
                    </div>
                    <div className="calculators__recommendation">
                        <strong>🔴 Avanzado:</strong>
                        <p>Usa <strong>Impacto Fiscal</strong> y <strong>Simulador de Cartera</strong> para optimizar tu estrategia.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
