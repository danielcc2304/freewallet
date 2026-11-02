import {GuideBlock,GuidePanel,GuideGrid,GuideText,GuideReadingHeader} from '../ui/GuideReading';
import { AcademyErrorFooter } from '../ui/AcademyGuideParts';
import { AcademyIdentityHeading, AcademyErrorDetail } from '../ui/AcademyGuideParts';


import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { COMMON_ERRORS } from '../../../data/academyData';


export function CommonErrors() {
    return (
        <GuideBlock appearance="errorsPage"  >
            <GuideReadingHeader appearance="errors" section="Aprender" title={<>Los Errores más Comunes</>} description={<>
                    Aprender de tus propios errores es inteligente, pero aprender de los errores de los demás es de sabios.
                    Evita estos fallos para proteger tu rentabilidad.
                </>} />

            <GuideGrid appearance="errorsPageGrid"  variant="errors">
                {COMMON_ERRORS.map((error) => (
                    <GuidePanel appearance="errorDetailCard"  variant="error" as="article" key={error.id}>
                        <AcademyIdentityHeading variant="error" emoji={<>{error.emoji}</>} title={<>{error.title}</>} />

                        <GuideText appearance="errorDetailCardDesc"  >{error.desc}</GuideText>

                        <GuideGrid appearance="errorDetailCardGrid"  variant="errorDetails">
                            <AcademyErrorDetail tone="consequence" title={<><XCircle size={14} /> Consecuencia</>}>{error.consequence}</AcademyErrorDetail>
                            <AcademyErrorDetail tone="solution" title={<><CheckCircle2 size={14} /> Solución</>}>{error.solution}</AcademyErrorDetail>
                        </GuideGrid>

                        <AcademyErrorFooter icon={<AlertCircle size={14} />}> Evitar esto mejora tu rentabilidad a largo plazo.
                        </AcademyErrorFooter>
                    </GuidePanel>
                ))}
            </GuideGrid>
        </GuideBlock>
    );
}
