import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCw, Wallet, Feather, Loader2, Radio } from 'lucide-react';
import { PortfolioSummary } from '../../components/dashboard/PortfolioSummary';
import { Performers } from '../../components/dashboard/Performers';
import { AssetsTable } from '../../components/dashboard/AssetsTable';
import { Button, Card, CardContent, Modal } from '../../components/ui';
import { usePortfolio } from '../../context/PortfolioContext';
import { getHistory, isApiEnabled } from '../../services/storageService';
import type { PortfolioMetrics, PerformerData, Asset, AssetHolding } from '../../types/types';
import { buildPortfolioAnalyticsHistory, calculatePeriodPerformance, createQuoteSnapshot, normalizePortfolioTransactions, performanceSeries } from '../../services/portfolioPerformance';
import { readWorkbookHistory } from '../../services/portfolioWorkbookHistory';
import type { ConsolidatedPortfolioExposure } from '../../services/portfolioComposition';
import './Dashboard.css';
import { PRICE_REFRESH_INTERVAL_MS } from '../../constants/app';

const DAY_MS = 24 * 60 * 60 * 1000;
const DASHBOARD_CALCULATION_TICK_MS = 60 * 1000;

// Keep the first Dashboard bundle focused on the summary and positions. The
// analysis panels and their charting dependencies are loaded asynchronously.
const PortfolioExcelInsights = lazy(() => import('../../components/dashboard/PortfolioExcelInsights').then(({ PortfolioExcelInsights: component }) => ({ default: component })));
const LivePortfolioPlan = lazy(() => import('../../components/dashboard/LivePortfolioPlan').then(({ LivePortfolioPlan: component }) => ({ default: component })));
const PortfolioComposition = lazy(() => import('../../components/dashboard/PortfolioComposition').then(({ PortfolioComposition: component }) => ({ default: component })));
const AssetDetail = lazy(() => import('../../components/dashboard/AssetDetail').then(({ AssetDetail: component }) => ({ default: component })));
const UnderlyingAssetDetail = lazy(() => import('../../components/dashboard/UnderlyingAssetDetail').then(({ UnderlyingAssetDetail: component }) => ({ default: component })));

function DashboardSectionFallback({ label, minHeight = 96 }: { label: string; minHeight?: number }) {
    return (
        <div className="dashboard__deferred-fallback" style={{ minHeight }} role="status" aria-live="polite">
            <Loader2 size={17} className="spinning" />
            <span>{label}</span>
        </div>
    );
}

function DeferredDashboardSection({
    children,
    label,
    minHeight,
}: {
    children: ReactNode;
    label: string;
    minHeight: number;
}) {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (shouldRender) return undefined;
        const section = sectionRef.current;
        if (!section) return undefined;

        let activated = false;
        const observer = 'IntersectionObserver' in window
            ? new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting)) activate();
            }, { rootMargin: '600px 0px' })
            : null;
        const activate = () => {
            if (activated) return;
            activated = true;
            observer?.disconnect();
            setShouldRender(true);
        };

        observer?.observe(section);
        // Render during idle time even if the browser has no IntersectionObserver
        // (or the user never scrolls), while keeping the critical first paint light.
        const fallbackTimer = window.setTimeout(activate, 1500);

        return () => {
            observer?.disconnect();
            window.clearTimeout(fallbackTimer);
        };
    }, [shouldRender]);

    return (
        <div ref={sectionRef} className="dashboard__deferred-section">
            {shouldRender ? (
                <Suspense fallback={<DashboardSectionFallback label={label} minHeight={minHeight} />}>
                    {children}
                </Suspense>
            ) : (
                <DashboardSectionFallback label={label} minHeight={minHeight} />
            )}
        </div>
    );
}

