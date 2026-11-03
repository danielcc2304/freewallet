import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { projectionStyle as s } from './CalculatorProjection.styles';
/** Display-only projection components: all assumptions, dates and calculations stay with the calculator. */
export function CalculatorProjectionHeader({ className, ...props }: ComponentProps<typeof AcademyPageHeader>) {
    return <AcademyPageHeader {...props} className={cn(s('fire__header'), className)} />;
}
export function CalculatorHorizonBadge({
    value,
    label,
    comparison,
}: {
    value: ReactNode;
    label: ReactNode;
    comparison?: ReactNode;
}) {
    return (
        <div className={s('fire__years-badge')}>
            <span className={s('fire__years-value')}>{value}</span>
            <span className={s('fire__years-label')}>{label}</span>
            {comparison && <div className={s('fire__years-compare')}>{comparison}</div>}
        </div>
    );
}
export function CalculatorProjectionSection({
    inputs,
    title,
    children,
    ...props
}: Omit<HTMLAttributes<HTMLElement>, 'title'> & { inputs?: boolean; title: ReactNode }) {
    return (
        <section {...props} className={cn(inputs && s('fire__inputs'), props.className)}>
            <h2 className={s('fire__section-title')}>{title}</h2>
            {children}
        </section>
    );
}
export function CalculatorProjectionResults({ className, ...props }: HTMLAttributes<HTMLElement>) {
    return <main {...props} className={cn(s('fire__results'), className)} />;
}
export function CalculatorOptionalInputs({
    control,
    enabled,
    children,
}: {
    control: ReactNode;
    enabled: boolean;
    children: ReactNode;
}) {
    return (
        <div className={s('fire__optional-card')}>
            {control}
            {enabled && <div className={s('fire__optional-content')}>{children}</div>}
        </div>
    );
}
export function CalculatorProjectionOptions({
    label,
    hint,
    children,
}: {
    label: ReactNode;
    hint: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className={cn('calc__input-group', s('fire__optional-group'))}>
            <label>{label}</label>
            {children}
            <small className={s('fire__input-hint')}>{hint}</small>
        </div>
    );
}
export function CalculatorProjectionHint({ className, ...props }: HTMLAttributes<HTMLElement>) {
    return <small {...props} className={cn(s('fire__input-hint'), className)} />;
}
