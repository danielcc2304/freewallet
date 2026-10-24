import { AcademyErrorFooter } from '../ui/AcademyGuideParts';
import { AcademyIdentityHeading, AcademyErrorDetail } from '../ui/AcademyGuideParts';
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
                        <AcademyIdentityHeading variant="error" emoji={<>{error.emoji}</>} title={<>{error.title}</>} />

                        <p className="error-detail-card__desc">{error.desc}</p>

                        <AcademyGrid variant="errorDetails" className="error-detail-card__grid">
                            <AcademyErrorDetail tone="consequence" title={<><XCircle size={14} /> Consecuencia</>}>{error.consequence}</AcademyErrorDetail>
                            <AcademyErrorDetail tone="solution" title={<><CheckCircle2 size={14} /> Solución</>}>{error.solution}</AcademyErrorDetail>
                        </AcademyGrid>

                        <AcademyErrorFooter icon={<AlertCircle size={14} />}> Evitar esto mejora tu rentabilidad a largo plazo.
                        </AcademyErrorFooter>
                    </AcademyPanel>
                ))}
            </AcademyGrid>
        </div>
    );
}
