import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui';
import { DonutChart, Heatmap } from '../charts';
import type { Asset, AssetHolding, CompositionItem, HeatmapItem } from '../../types/types';
import { getColorForIndex } from '../../data/mockData';
import { getFundRelevance } from '../../services/finect/finectService';
import { isApiEnabled } from '../../services/storageService';
import { buildConsolidatedPortfolioExposures, type ConsolidatedPortfolioExposure } from '../../services/portfolioComposition';
import './PortfolioComposition.css';

interface PortfolioCompositionProps {
    assets: Asset[];
    onAssetClick?: (asset: Asset) => void;
    onHoldingClick?: (holding: AssetHolding, parentAsset: Asset, exposure?: ConsolidatedPortfolioExposure) => void;
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
        .map((holding) => ({
            symbol: holding.symbol || holding.isin || holding.name,
            name: holding.name,
            percentage: holding.weight,
            isin: holding.isin,
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

function getExposureSourceLabel(exposure: ConsolidatedPortfolioExposure): string {
    if (exposure.isResidual && exposure.sources.length === 1) {
        return 'Parte no desglosada del fondo';
    }

    const directSources = new Set(exposure.sources.filter((source) => source.isDirect).map((source) => source.parentAssetId));
    const fundSources = new Set(exposure.sources.filter((source) => !source.isDirect && !source.isResidual).map((source) => source.parentAssetId));
    const parts: string[] = [];
    if (directSources.size > 0) parts.push('posición directa');
    if (fundSources.size > 0) parts.push(`${fundSources.size} fondo${fundSources.size === 1 ? '' : 's'}`);
    return parts.join(' + ') || 'Exposición identificada';
}

function getExposureDisplayName(exposure: ConsolidatedPortfolioExposure): string {
    if (!exposure.isResidual) return exposure.name;

    const parentNames = Array.from(new Set(exposure.sources.map((source) => source.parentAssetName)));
    return parentNames.join(' · ') || exposure.name;
}

export function PortfolioComposition({ assets, onAssetClick, onHoldingClick }: PortfolioCompositionProps) {
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

    const totalValue = useMemo(
        () => assets.reduce((sum, a) => sum + (a.currentPrice || a.purchasePrice) * a.quantity, 0),
        [assets],
    );

    const holdingsByAsset = useMemo(() => {
        const result = new Map<string, readonly AssetHolding[]>();
        assets.forEach((asset) => {
            const holdings = asset.holdings?.length ? asset.holdings : remoteHoldings[asset.id];
            if (holdings?.length) result.set(asset.id, holdings);
        });
        return result;
    }, [assets, remoteHoldings]);

    const consolidatedExposures = useMemo(
        () => buildConsolidatedPortfolioExposures(assets, holdingsByAsset),
        [assets, holdingsByAsset],
    );
    const identifiedExposures = useMemo(
        () => consolidatedExposures.filter((exposure) => !exposure.isResidual),
        [consolidatedExposures],
    );
    const residualExposures = useMemo(
        () => consolidatedExposures.filter((exposure) => exposure.isResidual),
        [consolidatedExposures],
    );

    // Generate composition data for donut chart
    const compositionData: CompositionItem[] = useMemo(() => assets.map((asset, index) => {
        const value = (asset.currentPrice || asset.purchasePrice) * asset.quantity;
        return {
            id: asset.id,
            symbol: asset.symbol,
            name: asset.name,
            value,
            percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
            color: getColorForIndex(index),
        };
    }), [assets, totalValue]);

    // Generate heatmap data
    const heatmapData: HeatmapItem[] = useMemo(() => assets.map((asset) => {
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
            symbol: holding.symbol || holding.name,
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
    }), [assets, remoteHoldings, totalValue]);

    const consolidatedCompositionData: CompositionItem[] = useMemo(() => {
        const identified = consolidatedExposures.filter((exposure) => !exposure.isResidual);
        const residual = consolidatedExposures.filter((exposure) => exposure.isResidual);
        const rows = identified.length <= 8
            ? identified
            : [
                ...identified.slice(0, 8),
                {
                    id: 'consolidated-other',
                    name: 'Resto de activos',
                    symbol: 'Resto de activos',
                    value: identified.slice(8).reduce((sum, row) => sum + row.value, 0),
                    weight: identified.slice(8).reduce((sum, row) => sum + row.weight, 0),
                },
            ];

        return [...rows, ...residual].map((row, index) => ({
            id: row.id,
            symbol: row.symbol || row.name,
            name: row.name,
            value: row.value,
            percentage: row.weight,
            color: getColorForIndex(index),
        }));
    }, [consolidatedExposures]);

    const handleHeatmapClick = (item: HeatmapItem) => {
        const asset = assets.find((candidate) => item.id === candidate.id || item.id.startsWith(`${candidate.id}-`));
        if (!asset) return;
        if (item.id === asset.id) {
            onAssetClick?.(asset);
            return;
        }

        const holdingIndex = Number(item.id.slice(asset.id.length + 1));
        const holdings = asset.holdings?.length ? asset.holdings : remoteHoldings[asset.id];
        const holding = Number.isInteger(holdingIndex) && holdingIndex >= 0 ? holdings?.[holdingIndex] : undefined;
        if (!holding) return;

        const exposure = consolidatedExposures.find((candidate) => candidate.sources.some((source) => (
            source.parentAssetId === asset.id
            && source.holding.name === holding.name
            && source.holding.percentage === holding.percentage
        )));
        if (onHoldingClick) {
            onHoldingClick(holding, asset, exposure);
        } else {
            onAssetClick?.(asset);
        }
    };

    const handleExposureClick = (exposure: ConsolidatedPortfolioExposure) => {
        const directSource = exposure.sources.find((source) => source.isDirect);
        if (directSource) {
            const directAsset = assets.find((asset) => asset.id === directSource.parentAssetId);
            if (directAsset) {
                onAssetClick?.(directAsset);
                return;
            }
        }

        const underlyingSource = exposure.sources.find((source) => !source.isResidual);
        if (!underlyingSource || !onHoldingClick) return;
        const parentAsset = assets.find((asset) => asset.id === underlyingSource.parentAssetId);
        if (parentAsset) onHoldingClick(underlyingSource.holding, parentAsset, exposure);
    };

    const fundsWithBreakdown = useMemo(() => funds.filter((asset) => {
        const holdings = asset.holdings?.length ? asset.holdings : remoteHoldings[asset.id];
        return Boolean(holdings?.length);
    }), [funds, remoteHoldings]);
    const fundsWithoutIsin = useMemo(
        () => funds.filter((asset) => !asset.holdings?.length && !getFundIsin(asset)),
        [funds],
    );

    const renderExposureRow = (exposure: ConsolidatedPortfolioExposure) => {
        const canOpen = !exposure.isResidual && Boolean(onHoldingClick || exposure.hasDirectPosition);
        return (
            <button
                key={exposure.id}
                type="button"
                className={`portfolio-composition__exposure-row ${exposure.isResidual ? 'portfolio-composition__exposure-row--residual' : ''}`}
                onClick={() => handleExposureClick(exposure)}
                disabled={!canOpen}
            >
                <span className="portfolio-composition__exposure-name">
                    <strong>{getExposureDisplayName(exposure)}</strong>
                    <small>{exposure.isResidual ? 'Resto no desglosado' : `${exposure.symbol && exposure.symbol !== exposure.name ? `${exposure.symbol} · ` : ''}${getExposureSourceLabel(exposure)}`}</small>
                </span>
                <span className="portfolio-composition__exposure-value">
                    <strong>{exposure.weight.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</strong>
                    <small>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(exposure.value)}</small>
                </span>
            </button>
        );
    };

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
                                        ? `Desglose activo · ${fundsWithBreakdown.length} fondo${fundsWithBreakdown.length === 1 ? '' : 's'} · exposiciones repetidas sumadas`
                                        : fundsWithoutIsin.length > 0
                                            ? 'Añade el ISIN de cada fondo para cargar sus posiciones automáticamente.'
                                            : 'No hay posiciones detalladas disponibles para estos fondos.'}
                            </p>
                        )}
                        {showBreakdown && (
                            <div className="portfolio-composition__consolidated">
                                <div className="portfolio-composition__consolidated-header">
                                    <div>
                                        <h4>Exposición total consolidada</h4>
                                        <p>Une las posiciones directas con las que aparecen dentro de los fondos y suma los solapamientos.</p>
                                    </div>
                                    <span>{consolidatedExposures.length} exposiciones · 100%</span>
                                </div>
                                <div className="portfolio-composition__exposure-sections">
                                    {identifiedExposures.length > 0 && (
                                        <section className="portfolio-composition__exposure-group">
                                            <div className="portfolio-composition__exposure-group-header">
                                                <h5>Exposición identificada</h5>
                                                <span>{identifiedExposures.length} posiciones</span>
                                            </div>
                                            <div className="portfolio-composition__exposure-list">
                                                {identifiedExposures.map(renderExposureRow)}
                                            </div>
                                        </section>
                                    )}
                                    {residualExposures.length > 0 && (
                                        <section className="portfolio-composition__exposure-group portfolio-composition__exposure-group--residual">
                                            <div className="portfolio-composition__exposure-group-header">
                                                <div>
                                                    <h5>No desglosados</h5>
                                                    <p>Parte de los fondos sin posiciones detalladas.</p>
                                                </div>
                                                <span>{residualExposures.reduce((sum, exposure) => sum + exposure.weight, 0).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>
                                            </div>
                                            <div className="portfolio-composition__exposure-list">
                                                {residualExposures.map(renderExposureRow)}
                                            </div>
                                        </section>
                                    )}
                                </div>
                                <p className="portfolio-composition__consolidated-note">
                                    Si un proveedor solo devuelve las principales posiciones, el porcentaje restante queda como “resto no desglosado” para que la suma cuadre con el valor total de tu cartera.
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="portfolio-composition__donut">
                        <DonutChart
                            data={showBreakdown ? consolidatedCompositionData : compositionData}
                            title={showBreakdown ? 'Exposición total' : 'Distribución por Valor'}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
