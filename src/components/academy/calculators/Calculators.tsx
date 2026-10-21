import { CalculatorTile } from './CalculatorTile';
import { Calculator, TrendingUp, Flame, Calendar, PiggyBank, Receipt, Scale } from 'lucide-react';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { cn } from '../../../utils/cn';
import { calculatorCatalogStyles as styles } from './calculatorCatalogStyles';

export function Calculators() {
    return (
        <div className={cn("calculators", styles["calculators"])}>
            <AcademyPageHeader className={cn("calculators__header", styles["calculators__header"])} section="Herramientas">
                <h1 className={cn("calculators__title", styles["calculators__title"])}>Calculadoras Financieras</h1>
                <p className={cn("calculators__description", styles["calculators__description"])}>
                    Herramientas interactivas para planificar tu futuro financiero.
                </p>
            </AcademyPageHeader>

            <div className={cn("calculators__disclaimer", styles["calculators__disclaimer"])}>
                Las simulaciones son orientativas. En las proyecciones de inversión se asumen rentabilidades constantes;
                cada herramienta detalla sus reglas y alcance.
            </div>

            <div className={cn("calculators__grid", styles["calculators__grid"])}>
                {/* Compound Interest - IMPLEMENTED */}
                <CalculatorTile to="/academy/compound-interest" tone="green" icon={<TrendingUp size={32} />}
                    title="Interés Compuesto"
                    description="Visualiza el crecimiento de tu capital a largo plazo. Incluye aportaciones regulares y opciones de retirada."
                    features={["✓ Cálculo de capital final","✓ Tiempo para alcanzar objetivo","✓ Aportación necesaria","✓ Gráficos en tiempo real"]} />

                {/* FIRE Calculator - IMPLEMENTED */}
                <CalculatorTile to="/academy/fire-calculator" tone="orange-fire" icon={<Flame size={32} />}
                    title="Independencia Financiera (FIRE)"
                    description="Calcula cuánto necesitas ahorrar para alcanzar la independencia financiera. Basado en la regla del 4%."
                    features={["✓ Años hasta FIRE","✓ Capital necesario","✓ Tasa de ahorro óptima","✓ Simulación de gastos"]} />

                {/* Retirement Calculator - IMPLEMENTED */}
                <CalculatorTile to="/academy/retirement" tone="purple" icon={<Calendar size={32} />}
                    title="Planificador de Jubilación"
                    description="Planifica tu jubilación con proyecciones realistas ajustadas por inflación."
                    features={["✓ Ahorro mensual necesario","✓ Comparativa con pensión pública","✓ Ajuste por inflación","✓ Diferentes escenarios"]} />

                <CalculatorTile to="/academy/salary-calculator" tone="blue" icon={<Receipt size={32} />}
                    title="IRPF y Sueldo Neto"
                    description="Calcula cuánto recibes a partir de tu bruto y tu situación familiar."
                    features={["✓ Neto en 12 y 14 pagas","✓ IRPF y Seguridad Social","✓ Estimación de renta por comunidad","✓ Comparación de escenarios"]} />

                {/* Emergency Fund - IMPLEMENTED */}
                <CalculatorTile to="/academy/emergency-fund" tone="orange" icon={<PiggyBank size={32} />}
                    title="Fondo de Emergencia"
                    description="Calcula el colchón financiero que necesitas según tu situación personal."
                    features={["✓ Meses de gastos recomendados","✓ Evaluación de riesgos","✓ Prioridad vs inversión","✓ Consejos personalizados"]} />

                {/* Tax Impact - IMPLEMENTED */}
                <CalculatorTile to="/academy/taxes" tone="red" icon={<Receipt size={32} />}
                    title="Simulador de Impacto Fiscal"
                    description="Estima el impacto fiscal de tus inversiones (contexto español)."
                    features={["✓ IRPF sobre ganancias","✓ Comparación fondos vs ETFs","✓ Compensación minusvalías","✓ Ejemplos prácticos"]} />

                {/* Asset Allocation - IMPLEMENTED */}
                <CalculatorTile to="/academy/asset-allocation" tone="teal" icon={<Calculator size={32} />}
                    title="Simulador de Cartera"
                    description="Prueba diferentes combinaciones de activos y visualiza riesgo/rentabilidad esperados."
                    features={["✓ Asset allocation personalizado","✓ Riesgo esperado","✓ Rentabilidad histórica","✓ Necesidad de rebalanceo"]} />
                {/* Bond Calculator - NEW */}
                <CalculatorTile to="/academy/bond-calculator" tone="teal" icon={<Scale size={32} />} iconStyle={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}
                    title="Calculadora de Bonos"
                    description="Calcula la rentabilidad real de un bono basándote en su precio actual de mercado."
                    features={["✓ YTM / TIR anualizada","✓ Aproximación Newton-Raphson","✓ Análisis Prima/Descuento","✓ Tips de riesgo de crédito"]} />

            </div>

            <div className={cn("calculators__footer", styles["calculators__footer"])}>
                <h3>¿Qué calculadora debería usar primero?</h3>
                <div className={cn("calculators__recommendations", styles["calculators__recommendations"])}>
                    <div className={cn("calculators__recommendation", styles["calculators__recommendation"])}>
                        <div className={cn("recommendation-header", styles["recommendation-header"])}>
                            <span className={cn("dot dot--green", styles["dot"], styles["dot--green"])}></span>
                            <strong>Paso 1: Seguridad Financiera</strong>
                        </div>
                        <p>Antes de invertir, usa el <strong>Fondo de Emergencia</strong> para asegurar tu base y el de <strong>Interés Compuesto</strong> para entender por qué debes empezar cuanto antes.</p>
                    </div>
                    <div className={cn("calculators__recommendation", styles["calculators__recommendation"])}>
                        <div className={cn("recommendation-header", styles["recommendation-header"])}>
                            <span className={cn("dot dot--yellow", styles["dot"], styles["dot--yellow"])}></span>
                            <strong>Paso 2: Objetivos de Vida</strong>
                        </div>
                        <p>Con tus finanzas bajo control, usa <strong>FIRE</strong> o <strong>Jubilación</strong> para definir tu meta final y el ahorro mensual necesario para alcanzarla.</p>
                    </div>
                    <div className={cn("calculators__recommendation", styles["calculators__recommendation"])}>
                        <div className={cn("recommendation-header", styles["recommendation-header"])}>
                            <span className={cn("dot dot--red", styles["dot"], styles["dot--red"])}></span>
                            <strong>Paso 3: Optimización y Renta Fija</strong>
                        </div>
                        <p>Usa el <strong>Simulador de Cartera</strong> y el de <strong>Impacto Fiscal</strong> para pulir tu estrategia. Si inviertes en renta fija, utiliza la <strong>Calculadora de Bonos</strong> para conocer su rentabilidad real (YTM).</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
