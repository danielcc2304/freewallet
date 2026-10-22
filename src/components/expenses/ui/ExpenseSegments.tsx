import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface ExpenseSegmentsProps<T extends string> extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
    variant?: 'tabs' | 'form';
    value: T;
    options: readonly { value: T; label: ReactNode; icon?: ReactNode }[];
    onChange: (value: T) => void;
}
export function ExpenseSegments<T extends string>({ variant = 'tabs', value, options, onChange, className, ...props }: ExpenseSegmentsProps<T>) {
    const tabs = variant === 'tabs';
    const Tag = tabs ? 'nav' : 'div';
    return <Tag {...props} className={cn(tabs ? 'expense-tabs tw:flex tw:gap-[.25rem] tw:p-[.35rem] tw:ui-border-strong tw:rounded-[15px] tw:ui-fill-panel tw:mb-[1.3rem] tw:overflow-x-auto tw:[scrollbar-width:thin]' : 'expense-segmented tw:flex tw:gap-[.25rem] tw:p-[.3rem] tw:ui-fill-muted tw:rounded-[11px] tw:mb-[1rem]', className)}>
        {options.map(option => <button key={option.value} type={tabs ? undefined : 'button'} aria-pressed={value === option.value} onClick={() => onChange(option.value)}
            className={cn(tabs ? "tw:ui-row tw:justify-center tw:gap-[.5rem] tw:flex-[1_0_auto] tw:min-h-[44px] tw:p-[.6rem_.9rem] tw:[border:0] tw:rounded-[11px] tw:ui-fill-transparent tw:text-secondary tw:[font-weight:inherit] tw:[font-family:inherit] tw:[font-style:inherit] tw:[font-variant:inherit] tw:[font-stretch:inherit] tw:[line-height:inherit] tw:text-[length:.86rem] tw:cursor-pointer" : "tw:min-h-[40px] tw:[border:0] tw:ui-fill-transparent tw:text-secondary tw:[font-weight:inherit] tw:[font-family:inherit] tw:[font-style:inherit] tw:[font-variant:inherit] tw:[font-stretch:inherit] tw:[line-height:inherit] tw:text-[length:.8rem] tw:rounded-[8px] tw:flex-[1] tw:p-[.4rem] tw:cursor-pointer", value === option.value && (tabs ? "tw:aria-pressed:bg-[rgba(var(--accent-rgb),.16)] tw:aria-pressed:text-accent tw:aria-pressed:font-[700]" : "tw:aria-pressed:bg-[var(--accent-primary)] tw:aria-pressed:text-[#071b14] tw:aria-pressed:font-[650]"))}>
            {option.icon}{option.label}
        </button>)}
    </Tag>;
}
