import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    ExternalLink,
    PanelsTopLeft,
    RefreshCw,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { ResponsiveContainer, Treemap, type TreemapNode } from 'recharts';
import { Button } from '../../ui/Button';
import { MARKET_HEATMAP_INDEX_BY_ID, MARKET_HEATMAP_INDICES } from '../../../data/marketHeatmapIndices';
import type {
    MarketHeatmapConstituent,
    MarketHeatmapIndexId,
} from '../../../data/marketHeatmapIndices';
import { getQuote, getQuotesYahooSpark } from '../../../services/apiService';
import { loadMarketIndexHoldings } from '../../../services/marketHeatmapService';
import type { StockQuote } from '../../../types/types';
import './MarketHeatmap.css';

interface LoadedIndexQuotes {
    quotes: Record<string, StockQuote>;
    constituents: MarketHeatmapConstituent[];
    loadedAt: number;
    missingCount: number;
}

interface MarketHeatmapDatum extends MarketHeatmapConstituent {
    [key: string]: unknown;
    value: number;
    changePercent: number;
    price: number;
    currency: string;
}

interface MarketHeatmapSectorGroup {
    [key: string]: unknown;
    name: string;
    sector: string;
    value: number;
    children: MarketHeatmapDatum[];
}

interface MarketHeatmapSectorSummary {
    sector: string;
    weight: number;
    count: number;
    changePercent: number;
}

