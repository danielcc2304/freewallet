import type { ButtonHTMLAttributes, HTMLAttributes, SelectHTMLAttributes, ReactNode, ComponentProps } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { FormField } from '../FormField';
import { cn } from '../../../utils/cn';
import { PlanningStyle as p } from './Planning.styles';
import { TransactionsStyle as t } from './Transactions.styles';
import { workspaceLayout as s, workspaceLayouts } from './WorkspaceLayout.styles';
type Appearance = keyof typeof workspaceLayouts;
export function WorkspaceText({
    as: Tag = 'p',
    appearance,
    className,
    ...props
}: HTMLAttributes<HTMLElement> & { as?: 'p' | 'span' | 'small' | 'strong' | 'h1' | 'h2'; appearance: Appearance }) {
    return <Tag {...props} className={s(appearance, className)} />;
}
export function WorkspaceButton({
    appearance,
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { appearance: Appearance }) {
    return <button {...props} className={s(appearance, className)} />;
}
export function WorkspaceSelect({
    appearance,
    className,
    ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { appearance: Appearance }) {
    return <select {...props} className={s(appearance, className)} />;
}
export function WorkspaceLink({ appearance, className, ...props }: LinkProps & { appearance: Appearance }) {
    return <Link {...props} className={s(appearance, className)} />;
}
export function WorkspaceField({
    appearance,
    className,
    ...props
}: Omit<ComponentProps<typeof FormField>,'appearance'> & { appearance: Appearance }) {
    return <FormField {...props} className={s(appearance, className)} />;
}
export function PlanningCheck({
    severity,
    icon,
    title,
    description,
    ...props
}: Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
    severity: 'good' | 'warn';
    icon: ReactNode;
    title: ReactNode;
    description: ReactNode;
}) {
    return (
        <div
            {...props}
            className={cn(
                p('planning-check'),
                p(severity === 'good' ? 'planning-check--good' : 'planning-check--warn'),
            )}
        >
            <div className={p('planning-check__icon')}>{icon}</div>
            <div>
                <strong>{title}</strong>
                <p>{description}</p>
            </div>
        </div>
    );
}
export function PlanningRecordHeader({
    title,
    label,
    action,
}: {
    title: ReactNode;
    label: ReactNode;
    action: ReactNode;
}) {
    return (
        <div className={p('planning-item__header')}>
            <div>
                <h3>{title}</h3>
                <span>{label}</span>
            </div>
            {action}
        </div>
    );
}
export function PlanningProgress({ width, label }: { width: string; label: ReactNode }) {
    return (
        <div className={p('planning-progress')}>
            <div className={p('planning-progress__bar')}>
                <span style={{ width }} />
            </div>
            <strong>{label}</strong>
        </div>
    );
}
export function TransactionRecord({
    main,
    details,
    ...props
}: HTMLAttributes<HTMLElement> & { main: ReactNode; details: ReactNode }) {
    return (
        <article {...props} className={cn(t('transactions-item'), props.className)}>
            <div className={t('transactions-item__main')}>{main}</div>
            <div className={t('transactions-item__meta')}>{details}</div>
        </article>
    );
}
export function TransactionTitle({ symbol, name, extra }: { symbol: ReactNode; name: ReactNode; extra?: ReactNode }) {
    return (
        <h3 className={t('transactions-item__title')}>
            {symbol}
            <span>{name}</span>
            {extra}
        </h3>
    );
}
export function TransactionFilter({
    active,
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
    return (
        <button
            {...props}
            className={cn(t('transactions-page__chip'), active && t('transactions-page__chip--active'), className)}
        />
    );
}
