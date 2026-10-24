import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { assetDetailClass as part } from './assetDetailStyles';

export function DashboardAssetHeader({ symbol, name, price, tone, children }: { symbol: ReactNode; name: ReactNode; price: ReactNode; tone: string; children: ReactNode }) {
    return <div className={part('asset-detail__header')}><div className={part('asset-detail__title-group')}><h2 className={part('asset-detail__symbol')}>{symbol}</h2><p className={part('asset-detail__name')}>{name}</p></div><div className={part('asset-detail__price-group')}><div className={part('asset-detail__price')}>{price}</div><div className={cn(part('asset-detail__change'), tone)}>{children}</div></div></div>;
}

export function DashboardPeriodPerformance({ label, value, valueClassName, children }: { label: ReactNode; value: ReactNode; valueClassName?: string; children: ReactNode }) {
    return <div className={part('asset-detail__period-performance')} aria-live="polite"><span>{label}</span><strong className={valueClassName}>{value}</strong>{children}</div>;
}

export function DashboardChartLegend({ label, hint }: { label: ReactNode; hint: ReactNode }) {
    return <div className={part('asset-detail__chart-legend')}><span><i className={part('asset-detail__legend-line')} />{label}</span><span className={part('asset-detail__chart-axis-hint')}>{hint}</span></div>;
}

export function DashboardCompanySection({ title, children, className, ...props }: Omit<HTMLAttributes<HTMLElement>, 'title'> & { title: ReactNode }) {
    return <section {...props} className={cn(part('asset-detail__company'), className)}><h3 className="section-title">{title}</h3>{children}</section>;
}

export function DashboardDetailFootnote({ icon, children }: { icon: ReactNode; children: ReactNode }) {
    return <div className={part('asset-detail__footer')}>{icon}<p>{children}</p></div>;
}
