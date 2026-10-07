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
    const periodDates = metrics.periodDates?.[activeTab];
    const changeTitle = periodDates?.monthlyBase && periodDates.baseDate
        ? `Cambio desde ${new Date(periodDates.baseDate).toLocaleDateString('es-ES')}`
        : `Cambio ${periodChange.label}`;

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
            {periodDates?.baseDate && <p className="portfolio-summary__dates">Periodo efectivo{periodDates.monthlyBase ? ' con cierre mensual' : ''}: {new Date(periodDates.baseDate).toLocaleDateString('es-ES')} — {periodDates.endDate ? new Date(periodDates.endDate).toLocaleDateString('es-ES') : 'sin cierre'}.</p>}
            {activeTab === '1D' && !Number.isFinite(periodChange.value) && <p className="portfolio-summary__dates">La variación diaria necesita valoraciones comparables o precios de hoy con cierre anterior. En Mis Activos puedes ver la última variación disponible y su fecha.</p>}

            <div className="portfolio-summary__grid">
                <MetricCard
                    title="Coste de posiciones abiertas"
                    value={formatCurrency(metrics.totalInvested)}
                    icon={<PiggyBank size={20} />}
                    size="large"
                />
                <MetricCard
                    title={estimatedCount ? 'Valor actual (incluye estimaciones)' : 'Valor Actual'}
                    value={formatCurrency(metrics.currentValue)}
                    icon={<Wallet size={20} />}
                    size="large"
                />
                <MetricCard
                    title={estimatedCount ? 'Resultado no realizado (estimado)' : 'Resultado no realizado'}
                    value={formatCurrency(metrics.unrealizedGain ?? NaN)}
                    change={metrics.percentageGain}
                    changeLabel="sobre el coste abierto"
                    icon={<TrendingUp size={20} />}
                />
                <MetricCard
                    title="Resultado realizado"
                    value={Number.isFinite(metrics.realizedGain) ? formatCurrency(metrics.realizedGain!) : 'No disponible'}
                    icon={<TrendingUp size={20} />}
                />
                <MetricCard
                    title={estimatedCount ? 'Resultado total (estimado)' : 'Resultado total'}
                    value={Number.isFinite(metrics.totalGain) ? formatCurrency(metrics.totalGain) : 'No disponible'}
                    icon={<TrendingUp size={20} />}
                />
                <MetricCard
                    title={changeTitle}
                    value={formatCurrency(periodChange.value)}
                    change={Number.isFinite(periodChange.percent) ? periodChange.percent : undefined}
                    icon={<BarChart3 size={20} />}
                />
            </div>
            <details className="portfolio-summary__calculation">
                <summary>{metrics.resultUnavailableReason
                    ? <><span role="status">Realizado y total no disponibles</span> · Ver motivo</>
                    : 'Cómo se calculan los resultados'}</summary>
                {metrics.resultUnavailableReason && <p>{metrics.resultUnavailableReason}</p>}
                <p>Realizado: ventas menos coste medio, incluidos los cierres. No realizado: posiciones abiertas. Total: suma de ambos. Gastos e impuestos: solo los registrados.</p>
            </details>
        </div>
    );
}
