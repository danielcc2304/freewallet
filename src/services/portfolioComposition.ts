import type { Asset, AssetHolding } from '../types/types';

const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{10}$/;
const CONTAINER_TYPES = new Set<Asset['type']>(['fund', 'etf']);
const LEGAL_NAME_TOKENS = new Set([
    'a',
    'ag',
    'co',
    'company',
    'corp',
    'corporation',
    'inc',
    'incorporated',
    'l',
    'limited',
    'ltd',
    'nv',
    'plc',
    'sa',
    'sau',
    'sl',
    'slu',
    's',
    'spa',
]);

export interface ConsolidatedExposureSource {
    parentAssetId: string;
    parentAssetName: string;
    parentAssetSymbol: string;
    holding: AssetHolding;
    value: number;
    weight: number;
    isDirect: boolean;
    isResidual: boolean;
}

export interface ConsolidatedPortfolioExposure {
    id: string;
    name: string;
    symbol: string;
    value: number;
    weight: number;
    sources: ConsolidatedExposureSource[];
    sourceCount: number;
    hasDirectPosition: boolean;
    isResidual: boolean;
}

export type PortfolioHoldingsByAsset = ReadonlyMap<string, readonly AssetHolding[]>;

function isContainerAsset(asset: Asset): boolean {
    return CONTAINER_TYPES.has(asset.type);
}

function getCurrentValue(asset: Asset): number {
    const price = asset.currentPrice ?? asset.purchasePrice;
    return Number.isFinite(price) && Number.isFinite(asset.quantity) ? Math.max(0, price * asset.quantity) : 0;
}

function normalizeName(value: string): string {
    const withoutShareClass = value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\b(?:class|share|shares|series)\s+[a-z0-9]+\b/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    return withoutShareClass
        .split(/\s+/)
        .filter((token) => token.length > 1 && !LEGAL_NAME_TOKENS.has(token))
        .join(' ');
}

/**
 * Returns the identity used to merge a direct position with the same asset
 * reported inside one or more funds. Names are preferred over tickers because
 * providers frequently omit the ticker or use different listings for it.
 */
export function getExposureIdentity(name: string, symbol?: string, isin?: string): string {
    const normalizedName = normalizeName(name);
    if (normalizedName) return `name:${normalizedName}`;

    const normalizedIsin = isin?.replace(/\s+/g, '').toUpperCase();
    if (normalizedIsin && ISIN_PATTERN.test(normalizedIsin)) return `isin:${normalizedIsin}`;

    return `symbol:${(symbol || name).trim().toUpperCase()}`;
}

function getDisplaySymbol(holding: AssetHolding): string {
    const symbol = holding.symbol.trim();
    return symbol
        && symbol.toLowerCase() !== holding.name.trim().toLowerCase()
        && !ISIN_PATTERN.test(symbol.toUpperCase())
        ? symbol
        : '';
}

function buildDirectHolding(asset: Asset): AssetHolding {
    return {
        symbol: asset.symbol,
        name: asset.name,
        percentage: 100,
        isin: asset.isin,
    };
}

function buildResidualHolding(asset: Asset, percentage: number): AssetHolding {
    return {
        symbol: '',
        name: `Resto no desglosado · ${asset.name}`,
        percentage,
        isin: asset.isin,
    };
}

function addExposure(
    exposures: Map<string, ConsolidatedPortfolioExposure>,
    source: ConsolidatedExposureSource,
    totalValue: number,
): void {
    const key = getExposureIdentity(source.holding.name, source.holding.symbol, source.holding.isin);
    const existing = exposures.get(key);
    const sourceSymbol = getDisplaySymbol(source.holding);

    if (!existing) {
        exposures.set(key, {
            id: `exposure-${key}`,
            name: source.holding.name,
            symbol: sourceSymbol,
            value: source.value,
            weight: totalValue > 0 ? (source.value / totalValue) * 100 : 0,
            sources: [source],
            sourceCount: 1,
            hasDirectPosition: source.isDirect,
            isResidual: source.isResidual,
        });
        return;
    }

    existing.value += source.value;
    existing.weight = totalValue > 0 ? (existing.value / totalValue) * 100 : 0;
    existing.sources.push(source);
    existing.sourceCount = new Set(existing.sources.map((item) => item.parentAssetId)).size;
    existing.hasDirectPosition = existing.hasDirectPosition || source.isDirect;
    existing.isResidual = existing.isResidual && source.isResidual;

    // A direct position has the clearest user-facing name. Otherwise keep the
    // most descriptive provider label when several funds use different forms.
    if (source.isDirect || source.holding.name.length > existing.name.length) {
        existing.name = source.holding.name;
    }
    if (!existing.symbol && sourceSymbol) existing.symbol = sourceSymbol;
}

