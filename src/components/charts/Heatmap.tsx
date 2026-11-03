import {HeatmapScale,HeatmapTile} from './ChartPresentation';
import {ChartsPresentation} from './ChartPresentation';

import {useState} from 'react';
import type {HeatmapItem} from '../../types/types';


const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{10}$/;

function getSecondaryIdentifier(symbol: string, name: string): string {
    const candidate = symbol.trim();
    return candidate && candidate !== name && !ISIN_PATTERN.test(candidate.toUpperCase()) ? candidate : '';
}

interface HeatmapProps {
    data: HeatmapItem[];
    showBreakdown?: boolean;
    onItemClick?: (item: HeatmapItem) => void;
}

export function Heatmap({ data, showBreakdown = false, onItemClick }: HeatmapProps) {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const getBackgroundColor = (changePercent: number): string => {
        if (!Number.isFinite(changePercent)) return 'var(--bg-tertiary)';
        const intensity = Math.min(Math.abs(changePercent) / 10, 1);

        if (changePercent > 0) {
            // Green shades
            const r = Math.round(20 - intensity * 10);
            const g = Math.round(83 + intensity * 100);
            const b = Math.round(45 + intensity * 50);
            return `rgb(${r}, ${g}, ${b})`;
        } else if (changePercent < 0) {
            // Red shades
            const r = Math.round(180 + intensity * 59);
            const g = Math.round(68 - intensity * 30);
            const b = Math.round(68 - intensity * 30);
            return `rgb(${r}, ${g}, ${b})`;
        }
        return 'var(--bg-tertiary)';
    };

    const getTextColor = (changePercent: number): string => {
        return Math.abs(changePercent) > 3 ? 'white' : 'var(--text-primary)';
    };

    const formatChange = (value: number): string => {
        if (!Number.isFinite(value)) return 'N/D';
        const sign = value > 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    // Calculate cell sizes based on weight
    const totalWeight = data.reduce((sum, item) => sum + item.weight, 0);
    const safeTotalWeight = totalWeight > 0 ? totalWeight : data.length;
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, item: HeatmapItem) => {
        if (!onItemClick || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        onItemClick(item);
    };

    const renderItem = (item: HeatmapItem) => {
        const widthPercent = totalWeight > 0 ? (item.weight / safeTotalWeight) * 100 : 100 / safeTotalWeight;
        const isHovered = hoveredItem === item.id;
        const hasChildren = showBreakdown && item.children && item.children.length > 0;

        if (hasChildren && item.children) {
            return (
                <ChartsPresentation appearance="heatmap__group"  key={item.id} style={{ flex: `${widthPercent} 1 200px` }}>
                    <ChartsPresentation appearance="heatmap__group-label"  >{item.name}</ChartsPresentation>
                    <ChartsPresentation appearance="heatmap__group-items"  >
                        {item.children.map((child) => (
                            <HeatmapTile child hovered={hoveredItem===child.id} key={child.id} style={{
                                    backgroundColor: getBackgroundColor(child.changePercent),
                                    color: getTextColor(child.changePercent),
                                    flex: `${child.weight} 1 96px`,
                                }} onMouseEnter={() => setHoveredItem(child.id)} onMouseLeave={() => setHoveredItem(null)} onClick={() => onItemClick?.(child)} role={onItemClick ? 'button' : undefined} tabIndex={onItemClick ? 0 : undefined} onKeyDown={(event) => handleKeyDown(event, child)}>
                                <ChartsPresentation appearance="heatmap__item-symbol" as="span" >{child.name}</ChartsPresentation>
                                {getSecondaryIdentifier(child.symbol, child.name) && (
                                    <ChartsPresentation appearance="heatmap__item-name" as="span" >{getSecondaryIdentifier(child.symbol, child.name)}</ChartsPresentation>
                                )}
                                <ChartsPresentation appearance="heatmap__item-change" as="span" >{Number.isFinite(child.changePercent) ? formatChange(child.changePercent) : `${child.weight.toLocaleString('es-ES', { maximumFractionDigits: 2 })}% del fondo`}</ChartsPresentation>
                            </HeatmapTile>
                        ))}
                    </ChartsPresentation>
                </ChartsPresentation>
            );
        }

        return (
            <HeatmapTile hovered={isHovered} key={item.id} style={{
                    backgroundColor: getBackgroundColor(item.changePercent),
                    color: getTextColor(item.changePercent),
                    flex: `${widthPercent} 1 0`,
                    minWidth: widthPercent > 15 ? '120px' : '80px',
                }} onMouseEnter={() => setHoveredItem(item.id)} onMouseLeave={() => setHoveredItem(null)} onClick={() => onItemClick?.(item)} role={onItemClick ? 'button' : undefined} tabIndex={onItemClick ? 0 : undefined} onKeyDown={(event) => handleKeyDown(event, item)}>
                <ChartsPresentation appearance="heatmap__item-symbol" as="span" >{item.name}</ChartsPresentation>
                {getSecondaryIdentifier(item.symbol, item.name) && (
                    <ChartsPresentation appearance="heatmap__item-name" as="span" >{getSecondaryIdentifier(item.symbol, item.name)}</ChartsPresentation>
                )}
                <ChartsPresentation appearance="heatmap__item-change" as="span" >{formatChange(item.changePercent)}</ChartsPresentation>
                <ChartsPresentation appearance="heatmap__item-value" as="span" >{formatCurrency(item.value)}</ChartsPresentation>
            </HeatmapTile>
        );
    };

    return (
        <ChartsPresentation appearance="heatmap"  >
            <ChartsPresentation appearance="heatmap__container"  >
                {data.map((item) => renderItem(item))}
            </ChartsPresentation>
            <HeatmapScale negative={<>Pérdida</>} positive={<>Ganancia</>}/>
        </ChartsPresentation>
    );
}
