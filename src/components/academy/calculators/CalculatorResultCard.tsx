import type { ReactElement, ReactNode } from 'react';
import { cloneElement } from 'react';
import { cn } from '../../../utils/cn';
import { CalculatorCard } from './CalculatorCard';

interface CalculatorResultCardProps {
    label: ReactNode;
    value: ReactNode;
    description?: ReactNode;
    layout?: 'investment' | 'centered' | 'icon';
    accent?: 'blue' | 'green' | 'primary' | 'amber' | 'purple';
    highlight?: boolean;
    icon?: ReactElement<{ className?: string }>;
    className?: string;
    slotClasses?: Partial<Record<'label' | 'value' | 'description' | 'content' | 'icon', string>>;
}

// Resolve all four sides together so Tailwind ordering cannot reset an accent.
const accentBorders = {
    investment: {
        blue: 'tw:[--result-border-width:3px_2px_2px] tw:[--result-border-color:#3b82f6_var(--border-color)_var(--border-color)]',
        green: 'tw:[--result-border-width:3px_2px_2px] tw:[--result-border-color:#10b981_var(--border-color)_var(--border-color)]',
        primary: 'tw:[--result-border-width:3px_2px_2px] tw:[--result-border-color:var(--accent-primary)_var(--border-color)_var(--border-color)]',
        amber: 'tw:[--result-border-width:3px_2px_2px] tw:[--result-border-color:#f59e0b_var(--border-color)_var(--border-color)]',
        purple: 'tw:[--result-border-width:3px_2px_2px] tw:[--result-border-color:#8b5cf6_var(--border-color)_var(--border-color)]',
    },
    centered: {
        blue: 'tw:[--result-border-width:1px_1px_1px_4px] tw:[--result-border-color:var(--border-color)_var(--border-color)_var(--border-color)_#3b82f6]',
        green: 'tw:[--result-border-width:1px_1px_1px_4px] tw:[--result-border-color:var(--border-color)_var(--border-color)_var(--border-color)_#10b981]',
        primary: 'tw:[--result-border-width:1px_1px_1px_4px] tw:[--result-border-color:var(--border-color)_var(--border-color)_var(--border-color)_var(--accent-primary)]',
        amber: 'tw:[--result-border-width:1px_1px_1px_4px] tw:[--result-border-color:var(--border-color)_var(--border-color)_var(--border-color)_#f59e0b]',
        purple: 'tw:[--result-border-width:1px_1px_1px_4px] tw:[--result-border-color:var(--border-color)_var(--border-color)_var(--border-color)_#8b5cf6]',
    },
};

/** Owns result markup and styles; callers supply calculated, formatted values. */
export function CalculatorResultCard({ label, value, description, layout = 'investment', accent, highlight = false, icon, className, slotClasses = {} }: CalculatorResultCardProps) {
    const investment = layout === 'investment';
    const centered = layout === 'centered';
    const Label = investment ? 'div' : 'span';
    const Value = investment ? 'div' : 'span';
    const Description = investment ? 'div' : 'p';
    const content = <>
        <Label className={cn('tw:uppercase', investment
            ? 'tw:text-[.875rem] tw:text-[color:var(--text-tertiary)] tw:mb-[.5rem] tw:tracking-[.5px] tw:font-semibold'
            : 'tw:text-[.8rem] tw:font-bold tw:text-secondary', centered && 'tw:block tw:mb-[.5rem]', slotClasses.label)}>{label}</Label>
        <Value className={cn('tw:text-main', investment
            ? 'tw:text-[1.75rem] tw:font-bold tw:mb-[.25rem] tw:[@media(max-width:768px)]:text-[1.5rem]'
            : centered ? 'tw:text-[1.5rem] tw:font-extrabold tw:block' : 'tw:text-[1.75rem] tw:font-extrabold', slotClasses.value)}>{value}</Value>
        {description != null && <Description className={cn('tw:text-secondary', investment ? 'tw:text-[.85rem]' : 'tw:text-[.75rem]', centered ? 'tw:mt-[.5rem]' : !investment && 'tw:m-0', slotClasses.description)}>{description}</Description>}
    </>;
    if (layout === 'icon') return <CalculatorCard className={cn(
        'tw:[--calculator-card-padding:1.25rem] tw:[--calculator-card-radius:16px] tw:ui-row tw:gap-[1.25rem] tw:[transition:transform_.2s_ease] tw:[&:hover]:-translate-y-[2px]',
        highlight && 'tw:[--calculator-card-bg:rgba(var(--accent-rgb),.02)] tw:[--calculator-card-border:rgba(var(--accent-rgb),.2)]', className,
    )}>
        {icon && cloneElement(icon, { className: cn('tw:w-[32px] tw:h-[32px]', highlight ? 'tw:text-[#8b5cf6]' : 'tw:text-secondary', slotClasses.icon, icon.props.className) })}
        <div className={cn('tw:ui-stack', slotClasses.content)}>{content}</div>
    </CalculatorCard>;
    return <div className={cn(
        investment
            ? 'tw:ui-fill-surface tw:rounded-[12px] tw:p-[1.5rem] tw:[border-style:solid] tw:[border-width:var(--result-border-width,2px)] tw:[border-color:var(--result-border-color,var(--border-color))] tw:[transition:all_.3s_ease] tw:min-w-0 tw:box-border tw:[&:hover]:-translate-y-[4px] tw:[&:hover]:shadow-[var(--shadow-lg)]'
            : 'tw:p-[1.5rem] tw:rounded-[16px] tw:text-center tw:[border-style:solid] tw:[border-width:var(--result-border-width,1px)] tw:[border-color:var(--result-border-color,var(--border-color))] tw:[transition:transform_.2s_ease] tw:[&:hover]:-translate-y-[4px]',
        centered && accent === 'primary' && 'tw:[background:rgba(var(--accent-rgb),.02)]',
        accent && accentBorders[investment ? 'investment' : 'centered'][accent], className,
    )}>{content}</div>;
}
