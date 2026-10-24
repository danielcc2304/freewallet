import { AcademyIdentityHeading, AcademyScenarioSection, AcademyActionCard } from '../ui/AcademyGuideParts';
import { AcademyGrid } from '../ui/AcademyGrid';
import { AcademyPanel } from '../ui/AcademyPanel';
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
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import './Scenarios.css';

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
        <div className="scenarios">
            <AcademyPageHeader className="scenarios__header" section="Escenarios">
                <h1 className="scenarios__title">¿Qué hacer cuando...?</h1>
                <p className="scenarios__subtitle">
                    Guía rápida de actuación para los escenarios más comunes del inversor.
                    Mantén la cabeza fría cuando todos los demás la pierden.
                </p>
            </AcademyPageHeader>

            <AcademyGrid variant="scenarios" className="scenarios__grid">
                {SCENARIOS.map((scenario) => (
                    <AcademyPanel variant="scenario" as="article" key={scenario.id} className="scenario-card">
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
                                            <div className="scenario-actions">
                                                {section.content.map((action, actionIdx) => {
                                                    const Icon = IconMap[action.icon] || Info;
                                                    return (
                                                        <AcademyActionCard key={actionIdx} tone={action.type as 'do' | 'dont'} icon={<>
                                                                <Icon size={20} />
                                                            </>} title={<>{action.title}</>}>{action.description}</AcademyActionCard>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </AcademyScenarioSection>
                            ))}
                        </div>
                    </AcademyPanel>
                ))}
            </AcademyGrid>
        </div>
    );
}
