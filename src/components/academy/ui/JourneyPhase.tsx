import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, TrendingUp } from 'lucide-react';
import { AcademyPanel } from './AcademyPanel';
import { journeyClass as part } from './journeyStyles';
import { cn } from '../../../utils/cn';

interface PhaseProps {
    number: ReactNode;
    title: ReactNode;
    duration: ReactNode;
    connected: boolean;
    expanded: boolean;
    onToggle: () => void;
    children: ReactNode;
}

export function JourneyPhase({ number, title, duration, connected, expanded, onToggle, children }: PhaseProps) {
    return <div className={cn(part('timeline__phase'), expanded && part('timeline__phase--expanded'))}>
        <div className={part('timeline__phase-marker')}><div className={part('timeline__phase-number')}>{number}</div>{connected && <div className={part('timeline__phase-connector')} />}</div>
        <AcademyPanel variant="timeline" className={part('timeline__phase-content')}>
            <button className={part('timeline__phase-header')} onClick={onToggle}>
                <div className={part('timeline__phase-header-text')}><h3 className={part('timeline__phase-title')}>{title}</h3><span className={part('timeline__phase-duration')}>{duration}</span></div>
                <TrendingUp className={part('timeline__phase-icon')} size={24} />
            </button>
            {expanded && <div className={part('timeline__phase-details')}>{children}</div>}
        </AcademyPanel>
    </div>;
}

export function JourneyTextSection({ appearance, title, children }: { appearance: 'objective' | 'strategy'; title: ReactNode; children: ReactNode }) {
    return <div className={part(`timeline__phase-${appearance}`)}><strong>{title}</strong> {children}</div>;
}

export function JourneyChecklist({ appearance = 'checklist', title, items }: { appearance?: 'errors' | 'checklist'; title: ReactNode; items: string[] }) {
    return <div className={part(`timeline__phase-${appearance}`)}><strong>{title}</strong><ul>{items.map((item, i) => <li key={i}>{appearance === 'checklist' && <Check size={16} className={part('timeline__check-icon')} />}{item}</li>)}</ul></div>;
}

export function JourneyAllocation({ title, items }: { title: ReactNode; items: [string, string][] }) {
    return <div className={part('timeline__phase-allocation')}><strong>{title}</strong><div className={part('timeline__allocation-options')}>{items.map(([label, value]) => <div key={label} className={part('timeline__allocation-option')}><span className={part('timeline__allocation-label')}>{label}</span><span className={part('timeline__allocation-value')}>{value}</span></div>)}</div></div>;
}

export function JourneyNotice({ children }: { children: ReactNode }) {
    return <div className={part('timeline__disclaimer')}>{children}</div>;
}

export function JourneyGuideLink({ to, title, description }: { to: string; title: ReactNode; description: ReactNode }) {
    return <Link to={to} className={part('timeline__guide-link')}><strong>{title}</strong><span>{description}</span></Link>;
}
