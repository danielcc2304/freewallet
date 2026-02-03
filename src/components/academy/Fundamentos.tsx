import { Link } from 'react-router-dom';
import './Fundamentos.css';

export function Fundamentos() {
    return (
        <div className="fundamentos">
            <header className="fundamentos__header">
                <h1 className="fundamentos__title">Fundamentos de Inversión</h1>
                <p className="fundamentos__description">
                    Comienza tu viaje de aprendizaje con los conceptos básicos que todo inversor debe conocer.
                </p>
            </header>

            <div className="fundamentos__disclaimer">
                <strong>⚠️ Nota importante:</strong> Todo el contenido de esta Academia es puramente educativo
                y no constituye asesoramiento financiero personalizado. Consulta con un profesional antes de
                tomar decisiones de inversión.
            </div>

            <div className="fundamentos__sections">
                <Link to="/academy/glossary" className="fundamentos__card">
                    <div className="fundamentos__card-icon">📚</div>
                    <h3 className="fundamentos__card-title">Diccionario Financiero</h3>
                    <p className="fundamentos__card-description">
                        Glosario de términos financieros ordenado alfabéticamente.
                        Búsqueda rápida de conceptos clave.
                    </p>
                    <span className="fundamentos__card-badge">🟢 Principiante</span>
                </Link>

                <Link to="/academy/asset-types" className="fundamentos__card">
                    <div className="fundamentos__card-icon">🏛️</div>
                    <h3 className="fundamentos__card-title">Tipos de Activos</h3>
                    <p className="fundamentos__card-description">
                        Renta fija, variable, monetarios, inmobiliario, cripto.
                        Entiende las diferencias y niveles de riesgo.
                    </p>
                    <span className="fundamentos__card-badge">🟢 Principiante</span>
                </Link>

                <Link to="/academy/compound-interest" className="fundamentos__card">
                    <div className="fundamentos__card-icon">📈</div>
                    <h3 className="fundamentos__card-title">Interés Compuesto</h3>
                    <p className="fundamentos__card-description">
                        La octava maravilla del mundo según Einstein.
                        Calcula el crecimiento de tu capital a largo plazo.
                    </p>
                    <span className="fundamentos__card-badge">🟢 Principiante</span>
                </Link>
            </div>

            <div className="fundamentos__next">
                <h3>¿Por dónde continuar?</h3>
                <p>
                    Una vez domines estos fundamentos, te recomendamos explorar:
                </p>
                <div className="fundamentos__next-links">
                    <Link to="/academy/timeline" className="fundamentos__next-link">
                        🚀 Tu Journey como Inversor
                    </Link>
                    <Link to="/academy/crisis" className="fundamentos__next-link">
                        📊 Crisis Históricas
                    </Link>
                    <Link to="/academy/scenarios" className="fundamentos__next-link">
                        🎯 Escenarios Prácticos
                    </Link>
                </div>
            </div>
        </div>
    );
}
