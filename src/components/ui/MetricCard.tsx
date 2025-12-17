import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from './Card';
import './MetricCard.css';

interface MetricCardProps {
    title: string;
    value: string;
    change?: number;
    changeLabel?: string;
    icon?: React.ReactNode;
    size?: 'default' | 'large';
}

export function MetricCard({
    title,
    value,
    change,
    changeLabel,
    icon,
    size = 'default',
}: MetricCardProps) {
    const isPositive = change !== undefined && change > 0;
    const isNegative = change !== undefined && change < 0;
    const isNeutral = change === undefined || change === 0;

    const getTrendIcon = () => {
        if (isPositive) return <TrendingUp size={16} />;
        if (isNegative) return <TrendingDown size={16} />;
        return <Minus size={16} />;
    };

    const formatChange = (value: number): string => {
        const sign = value > 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    return (
        <Card className={`metric-card metric-card--${size}`}>
            <div className="metric-card__header">
                <span className="metric-card__title">{title}</span>
                {icon && <span className="metric-card__icon">{icon}</span>}
            </div>
            <div className="metric-card__value">{value}</div>
            {change !== undefined && (
                <div
                    className={`metric-card__change ${isPositive ? 'metric-card__change--positive' : ''
                        } ${isNegative ? 'metric-card__change--negative' : ''} ${isNeutral ? 'metric-card__change--neutral' : ''
                        }`}
                >
                    {getTrendIcon()}
                    <span>{formatChange(change)}</span>
                    {changeLabel && <span className="metric-card__change-label">{changeLabel}</span>}
                </div>
            )}
        </Card>
    );
}
