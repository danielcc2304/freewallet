import{expensePresentationStyleClasses}from'./expensePresentationStyles';
import type { HTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';
import { expenseFeedbackStyle as s } from './expenseFeedbackStyles';
export function ExpenseSaveStatus({ busy, children }: { busy: boolean; children: ReactNode }) {
    return (
        <span className={expensePresentationStyleClasses(s('expense-status'))}>
            <span className={expensePresentationStyleClasses(cn(s('expense-status-dot'), busy && s('expense-status-dot--busy')))} />
            {children}
        </span>
    );
}
export function ExpenseImportCategorySelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return <select {...props} className={expensePresentationStyleClasses(cn(s('expense-import__category-select'), className))} />;
}
export function ExpenseImportPagination({
    label,
    previous,
    next,
    ...props
}: HTMLAttributes<HTMLDivElement> & { label: ReactNode; previous: ReactNode; next: ReactNode }) {
    return (
        <div {...props} className={expensePresentationStyleClasses(s('expense-import__pagination'))}>
            <span>{label}</span>
            {previous}
            {next}
        </div>
    );
}
export function ExpenseImportSummary({ value, detail }: { value: ReactNode; detail: ReactNode }) {
    return (
        <div className={expensePresentationStyleClasses(s('expense-import-summary'))}>
            <strong>{value}</strong>
            <span>{detail}</span>
        </div>
    );
}
export function ExpenseFeedback({
    as: Tag = 'div',
    appearance,
    className,
    ...props
}: HTMLAttributes<HTMLElement> & { as?: 'p' | 'div'; appearance: 'error' | 'sync' | 'notice' | 'loading' }) {
    return (
        <Tag
            {...props}
            className={expensePresentationStyleClasses(cn(
                s(
                    appearance === 'sync'
                        ? 'expense-sync-error'
                        : appearance === 'error'
                          ? 'expense-error'
                          : appearance === 'notice'
                            ? 'expense-notice'
                            : 'expense-loading',
                ),
                className,
            ))}
        />
    );
}
