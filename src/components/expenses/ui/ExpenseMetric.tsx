import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { expenseSurface } from './ExpensePanel';

interface ExpenseMetricProps {
    label: ReactNode;
    value: ReactNode;
    detail: ReactNode;
    className?: string;
    valueProps?: HTMLAttributes<HTMLElement> & { 'data-testid'?: string };
}
/** Values arrive formatted in euros/percent; this component only presents them. */
export function ExpenseMetric({ label, value, detail, className, valueProps }: ExpenseMetricProps) {
    return <article className={cn('expense-stat', expenseSurface, "tw:p-[1.25rem]", className)}>
        <span className="tw:ui-row tw:gap-[.4rem] tw:text-[length:.81rem] tw:text-secondary tw:[line-height:1.45]">{label}</span>
        <strong {...valueProps} className={cn("tw:block tw:m-[.65rem_0_.35rem] tw:text-[length:clamp(1.4rem,2.1vw,2rem)] tw:[font-weight:750] tw:[letter-spacing:-.045em] tw:[font-variant-numeric:tabular-nums] tw:wrap-anywhere", valueProps?.className)}>{value}</strong>
        <small className="tw:text-[length:.73rem] tw:[line-height:1.5] tw:text-secondary tw:block">{detail}</small>
    </article>;
}
