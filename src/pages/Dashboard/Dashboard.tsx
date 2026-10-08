import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { PlusCircle, RefreshCw, Wallet, Feather, Loader2, Radio, Wrench, GraduationCap, Settings, FileSpreadsheet } from 'lucide-react';
import { PortfolioSummary } from '../../components/dashboard/PortfolioSummary';
import { PortfolioDataQuality } from '../../components/dashboard/PortfolioDataQuality';
import { Performers } from '../../components/dashboard/Performers';
import { AssetsTable } from '../../components/dashboard/AssetsTable';
import type { AssetsTableViewState } from '../../components/dashboard/AssetsTable';
import type { DashboardNavigationContext } from '../../components/layout/MainLayout/dashboardNavigation';
import { PortfolioExcelInsights } from '../../components/dashboard/PortfolioExcelInsights';
import { LivePortfolioPlan } from '../../components/dashboard/LivePortfolioPlan';
import { PortfolioComposition } from '../../components/dashboard/PortfolioComposition';
import { AssetDetail } from '../../components/dashboard/AssetDetail';
import { UnderlyingAssetDetail } from '../../components/dashboard/UnderlyingAssetDetail';
import { Button, Card, CardContent, Modal, PageHeader } from '../../components/ui';
import { usePortfolio } from '../../context/PortfolioContext';
import { isApiEnabled } from '../../services/storageService';
import type { PortfolioMetrics, PerformerData, Asset, AssetHolding, TimePeriod } from '../../types/types';
import { calculatePreviousClosePerformance, selectPortfolioPeriod, accountingDay } from '../../services/portfolioPerformance';
import { calculatePortfolioResults } from '../../services/portfolioResults';
import { hasValidPrice } from '../../services/assetValuation';
import { useLocalDataVersion } from '../../hooks/useLocalDataVersion';
import { useDashboardAnalytics } from '../../components/dashboard/useDashboardAnalytics';
import type { performanceSeries } from '../../services/portfolioPerformance';
import type { ConsolidatedPortfolioExposure } from '../../services/portfolioComposition';
import { resolveLiveUnderlyingSelection } from '../../services/portfolioComposition';
import { portfolioQuoteStatus, quoteDateLabel } from '../../services/portfolioQuoteStatus';
import './Dashboard.css';
import { hasCurrentDayQuotes } from '../../services/dashboardIntegrity';
import {useAccount} from '../../context/AccountContext';
import { portfolioPositionGroups } from '../../services/portfolioPositionGroups';

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
    lastRefreshAttempt,
    lastReadAt,
    lastConsultedAt,
}: {
    apiEnabled: boolean;
    updatingPrices: boolean;
    lastRefreshAttempt: Date | null;
    lastReadAt?: string;
    lastConsultedAt?: string;
}) {
    return (
        <details className="dashboard__update-details">
            <summary>
                <span className={`dashboard__live-status${apiEnabled || updatingPrices ? ' dashboard__live-status--active' : ''}`}>
                    <Radio size={13} aria-hidden="true" />
                    {updatingPrices ? 'Consultando…' : apiEnabled ? 'Seguimiento activo' : 'Consultas desactivadas'}
                </span>
            </summary>
            <dl className="dashboard__update-info">
                <dt>Acciones y criptos</dt><dd>{apiEnabled ? 'Cada minuto en esta pantalla · acciones en sesión' : 'Desactivadas'}</dd>
                <dt>Fondos y otros activos</dt><dd>{apiEnabled ? 'Cada 5 min; según el último dato publicado' : 'Desactivadas'}</dd>
                {lastRefreshAttempt && <><dt>Último intento de consulta</dt><dd>{quoteDateLabel(lastRefreshAttempt.toISOString())}</dd></>}
                {lastReadAt && <><dt>Última lectura en la app</dt><dd>{quoteDateLabel(lastReadAt)}</dd></>}
                {lastConsultedAt && <><dt>Última consulta al proveedor</dt><dd>{quoteDateLabel(lastConsultedAt)}</dd></>}
            </dl>
        </details>
    );
}

