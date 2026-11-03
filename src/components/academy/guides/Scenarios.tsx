import {GuideBlock,GuidePanel,GuideReadingHeader} from '../ui/GuideReading';
import { AcademyIdentityHeading, AcademyScenarioSection, AcademyActionCard } from '../ui/AcademyGuideParts';
import { AcademyGrid } from '../ui/AcademyGrid';

import {
    Shield,
    TrendingUp,
    XCircle,
    PiggyBank,
    Zap,
    Target,
    Scale,
    Landmark,
    ShieldCheck,
    Info,
    PauseCircle,
    Repeat,
    Clock,
    Twitter,
    ArrowUpCircle,
    ClipboardCheck,
    Thermometer,
    EyeOff,
    Briefcase,
    TrendingDown,
    Calendar,
    type LucideIcon
} from 'lucide-react';
import { SCENARIOS } from '../../../data/academyData';


const IconMap: Record<string, LucideIcon> = {
    Shield,
    TrendingUp,
    XCircle,
    PiggyBank,
    Zap,
    Target,
    Scale,
    Landmark,
    ShieldCheck,
    Info,
    PauseCircle,
    Repeat,
    Clock,
    Twitter,
    ArrowUpCircle,
    ClipboardCheck,
    Thermometer,
    EyeOff,
    Briefcase,
    TrendingDown,
    Calendar
};

export function Scenarios() {
    return (
        <GuideBlock appearance="scenarios"  >
            <GuideReadingHeader appearance="scenarios" section="Escenarios" title={<>¿Qué hacer cuando...?</>} description={<>
                    Guía rápida de actuación para los escenarios más comunes del inversor.
                    Mantén la cabeza fría cuando todos los demás la pierden.
                </>} />

            <AcademyGrid variant="scenarios" className="scenarios__grid">
                {SCENARIOS.map((scenario) => (
                    <GuidePanel appearance="scenarioCard"  variant="scenario" as="article" key={scenario.id}>
                        <AcademyIdentityHeading variant="scenario" emoji={<>{scenario.emoji}</>} title={<>{scenario.title}</>} />

                        <div className="scenario-card__content">
                            {scenario.sections.map((section, idx) => (
                                <AcademyScenarioSection title={<>
                                        {idx === 0 ? <Info size={18} /> : <Target size={18} />}
                                        {section.title}
                                    </>}>
                                        {typeof section.content === 'string' ? (
                                            <p>{section.content}</p>
                                        ) : (
                                            <GuideBlock appearance="scenarioActions"  >
                                                {section.content.map((action, actionIdx) => {
                                                    const Icon = IconMap[action.icon] || Info;
                                                    return (
                                                        <AcademyActionCard key={actionIdx} tone={action.type as 'do' | 'dont'} icon={<>
                                                                <Icon size={20} />
                                                            </>} title={<>{action.title}</>}>{action.description}</AcademyActionCard>
                                                    );
                                                })}
                                            </GuideBlock>
                                        )}
                                    </AcademyScenarioSection>
                            ))}
                        </div>
                    </GuidePanel>
                ))}
            </AcademyGrid>
        </GuideBlock>
    );
}
