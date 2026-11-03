import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';

export type DashboardMetricVariant = 'analytics' | 'insights' | 'health' | 'benchmark' | 'position' | 'context' | 'comparison' | 'stat';
interface DashboardMetricProps {
    label: ReactNode;
    value: ReactNode;
    icon?: ReactNode;
    detail?: ReactNode;
    annotation?: ReactNode;
    variant?: DashboardMetricVariant;
    className?: string;
    valueClassName?: string;
}
const roots = {
    analytics: 'tw:grid tw:gap-[.35rem] tw:min-w-0 tw:p-[.8rem] tw:ui-border tw:rounded-control tw:ui-fill-muted tw:[&_svg]:text-accent',
    insights: 'tw:relative tw:grid tw:gap-[.3rem] tw:min-w-0 tw:p-[.8rem] tw:ui-border tw:rounded-control tw:ui-fill-muted tw:[&_span]:text-muted tw:[&_span]:text-[.72rem] tw:[&_.portfolio-excel-insights__missing]:absolute tw:[&_.portfolio-excel-insights__missing]:top-0 tw:[&_.portfolio-excel-insights__missing]:right-0',
    health: 'tw:grid tw:grid-cols-[auto_1fr] tw:items-center tw:gap-[.35rem_.55rem] tw:p-[1rem] tw:rounded-control tw:ui-border tw:ui-fill-muted tw:[&_svg]:text-accent',
    benchmark: 'tw:grid tw:gap-[.35rem] tw:p-[.8rem] tw:ui-border tw:rounded-control tw:ui-fill-muted tw:min-w-0 tw:[&_svg]:text-accent',
    position: 'tw:grid tw:gap-[.3rem] tw:min-w-0 tw:overflow-hidden tw:p-[.85rem] tw:ui-border-default tw:rounded-[10px] tw:[background:rgba(255,255,255,.02)]',
    context: 'tw:grid tw:gap-[.2rem] tw:min-w-0',
    comparison: 'tw:grid tw:gap-[.3rem] tw:p-[.75rem] tw:ui-border tw:rounded-[9px] tw:ui-fill-muted',
    stat: 'tw:grid tw:gap-[.2rem] tw:p-[.6rem] tw:text-muted tw:text-[.7rem] tw:ui-border tw:rounded-[8px]',
};
const labels = {
    analytics: 'tw:text-muted tw:text-[.72rem]', insights: '', health: 'tw:text-muted tw:text-[length:var(--font-size-xs)]',
    benchmark: 'tw:text-muted tw:text-[.75rem]', position: 'tw:text-muted tw:text-[.72rem]', context: 'tw:text-muted tw:text-[.7rem]', comparison: 'tw:text-muted tw:text-[.72rem]', stat: '',
};
const values = {
    analytics: 'tw:text-main tw:text-[.95rem] tw:wrap-anywhere', insights: 'tw:text-main tw:text-[.95rem] tw:wrap-anywhere',
    health: 'tw:col-span-full tw:text-main tw:text-[1.05rem]', benchmark: 'tw:text-main tw:wrap-anywhere',
    position: 'tw:text-[.92rem] tw:wrap-anywhere tw:min-w-0', context: 'tw:text-main tw:text-[.82rem] tw:wrap-anywhere',
    comparison: 'tw:text-main tw:text-[.95rem]', stat: 'tw:text-main tw:text-[.85rem]',
};
const tones: Record<string, string> = { 'is-positive': 'tw:text-positive', 'is-negative': 'tw:text-negative', 'is-warning': 'tw:text-[color:var(--color-warning)]' };

/** Receives formatted data; never calculates returns or substitutes missing values. */
export function DashboardMetric({ label, value, icon, detail, annotation, variant = 'analytics', className, valueClassName }: DashboardMetricProps) {
    if (variant === 'stat') return <span className={cn(roots.stat, className)}>{label}<strong className={values.stat}>{value}</strong></span>;
    return <div className={cn(roots[variant], className)}>
        {icon && (variant === 'insights' ? <span className="portfolio-excel-insights__kpi-icon tw:inline-flex">{icon}</span> : icon)}
        <span className={labels[variant]}>{label}</span>
        <strong className={cn(values[variant], valueClassName, (variant === 'analytics' || variant === 'insights') && tones[valueClassName ?? ''])}>{value}</strong>
        {annotation}
        {detail != null && <small className={variant === 'health' ? 'tw:col-span-full tw:text-secondary' : 'tw:text-muted tw:text-[.72rem]'}>{detail}</small>}
    </div>;
}
