import { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    Legend,
} from 'recharts';
import { Card, CardHeader, CardContent } from '../ui/Card';
import type { ChartDataPoint, TimePeriod } from '../../types/types';
import './PortfolioChart.css';

interface PortfolioChartProps {
    data: ChartDataPoint[];
    onPeriodChange?: (period: TimePeriod) => void;
    selectedPeriod?: TimePeriod;
}

const periods: TimePeriod[] = ['1D', '7D', '1M', '3M', 'YTD', 'ALL'];

export function PortfolioChart({
    data,
    onPeriodChange,
    selectedPeriod = '1M',
}: PortfolioChartProps) {
    const [activePeriod, setActivePeriod] = useState<TimePeriod>(selectedPeriod);

    const handlePeriodChange = (period: TimePeriod) => {
        setActivePeriod(period);
        onPeriodChange?.(period);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatTooltipValue = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
        }).format(value);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="chart-tooltip">
                    <p className="chart-tooltip__label">{label}</p>
                    <p className="chart-tooltip__value chart-tooltip__value--primary">
                        <span className="chart-tooltip__dot chart-tooltip__dot--value" />
                        Valor: {formatTooltipValue(payload[0]?.value)}
                    </p>
                    {payload[1] && (
                        <p className="chart-tooltip__value chart-tooltip__value--secondary">
                            <span className="chart-tooltip__dot chart-tooltip__dot--invested" />
                            Invertido: {formatTooltipValue(payload[1]?.value)}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="portfolio-chart">
            <CardHeader
                title="Evolución del Portfolio"
                subtitle="Valor actual vs capital invertido"
                action={
                    <div className="period-selector">
                        {periods.map((period) => (
                            <button
                                key={period}
                                className={`period-selector__btn ${activePeriod === period ? 'period-selector__btn--active' : ''
                                    }`}
                                onClick={() => handlePeriodChange(period)}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                }
            />
            <CardContent className="portfolio-chart__content">
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="label"
                            stroke="#71717a"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#71717a"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={formatCurrency}
                            width={80}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            name="Valor"
                        />
                        <Area
                            type="monotone"
                            dataKey="invested"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            fillOpacity={1}
                            fill="url(#colorInvested)"
                            name="Invertido"
                        />
                    </AreaChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                    <div className="chart-legend__item">
                        <span className="chart-legend__dot chart-legend__dot--value" />
                        <span>Valor actual</span>
                    </div>
                    <div className="chart-legend__item">
                        <span className="chart-legend__dot chart-legend__dot--invested" />
                        <span>Capital invertido</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
