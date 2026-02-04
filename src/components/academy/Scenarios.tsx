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
    Calendar
} from 'lucide-react';
import { SCENARIOS } from '../../data/academyData';
import './Scenarios.css';

const IconMap: Record<string, any> = {
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
            <header className="scenarios__header">
                <h1 className="scenarios__title">¿Qué hacer cuando...?</h1>
                <p className="scenarios__subtitle">
                    Guía rápida de actuación para los escenarios más comunes del inversor.
                    Mantén la cabeza fría cuando todos los demás la pierden.
                </p>
            </header>

            <div className="scenarios__grid">
                {SCENARIOS.map((scenario) => (
                    <article key={scenario.id} className="scenario-card">
                        <header className="scenario-card__header">
                            <div className="scenario-card__emoji">{scenario.emoji}</div>
                            <h2 className="scenario-card__title">{scenario.title}</h2>
                        </header>

                        <div className="scenario-card__content">
                            {scenario.sections.map((section, idx) => (
                                <section key={idx} className="scenario-section">
                                    <h3>
                                        {idx === 0 ? <Info size={18} /> : <Target size={18} />}
                                        {section.title}
                                    </h3>
                                    <div className="scenario-section__content">
                                        {typeof section.content === 'string' ? (
                                            <p>{section.content}</p>
                                        ) : (
                                            <div className="scenario-actions">
                                                {section.content.map((action, actionIdx) => {
                                                    const Icon = IconMap[action.icon] || Info;
                                                    return (
                                                        <div key={actionIdx} className={`action-card ${action.type}`}>
                                                            <div className="action-card__icon">
                                                                <Icon size={20} />
                                                            </div>
                                                            <div className="action-card__text">
                                                                <h4>{action.title}</h4>
                                                                <p>{action.description}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
