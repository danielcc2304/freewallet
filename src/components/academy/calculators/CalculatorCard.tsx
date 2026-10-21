import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface CalculatorCardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

/** All calculators share the same surface while keeping their local tokens. */
export function CalculatorCard({ className, children, ...props }: CalculatorCardProps) {
    return <div {...props} className={cn(
        'calculator-card tw:[background:var(--calculator-card-bg,var(--bg-secondary))] tw:[border:1px_solid_var(--calculator-card-border,var(--border-color))] tw:rounded-[var(--calculator-card-radius,16px)] tw:p-[var(--calculator-card-padding,2rem)] tw:box-border tw:min-w-0',
        className,
    )}>{children}</div>;
}
