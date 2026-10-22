import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface CalculatorFieldProps extends HTMLAttributes<HTMLDivElement> {
    controlId: string;
    appearance?: 'standard' | 'payroll';
    label: ReactNode;
    icon?: ReactNode;
    unit?: ReactNode;
    afterControl?: ReactNode;
    children: ReactNode;
}

/** Shared field chrome; native input/select values and event handlers stay with each tool. */
export function CalculatorField({ controlId, label, icon, unit, afterControl, children, className, appearance = 'standard', ...props }: CalculatorFieldProps) {
    if (appearance === 'payroll') return <div {...props} className={cn('salary-calc__field tw:min-w-0 tw:ui-stack tw:gap-[.5rem] tw:mb-[.8rem] tw:[&_small]:text-[.79rem] tw:[&_small]:text-secondary tw:[&_small]:leading-[1.6] tw:[&_:is(input,select)]:w-full tw:[&_:is(input,select)]:min-w-0 tw:[&_:is(input,select)]:min-h-[48px] tw:[&_:is(input,select)]:ui-border-strong tw:[&_:is(input,select)]:rounded-[12px] tw:[&_:is(input,select)]:text-main tw:[&_:is(input,select)]:ui-fill-surface tw:[&_:is(input,select)]:[font-family:inherit] tw:[&_:is(input,select)]:[font-style:inherit] tw:[&_:is(input,select)]:[font-weight:inherit] tw:[&_:is(input,select)]:[font-variant:inherit] tw:[&_:is(input,select)]:[font-stretch:inherit] tw:[&_:is(input,select)]:[line-height:inherit] tw:[&_:is(input,select)]:text-[.93rem] tw:[&_:is(input,select)]:p-[.7rem_.85rem] tw:[&_input[type=number]]:pr-[3.4rem] tw:[&_option]:text-main tw:[&_option]:ui-fill-surface', className)}>
        <label htmlFor={controlId} className="tw:text-[.86rem] tw:font-[650]">{label}</label>
        {unit != null ? <div className="salary-calc__input-wrap tw:relative">{children}<span className="tw:absolute tw:right-[.9rem] tw:top-1/2 tw:-translate-y-1/2 tw:pointer-events-none tw:text-secondary tw:text-[.8rem]">{unit}</span></div> : children}
        {afterControl}
    </div>;
    return <div {...props} className={cn('calc__input-group tw:mb-[1.5rem] tw:ui-stack', className)}>
        <label htmlFor={controlId} className="tw:block tw:text-[.9rem] tw:font-medium tw:text-secondary tw:mb-[.5rem]">{label}</label>
        <div className="calc__input-wrapper tw:ui-row tw:gap-[.5rem] tw:ui-fill-muted tw:ui-border tw:rounded-control tw:p-[.75rem_.6rem] tw:[transition:all_var(--transition-fast)] tw:focus-within:border-accent tw:focus-within:shadow-[0_0_0_3px_rgba(16,185,129,.1)] tw:focus-within:ui-fill-surface tw:[&_svg]:text-muted tw:[&_svg]:shrink-0 tw:[&_:is(input,select)]:flex-1 tw:[&_:is(input,select)]:ui-fill-transparent tw:[&_:is(input,select)]:[border:none] tw:[&_:is(input,select)]:text-main tw:[&_:is(input,select)]:text-[1rem] tw:[&_:is(input,select)]:font-semibold tw:[&_:is(input,select)]:[outline:none] tw:[&_:is(input,select)]:min-w-0 tw:[&_:is(input,select)]:text-center tw:[&_.unit]:text-muted tw:[&_.unit]:text-[.9rem] tw:[&_.unit]:font-medium">
            {icon}{children}{unit != null && <span className="unit">{unit}</span>}
        </div>
        {afterControl}
    </div>;
}
