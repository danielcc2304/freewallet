import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { COMMON_ERRORS } from '../../data/academyData';
import './CommonErrors.css';

export function CommonErrors() {
    return (
        <div className="errors-page">
            <header className="errors-page__header">
                <h1 className="errors-page__title">Los Errores más Comunes</h1>
                <p className="errors-page__subtitle">
                    Aprender de tus propios errores es inteligente, pero aprender de los errores de los demás es de sabios.
                    Evita estos fallos para proteger tu rentabilidad.
                </p>
            </header>

            <div className="errors-page__grid">
                {COMMON_ERRORS.map((error) => (
                    <article key={error.id} className="error-detail-card">
                        <header className="error-detail-card__header">
                            <div className="error-detail-card__emoji">{error.emoji}</div>
                            <h2 className="error-detail-card__title">{error.title}</h2>
                        </header>

                        <p className="error-detail-card__desc">{error.desc}</p>

                        <div className="error-detail-card__grid">
                            <div className="error-sub-box consequence">
                                <h5><XCircle size={14} /> Consecuencia</h5>
                                <p>{error.consequence}</p>
                            </div>
                            <div className="error-sub-box solution">
                                <h5><CheckCircle2 size={14} /> Solución</h5>
                                <p>{error.solution}</p>
                            </div>
                        </div>

                        <div className="error-detail-card__footer" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={14} /> Evitar esto mejora tu rentabilidad a largo plazo.
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
