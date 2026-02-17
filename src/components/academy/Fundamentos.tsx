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

                <Link to="/academy/resources" className="fundamentos__card">
                    <div className="fundamentos__card-icon">🎁</div>
                    <h3 className="fundamentos__card-title">Recursos y Guías</h3>
                    <p className="fundamentos__card-description">
                        Selección de herramientas externas, libros recomendados
                        y material descargable para tu formación.
                    </p>
                    <span className="fundamentos__card-badge">🟡 Intermedio</span>
                </Link>

                <Link to="/academy/inflation-predator" className="fundamentos__card">
                    <div className="fundamentos__card-icon">👻</div>
                    <h3 className="fundamentos__card-title">Depredador de la Inflación</h3>
                    <p className="fundamentos__card-description">
                        Visualiza cómo la inflación devora tus ahorros si no los inviertes.
                        Un simulador visual de poder adquisitivo.
                    </p>
                    <span className="fundamentos__card-badge">🟢 Principiante</span>
                </Link>

                <Link to="/academy/market-timing-game" className="fundamentos__card">
                    <div className="fundamentos__card-icon">🎮</div>
                    <h3 className="fundamentos__card-title">Reto: Timing vs DCA</h3>
                    <p className="fundamentos__card-description">
                        ¿Crees que puedes ganarle al mercado? Intenta comprar barato
                        y vender caro en este simulador en tiempo real.
                    </p>
                    <span className="fundamentos__card-badge">🟡 Juego</span>
                </Link>
            </div>

            <div className="fundamentos__interact">
                <div className="interact-card">
                    <div className="interact-card__content">
                        <h3>🎯 ¿No sabes por dónde empezar?</h3>
                        <p>Realiza nuestro test interactivo para descubrir tu perfil de riesgo y obtener una recomendación de cartera personalizada.</p>
                        <Link to="/academy/investor-profile-test" className="fundamentos__card-badge fundamentos__card-badge--interact">
                            Empezar Test de Perfil →
                        </Link>
                    </div>
                </div>
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
                    <Link to="/academy/portfolio" className="fundamentos__next-link">
                        🏗️ Estrategia y Cartera
                    </Link>
                    <Link to="/academy/calculators" className="fundamentos__next-link">
                        🧮 Calculadoras
                    </Link>
                </div>
            </div>
        </div>
    );
}
