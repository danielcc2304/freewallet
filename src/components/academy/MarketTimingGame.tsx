import { useState, useEffect, useRef } from 'react';
import {
    TrendingUp, RotateCcw,
    Trophy, Info, ArrowLeft,
    TrendingDown, Zap, Lightbulb
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis,
    CartesianGrid, ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import './MarketTimingGame.css';

interface DataPoint {
    time: number;
    price: number;
}

export function MarketTimingGame() {
    const navigate = useNavigate();
    const [data, setData] = useState<DataPoint[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [cash, setCash] = useState(10000);
    const [shares, setShares] = useState(0);
    const [dcaShares, setDcaShares] = useState(0);
    const [timer, setTimer] = useState(0);

    const gameLoopRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const lastPriceRef = useRef(100);
    const tickRef = useRef(0);

    const STARTING_CASH = 10000;
    const MAX_TICKS = 100;
    const TICK_SPEED = 200; // ms

    const initGame = () => {
        const initialPoint = { time: 0, price: 100 };
        setData([initialPoint]);
        lastPriceRef.current = 100;
        tickRef.current = 0;
        setCash(STARTING_CASH);
        setShares(0);
        setDcaShares(0);
        setTimer(0);
        setIsFinished(false);
        setIsPlaying(true);
    };

    const stopGame = () => {
        setIsPlaying(false);
        setIsFinished(true);
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };

    useEffect(() => {
        if (isPlaying) {
            gameLoopRef.current = window.setInterval(() => {
                tickRef.current += 1;

                // Random walk price generation
                const change = (Math.random() - 0.48) * 4; // Slight upward bias
                const newPrice = Math.max(10, lastPriceRef.current + change);
                lastPriceRef.current = newPrice;

                setData(prev => [...prev, { time: tickRef.current, price: newPrice }]);
                setTimer(tickRef.current);

                // Automatic DCA calculation ($100 per tick)
                const dcaAmount = STARTING_CASH / MAX_TICKS;
                setDcaShares(prev => prev + (dcaAmount / newPrice));

                if (tickRef.current >= MAX_TICKS) {
                    stopGame();
                }
            }, TICK_SPEED);
        }
        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, [isPlaying]);

    const handleBuy = () => {
        if (!isPlaying || cash <= 0) return;
        const currentPrice = lastPriceRef.current;
        const affordableShares = cash / currentPrice;
        setShares(prev => prev + affordableShares);
        setCash(0);
    };

    const handleSell = () => {
        if (!isPlaying || shares <= 0) return;
        const currentPrice = lastPriceRef.current;
        const sellValue = shares * currentPrice;
        setCash(prev => prev + sellValue);
        setShares(0);
    };

    const currentPortfolioValue = cash + (shares * lastPriceRef.current);
    const dcaPortfolioValue = dcaShares * lastPriceRef.current;

    return (
        <div className="market-timing-game">
            <button onClick={() => navigate(-1)} className="valuation-guide__back" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '2rem' }}>
                <ArrowLeft size={18} /> Volver a Fundamentos
            </button>

            <header className="market-timing-game__header">
                <h1>Reto: Market Timing vs DCA</h1>
                <p>¿Crees que puedes ganarle al mercado? Intenta comprar barato y vender caro en este simulador de 20 segundos.</p>
            </header>

            <div className="market-timing-game__stats">
                <div className="game-stat">
                    <div className="game-stat__label">Tu Cartera (Market Timing)</div>
                    <div className="game-stat__value">{currentPortfolioValue.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</div>
                </div>
                <div className="game-stat">
                    <div className="game-stat__label">Estrategia DCA (Automático)</div>
                    <div className="game-stat__value" style={{ color: 'var(--accent-secondary)' }}>
                        {dcaPortfolioValue.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €
                    </div>
                </div>
                <div className="game-stat">
                    <div className="game-stat__label">Tiempo</div>
                    <div className="game-stat__value" style={{ color: '#ffc107' }}>
                        {((MAX_TICKS - timer) * TICK_SPEED / 1000).toFixed(1)}s
                    </div>
                </div>
            </div>

            <div className={`game-board ${(isPlaying || isFinished) ? 'game-board--active' : ''}`}>
                <div className="game-chart">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="time" hide domain={[0, MAX_TICKS]} />
                            <YAxis
                                hide
                                domain={['dataMin - 10', 'dataMax + 10']}
                            />
                            <Line
                                type="monotone"
                                dataKey="price"
                                stroke="var(--accent-primary)"
                                strokeWidth={3}
                                dot={false}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="game-controls">
                    {!isPlaying && !isFinished ? (
                        <button className="game-btn game-btn--buy" onClick={initGame}>
                            <Zap size={20} /> Empezar Desafío
                        </button>
                    ) : (
                        <>
                            <button
                                className="game-btn game-btn--buy"
                                onClick={handleBuy}
                                disabled={cash <= 0 || isFinished}
                            >
                                <TrendingUp size={20} /> COMPRAR TODO
                            </button>
                            <button
                                className="game-btn game-btn--sell"
                                onClick={handleSell}
                                disabled={shares <= 0 || isFinished}
                            >
                                <TrendingDown size={20} /> VENDER TODO
                            </button>
                        </>
                    )}
                </div>

                {isFinished && (
                    <div className="game-overlay">
                        <div className="game-results">
                            <Trophy size={48} color={currentPortfolioValue > dcaPortfolioValue ? "var(--accent-primary)" : "var(--text-secondary)"} style={{ marginBottom: '1rem' }} />
                            <h2>{currentPortfolioValue > dcaPortfolioValue ? "¡Has ganado al DCA!" : "El DCA te ha superado"}</h2>

                            <div className="comparison-grid">
                                <div className={`comparison-card ${currentPortfolioValue > dcaPortfolioValue ? 'comparison-card--winner' : ''}`}>
                                    <span className="comparison-label">Tu Estrategia</span>
                                    <span className="comparison-value">{currentPortfolioValue.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</span>
                                </div>
                                <div className={`comparison-card ${dcaPortfolioValue >= currentPortfolioValue ? 'comparison-card--winner' : ''}`}>
                                    <span className="comparison-label">Estrategia DCA</span>
                                    <span className="comparison-value">{dcaPortfolioValue.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</span>
                                </div>
                            </div>

                            <div className="lesson-card">
                                <Info size={24} color="var(--accent-primary)" />
                                <p>
                                    Intentar hacer "market timing" requiere suerte y estar pegado a la pantalla.
                                    El <strong>DCA (Dollar Cost Averaging)</strong> reduce el riesgo y suele ganar a largo plazo sin esfuerzo.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button className="game-btn game-btn--restart" onClick={initGame}>
                                    <RotateCcw size={18} /> Reintentar
                                </button>
                                <button className="game-btn game-btn--buy" onClick={() => navigate('/academy')}>
                                    Volver a la Academia
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="market-timing-game__theory" style={{ marginTop: '4rem' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Lightbulb color="var(--accent-primary)" /> La gran lección
                    </h2>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                        El <strong>Market Timing</strong> consiste en intentar predecir los suelos y techos del mercado.
                        Es psicológicamente agotador y, estadísticamente, la gran mayoría de inversores (incluidos profesionales)
                        fallan en el intento.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                        <div className="game-stat" style={{ textAlign: 'left' }}>
                            <div className="game-stat__label">Desventaja del Timing</div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Si te pierdes solo los 10 mejores días de una década, tu rentabilidad puede caer a la mitad.</p>
                        </div>
                        <div className="game-stat" style={{ textAlign: 'left' }}>
                            <div className="game-stat__label">Ventaja del DCA</div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Al invertir la misma cantidad cada mes, compras más participaciones cuando el mercado baja y menos cuando sube, promediando el coste.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MarketTimingGame;