function DashboardLiveStatus({
    apiEnabled,
    updatingPrices,
    lastPriceUpdate,
}: {
    apiEnabled: boolean;
    updatingPrices: boolean;
    lastPriceUpdate: Date | null;
}) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const update = () => {
            if (document.visibilityState === 'visible') setNow(Date.now());
        };
        const intervalId = window.setInterval(update, 1000);
        document.addEventListener('visibilitychange', update);
        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener('visibilitychange', update);
        };
    }, []);

    if (!apiEnabled) {
        return <span className="dashboard__live-status"><Radio size={13} /> Auto desactivada</span>;
    }

    const nextRefreshSeconds = lastPriceUpdate
        ? Math.max(0, Math.ceil((lastPriceUpdate.getTime() + PRICE_REFRESH_INTERVAL_MS - now) / 1000))
        : null;
    const countdownLabel = nextRefreshSeconds === null
        ? 'preparando…'
        : `en ${String(Math.floor(nextRefreshSeconds / 60)).padStart(2, '0')}:${String(nextRefreshSeconds % 60).padStart(2, '0')}`;
    const refreshIntervalMinutes = Math.max(1, Math.round(PRICE_REFRESH_INTERVAL_MS / 60000));

    return (
        <span className="dashboard__live-status dashboard__live-status--active">
            <Radio size={13} /> Auto · {refreshIntervalMinutes} min · {updatingPrices ? 'actualizando…' : countdownLabel}
        </span>
    );
}

