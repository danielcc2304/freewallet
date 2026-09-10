import { useMemo } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Coins, Gauge, Layers3, ShieldCheck, WalletCards } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader } from '../ui';
import { getHistory, getTransactions } from '../../services/storageService';
import type { Asset, PortfolioHistoryPoint } from '../../types/types';
import './PortfolioAnalytics.css';

function currency(value: number): string {
    return value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
}

function percent(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toLocaleString('es-ES', { maximumFractionDigits: 2 })}%`;
}

function dailySeries(history: PortfolioHistoryPoint[]) {
    const byDay = new Map<string, PortfolioHistoryPoint>();
    [...history].sort((a, b) => a.date.localeCompare(b.date)).forEach((point) => {
        byDay.set(point.date.slice(0, 10), point);
    });
    const rows = [...byDay.entries()];
    const base = rows[0]?.[1].invested || rows[0]?.[1].value || 0;
    return rows.map(([date, point], index) => {
        const previous = index > 0 ? rows[index - 1][1].value : point.invested;
        const dailyReturn = previous > 0 ? ((point.value / previous) - 1) * 100 : 0;
        const cumulativeReturn = base > 0 ? ((point.value / base) - 1) * 100 : 0;
        return { date, value: point.value, invested: point.invested, dailyReturn, cumulativeReturn };
    });
}

export function PortfolioAnalytics({ assets }: { assets: Asset[] }) {
    const analytics = useMemo(() => {
        const history = getHistory();
        const series = dailySeries(history);
        const transactions = getTransactions();
        const currentValue = assets.reduce((sum, asset) => sum + (asset.currentPrice || asset.purchasePrice) * asset.quantity, 0);
        const invested = assets.reduce((sum, asset) => sum + asset.purchasePrice * asset.quantity, 0);
        const totalReturn = invested > 0 ? ((currentValue / invested) - 1) * 100 : 0;
        const returns = series.slice(1).map((point) => point.dailyReturn).filter(Number.isFinite);
        const mean = returns.length ? returns.reduce((sum, value) => sum + value, 0) / returns.length : 0;
        const variance = returns.length > 1 ? returns.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (returns.length - 1) : 0;
        const volatility = Math.sqrt(variance) * Math.sqrt(252);
        let peak = 0;
        let maxDrawdown = 0;
        series.forEach((point) => {
            peak = Math.max(peak, point.value);
            if (peak > 0) maxDrawdown = Math.min(maxDrawdown, ((point.value / peak) - 1) * 100);
        });
        const firstDate = series[0] ? new Date(series[0].date).getTime() : 0;
        const years = firstDate ? Math.max((Date.now() - firstDate) / (365.25 * 24 * 60 * 60 * 1000), 1 / 365.25) : 0;
        const annualized = years && totalReturn > -100 ? ((Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100) : 0;
        const buys = transactions.filter((transaction) => transaction.type === 'buy').reduce((sum, transaction) => sum + (transaction.total || 0), 0);
        const sells = transactions.filter((transaction) => transaction.type === 'sell').reduce((sum, transaction) => sum + (transaction.total || 0), 0);
        const positiveDays = returns.length ? returns.filter((value) => value > 0).length / returns.length * 100 : 0;
        const allocations = Array.from(assets.reduce((map, asset) => {
            const value = (asset.currentPrice || asset.purchasePrice) * asset.quantity;
            map.set(asset.type, (map.get(asset.type) || 0) + value);
            return map;
        }, new Map<string, number>())).sort((a, b) => b[1] - a[1]);
        const leaders = assets.map((asset) => ({
            symbol: asset.symbol,
            name: asset.name,
            value: (asset.currentPrice || asset.purchasePrice) * asset.quantity,
        })).sort((a, b) => b.value - a.value).slice(0, 5);

        return { series, totalReturn, annualized, volatility, maxDrawdown, buys, sells, positiveDays, allocations, leaders, currentValue };
    }, [assets]);

    const staleAssets = assets.filter((asset) => !asset.lastQuoteAt || Date.now() - new Date(asset.lastQuoteAt).getTime() > 15 * 60 * 1000);
    const largestWeight = analytics.currentValue > 0 && analytics.leaders[0] ? analytics.leaders[0].value / analytics.currentValue * 100 : 0;
    const alerts = [
        ...(largestWeight > 35 ? [`${analytics.leaders[0]?.symbol} concentra ${largestWeight.toFixed(1)}% de la cartera`] : []),
        ...(staleAssets.length ? [`${staleAssets.length} posición${staleAssets.length > 1 ? 'es' : ''} sin cotización reciente`] : []),
        ...(analytics.series.length < 2 ? ['Aún hay poco histórico para medir riesgo'] : []),
    ];

    return (
        <Card className="portfolio-analytics">
            <CardHeader title="Análisis avanzado" subtitle="Rentabilidad, riesgo y control operativo de la cartera viva" />
            <CardContent>
                <div className="portfolio-analytics__kpis">
                    <div><ArrowUpRight size={17} /><span>Rentabilidad total</span><strong className={analytics.totalReturn >= 0 ? 'is-positive' : 'is-negative'}>{percent(analytics.totalReturn)}</strong></div>
                    <div><Gauge size={17} /><span>Rentabilidad anualizada</span><strong>{analytics.series.length > 1 ? percent(analytics.annualized) : 'N/D'}</strong></div>
                    <div><BarChart3 size={17} /><span>Volatilidad anualizada</span><strong>{analytics.series.length > 1 ? `${analytics.volatility.toFixed(2)}%` : 'N/D'}</strong></div>
                    <div><ArrowDownRight size={17} /><span>Máximo drawdown</span><strong className="is-negative">{analytics.series.length > 1 ? `${analytics.maxDrawdown.toFixed(2)}%` : 'N/D'}</strong></div>
                    <div><ShieldCheck size={17} /><span>Días positivos</span><strong>{analytics.series.length > 1 ? `${analytics.positiveDays.toFixed(0)}%` : 'N/D'}</strong></div>
                    <div><WalletCards size={17} /><span>Compras registradas</span><strong>{currency(analytics.buys)}</strong></div>
                    <div><Coins size={17} /><span>Ventas registradas</span><strong>{currency(analytics.sells)}</strong></div>
                </div>

                <div className="portfolio-analytics__body">
                    <section className="portfolio-analytics__chart">
                        <h3>Rentabilidad acumulada</h3>
                        {analytics.series.length > 1 ? (
                            <ResponsiveContainer width="100%" height={230}>
                                <AreaChart data={analytics.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <defs><linearGradient id="analyticsReturn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={(value) => value.slice(5)} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={(value) => `${value}%`} width={45} />
                                    <Tooltip formatter={(value) => [typeof value === 'number' ? `${value.toFixed(2)}%` : 'N/D', 'Rentabilidad']} />
                                    <Area type="monotone" dataKey="cumulativeReturn" stroke="#10b981" fill="url(#analyticsReturn)" strokeWidth={2} name="Rentabilidad acumulada" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : <div className="portfolio-analytics__empty">Necesitamos más snapshots para calcular riesgo y rentabilidad histórica.</div>}
                    </section>
                    <section className="portfolio-analytics__allocation">
                        <h3><Layers3 size={16} /> Distribución por tipo</h3>
                        {analytics.allocations.map(([type, value]) => (
                            <div className="portfolio-analytics__allocation-row" key={type}>
                                <span>{type}</span><div><i style={{ width: `${analytics.currentValue ? value / analytics.currentValue * 100 : 0}%` }} /></div><strong>{analytics.currentValue ? (value / analytics.currentValue * 100).toFixed(1) : '0.0'}%</strong>
                            </div>
                        ))}
                        <h3 className="portfolio-analytics__leaders-title">Mayores posiciones</h3>
                        {analytics.leaders.map((leader) => <div className="portfolio-analytics__leader" key={leader.symbol}><span><strong>{leader.symbol}</strong><small>{leader.name}</small></span><b>{currency(leader.value)}</b></div>)}
                    </section>
                </div>

                <div className={`portfolio-analytics__alerts ${alerts.length ? 'has-alerts' : ''}`}>
                    {alerts.length ? <><AlertTriangle size={17} /><div><strong>Revisiones recomendadas</strong>{alerts.map((alert) => <span key={alert}>{alert}</span>)}</div></> : <><ShieldCheck size={17} /><div><strong>Sin alertas de control</strong><span>La cartera tiene cotizaciones recientes y no supera el umbral de concentración.</span></div></>}
                </div>
            </CardContent>
        </Card>
    );
}
