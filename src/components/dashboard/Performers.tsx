import { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui';
import type { PerformerData } from '../../types/types';
import { cn } from '../../utils/cn';
import { performerStyles as styles } from './performerStyles';

interface PerformersProps {
    data: PerformerData[];
    type: 'best' | 'worst';
    limit?: number;
}

export const Performers = memo(function Performers({ data, type, limit = 5 }: PerformersProps) {
    const title = type === 'best' ? 'Mejores de la Cartera' : 'Peores de la Cartera';
    const Icon = type === 'best' ? TrendingUp : TrendingDown;

    const sortedData = [...data]
        .sort((a, b) => type === 'best'
            ? b.changePercent - a.changePercent
            : a.changePercent - b.changePercent
        )
        .slice(0, limit);

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatChange = (value: number): string => {
        const sign = value > 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    if (sortedData.length === 0) {
        return (
            <Card className={cn(`performers performers--${type}`, styles.root)}>
                <CardHeader
                    title={title}
                    subtitle="Rentabilidad desde la compra"
                    action={<Icon size={20} className={cn(`performers__icon performers__icon--${type}`, styles.icon, type === 'best' ? 'tw:text-positive' : 'tw:text-negative')} />}
                />
                <CardContent>
                    <p className={cn('performers__empty', styles.empty)}>No hay datos disponibles</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn(`performers performers--${type}`, styles.root)}>
            <CardHeader
                title={title}
                subtitle="Rentabilidad desde la compra"
                action={<Icon size={20} className={cn(`performers__icon performers__icon--${type}`, styles.icon, type === 'best' ? 'tw:text-positive' : 'tw:text-negative')} />}
            />
            <CardContent>
                <ul className={cn('performers__list', styles.list)}>
                    {sortedData.map((item, index) => (
                        <li key={item.id} className={cn('performers__item', styles.item)}>
                            <div className={cn('performers__rank', styles.rank)}>{index + 1}</div>
                            <div className={cn('performers__info', styles.info)}>
                                <span className={cn('performers__symbol', styles.symbol)}>{item.symbol}</span>
                                <span className={cn('performers__name', styles.name)}>{item.name}</span>
                            </div>
                            <div className={cn('performers__data', styles.data)}>
                                <span className={cn('performers__change', styles.change, item.changePercent > 0 ? 'performers__change--positive tw:text-positive' : item.changePercent < 0 ? 'performers__change--negative tw:text-negative' : '')}>
                                    {formatChange(item.changePercent)}
                                </span>
                                <span className={cn('performers__value', styles.value)}>{formatCurrency(item.value)}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
});