function addDirectExposure(
    exposures: Map<string, ConsolidatedPortfolioExposure>,
    asset: Asset,
    totalValue: number,
): void {
    const value = getCurrentValue(asset);
    const holding = buildDirectHolding(asset);
    addExposure(exposures, {
        parentAssetId: asset.id,
        parentAssetName: asset.name,
        parentAssetSymbol: asset.symbol,
        holding,
        value,
        weight: 100,
        isDirect: true,
        isResidual: false,
    }, totalValue);
}

function addLookThroughExposure(
    exposures: Map<string, ConsolidatedPortfolioExposure>,
    asset: Asset,
    holdings: readonly AssetHolding[],
    totalValue: number,
): void {
    const value = getCurrentValue(asset);
    const validHoldings = holdings
        .map((holding) => ({
            holding,
            weight: Math.min(100, Number(holding.percentage)),
        }))
        .filter(({ holding, weight }) => holding.name.trim() && Number.isFinite(weight) && weight > 0);

    if (validHoldings.length === 0) {
        addDirectExposure(exposures, asset, totalValue);
        return;
    }

    const reportedWeight = validHoldings.reduce((sum, item) => sum + item.weight, 0);
    const scale = reportedWeight > 100 ? 100 / reportedWeight : 1;
    let coveredWeight = 0;

    validHoldings.forEach(({ holding, weight }) => {
        const effectiveWeight = weight * scale;
        coveredWeight += effectiveWeight;
        addExposure(exposures, {
            parentAssetId: asset.id,
            parentAssetName: asset.name,
            parentAssetSymbol: asset.symbol,
            holding,
            value: value * (effectiveWeight / 100),
            weight: effectiveWeight,
            isDirect: false,
            isResidual: false,
        }, totalValue);
    });

    const residualWeight = Math.max(0, 100 - coveredWeight);
    if (residualWeight > 0.05) {
        const holding = buildResidualHolding(asset, residualWeight);
        addExposure(exposures, {
            parentAssetId: asset.id,
            parentAssetName: asset.name,
            parentAssetSymbol: asset.symbol,
            holding,
            value: value * (residualWeight / 100),
            weight: residualWeight,
            isDirect: false,
            isResidual: true,
        }, totalValue);
    }
}

/**
 * Builds a look-through portfolio view. Direct assets are kept as-is, while
 * fund/ETF positions are split into their reported holdings. Any part not
 * covered by the provider's top holdings remains visible as a residual bucket
 * so the resulting weights still reconcile to the portfolio total.
 */
export function buildConsolidatedPortfolioExposures(
    assets: readonly Asset[],
    holdingsByAsset: PortfolioHoldingsByAsset = new Map(),
): ConsolidatedPortfolioExposure[] {
    const totalValue = assets.reduce((sum, asset) => sum + getCurrentValue(asset), 0);
    const exposures = new Map<string, ConsolidatedPortfolioExposure>();

    assets.forEach((asset) => {
        if (!isContainerAsset(asset)) {
            addDirectExposure(exposures, asset, totalValue);
            return;
        }

        const mappedHoldings = holdingsByAsset.get(asset.id);
        const holdings = mappedHoldings ?? asset.holdings ?? [];
        addLookThroughExposure(exposures, asset, holdings, totalValue);
    });

    return Array.from(exposures.values())
        .sort((left, right) => right.value - left.value)
        .map((exposure) => ({
            ...exposure,
            sourceCount: new Set(exposure.sources.map((source) => source.parentAssetId)).size,
        }));
}
