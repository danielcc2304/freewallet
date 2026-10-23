import type { ReactNode } from 'react';
import { AcademyPanel } from './AcademyPanel';

interface AcademyExplainerCardProps {
    title: ReactNode;
    children: ReactNode;
    range: ReactNode;
}

/** A concept, its explanation and a compact reference range. */
export function AcademyExplainerCard({ title, children, range }: AcademyExplainerCardProps) {
    return <AcademyPanel variant="explainer" className="metric-explainer">
        <h4 className="tw:text-accent tw:mb-[.5rem] tw:font-bold">{title}</h4>
        <p className="tw:text-[.9rem] tw:text-secondary tw:leading-[1.5] tw:mb-[1rem]">{children}</p>
        <div className="metric-explainer__range tw:flex tw:justify-between tw:gap-[.75rem] tw:text-[.75rem] tw:font-bold tw:text-muted tw:p-[.5rem] tw:ui-fill-muted tw:rounded-[8px] tw:mt-auto">{range}</div>
    </AcademyPanel>;
}
