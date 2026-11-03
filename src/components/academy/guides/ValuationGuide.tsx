import {GuideBlock,GuideGrid,GuideLink,GuideReadingHeader,GuideReadingSection,GuideNextStep} from '../ui/GuideReading';
import { AcademyValuationFormula, AcademyWorkedExample, AcademyCheckItem, AcademyExampleMetric } from '../ui/AcademyGuideParts';


import {
    ArrowLeft, BarChart3, ShieldCheck, TrendingUp,
    Calculator, AlertCircle, CheckCircle2, DollarSign, Activity,
    Zap, Search
} from 'lucide-react';


interface MetricProps {
    title: string;
    formula: string;
    description: string;
    benchmarks: { label: string; value: string; type: 'good' | 'neutral' | 'bad' }[];
}

const Metric = ({ title, formula, description, benchmarks }: MetricProps) => (
    <AcademyValuationFormula title={title} formula={formula} description={description} benchmarks={benchmarks} />
);

export function ValuationGuide() {
    return (
        <GuideBlock appearance="valuationGuide"  >
            <GuideLink appearance="valuationGuideBack"  to="/academy/assets/equities">
                <ArrowLeft size={18} /> Volver a Acciones
            </GuideLink>

            <GuideReadingHeader appearance="valuation" section="Herramientas" title={<>Guía Maestra: Cómo Valorar una Empresa</>} description={<>
                    Aprende a diferenciar un gran negocio de una trampa de valor mediante el análisis de sus fundamentales, rentabilidad y salud financiera.
                </>} icon={<>
                    <BarChart3 size={48} />
                </>}/>

            {/* 1. Rentabilidad del negocio */}
            <GuideReadingSection   title={<><Activity size={24} /> 1. Rentabilidad del Negocio</>}><GuideGrid appearance="valuationGuideGrid"  variant="valuation">
                    <Metric
                        title="Margen Bruto"
                        formula="(Revenue - Coste de Ventas) / Revenue"
                        description="Mide la eficiencia productiva básica y el poder de marca."
                        benchmarks={[
                            { label: "Software / Tech", value: "> 60%", type: "good" },
                            { label: "Consumo", value: "~ 40%", type: "neutral" },
                            { label: "Industrial", value: "~ 25%", type: "bad" }
                        ]}
                    />
                    <Metric
                        title="Margen Operativo (EBIT)"
                        formula="EBIT / Revenue"
                        description="Rentabilidad del core del negocio antes de intereses e impuestos."
                        benchmarks={[
                            { label: "Excelente", value: "> 20%", type: "good" },
                            { label: "Sólido", value: "10-20%", type: "neutral" },
                            { label: "Débil", value: "< 10%", type: "bad" }
                        ]}
                    />
                    <Metric
                        title="EBITDA"
                        formula="EBIT + Depreciación + Amortización"
                        description="Mide el flujo de caja operativo bruto antes de inversiones."
                        benchmarks={[
                            { label: "Core Business", value: "Cash Focus", type: "neutral" }
                        ]}
                    />
                </GuideGrid></GuideReadingSection>

            {/* 2. Rentabilidad del capital */}
            <GuideReadingSection   title={<><TrendingUp size={24} /> 2. Rentabilidad del Capital</>}><GuideGrid appearance="valuationGuideGrid"  variant="valuation">
                    <Metric
                        title="ROE (Return on Equity)"
                        formula="Net Income / Equity"
                        description="Rentabilidad que la empresa genera para sus accionistas."
                        benchmarks={[
                            { label: "Muy bueno", value: "> 15%", type: "good" },
                            { label: "Mediocre", value: "< 10%", type: "bad" }
                        ]}
                    />
                    <Metric
                        title="ROIC (Clave)"
                        formula="NOPAT / (Equity + Net Debt)"
                        description="La métrica de oro. ¿Crea valor la empresa por encima de su coste?"
                        benchmarks={[
                            { label: "Creadora de valor", value: "ROIC > WACC", type: "good" },
                            { label: "Destructora", value: "ROIC < WACC", type: "bad" }
                        ]}
                    />
                    <Metric
                        title="ROA (Return on Assets)"
                        formula="Net Income / Total Assets"
                        description="Eficiencia de la gestión de todos los activos."
                        benchmarks={[
                            { label: "Excelente", value: "> 8%", type: "good" },
                            { label: "Bajo", value: "< 4%", type: "bad" }
                        ]}
                    />
                </GuideGrid></GuideReadingSection>

            {/* 3. Deuda y Solvencia */}
            <GuideReadingSection   title={<><ShieldCheck size={24} /> 3. Deuda y Solvencia</>}><GuideGrid appearance="valuationGuideGrid"  variant="valuation">
                    <Metric
                        title="Deuda Neta / EBITDA"
                        formula="(Deuda - Caja) / EBITDA"
                        description="Años que tardaría la empresa en pagar su deuda con su flujo operativo."
                        benchmarks={[
                            { label: "Cómodo", value: "< 2x", type: "good" },
                            { label: "Vigilable", value: "2-3x", type: "neutral" },
                            { label: "Peligro", value: "> 3x", type: "bad" }
                        ]}
                    />
                    <Metric
                        title="Current Ratio"
                        formula="Current Assets / Current Liabilities"
                        description="Capacidad de pagar deudas a corto plazo (menos de 1 año)."
                        benchmarks={[
                            { label: "Sano", value: "> 1.5", type: "good" },
                            { label: "Tensión", value: "< 1.0", type: "bad" }
                        ]}
                    />
                    <Metric
                        title="Deuda / Patrimonio"
                        formula="Total Debt / Equity"
                        description="Proporción de financiación externa vs propia."
                        benchmarks={[
                            { label: "Conservador", value: "< 0.5", type: "good" },
                            { label: "Agresivo", value: "> 1.0", type: "bad" }
                        ]}
                    />
                </GuideGrid></GuideReadingSection>

            {/* 4. Flujo de Caja */}
            <GuideReadingSection   title={<><DollarSign size={24} /> 4. Flujo de Caja (Cash Flow)</>}><GuideGrid appearance="valuationGuideGrid"  variant="valuation">
                    <Metric
                        title="Operating Cash Flow (OCF)"
                        formula="CFO = Net Income + Depreciation & Amortization +/- Working Capital"
                        description="Caja generada por la operativa del negocio tras ajustes contables y variaciones de capital circulante."
                        benchmarks={[
                            { label: "Sano", value: "Positivo y estable", type: "good" },
                            { label: "Alerta", value: "Volátil o negativo", type: "bad" }
                        ]}
                    />
                    <Metric
                        title="Free Cash Flow (FCF)"
                        formula="OCF - CapEx"
                        description="La caja real que sobra tras mantener el negocio. La sangre de la empresa."
                        benchmarks={[
                            { label: "Positivo", value: "Crucial", type: "good" },
                            { label: "Negativo", value: "Quema caja", type: "bad" }
                        ]}
                    />
                    <Metric
                        title="FCF Yield"
                        formula="FCF / Market Cap"
                        description="Rentabilidad del flujo de caja respecto al precio pagado."
                        benchmarks={[
                            { label: "Atractivo", value: "> 8%", type: "good" },
                            { label: "Correcto", value: "5-8%", type: "neutral" },
                            { label: "Exigente", value: "< 4%", type: "bad" }
                        ]}
                    />
                </GuideGrid></GuideReadingSection>

            {/* 5. Valoración */}
            <GuideReadingSection   title={<><Calculator size={24} /> 5. Valoración (Múltiplos)</>}><GuideGrid appearance="valuationGuideGrid"  variant="valuation">
                    <Metric
                        title="PER (PE Ratio)"
                        formula="Precio / Beneficio por Acción"
                        description="Cuántos años de beneficios pagas. Útil en empresas estables."
                        benchmarks={[
                            { label: "Barato", value: "< 12", type: "good" },
                            { label: "Razonable", value: "12-20", type: "neutral" },
                            { label: "Caro", value: "> 25", type: "bad" }
                        ]}
                    />
                    <Metric
                        title="EV / EBITDA"
                        formula="Enterprise Value / EBITDA"
                        description="Mejor que el PER porque incluye la deuda. Ideal para comparar sectores."
                        benchmarks={[
                            { label: "Barato", value: "< 8", type: "good" },
                            { label: "Caro", value: "> 12", type: "bad" }
                        ]}
                    />
                    <Metric
                        title="P/S (Price to Sales)"
                        formula="Market Cap / Revenue"
                        description="Útil para empresas sin beneficios pero con alto crecimiento."
                        benchmarks={[
                            { label: "Normal", value: "1-2", type: "neutral" },
                            { label: "Hype", value: "> 10", type: "bad" }
                        ]}
                    />
                </GuideGrid></GuideReadingSection>

            {/* Ejemplos */}
            <GuideReadingSection   title={<><Zap size={24} /> Ejemplos: El Bueno vs El Malo</>}><AcademyWorkedExample tone="good" icon={<CheckCircle2 size={24} color="#10b981" />} title={<>Empresa A: "La Máquina de Generar Valor" (Ej: Tipo Microsoft/Apple)</>} conclusion={<>
                        Negocio ligero en activos, con fosos defensivos y que no necesita deuda para crecer. Genera tanta caja que recompra acciones o paga dividendos sin esfuerzo.
                    </>}>
                        <AcademyExampleMetric label={<>Margen Bruto</>} value={<>75%</>} />
                        <AcademyExampleMetric label={<>ROIC</>} value={<>35%</>} />
                        <AcademyExampleMetric label={<>D. Neta / EBITDA</>} value={<>-0.5x (Tiene caja)</>} />
                        <AcademyExampleMetric label={<>FCF</>} value={<>Creciente</>} />
                    </AcademyWorkedExample><AcademyWorkedExample tone="bad" icon={<AlertCircle size={24} color="#ef4444" />} title={<>Empresa B: "Múltiplos Baratos, Calidad Floja" (Ej: Telefónica)</>} conclusion={<>
                        Múltiplos bajos no bastan. Aunque sigue generando caja, el beneficio neto es negativo, el ROE está en rojo, la deuda pesa mucho sobre el balance y la liquidez de corto plazo es justa. Caso clásico de empresa que puede parecer barata pero no ofrece una calidad acorde.
                    </>}>
                        <AcademyExampleMetric label={<>Margen Operativo</>} value={<>13%</>} />
                        <AcademyExampleMetric label={<>ROE</>} value={<>-2.3%</>} />
                        <AcademyExampleMetric label={<>Deuda / Patrimonio</>} value={<>201%</>} />
                        <AcademyExampleMetric label={<>Current Ratio</>} value={<>0.84</>} />
                    </AcademyWorkedExample></GuideReadingSection>

            {/* Checklist */}
            <GuideReadingSection   title={<><Search size={24} /> Checklist Rápido de Calidad</>}><GuideBlock appearance="checklistGrid"  >
                    <AcademyCheckItem icon={<CheckCircle2 size={18} />}> ROIC {">"} WACC</AcademyCheckItem>
                    <AcademyCheckItem icon={<CheckCircle2 size={18} />}> FCF Positivo y creciente</AcademyCheckItem>
                    <AcademyCheckItem icon={<CheckCircle2 size={18} />}> BPA Diluido creciendo (+10% anual)</AcademyCheckItem>
                    <AcademyCheckItem icon={<CheckCircle2 size={18} />}> Deuda Neta {"<"} 2x EBITDA</AcademyCheckItem>
                    <AcademyCheckItem icon={<CheckCircle2 size={18} />}> Margen Operativo constante o al alza</AcademyCheckItem>
                    <AcademyCheckItem icon={<CheckCircle2 size={18} />}> Dividendos cubiertos por FCF (no por deuda)</AcademyCheckItem>
                </GuideBlock></GuideReadingSection>
            <GuideReadingSection  className="valuation-guide__next" title={<><TrendingUp size={24} /> Dónde continuar después de valorar</>}><GuideBlock appearance="valuationGuideNextGrid"  >
                    <GuideNextStep to="/academy/risk" title={<>Gestión del riesgo</>} description={<>Una empresa buena puede seguir siendo una mala posición si el peso o el timing son malos.</>}/>
                    <GuideNextStep to="/academy/scenarios" title={<>Qué hacer si...</>} description={<>Lleva la valoración a escenarios prácticos de compra, espera y caídas de mercado.</>}/>
                    <GuideNextStep to="/portfolio-csv" title={<>Portfolio</>} description={<>Contrasta tu tesis con el peso real que esa posición ocupa dentro de toda la cartera.</>}/>
                </GuideBlock></GuideReadingSection>
        </GuideBlock>
    );
}

export default ValuationGuide;

