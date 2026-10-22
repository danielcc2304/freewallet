import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

type Appearance = 'summary' | 'periods' | 'mode' | 'tabs' | 'chart';
interface Option<T extends string> {
    value: T;
    label: ReactNode;
    icon?: ReactNode;
    buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children'>;
}
interface DashboardSegmentsProps<T extends string> extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
    options: readonly Option<T>[];
    value: T;
    onChange: (value: T) => void;
    appearance: Appearance;
}
const roots = {
    summary: 'tw:flex tw:flex-wrap tw:gap-ui-xs tw:ui-fill-muted tw:p-ui-xs tw:rounded-control tw:[@media(max-width:640px)]:w-full tw:[@media(max-width:640px)]:justify-between',
    periods: 'tw:flex tw:gap-[.2rem] tw:p-[.2rem] tw:rounded-[8px] tw:ui-fill-surface tw:[@media(max-width:680px)]:grid tw:[@media(max-width:680px)]:grid-cols-[repeat(6,minmax(0,1fr))] tw:[@media(max-width:680px)]:w-full tw:[@media(max-width:680px)]:min-w-0',
    mode: 'tw:flex tw:flex-wrap tw:gap-[.2rem] tw:p-[.2rem] tw:rounded-[8px] tw:ui-fill-surface tw:[@media(max-width:680px)]:grid tw:[@media(max-width:680px)]:grid-cols-[repeat(2,minmax(0,1fr))] tw:[@media(max-width:680px)]:w-full',
    tabs: 'tw:flex tw:flex-wrap tw:gap-[.35rem] tw:m-[1rem_0] tw:p-[.3rem] tw:rounded-[10px] tw:ui-fill-muted',
    chart: 'tw:flex tw:flex-wrap tw:gap-[.25rem] tw:ui-fill-muted tw:p-[.25rem] tw:rounded-[8px] tw:max-w-full',
};
const buttons = {
    summary: 'portfolio-summary__tab tw:p-[var(--spacing-xs)_var(--spacing-md)] tw:text-[length:var(--font-size-sm)] tw:font-medium tw:[border:none] tw:rounded-[var(--radius-sm)] tw:text-muted tw:cursor-pointer tw:[transition:all_var(--transition-fast)] tw:[&:hover]:text-main tw:min-h-[44px] tw:[@media(max-width:640px)]:flex-1 tw:[@media(max-width:640px)]:text-center tw:[@media(max-width:640px)]:p-ui-sm',
    periods: 'tw:[border:0] tw:rounded-[6px] tw:p-[.3rem_.5rem] tw:text-muted tw:cursor-pointer tw:text-[.7rem] tw:min-h-[44px] tw:[@media(max-width:680px)]:min-w-0 tw:[@media(max-width:680px)]:[padding-inline:.2rem] tw:[@media(max-width:680px)]:whitespace-nowrap',
    mode: 'tw:min-h-[44px] tw:[border:0] tw:rounded-[6px] tw:p-[.4rem_.65rem] tw:text-muted tw:cursor-pointer tw:[font-family:inherit] tw:[font-style:inherit] tw:[font-weight:inherit] tw:[line-height:inherit] tw:[font-variant:inherit] tw:text-[.8rem] tw:[@media(max-width:680px)]:min-w-0',
    tabs: 'tw:inline-flex tw:items-center tw:gap-[.35rem] tw:[border:0] tw:rounded-[7px] tw:p-[.45rem_.7rem] tw:text-muted tw:cursor-pointer tw:text-[.76rem]',
    chart: 'period-btn tw:min-h-[44px] tw:p-[.25rem_.75rem] tw:[border:none] tw:text-secondary tw:text-[.75rem] tw:font-semibold tw:rounded-[6px] tw:cursor-pointer tw:[transition:all_.2s]',
};

/** Controlled buttons; callers retain period changes, transitions and tab keyboard handlers. */
export function DashboardSegments<T extends string>({ options, value, onChange, appearance, className, ...props }: DashboardSegmentsProps<T>) {
    return <div {...props} className={cn(roots[appearance], className)}>{options.map(option => {
        const active = option.value === value;
        return <button key={option.value} type="button" aria-pressed={appearance === 'tabs' ? undefined : active} {...option.buttonProps}
            className={cn(buttons[appearance], appearance !== 'chart' && 'tw:focus-visible:[outline:2px_solid_var(--accent-primary)] tw:focus-visible:outline-offset-2',
                active && (appearance === 'summary' ? 'portfolio-summary__tab--active' : appearance === 'chart' ? 'active' : 'is-active'),
                active ? 'tw:[background:var(--accent-primary)] tw:text-white' : appearance === 'chart' ? 'tw:ui-fill-transparent tw:[&:hover]:text-main tw:[&:hover]:[background:rgba(255,255,255,.05)]' : appearance === 'summary' ? 'tw:ui-fill-transparent' : 'tw:ui-fill-transparent tw:[&:hover]:[background:var(--accent-primary)] tw:[&:hover]:text-white', option.buttonProps?.className)}
            onClick={() => onChange(option.value)}>{option.icon}{option.label}</button>;
    })}</div>;
}
