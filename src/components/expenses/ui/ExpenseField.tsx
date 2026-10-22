import type { HTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface ExpenseFieldProps extends LabelHTMLAttributes<HTMLLabelElement> { label: ReactNode; labelProps?: HTMLAttributes<HTMLSpanElement> }
/** Implicit label association and the original native controls are preserved. */
export function ExpenseField({ label, labelProps, children, className, ...props }: ExpenseFieldProps) {
    return <label {...props} className={cn('expense-field', "tw:min-w-[0] tw:ui-stack tw:gap-[.5rem] tw:m-[.2rem_0_.75rem] tw:[&_:is(input,select,textarea)]:w-full tw:[&_:is(input,select,textarea)]:min-w-[0] tw:[&_:is(input,select,textarea)]:min-h-[44px] tw:[&_:is(input,select,textarea)]:ui-border-strong tw:[&_:is(input,select,textarea)]:rounded-[11px] tw:[&_:is(input,select,textarea)]:ui-fill-surface tw:[&_:is(input,select,textarea)]:text-main tw:[&_:is(input,select,textarea)]:[font-weight:inherit] tw:[&_:is(input,select,textarea)]:[font-family:inherit] tw:[&_:is(input,select,textarea)]:[font-style:inherit] tw:[&_:is(input,select,textarea)]:[font-variant:inherit] tw:[&_:is(input,select,textarea)]:[font-stretch:inherit] tw:[&_:is(input,select,textarea)]:[line-height:inherit] tw:[&_:is(input,select,textarea)]:p-[.7rem_.8rem] tw:[&_:is(input,select,textarea)]:text-[length:.87rem] tw:[&_select_option]:ui-fill-surface tw:[&_select_option]:text-main tw:[&_input[type=color]]:p-[.35rem] tw:[&_input[type=color]]:max-w-[120px] tw:[&_textarea]:[resize:vertical]", className)}>
        <span {...labelProps} className={cn("tw:text-[length:.81rem] tw:[font-weight:650]", labelProps?.className)}>{label}</span>{children}
    </label>;
}
