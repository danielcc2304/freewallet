import type { HTMLAttributes, ReactNode, ComponentProps } from 'react';
import type { ExpenseKind } from '../../../types/expenses';
import { cn } from '../../../utils/cn';
import { ExpensePanel } from './ExpensePanel';
import { expensePresentationStyle as s, expensePresentationStyleClasses as classes } from './expensePresentationStyles';
export function ExpenseHint({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return <p {...props} className={s('expense-hint', className)} />;
}
export function ExpenseInsight({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return <p {...props} className={s('expense-insight', className)} />;
}
export function ExpenseFilters({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={s('expense-filters', className)} />;
}
export function ExpenseCalendar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={s('expense-calendar', className)} />;
}
/** The record owns its icon/name layout; descriptions and financial values stay with the caller. */
export function ExpenseEntryIdentity({
    kind,
    icon,
    children,
}: {
    kind: ExpenseKind;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className={s('expense-entry-name')}>
            <span className={classes(cn('expense-kind', 'expense-kind--' + kind))}>{icon}</span>
            <div>{children}</div>
        </div>
    );
}
export function ExpenseDisclosure({
    title,
    children,
    ...props
}: Omit<ComponentProps<typeof ExpensePanel>, 'title' | 'as'> & { title: ReactNode }) {
    return (
        <ExpensePanel {...props} as="details" className={classes(cn('expense-panel', 'expense-fold', props.className))}>
            <summary>{title}</summary>
            {children}
        </ExpensePanel>
    );
}
