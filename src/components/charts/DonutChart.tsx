import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, type LegendPayload, type LegendProps } from 'recharts';
import type { CompositionItem } from '../../types/types';
import './DonutChart.css';

type DonutTooltipEntry = {
    payload?: CompositionItem;
};

type DonutTooltipProps = {
    active?: boolean;
    payload?: DonutTooltipEntry[];
};

type DonutLegendProps = LegendProps & {
    payload?: readonly LegendPayload[];
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

function renderLegend({ payload = [] }: DonutLegendProps) {
    const sortedPayload = [...payload].sort((left, right) => {
        const leftValue = Number((left.payload as Partial<CompositionItem> | undefined)?.value ?? 0);
        const rightValue = Number((right.payload as Partial<CompositionItem> | undefined)?.value ?? 0);
        return rightValue - leftValue;
    });

    return (
        <ul className="donut-legend">
            {sortedPayload.slice(0, 6).map((entry, index) => {
                const item = entry.payload as Partial<CompositionItem> | undefined;
                const name = item?.name || item?.symbol;
                if (!name) return null;

                return (
                    <li key={`legend-${index}`} className="donut-legend__item">
                        <span
                            className="donut-legend__dot"
                            style={{ backgroundColor: entry.color || 'currentColor' }}
                        />
                        <span className="donut-legend__name" title={name}>
                            {name}
                        </span>
                        <span className="donut-legend__percent">
                            {Number(item?.percentage ?? 0).toFixed(1)}%
                        </span>
                    </li>
                );
            })}
            {sortedPayload.length > 6 && (
                <li className="donut-legend__item donut-legend__item--more">
                    +{sortedPayload.length - 6} más
                </li>
            )}
        </ul>
    );
}

export function DonutChart({ data, title }: DonutChartProps) {

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
