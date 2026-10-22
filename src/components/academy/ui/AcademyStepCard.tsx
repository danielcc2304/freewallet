import type { ReactNode } from 'react';
import { AcademyPanel } from './AcademyPanel';
import { cn } from '../../../utils/cn';

interface AcademyStepCardProps {
    number: ReactNode;
    title: ReactNode;
    children: ReactNode;
    badge?: ReactNode;
    badgeTone?: 'recommended' | 'fiscal' | 'advanced';
}
const badgeColors = {
    recommended: 'tw:bg-[#10b981]',
    fiscal: 'tw:bg-[#8b5cf6]',
    advanced: 'tw:bg-[#f59e0b]',
};

/** A complete numbered learning step, including its heading, body and optional badge. */
export function AcademyStepCard({ number, title, children, badge, badgeTone = 'recommended' }: AcademyStepCardProps) {
    return <AcademyPanel variant="step" className="step-card tw:text-left tw:ui-stack tw:items-start">
        <div className="step-card__number tw:w-[32px] tw:h-[32px] tw:bg-accent tw:text-white tw:rounded-[50%] tw:ui-row tw:justify-center tw:font-extrabold tw:m-[0_0_1rem] tw:shrink-0">{number}</div>
        <h4 className="tw:m-[0_0_.5rem] tw:text-[1rem] tw:font-bold">{title}</h4>
        <p className="tw:text-[.9rem] tw:text-secondary tw:leading-[1.65] tw:m-[0_0_.75rem]">{children}</p>
        {badge != null && <span className={cn('step-card__badge', `step-card__badge--${badgeTone}`, 'tw:static tw:mt-auto tw:text-[.75rem] tw:p-[.2rem_.5rem] tw:rounded-[100px] tw:font-bold tw:normal-case tw:text-white', badgeColors[badgeTone])}>{badge}</span>}
    </AcademyPanel>;
}
