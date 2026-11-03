import { cn } from '../../utils/cn';
import { HeatmapDetailStyle } from './HeatmapDetail.styles';
import { DonutChartDetailStyle } from './DonutChartDetail.styles';
const parts = {
    heatmap: HeatmapDetailStyle('heatmap'),
    heatmap__container: HeatmapDetailStyle('heatmap__container'),
    heatmap__item: HeatmapDetailStyle('heatmap__item'),
    'heatmap__item--hovered': HeatmapDetailStyle('heatmap__item--hovered'),
    'heatmap__item--child': HeatmapDetailStyle('heatmap__item--child'),
    'heatmap__item-symbol': HeatmapDetailStyle('heatmap__item-symbol'),
    'heatmap__item-name': HeatmapDetailStyle('heatmap__item-name'),
    'heatmap__item-change': HeatmapDetailStyle('heatmap__item-change'),
    'heatmap__item-value': HeatmapDetailStyle('heatmap__item-value'),
    heatmap__group: HeatmapDetailStyle('heatmap__group'),
    'heatmap__group-label': HeatmapDetailStyle('heatmap__group-label'),
    'heatmap__group-items': HeatmapDetailStyle('heatmap__group-items'),
    heatmap__legend: HeatmapDetailStyle('heatmap__legend'),
    'heatmap__legend-label': HeatmapDetailStyle('heatmap__legend-label'),
    'heatmap__legend-gradient': HeatmapDetailStyle('heatmap__legend-gradient'),
    'donut-chart': DonutChartDetailStyle('donut-chart'),
    'donut-chart__title': DonutChartDetailStyle('donut-chart__title'),
    'donut-chart__plot': DonutChartDetailStyle('donut-chart__plot'),
    'donut-tooltip': DonutChartDetailStyle('donut-tooltip'),
    'donut-tooltip__name': DonutChartDetailStyle('donut-tooltip__name'),
    'donut-tooltip__value': DonutChartDetailStyle('donut-tooltip__value'),
    'donut-tooltip__percent': DonutChartDetailStyle('donut-tooltip__percent'),
    'donut-legend': DonutChartDetailStyle('donut-legend'),
    'donut-legend__item': DonutChartDetailStyle('donut-legend__item'),
    'donut-legend__dot': DonutChartDetailStyle('donut-legend__dot'),
    'donut-legend__name': DonutChartDetailStyle('donut-legend__name'),
    'donut-legend__percent': DonutChartDetailStyle('donut-legend__percent'),
    'donut-legend__value': DonutChartDetailStyle('donut-legend__value'),
};
export type ChartsPresentationPart = keyof typeof parts;
export function chartsPresentationStyle(part: ChartsPresentationPart, className?: string) {
    return cn(parts[part], className);
}
/** Resolve retained integration hooks through static recipes; financial values stay with the caller. */
export function chartsPresentationClasses(className?: string) {
    return cn(
        className
            ?.split(/\s+/)
            .map((token) => (Object.hasOwn(parts, token) ? parts[token as ChartsPresentationPart] : token)),
    );
}
