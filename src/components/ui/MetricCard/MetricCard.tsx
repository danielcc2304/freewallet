import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../Card';
import { cn } from '../../../utils/cn';

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
        <Card className={cn('metric-card tw:flex tw:flex-col tw:gap-ui-sm', `metric-card--${size}`)}>
            <div className="metric-card__header tw:flex tw:items-center tw:justify-between">
                <span className="metric-card__title tw:text-sm tw:leading-[1.6] tw:text-muted tw:font-medium tw:uppercase tw:tracking-[.5px]">{title}</span>
                {icon && <span className="metric-card__icon tw:text-muted">{icon}</span>}
            </div>
            <div className={cn('metric-card__value tw:text-2xl tw:font-bold tw:text-main tw:max-[640px]:text-xl', size === 'large' && 'tw:text-3xl tw:max-[640px]:text-2xl', 'tw:leading-[1.2]')}>{value}</div>
            {change !== undefined && Number.isFinite(change) && (
                <div
                    className={cn('metric-card__change tw:flex tw:items-center tw:gap-ui-xs tw:text-sm tw:leading-[1.6] tw:font-medium',
                        isPositive && 'metric-card__change--positive tw:text-positive',
                        isNegative && 'metric-card__change--negative tw:text-negative',
                        isNeutral && 'metric-card__change--neutral tw:text-muted')}
                >
                    {getTrendIcon()}
                    <span>{formatChange(change)}</span>
                    {changeLabel && <span className="metric-card__change-label tw:text-muted tw:font-normal">{changeLabel}</span>}
                </div>
            )}
        </Card>
    );
}
