import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { heatmapControlClass as part } from './heatmapControlStyles';

type Appearance = 'index' | 'display';
export function HeatmapOptions({ appearance, className, ...props }: HTMLAttributes<HTMLDivElement> & { appearance: Appearance }) {
    return <div {...props} className={cn(part(appearance === 'index' ? 'market-heatmap__tabs' : 'market-heatmap__display-options'), className)} />;
}

export function HeatmapOption({ appearance, selected, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { appearance: Appearance; selected: boolean }) {
    const name = appearance === 'index' ? 'market-heatmap__tab' : 'market-heatmap__display-option';
    return <button {...props} className={cn(part(name), selected && part(`${name}--active`), className)} />;
}

export function HeatmapIndexIntro({ title, description, badge }: { title: ReactNode; description: ReactNode; badge: ReactNode }) {
    return <div className={part('market-heatmap__index-intro')}><div><h2>{title}</h2><p>{description}</p></div><span>{badge}</span></div>;
}

export function HeatmapLegend({ lower, upper }: { lower: ReactNode; upper: ReactNode }) {
    return <div className={part('market-heatmap__legend')} aria-label="Escala de rendimiento diario"><span>{lower}</span><div className={part('market-heatmap__legend-scale')} /><span>{upper}</span></div>;
}

export function HeatmapSelection({ label, title, detail, value, valueClassName }: { label: ReactNode; title: ReactNode; detail: ReactNode; value: ReactNode; valueClassName?: string }) {
    return <div className={part('market-heatmap__selected-company')}><span>{label}</span><strong>{title}</strong><small>{detail}</small><b className={valueClassName}>{value}</b></div>;
}

export function HeatmapSectorRow({ title, weight, children }: { title: ReactNode; weight: ReactNode; children: ReactNode }) {
    return <div className={part('market-heatmap__sector-item')}><strong>{title}</strong><span>{weight}</span><small>{children}</small></div>;
}
