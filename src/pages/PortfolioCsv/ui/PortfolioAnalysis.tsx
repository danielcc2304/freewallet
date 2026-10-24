import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { portfolioAnalysisStyle as s } from './portfolioAnalysisStyles';
export function PortfolioImportHeader({
    badge,
    title,
    description,
}: {
    badge: ReactNode;
    title: ReactNode;
    description: ReactNode;
}) {
    return (
        <header className={s('portfolio-csv-hero')}>
            <div className={s('portfolio-csv-hero__badge')}>{badge}</div>
            <h1>{title}</h1>
            <p>{description}</p>
        </header>
    );
}
export function PortfolioUploadCard({
    title,
    description,
    actions,
    input,
    notes,
}: {
    title: ReactNode;
    description: ReactNode;
    actions: ReactNode;
    input: ReactNode;
    notes: readonly ReactNode[];
}) {
    return (
        <article className={cn(s('portfolio-csv-upload__card'), s('portfolio-csv-upload__card--utility'))}>
            <h3>{title}</h3>
            <p>{description}</p>
            <div className={s('portfolio-csv-upload__actions')}>{actions}</div>
            {input}
            {notes.map((note, i) => (
                <small key={i}>{note}</small>
            ))}
        </article>
    );
}
export function PortfolioCompositionLegend({ children }: { children: ReactNode }) {
    return <div className={s('portfolio-csv-pie-legend')}>{children}</div>;
}
export function PortfolioCompositionLegendItem({
    name,
    color,
    value,
}: {
    name: string;
    color: string;
    value: ReactNode;
}) {
    return (
        <div className={s('portfolio-csv-pie-legend__item')}>
            <span className={s('portfolio-csv-pie-legend__dot')} style={{ backgroundColor: color }} />
            <span className={s('portfolio-csv-pie-legend__name')} title={name}>
                {name}
            </span>
            <span className={s('portfolio-csv-pie-legend__weight')}>{value}</span>
        </div>
    );
}
export function PortfolioInsightList({ children }: { children: ReactNode }) {
    return <ul className={s('portfolio-csv-insights')}>{children}</ul>;
}
export function PortfolioInsightItem({
    label,
    value,
    ...props
}: HTMLAttributes<HTMLLIElement> & { label: ReactNode; value: ReactNode }) {
    return (
        <li {...props}>
            <span>{label}</span>
            <strong>{value}</strong>
        </li>
    );
}
export function PortfolioAnalysisNote({ children }: { children: ReactNode }) {
    return (
        <div className={s('portfolio-csv-note')}>
            <p>{children}</p>
        </div>
    );
}
export function PortfolioEmptyState({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn(s('portfolio-csv-empty-state'), className)} />;
}
export function PortfolioAnalysisCheck({
    tone,
    title,
    value,
    description,
}: {
    tone: 'good' | 'warn';
    title: ReactNode;
    value: ReactNode;
    description: ReactNode;
}) {
    return (
        <div className={cn(s('portfolio-csv-check'), s(`portfolio-csv-check--${tone}`))}>
            <div className={s('portfolio-csv-check__top')}>
                <span className={s('portfolio-csv-check__title')}>{title}</span>
                <strong className={s('portfolio-csv-check__value')}>{value}</strong>
            </div>
            <p>{description}</p>
        </div>
    );
}
export function PortfolioTableHeading({
    appearance,
    labels,
}: {
    appearance: 'controls' | 'plan';
    labels: readonly ReactNode[];
}) {
    return (
        <div
            className={s(
                appearance === 'plan' ? 'portfolio-csv-plan-table__head' : 'portfolio-csv-controls-table__head',
            )}
        >
            {labels.map((label, i) => (
                <span key={i}>{label}</span>
            ))}
        </div>
    );
}
export function PortfolioPlanRow({
    label,
    values,
}: {
    label: ReactNode;
    values: readonly { label: string; value: ReactNode; tone?: 'over' | 'under' }[];
}) {
    return (
        <div className={s('portfolio-csv-plan-table__row')}>
            <strong className={s('portfolio-csv-plan-table__bucket')}>{label}</strong>
            {values.map((v, i) => (
                <span
                    key={i}
                    data-label={v.label}
                    className={v.tone ? s(`portfolio-csv-plan-table__delta--${v.tone}`) : undefined}
                >
                    {v.value}
                </span>
            ))}
        </div>
    );
}
export function PortfolioChartTooltip({ label, children }: { label: ReactNode; children: ReactNode }) {
    return (
        <div className={s('portfolio-csv-tooltip')}>
            <div className={s('portfolio-csv-tooltip__label')}>{label}</div>
            <div className={s('portfolio-csv-tooltip__rows')}>{children}</div>
        </div>
    );
}
export function PortfolioTooltipItem({ color, name, value }: { color: string; name: ReactNode; value: ReactNode }) {
    return (
        <div className={s('portfolio-csv-tooltip__row')}>
            <span className={s('portfolio-csv-tooltip__dot')} style={{ backgroundColor: color }} />
            <span className={s('portfolio-csv-tooltip__name')}>{name}</span>
            <strong className={s('portfolio-csv-tooltip__value')}>{value}</strong>
        </div>
    );
}
export function PortfolioAnalysisHeading({
    title,
    description,
    source,
}: {
    title: ReactNode;
    description: ReactNode;
    source: ReactNode;
}) {
    return (
        <div className={s('portfolio-csv-advanced__header')}>
            <div>
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
            <span className={s('portfolio-csv-advanced__source')}>{source}</span>
        </div>
    );
}
