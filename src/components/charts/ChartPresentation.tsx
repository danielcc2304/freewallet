import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import type { HTMLAttributes } from 'react';
import { chartsPresentationStyle as s, type ChartsPresentationPart } from './ChartPresentation.styles';

/** Native layout frames share structure and recipes while the caller owns state and formatting. */
export function ChartsPresentation({
    appearance,
    as: Tag = 'div',
    className,
    ...props
}: HTMLAttributes<HTMLElement> & {
    appearance: ChartsPresentationPart;
    as?:
        | 'div'
        | 'section'
        | 'article'
        | 'main'
        | 'span'
        | 'p'
        | 'h3'
        | 'h4'
        | 'ul'
        | 'li'
        | 'dl'
        | 'label'
        | 'small'
        | 'i'
        | 'nav'
        | 'strong';
}) {
    return <Tag {...props} className={s(appearance, className)} />;
}

/** Stateless chart readouts keep data formatting and sorting with each chart. */
export function DonutReadout({
    name,
    value,
    percentage,
}: {
    name: ReactNode;
    value: ReactNode;
    percentage: ReactNode;
}) {
    return (
        <div className={s('donut-tooltip')}>
            <p className={s('donut-tooltip__name')}>{name}</p>
            <p className={s('donut-tooltip__value')}>{value}</p>
            <p className={s('donut-tooltip__percent')}>{percentage}</p>
        </div>
    );
}
export function DonutLegendEntry({
    name,
    color,
    percentage,
    value,
    ...props
}: HTMLAttributes<HTMLLIElement> & { name: string; color: string; percentage: ReactNode; value: ReactNode }) {
    return (
        <li {...props} className={s('donut-legend__item')}>
            <span className={s('donut-legend__dot')} style={{ backgroundColor: color }} />
            <span className={s('donut-legend__name')} title={name}>
                {name}
            </span>
            <span className={s('donut-legend__percent')}>{percentage}</span>
            <span className={s('donut-legend__value')}>{value}</span>
        </li>
    );
}
export function HeatmapScale({ negative, positive }: { negative: ReactNode; positive: ReactNode }) {
    return (
        <div className={s('heatmap__legend')}>
            <span className={s('heatmap__legend-label')}>{negative}</span>
            <div className={s('heatmap__legend-gradient')} />
            <span className={s('heatmap__legend-label')}>{positive}</span>
        </div>
    );
}
export function HeatmapTile({
    child = false,
    hovered = false,
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & { child?: boolean; hovered?: boolean }) {
    return (
        <div
            {...props}
            className={cn(
                s('heatmap__item'),
                child && s('heatmap__item--child'),
                hovered && s('heatmap__item--hovered'),
                className,
            )}
        />
    );
}
