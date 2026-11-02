import type { HTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';
import { portfolioReportStyle as s } from './PortfolioReportFrame.styles';
export function PortfolioReportFrame({
    appearance,
    as: Tag = 'div',
    workbook,
    className,
    ...props
}: HTMLAttributes<HTMLElement> & { appearance: Parameters<typeof s>[0]; as?: 'div' | 'section'; workbook?: boolean }) {
    return <Tag {...props} className={cn(s(appearance), workbook && s('portfolio-csv-grid--workbook'), className)} />;
}
export function PortfolioReportValue({
    status,
    className,
    ...props
}: HTMLAttributes<HTMLElement> & { status: 'ok' | 'warn' | 'neutral' | 'positive' | 'negative' }) {
    return (
        <strong
            {...props}
            className={cn(
                status === 'neutral'
                    ? 'portfolio-csv-workbook-control--neutral'
                    : s(
                          status === 'ok'
                              ? 'portfolio-csv-workbook-control--ok'
                              : status === 'warn'
                                ? 'portfolio-csv-workbook-control--warn'
                                : status === 'positive'
                                  ? 'portfolio-csv-value--positive'
                                  : 'portfolio-csv-value--negative',
                      ),
                className,
            )}
        />
    );
}
