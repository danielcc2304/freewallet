import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui';
import { DonutChart, Heatmap } from '../charts';
import type { Asset, AssetHolding, CompositionItem, HeatmapItem } from '../../types/types';
import { getColorForIndex } from '../../data/mockData';
import { getFundRelevance } from '../../services/finect/finectService';
import { isApiEnabled } from '../../services/storageService';
import './PortfolioComposition.css';

interface PortfolioCompositionProps {
    assets: Asset[];
    onAssetClick?: (asset: Asset) => void;
}

const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{10}$/;

function getFundIsin(asset: Asset): string | null {
    const candidate = (asset.isin || asset.symbol || '').trim().toUpperCase();
    return ISIN_PATTERN.test(candidate) ? candidate : null;
}

function getHoldingSymbol(name: string, index: number): string {
    const initials = name
        .split(/\s+/)
        .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ''))
        .filter(Boolean)
        .slice(0, 3)
        .map((word) => word[0])
        .join('')
        .toUpperCase();

    return initials || `#${index + 1}`;
}

function normalizeFundHoldings(fund: Awaited<ReturnType<typeof getFundRelevance>>): AssetHolding[] {
    const holdings = fund.holdings
        .filter((holding) => Number.isFinite(holding.weight) && holding.weight > 0)
        .map((holding, index) => ({
            symbol: getHoldingSymbol(holding.name, index),
            name: holding.name,
            percentage: holding.weight,
        }));

    if (holdings.length > 0) return holdings;

    // Some Finect fund classes expose allocation by sector/geography instead
    // of individual holdings. It is still useful as a portfolio breakdown.
    const allocation = [...fund.breakdowns]
        .sort((left, right) => {
            const leftScore = /sector|geograf|pa[ií]s|asset|activo/i.test(left.type) ? 1 : 0;
            const rightScore = /sector|geograf|pa[ií]s|asset|activo/i.test(right.type) ? 1 : 0;
            return rightScore - leftScore;
        })[0];

    return allocation?.items
        .filter((item) => Number.isFinite(item.value) && item.value > 0)
        .slice(0, 10)
        .map((item, index) => ({
            symbol: getHoldingSymbol(item.label, index),
            name: item.label,
            percentage: item.value,
        })) ?? [];
}

export function PortfolioComposition({ assets, onAssetClick }: PortfolioCompositionProps) {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [remoteHoldings, setRemoteHoldings] = useState<Record<string, AssetHolding[]>>({});
    const apiEnabled = isApiEnabled();

    const funds = useMemo(() => assets.filter((asset) => asset.type === 'fund'), [assets]);
    const fundsWithRemoteLookup = useMemo(
        () => funds.filter((asset) => !asset.holdings?.length && getFundIsin(asset)),
        [funds],
    );
    const pendingBreakdownCount = fundsWithRemoteLookup.filter(
        (asset) => !Object.prototype.hasOwnProperty.call(remoteHoldings, asset.id),
    ).length;
    const breakdownLoading = showBreakdown && apiEnabled && pendingBreakdownCount > 0;

    useEffect(() => {
        if (!showBreakdown || !apiEnabled) return undefined;

        const pendingFunds = fundsWithRemoteLookup.filter(
            (asset) => !Object.prototype.hasOwnProperty.call(remoteHoldings, asset.id),
        );
        if (pendingFunds.length === 0) return undefined;

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 12000);
        let disposed = false;

        void Promise.all(pendingFunds.map(async (asset) => {
            const isin = getFundIsin(asset);
            if (!isin) return { id: asset.id, holdings: [] as AssetHolding[] };

            try {
                const fund = await getFundRelevance(isin, controller.signal);
                return { id: asset.id, holdings: normalizeFundHoldings(fund) };
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.warn(`[Portfolio] No se pudo cargar el desglose de ${asset.symbol}.`, error);
                }
                return { id: asset.id, holdings: [] as AssetHolding[] };
            }
        })).then((results) => {
            if (disposed) return;
            setRemoteHoldings((current) => {
                const next = { ...current };
                results.forEach(({ id, holdings }) => {
                    next[id] = holdings;
                });
                return next;
            });
        }).finally(() => {
            window.clearTimeout(timeoutId);
        });

        return () => {
            disposed = true;
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, [apiEnabled, fundsWithRemoteLookup, remoteHoldings, showBreakdown]);

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
    const heatmapData: HeatmapItem[] = assets.map((asset) => {
        const currentValue = (asset.currentPrice || asset.purchasePrice) * asset.quantity;
        const investedValue = asset.purchasePrice * asset.quantity;
        const changePercent = investedValue > 0
            ? ((currentValue - investedValue) / investedValue) * 100
            : 0;

        // Prefer holdings saved with the position and fall back to the live
        // Finect breakdown loaded when the toggle is enabled.
        const holdings = asset.holdings?.length ? asset.holdings : remoteHoldings[asset.id];
        const children = holdings?.map((holding, hIndex) => ({
            id: `${asset.id}-${hIndex}`,
            symbol: holding.symbol,
            name: holding.name,
            value: currentValue * (holding.percentage / 100),
            weight: holding.percentage,
            change: currentValue * (holding.percentage / 100) * (changePercent / 100),
            changePercent,
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

    const handleHeatmapClick = (item: HeatmapItem) => {
        const asset = assets.find((candidate) => item.id === candidate.id || item.id.startsWith(`${candidate.id}-`));
        if (asset) onAssetClick?.(asset);
    };

    if (assets.length === 0) {
        return null;
    }

    const fundsWithBreakdown = funds.filter((asset) => {
        const holdings = asset.holdings?.length ? asset.holdings : remoteHoldings[asset.id];
        return Boolean(holdings?.length);
    });
    const fundsWithoutIsin = funds.filter((asset) => !asset.holdings?.length && !getFundIsin(asset));

    return (
        <Card className="portfolio-composition">
            <CardHeader
                title="Composición del Portfolio"
                subtitle="Distribución de activos por valor y rendimiento"
                action={
                    <div className="breakdown-toggle">
                        <button
                            type="button"
                            className="breakdown-toggle__label"
                            aria-pressed={showBreakdown}
                            onClick={() => setShowBreakdown((visible) => !visible)}
                        >
                            <span>Desglosar fondos</span>
                            <span className="breakdown-toggle__slider" />
                        </button>
                    </div>
                }
            />
            <CardContent>
                <div className="portfolio-composition__content">
                    <div className="portfolio-composition__heatmap">
                        <h4 className="portfolio-composition__section-title">Mapa de Calor</h4>
                        <Heatmap data={heatmapData} showBreakdown={showBreakdown} onItemClick={handleHeatmapClick} />
                        {showBreakdown && funds.length > 0 && (
                            <p className="portfolio-composition__breakdown-status" aria-live="polite">
                                {breakdownLoading
                                    ? 'Cargando posiciones de los fondos…'
                                    : fundsWithBreakdown.length > 0
                                        ? `Desglose activo · ${fundsWithBreakdown.length} fondo${fundsWithBreakdown.length === 1 ? '' : 's'} con posiciones`
                                        : fundsWithoutIsin.length > 0
                                            ? 'Añade el ISIN de cada fondo para cargar sus posiciones automáticamente.'
                                            : 'No hay posiciones detalladas disponibles para estos fondos.'}
                            </p>
                        )}
                    </div>
                    <div className="portfolio-composition__donut">
                        <DonutChart data={compositionData} title="Distribución por Valor" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
