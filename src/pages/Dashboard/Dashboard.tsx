import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCw, Wallet, Feather, Loader2, Radio, Wrench, GraduationCap, Settings, FileSpreadsheet } from 'lucide-react';
import { PortfolioSummary } from '../../components/dashboard/PortfolioSummary';
import { Performers } from '../../components/dashboard/Performers';
import { AssetsTable } from '../../components/dashboard/AssetsTable';
import { PortfolioExcelInsights } from '../../components/dashboard/PortfolioExcelInsights';
import { LivePortfolioPlan } from '../../components/dashboard/LivePortfolioPlan';
import { PortfolioComposition } from '../../components/dashboard/PortfolioComposition';
import { AssetDetail } from '../../components/dashboard/AssetDetail';
import { UnderlyingAssetDetail } from '../../components/dashboard/UnderlyingAssetDetail';
import { Button, Card, CardContent, Modal, PageHeader } from '../../components/ui';
import { usePortfolio } from '../../context/PortfolioContext';
import { getHistory, isApiEnabled } from '../../services/storageService';
import type { PortfolioMetrics, PerformerData, Asset, AssetHolding } from '../../types/types';
import { buildPortfolioAnalyticsHistory, calculatePeriodPerformance, calculatePreviousClosePerformance, createQuoteSnapshot, getPeriodCutoff, normalizePortfolioTransactions, performanceSeries } from '../../services/portfolioPerformance';
import { readWorkbookHistory } from '../../services/portfolioWorkbookHistory';
import type { ConsolidatedPortfolioExposure } from '../../services/portfolioComposition';
import './Dashboard.css';
import { PRICE_REFRESH_INTERVAL_MS } from '../../constants/app';

const DAY_MS = 24 * 60 * 60 * 1000;
const DASHBOARD_CALCULATION_TICK_MS = 60 * 1000;
const DASHBOARD_NOTICE_STORAGE_KEY = 'freewallet-dashboard-notice-dismissed';

