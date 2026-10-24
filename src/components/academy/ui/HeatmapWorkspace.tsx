import type { ComponentProps, ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { DataItem } from '../../ui/DataItem';
import { Button } from '../../ui/Button';
import { heatmapWorkspaceStyle as s } from './HeatmapWorkspace.styles';
export function HeatmapWorkspace({ className, ...props }: HTMLAttributes<HTMLElement>) {
    return <section {...props} className={cn(s('market-heatmap__workspace'), className)} />;
}
export function HeatmapToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('market-heatmap__toolbar'), className)} />;
}
export function HeatmapToolbarField({
    label,
    labelId,
    children,
}: {
    label: ReactNode;
    labelId?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <span className={s('market-heatmap__toolbar-label')} id={labelId}>
                {label}
            </span>
            {children}
        </div>
    );
}
export function HeatmapMetrics({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('market-heatmap__metrics'), className)} />;
}
export function HeatmapMetric({ className, ...props }: Omit<ComponentProps<typeof DataItem>, 'layout'>) {
    return <DataItem {...props} layout="heatmap" className={cn(s('market-heatmap__metric'), className)} />;
}
/** The React 19 DOM ref and every event stay on the original chart container. */
export function HeatmapCanvas({ className, ...props }: ComponentPropsWithRef<'div'>) {
    return <div {...props} className={cn(s('market-heatmap__canvas'), className)} />;
}
export function HeatmapState({
    appearance,
    icon,
    title,
    message,
    action,
}: {
    appearance: 'loading' | 'error';
    icon: ReactNode;
    title?: ReactNode;
    message: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className={s(appearance === 'loading' ? 'market-heatmap__loading' : 'market-heatmap__error')}>
            {icon}
            {title != null && <strong>{title}</strong>}
            <span>{message}</span>
            {action}
        </div>
    );
}
export function HeatmapCompletion({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return <p {...props} className={cn(s('market-heatmap__completion-status'), className)} />;
}
export function HeatmapDetails({
    selection,
    emptyHint,
    children,
    ...props
}: HTMLAttributes<HTMLDivElement> & { selection: ReactNode; emptyHint: ReactNode }) {
    return (
        <div {...props} className={cn(s('market-heatmap__details'), props.className)}>
            {selection || <p className={s('market-heatmap__selection-hint')}>{emptyHint}</p>}
            <div className={s('market-heatmap__extremes')}>{children}</div>
        </div>
    );
}
export function HeatmapExtreme({ icon, label, value }: { icon: ReactNode; label: ReactNode; value: ReactNode }) {
    return (
        <span>
            {icon}
            {label}
            <strong>{value}</strong>
        </span>
    );
}
export function HeatmapSectorSummary({
    label,
    description,
    count,
    children,
    ...props
}: HTMLAttributes<HTMLElement> & { label: ReactNode; description: ReactNode; count: ReactNode }) {
    return (
        <section {...props} className={cn(s('market-heatmap__sector-summary'), props.className)}>
            <div className={s('market-heatmap__sector-summary-header')}>
                <div>
                    <span className={s('market-heatmap__toolbar-label')}>{label}</span>
                    <p>{description}</p>
                </div>
                <span>{count}</span>
            </div>
            <div className={s('market-heatmap__sector-list')}>{children}</div>
        </section>
    );
}
export function HeatmapFooter({
    description,
    children,
    ...props
}: HTMLAttributes<HTMLElement> & { description: ReactNode }) {
    return (
        <footer {...props} className={cn(s('market-heatmap__footer'), props.className)}>
            <p>{description}</p>
            <div>{children}</div>
        </footer>
    );
}
export function HeatmapFloatingActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('market-heatmap__floating-actions'), className)} />;
}
export function HeatmapRefreshButton({ className, ...props }: ComponentProps<typeof Button>) {
    return <Button {...props} className={cn(s('market-heatmap__floating-refresh'), className)} />;
}
