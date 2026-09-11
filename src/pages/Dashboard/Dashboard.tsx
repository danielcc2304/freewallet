import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCw, Wallet, Feather, Loader2, Radio } from 'lucide-react';
import { PortfolioSummary, Performers, AssetsTable, PortfolioComposition, AssetDetail } from '../../components/dashboard';
import { Button, Card, CardContent, Modal } from '../../components/ui';
import { usePortfolio } from '../../context/PortfolioContext';
import { getHistory, isApiEnabled } from '../../services/storageService';
import type { PortfolioMetrics, PerformerData, Asset } from '../../types/types';
import { buildPortfolioAnalyticsHistory, getTransactionEventDay } from '../../services/portfolioPerformance';
import './Dashboard.css';
import { LivePortfolioPlan } from '../../components/dashboard/LivePortfolioPlan';
import { PortfolioExcelInsights } from '../../components/dashboard/PortfolioExcelInsights';
import { PRICE_REFRESH_INTERVAL_MS } from '../../constants/app';

export function Dashboard() {
    const { state, refreshPrices, deleteAsset, loadDemoData } = usePortfolio();
    const { assets, loading, updatingPrices, lastPriceUpdate } = state;
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [countdownNow, setCountdownNow] = useState(() => Date.now());
    const navigate = useNavigate();
    const apiEnabled = isApiEnabled();
    const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) || null;

    useEffect(() => {
        const intervalId = window.setInterval(() => setCountdownNow(Date.now()), 1000);
        return () => window.clearInterval(intervalId);
    }, []);

    const nextRefreshSeconds = lastPriceUpdate
        ? Math.max(0, Math.ceil((lastPriceUpdate.getTime() + PRICE_REFRESH_INTERVAL_MS - countdownNow) / 1000))
        : null;
    const countdownLabel = nextRefreshSeconds === null
        ? 'preparando…'
        : `en ${String(Math.floor(nextRefreshSeconds / 60)).padStart(2, '0')}:${String(nextRefreshSeconds % 60).padStart(2, '0')}`;

    const handleEditAsset = (asset: Asset) => {
        navigate('/add', { state: { editAsset: asset } });
    };

    const handleAddPurchase = (asset: Asset) => {
        navigate('/add', { state: { dcaAsset: asset } });
    };

    const handleSell = (asset: Asset) => {
        navigate('/add', { state: { sellAsset: asset } });
    };

    const metrics: PortfolioMetrics = useMemo(() => {
        const totalInvested = assets.reduce((sum, a) => sum + a.purchasePrice * a.quantity, 0);
        const currentValue = assets.reduce(
            (sum, a) => sum + (a.currentPrice || a.purchasePrice) * a.quantity,
            0
        );
        const totalGain = currentValue - totalInvested;
        const percentageGain = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

        const dailyChange = assets.reduce((sum, a) => {
            const prevValue = (a.previousClose || a.purchasePrice) * a.quantity;
            const currValue = (a.currentPrice || a.purchasePrice) * a.quantity;
            return sum + (currValue - prevValue);
        }, 0);
        const activeAssetIds = new Set(assets.map((asset) => asset.id));
        const portfolioTransactions = state.transactions.filter((transaction) => activeAssetIds.has(transaction.assetId));

        const history = buildPortfolioAnalyticsHistory(getHistory(), portfolioTransactions, {
            date: new Date(countdownNow).toISOString(),
            value: currentValue,
            invested: totalInvested,
        });
        const valueAtOrBefore = (timestamp: number) => {
            const point = [...history].reverse().find((item) => new Date(item.date).getTime() <= timestamp);
            return point;
        };
        const periodChange = (timestamp: number) => {
            const base = valueAtOrBefore(timestamp);
            const previousValue = base?.value;
            const baseDay = base?.date.slice(0, 10) || '';
            const operations = portfolioTransactions.filter(t => {
                const eventDay = getTransactionEventDay(t);
                return Boolean(base) && eventDay > baseDay && new Date(`${eventDay}T23:59:59.999Z`).getTime() <= countdownNow;
            });
            const flow = operations.reduce((sum, t) => sum + (t.type === 'buy' ? t.total || 0 : t.type === 'sell' ? -(t.total || 0) : 0), 0);
            const valid = previousValue !== undefined && !operations.some(t => t.type === 'edit' || t.type === 'delete');
            const change = valid ? currentValue - previousValue - flow : NaN;
            return {
                hasBase: previousValue !== undefined,
                change,
                percent: valid && previousValue > 0 ? (change / previousValue) * 100 : NaN,
            };
        };
        const day = periodChange(countdownNow - 24 * 60 * 60 * 1000);
        const month = periodChange(countdownNow - 30 * 24 * 60 * 60 * 1000);
        const quarter = periodChange(countdownNow - 90 * 24 * 60 * 60 * 1000);
        const ytdStart = new Date(new Date(countdownNow).getFullYear(), 0, 1).getTime();
        const ytd = periodChange(ytdStart);

        return {
            totalInvested,
            currentValue,
            totalGain,
            percentageGain,
            dailyChange: day.hasBase ? day.change : dailyChange,
            dailyChangePercent: day.hasBase ? day.percent : (currentValue > 0 ? (dailyChange / (currentValue - dailyChange)) * 100 : 0),
            monthlyChange: month.change,
            monthlyChangePercent: month.percent,
            threeMonthChange: quarter.change,
            threeMonthChangePercent: quarter.percent,
            ytdChange: ytd.change,
            ytdChangePercent: ytd.percent,
        };
    }, [assets, countdownNow, state.transactions]);

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
                    <span className={`dashboard__live-status ${apiEnabled ? 'dashboard__live-status--active' : ''}`}>
                        <Radio size={13} /> {apiEnabled ? `Auto · 1 min · ${updatingPrices ? 'actualizando…' : countdownLabel}` : 'Auto desactivada'}
                    </span>
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
                    onViewDetails={(asset) => setSelectedAssetId(asset.id)}
                />
            </section>
            <section className="dashboard__section"><PortfolioExcelInsights now={countdownNow} /></section>
            <section className="dashboard__section"><LivePortfolioPlan /></section>

            <section className="dashboard__section dashboard__performers">
                <Performers data={performersData} type="best" />
                <Performers data={performersData} type="worst" />
            </section>

            <section className="dashboard__section">
                <PortfolioComposition assets={assets} onAssetClick={(asset) => setSelectedAssetId(asset.id)} />
            </section>

            <Modal
                isOpen={selectedAsset !== null}
                onClose={() => setSelectedAssetId(null)}
                title={selectedAsset ? `Detalles de ${selectedAsset.symbol}` : ''}
                size="lg"
            >
                {selectedAsset && <AssetDetail asset={selectedAsset} portfolioValue={metrics.currentValue} />}
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
