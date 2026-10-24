import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { ExpenseCard } from './ExpensePanel';
import { ExpenseRecordRow } from './ExpenseRecords';
import { expenseOverviewStyle as s } from './expenseOverviewStyles';
export function ExpenseDistribution({
    gradient,
    label,
    value,
    children,
}: {
    gradient: string;
    label: string;
    value: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className={s('expense-distribution')}>
            <div className={s('expense-donut')} style={{ background: gradient }} role="img" aria-label={label}>
                <div>
                    <span>Por categorías</span>
                    <strong>{value}</strong>
                </div>
            </div>
            <ul className={s('expense-legend')}>{children}</ul>
        </div>
    );
}
export function ExpenseLegendItem({
    label,
    value,
    detail,
    color,
}: {
    label: ReactNode;
    value: ReactNode;
    detail?: ReactNode;
    color?: string;
}) {
    return (
        <li>
            <span>
                {color && <i style={{ background: color }} />}
                {label}
            </span>
            <strong>
                {value}
                {detail != null && <small>{detail}</small>}
            </strong>
        </li>
    );
}
export function ExpenseFactList({
    semantic,
    items,
}: {
    semantic: boolean;
    items: readonly { label: ReactNode; value: ReactNode }[];
}) {
    const Root = semantic ? 'dl' : 'div',
        Label = semantic ? 'dt' : 'span',
        Value = semantic ? 'dd' : 'strong';
    return (
        <Root className={s('expense-facts')}>
            {items.map((item, i) => (
                <div key={i}>
                    <Label>{item.label}</Label>
                    <Value>{item.value}</Value>
                </div>
            ))}
        </Root>
    );
}
export function ExpenseChartLegend({ items }: { items: readonly ReactNode[] }) {
    return (
        <div className={s('expense-chart-legend')}>
            {items.map((label, i) => (
                <span key={i}>
                    <i />
                    {label}
                </span>
            ))}
        </div>
    );
}
export function ExpenseBarChart({ children }: { children: ReactNode }) {
    return <div className={s('expense-bar-chart')}>{children}</div>;
}
export function ExpenseMonthBars({
    income,
    spend,
    label,
}: {
    income: HTMLAttributes<HTMLSpanElement>;
    spend: HTMLAttributes<HTMLSpanElement>;
    label: ReactNode;
}) {
    return (
        <div className={s('expense-bar-month')}>
            <div className={s('expense-bar-pair')}>
                <span {...income} />
                <span {...spend} />
            </div>
            <small>{label}</small>
        </div>
    );
}
export function ExpenseSummaryCard({
    appearance,
    header,
    title,
    summary,
    summaryProps,
    progress,
    detail,
    className,
    ...props
}: Omit<ComponentProps<typeof ExpenseCard>, 'title'> & {
    appearance: 'account' | 'goal' | 'category';
    header: ReactNode;
    title?: ReactNode;
    summary: ReactNode;
    summaryProps?: HTMLAttributes<HTMLElement>;
    progress?: ReactNode;
    detail: ReactNode;
}) {
    const account = appearance === 'account';
    return (
        <ExpenseCard
            {...props}
            className={cn(
                s(account ? 'expense-account' : appearance === 'goal' ? 'expense-goal' : 'expense-category-card'),
                className,
            )}
        >
            <ExpenseRecordRow>{header}</ExpenseRecordRow>
            {account && <h3>{title}</h3>}
            <strong {...summaryProps}>{summary}</strong>
            {progress}
            {account ? <small>{detail}</small> : <p className="expense-hint">{detail}</p>}
        </ExpenseCard>
    );
}
export function ExpenseColorDot({ color }: { color: string }) {
    return <i className={s('expense-color-dot')} style={{ background: color }} />;
}
export function ExpenseAccountIcon({ children }: { children: ReactNode }) {
    return <span className={s('expense-account-icon')}>{children}</span>;
}
export function ExpensePagination({
    previous,
    label,
    next,
}: {
    previous: ReactNode;
    label: ReactNode;
    next: ReactNode;
}) {
    return (
        <div className={s('expense-pagination')}>
            {previous}
            <span>{label}</span>
            {next}
        </div>
    );
}
export function ExpenseGettingStarted({
    title,
    description,
    actions,
}: {
    title: ReactNode;
    description: ReactNode;
    actions: ReactNode;
}) {
    return (
        <div className={s('expense-start')}>
            <div>
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
            {actions}
        </div>
    );
}