function hasDismissedDashboardNotice(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        return window.localStorage.getItem(DASHBOARD_NOTICE_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
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
    const [showDashboardNotice, setShowDashboardNotice] = useState(() => !hasDismissedDashboardNotice());
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
    const currentSnapshot = useMemo(
        () => createQuoteSnapshot(assets, portfolioTransactions, new Date(calculationNow).toISOString()),
        [assets, calculationNow, portfolioTransactions],
    );
    const workbookSeries = useMemo(
        () => usingWorkbookHistory
            ? performanceSeries(
                [...workbookHistory.points, ...(currentSnapshot ? [currentSnapshot] : [])],
                workbookHistory.flowTransactions,
                assets,
                {
                maxGapDays: workbookHistory.source === 'monthly' ? 45 : 16,
                },
            )
            : [],
        [assets, currentSnapshot, usingWorkbookHistory, workbookHistory],
    );
    const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) || null;

    const handleCloseDashboardNotice = () => {
        setShowDashboardNotice(false);
        try {
            window.localStorage.setItem(DASHBOARD_NOTICE_STORAGE_KEY, '1');
        } catch {
            // Ignore storage failures; the notice remains dismissed for this mount.
        }
    };

    const dashboardNoticeModal = (
        <Modal
            isOpen={showDashboardNotice}
            onClose={handleCloseDashboardNotice}
            size="md"
        >
            <div className="dashboard__notice dashboard__notice--hero">
                <div className="dashboard__notice-icon">
                    <Wrench size={44} />
                </div>
                <h2 className="dashboard__notice-title">Dashboard en desarrollo</h2>
                <p className="dashboard__notice-description">
                    Esta vista incorpora por ahora solo la funcionalidad básica. Los datos de los activos que introduzcas y las
                    gráficas pueden ser inexactos, incompletos o provisionales. Utiliza esta información como referencia y
                    comprueba los datos antes de tomar decisiones de inversión.
                </p>
                <div className="dashboard__notice-links">
                    <Link to="/academy" onClick={handleCloseDashboardNotice}>
                        <GraduationCap size={18} />
                        Academia
                    </Link>
                    <Link to="/settings" onClick={handleCloseDashboardNotice}>
                        <Settings size={18} />
                        Configuración
                    </Link>
                    <Link to="/portfolio-csv" onClick={handleCloseDashboardNotice}>
                        <FileSpreadsheet size={18} />
                        Portfolio
                    </Link>
                </div>
                <Button onClick={handleCloseDashboardNotice} size="lg" fullWidth>
                    Entendido
                </Button>
            </div>
        </Modal>
    );

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

        const liveSeries = performanceSeries(
            buildPortfolioAnalyticsHistory(getHistory(), portfolioTransactions, currentSnapshot || undefined, assets),
            portfolioTransactions,
            assets,
        );
        const historicalSeries = usingWorkbookHistory ? workbookSeries : liveSeries;
        const periodChange = (periodName: '1D' | '1M' | '3M' | 'YTD', source: ReturnType<typeof performanceSeries>, maxBaseGap: number) => {
            const cutoff = getPeriodCutoff(periodName, calculationNow);
            const period = calculatePeriodPerformance(source, cutoff ?? Number.NEGATIVE_INFINITY, calculationNow, maxBaseGap);
            return {
                hasBase: period.hasBase && period.returnPercent !== null,
                change: period.returnPercent === null ? NaN : period.change ?? NaN,
                percent: period.returnPercent ?? NaN,
            };
        };
        const historicalGap = usingWorkbookHistory && workbookHistory.source === 'monthly' ? 45 * DAY_MS : 4 * DAY_MS;
        const historicalDay = periodChange(
            '1D',
            liveSeries.length > 0 ? liveSeries : historicalSeries,
            4 * DAY_MS,
        );
        const previousClose = calculatePreviousClosePerformance(assets);
        const day = historicalDay.hasBase
            ? historicalDay
            : {
                hasBase: previousClose.change !== null,
                change: previousClose.change ?? NaN,
                percent: previousClose.returnPercent ?? NaN,
            };
        const month = periodChange('1M', historicalSeries, historicalGap);
        const quarter = periodChange('3M', historicalSeries, historicalGap);
        const ytd = periodChange('YTD', historicalSeries, historicalGap);

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
    }, [assets, calculationNow, currentSnapshot, portfolioTransactions, usingWorkbookHistory, workbookHistory, workbookSeries]);

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
            <>
                <div className="dashboard dashboard--loading">
                    <div className="skeleton skeleton--large" />
                    <div className="skeleton skeleton--medium" />
                    <div className="skeleton skeleton--medium" />
                </div>
                {dashboardNoticeModal}
            </>
        );
    }

    if (assets.length === 0) {
        return (
            <>
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
                {dashboardNoticeModal}
            </>
        );
    }

    return (
        <div className="dashboard">
            <PageHeader className="dashboard__header" eyebrow="Cartera">
                <div className="dashboard__header-content">
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
            </PageHeader>

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
                <PortfolioExcelInsights now={calculationNow} />
            </section>

            <section className="dashboard__section dashboard__performers">
                <Performers data={performersData} type="best" />
                <Performers data={performersData} type="worst" />
            </section>

            <section className="dashboard__section">
                <PortfolioComposition
                    assets={assets}
                    onAssetClick={handleViewDetails}
                    onHoldingClick={handleViewHolding}
                />
            </section>

            <section className="dashboard__section">
                <LivePortfolioPlan now={calculationNow} section="monthly" />
            </section>
            <section className="dashboard__section">
                <LivePortfolioPlan now={calculationNow} section="recent" />
            </section>
            <section className="dashboard__section">
                <LivePortfolioPlan now={calculationNow} section="plan" />
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
                {selectedHolding ? (
                    <UnderlyingAssetDetail
                        holding={selectedHolding.holding}
                        parentAsset={selectedHolding.parentAsset}
                        exposure={selectedHolding.exposure}
                    />
                ) : selectedAsset ? (
                    <AssetDetail asset={selectedAsset} portfolioValue={metrics.currentValue} />
                ) : null}
            </Modal>
            {dashboardNoticeModal}
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
