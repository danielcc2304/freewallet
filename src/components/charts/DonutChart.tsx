import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { CompositionItem } from '../../types/types';
import './DonutChart.css';

interface DonutChartProps {
    data: CompositionItem[];
    title?: string;
}

export function DonutChart({ data, title }: DonutChartProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="donut-tooltip">
                    <p className="donut-tooltip__name">{item.name}</p>
                    <p className="donut-tooltip__value">{formatCurrency(item.value)}</p>
                    <p className="donut-tooltip__percent">{item.percentage.toFixed(1)}%</p>
                </div>
            );
        }
        return null;
    };

    const renderLegend = (props: any) => {
        const { payload } = props;
        return (
            <ul className="donut-legend">
                {payload.slice(0, 6).map((entry: any, index: number) => (
                    <li key={`legend-${index}`} className="donut-legend__item">
                        <span
                            className="donut-legend__dot"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="donut-legend__name">{entry.payload.symbol}</span>
                        <span className="donut-legend__percent">
                            {entry.payload.percentage.toFixed(1)}%
                        </span>
                    </li>
                ))}
                {payload.length > 6 && (
                    <li className="donut-legend__item donut-legend__item--more">
                        +{payload.length - 6} más
                    </li>
                )}
            </ul>
        );
    };

    return (
        <div className="donut-chart">
            {title && <h4 className="donut-chart__title">{title}</h4>}
            <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                    <Pie
                        data={data as unknown as Record<string, unknown>[]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={500}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        content={<CustomTooltip />}
                        contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
                    />
                    <Legend content={renderLegend} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
