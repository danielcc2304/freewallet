import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { payrollStyle as s } from './CalculatorPayroll.styles';
/** Semantic payroll breakdown; formatting and financial values remain with the caller. */
export function CalculatorBreakdown({ className, ...props }: HTMLAttributes<HTMLDListElement>) {
    return <dl {...props} className={cn(s('salary-calc__breakdown'), className)} />;
}
export function CalculatorBreakdownRow({
    label,
    value,
    total = false,
    ...props
}: HTMLAttributes<HTMLDivElement> & { label: ReactNode; value: ReactNode; total?: boolean }) {
    return (
        <div {...props} className={cn(total && s('salary-calc__total'), props.className)}>
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    );
}
export function CalculatorPerson({
    legend,
    children,
    className,
    ...props
}: HTMLAttributes<HTMLFieldSetElement> & { legend: ReactNode }) {
    return (
        <fieldset {...props} className={cn(s('salary-calc__person'), className)}>
            <legend>{legend}</legend>
            {children}
        </fieldset>
    );
}
export function CalculatorPayrollSummary({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div {...props} className={cn(s('salary-calc__hero-footer'), props.className)}>
            {children}
        </div>
    );
}
export function CalculatorTaxValue({
    label,
    value,
    detail,
    valueProps,
}: {
    label: ReactNode;
    value: ReactNode;
    detail: ReactNode;
    valueProps?: HTMLAttributes<HTMLElement> & { 'data-testid'?: string };
}) {
    return (
        <div className={s('salary-calc__tax-value')}>
            <span>{label}</span>
            <strong {...valueProps}>{value}</strong>
            <small>{detail}</small>
        </div>
    );
}
export function CalculatorSettlement({ label, value }: { label: ReactNode; value: ReactNode }) {
    return (
        <div className={s('salary-calc__settlement')}>
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}
