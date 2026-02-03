import { useState } from 'react';
import { Check, AlertCircle, TrendingUp, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TIMELINE_PHASES } from '../../data/academyData';
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
            <header className="timeline__header">
                <h1 className="timeline__title">Tu Journey como Inversor</h1>
                <p className="timeline__description">
                    Una guía visual que te acompaña en cada etapa de tu camino como inversor.
                </p>
            </header>

            <div className="timeline__disclaimer">
                <strong>⚠️ Importante:</strong> Esta línea temporal es una guía orientativa.
                <strong> No todos los inversores pasan por estas fases en orden ni a la misma velocidad.</strong>
                Tu situación personal, objetivos y circunstancias determinan tu propio ritmo.
            </div>

            <div className="timeline__container">
                {/* Regular phases */}
                {regularPhases.map((phase, index) => (
                    <div
                        key={phase.id}
                        className={`timeline__phase ${expandedPhase === phase.id ? 'timeline__phase--expanded' : ''}`}
                    >
                        <div className="timeline__phase-marker">
                            <div className="timeline__phase-number">{phase.phase}</div>
                            {index < regularPhases.length - 1 && (
                                <div className="timeline__phase-connector" />
                            )}
                        </div>

                        <div className="timeline__phase-content">
                            <button
                                className="timeline__phase-header"
                                onClick={() => togglePhase(phase.id)}
                            >
                                <div className="timeline__phase-header-text">
                                    <h3 className="timeline__phase-title">{phase.title}</h3>
                                    <span className="timeline__phase-duration">{phase.duration}</span>
                                </div>
                                <TrendingUp className="timeline__phase-icon" size={24} />
                            </button>

                            {expandedPhase === phase.id && (
                                <div className="timeline__phase-details">
                                    <div className="timeline__phase-objective">
                                        <strong>🎯 Objetivo:</strong> {phase.objective}
                                    </div>

                                    {phase.checklist && (
                                        <div className="timeline__phase-checklist">
                                            <strong>✅ Checklist:</strong>
                                            <ul>
                                                {phase.checklist.map((item, i) => (
                                                    <li key={i}>
                                                        <Check size={16} className="timeline__check-icon" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {phase.strategy && (
                                        <div className="timeline__phase-strategy">
                                            <strong>📊 Estrategia:</strong> {phase.strategy}
                                        </div>
                                    )}

                                    {phase.allocation && (
                                        <div className="timeline__phase-allocation">
                                            <strong>📈 Asset Allocation sugerida:</strong>
                                            <div className="timeline__allocation-options">
                                                <div className="timeline__allocation-option">
                                                    <span className="timeline__allocation-label">Conservador:</span>
                                                    <span className="timeline__allocation-value">{phase.allocation.conservative}</span>
                                                </div>
                                                <div className="timeline__allocation-option">
                                                    <span className="timeline__allocation-label">Moderado:</span>
                                                    <span className="timeline__allocation-value">{phase.allocation.moderate}</span>
                                                </div>
                                                <div className="timeline__allocation-option">
                                                    <span className="timeline__allocation-label">Agresivo:</span>
                                                    <span className="timeline__allocation-value">{phase.allocation.aggressive}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="timeline__phase-error">
                                        <strong>⚠️ Error común:</strong> {phase.commonError}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <section className="timeline__errors-section">
                <button
                    className="timeline__errors-toggle"
                    onClick={() => setExpandedPhase(expandedPhase === 'errors' ? null : 'errors')}
                >
                    <div className="toggle-content">
                        <XCircle size={24} className="error-icon" />
                        <div>
                            <h3>Errores Comunes que debes evitar</h3>
                            <p>Aprende de los fallos de otros para proteger tu capital.</p>
                        </div>
                    </div>
                    {expandedPhase === 'errors' ? <ChevronUp /> : <ChevronDown />}
                </button>

                {expandedPhase === 'errors' && (
                    <div className="timeline__errors-list">
                        <div className="error-item">
                            <h4>🕰️ Market Timing</h4>
                            <p>Intentar predecir cuándo el mercado subirá o bajará. Nadie tiene una bola de cristal; es mejor estar invertido ("Time IN the market") que intentar acertar el momento ("Timing the market").</p>
                        </div>
                        <div className="error-item">
                            <h4>🎢 Perseguir Rentabilidades</h4>
                            <p>Invertir en el activo que más ha subido el último año. Normalmente, cuando algo es noticia, ya es tarde. Compra por fundamentales, no por FOMO.</p>
                        </div>
                        <div className="error-item">
                            <h4>🫙 Falta de Diversificación</h4>
                            <p>Poner todos los huevos en la misma cesta (una sola acción, un solo país o un solo sector). La diversificación es el único "almuerzo gratis" en la inversión.</p>
                        </div>
                        <div className="error-item">
                            <h4>🧠 Sesgos Emocionales</h4>
                            <p>Vender cuando hay miedo (caídas) y comprar cuando hay euforia (máximos). Tus emociones son el peor enemigo de tu rentabilidad a largo plazo.</p>
                        </div>
                    </div>
                )}
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

                        <div className="timeline__crisis-error">
                            <strong>⚠️ Mayor error:</strong> {crisisPhase.commonError}
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
        </div>
    );
}
