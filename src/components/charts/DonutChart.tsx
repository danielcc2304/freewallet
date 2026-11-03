import {DonutReadout,DonutLegendEntry} from './ChartPresentation';
import {ChartsPresentation} from './ChartPresentation';
import {PieChart,Pie,Cell,ResponsiveContainer,Tooltip} from 'recharts';
import type {CompositionItem} from '../../types/types';


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
        <DonutReadout name={<>{item.name}</>} value={<>{formatCurrency(item.value)}</>} percentage={<>{item.percentage.toFixed(1)}%</>}/>
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
        <ChartsPresentation appearance="donut-legend" as="ul" aria-label="Distribución de activos">
            {sortedItems.map((item, index) => {
                const name = item.name || item.symbol;
                if (!name) return null;

                return (
                    <DonutLegendEntry key={`legend-${index}`} name={name} color={item.color||'currentColor'} percentage={<>
                            {item.percentage.toFixed(1)}%
                        </>} value={<>
                            {formatCurrency(item.value)}
                        </>}/>
                );
            })}
        </ChartsPresentation>
    );
}

export function DonutChart({ data, title }: DonutChartProps) {

    return (
        <ChartsPresentation appearance="donut-chart"  >
            {title && <ChartsPresentation appearance="donut-chart__title" as="h4" >{title}</ChartsPresentation>}
            <ChartsPresentation appearance="donut-chart__plot"  >
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
            </ChartsPresentation>
            <DonutLegend data={data} />
        </ChartsPresentation>
    );
}