interface MarketHeatmapSectorLabel {
    sector: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

const CONCURRENT_REQUESTS = 6;
const DISPLAY_OPTIONS: Array<{ label: string; value: number | 'all' }> = [
    { label: '100', value: 100 },
    { label: '250', value: 250 },
    { label: 'Todos', value: 'all' },
];

function formatPercent(value: number): string {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}%`;
}

function getHeatColor(changePercent: number): string {
    const intensity = Math.min(Math.abs(changePercent) / 4, 1);

    if (changePercent > 0.05) {
        const lightness = 30 - intensity * 8;
        return `hsl(153 70% ${lightness}%)`;
    }

    if (changePercent < -0.05) {
        const lightness = 34 - intensity * 8;
        return `hsl(0 69% ${lightness}%)`;
    }

    return '#374151';
}

function getNodeValue<T>(node: TreemapNode, key: string): T | undefined {
    return node[key] as T | undefined;
}

function HeatmapTile(node: TreemapNode) {
    if (node.depth === 0) return <g />;

    if (node.children?.length) {
        const sector = getNodeValue<string>(node, 'sector') || node.name;
        return (
            <g className="market-heatmap__sector-group" data-sector={sector} pointerEvents="none">
                <rect
                    x={node.x + 1}
                    y={node.y + 1}
                    width={Math.max(node.width - 2, 0)}
                    height={Math.max(node.height - 2, 0)}
                    rx={7}
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.28)"
                    strokeWidth={2}
                >
                    <title>{`${sector} · Peso ${node.value.toLocaleString('es-ES', { maximumFractionDigits: 1 })}% · ${node.children.length} valores`}</title>
                </rect>
            </g>
        );
    }

    const symbol = getNodeValue<string>(node, 'displaySymbol') || getNodeValue<string>(node, 'symbol') || '';
    const companyName = getNodeValue<string>(node, 'name') || node.name;
    const changePercent = getNodeValue<number>(node, 'changePercent') || 0;
    const weight = getNodeValue<number>(node, 'weight') || node.value;
    const sector = getNodeValue<string>(node, 'sector') || '';
    const country = getNodeValue<string>(node, 'country') || '';
    const showSymbol = node.width >= 38 && node.height >= 24;
    const showChange = node.width >= 62 && node.height >= 42;
    const showName = node.width >= 112 && node.height >= 66;
    const centerX = node.x + node.width / 2;
    const centerY = node.y + node.height / 2;

    return (
        <g className="market-heatmap__tile">
            <rect
                x={node.x + 1}
                y={node.y + 1}
                width={Math.max(node.width - 2, 0)}
                height={Math.max(node.height - 2, 0)}
                rx={5}
                fill={getHeatColor(changePercent)}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth={1}
            >
                <title>{`${companyName} (${symbol}) · ${formatPercent(changePercent)} · Peso ${weight.toLocaleString('es-ES', { maximumFractionDigits: 2 })}% · ${sector} · ${country}`}</title>
            </rect>
            {showSymbol && (
                <text
                    x={centerX}
                    y={centerY - (showName ? 12 : showChange ? 7 : -4)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="market-heatmap__tile-symbol"
                    pointerEvents="none"
                >
                    {symbol}
                </text>
            )}
            {showName && (
                <text
                    x={centerX}
                    y={centerY + 3}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="market-heatmap__tile-name"
                    pointerEvents="none"
                >
                    {companyName.length > 20 ? `${companyName.slice(0, 18)}…` : companyName}
                </text>
            )}
            {showChange && (
                <text
                    x={centerX}
                    y={centerY + (showName ? 20 : 10)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="market-heatmap__tile-change"
                    pointerEvents="none"
                >
                    {formatPercent(changePercent)}
                </text>
            )}
        </g>
    );
}

async function fetchQuotesWithLimit(symbols: string[], signal: AbortSignal): Promise<Record<string, StockQuote>> {
    const quotes: Record<string, StockQuote> = {};
    let nextIndex = 0;

    const worker = async () => {
        while (nextIndex < symbols.length && !signal.aborted) {
            const symbol = symbols[nextIndex];
            nextIndex += 1;

            try {
                const quote = await getQuote(symbol, signal);
                if (quote) quotes[symbol] = quote;
            } catch {
                if (signal.aborted) return;
            }
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(CONCURRENT_REQUESTS, symbols.length) }, () => worker()),
    );

    return quotes;
}

export function MarketHeatmap() {
    const [selectedIndex, setSelectedIndex] = useState<MarketHeatmapIndexId>('sp500');
    const [loadedQuotes, setLoadedQuotes] = useState<Partial<Record<MarketHeatmapIndexId, LoadedIndexQuotes>>>({});
    const [loadingIndex, setLoadingIndex] = useState<MarketHeatmapIndexId | null>(null);
    const [completingIndex, setCompletingIndex] = useState<MarketHeatmapIndexId | null>(null);
    const [errorIndex, setErrorIndex] = useState<MarketHeatmapIndexId | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<MarketHeatmapDatum | null>(null);
    const [sectorLabelPositions, setSectorLabelPositions] = useState<MarketHeatmapSectorLabel[]>([]);
    const [displayCount, setDisplayCount] = useState<number | 'all'>('all');
    const controllerRef = useRef<AbortController | null>(null);
    const holdingsCacheRef = useRef<Partial<Record<MarketHeatmapIndexId, MarketHeatmapConstituent[]>>>({});
    const canvasRef = useRef<HTMLDivElement | null>(null);

    const indexDefinition = MARKET_HEATMAP_INDEX_BY_ID[selectedIndex];
    const currentQuotes = loadedQuotes[selectedIndex];
    const isLoading = loadingIndex === selectedIndex;
    const isCompleting = completingIndex === selectedIndex;
    const hasError = errorIndex === selectedIndex;

    const loadIndex = useCallback(async (indexId: MarketHeatmapIndexId, forceHoldings = false) => {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        const definition = MARKET_HEATMAP_INDEX_BY_ID[indexId];

        setLoadingIndex(indexId);
        setCompletingIndex(null);
        setErrorIndex(null);

        try {
            let constituents = !forceHoldings ? holdingsCacheRef.current[indexId] : undefined;
            if (!constituents) {
                constituents = await loadMarketIndexHoldings(definition, controller.signal);
                holdingsCacheRef.current[indexId] = constituents;
            }
            if (controller.signal.aborted) return;

            const symbols = [definition.proxySymbol, ...constituents.map((item) => item.symbol)];
            const sparkQuotes = await getQuotesYahooSpark(symbols, controller.signal);
            if (controller.signal.aborted) return;

            const quotes = Object.fromEntries(sparkQuotes.map((quote) => [quote.symbol, quote]));
            const loadedConstituents = constituents.filter((item) => quotes[item.symbol]).length;
            const initialMissing = constituents.length - loadedConstituents;
            setLoadedQuotes((previous) => ({
                ...previous,
                [indexId]: {
                    quotes,
                    constituents,
                    loadedAt: Date.now(),
                    missingCount: initialMissing,
                },
            }));
            setErrorIndex(loadedConstituents === 0 ? indexId : null);
            setLoadingIndex(null);

            const missingSymbols = constituents
                .filter((item) => !quotes[item.symbol])
                .map((item) => item.symbol);
            if (missingSymbols.length === 0) return;

            setCompletingIndex(indexId);
            const fallbackQuotes = await fetchQuotesWithLimit(missingSymbols, controller.signal);
            if (controller.signal.aborted) return;

            setLoadedQuotes((previous) => {
                const current = previous[indexId];
                if (!current) return previous;
                const mergedQuotes = { ...current.quotes, ...fallbackQuotes };
                return {
                    ...previous,
                    [indexId]: {
                        ...current,
                        quotes: mergedQuotes,
                        missingCount: current.constituents.filter((item) => !mergedQuotes[item.symbol]).length,
                    },
                };
            });
            setCompletingIndex(null);
        } catch {
            if (controller.signal.aborted) return;
            setErrorIndex(indexId);
            setLoadingIndex(null);
            setCompletingIndex(null);
        }
    }, []);

    useEffect(() => {
        if (!loadedQuotes[selectedIndex] && loadingIndex !== selectedIndex) {
            const timeoutId = window.setTimeout(() => void loadIndex(selectedIndex), 0);
            return () => window.clearTimeout(timeoutId);
        }
    }, [loadIndex, loadedQuotes, loadingIndex, selectedIndex]);

    useEffect(() => () => controllerRef.current?.abort(), []);

    const visibleConstituents = useMemo(() => {
        const constituents = currentQuotes?.constituents || [];
        return displayCount === 'all' ? constituents : constituents.slice(0, displayCount);
    }, [currentQuotes, displayCount]);

    const heatmapData = useMemo<MarketHeatmapDatum[]>(() => {
        if (!currentQuotes) return [];

        return visibleConstituents.flatMap((constituent) => {
            const quote = currentQuotes.quotes[constituent.symbol];
            if (!quote || !Number.isFinite(quote.changePercent)) return [];

            return [{
                ...constituent,
                value: constituent.weight,
                changePercent: quote.changePercent,
                price: quote.price,
                currency: quote.currency || '',
            }];
        });
    }, [currentQuotes, visibleConstituents]);

    const sectorGroups = useMemo<MarketHeatmapSectorGroup[]>(() => {
        const groups = new Map<string, MarketHeatmapDatum[]>();

        heatmapData.forEach((item) => {
            const sector = item.sector || 'Otros';
            const sectorItems = groups.get(sector) || [];
            sectorItems.push(item);
            groups.set(sector, sectorItems);
        });

        return Array.from(groups.entries())
            .map(([sector, children]) => ({
                name: sector,
                sector,
                value: children.reduce((sum, item) => sum + item.weight, 0),
                children,
            }))
            .sort((left, right) => right.value - left.value);
    }, [heatmapData]);

    const sectorSummary = useMemo<MarketHeatmapSectorSummary[]>(() => (
        sectorGroups.map((group) => ({
            sector: group.sector,
            weight: group.value,
            count: group.children.length,
            changePercent: group.children.reduce(
                (sum, item) => sum + item.weight * item.changePercent,
                0,
            ) / (group.value || 1),
        }))
    ), [sectorGroups]);

    const coverageWeight = useMemo(
        () => heatmapData.reduce((sum, item) => sum + item.weight, 0),
        [heatmapData],
    );
    const proxyQuote = currentQuotes?.quotes[indexDefinition.proxySymbol];
    const advancers = heatmapData.filter((item) => item.changePercent > 0.05).length;
    const decliners = heatmapData.filter((item) => item.changePercent < -0.05).length;
    const strongest = heatmapData.reduce<MarketHeatmapDatum | null>(
        (best, item) => (!best || item.changePercent > best.changePercent ? item : best),
        null,
    );
    const weakest = heatmapData.reduce<MarketHeatmapDatum | null>(
        (worst, item) => (!worst || item.changePercent < worst.changePercent ? item : worst),
        null,
    );

    const handleTreemapClick = (node: TreemapNode) => {
        const symbol = getNodeValue<string>(node, 'symbol');
        if (!symbol) return;
        setSelectedCompany(heatmapData.find((item) => item.symbol === symbol) || null);
    };

    const handleIndexChange = (indexId: MarketHeatmapIndexId) => {
        controllerRef.current?.abort();
        setLoadingIndex(null);
        setCompletingIndex(null);
        setSelectedCompany(null);
        setSelectedIndex(indexId);
    };

    const syncSectorLabelPositions = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasBounds = canvas.getBoundingClientRect();
        const positions = Array.from(
            canvas.querySelectorAll<SVGGElement>('.recharts-treemap-depth-1'),
        ).flatMap((node) => {
            const sectorGroup = node.querySelector<SVGGElement>('.market-heatmap__sector-group');
            const sector = sectorGroup?.dataset.sector;
            if (!sector) return [];

            const bounds = node.getBoundingClientRect();
            if (bounds.width <= 0 || bounds.height <= 0) return [];

            return [{
                sector,
                x: bounds.left - canvasBounds.left,
                y: bounds.top - canvasBounds.top,
                width: bounds.width,
                height: bounds.height,
            }];
        });

        setSectorLabelPositions(positions);
    }, []);

    useEffect(() => {
        if (heatmapData.length === 0) {
            const frameId = window.requestAnimationFrame(() => setSectorLabelPositions([]));
            return () => window.cancelAnimationFrame(frameId);
        }

        const frameId = window.requestAnimationFrame(syncSectorLabelPositions);
        const timeoutId = window.setTimeout(syncSectorLabelPositions, 520);
        const canvas = canvasRef.current;
        const resizeObserver = canvas && typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(syncSectorLabelPositions)
            : null;

        if (resizeObserver && canvas) {
            resizeObserver.observe(canvas);
        }

        return () => {
            window.cancelAnimationFrame(frameId);
            window.clearTimeout(timeoutId);
            resizeObserver?.disconnect();
        };
    }, [heatmapData, syncSectorLabelPositions]);

    return (
        <div className="market-heatmap">
            <header className="market-heatmap__header">
                <div className="market-heatmap__eyebrow"><PanelsTopLeft size={16} /> Mercados</div>
                <h1>Heatmap de mercados</h1>
                <p>Compara el movimiento diario de las principales compañías por su peso dentro de cada índice.</p>
            </header>

            <section className="market-heatmap__workspace" aria-labelledby="market-heatmap-index-title">
                <div className="market-heatmap__toolbar">
                    <div>
                        <span className="market-heatmap__toolbar-label" id="market-heatmap-index-title">Índice</span>
                        <div className="market-heatmap__tabs" role="tablist" aria-label="Seleccionar índice">
                            {MARKET_HEATMAP_INDICES.map((index) => (
                                <button
                                    key={index.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={selectedIndex === index.id}
                                    className={`market-heatmap__tab ${selectedIndex === index.id ? 'market-heatmap__tab--active' : ''}`}
                                    onClick={() => handleIndexChange(index.id)}
                                >
                                    {index.shortLabel}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <span className="market-heatmap__toolbar-label">Detalle</span>
                        <div className="market-heatmap__display-options" role="group" aria-label="Número de componentes visibles">
                            {DISPLAY_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    aria-pressed={displayCount === option.value}
                                    className={`market-heatmap__display-option ${displayCount === option.value ? 'market-heatmap__display-option--active' : ''}`}
                                    onClick={() => {
                                        setDisplayCount(option.value);
                                        setSelectedCompany(null);
                                    }}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="market-heatmap__index-intro">
                    <div>
                        <h2>{indexDefinition.label}</h2>
                        <p>{indexDefinition.description}</p>
                    </div>
                    <span>{(currentQuotes?.constituents.length || indexDefinition.totalHoldings).toLocaleString('es-ES')} componentes</span>
                </div>

                <div className="market-heatmap__metrics" aria-live="polite">
                    <div className="market-heatmap__metric">
                        <span>ETF de referencia · {indexDefinition.proxySymbol}</span>
                        <strong className={proxyQuote && proxyQuote.changePercent < 0 ? 'is-negative' : proxyQuote && proxyQuote.changePercent > 0 ? 'is-positive' : ''}>
                            {proxyQuote ? formatPercent(proxyQuote.changePercent) : isLoading ? 'Cargando…' : 'N/D'}
                        </strong>
                    </div>
                    <div className="market-heatmap__metric">
                        <span>Avanzan</span>
                        <strong className="is-positive"><TrendingUp size={16} /> {advancers}</strong>
                    </div>
                    <div className="market-heatmap__metric">
                        <span>Caen</span>
                        <strong className="is-negative"><TrendingDown size={16} /> {decliners}</strong>
                    </div>
                    <div className="market-heatmap__metric">
                        <span>Peso representado</span>
                        <strong>{coverageWeight.toLocaleString('es-ES', { maximumFractionDigits: 1 })}%</strong>
                    </div>
                </div>

                <div
                    ref={canvasRef}
                    className="market-heatmap__canvas"
                    aria-label={`Mapa de calor de ${indexDefinition.label}`}
                >
                    {isLoading && heatmapData.length === 0 && (
                        <div className="market-heatmap__loading">
                            <RefreshCw size={24} className="market-heatmap__refresh-icon--spinning" />
                            <span>Cargando composición y cotizaciones de {indexDefinition.label}…</span>
                        </div>
                    )}

                    {hasError && !isLoading && (
                        <div className="market-heatmap__error">
                            <AlertTriangle size={24} />
                            <strong>No se pudieron cargar las cotizaciones.</strong>
                            <span>Comprueba la conexión o que los datos de mercado estén activados en Configuración.</span>
                            <button type="button" onClick={() => void loadIndex(selectedIndex)}>Reintentar</button>
                        </div>
                    )}

                    {heatmapData.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%">
                            <Treemap
                                data={sectorGroups}
                                dataKey="value"
                                nameKey="name"
                                aspectRatio={4 / 3}
                                content={HeatmapTile}
                                onClick={handleTreemapClick}
                                onAnimationEnd={syncSectorLabelPositions}
                                animationDuration={450}
                            />
                        </ResponsiveContainer>
                    )}

                    <div className="market-heatmap__sector-label-layer" aria-hidden="true">
                        {sectorLabelPositions.map((label) => {
                            const isReadable = label.width >= 88 && label.height >= 34;
                            if (!isReadable) return null;

                            return (
                                <span
                                    key={label.sector}
                                    className="market-heatmap__sector-label"
                                    style={{
                                        left: `${Math.max(label.x + 8, 5)}px`,
                                        top: `${Math.max(label.y + 8, 5)}px`,
                                        maxWidth: `${Math.max(label.width - 16, 72)}px`,
                                    }}
                                    title={label.sector}
                                >
                                    {label.sector}
                                </span>
                            );
                        })}
                    </div>
                </div>

                <div className="market-heatmap__legend" aria-label="Escala de rendimiento diario">
                    <span>-4% o menos</span>
                    <div className="market-heatmap__legend-scale" />
                    <span>+4% o más</span>
                </div>

                {isCompleting && currentQuotes?.missingCount ? (
                    <p className="market-heatmap__completion-status" aria-live="polite">
                        Completando {currentQuotes.missingCount.toLocaleString('es-ES')} cotizaciones con la fuente alternativa…
                    </p>
                ) : null}

                {sectorSummary.length > 0 && (
                    <section className="market-heatmap__sector-summary" aria-label="Resumen por sectores">
                        <div className="market-heatmap__sector-summary-header">
                            <div>
                                <span className="market-heatmap__toolbar-label">Sectores</span>
                                <p>El mapa agrupa las compañías por sector y las ordena por peso.</p>
                            </div>
                            <span>{sectorSummary.length} grupos</span>
                        </div>
                        <div className="market-heatmap__sector-list">
                            {sectorSummary.map((sector) => (
                                <div className="market-heatmap__sector-item" key={sector.sector}>
                                    <strong>{sector.sector}</strong>
                                    <span>{sector.weight.toLocaleString('es-ES', { maximumFractionDigits: 1 })}%</span>
                                    <small>{sector.count.toLocaleString('es-ES')} valores · <b className={sector.changePercent < 0 ? 'is-negative' : 'is-positive'}>{formatPercent(sector.changePercent)}</b></small>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {(selectedCompany || strongest || weakest) && (
                    <div className="market-heatmap__details" aria-live="polite">
                        {selectedCompany ? (
                            <div className="market-heatmap__selected-company">
                                <span>Selección</span>
                                <strong>{selectedCompany.name} · {selectedCompany.displaySymbol || selectedCompany.symbol}</strong>
                                <small>{selectedCompany.sector} · {selectedCompany.country} · peso {selectedCompany.weight.toLocaleString('es-ES', { maximumFractionDigits: 2 })}%</small>
                                <b className={selectedCompany.changePercent < 0 ? 'is-negative' : 'is-positive'}>{formatPercent(selectedCompany.changePercent)}</b>
                            </div>
                        ) : (
                            <p className="market-heatmap__selection-hint">Selecciona una compañía para ver su detalle.</p>
                        )}
                        <div className="market-heatmap__extremes">
                            {strongest && <span><TrendingUp size={14} /> Mayor subida: <strong>{strongest.displaySymbol || strongest.symbol} {formatPercent(strongest.changePercent)}</strong></span>}
                            {weakest && <span><TrendingDown size={14} /> Mayor caída: <strong>{weakest.displaySymbol || weakest.symbol} {formatPercent(weakest.changePercent)}</strong></span>}
                        </div>
                    </div>
                )}

                <footer className="market-heatmap__footer">
                    <p>
                        El tamaño representa el peso en el índice y el color, la variación de la última sesión disponible.
                        {currentQuotes
                            ? ` Se muestran ${visibleConstituents.length.toLocaleString('es-ES')} de ${currentQuotes.constituents.length.toLocaleString('es-ES')} componentes obtenidos de la composición oficial.`
                            : ''}
                        {currentQuotes?.missingCount && !isCompleting ? ` ${currentQuotes.missingCount.toLocaleString('es-ES')} cotizaciones no estaban disponibles tras la segunda consulta.` : ''}
                    </p>
                    <div>
                        {currentQuotes && <span>Actualizado {new Date(currentQuotes.loadedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>}
                        <span>Pesos a {indexDefinition.holdingsAsOf}</span>
                        <a href={indexDefinition.sourceUrl} target="_blank" rel="noreferrer">
                            {indexDefinition.sourceLabel} <ExternalLink size={13} />
                        </a>
                    </div>
                </footer>
            </section>

            <div className="market-heatmap__floating-actions" aria-label="Acciones del heatmap">
                <Button
                    variant="secondary"
                    onClick={() => void loadIndex(selectedIndex, true)}
                    icon={<RefreshCw size={18} className={isLoading || isCompleting ? 'market-heatmap__refresh-icon--spinning' : ''} />}
                    size="sm"
                    className="market-heatmap__floating-refresh"
                    disabled={isLoading || isCompleting}
                    aria-label={isLoading || isCompleting ? 'Actualizando heatmap' : 'Actualizar heatmap'}
                    title={isLoading || isCompleting ? 'Actualizando heatmap' : 'Actualizar heatmap'}
                />
            </div>
        </div>
    );
}
