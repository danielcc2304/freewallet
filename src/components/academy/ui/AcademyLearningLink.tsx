import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../../utils/cn';

interface AcademyLearningLinkProps extends Omit<LinkProps, 'title' | 'children'> {
    title: ReactNode;
    description: ReactNode;
    icon?: ReactNode;
    badge?: ReactNode;
    cta?: ReactNode;
    variant: 'catalog' | 'checklist';
}

/** Complete learning cards retain native links, including modified clicks and keyboard navigation. */
export function AcademyLearningLink({ title, description, icon, badge, cta, variant, className, ...props }: AcademyLearningLinkProps) {
    const catalog = variant === 'catalog';
    return <Link {...props} className={cn('tw:bg-[rgba(var(--accent-rgb),.05)] tw:[border-left:4px_solid_var(--accent-primary)] tw:rounded-[8px] tw:p-[1rem_1rem_.95rem] tw:no-underline tw:grid tw:hover:[transform:translateX(2px)] tw:hover:bg-[rgba(var(--accent-rgb),.08)] tw:[@media(max-width:768px)]:pl-[.7rem]', catalog
        ? "fundamentos__card tw:[align-items:start] tw:[transition:all_.25s_ease] tw:grid-cols-[auto_minmax(0,1fr)_auto] tw:[grid-template-areas:'icon_title_meta'_'._description_description'] tw:gap-[.85rem] tw:[@media(max-width:768px)]:grid-cols-[1fr]"
        : 'fundamentos__checklist-card tw:[transition:all_.2s_ease] tw:gap-[.8rem] tw:[align-content:start] tw:text-main', className)}>
        {catalog && <div className="fundamentos__card-icon tw:text-[1.45rem] tw:[grid-area:icon]">{icon}</div>}
        <h3 className={catalog ? 'fundamentos__card-title tw:text-[1rem] tw:font-bold tw:text-main tw:m-0 tw:[grid-area:title]' : 'tw:m-0 tw:text-main tw:pl-[.2rem]'}>{title}</h3>
        <p className={cn('tw:text-secondary tw:leading-[1.6] tw:m-0', catalog && 'fundamentos__card-description tw:[grid-area:description]')}>{description}</p>
        {catalog ? <div className="fundamentos__card-meta tw:flex tw:flex-wrap tw:gap-[.5rem] tw:[grid-area:meta] tw:self-start tw:justify-self-end"><span className="fundamentos__card-badge tw:text-[.78rem] tw:p-[.38rem_.72rem] tw:rounded-[999px] tw:font-semibold tw:bg-[rgba(var(--accent-rgb),.1)] tw:text-accent">{badge}</span></div>
            : <span className="fundamentos__checklist-cta tw:inline-flex tw:items-center tw:w-fit tw:p-[.45rem_.85rem] tw:rounded-[999px] tw:bg-[rgba(var(--accent-rgb),.12)] tw:text-accent tw:text-[.82rem] tw:font-bold">{cta}</span>}
    </Link>;
}

export function AcademyRouteLink({ className, compactOnMobile = false, ...props }: LinkProps & { compactOnMobile?: boolean }) {
    return <Link {...props} className={cn('tw:ui-row tw:gap-[.65rem] tw:p-[1rem_1rem_.95rem] tw:rounded-[8px] tw:bg-[rgba(var(--accent-rgb),.05)] tw:[border-left:4px_solid_var(--accent-primary)] tw:text-main tw:no-underline tw:[transition:all_.2s_ease] tw:hover:text-accent tw:hover:[transform:translateX(2px)] tw:hover:bg-[rgba(var(--accent-rgb),.08)]', compactOnMobile && 'tw:[@media(max-width:768px)]:pl-[.7rem]', className)} />;
}
