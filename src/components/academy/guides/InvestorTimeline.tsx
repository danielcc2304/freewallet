import { Link } from 'react-router-dom';
import {JourneyCrisis,JourneyCrisisColumn,JourneyNextSection,JourneyNextLink} from '../ui/JourneySupport';
import { JourneyNotice, JourneyGuideLink } from '../ui/JourneyPhase';
import { JourneyPhase, JourneyTextSection, JourneyChecklist, JourneyAllocation } from '../ui/JourneyPhase';
import { useState } from 'react';
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
                <JourneyCrisis  title={crisisPhase.title} duration={crisisPhase.duration} objective={crisisPhase.objective} errors={crisisPhase.commonErrors}>
                            <JourneyCrisisColumn title={<>❌ Qué NO hacer:</>} items={[<>Vender por pánico</>,<>Mirar la cartera cada hora</>,<>Leer noticias sensacionalistas</>]} />

                            <JourneyCrisisColumn title={<>✅ Qué SÍ hacer:</>} items={[<>Mantener DCA (o aumentar si tienes liquidez)</>,<>Recordar tu horizonte temporal</>,<>Revisar <a href="/academy/crisis">casos históricos</a></>]} />
                        </JourneyCrisis>
            )}

            <JourneyNextSection appearance="next" title={<>Continúa aprendiendo</>} description={<>Profundiza en otros aspectos clave para tu journey:</>}>
                    <JourneyNextLink to="/academy/crisis">
                        📊 Ver Crisis Históricas
                    </JourneyNextLink>
                    <JourneyNextLink to="/academy/scenarios">
                        🎯 Escenarios Prácticos
                    </JourneyNextLink>
                    <JourneyNextLink to="/academy/portfolio">
                        📈 Construir tu Cartera
                    </JourneyNextLink>
                </JourneyNextSection>

            <JourneyNextSection appearance="guide" title={<>Siguiente paso segun tu momento</>} description={<>Usa esta guia como punto de partida y baja luego a riesgo, crisis o construccion de cartera.</>}>
                    <JourneyGuideLink to="/academy/crisis" title={<>Mercado y crisis</>} description={<>Para saber que esperar cuando llegue una caida fuerte.</>} />
                    <JourneyGuideLink to="/academy/scenarios" title={<>Qué hacer si...</>} description={<>Para convertir teoria en decisiones practicas.</>} />
                    <JourneyGuideLink to="/academy/portfolio" title={<>Construir cartera</>} description={<>Para traducir tu fase inversora en una asignacion real.</>} />
                </JourneyNextSection>
        </div>
    );
}
