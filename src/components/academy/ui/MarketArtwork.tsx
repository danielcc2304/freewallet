import type { HTMLAttributes, SVGProps, ReactNode } from 'react';
import { marketArtworkStyle as s } from './marketArtworkStyles';
export function MarketHeatmapPage({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={s('market-heatmap', className)} />;
}
export function MarketSectorBoundary({
    sector,
    rectangle,
    title,
}: {
    sector: string;
    rectangle: SVGProps<SVGRectElement>;
    title: ReactNode;
}) {
    return (
        <g className={s('market-heatmap__sector-group')} data-sector={sector} pointerEvents="none">
            <rect {...rectangle}>
                <title>{title}</title>
            </rect>
        </g>
    );
}
/** Geometry, colours and formatted financial labels are supplied by the caller. */
export function MarketCompanyTile({
    rectangle,
    title,
    children,
}: {
    rectangle: SVGProps<SVGRectElement>;
    title: ReactNode;
    children: ReactNode;
}) {
    return (
        <g className={s('market-heatmap__tile')}>
            <rect {...rectangle}>
                <title>{title}</title>
            </rect>
            {children}
        </g>
    );
}
const labelParts = {
    symbol: 'market-heatmap__tile-symbol',
    name: 'market-heatmap__tile-name',
    change: 'market-heatmap__tile-change',
} as const;
export function MarketTileLabel({
    appearance,
    className,
    ...props
}: SVGProps<SVGTextElement> & { appearance: keyof typeof labelParts }) {
    return <text {...props} className={s(labelParts[appearance], className)} />;
}
export function MarketSectorLabels({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={s('market-heatmap__sector-label-layer', className)} />;
}
export function MarketSectorLabel({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
    return <span {...props} className={s('market-heatmap__sector-label', className)} />;
}
