import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

type Variant = 'hero' | 'allocation' | 'crisis' | 'timing';
interface AcademyMetricProps {
    variant: Variant;
    label: ReactNode;
    value: ReactNode;
    detail?: ReactNode;
    icon?: ReactNode;
    valueProps?: HTMLAttributes<HTMLElement> & { 'data-testid'?: string };
}
const roots = {
    hero: "tw:ui-stack tw:gap-[0.25rem] tw:text-center tw:min-w-[170px]",
    allocation: "tw:ui-fill-surface tw:ui-border-default tw:p-[var(--academy-space-card)] tw:rounded-[20px] tw:ui-stack tw:items-center tw:text-center",
    crisis: "tw:grid tw:gap-[.5rem] tw:p-[1rem] tw:ui-border-default tw:ui-fill-muted tw:rounded-[12px] tw:min-w-[0]",
    timing: "tw:ui-stack tw:min-w-[0] tw:p-[.8rem] tw:ui-border tw:rounded-[10px] tw:ui-fill-muted",
};
const labels = {
    hero: "tw:text-[length:0.8rem] tw:text-muted",
    allocation: "tw:text-[length:0.8rem] tw:text-secondary tw:mb-[0.5rem]",
    crisis: "tw:text-[length:.8rem] tw:text-secondary",
    timing: "tw:text-[length:.75rem] tw:text-secondary",
};
const values = {
    hero: "tw:text-[length:1.5rem]",
    allocation: "tw:text-[length:2rem] tw:text-main",
    crisis: "tw:text-[length:1.35rem] tw:mt-[auto]",
    timing: "tw:mt-[.3rem] tw:text-[length:clamp(1rem,_1.6vw,_1.3rem)] tw:wrap-anywhere",
};
const details = {
    hero: "",
    allocation: "tw:text-[length:0.8rem] tw:text-secondary tw:mt-[0.25rem]",
    crisis: "",
    timing: "tw:mt-[.2rem] tw:text-[length:.65rem] tw:text-muted",
};
/** Receives formatted values; financial calculations and state stay in their original modules. */
export function AcademyMetric({ variant, label, value, detail, icon, valueProps }: AcademyMetricProps) {
    const labelNode = <span className={cn(variant === 'hero' ? 'hero-stat__label' : variant === 'allocation' ? 'label' : undefined, labels[variant])}>{label}</span>;
    const valueClass = cn(values[variant], valueProps?.className ?? (variant === 'hero' ? 'hero-stat__value' : variant === 'allocation' ? 'value' : undefined));
    const valueNode = variant === 'hero' || variant === 'allocation'
        ? <span {...valueProps} className={valueClass}>{value}</span>
        : <strong {...valueProps} className={valueClass}>{value}</strong>;
    return <div className={cn(variant === 'hero' ? 'hero-stat' : variant === 'allocation' ? 'alloc-sim__stat-card' : variant === 'crisis' ? 'crisis__stat' : undefined, roots[variant])}>
        {icon}
        {variant === 'hero' ? <>{valueNode}{labelNode}</> : <>{labelNode}{valueNode}</>}
        {detail != null && (variant === 'allocation' ? <p className={cn('desc', details[variant])}>{detail}</p> : <small className={details[variant]}>{detail}</small>)}
    </div>;
}
