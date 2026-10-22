import type { LabelHTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';

/** Keeps native checked/disabled/change behavior with an implicit label. */
export function ExpenseCheckbox({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
    return <label {...props} className={cn('expense-check', "tw:ui-row tw:gap-[.6rem] tw:text-[length:.81rem] tw:[line-height:1.5] tw:p-[.65rem_0] tw:min-h-[44px] tw:cursor-pointer tw:[&_input]:[accent-color:var(--accent-primary)] tw:[&_input]:w-[17px] tw:[&_input]:h-[17px] tw:[&_input]:shrink-[0]", className)} />;
}
