import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { assetChartStyle as s } from './assetChartStyles';
/** Native chart boundaries forward pointer handlers and DOM refs to the same div. */
export function DashboardAssetChart({
    title,
    selector,
    children,
}: {
    title: ReactNode;
    selector: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className={s('asset-detail__chart-section')}>
            <div className={s('asset-detail__chart-header')}>
                <div className={s('asset-detail__chart-title')}>{title}</div>
                {selector}
            </div>
            {children}
        </div>
    );
}
export function DashboardAssetChartViewport({ className, ...props }: ComponentPropsWithRef<'div'>) {
    return <div {...props} className={cn(s('asset-detail__chart-container'), className)} />;
}
export function DashboardAssetChartLoading({ spinner, label }: { spinner: ReactNode; label: ReactNode }) {
    return (
        <div className={s('chart-overlay')}>
            {spinner}
            <span>{label}</span>
        </div>
    );
}
export function DashboardAssetChartEmpty({
    title,
    description,
    action,
}: {
    title: ReactNode;
    description: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className={cn(s('chart-overlay'), 'error-state')}>
            <p>{title}</p>
            <small>{description}</small>
            {action}
        </div>
    );
}
export function DashboardAssetChartSelection({
    tone,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & { tone: string }) {
    return <div {...props} className={cn(s('asset-detail__chart-selection'), tone, className)} />;
}
export function DashboardAssetChartSource({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return <p {...props} className={cn(s('asset-detail__chart-source'), className)} />;
}
export function DashboardFundSections({ children }: { children: ReactNode }) {
    return <div className={s('asset-detail__fund-sections')}>{children}</div>;
}
export function DashboardFundText({ title, children }: { title: ReactNode; children: ReactNode }) {
    return (
        <section>
            <h3>{title}</h3>
            <p>{children}</p>
        </section>
    );
}
export function DashboardFundHoldings({ title, children }: { title: ReactNode; children: ReactNode }) {
    return (
        <section>
            <h3>{title}</h3>
            <div className={s('asset-detail__holding-list')}>{children}</div>
        </section>
    );
}
export function DashboardFundHoldingRow({ label, value }: { label: ReactNode; value: ReactNode }) {
    return (
        <div>
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}
