import { useEffect, useMemo, useState } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import { AssetDetail } from './AssetDetail';
import { getQuote, searchSymbol } from '../../services/apiService';
import { isApiEnabled } from '../../services/storageService';
import type { Asset, AssetHolding, SearchResult } from '../../types/types';
import type { ConsolidatedPortfolioExposure } from '../../services/portfolioComposition';
import './UnderlyingAssetDetail.css';

interface UnderlyingAssetDetailProps {
    holding: AssetHolding;
    parentAsset: Asset;
    exposure?: ConsolidatedPortfolioExposure;
}

function isTicker(value: string, name: string): boolean {
    const candidate = value.trim();
    return Boolean(candidate)
        && candidate.toLowerCase() !== name.trim().toLowerCase()
        && /^[A-Z0-9][A-Z0-9.-]{0,15}$/i.test(candidate);
}

function normalizeSearchText(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function chooseSearchResult(results: SearchResult[], holding: AssetHolding): SearchResult | undefined {
    const expected = normalizeSearchText(holding.name);
    const expectedTokens = expected.split(/\s+/).filter((token) => token.length > 2);

    return [...results].sort((left, right) => {
        const score = (result: SearchResult) => {
            const candidate = normalizeSearchText(result.name);
            const tokenScore = expectedTokens.reduce((sum, token) => sum + (candidate.includes(token) ? 1 : 0), 0);
            const typeScore = result.type === 'stock' ? 0.25 : 0;
            return tokenScore + typeScore;
        };
        return score(right) - score(left);
    })[0];
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatPercentage(value: number): string {
    return `${value.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function formatSourceNames(exposure: ConsolidatedPortfolioExposure | undefined): string {
    if (!exposure) return 'Posición dentro de un fondo';
    const names = Array.from(new Set(exposure.sources.map((source) => source.parentAssetName)));
    if (names.length <= 2) return names.join(' · ');
    return `${names.slice(0, 2).join(' · ')} · ${names.length - 2} más`;
}

export function UnderlyingAssetDetail({ holding, parentAsset, exposure }: UnderlyingAssetDetailProps) {
    const [resolvedAsset, setResolvedAsset] = useState<Asset | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const apiEnabled = isApiEnabled();

    useEffect(() => {
        const controller = new AbortController();
        let disposed = false;

        const resolveHolding = async () => {
            setStatus('loading');
            setResolvedAsset(null);
            setErrorMessage('');

            if (!apiEnabled) {
                setStatus('unavailable');
                setErrorMessage('Activa los datos de mercado en Configuración para cargar la ficha del activo.');
                return;
            }

            try {
                const query = holding.isin || (isTicker(holding.symbol, holding.name) ? holding.symbol : holding.name);
                const results = await searchSymbol(query, controller.signal);
                const match = chooseSearchResult(results, holding) || (isTicker(holding.symbol, holding.name)
                    ? {
                        symbol: holding.symbol,
                        name: holding.name,
                        type: 'stock' as const,
                        region: 'Global',
                        currency: parentAsset.currency || 'EUR',
                    }
                    : undefined);
                if (!match) throw new Error('No he podido resolver un ticker para esta posición.');

                const quote = await getQuote(match.symbol, controller.signal);
                if (disposed || controller.signal.aborted) return;

                const price = quote?.price ?? 0;
                setResolvedAsset({
                    id: `underlying-${match.symbol}`,
                    symbol: match.symbol,
                    name: match.name || holding.name,
                    type: match.type,
                    purchasePrice: price,
                    purchaseDate: parentAsset.purchaseDate,
                    quantity: 1,
                    currentPrice: price || undefined,
                    previousClose: quote?.previousClose,
                    currency: quote?.currency || parentAsset.currency || 'EUR',
                    isin: holding.isin,
                    lastQuoteAt: quote ? new Date().toISOString() : undefined,
                });
                setStatus('ready');
            } catch (error) {
                if (disposed || controller.signal.aborted) return;
                setStatus('unavailable');
                setErrorMessage(error instanceof Error ? error.message : 'No he podido cargar la ficha del activo.');
            }
        };

        void resolveHolding();
        return () => {
            disposed = true;
            controller.abort();
        };
    }, [apiEnabled, holding, holding.isin, holding.name, holding.symbol, parentAsset.currency, parentAsset.purchaseDate]);

    const parentValue = (parentAsset.currentPrice ?? parentAsset.purchasePrice) * parentAsset.quantity;
    const exposureValue = exposure?.value ?? parentValue * (holding.percentage / 100);
    const exposureWeight = exposure?.weight ?? 0;

    const contextItems = useMemo(() => [
        { label: 'Exposición consolidada', value: formatPercentage(exposureWeight) },
        { label: 'Valor estimado', value: formatCurrency(exposureValue) },
        { label: 'Origen', value: formatSourceNames(exposure) },
    ], [exposure, exposureValue, exposureWeight]);

    return (
        <div className="underlying-detail">
            <div className="underlying-detail__context">
                <div className="underlying-detail__context-heading">
                    <Activity size={18} />
                    <div>
                        <strong>Posición subyacente</strong>
                        <p>{holding.name}</p>
                    </div>
                </div>
                <div className="underlying-detail__context-grid">
                    {contextItems.map((item) => (
                        <div key={item.label}>
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                        </div>
                    ))}
                </div>
                <p className="underlying-detail__context-note">
                    Esta exposición suma la parte del activo que aparece directamente y dentro de los fondos cargados.
                </p>
            </div>

            {status === 'loading' && (
                <div className="underlying-detail__loading" role="status">
                    <Loader2 size={20} className="spinning" />
                    <span>Buscando la ficha de {holding.name}…</span>
                </div>
            )}
            {status === 'ready' && resolvedAsset && <AssetDetail asset={resolvedAsset} />}
            {status === 'unavailable' && (
                <div className="underlying-detail__unavailable">
                    <strong>{holding.name}</strong>
                    <p>{errorMessage}</p>
                    <small>La ponderación consolidada sí se mantiene calculada con los datos del fondo.</small>
                </div>
            )}
        </div>
    );
}
