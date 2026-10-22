import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
    label?: ReactNode;
    controlId?: string;
    appearance?: 'standard' | 'calculator';
    labelClassName?: string;
}

/** Explicit label association without taking ownership of native control state. */
export function FormField({ label, controlId, appearance = 'standard', labelClassName, children, className, ...props }: FormFieldProps) {
    const calculator = appearance === 'calculator';
    return <div {...props} className={cn(calculator ? 'tw:mb-[1.5rem] tw:ui-stack' : 'tw:ui-stack tw:gap-ui-xs', className)}>
        {label != null && <label htmlFor={controlId} className={cn(calculator ? 'tw:block tw:text-[.9rem] tw:font-medium tw:text-secondary tw:mb-[.5rem]' : 'tw:text-[length:var(--font-size-sm)] tw:font-medium tw:text-secondary', labelClassName)}>{label}</label>}
        {children}
    </div>;
}

export function FieldHint({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return <p {...props} className={cn('tw:text-[length:var(--font-size-xs)] tw:text-muted tw:m-[var(--spacing-xs)_0_0_0]', className)} />;
}
