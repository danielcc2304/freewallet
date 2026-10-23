import type { ReactNode } from 'react';
import { AcademyPanel } from './AcademyPanel';
import { cn } from '../../../utils/cn';

interface AcademyListCardProps {
    kind: 'pros' | 'cons' | 'comparison';
    title: ReactNode;
    children: ReactNode;
    badge?: ReactNode;
    className?: string;
}

/** Complete list panel for benefits, risks and side-by-side learning comparisons. */
export function AcademyListCard({ kind, title, children, badge, className }: AcademyListCardProps) {
    const comparison = kind === 'comparison';
    return <AcademyPanel variant={comparison ? 'comparison' : 'prosCons'} className={cn(
        comparison ? 'versus-card' : `pc-column pc-column--${kind}`,
        kind === 'pros' && 'tw:bg-[rgba(16,185,129,.04)]',
        kind === 'cons' && 'tw:bg-[rgba(239,68,68,.04)]',
        className,
    )}>
        <h3 className={comparison ? 'tw:text-center tw:mb-[1.5rem]' : cn('tw:ui-row tw:gap-[.5rem] tw:text-[1.1rem] tw:font-bold tw:m-[0_0_1rem]', kind === 'pros' ? 'tw:text-[#10b981]' : 'tw:text-[#ef4444]')}>{title}</h3>
        <ul className={cn('tw:list-none tw:p-0 tw:ui-stack tw:[&_li]:text-[.95rem] tw:[&_li]:text-secondary tw:[&_li]:relative tw:[&_li]:before:absolute tw:[&_li]:before:left-0', comparison
            ? "tw:gap-[.75rem] tw:[&_li]:pl-[1.25rem] tw:[&_li]:before:content-['•'] tw:[&_li]:before:text-accent"
            : "tw:m-0 tw:gap-[1rem] tw:[&_li]:leading-[1.65] tw:[&_li]:pl-[1.5rem] tw:[&_li]:before:content-['→'] tw:[&_li]:before:font-bold")}>{children}</ul>
        {badge != null && <div className="versus-card__badge tw:static tw:[transform:none] tw:block tw:w-fit tw:m-[1rem_auto_0] tw:text-center tw:ui-fill-muted tw:ui-border-default tw:p-[.4rem_1rem] tw:rounded-[100px] tw:text-[.8rem] tw:font-bold tw:text-accent">{badge}</div>}
    </AcademyPanel>;
}