export function Dashboard() {
    useLocalDataVersion();
    const location = useLocation();
    const { dashboardReturn, setDashboardReturn } = useOutletContext<DashboardNavigationContext>();
    const [returnSnapshot] = useState(() => dashboardReturn?.key === location.key ? dashboardReturn : null);
    const [dashboardPeriod, setDashboardPeriod] = useState<TimePeriod>(returnSnapshot?.period ?? 'ALL');
    const tableViewState = useRef(returnSnapshot?.table);
    const scrollRestored = useRef(false);
    const rememberTableView = useCallback((view: AssetsTableViewState) => { tableViewState.current = view; }, []);
    const { state, refreshPrices, deleteAsset, loadDemoData } = usePortfolio();
    const account=useAccount();
    const { assets, loading, updatingPrices, quoteFailures } = state;
    useLayoutEffect(() => {
        if (loading || !returnSnapshot || scrollRestored.current) return;
        // Restore after the actual table (including expanded records) has mounted.
        window.scrollTo({ left: returnSnapshot.scrollX, top: returnSnapshot.scrollY, behavior: 'instant' });
        scrollRestored.current = true;
    }, [loading, returnSnapshot]);
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [selectedHolding, setSelectedHolding] = useState<{
        holding: AssetHolding;
        parentAsset: Asset;
        exposure?: ConsolidatedPortfolioExposure;
    } | null>(null);
    const [showDashboardNotice, setShowDashboardNotice] = useState(() => !hasDismissedDashboardNotice());
    // Recalculate metrics independently of the quote consultation controls.
    const [calculationNow, setCalculationNow] = useState(() => Date.now());
    const navigate = useNavigate();
    const apiEnabled = isApiEnabled();
    const analytics = useDashboardAnalytics(calculationNow);
    const { series: historicalSeries, liveSeries } = analytics;
    const positionGroups=useMemo(()=>portfolioPositionGroups(assets,calculationNow),[assets,calculationNow]);
    const selectedGroup=positionGroups.find(group=>group.lots.length>1 && group.asset.id===selectedAssetId);
    const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) || selectedGroup?.asset || null;
    const quoteStatuses = useMemo(() => assets.map(asset => ({ asset, ...portfolioQuoteStatus(asset, calculationNow) })), [assets, calculationNow]);
    const consultationTimes = quoteStatuses.map(s => s.checkedAt).filter(t => Number.isFinite(t) && t <= calculationNow + 5 * 60000);
    const lastConsultedAt = consultationTimes.length ? new Date(Math.max(...consultationTimes)).toISOString() : undefined;
    const readTimes = assets.map(a => Date.parse(a.lastReadAt || '')).filter(t => Number.isFinite(t) && t <= calculationNow + 5 * 60000);
    const lastReadAt = readTimes.length ? new Date(Math.max(...readTimes)).toISOString() : undefined;

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

    const openOperation = useCallback((mode: 'editAsset' | 'dcaAsset' | 'sellAsset', asset: Asset) => {
        setDashboardReturn({ key: location.key, scrollX: window.scrollX, scrollY: window.scrollY, period: dashboardPeriod, table: tableViewState.current });
        navigate('/add', { state: { [mode]: asset, dashboardReturnKey: location.key } });
    }, [navigate, setDashboardReturn, location.key, dashboardPeriod]);

    const handleEditAsset = useCallback((asset: Asset) => {
        openOperation('editAsset', asset);
    }, [openOperation]);

    const handleAddPurchase = useCallback((asset: Asset) => {
        openOperation('dcaAsset', asset);
    }, [openOperation]);

    const handleSell = useCallback((asset: Asset) => {
        openOperation('sellAsset', asset);
    }, [openOperation]);

    const handleViewDetails = useCallback((asset: Asset) => {
        setSelectedHolding(null);
        setSelectedAssetId(asset.id);
    }, []);

    const handleViewHolding = useCallback((holding: AssetHolding, parentAsset: Asset, exposure?: ConsolidatedPortfolioExposure) => {
        setSelectedAssetId(null);
        setSelectedHolding({ holding, parentAsset, exposure });
    }, []);
    const handleExposuresChange = useCallback((exposures: ConsolidatedPortfolioExposure[]) => {
        setSelectedHolding(previous => resolveLiveUnderlyingSelection(previous, assets, exposures));
    }, [assets]);

    const metrics: PortfolioMetrics = useMemo(() => {
        const results = calculatePortfolioResults(assets, analytics.portfolioTransactions, calculationNow);

        const periodChange = (periodName: TimePeriod, source: ReturnType<typeof performanceSeries>) => {
            const { performance: period, monthlyBase, incompleteSince } = selectPortfolioPeriod(source, periodName, calculationNow);
            return {
                baseDate: period.baseDate, endDate: period.endDate,
                monthlyBase,
                incompleteSince,
                hasBase: period.hasBase && period.returnPercent !== null,
                change: period.returnPercent === null ? NaN : period.change ?? NaN,
                percent: period.returnPercent ?? NaN,
            };
        };
        const liveDay = periodChange('1D', liveSeries);
        const historicalDay = liveDay.hasBase ? liveDay : periodChange('1D', historicalSeries);
        const changedToday = analytics.portfolioTransactions.some(t => t.date?.slice(0, 10) === accountingDay(calculationNow) && t.provenance !== 'initial-position' && !/^(position|bootstrap)-/.test(t.id));
        const previousClose = changedToday || !hasCurrentDayQuotes(assets, calculationNow) ? { change: null, returnPercent: null } : calculatePreviousClosePerformance(assets);
        const day = historicalDay.hasBase
            ? historicalDay
            : {
                hasBase: previousClose.change !== null,
                change: previousClose.change ?? NaN,
                percent: previousClose.returnPercent ?? NaN,
            };
        const week = periodChange('7D', historicalSeries);
        const month = periodChange('1M', historicalSeries);
        const quarter = periodChange('3M', historicalSeries);
        const ytd = periodChange('YTD', historicalSeries);
        const all = periodChange('ALL', historicalSeries);

        return {
            ...results,
            dailyChange: day.change,
            dailyChangePercent: day.percent,
            monthlyChange: month.change,
            monthlyChangePercent: month.percent,
            threeMonthChange: quarter.change,
            threeMonthChangePercent: quarter.percent,
            ytdChange: ytd.change,
            ytdChangePercent: ytd.percent,
            weeklyChange: week.change, weeklyChangePercent: week.percent,
            historyChange: all.change, historyChangePercent: all.percent,
            periodDates: { '1D': historicalDay, '7D': week, '1M': month, '3M': quarter, YTD: ytd, ALL: all },
        };
    }, [assets, calculationNow, historicalSeries, liveSeries, analytics.portfolioTransactions]);

    const performersData: PerformerData[] = useMemo(() => {
        return positionGroups.filter(group=>group.estimatedCount===0 && group.investedValue>0 && group.asset.quantity>0).map((group) => {
            const {asset,currentValue,investedValue}=group;
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
    }, [positionGroups]);

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

    if (assets.length === 0 && historicalSeries.length === 0 && analytics.portfolioTransactions.length === 0) {
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
                                    <Button variant="secondary" onClick={loadDemoData} disabled={!!account.user} icon={<RefreshCw size={18} />} size="lg" fullWidth>
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
                    <DashboardLiveStatus
                        apiEnabled={apiEnabled}
                        updatingPrices={updatingPrices}
                        lastRefreshAttempt={state.lastRefreshAttempt}
                        lastReadAt={lastReadAt}
                        lastConsultedAt={lastConsultedAt}
                    />
                </div>
            </PageHeader>

            {updatingPrices && (
                <div className="dashboard__updating-banner">
                    <Loader2 size={16} className="spinning" />
                    <span>Consultando precios disponibles...</span>
                </div>
            )}

            <PortfolioSummary metrics={metrics} period={dashboardPeriod} onPeriodChange={setDashboardPeriod} estimatedCount={assets.filter(a => !hasValidPrice(a)).length} />
            <PortfolioDataQuality assets={assets} now={calculationNow} quoteFailures={quoteFailures} />
            {account.user && <p className="dashboard__automatic-status" role="status">
                {analytics.historyError || analytics.dailyMarket.error || (analytics.dailyMarket.data?.lastRun
                    ? `${analytics.dailyMarket.data.lastRun.status === 'success' ? 'Consulta automática' : analytics.dailyMarket.data.lastRun.status === 'running' ? 'Consulta automática en curso' : 'Consulta automática incompleta'} · ${new Date(analytics.dailyMarket.data.lastRun.finishedAt || analytics.dailyMarket.data.lastRun.startedAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                    : 'El histórico diario comenzará con la primera actualización programada.')}
                {!!analytics.dailyMarket.data?.lastRun?.failures.length && ` ${analytics.dailyMarket.data.lastRun.failures.length} consultas de cartera o benchmark pendientes.`}
                {analytics.dailyMarket.data?.health?.attentionRequired && ' La actualización requiere revisión; se conservan los últimos precios válidos.'}
                {analytics.dailyMarket.data?.snapshotStatus && !['captured','empty'].includes(analytics.dailyMarket.data.snapshotStatus) && ' La valoración diaria de esta cartera quedó pendiente.'}
            </p>}
            {account.user && !!analytics.dailyMarket.data?.snapshots.length && <details className="dashboard__update-details">
                <summary>Sobre las valoraciones diarias</summary>
                <p>Última valoración disponible del día, con precios y NAV de distintas fechas. No representa un cierre oficial de mercado.</p>
            </details>}
            <section className="dashboard__section">
                <AssetsTable
                    initialViewState={returnSnapshot?.table}
                    onViewStateChange={rememberTableView}
                    now={calculationNow}
                    assets={assets}
                    onDelete={deleteAsset}
                    onEdit={handleEditAsset}
                    onAddPurchase={handleAddPurchase}
                    onSell={handleSell}
                    onViewDetails={handleViewDetails}
                />
            </section>
            <section className="dashboard__section">
                <PortfolioExcelInsights now={calculationNow} analytics={analytics} period={dashboardPeriod} onPeriodChange={setDashboardPeriod} />
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
                    onExposuresChange={handleExposuresChange}
                />
            </section>

            <section className="dashboard__section">
                <LivePortfolioPlan analytics={analytics} section="monthly" />
            </section>
            <section className="dashboard__section">
                <LivePortfolioPlan analytics={analytics} section="recent" />
            </section>
            <section className="dashboard__section">
                <LivePortfolioPlan analytics={analytics} section="plan" />
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
                    <AssetDetail asset={selectedAsset} portfolioValue={metrics.currentValue} positionLots={selectedGroup?.lots} />
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
                    aria-label={!apiEnabled ? 'Consultas desactivadas' : updatingPrices ? 'Consultando precios' : 'Consultar precios ahora'}
                    title={!apiEnabled ? 'Consultas desactivadas' : updatingPrices ? 'Consultando precios' : 'Consultar precios ahora'}
                />
                <Link className="dashboard__floating-add" to="/add" aria-label="Añadir inversión" title="Añadir inversión">
                    <PlusCircle size={25} strokeWidth={2.4} />
                </Link>
            </div>
        </div>
    );
}
