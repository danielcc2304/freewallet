import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { calculatorToolClass as part } from './calculatorToolStyles';

export function CalculatorEducationCard({ icon, title, children, appearance = 'standard' }: { appearance?: 'standard' | 'fire'; icon: ReactNode; title: ReactNode; children: ReactNode }) {
    if (appearance === 'fire') return <div className={part('fire__theory-card')}>{isValidElement(icon) ? cloneElement(icon as ReactElement<{ className?: string }>, { className: part('fire__theory-icon') }) : icon}<h3>{title}</h3><p>{children}</p></div>;
    return <div className="edu-card tw:ui-fill-surface tw:ui-border-default tw:p-[2rem] tw:rounded-[24px] tw:[@media(max-width:850px)]:p-[1.5rem] tw:[@media(max-width:850px)]:rounded-[20px] tw:[@media(max-width:480px)]:p-[1.1rem] tw:[@media(max-width:480px)]:rounded-[16px]">
        <h3 className="tw:ui-row tw:gap-[.75rem] tw:text-[1.25rem] tw:mb-[1rem] tw:text-main">{icon}{title}</h3>
        <p className="tw:text-[.95rem] tw:leading-[1.6] tw:text-secondary tw:m-0">{children}</p>
    </div>;
}
