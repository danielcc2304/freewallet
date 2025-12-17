import { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { DonutChart } from '../charts/DonutChart';
import { Heatmap } from '../charts/Heatmap';
import type { Asset, CompositionItem, HeatmapItem } from '../../types/types';
import { getColorForIndex } from '../../data/mockData';
import './PortfolioComposition.css';

interface PortfolioCompositionProps {
    assets: Asset[];
}

export function PortfolioComposition({ assets }: PortfolioCompositionProps) {
    const [showBreakdown, setShowBreakdown] = useState(false);

    const totalValue = assets.reduce(
        (sum, a) => sum + (a.currentPrice || a.purchasePrice) * a.quantity,
        0
    );

    // Generate composition data for donut chart
    const compositionData: CompositionItem[] = assets.map((asset, index) => {
        const value = (asset.currentPrice || asset.purchasePrice) * asset.quantity;
        return {
            id: asset.id,
            symbol: asset.symbol,
            name: asset.name,
            value,
            percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
            color: getColorForIndex(index),
        };
    });

    // Generate heatmap data
    const heatmapData: HeatmapItem[] = assets.map((asset, index) => {
        const currentValue = (asset.currentPrice || asset.purchasePrice) * asset.quantity;
        const investedValue = asset.purchasePrice * asset.quantity;
        const changePercent = investedValue > 0
            ? ((currentValue - investedValue) / investedValue) * 100
            : 0;

        // Generate children from holdings if available
        const children = asset.holdings?.map((holding, hIndex) => ({
            id: `${asset.id}-${hIndex}`,
            symbol: holding.symbol,
            name: holding.name,
            value: currentValue * (holding.percentage / 100),
            weight: holding.percentage,
            change: (Math.random() - 0.5) * 10, // Simulated
            changePercent: (Math.random() - 0.5) * 10, // Simulated
        }));

        return {
            id: asset.id,
            symbol: asset.symbol,
            name: asset.name,
            value: currentValue,
            weight: totalValue > 0 ? (currentValue / totalValue) * 100 : 0,
            change: currentValue - investedValue,
            changePercent,
            children,
        };
    });

    if (assets.length === 0) {
        return null;
    }

    return (
        <Card className="portfolio-composition">
            <CardHeader
                title="Composición del Portfolio"
                subtitle="Distribución de activos por valor y rendimiento"
                action={
                    <div className="breakdown-toggle">
                        <label className="breakdown-toggle__label">
                            <span>Desglosar fondos</span>
                            <input
                                type="checkbox"
                                checked={showBreakdown}
                                onChange={(e) => setShowBreakdown(e.target.checked)}
                                className="breakdown-toggle__input"
                            />
                            <span className="breakdown-toggle__slider" />
                        </label>
                    </div>
                }
            />
            <CardContent>
                <div className="portfolio-composition__content">
                    <div className="portfolio-composition__heatmap">
                        <h4 className="portfolio-composition__section-title">Mapa de Calor</h4>
                        <Heatmap data={heatmapData} showBreakdown={showBreakdown} />
                    </div>
                    <div className="portfolio-composition__donut">
                        <DonutChart data={compositionData} title="Distribución por Valor" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
