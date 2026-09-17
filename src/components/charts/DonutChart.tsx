import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { CompositionItem } from '../../types/types';
import './DonutChart.css';

type DonutTooltipEntry = {
    payload?: CompositionItem;
};

type DonutTooltipProps = {
    active?: boolean;
    payload?: DonutTooltipEntry[];
};

interface DonutChartProps {
    data: CompositionItem[];
    title?: string;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
    }).format(value);
}

function CustomTooltip({ active, payload }: DonutTooltipProps) {
    const item = active ? payload?.[0]?.payload : undefined;
    if (!item) return null;

    return (
        <div className="donut-tooltip">
            <p className="donut-tooltip__name">{item.name}</p>
            <p className="donut-tooltip__value">{formatCurrency(item.value)}</p>
            <p className="donut-tooltip__percent">{item.percentage.toFixed(1)}%</p>
        </div>
    );
}

function getLegendItems(data: CompositionItem[]) {
    return [...data].sort((left, right) => {
        return right.value - left.value;
    });
}

function DonutLegend({ data }: { data: CompositionItem[] }) {
    const sortedItems = getLegendItems(data);

    return (
        <ul className="donut-legend" aria-label="Distribución de activos">
            {sortedItems.map((item, index) => {
                const name = item.name || item.symbol;
                if (!name) return null;

                return (
                    <li key={`legend-${index}`} className="donut-legend__item">
                        <span
                            className="donut-legend__dot"
                            style={{ backgroundColor: item.color || 'currentColor' }}
                        />
                        <span className="donut-legend__name" title={name}>
                            {name}
                        </span>
                        <span className="donut-legend__percent">
                            {item.percentage.toFixed(1)}%
                        </span>
                        <span className="donut-legend__value">
                            {formatCurrency(item.value)}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

export function DonutChart({ data, title }: DonutChartProps) {

    return (
        <div className="donut-chart">
            {title && <h4 className="donut-chart__title">{title}</h4>}
            <div className="donut-chart__plot">
                <ResponsiveContainer width="100%" height="100%">
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
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <DonutLegend data={data} />
        </div>
    );
}
