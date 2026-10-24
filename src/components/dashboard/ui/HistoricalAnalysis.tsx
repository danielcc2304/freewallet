import type { HTMLAttributes, ReactNode } from 'react';
import { historyStyle as s } from './historicalAnalysisStyles';
export function HistoricalPanelHeading({
    title,
    description,
    children,
}: {
    title: ReactNode;
    description: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className={s('portfolio-excel-insights__panel-heading')}>
            <div>
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
            {children}
        </div>
    );
}
export function HistoricalPanelActions({ children }: { children: ReactNode }) {
    return <div className={s('portfolio-excel-insights__panel-actions')}>{children}</div>;
}
export function HistoricalPeriodSummary({
    label,
    value,
    detail,
    valueClassName,
}: {
    label: ReactNode;
    value: ReactNode;
    detail: ReactNode;
    valueClassName: string;
}) {
    return (
        <div className={s('portfolio-excel-insights__period-summary')}>
            <span>{label}</span>
            <strong className={valueClassName}>{value}</strong>
            <small>{detail}</small>
        </div>
    );
}
export function HistoricalBenchmarkValue({ label, value }: { label: ReactNode; value: ReactNode }) {
    return (
        <div className={s('portfolio-excel-insights__benchmark-portfolio')}>
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}
export function HistoricalValueRow({
    appearance,
    label,
    detail,
    value,
    ...props
}: HTMLAttributes<HTMLDivElement> & {
    appearance: 'leader' | 'movement';
    label: ReactNode;
    detail: ReactNode;
    value: ReactNode;
}) {
    const leader = appearance === 'leader';
    return (
        <div
            {...props}
            className={s(leader ? 'portfolio-excel-insights__leader-row' : 'portfolio-excel-insights__movement-row')}
        >
            <span>
                {leader ? <strong>{label}</strong> : label}
                <small>{detail}</small>
            </span>
            {leader ? <b>{value}</b> : <strong>{value}</strong>}
        </div>
    );
}
export function HistoricalControlRow({
    icon,
    label,
    value,
    ok,
}: {
    icon: ReactNode;
    label: ReactNode;
    value: ReactNode;
    ok: boolean;
}) {
    return (
        <div className={s('portfolio-excel-insights__control-row')}>
            {icon}
            <span>{label}</span>
            <strong className={ok ? 'is-ok' : 'is-warn'}>{value}</strong>
        </div>
    );
}
export function HistoricalAllocationBlock({
    label,
    detail,
    value,
    weight,
    progressLabel,
}: {
    label: ReactNode;
    detail: ReactNode;
    value: ReactNode;
    weight: number;
    progressLabel: string;
}) {
    return (
        <div className={s('portfolio-excel-insights__block')}>
            <HistoricalValueRow appearance="leader" label={label} detail={detail} value={value} />
            <progress max={100} value={weight} aria-label={progressLabel} />
        </div>
    );
}
export function HistoricalStatus({
    appearance,
    icon,
    children,
    ...props
}: HTMLAttributes<HTMLDivElement> & { appearance: 'live' | 'loading'; icon: ReactNode }) {
    return (
        <div
            {...props}
            className={s(
                appearance === 'live' ? 'portfolio-excel-insights__live-status' : 'portfolio-excel-insights__loading',
            )}
        >
            {icon}
            {children}
        </div>
    );
}
export function HistoricalWorkbookNotice({
    icon,
    title,
    description,
    onLink,
    actionLabel,
    ...props
}: Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
    icon: ReactNode;
    title: ReactNode;
    description: ReactNode;
    onLink: () => void;
    actionLabel: ReactNode;
}) {
    return (
        <div {...props} className={s('portfolio-excel-insights__workbook-notice')}>
            {icon}
            <div>
                <strong>{title}</strong>
                <p>{description}</p>
            </div>
            <button type="button" onClick={onLink}>
                {actionLabel}
            </button>
        </div>
    );
}
