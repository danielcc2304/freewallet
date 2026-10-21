import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface CalculatorFieldProps extends HTMLAttributes<HTMLDivElement> {
    controlId: string;
    label: ReactNode;
    icon?: ReactNode;
    unit?: ReactNode;
    afterControl?: ReactNode;
    children: ReactNode;
}

/** Shared field chrome; native input/select values and event handlers stay with each tool. */
export function CalculatorField({ controlId, label, icon, unit, afterControl, children, className, ...props }: CalculatorFieldProps) {
    return <div {...props} className={cn('calc__input-group tw:mb-[1.5rem] tw:ui-stack', className)}>
        <label htmlFor={controlId} className="tw:block tw:text-[.9rem] tw:font-medium tw:text-secondary tw:mb-[.5rem]">{label}</label>
        <div className="calc__input-wrapper tw:ui-row tw:gap-[.5rem] tw:ui-fill-muted tw:ui-border tw:rounded-control tw:p-[.75rem_.6rem] tw:[transition:all_var(--transition-fast)] tw:focus-within:border-accent tw:focus-within:shadow-[0_0_0_3px_rgba(16,185,129,.1)] tw:focus-within:ui-fill-surface tw:[&_svg]:text-muted tw:[&_svg]:shrink-0 tw:[&_:is(input,select)]:flex-1 tw:[&_:is(input,select)]:ui-fill-transparent tw:[&_:is(input,select)]:[border:none] tw:[&_:is(input,select)]:text-main tw:[&_:is(input,select)]:text-[1rem] tw:[&_:is(input,select)]:font-semibold tw:[&_:is(input,select)]:[outline:none] tw:[&_:is(input,select)]:min-w-0 tw:[&_:is(input,select)]:text-center tw:[&_.unit]:text-muted tw:[&_.unit]:text-[.9rem] tw:[&_.unit]:font-medium">
            {icon}{children}{unit != null && <span className="unit">{unit}</span>}
        </div>
        {afterControl}
    </div>;
}
