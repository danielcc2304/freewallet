import { useEffect, useMemo, useState } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import { AssetDetail } from './AssetDetail';
import { getQuote, searchUnderlyingInstrument } from '../../services/apiService';
import { isApiEnabled } from '../../services/storageService';
import type { Asset, AssetHolding } from '../../types/types';
import { chooseUnderlyingResult } from '../../services/dashboardIntegrity';
import { assetValue } from '../../services/assetValuation';
import type { ConsolidatedPortfolioExposure } from '../../services/portfolioComposition';
import './UnderlyingAssetDetail.css';
import { underlyingQueries } from '../../services/underlyingInstruments';
import { Button } from '../ui';

interface UnderlyingAssetDetailProps {
    holding: AssetHolding;
    parentAsset: Asset;
    exposure?: ConsolidatedPortfolioExposure;
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
    const [retry,setRetry] = useState(0);
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
                let match;
                for(const {query,isinSearch} of underlyingQueries(holding)){
                    const results=await searchUnderlyingInstrument(query,controller.signal);
                    match=chooseUnderlyingResult(results,holding,isinSearch);
                    if(match) break;
                }
                if (!match) throw new Error('No hay una cotización identificada para este subyacente.');

                const quote = await getQuote(match.symbol, controller.signal);
                if (disposed || controller.signal.aborted) return;

                const price = quote?.price ?? 0;
                setResolvedAsset({
                    id: `underlying-${match.symbol}`,
                    symbol: match.symbol,
                    name: match.name || holding.name,
                    type: match.type,
                    purchasePrice: 0,
                    purchaseDate: '',
                    quantity: 0,
                    currentPrice: quote && Number.isFinite(price) && price >= 0 ? price : undefined,
                    previousClose: quote?.previousClose,
                    currency: quote?.currency || match.currency || 'Unknown',
                    isin: holding.isin || match.isin,
                    lastQuoteAt: quote?.quotedAt,
                    lastCheckedAt: quote ? new Date().toISOString() : undefined,
                });
                setStatus('ready');
            } catch (error) {
                if (disposed || controller.signal.aborted) return;
                setStatus('unavailable');
                setErrorMessage(error instanceof Error && error.message==='No hay una cotización identificada para este subyacente.'
                    ? error.message : 'No se pudo consultar la cotización. Reintenta.');
            }
        };

        void resolveHolding();
        return () => {
            disposed = true;
            controller.abort();
        };
    }, [apiEnabled, holding, holding.isin, holding.name, holding.symbol, parentAsset.currency, parentAsset.purchaseDate,retry]);

    const parentValue = assetValue(parentAsset);
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
            {status === 'ready' && resolvedAsset && <AssetDetail asset={resolvedAsset} marketOnly />}
            {status === 'unavailable' && (
                <div className="underlying-detail__unavailable">
                    <strong>{holding.name}</strong>
                    <p>{errorMessage}</p>
                    {apiEnabled && <Button type="button" variant="secondary" onClick={()=>setRetry(n=>n+1)}>Reintentar</Button>}
                </div>
            )}
        </div>
    );
}
