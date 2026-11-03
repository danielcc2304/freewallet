import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface CalculatorPanelProps extends HTMLAttributes<HTMLElement> {
    as?: 'div' | 'aside' | 'main' | 'section';
    surface?: 'surface' | 'muted' | 'canvas' | 'panel';
    border?: 'normal' | 'strong' | 'primary' | 'secondary';
}

/** Calculator surfaces without changing the optical behavior of legacy CalculatorCard. */
export function CalculatorPanel({ as: Tag = 'div', surface = 'surface', border = 'normal', className, ...props }: CalculatorPanelProps) {
    return <Tag {...props} className={cn(
        'calculator-panel tw:p-[1.5rem] tw:rounded-[16px]',
        surface === 'panel' ? 'tw:ui-fill-panel' : surface === 'muted' ? 'tw:ui-fill-muted' : surface === 'canvas' ? 'tw:ui-fill-canvas' : 'tw:ui-fill-surface',
        border === 'primary' ? 'tw:ui-border' : border === 'secondary' ? 'tw:ui-border-strong' : border === 'strong' ? 'tw:[border:2px_solid_var(--border-color)]' : 'tw:ui-border-default',
        className,
    )} />;
}

interface CalculatorMetricProps {
    label: ReactNode;
    value: ReactNode;
    description?: ReactNode;
    framed?: boolean;
    className?: string;
    labelClassName?: string;
    valueClassName?: string;
}

/** Result formatting stays with the calculator; this component owns presentation. */
export function CalculatorMetric({ label, value, description, framed = false, className, labelClassName, valueClassName }: CalculatorMetricProps) {
    const content = <>
        <span className={cn('label tw:text-[.85rem] tw:font-semibold tw:text-secondary tw:uppercase tw:mb-[.5rem]', labelClassName)}>{label}</span>
        <span className={cn('value tw:text-[2.25rem] tw:font-extrabold tw:text-main', valueClassName)}>{value}</span>
        {description != null && <span className="sub tw:text-[.85rem] tw:text-secondary tw:mt-[.5rem]">{description}</span>}
    </>;
    return framed
        ? <CalculatorPanel className={cn('calculator-metric tw:ui-stack tw:p-[2rem] tw:rounded-[20px] tw:text-center', className)}>{content}</CalculatorPanel>
        : <div className={cn('calculator-metric tw:ui-stack', className)}>{content}</div>;
}
