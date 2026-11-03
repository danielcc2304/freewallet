import { cn } from '../../../utils/cn';
import { comparisonStyles as styles } from './CalculatorComparison.styles';
import type { HTMLAttributes, ReactNode } from 'react';
export function CalculatorPaymentCard({
    label,
    value,
    detail,
    selected,
}: {
    label: ReactNode;
    value: ReactNode;
    detail: ReactNode;
    selected: boolean;
}) {
    return (
        <div className={cn(styles.payment, selected && 'is-selected')}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
        </div>
    );
}
export function CalculatorScenarioCard({
    title,
    action,
    description,
    value,
    detail,
    children,
    ...props
}: Omit<HTMLAttributes<HTMLElement>, 'title'> & {
    title: ReactNode;
    action: ReactNode;
    description: ReactNode;
    value: ReactNode;
    detail: ReactNode;
}) {
    return (
        <article {...props} className={cn(styles.scenario, props.className)}>
            <div>
                <h3>{title}</h3>
                {action}
            </div>
            <p>{description}</p>
            <strong>
                {value}
                <small>{detail}</small>
            </strong>
            {children}
        </article>
    );
}
