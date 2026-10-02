import { MetricCard } from '../../ui/MetricCard';
import { Wallet, TrendingUp, PiggyBank, BarChart3 } from 'lucide-react';
import type { PortfolioMetrics, TimePeriod } from '../../../types/types';
import './PortfolioSummary.css';

interface PortfolioSummaryProps {
    metrics: PortfolioMetrics;
    period: TimePeriod;
    onPeriodChange: (period: TimePeriod) => void;
    estimatedCount?: number;
}

type PeriodTab = TimePeriod;

export function PortfolioSummary({ metrics, period: activeTab, onPeriodChange, estimatedCount = 0 }: PortfolioSummaryProps) {

    const formatCurrency = (value: number): string => {
        if (!Number.isFinite(value)) return 'Sin histórico suficiente';
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
        }).format(value);
    };

    const getChangeForPeriod = (): { value: number; percent: number; label: string } => {
        switch (activeTab) {
            case '1M':
                return {
                    value: metrics.monthlyChange,
                    percent: metrics.monthlyChangePercent,
                    label: 'último mes'
                };
            case '3M':
                return {
                    value: metrics.threeMonthChange,
                    percent: metrics.threeMonthChangePercent,
                    label: 'últimos 3 meses'
                };
            case 'YTD':
                return {
                    value: metrics.ytdChange,
                    percent: metrics.ytdChangePercent,
                    label: 'este año (YTD)'
                };
            case '7D': return { value: metrics.weeklyChange ?? NaN, percent: metrics.weeklyChangePercent ?? NaN, label: 'últimos 7 días' };
            case 'ALL': return { value: metrics.historyChange ?? NaN, percent: metrics.historyChangePercent ?? NaN, label: 'del histórico' };
            default:
                return {
                    value: metrics.dailyChange,
                    percent: metrics.dailyChangePercent,
                    label: 'último día'
                };
        }
    };

    const periodChange = getChangeForPeriod();

    const tabs: { key: PeriodTab; label: string }[] = [
        { key: '1D', label: 'Diario' },
        { key: '7D', label: '7 días' },
        { key: '1M', label: 'Mensual' },
        { key: '3M', label: '3 Meses' },
        { key: 'YTD', label: 'YTD' },
        { key: 'ALL', label: 'Todo' },
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
                            type="button" aria-pressed={activeTab === tab.key}
                            onClick={() => onPeriodChange(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            {metrics.periodDates?.[activeTab]?.baseDate && <p className="portfolio-summary__dates">Periodo efectivo: {new Date(metrics.periodDates[activeTab]!.baseDate!).toLocaleDateString('es-ES')} — {metrics.periodDates[activeTab]!.endDate ? new Date(metrics.periodDates[activeTab]!.endDate!).toLocaleDateString('es-ES') : 'sin cierre'}.</p>}

            <div className="portfolio-summary__grid">
                <MetricCard
                    title="Capital Invertido"
                    value={formatCurrency(metrics.totalInvested)}
                    icon={<PiggyBank size={20} />}
                    size="large"
                />
                <MetricCard
                    title={estimatedCount ? 'Valor actual (incluye estimaciones)' : 'Valor Actual'}
                    value={formatCurrency(metrics.currentValue)}
                    change={metrics.percentageGain}
                    changeLabel="total"
                    icon={<Wallet size={20} />}
                    size="large"
                />
                <MetricCard
                    title={estimatedCount ? 'Resultado total (estimado)' : 'Ganancia/Pérdida Total'}
                    value={formatCurrency(metrics.totalGain)}
                    change={metrics.percentageGain}
                    icon={<TrendingUp size={20} />}
                />
                <MetricCard
                    title={`Cambio ${periodChange.label}`}
                    value={formatCurrency(periodChange.value)}
                    change={Number.isFinite(periodChange.percent) ? periodChange.percent : undefined}
                    icon={<BarChart3 size={20} />}
                />
            </div>
        </div>
    );
}
