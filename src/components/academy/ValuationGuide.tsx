import { Link } from 'react-router-dom';
import {
    ArrowLeft, BarChart3, ShieldCheck, TrendingUp,
    Calculator, AlertCircle, CheckCircle2, DollarSign, Activity,
    Zap, Search
} from 'lucide-react';
import './ValuationGuide.css';

interface MetricProps {
    title: string;
    formula: string;
    description: string;
    benchmarks: { label: string; value: string; type: 'good' | 'neutral' | 'bad' }[];
}

const Metric = ({ title, formula, description, benchmarks }: MetricProps) => (
    <div className="metric-card">
        <div className="metric-card__header">
            <h3 className="metric-card__title">{title}</h3>
        </div>
        <div className="metric-card__formula">{formula}</div>
        <p className="metric-card__desc">{description}</p>
        <div className="metric-card__benchmarks">
            {benchmarks.map((b, i) => (
                <div key={i} className={`benchmark benchmark--${b.type}`}>
                    <span>{b.label}</span>
                    <strong>{b.value}</strong>
                </div>
            ))}
        </div>
    </div>
);

export function ValuationGuide() {
    return (
        <div className="valuation-guide">
            <Link to="/academy/assets/equities" className="valuation-guide__back">
                <ArrowLeft size={18} /> Volver a Acciones
            </Link>

            <header className="valuation-guide__hero">
                <div className="valuation-guide__hero-icon">
                    <BarChart3 size={48} />
                </div>
                <h1>Guía Maestra: Cómo Valorar una Empresa</h1>
                <p>
                    Aprende a diferenciar un gran negocio de una trampa de valor mediante el análisis de sus fundamentales, rentabilidad y salud financiera.
                </p>
            </header>

            {/* 1. Rentabilidad del negocio */}
            <section className="valuation-guide__section">
                <h2><Activity size={24} /> 1. Rentabilidad del Negocio</h2>
                <div className="valuation-guide__grid">
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
                </div>
            </section>

            {/* 2. Rentabilidad del capital */}
            <section className="valuation-guide__section">
                <h2><TrendingUp size={24} /> 2. Rentabilidad del Capital</h2>
                <div className="valuation-guide__grid">
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
                </div>
            </section>

            {/* 3. Deuda y Solvencia */}
            <section className="valuation-guide__section">
                <h2><ShieldCheck size={24} /> 3. Deuda y Solvencia</h2>
                <div className="valuation-guide__grid">
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
                </div>
            </section>

            {/* 4. Flujo de Caja */}
            <section className="valuation-guide__section">
                <h2><DollarSign size={24} /> 4. Flujo de Caja (Cash Flow)</h2>
                <div className="valuation-guide__grid">
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
                </div>
            </section>

            {/* 5. Valoración */}
            <section className="valuation-guide__section">
                <h2><Calculator size={24} /> 5. Valoración (Múltiplos)</h2>
                <div className="valuation-guide__grid">
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
                </div>
            </section>

            {/* Ejemplos */}
            <section className="valuation-guide__section">
                <h2><Zap size={24} /> Ejemplos: El Bueno vs El Malo</h2>

                <div className="example-box example-box--good">
                    <div className="example-box__header">
                        <CheckCircle2 size={24} color="#10b981" />
                        <h3 className="example-box__title">Empresa A: "La Máquina de Generar Valor" (Ej: Tipo Microsoft/Apple)</h3>
                    </div>
                    <div className="example-box__grid">
                        <div className="example-metric">
                            <span className="example-metric__label">Margen Bruto</span>
                            <span className="example-metric__value">75%</span>
                        </div>
                        <div className="example-metric">
                            <span className="example-metric__label">ROIC</span>
                            <span className="example-metric__value">35%</span>
                        </div>
                        <div className="example-metric">
                            <span className="example-metric__label">D. Neta / EBITDA</span>
                            <span className="example-metric__value">-0.5x (Tiene caja)</span>
                        </div>
                        <div className="example-metric">
                            <span className="example-metric__label">FCF</span>
                            <span className="example-metric__value">Creciente</span>
                        </div>
                    </div>
                    <div className="example-box__conclusion">
                        Negocio ligero en activos, con fosos defensivos y que no necesita deuda para crecer. Genera tanta caja que recompra acciones o paga dividendos sin esfuerzo.
                    </div>
                </div>

                <div className="example-box example-box--bad">
                    <div className="example-box__header">
                        <AlertCircle size={24} color="#ef4444" />
                        <h3 className="example-box__title">Empresa B: "El Pozo de Deuda" (Ej: Tipo Aerolínea en crisis o 'Zombie')</h3>
                    </div>
                    <div className="example-box__grid">
                        <div className="example-metric">
                            <span className="example-metric__label">Margen Bruto</span>
                            <span className="example-metric__value">12%</span>
                        </div>
                        <div className="example-metric">
                            <span className="example-metric__label">ROIC</span>
                            <span className="example-metric__value">4%</span>
                        </div>
                        <div className="example-metric">
                            <span className="example-metric__label">D. Neta / EBITDA</span>
                            <span className="example-metric__value">5.5x</span>
                        </div>
                        <div className="example-metric">
                            <span className="example-metric__label">FCF</span>
                            <span className="example-metric__value">Negativo (Quema)</span>
                        </div>
                    </div>
                    <div className="example-box__conclusion">
                        Negocio intensivo en capital, altamente endeudado y que destruye valor (ROIC {"<"} Coste de Capital). Posible riesgo de quiebra si el crédito se endurece.
                    </div>
                </div>
            </section>

            {/* Checklist */}
            <section className="valuation-guide__section">
                <h2><Search size={24} /> Checklist Rápido de Calidad</h2>
                <div className="checklist-grid">
                    <div className="checklist-item"><CheckCircle2 size={18} /> ROIC {">"} WACC</div>
                    <div className="checklist-item"><CheckCircle2 size={18} /> FCF Positivo y creciente</div>
                    <div className="checklist-item"><CheckCircle2 size={18} /> BPA Diluido creciendo (+10% anual)</div>
                    <div className="checklist-item"><CheckCircle2 size={18} /> Deuda Neta {"<"} 2x EBITDA</div>
                    <div className="checklist-item"><CheckCircle2 size={18} /> Margen Operativo constante o al alza</div>
                    <div className="checklist-item"><CheckCircle2 size={18} /> Dividendos cubiertos por FCF (no por deuda)</div>
                </div>
            </section>
        </div>
    );
}

export default ValuationGuide;
