import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import type { PerformerData } from '../../types/types';
import './Performers.css';

interface PerformersProps {
    data: PerformerData[];
    type: 'best' | 'worst';
    limit?: number;
}

export function Performers({ data, type, limit = 5 }: PerformersProps) {
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
            <Card className={`performers performers--${type}`}>
                <CardHeader
                    title={title}
                    action={<Icon size={20} className={`performers__icon performers__icon--${type}`} />}
                />
                <CardContent>
                    <p className="performers__empty">No hay datos disponibles</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`performers performers--${type}`}>
            <CardHeader
                title={title}
                action={<Icon size={20} className={`performers__icon performers__icon--${type}`} />}
            />
            <CardContent>
                <ul className="performers__list">
                    {sortedData.map((item, index) => (
                        <li key={item.id} className="performers__item">
                            <div className="performers__rank">{index + 1}</div>
                            <div className="performers__info">
                                <span className="performers__symbol">{item.symbol}</span>
                                <span className="performers__name">{item.name}</span>
                            </div>
                            <div className="performers__data">
                                <span className={`performers__change performers__change--${type}`}>
                                    {formatChange(item.changePercent)}
                                </span>
                                <span className="performers__value">{formatCurrency(item.value)}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
