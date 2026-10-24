import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { fundIdentityStyle as s } from './CalculatorFundIdentity.styles';
export function CalculatorFundIdentity({
    badges,
    name,
    classLabel,
    isin,
    source,
}: {
    badges: ReactNode;
    name: ReactNode;
    classLabel: ReactNode;
    isin: ReactNode;
    source: ReactNode;
}) {
    return (
        <section className={s('fund-info__fund-hero')}>
            <div className={s('fund-info__fund-hero-copy')}>
                <div className={s('fund-info__badge-row')}>{badges}</div>
                <h2>{name}</h2>
                <p className={s('fund-info__class-name')}>{classLabel}</p>
                <code>{isin}</code>
            </div>
            {source}
        </section>
    );
}
export function CalculatorFundSource({ className, ...props }: ComponentProps<'a'>) {
    return <a {...props} className={cn(s('fund-info__source-link'), className)} />;
}
export function CalculatorFundTag({
    accent,
    feature,
    className,
    ...props
}: HTMLAttributes<HTMLSpanElement> & { accent?: boolean; feature?: boolean }) {
    return (
        <span
            {...props}
            className={cn(
                feature ? s('fund-info__feature') : s('fund-info__badge'),
                accent && s('fund-info__badge--accent'),
                className,
            )}
        />
    );
}
export function CalculatorFundFeatures({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('fund-info__feature-list'), className)} />;
}
/** Accessible help retains native button focus, description and tooltip relationships. */
export function CalculatorFundHelp({
    id,
    label,
    title,
    icon,
    heading,
    description,
    detail,
}: {
    id: string;
    label: ReactNode;
    title: string;
    icon: ReactNode;
    heading: ReactNode;
    description: ReactNode;
    detail: ReactNode;
}) {
    return (
        <span className={s('fund-info__risk-help')}>
            <button type="button" className={s('fund-info__risk-trigger')} aria-describedby={id} title={title}>
                {label}
                {icon}
            </button>
            <span id={id} className={s('fund-info__risk-tooltip')} role="tooltip">
                <strong>{heading}</strong>
                <span>{description}</span>
                <small>{detail}</small>
            </span>
        </span>
    );
}
