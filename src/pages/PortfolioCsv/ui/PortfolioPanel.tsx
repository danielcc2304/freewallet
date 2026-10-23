import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface PortfolioPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    as?: 'article' | 'section';
    title?: ReactNode;
    description?: ReactNode;
    status?: ReactNode;
    full?: boolean;
    wide?: boolean;
}

/** Shared analysis card, including its optional title, description and status row. */
export function PortfolioPanel({ as: Tag = 'article', title, description, status, full, wide, className, children, ...props }: PortfolioPanelProps) {
    const heading = <>{title != null && <h2>{title}</h2>}{description != null && <p>{description}</p>}</>;
    return <Tag {...props} className={cn('portfolio-csv-card tw:ui-fill-surface tw:ui-border tw:rounded-[14px] tw:p-[1rem] tw:[&_h2]:m-[0_0_.5rem] tw:[&_h2]:text-[length:var(--font-size-lg)] tw:[&_h2]:ui-row tw:[&_h2]:gap-[.4rem] tw:[&_p]:m-[0_0_.7rem] tw:[&_p]:text-secondary tw:[&_p]:text-[length:var(--font-size-sm)] tw:[&_p]:leading-[1.55]', full && 'portfolio-csv-card--full tw:mb-[.9rem]', wide && 'portfolio-csv-card--wide tw:col-[span_2]', className)}>
        {status != null ? <div className="portfolio-csv-card__heading-row tw:flex tw:items-start tw:justify-between tw:gap-[1rem] tw:[&_h2]:mt-0 tw:[&_p]:mt-0"><div>{heading}</div>{status}</div> : heading}
        {children}
    </Tag>;
}
