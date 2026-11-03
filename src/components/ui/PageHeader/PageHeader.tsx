import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
    eyebrow: string;
    children: ReactNode;
}

export function PageHeader({ eyebrow, className = '', children, ...props }: PageHeaderProps) {
    return (
        <header {...props} data-ui="page-header" className={cn(
            'page-header tw:relative tw:isolate tw:mb-[1.4rem] tw:overflow-hidden tw:border tw:border-line tw:rounded-[18px] tw:bg-page-header tw:bg-surface tw:shadow-ui-sm tw:text-left tw:[--page-header-inline-padding:2rem] tw:pt-15 tw:px-(--page-header-inline-padding) tw:pb-8',
            'tw:after:absolute tw:after:inset-px tw:after:-z-10 tw:after:border tw:after:border-white/[.08] tw:after:rounded-[inherit] tw:after:content-[\'\'] tw:after:pointer-events-none',
            'tw:[&_h1]:max-w-[820px] tw:[&_h1]:m-0 tw:[&_h1]:mb-[.65rem] tw:[&_h1]:text-[clamp(1.6rem,2.3vw,2.35rem)] tw:[&_h1]:font-extrabold tw:[&_h1]:leading-[1.2] tw:[&_h1]:text-main',
            'tw:[&_p]:max-w-[820px] tw:[&_p]:m-0 tw:[&_p]:text-secondary tw:[&_p]:leading-[1.7]',
            'tw:max-[640px]:[--page-header-inline-padding:1.25rem] tw:max-[640px]:mb-3 tw:max-[640px]:pt-[3.15rem] tw:max-[640px]:px-5 tw:max-[640px]:pb-5 tw:max-[640px]:rounded-[14px]',
            'tw:max-[640px]:[&_h1]:mb-[.45rem] tw:max-[640px]:[&_h1]:text-[1.35rem] tw:max-[640px]:[&_h1]:leading-[1.22] tw:max-[640px]:[&_p]:text-[.9rem] tw:max-[640px]:[&_p]:leading-[1.55]',
            'tw:[@media(prefers-reduced-transparency:reduce)]:after:border-line-strong',
            className,
        )}>
            <span className="page-header__eyebrow tw:absolute tw:top-[1.15rem] tw:left-(--page-header-inline-padding) tw:inline-flex tw:items-center tw:min-h-[1.65rem] tw:px-[.7rem] tw:py-[.3rem] tw:border tw:border-[rgba(var(--accent-rgb),.24)] tw:rounded-full tw:bg-[rgba(var(--accent-rgb),.1)] tw:text-accent tw:text-[.72rem] tw:font-extrabold tw:tracking-[.08em] tw:leading-none tw:uppercase tw:max-[640px]:top-4">{eyebrow}</span>
            {children}
        </header>
    );
}
