import type { ComponentPropsWithRef } from 'react';
import { cn } from '../../../utils/cn';

const variants = {
    primary: 'tw:text-[#071b14] tw:bg-[var(--accent-primary)]',
    secondary: 'expense-btn--secondary tw:ui-fill-muted tw:border-[color:var(--border-secondary)] tw:text-main',
    quiet: 'expense-btn--quiet tw:ui-fill-transparent tw:text-secondary tw:p-[.4rem_.6rem]',
    danger: 'expense-btn--danger tw:bg-[rgba(251,113,133,.12)] tw:border-[rgba(251,113,133,.35)] tw:text-[#fb7185]',
};
/** Same native button and exact expense variants; no extra icon/layout wrapper. */
export function ExpenseButton({ variant = 'primary', className, ...props }: ComponentPropsWithRef<'button'> & { variant?: keyof typeof variants }) {
    return <button {...props} className={cn('expense-btn tw:inline-flex tw:justify-center tw:items-center tw:gap-[.45rem] tw:min-h-[42px] tw:border tw:border-solid tw:border-transparent tw:rounded-[11px] tw:p-[.65rem_.95rem] tw:[font-family:inherit] tw:[font-style:inherit] tw:[font-variant:inherit] tw:[font-stretch:inherit] tw:[line-height:inherit] tw:text-[.85rem] tw:font-[650] tw:cursor-pointer', variants[variant], className)} />;
}
export function ExpenseIconButton({ className, ...props }: ComponentPropsWithRef<'button'>) {
    return <button {...props} className={cn("tw:min-w-[36px] tw:min-h-[36px] tw:inline-flex tw:justify-center tw:items-center tw:ui-fill-transparent tw:[border:0] tw:rounded-[9px] tw:text-secondary tw:[font-weight:inherit] tw:[font-family:inherit] tw:[font-style:inherit] tw:[font-variant:inherit] tw:[font-stretch:inherit] tw:[line-height:inherit] tw:text-[length:.76rem] tw:p-[.4rem] tw:cursor-pointer", className)} />;
}
