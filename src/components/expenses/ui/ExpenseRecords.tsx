import type { ComponentPropsWithRef, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { expenseRecordClass as part } from './expenseRecordStyles';

export function ExpenseRecordRow({ title, detail, children, className, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'title'> & { title?: ReactNode; detail?: ReactNode }) {
    return <div {...props} className={cn(part('expense-row'), className)}>{title != null && <div><strong>{title}</strong>{detail != null && <small>{detail}</small>}</div>}{children}</div>;
}

export function ExpenseMonthPicker({ previous, next, control, label }: { previous: ReactNode; next: ReactNode; control: ReactNode; label: ReactNode }) {
    return <div className={part('expense-month')}>{previous}<label><span className="expense-sr">{label}</span>{control}</label>{next}</div>;
}

export function ExpenseSearch({ icon, label, ...props }: InputHTMLAttributes<HTMLInputElement> & { icon: ReactNode; label: ReactNode }) {
    return <label className={part('expense-search')}>{icon}<span className="expense-sr">{label}</span><input {...props} /></label>;
}

export function ExpenseCalendarDay({ spent, label, value }: { spent: boolean; label: ReactNode; value: ReactNode }) {
    return <div className={cn(part('expense-calendar-day'), spent && part('expense-calendar-day--spent'))}><span>{label}</span><strong>{value}</strong></div>;
}

export function ExpenseBudgetNumber({ value, children }: { value: ReactNode; children: ReactNode }) {
    return <div className={part('expense-budget-number')}><strong>{value}</strong><span>{children}</span></div>;
}

export function ExpenseExportMenu({ summary, children, className, ...props }: Omit<ComponentPropsWithRef<'details'>, 'children'> & { summary: ReactNode; children: ReactNode }) {
    return <details {...props} className={cn(part('expense-export-menu'), className)}><summary>{summary}</summary><div>{children}</div></details>;
}

export function ExpenseImportHelp({ summary, children }: { summary: ReactNode; children: ReactNode }) {
    return <details className={part('expense-import-help')}><summary>{summary}</summary><div className={part('expense-import-help__content')}>{children}</div></details>;
}
