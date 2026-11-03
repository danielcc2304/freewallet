import type { HTMLAttributes, FieldsetHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { timingStyle as s } from './AcademyTiming.styles';
export function AcademyTimingIntro({ title, children }: { title: ReactNode; children: ReactNode }) {
    return (
        <div className={s('timing-intro')}>
            <h2>{title}</h2>
            {children}
        </div>
    );
}
export function AcademyTimingQuote({ label, value }: { label: ReactNode; value: ReactNode }) {
    return (
        <div className={s('timing-quote')}>
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}
export function AcademyTimingWallet({ items }: { items: readonly { label: ReactNode; value: ReactNode }[] }) {
    return (
        <div className={s('timing-wallet')}>
            {items.map((item, i) => (
                <span key={i}>
                    {item.label}
                    <strong>{item.value}</strong>
                </span>
            ))}
        </div>
    );
}
export function AcademyTimingPortions({
    legend,
    className,
    children,
    ...props
}: FieldsetHTMLAttributes<HTMLFieldSetElement> & { legend: ReactNode }) {
    return (
        <fieldset {...props} className={cn(s('timing-portions'), className)}>
            <legend>{legend}</legend>
            {children}
        </fieldset>
    );
}
export function AcademyTimingRound({
    title,
    items,
    className,
    ...props
}: Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
    title: ReactNode;
    items: readonly { label: ReactNode; value: ReactNode; className?: string }[];
}) {
    return (
        <div {...props} className={cn(s('timing-round-result'), className)}>
            <strong>{title}</strong>
            {items.map((item, i) => (
                <span key={i} className={item.className}>
                    {item.label}
                    <b>{item.value}</b>
                </span>
            ))}
        </div>
    );
}
export function AcademyTimingRules({ summary, children }: { summary: ReactNode; children: ReactNode }) {
    return (
        <details className={s('timing-rules')}>
            <summary>{summary}</summary>
            {children}
        </details>
    );
}
export function AcademyTimingGoal({ icon, children }: { icon: ReactNode; children: ReactNode }) {
    return (
        <p className={s('timing-goal')}>
            {icon}
            {children}
        </p>
    );
}
