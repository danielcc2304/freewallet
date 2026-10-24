import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { CalculatorCard } from './CalculatorCard';
import { goalStyle as s } from './CalculatorGoal.styles';
export function CalculatorAdvancedOptions({
    expanded,
    onToggle,
    label,
    icon,
    children,
}: {
    expanded: boolean;
    onToggle: () => void;
    label: ReactNode;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className={s('compound__advanced')}>
            <button type="button" className={s('compound__advanced-toggle')} onClick={onToggle}>
                <span>{label}</span>
                {icon}
            </button>
            {expanded && <div className={s('compound__advanced-content')}>{children}</div>}
        </div>
    );
}
export function CalculatorGoalPanel({
    achieved,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & { achieved?: boolean }) {
    return (
        <div
            {...props}
            className={cn(s('compound__goal-result'), achieved && s('compound__goal-result--achieved'), className)}
        />
    );
}
export function CalculatorGoalAchieved({
    badge,
    title,
    description,
}: {
    badge: ReactNode;
    title: ReactNode;
    description: ReactNode;
}) {
    return (
        <div className={s('compound__goal-achieved')}>
            <div className={s('compound__goal-badge')}>{badge}</div>
            <div className="compound__goal-content">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </div>
    );
}
export function CalculatorGoalPending({
    value,
    label,
    children,
}: {
    value: ReactNode;
    label: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className={s('compound__goal-pending')}>
            <div className={s('compound__goal-years-vibe')}>
                <div className="number">{value}</div>
                <div className="label">{label}</div>
            </div>
            <div className={s('compound__goal-text')}>{children}</div>
        </div>
    );
}
export function CalculatorMonthlyGoal({
    icon,
    title,
    value,
    description,
}: {
    icon: ReactNode;
    title: ReactNode;
    value: ReactNode;
    description: ReactNode;
}) {
    return (
        <CalculatorGoalPanel>
            <div className={s('compound__goal-icon')}>{icon}</div>
            <div className="compound__goal-content">
                <h3>{title}</h3>
                <div className={s('compound__goal-years')}>{value}</div>
                <p className="compound__goal-details">{description}</p>
            </div>
        </CalculatorGoalPanel>
    );
}
export function CalculatorYearlyResults({
    title,
    description,
    children,
}: {
    title: ReactNode;
    description: ReactNode;
    children: ReactNode;
}) {
    return (
        <CalculatorCard className={s('compound__detail')}>
            <div className={s('compound__detail-header')}>
                <div>
                    <h4>{title}</h4>
                    <p>{description}</p>
                </div>
            </div>
            <div className={s('compound__detail-list')}>{children}</div>
        </CalculatorCard>
    );
}
