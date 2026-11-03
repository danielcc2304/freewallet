import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface CalculatorHeroMetricProps {
    label: ReactNode;
    value: ReactNode;
    description: ReactNode;
    appearance: 'payroll' | 'yield';
    icon?: ReactNode;
    valueTestId?: string;
    children?: ReactNode;
}

/** Prominent result with optional supporting data, preserving each material. */
export function CalculatorHeroMetric({ label, value, description, appearance, icon, valueTestId, children }: CalculatorHeroMetricProps) {
    const payroll = appearance === 'payroll';
    const Value = payroll ? 'strong' : 'h2';
    return <div className={payroll
        ? 'salary-calc__hero tw:ui-border-strong tw:rounded-[22px] tw:p-[1.5rem] tw:[background:linear-gradient(135deg,rgba(var(--accent-rgb),.17),rgba(59,130,246,.08)),var(--bg-card)] tw:[border-color:var(--border-accent)] tw:[@media(max-width:480px)]:p-[1.15rem] tw:[@media(max-width:480px)]:rounded-[18px]'
        : 'result-main-card tw:[background:linear-gradient(135deg,#065f46,#3730a3)] tw:text-white tw:p-[2.5rem] tw:rounded-[24px] tw:text-center tw:shadow-[var(--shadow-md)] tw:[[data-appearance=liquid-glass]_&]:text-main'}>
        {payroll ? <div className="salary-calc__section-title tw:ui-row tw:gap-[.65rem] tw:mb-[.8rem] tw:text-[.87rem] tw:text-secondary tw:[&_svg]:text-accent tw:[&_svg]:shrink-0">{icon}<span>{label}</span></div>
            : <span className="label tw:text-[1rem] tw:font-semibold tw:opacity-90 tw:mb-[.5rem]">{label}</span>}
        <Value data-testid={valueTestId} className={cn(payroll
            ? 'tw:block tw:text-[length:clamp(2.1rem,3.8vw,3.1rem)] tw:tracking-[-.045em] tw:leading-[1.25] tw:tabular-nums tw:[@media(max-width:480px)]:text-[2.3rem]'
            : 'result-value tw:text-[3.5rem] tw:font-extrabold tw:m-0 tw:text-inherit')}>{value}</Value>
        <p className={payroll ? 'tw:text-[.81rem] tw:text-secondary tw:mt-[.6rem]'
            : 'result-main-card__subtext tw:mt-[1rem] tw:text-[.85rem] tw:font-medium tw:text-[rgba(255,255,255,.95)] tw:[text-shadow:0_1px_2px_rgba(0,0,0,.1)] tw:[[data-appearance=liquid-glass]_&]:text-secondary tw:[[data-appearance=liquid-glass]_&]:[text-shadow:none]'}>{description}</p>
        {children}
    </div>;
}
