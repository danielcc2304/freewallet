import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Shield, TrendingUp, AlertTriangle, Target, Calculator, Info } from 'lucide-react';
import './AssetAllocationSim.css';

export function AssetAllocationSim() {
    // Assets allocation (%)
    const [stocks, setStocks] = useState(60);
    const [bonds, setBonds] = useState(30);
    const [crypto, setCrypto] = useState(5);
    const [cash, setCash] = useState(5);

    // Derived values
    const total = stocks + bonds + crypto + cash;
    const isOver100 = total > 100;

    // Simplified stats for assets
    // [Expected Return, Volatility/Risk]
    const ASSET_STATS = {
        stocks: { return: 0.08, risk: 0.15, label: 'Renta Variable' },
        bonds: { return: 0.03, risk: 0.05, label: 'Renta Fija' },
        crypto: { return: 0.20, risk: 0.80, label: 'Criptoactivos' },
        cash: { return: 0.01, risk: 0.00, label: 'Efectivo' }
    };

    const portfolioStats = useMemo(() => {
        const s = stocks / 100;
        const b = bonds / 100;
        const cr = crypto / 100;
        const ca = cash / 100;

        const expectedReturn = (s * ASSET_STATS.stocks.return) +
            (b * ASSET_STATS.bonds.return) +
            (cr * ASSET_STATS.crypto.return) +
            (ca * ASSET_STATS.cash.return);

        // Simple weighted volatility (not accounting for correlations for simplicity)
        const expectedRisk = (s * ASSET_STATS.stocks.risk) +
            (b * ASSET_STATS.bonds.risk) +
            (cr * ASSET_STATS.crypto.risk) +
            (ca * ASSET_STATS.cash.risk);

        return {
            return: expectedReturn * 100,
            risk: expectedRisk * 100
        };
    }, [stocks, bonds, crypto, cash]);

    const chartData = [
        { name: 'Acciones', value: stocks, color: '#3b82f6' },
        { name: 'Bonos', value: bonds, color: '#10b981' },
        { name: 'Cripto', value: crypto, color: '#f59e0b' },
        { name: 'Efectivo', value: cash, color: '#64748b' }
    ].filter(d => d.value > 0);

    const getRiskLabel = (risk: number) => {
        if (risk < 5) return { label: 'Conservador', color: '#10b981', icon: Shield };
        if (risk < 10) return { label: 'Moderado', color: '#3b82f6', icon: Target };
        if (risk < 15) return { label: 'Decidido', color: '#8b5cf6', icon: TrendingUp };
        return { label: 'Agresivo', color: '#ef4444', icon: AlertTriangle };
    };

    const riskInfo = getRiskLabel(portfolioStats.risk);
    const RiskIcon = riskInfo.icon;

    return (
        <div className="alloc-sim">
            <header className="alloc-sim__header">
                <div className="alloc-sim__title-group">
                    <div className="alloc-sim__icon-container">
                        <Calculator className="alloc-sim__title-icon" />
                    </div>
                    <div>
                        <h1 className="alloc-sim__title">Simulador de Cartera</h1>
                        <p className="alloc-sim__subtitle">Diseña tu asset allocation y entiende el perfil de riesgo.</p>
                    </div>
                </div>
            </header>

            <div className="alloc-sim__grid">
                <aside className="alloc-sim__sliders">
                    <div className="alloc-sim__card">
                        <div className="alloc-sim__total-check">
                            <span className="label">Total Asignado</span>
                            <span className={`value ${isOver100 ? 'error' : ''} ${total === 100 ? 'success' : ''}`}>
                                {total}%
                            </span>
                        </div>
                        {isOver100 && <p className="alloc-sim__error-msg">⚠️ El total supera el 100%</p>}
                    </div>

                    <div className="alloc-sim__slider-group">
                        <div className="slider-header">
                            <label>Renta Variable (Stocks)</label>
                            <span>{stocks}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={stocks} onChange={(e) => setStocks(Number(e.target.value))} />
                    </div>

                    <div className="alloc-sim__slider-group">
                        <div className="slider-header">
                            <label>Renta Fija (Bonds)</label>
                            <span>{bonds}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={bonds} onChange={(e) => setBonds(Number(e.target.value))} />
                    </div>

                    <div className="alloc-sim__slider-group">
                        <div className="slider-header">
                            <label>Criptoactivos</label>
                            <span>{crypto}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={crypto} onChange={(e) => setCrypto(Number(e.target.value))} />
                    </div>

                    <div className="alloc-sim__slider-group">
                        <div className="slider-header">
                            <label>Efectivo / Cash</label>
                            <span>{cash}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={cash} onChange={(e) => setCash(Number(e.target.value))} />
                    </div>

                    <button
                        className="alloc-sim__reset"
                        onClick={() => { setStocks(60); setBonds(30); setCrypto(5); setCash(5); }}
                    >
                        Resetear Cartera (60/40)
                    </button>
                </aside>

                <main className="alloc-sim__main">
                    <div className="alloc-sim__stats">
                        <div className="alloc-sim__stat-card">
                            <span className="label">Rentabilidad Esperada</span>
                            <span className="value">~{portfolioStats.return.toFixed(1)}%</span>
                            <p className="desc">Media anual histórica estimada</p>
                        </div>
                        <div className="alloc-sim__stat-card" style={{ borderColor: riskInfo.color }}>
                            <span className="label">Perfil de Riesgo</span>
                            <div className="risk-value" style={{ color: riskInfo.color }}>
                                <RiskIcon size={24} />
                                <span>{riskInfo.label}</span>
                            </div>
                            <p className="desc">Basado en la volatilidad ponderada</p>
                        </div>
                    </div>

                    <div className="alloc-sim__visuals">
                        <div className="alloc-sim__chart-box">
                            <h3 className="box-title">Distribución de Activos</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => `${value}%`}
                                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="alloc-sim__info-box">
                            <h3 className="box-title">¿Qué significa esto?</h3>
                            <div className="info-content">
                                <div className="info-item">
                                    <TrendingUp size={20} className="icon blue" />
                                    <p>Tu cartera busca un equilibrio entre <strong>crecimiento</strong> y <strong>estabilidad</strong>.</p>
                                </div>
                                <div className="info-item">
                                    <AlertTriangle size={20} className="icon orange" />
                                    <p>En un año malo, una cartera {riskInfo.label.toLowerCase()} puede caer un <strong>{portfolioStats.risk.toFixed(0)}%</strong> o más.</p>
                                </div>
                                <div className="info-item">
                                    <Info size={20} className="icon teal" />
                                    <p>Recuerda rebalancear una vez al año para mantener estos porcentajes.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="alloc-sim__disclaimer">
                        ⚠️ <strong>Simulación Educativa:</strong> Los rendimientos pasados no garantizan resultados futuros. Esta calculadora asume una correlación perfecta de 1 entre activos, lo cual es una simplificación extrema.
                    </div>
                </main>
            </div>
        </div>
    );
}
