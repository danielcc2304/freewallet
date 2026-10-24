import type { HTMLAttributes, LabelHTMLAttributes, FieldsetHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { allocationWorkspaceStyle as a } from './AcademyAllocationWorkspace.styles';
import { strategyWorkspaceStyle as s } from './AcademyStrategyWorkspace.styles';
type Appearance = 'allocation' | 'strategy';
/** Shared simulator section header, preserving the original heading and native actions. */
export function AcademySimulationSectionHeader({
    appearance,
    title,
    description,
    meta,
    actions,
    headingProps,
    ...props
}: Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
    appearance: Appearance;
    title: ReactNode;
    description?: ReactNode;
    meta?: ReactNode;
    actions?: ReactNode;
    headingProps?: HTMLAttributes<HTMLHeadingElement>;
}) {
    return (
        <div
            {...props}
            className={cn(
                appearance === 'allocation' ? a('alloc-sim__inputs-header') : s('strategy-section-heading'),
                props.className,
            )}
        >
            <div>
                <h2 {...headingProps}>{title}</h2>
                {description != null && <p>{description}</p>}
                {meta != null && (
                    <span className={appearance === 'allocation' ? a('alloc-sim__total') : undefined}>{meta}</span>
                )}
            </div>
            {actions}
        </div>
    );
}
/** Native implicit/explicit labels keep focus, validation and input state with the consumer. */
export function AcademySimulationField({
    appearance,
    label,
    children,
    className,
    ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { appearance: Appearance | 'correlation'; label: ReactNode }) {
    return (
        <label
            {...props}
            className={cn(
                appearance === 'strategy'
                    ? s('strategy-capital')
                    : a(appearance === 'correlation' ? 'alloc-sim__correlation' : 'alloc-sim__capital'),
                className,
            )}
        >
            {label}
            {children}
        </label>
    );
}
export function AcademySimulationTable({
    appearance,
    children,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & { appearance: Appearance }) {
    return (
        <div
            {...props}
            className={cn(
                appearance === 'allocation' ? a('alloc-sim__table-scroll') : s('strategy-table-scroll'),
                className,
            )}
        >
            <table>{children}</table>
        </div>
    );
}
export function AcademySimulationFilterGroup({
    legend,
    children,
    className,
    ...props
}: FieldsetHTMLAttributes<HTMLFieldSetElement> & { legend: ReactNode }) {
    return (
        <fieldset {...props} className={cn(s('strategy-filter-group'), className)}>
            <legend>{legend}</legend>
            <div className={s('portfolio-builder__filter-options')}>{children}</div>
        </fieldset>
    );
}
export function AcademySimulationEmpty({
    title,
    children,
    ...props
}: Omit<HTMLAttributes<HTMLDivElement>, 'title'> & { title: ReactNode }) {
    return (
        <div {...props} className={cn(s('portfolio-builder__empty'), props.className)}>
            <h3>{title}</h3>
            <p>{children}</p>
        </div>
    );
}
export function AcademySimulationNote({
    appearance = 'allocation',
    kind = 'help',
    className,
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { appearance?: Appearance; kind?: 'help' | 'error' | 'filter' | 'model' }) {
    const style =
        appearance === 'allocation'
            ? a(kind === 'error' ? 'alloc-sim__validation' : 'alloc-sim__help')
            : s(
                  kind === 'error'
                      ? 'strategy-error'
                      : kind === 'filter'
                        ? 'strategy-filter-note'
                        : kind === 'model'
                          ? 'strategy-model-note'
                          : 'strategy-help',
              );
    return <p {...props} className={cn(style, className)} />;
}
export function AcademySimulationDisclaimer({
    summary,
    children,
    className,
    ...props
}: HTMLAttributes<HTMLElement> & { summary?: ReactNode }) {
    const classNames = cn(a('alloc-sim__disclaimer'), className);
    return summary != null ? (
        <details {...props} className={classNames}>
            <summary>{summary}</summary>
            {children}
        </details>
    ) : (
        <div {...props} className={classNames}>
            {children}
        </div>
    );
}
export function AcademySimulationLegend({
    items,
}: {
    items: readonly { key: string; color: string; label: ReactNode }[];
}) {
    return (
        <ul className={a('alloc-sim__legend')}>
            {items.map((item) => (
                <li key={item.key}>
                    <span style={{ background: item.color }} />
                    {item.label}
                </li>
            ))}
        </ul>
    );
}
export function AcademySimulationGrid({
    appearance,
    children,
    ...props
}: HTMLAttributes<HTMLElement> & { appearance: 'inputs' | 'visuals' }) {
    const className = cn(a(appearance === 'inputs' ? 'alloc-sim__inputs-grid' : 'alloc-sim__visuals'), props.className);
    return appearance === 'visuals' ? (
        <section {...props} className={className}>
            {children}
        </section>
    ) : (
        <div {...props} className={className}>
            {children}
        </div>
    );
}
export function AcademySimulationTotal({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div {...props} className={cn(s('strategy-plan__total'), props.className)}>
            {children}
        </div>
    );
}
