import { useState } from 'react';
import type { HeatmapItem } from '../../types/types';
import './Heatmap.css';

interface HeatmapProps {
    data: HeatmapItem[];
    showBreakdown?: boolean;
    onItemClick?: (item: HeatmapItem) => void;
}

export function Heatmap({ data, showBreakdown = false, onItemClick }: HeatmapProps) {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const getBackgroundColor = (changePercent: number): string => {
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

    const renderItem = (item: HeatmapItem, depth: number = 0) => {
        const widthPercent = (item.weight / totalWeight) * 100;
        const isHovered = hoveredItem === item.id;
        const hasChildren = showBreakdown && item.children && item.children.length > 0;

        if (hasChildren && item.children) {
            return (
                <div
                    key={item.id}
                    className="heatmap__group"
                    style={{ flex: `${widthPercent} 1 0` }}
                >
                    <div className="heatmap__group-label">{item.symbol}</div>
                    <div className="heatmap__group-items">
                        {item.children.map((child) => (
                            <div
                                key={child.id}
                                className={`heatmap__item heatmap__item--child ${isHovered ? 'heatmap__item--hovered' : ''}`}
                                style={{
                                    backgroundColor: getBackgroundColor(child.changePercent),
                                    color: getTextColor(child.changePercent),
                                    flex: `${child.weight} 1 0`,
                                }}
                                onMouseEnter={() => setHoveredItem(child.id)}
                                onMouseLeave={() => setHoveredItem(null)}
                                onClick={() => onItemClick?.(child)}
                            >
                                <span className="heatmap__item-symbol">{child.symbol}</span>
                                <span className="heatmap__item-change">{formatChange(child.changePercent)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div
                key={item.id}
                className={`heatmap__item ${isHovered ? 'heatmap__item--hovered' : ''}`}
                style={{
                    backgroundColor: getBackgroundColor(item.changePercent),
                    color: getTextColor(item.changePercent),
                    flex: `${widthPercent} 1 0`,
                    minWidth: widthPercent > 15 ? '120px' : '80px',
                }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => onItemClick?.(item)}
            >
                <span className="heatmap__item-symbol">{item.symbol}</span>
                <span className="heatmap__item-name">{item.name}</span>
                <span className="heatmap__item-change">{formatChange(item.changePercent)}</span>
                <span className="heatmap__item-value">{formatCurrency(item.value)}</span>
            </div>
        );
    };

    return (
        <div className="heatmap">
            <div className="heatmap__container">
                {data.map((item) => renderItem(item))}
            </div>
            <div className="heatmap__legend">
                <span className="heatmap__legend-label">Pérdida</span>
                <div className="heatmap__legend-gradient" />
                <span className="heatmap__legend-label">Ganancia</span>
            </div>
        </div>
    );
}
