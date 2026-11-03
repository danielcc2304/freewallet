import { DashboardReviewRow } from '../ui/DashboardReviewRow';
import { DashboardSegments } from '../ui/DashboardSegments';
import {DashboardInfo} from '../DashboardInfo';
import { MetricCard } from '../../ui/MetricCard';
import {Button,ConfirmDialog} from '../../ui';
import {useState} from 'react';
import { Wallet, TrendingUp, PiggyBank, BarChart3 } from 'lucide-react';
import type { PortfolioMetrics, TimePeriod } from '../../../types/types';

interface PortfolioSummaryProps {
    metrics: PortfolioMetrics;
    period: TimePeriod;
    onPeriodChange: (period: TimePeriod) => void;
    estimatedCount?: number;
    onCorrectDeletion?: (id:string,discard:boolean)=>Promise<void>;
}

type PeriodTab = TimePeriod;

export function PortfolioSummary({ metrics, period: activeTab, onPeriodChange, estimatedCount = 0,onCorrectDeletion }: PortfolioSummaryProps) {
    const [reviewId,setReviewId]=useState<string|null>(null);
    const [saving,setSaving]=useState(false);
    const [reviewError,setReviewError]=useState('');
    const review=metrics.deletionReviews?.find(r=>r.id===reviewId);
    const correct=async(id:string,discard:boolean)=>{
        if(!onCorrectDeletion || saving)return;
        setSaving(true);setReviewError('');
        try {await onCorrectDeletion(id,discard);setReviewId(null);}catch(error){setReviewError(error instanceof Error ? error.message:'No se pudo guardar la corrección.');}
        finally{setSaving(false);}
    };

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
    const changeTitle = periodDates?.incompleteSince && periodDates.endDate
        ? `Cambio ${activeTab==='YTD' ? 'YTD' : periodChange.label} hasta ${new Date(periodDates.endDate).toLocaleDateString('es-ES')}`
        : periodDates?.monthlyBase && periodDates.baseDate
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
        <div className="portfolio-summary tw:mb-ui-xl">
            <div className="portfolio-summary__header tw:ui-row tw:justify-between tw:mb-ui-lg tw:flex-wrap tw:gap-ui-md tw:[@media(max-width:640px)]:flex-col tw:[@media(max-width:640px)]:items-start">
                <h2 className="portfolio-summary__title tw:text-[length:var(--font-size-2xl)] tw:font-bold tw:text-main tw:m-0">Resumen del Portfolio</h2>
                <DashboardSegments appearance="summary" className="portfolio-summary__tabs" options={tabs.map(tab => ({ value: tab.key, label: tab.label }))} value={activeTab} onChange={onPeriodChange} />
            </div>
            {periodDates?.baseDate && <p className="portfolio-summary__dates tw:text-[.8rem] tw:text-secondary">Periodo efectivo{periodDates.monthlyBase ? ' con cierre mensual' : ''}: {new Date(periodDates.baseDate).toLocaleDateString('es-ES')} — {periodDates.endDate ? new Date(periodDates.endDate).toLocaleDateString('es-ES') : 'sin cierre'}.</p>}
            {periodDates?.incompleteSince && <div className="portfolio-summary__calculation tw:mt-[.5rem] tw:text-[.8rem] tw:text-secondary tw:leading-[1.5] tw:[&_summary]:cursor-pointer tw:[&_summary]:p-[.65rem_0] tw:[&_summary:focus-visible]:[outline:2px_solid_var(--accent-primary)] tw:[&_summary:focus-visible]:outline-offset-2 tw:[&_summary:focus-visible]:rounded-[var(--radius-sm)] tw:[&_p]:m-[.25rem_0_.5rem]"><DashboardInfo title="Periodo pendiente de completar" label={`${activeTab==='YTD' ? 'YTD' : 'Periodo'} pendiente de completar`}>
                <p>Datos pendientes de verificar desde {new Date(periodDates.incompleteSince).toLocaleDateString('es-ES')}. Se conserva el último tramo calculable.</p>
            </DashboardInfo></div>}
            {activeTab === '1D' && !Number.isFinite(periodChange.value) && <p className="portfolio-summary__dates tw:text-[.8rem] tw:text-secondary">La variación diaria necesita valoraciones comparables o precios de hoy con cierre anterior. En Mis Activos puedes ver la última variación disponible y su fecha.</p>}

            <div className="portfolio-summary__grid tw:grid tw:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] tw:gap-ui-md tw:[@media(max-width:640px)]:grid-cols-[1fr]">
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
                    title={metrics.resultEstimated ? 'Resultado realizado (estimado)' : 'Resultado realizado'}
                    value={Number.isFinite(metrics.realizedGain) ? formatCurrency(metrics.realizedGain!) : 'No disponible'}
                    icon={<TrendingUp size={20} />}
                />
                <MetricCard
                    title={estimatedCount || metrics.resultEstimated ? 'Resultado total (estimado)' : 'Resultado total'}
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
            {metrics.resultUnavailableReason && <div className="portfolio-summary__calculation tw:mt-[.5rem] tw:text-[.8rem] tw:text-secondary tw:leading-[1.5] tw:[&_summary]:cursor-pointer tw:[&_summary]:p-[.65rem_0] tw:[&_summary:focus-visible]:[outline:2px_solid_var(--accent-primary)] tw:[&_summary:focus-visible]:outline-offset-2 tw:[&_summary:focus-visible]:rounded-[var(--radius-sm)] tw:[&_p]:m-[.25rem_0_.5rem]"><DashboardInfo title="Resultados no disponibles" label="Realizado y total: ver motivo">
                <p>{metrics.resultUnavailableReason}</p>
                {metrics.deletionReviews?.filter(r => !r.discarded).map(r => <DashboardReviewRow key={r.id} labelAs="strong" label={<>{r.name}</>}>
                    {r.canDiscard && onCorrectDeletion ? <Button variant="secondary" disabled={saving} onClick={() => setReviewId(r.id)}>Era un registro erróneo</Button>
                        : <p>Este registro necesita revisar sus compras y ventas.</p>}
                    <p>Si lo vendiste, hace falta registrar la venta real con su fecha e importe.</p>
                </DashboardReviewRow>)}
            </DashboardInfo></div>}
            {metrics.deletionReviews?.some(r=>r.discarded) && <details className="portfolio-summary__calculation tw:mt-[.5rem] tw:text-[.8rem] tw:text-secondary tw:leading-[1.5] tw:[&_summary]:cursor-pointer tw:[&_summary]:p-[.65rem_0] tw:[&_summary:focus-visible]:[outline:2px_solid_var(--accent-primary)] tw:[&_summary:focus-visible]:outline-offset-2 tw:[&_summary:focus-visible]:rounded-[var(--radius-sm)] tw:[&_p]:m-[.25rem_0_.5rem]"><summary>Registros corregidos</summary>
                {metrics.deletionReviews.filter(r => r.discarded).map(r => <DashboardReviewRow key={r.id} labelAs="span" label={<>{r.name} · excluido del cálculo</>}>
                    {onCorrectDeletion && <Button variant="secondary" disabled={saving} onClick={() => void correct(r.id, false)}>Deshacer corrección</Button>}
                </DashboardReviewRow>)}
            </details>}
            {reviewError && <p role="alert">{reviewError}</p>}
            <ConfirmDialog isOpen={!!review} onClose={()=>{if(!saving)setReviewId(null);}} onConfirm={()=>{if(review)void correct(review.id,true);}} loading={saving}
                title="¿Era un registro erróneo?" message={`Confirma que ${review?.name ?? 'este registro'} se añadió por error y no fue una inversión real. Se excluirá de realizado y total. Sus movimientos se conservan y puedes deshacer esta corrección.`}
                confirmText="Confirmar corrección" variant="warning" />
        </div>
    );
}
