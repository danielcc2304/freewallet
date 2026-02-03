import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './InProcess.css';

export function InProcess() {
    const navigate = useNavigate();

    return (
        <div className="in-process">
            <div className="in-process__container">
                <div className="in-process__icon">
                    <Construction size={64} />
                </div>
                <h1 className="in-process__title">Sección en Desarrollo</h1>
                <p className="in-process__description">
                    Estamos trabajando duro para traerte el mejor contenido educativo y herramientas financieras.
                    Esta sección estará disponible muy pronto.
                </p>
                <div className="in-process__features">
                    <h3>¿Qué encontrarás aquí?</h3>
                    <ul>
                        <li>Contenido práctico y accionable</li>
                        <li>Guías detalladas paso a paso</li>
                        <li>Herramientas interactivas exclusivas</li>
                    </ul>
                </div>
                <button className="in-process__back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} />
                    Volver atrás
                </button>
            </div>
        </div>
    );
}
