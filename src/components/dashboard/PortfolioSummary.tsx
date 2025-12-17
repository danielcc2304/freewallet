import { useState } from 'react';
import { MetricCard } from '../ui/MetricCard';
import { Wallet, TrendingUp, PiggyBank, BarChart3 } from 'lucide-react';
import type { PortfolioMetrics } from '../../types/types';
import './PortfolioSummary.css';

interface PortfolioSummaryProps {
    metrics: PortfolioMetrics;
}

type PeriodTab = 'daily' | 'monthly' | '3month' | 'ytd';

export function PortfolioSummary({ metrics }: PortfolioSummaryProps) {
    const [activeTab, setActiveTab] = useState<PeriodTab>('daily');

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
        }).format(value);
    };

    const getChangeForPeriod = (): { value: number; percent: number; label: string } => {
        switch (activeTab) {
            case 'monthly':
                return {
                    value: metrics.monthlyChange,
                    percent: metrics.monthlyChangePercent,
                    label: 'este mes'
                };
            case '3month':
                return {
                    value: metrics.threeMonthChange,
                    percent: metrics.threeMonthChangePercent,
                    label: 'últimos 3 meses'
                };
            case 'ytd':
                return {
                    value: metrics.ytdChange,
                    percent: metrics.ytdChangePercent,
                    label: 'este año (YTD)'
                };
            default:
                return {
                    value: metrics.dailyChange,
                    percent: metrics.dailyChangePercent,
                    label: 'hoy'
                };
        }
    };

    const periodChange = getChangeForPeriod();

    const tabs: { key: PeriodTab; label: string }[] = [
        { key: 'daily', label: 'Diario' },
        { key: 'monthly', label: 'Mensual' },
        { key: '3month', label: '3 Meses' },
        { key: 'ytd', label: 'YTD' },
    ];

    return (
        <div className="portfolio-summary">
            <div className="portfolio-summary__header">
                <h2 className="portfolio-summary__title">Resumen del Portfolio</h2>
                <div className="portfolio-summary__tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={`portfolio-summary__tab ${activeTab === tab.key ? 'portfolio-summary__tab--active' : ''
                                }`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="portfolio-summary__grid">
                <MetricCard
                    title="Capital Invertido"
                    value={formatCurrency(metrics.totalInvested)}
                    icon={<PiggyBank size={20} />}
                    size="large"
                />
                <MetricCard
                    title="Valor Actual"
                    value={formatCurrency(metrics.currentValue)}
                    change={metrics.percentageGain}
                    changeLabel="total"
                    icon={<Wallet size={20} />}
                    size="large"
                />
                <MetricCard
                    title="Ganancia/Pérdida Total"
                    value={formatCurrency(metrics.totalGain)}
                    change={metrics.percentageGain}
                    icon={<TrendingUp size={20} />}
                />
                <MetricCard
                    title={`Cambio ${periodChange.label}`}
                    value={formatCurrency(periodChange.value)}
                    change={periodChange.percent}
                    icon={<BarChart3 size={20} />}
                />
            </div>
        </div>
    );
}
