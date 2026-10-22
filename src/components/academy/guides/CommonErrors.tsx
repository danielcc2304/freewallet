import { AcademyGrid } from '../ui/AcademyGrid';
import { AcademyPanel } from '../ui/AcademyPanel';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { COMMON_ERRORS } from '../../../data/academyData';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import './CommonErrors.css';

export function CommonErrors() {
    return (
        <div className="errors-page">
            <AcademyPageHeader className="errors-page__header" section="Aprender">
                <h1 className="errors-page__title">Los Errores más Comunes</h1>
                <p className="errors-page__subtitle">
                    Aprender de tus propios errores es inteligente, pero aprender de los errores de los demás es de sabios.
                    Evita estos fallos para proteger tu rentabilidad.
                </p>
            </AcademyPageHeader>

            <AcademyGrid variant="errors" className="errors-page__grid">
                {COMMON_ERRORS.map((error) => (
                    <AcademyPanel variant="error" as="article" key={error.id} className="error-detail-card">
                        <header className="error-detail-card__header">
                            <div className="error-detail-card__emoji">{error.emoji}</div>
                            <h2 className="error-detail-card__title">{error.title}</h2>
                        </header>

                        <p className="error-detail-card__desc">{error.desc}</p>

                        <AcademyGrid variant="errorDetails" className="error-detail-card__grid">
                            <AcademyPanel variant="errorDetail" className="error-sub-box consequence">
                                <h5><XCircle size={14} /> Consecuencia</h5>
                                <p>{error.consequence}</p>
                            </AcademyPanel>
                            <AcademyPanel variant="errorDetail" className="error-sub-box solution">
                                <h5><CheckCircle2 size={14} /> Solución</h5>
                                <p>{error.solution}</p>
                            </AcademyPanel>
                        </AcademyGrid>

                        <div className="error-detail-card__footer">
                            <AlertCircle size={14} /> Evitar esto mejora tu rentabilidad a largo plazo.
                        </div>
                    </AcademyPanel>
                ))}
            </AcademyGrid>
        </div>
    );
}
