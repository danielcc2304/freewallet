import { JourneyNotice, JourneyGuideLink } from '../ui/JourneyPhase';
import { JourneyPhase, JourneyTextSection, JourneyChecklist, JourneyAllocation } from '../ui/JourneyPhase';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TIMELINE_PHASES } from '../../../data/academyData';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import './InvestorTimeline.css';

export function InvestorTimeline() {
    const [expandedPhase, setExpandedPhase] = useState<string | null>('phase-0');

    const togglePhase = (id: string) => {
        setExpandedPhase(expandedPhase === id ? null : id);
    };

    const regularPhases = TIMELINE_PHASES.filter(p => p.phase !== 99);
    const crisisPhase = TIMELINE_PHASES.find(p => p.phase === 99);

    return (
        <div className="timeline">
            <AcademyPageHeader className="timeline__header" section="Aprender">
                <h1 className="timeline__title">Tu viaje como inversor</h1>
                <p className="timeline__description">
                    Una guía visual que te acompaña en cada etapa de tu camino como inversor.
                </p>
            </AcademyPageHeader>

            <JourneyNotice>
                <strong>⚠️ Importante:</strong> Esta línea temporal es una guía orientativa.
                <strong> No todos los inversores pasan por estas fases en orden ni a la misma velocidad.</strong>
                Tu situación personal, objetivos y circunstancias determinan tu propio ritmo.
            </JourneyNotice>

            <div className="timeline__container">
                {/* Regular phases */}
                {regularPhases.map((phase, index) => (
                    <JourneyPhase key={phase.id} number={phase.phase} title={phase.title} duration={phase.duration} connected={index < regularPhases.length - 1} expanded={expandedPhase === phase.id} onToggle={() => togglePhase(phase.id)}>
                        <JourneyTextSection appearance="objective" title={<>🎯 Objetivo:</>}>{phase.objective}</JourneyTextSection>

                        {phase.checklist && (
                            <JourneyChecklist title="✅ Checklist:" items={phase.checklist} />
                        )}

                        {phase.strategy && (
                            <JourneyTextSection appearance="strategy" title={<>📊 Estrategia:</>}>{phase.strategy}</JourneyTextSection>
                        )}

                        {phase.allocation && (
                            <JourneyAllocation title="📈 Asset Allocation sugerida:" items={[['Conservador:', phase.allocation.conservative], ['Moderado:', phase.allocation.moderate], ['Agresivo:', phase.allocation.aggressive]]} />
                        )}

                        <JourneyChecklist appearance="errors" title="⚠️ Errores comunes:" items={phase.commonErrors} />
                    </JourneyPhase>
                ))}
            </div>

            <section className="timeline__errors-cta">
                <h3>Errores comunes del inversor</h3>
                <p>Hemos movido esta parte a una sección específica para que la tengas completa y mejor organizada.</p>
                <Link to="/academy/errors" className="timeline__errors-link">
                    Ir a Errores Comunes →
                </Link>
            </section>

            {/* Crisis phase - special styling */}
            {crisisPhase && (
                <div className="timeline__crisis">
                    <div className="timeline__crisis-header">
                        <AlertCircle size={28} className="timeline__crisis-icon" />
                        <div>
                            <h3 className="timeline__crisis-title">{crisisPhase.title}</h3>
                            <p className="timeline__crisis-subtitle">{crisisPhase.duration}</p>
                        </div>
                    </div>

                    <div className="timeline__crisis-content">
                        <div className="timeline__crisis-objective">
                            <strong>🎯 Objetivo:</strong> {crisisPhase.objective}
                        </div>

                        <div className="timeline__crisis-actions">
                            <div className="timeline__crisis-column">
                                <h4>❌ Qué NO hacer:</h4>
                                <ul>
                                    <li>Vender por pánico</li>
                                    <li>Mirar la cartera cada hora</li>
                                    <li>Leer noticias sensacionalistas</li>
                                </ul>
                            </div>

                            <div className="timeline__crisis-column">
                                <h4>✅ Qué SÍ hacer:</h4>
                                <ul>
                                    <li>Mantener DCA (o aumentar si tienes liquidez)</li>
                                    <li>Recordar tu horizonte temporal</li>
                                    <li>Revisar <a href="/academy/crisis">casos históricos</a></li>
                                </ul>
                            </div>
                        </div>

                        <div className="timeline__crisis-errors">
                            <strong>⚠️ Errores críticos:</strong>
                            <ul>
                                {crisisPhase.commonErrors.map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <div className="timeline__next">
                <h3>Continúa aprendiendo</h3>
                <p>Profundiza en otros aspectos clave para tu journey:</p>
                <div className="timeline__next-links">
                    <Link to="/academy/crisis" className="timeline__next-link">
                        📊 Ver Crisis Históricas
                    </Link>
                    <Link to="/academy/scenarios" className="timeline__next-link">
                        🎯 Escenarios Prácticos
                    </Link>
                    <Link to="/academy/portfolio" className="timeline__next-link">
                        📈 Construir tu Cartera
                    </Link>
                </div>
            </div>

            <section className="timeline__guide-next">
                <h3>Siguiente paso segun tu momento</h3>
                <p>Usa esta guia como punto de partida y baja luego a riesgo, crisis o construccion de cartera.</p>
                <div className="timeline__guide-links">
                    <JourneyGuideLink to="/academy/crisis" title={<>Mercado y crisis</>} description={<>Para saber que esperar cuando llegue una caida fuerte.</>} />
                    <JourneyGuideLink to="/academy/scenarios" title={<>Qué hacer si...</>} description={<>Para convertir teoria en decisiones practicas.</>} />
                    <JourneyGuideLink to="/academy/portfolio" title={<>Construir cartera</>} description={<>Para traducir tu fase inversora en una asignacion real.</>} />
                </div>
            </section>
        </div>
    );
}
