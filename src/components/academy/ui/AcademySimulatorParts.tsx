import { allocationNote } from './AcademyAllocationNote.styles';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { crisisStyle as c } from './AcademyCrisisParts.styles';
import { allocationStyle as a } from './AcademyAllocationParts.styles';
import { modelStyle as m } from './AcademyModelParts.styles';
export function AcademyCrisisTab({
    year,
    label,
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { year: ReactNode; label: ReactNode }) {
    return (
        <button {...props} className={cn(c('crisis__tab'), className)}>
            <span className={c('crisis__tab-year')}>{year}</span>
            <span className={c('crisis__tab-name')}>{label}</span>
        </button>
    );
}
export function AcademyCrisisDecision({
    title,
    label,
    value,
    valueProps,
    children,
    className,
    ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title' | 'value'> & {
    title: ReactNode;
    label: ReactNode;
    value: ReactNode;
    valueProps?: HTMLAttributes<HTMLElement>;
}) {
    return (
        <button {...props} className={cn(c('crisis__scenario'), className)}>
            <span className={c('crisis__scenario-title')}>{title}</span>
            <span className={c('crisis__scenario-label')}>{label}</span>
            <strong {...valueProps}>{value}</strong>
            <span>{children}</span>
        </button>
    );
}
export function AcademySimulationInsight({
    variant,
    icon,
    children,
    ...props
}: HTMLAttributes<HTMLElement> & { variant: 'crisis' | 'allocation'; icon: ReactNode }) {
    return variant === 'crisis' ? (
        <aside {...props} className={c('crisis__insight')}>
            {icon}
            <p>{children}</p>
        </aside>
    ) : (
        <div {...props} className={allocationNote('alloc-sim__source')}>
            {icon}
            <p>{children}</p>
        </div>
    );
}
export function AcademySimulationHeading({
    icon,
    title,
    description,
    headingId,
}: {
    icon: ReactNode;
    title: ReactNode;
    description: ReactNode;
    headingId?: string;
}) {
    return (
        <div className={c('crisis__section-heading')}>
            <span className={c('crisis__icon')}>{icon}</span>
            <div>
                <h2 id={headingId}>{title}</h2>
                <p>{description}</p>
            </div>
        </div>
    );
}
export function AcademyImpactRow({
    label,
    value,
    valueProps,
    width,
    low,
}: {
    label: ReactNode;
    value: ReactNode;
    valueProps?: HTMLAttributes<HTMLElement>;
    width: string;
    low?: boolean;
}) {
    return (
        <div className={cn(c('crisis__impact-row'), low && 'crisis__impact-row--low')}>
            <span>{label}</span>
            <strong {...valueProps}>{value}</strong>
            <div className={c('crisis__bar')}>
                <span style={{ width }} />
            </div>
        </div>
    );
}
export function AcademyDecisionExplanation({ title, children }: { title: ReactNode; children: ReactNode }) {
    return (
        <div className={c('crisis__explanation')}>
            <strong>{title}</strong>
            <p>{children}</p>
        </div>
    );
}
export function AcademyAllocationAction({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} className={cn(a('alloc-sim__reset'), className)} />;
}
export function AcademyModelFilter({
    selected,
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
    return (
        <button
            {...props}
            className={cn(
                m('portfolio-builder__filter-chip'),
                selected && m('portfolio-builder__filter-chip--active'),
                className,
            )}
        />
    );
}
export function AcademyModelMetadata({ category, risk }: { category: ReactNode; risk: ReactNode }) {
    return (
        <div className={m('strategy-model__meta')}>
            <span>{category}</span>
            <span>{risk}</span>
        </div>
    );
}
export function AcademyModelMix({ children }: { children: ReactNode }) {
    return <p className={m('strategy-model__mix')}>{children}</p>;
}
export function AcademyModelActions({ children }: { children: ReactNode }) {
    return <div className={m('strategy-model__actions')}>{children}</div>;
}
export function AcademyAllocationBar({
    label,
    segments,
}: {
    label: string;
    segments: readonly { key: string; width: number; color: string }[];
}) {
    return (
        <div className={m('strategy-bar')} role="img" aria-label={label}>
            {segments.map((s) => (
                <span key={s.key} style={{ width: `${s.width}%`, background: s.color }} />
            ))}
        </div>
    );
}

export function AcademyAllocationExplanation({ paragraphs }: { paragraphs: readonly ReactNode[] }) {
    return (
        <div className={allocationNote('info-content')}>
            {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
            ))}
        </div>
    );
}
