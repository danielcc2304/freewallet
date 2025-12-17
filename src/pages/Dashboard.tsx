import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCw, Wallet, Loader2 } from 'lucide-react';
import { PortfolioSummary } from '../components/dashboard/PortfolioSummary';
import { PortfolioChart } from '../components/charts/PortfolioChart';
import { Performers } from '../components/dashboard/Performers';
import { AssetsTable } from '../components/dashboard/AssetsTable';
import { PortfolioComposition } from '../components/dashboard/PortfolioComposition';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { usePortfolio } from '../context/PortfolioContext';
import { filterHistoryByPeriod } from '../data/mockData';
import { generateMockHistory } from '../data/mockData';
import type { PortfolioMetrics, ChartDataPoint, PerformerData, TimePeriod, Asset } from '../types/types';
import './Dashboard.css';

export function Dashboard() {
    const { state, refreshPrices, deleteAsset, loadDemoData } = usePortfolio();
    const { assets, loading, updatingPrices, lastPriceUpdate } = state;
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');
    const navigate = useNavigate();

    const handleEditAsset = (asset: Asset) => {
        navigate('/add', { state: { editAsset: asset } });
    };

    const handleAddPurchase = (asset: Asset) => {
        navigate('/add', { state: { dcaAsset: asset } });
    };

    // Calculate portfolio metrics
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

    // Generate chart data
    const chartData: ChartDataPoint[] = useMemo(() => {
        const history = generateMockHistory(365);
        return filterHistoryByPeriod(history, selectedPeriod);
    }, [selectedPeriod]);

    // Generate performers data
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
                            <Wallet className="welcome-content__icon" size={64} />
                            <h1 className="welcome-content__title">Bienvenido a FreeWallet</h1>
                            <p className="welcome-content__description">
                                Tu plataforma personal para gestionar y visualizar tu portfolio de inversiones.
                                Comienza añadiendo tu primera inversión o carga datos de demostración para explorar.
                            </p>
                            <div className="welcome-content__actions">
                                <Link to="/add">
                                    <Button icon={<PlusCircle size={18} />} size="lg">
                                        Añadir Primera Inversión
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
        );
    }

    return (
        <div className="dashboard">
            {/* Header with actions */}
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
                        disabled={updatingPrices}
                    >
                        {updatingPrices ? 'Actualizando...' : 'Actualizar Precios'}
                    </Button>
                    <Link to="/add">
                        <Button icon={<PlusCircle size={16} />} size="sm">
                            Añadir
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Updating indicator */}
            {updatingPrices && (
                <div className="dashboard__updating-banner">
                    <Loader2 size={16} className="spinning" />
                    <span>Obteniendo precios en tiempo real...</span>
                </div>
            )}

            {/* Portfolio Summary */}
            <PortfolioSummary metrics={metrics} />

            {/* Portfolio Chart */}
            <section className="dashboard__section">
                <PortfolioChart
                    data={chartData}
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                />
            </section>

            {/* Best & Worst Performers */}
            <section className="dashboard__section dashboard__performers">
                <Performers data={performersData} type="best" />
                <Performers data={performersData} type="worst" />
            </section>

            {/* Portfolio Composition */}
            <section className="dashboard__section">
                <PortfolioComposition assets={assets} />
            </section>

            {/* Assets Table */}
            <section className="dashboard__section">
                <AssetsTable
                    assets={assets}
                    onDelete={deleteAsset}
                    onEdit={handleEditAsset}
                    onAddPurchase={handleAddPurchase}
                />
            </section>
        </div>
    );
}
