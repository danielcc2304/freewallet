import type { HTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { portfolioImportStyle as s } from './portfolioImportStyles';
export function PortfolioChartFrame({
    appearance = 'default',
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & { appearance?: 'default' | 'composition' | 'benchmark' | 'risk-map' }) {
    return (
        <div
            {...props}
            className={cn(
                s('portfolio-csv-chart'),
                appearance !== 'default' && s(`portfolio-csv-chart--${appearance}`),
                className,
            )}
        />
    );
}
export function PortfolioTransitionNotice({
    icon,
    title,
    children,
}: {
    icon: ReactNode;
    title: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className={s('portfolio-csv-notice')}>
            <div className={s('portfolio-csv-notice__icon')}>{icon}</div>
            <h2>{title}</h2>
            {children}
        </div>
    );
}
export function PortfolioTransitionNote({ children }: { children: ReactNode }) {
    return <p className={s('portfolio-csv-notice__note')}>{children}</p>;
}
export function PortfolioDashboardLink({ className, ...props }: LinkProps) {
    return <Link {...props} className={cn(s('portfolio-csv-notice__dashboard'), className)} />;
}
