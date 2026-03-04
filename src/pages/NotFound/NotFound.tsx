import { FileSearch, Home, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import './NotFound.css';

export function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="not-found">
            <div className="not-found__container">
                <div className="not-found__icon">
                    <FileSearch size={64} />
                </div>
                <h1 className="not-found__title">404</h1>
                <h2 className="not-found__subtitle">Página no encontrada</h2>
                <p className="not-found__description">
                    Lo sentimos, la página que estás buscando no existe o ha sido movida a una nueva ubicación.
                </p>
                <div className="not-found__actions">
                    <Link to="/" className="not-found__button not-found__button--primary">
                        <Home size={18} />
                        Ir al Inicio
                    </Link>
                    <button className="not-found__button not-found__button--secondary" onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} />
                        Volver atrás
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NotFound;
