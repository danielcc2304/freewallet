import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Gauge, Loader2, Scale, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui';
import { usePortfolio } from '../../context/PortfolioContext';
import { getHistory } from '../../services/storageService';
import { buildPortfolioAnalyticsHistory, performanceSeries } from '../../services/portfolioPerformance';
import { getAssetChartData } from '../../services/apiService';
import type { HistoricalDataPoint } from '../../types/types';
import './PortfolioBenchmark.css';

const percent = (value: number | null) => value === null || !Number.isFinite(value) ? 'N/D' : (value >= 0 ? '+' : '') + value.toLocaleString('es-ES', { maximumFractionDigits: 2 }) + '%';
const number = (value: number | null) => value === null || !Number.isFinite(value) ? 'N/D' : value.toLocaleString('es-ES', { maximumFractionDigits: 2 });

export function PortfolioBenchmark() {
    const { state: { assets, transactions, lastPriceUpdate } } = usePortfolio();
    const [benchmark, setBenchmark] = useState<HistoricalDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const controller = new AbortController();
        getAssetChartData('URTH', 'YTD', controller.signal)
            .then(data => { if (!controller.signal.aborted) setBenchmark(data); })
            .catch(() => { if (!controller.signal.aborted) setBenchmark([]); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [lastPriceUpdate]);

    const stats = useMemo(() => {
        const activeAssetIds = new Set(assets.map((asset) => asset.id));
        const portfolioTransactions = transactions.filter((transaction) => activeAssetIds.has(transaction.assetId));
        const currentValue = assets.reduce((sum, asset) => sum + (asset.currentPrice || asset.purchasePrice) * asset.quantity, 0);
        const investedValue = assets.reduce((sum, asset) => sum + asset.purchasePrice * asset.quantity, 0);
        const portfolioHistory = buildPortfolioAnalyticsHistory(getHistory(), portfolioTransactions, {
            date: new Date().toISOString(),
            value: currentValue,
            invested: investedValue,
        });
        const portfolio = performanceSeries(portfolioHistory, portfolioTransactions);
        const benchmarkByDate = new Map(benchmark.map(point => [point.date.slice(0, 10), point.close]));
        const aligned = portfolio.filter(point => benchmarkByDate.has(point.date));
        const pairs = aligned.slice(1).flatMap((point, index) => {
            const previous = aligned[index];
            const market = benchmarkByDate.get(point.date);
            const previousMarket = benchmarkByDate.get(previous.date);
            if (point.dailyReturn === null || !market || !previousMarket) return [];
            return [{ portfolio: point.dailyReturn / 100, market: market / previousMarket - 1 }];
        });
        const portfolioReturn = portfolio.length > 1 ? portfolio.at(-1)!.index / portfolio[0].index * 100 - 100 : null;
        const relevantBenchmark = benchmark.filter(point => !portfolio[0] || point.date.slice(0, 10) >= portfolio[0].date);
        const benchmarkReturn = relevantBenchmark.length > 1 ? relevantBenchmark.at(-1)!.close / relevantBenchmark[0].close * 100 - 100 : null;
        if (pairs.length < 3) return { portfolioReturn, benchmarkReturn, excess: portfolioReturn !== null && benchmarkReturn !== null ? portfolioReturn - benchmarkReturn : null, beta: null, correlation: null, trackingError: null, informationRatio: null };
        const avgP = pairs.reduce((s, p) => s + p.portfolio, 0) / pairs.length;
        const avgM = pairs.reduce((s, p) => s + p.market, 0) / pairs.length;
        const covariance = pairs.reduce((s, p) => s + (p.portfolio - avgP) * (p.market - avgM), 0) / (pairs.length - 1);
        const varP = pairs.reduce((s, p) => s + (p.portfolio - avgP) ** 2, 0) / (pairs.length - 1);
        const varM = pairs.reduce((s, p) => s + (p.market - avgM) ** 2, 0) / (pairs.length - 1);
        const beta = varM ? covariance / varM : null;
        const correlation = varP && varM ? covariance / Math.sqrt(varP * varM) : null;
        const active = pairs.map(p => p.portfolio - p.market);
        const avgActive = active.reduce((s, value) => s + value, 0) / active.length;
        const activeVariance = active.reduce((s, value) => s + (value - avgActive) ** 2, 0) / (active.length - 1);
        const trackingError = Math.sqrt(activeVariance) * Math.sqrt(252) * 100;
        return {
            portfolioReturn, benchmarkReturn,
            excess: portfolioReturn !== null && benchmarkReturn !== null ? portfolioReturn - benchmarkReturn : null,
            beta, correlation, trackingError,
            informationRatio: trackingError ? avgActive * 252 * 100 / trackingError : null,
        };
    }, [assets, benchmark, transactions]);

    const items = [
        { label: 'Tu cartera', value: percent(stats.portfolioReturn), icon: <TrendingUp size={17} /> },
        { label: 'MSCI World', value: percent(stats.benchmarkReturn), icon: <BarChart3 size={17} /> },
        { label: 'Diferencia', value: percent(stats.excess), icon: <Scale size={17} /> },
        { label: 'Beta', value: number(stats.beta), icon: <Gauge size={17} /> },
        { label: 'Correlación', value: number(stats.correlation), icon: <Activity size={17} /> },
        { label: 'Tracking error anual', value: percent(stats.trackingError), icon: <Activity size={17} /> },
        { label: 'Information ratio', value: number(stats.informationRatio), icon: <Gauge size={17} /> },
    ];
    return <Card className="portfolio-benchmark">
        <CardHeader title="Comparativa con MSCI World" subtitle="Referencia automática mediante el ETF URTH durante el histórico disponible de tu cartera" />
        <CardContent>
            {loading ? <div className="portfolio-benchmark__loading"><Loader2 className="spinning" size={18} /> Actualizando referencia…</div>
                : <div className="portfolio-benchmark__grid">{items.map(item => <div key={item.label}>{item.icon}<span>{item.label}</span><strong>{item.value}</strong></div>)}</div>}
            <p>Los ratios requieren al menos tres fechas coincidentes. URTH es una aproximación negociable al índice, por lo que puede existir diferencia de seguimiento.</p>
        </CardContent>
    </Card>;
}
