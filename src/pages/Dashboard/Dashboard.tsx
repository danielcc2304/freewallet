import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCw, Wallet, Feather, Loader2, Wrench } from 'lucide-react';
import { PortfolioSummary, Performers, AssetsTable, PortfolioComposition, AssetDetail } from '../../components/dashboard';
import { PortfolioChart } from '../../components/charts';
import { Button, Card, CardContent, Modal } from '../../components/ui';
import { usePortfolio } from '../../context/PortfolioContext';
import { filterHistoryByPeriod, generateMockHistory } from '../../data/mockData';
import { isApiEnabled } from '../../services/storageService';
import type { PortfolioMetrics, ChartDataPoint, PerformerData, TimePeriod, Asset } from '../../types/types';
import './Dashboard.css';

const API_NOTICE_SESSION_KEY = 'freewallet_dashboard_api_notice_seen';

export function Dashboard() {
    const { state, refreshPrices, deleteAsset, loadDemoData } = usePortfolio();
    const { assets, loading, updatingPrices, lastPriceUpdate } = state;
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [showApiNotice, setShowApiNotice] = useState(false);
    const navigate = useNavigate();
    const apiEnabled = isApiEnabled();

    useEffect(() => {
        if (!apiEnabled) {
            setShowApiNotice(false);
            return;
        }

        const alreadySeen = sessionStorage.getItem(API_NOTICE_SESSION_KEY) === 'true';
        setShowApiNotice(!alreadySeen);
    }, [apiEnabled]);

    const handleCloseApiNotice = () => {
        sessionStorage.setItem(API_NOTICE_SESSION_KEY, 'true');
        setShowApiNotice(false);
    };

    const handleEditAsset = (asset: Asset) => {
        navigate('/add', { state: { editAsset: asset } });
    };

    const handleAddPurchase = (asset: Asset) => {
        navigate('/add', { state: { dcaAsset: asset } });
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

        return {
            totalInvested,
            currentValue,
            totalGain,
            percentageGain,
            dailyChange,
            dailyChangePercent: currentValue > 0 ? (dailyChange / (currentValue - dailyChange)) * 100 : 0,
            monthlyChange: totalGain * 0.3,
            monthlyChangePercent: percentageGain * 0.3,
            threeMonthChange: totalGain * 0.6,
            threeMonthChangePercent: percentageGain * 0.6,
            ytdChange: totalGain,
            ytdChangePercent: percentageGain,
        };
    }, [assets]);

    const chartData: ChartDataPoint[] = useMemo(() => {
        const history = generateMockHistory(365);
        return filterHistoryByPeriod(history, selectedPeriod);
    }, [selectedPeriod]);

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

    const apiNoticeModal = (
        <Modal
            isOpen={showApiNotice}
            onClose={handleCloseApiNotice}
            title="Dashboard en construccion"
            size="sm"
        >
            <div className="dashboard__notice">
                <div className="dashboard__notice-icon">
                    <Wrench size={20} />
                </div>
                <p>
                    Las peticiones a APIs estan activadas, pero la experiencia del dashboard todavia no esta cerrada.
                    Puede haber datos incompletos o comportamientos provisionales mientras se termina esta parte.
                </p>
                <Button onClick={handleCloseApiNotice}>
                    Entendido
                </Button>
            </div>
        </Modal>
    );

    if (loading) {
        return (
            <>
                <div className="dashboard dashboard--loading">
                    <div className="skeleton skeleton--large" />
                    <div className="skeleton skeleton--medium" />
                    <div className="skeleton skeleton--medium" />
                </div>
                {apiNoticeModal}
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
                                    Tu plataforma personal para gestionar y visualizar tu portfolio de inversiones.
                                    Comienza anadiendo tu primera inversion o carga datos de demostracion para explorar.
                                </p>
                                <div className="welcome-content__actions">
                                    <Link to="/add">
                                        <Button icon={<PlusCircle size={18} />} size="lg">
                                            Anadir Primera Inversion
                                        </Button>
                                    </Link>
                                    <Button variant="secondary" onClick={loadDemoData} icon={<RefreshCw size={18} />}>
                                        Cargar Datos Demo
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {apiNoticeModal}
            </>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard__header">
                <div>
                    <h1 className="dashboard__title">Dashboard</h1>
                    <p className="dashboard__subtitle">
                        Vista general de tu portfolio
                        {lastPriceUpdate && (
                            <span className="dashboard__last-update">
                                · Actualizado: {lastPriceUpdate.toLocaleTimeString()}
                            </span>
                        )}
                    </p>
                </div>
                <div className="dashboard__actions">
                    <Button
                        variant="secondary"
                        onClick={refreshPrices}
                        icon={updatingPrices ? <Loader2 size={16} className="spinning" /> : <RefreshCw size={16} />}
                        size="sm"
                        disabled={updatingPrices || !apiEnabled}
                    >
                        {!apiEnabled ? 'APIs desactivadas' : updatingPrices ? 'Actualizando...' : 'Actualizar Precios'}
                    </Button>
                    <Link to="/add">
                        <Button icon={<PlusCircle size={16} />} size="sm">
                            Anadir
                        </Button>
                    </Link>
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
                <PortfolioChart
                    data={chartData}
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                />
            </section>

            <section className="dashboard__section dashboard__performers">
                <Performers data={performersData} type="best" />
                <Performers data={performersData} type="worst" />
            </section>

            <section className="dashboard__section">
                <PortfolioComposition assets={assets} />
            </section>

            <section className="dashboard__section">
                <AssetsTable
                    assets={assets}
                    onDelete={deleteAsset}
                    onEdit={handleEditAsset}
                    onAddPurchase={handleAddPurchase}
                    onViewDetails={(asset) => setSelectedAsset(asset)}
                />
            </section>

            <Modal
                isOpen={selectedAsset !== null}
                onClose={() => setSelectedAsset(null)}
                title={selectedAsset ? `Detalles de ${selectedAsset.symbol}` : ''}
                size="lg"
            >
                {selectedAsset && <AssetDetail asset={selectedAsset} />}
            </Modal>

            {apiNoticeModal}
        </div>
    );
}