export function Dashboard() {
    const { state, refreshPrices, deleteAsset, loadDemoData } = usePortfolio();
    const { assets, loading, updatingPrices, lastPriceUpdate } = state;
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [selectedHolding, setSelectedHolding] = useState<{
        holding: AssetHolding;
        parentAsset: Asset;
        exposure?: ConsolidatedPortfolioExposure;
    } | null>(null);
    // Expensive portfolio calculations do not need a one-second clock. Keep
    // the live countdown isolated in DashboardLiveStatus below.
    const [calculationNow, setCalculationNow] = useState(() => Date.now());
    const navigate = useNavigate();
    const apiEnabled = isApiEnabled();
    const workbookHistory = useMemo(() => readWorkbookHistory(), []);
    const usingWorkbookHistory = workbookHistory.points.length >= 2;
    const portfolioTransactions = useMemo(
        () => normalizePortfolioTransactions(assets, state.transactions),
        [assets, state.transactions],
    );
    const workbookSeries = useMemo(
        () => usingWorkbookHistory
            ? performanceSeries(workbookHistory.points, workbookHistory.flowTransactions, assets, {
                maxGapDays: workbookHistory.source === 'monthly' ? 45 : 16,
            })
            : [],
        [assets, usingWorkbookHistory, workbookHistory],
    );
    const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) || null;

    useEffect(() => {
        const update = () => {
            if (document.visibilityState === 'visible') setCalculationNow(Date.now());
        };
        const intervalId = window.setInterval(update, DASHBOARD_CALCULATION_TICK_MS);
        document.addEventListener('visibilitychange', update);
        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener('visibilitychange', update);
        };
    }, []);

    const handleEditAsset = useCallback((asset: Asset) => {
        navigate('/add', { state: { editAsset: asset } });
    }, [navigate]);

    const handleAddPurchase = useCallback((asset: Asset) => {
        navigate('/add', { state: { dcaAsset: asset } });
    }, [navigate]);

    const handleSell = useCallback((asset: Asset) => {
        navigate('/add', { state: { sellAsset: asset } });
    }, [navigate]);

    const handleViewDetails = useCallback((asset: Asset) => {
        setSelectedHolding(null);
        setSelectedAssetId(asset.id);
    }, []);

    const handleViewHolding = useCallback((holding: AssetHolding, parentAsset: Asset, exposure?: ConsolidatedPortfolioExposure) => {
        setSelectedAssetId(null);
        setSelectedHolding({ holding, parentAsset, exposure });
    }, []);

    const metrics: PortfolioMetrics = useMemo(() => {
        const totalInvested = assets.reduce((sum, a) => sum + a.purchasePrice * a.quantity, 0);
        const currentValue = assets.reduce(
            (sum, a) => sum + (a.currentPrice || a.purchasePrice) * a.quantity,
            0
        );
        const totalGain = currentValue - totalInvested;
        const percentageGain = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

        const liveSeries = usingWorkbookHistory ? [] : performanceSeries(
            buildPortfolioAnalyticsHistory(
                getHistory(),
                portfolioTransactions,
                createQuoteSnapshot(assets, portfolioTransactions, new Date(calculationNow).toISOString()) || undefined,
                assets,
            ),
            portfolioTransactions,
            assets,
        );
        const historicalSeries = usingWorkbookHistory ? workbookSeries : liveSeries;
        const periodChange = (timestamp: number, series: ReturnType<typeof performanceSeries>, maxBaseGap: number) => {
            const period = calculatePeriodPerformance(series, timestamp, calculationNow, maxBaseGap);
            return {
                hasBase: period.hasBase && period.returnPercent !== null,
                change: period.returnPercent === null ? NaN : period.change ?? NaN,
                percent: period.returnPercent ?? NaN,
            };
        };
        const todayStart = new Date(calculationNow);
        todayStart.setHours(0, 0, 0, 0);
        const monthStart = new Date(calculationNow);
        const monthDay = monthStart.getDate();
        monthStart.setDate(1);
        monthStart.setMonth(monthStart.getMonth() - 1);
        monthStart.setDate(Math.min(monthDay, new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()));
        const quarterStart = new Date(calculationNow);
        const quarterDay = quarterStart.getDate();
        quarterStart.setDate(1);
        quarterStart.setMonth(quarterStart.getMonth() - 3);
        quarterStart.setDate(Math.min(quarterDay, new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 1, 0).getDate()));
        const historicalGap = usingWorkbookHistory && workbookHistory.source === 'monthly' ? 45 * DAY_MS : 4 * DAY_MS;
        const day = periodChange(todayStart.getTime() - 1, liveSeries, 4 * DAY_MS);
        const month = periodChange(monthStart.getTime(), historicalSeries, historicalGap);
        const quarter = periodChange(quarterStart.getTime(), historicalSeries, historicalGap);
        const ytdStart = new Date(new Date(calculationNow).getFullYear(), 0, 1).getTime();
        const ytd = periodChange(ytdStart, historicalSeries, historicalGap);

        return {
            totalInvested,
            currentValue,
            totalGain,
            percentageGain,
            dailyChange: day.change,
            dailyChangePercent: day.percent,
            monthlyChange: month.change,
            monthlyChangePercent: month.percent,
            threeMonthChange: quarter.change,
            threeMonthChangePercent: quarter.percent,
            ytdChange: ytd.change,
            ytdChangePercent: ytd.percent,
        };
    }, [assets, calculationNow, portfolioTransactions, usingWorkbookHistory, workbookHistory, workbookSeries]);

    const performersData: PerformerData[] = useMemo(() => {
        return assets.map((asset) => {
            const currentValue = (asset.currentPrice || asset.purchasePrice) * asset.quantity;
            const investedValue = asset.purchasePrice * asset.quantity;
            const change = currentValue - investedValue;
            const changePercent = investedValue > 0 ? (change / investedValue) * 100 : 0;

            return {
                id: asset.id,
                symbol: asset.symbol,
                name: asset.name,
                change,
                changePercent,
                value: currentValue,
            };
        });
    }, [assets]);

    if (loading) {
        return (
            <div className="dashboard dashboard--loading">
                    <div className="skeleton skeleton--large" />
                    <div className="skeleton skeleton--medium" />
                    <div className="skeleton skeleton--medium" />
            </div>
        );
    }

    if (assets.length === 0) {
        return (
            <div className="dashboard dashboard--empty">
                    <Card className="dashboard__welcome">
                        <CardContent>
                            <div className="welcome-content">
                                <div className="welcome-content__icons">
                                    <Wallet className="welcome-content__icon" size={64} />
                                    <Feather className="welcome-content__icon-feather" size={32} />
                                </div>
                                <h1 className="welcome-content__title">Bienvenido a FreeWallet</h1>
                                <p className="welcome-content__description">
                                    Empieza por la academia para entender conceptos, practicar con simuladores y tomar mejores decisiones
                                    antes de mover capital real. Después puedes añadir tu primera inversión o cargar datos demo para explorar
                                    el dashboard completo.
                                </p>
                                <div className="welcome-content__actions">
                                    <Link to="/add">
                                        <Button icon={<PlusCircle size={18} />} size="lg" fullWidth>
                                            Añadir primera inversión
                                        </Button>
                                    </Link>
                                    <Button variant="secondary" onClick={loadDemoData} icon={<RefreshCw size={18} />} size="lg" fullWidth>
                                        Cargar Datos Demo
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard__header">
                <div>
                    <h1 className="dashboard__title">Dashboard</h1>
                    <p className="dashboard__subtitle">
                        Seguimiento automático de tu cartera
                        {lastPriceUpdate && (
                            <span className="dashboard__last-update">
                                · Actualizado: {lastPriceUpdate.toLocaleTimeString()}
                            </span>
                        )}
                    </p>
                    <DashboardLiveStatus
                        apiEnabled={apiEnabled}
                        updatingPrices={updatingPrices}
                        lastPriceUpdate={lastPriceUpdate}
                    />
                </div>
            </div>

            {updatingPrices && (
                <div className="dashboard__updating-banner">
                    <Loader2 size={16} className="spinning" />
                    <span>Obteniendo precios en tiempo real...</span>
                </div>
            )}

            <PortfolioSummary metrics={metrics} />
            <section className="dashboard__section">
                <AssetsTable
                    assets={assets}
                    onDelete={deleteAsset}
                    onEdit={handleEditAsset}
                    onAddPurchase={handleAddPurchase}
                    onSell={handleSell}
                    onViewDetails={handleViewDetails}
                />
            </section>
            <section className="dashboard__section">
                <DeferredDashboardSection label="Preparando análisis avanzado…" minHeight={360}>
                    <PortfolioExcelInsights now={calculationNow} />
                </DeferredDashboardSection>
            </section>
            <section className="dashboard__section">
                <DeferredDashboardSection label="Preparando plan de cartera…" minHeight={360}>
                    <LivePortfolioPlan now={calculationNow} />
                </DeferredDashboardSection>
            </section>

            <section className="dashboard__section dashboard__performers">
                <Performers data={performersData} type="best" />
                <Performers data={performersData} type="worst" />
            </section>

            <section className="dashboard__section">
                <DeferredDashboardSection label="Preparando composición del portfolio…" minHeight={360}>
                    <PortfolioComposition
                        assets={assets}
                        onAssetClick={handleViewDetails}
                        onHoldingClick={handleViewHolding}
                    />
                </DeferredDashboardSection>
            </section>

            <Modal
                isOpen={selectedAsset !== null || selectedHolding !== null}
                onClose={() => {
                    setSelectedAssetId(null);
                    setSelectedHolding(null);
                }}
                title={selectedHolding ? `Detalles de ${selectedHolding.holding.name}` : selectedAsset ? `Detalles de ${selectedAsset.symbol}` : ''}
                size="lg"
            >
                <Suspense fallback={<DashboardSectionFallback label="Cargando ficha del activo…" />}>
                    {selectedHolding ? (
                        <UnderlyingAssetDetail
                            holding={selectedHolding.holding}
                            parentAsset={selectedHolding.parentAsset}
                            exposure={selectedHolding.exposure}
                        />
                    ) : selectedAsset ? (
                        <AssetDetail asset={selectedAsset} portfolioValue={metrics.currentValue} />
                    ) : null}
                </Suspense>
            </Modal>
            <div className="dashboard__floating-actions" aria-label="Acciones de cartera">
                <Button
                    variant="secondary"
                    onClick={refreshPrices}
                    icon={updatingPrices ? <Loader2 size={18} className="spinning" /> : <RefreshCw size={18} />}
                    size="sm"
                    className="dashboard__floating-refresh"
                    disabled={updatingPrices || !apiEnabled}
                    aria-label={!apiEnabled ? 'APIs desactivadas' : updatingPrices ? 'Actualizando precios' : 'Actualizar precios'}
                    title={!apiEnabled ? 'APIs desactivadas' : updatingPrices ? 'Actualizando precios' : 'Actualizar precios'}
                />
                <Link className="dashboard__floating-add" to="/add" aria-label="Añadir inversión" title="Añadir inversión">
                    <PlusCircle size={25} strokeWidth={2.4} />
                </Link>
            </div>
        </div>
    );
}
