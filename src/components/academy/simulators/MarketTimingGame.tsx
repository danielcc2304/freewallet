import { useEffect, useReducer, useRef, useState } from 'react';
import { ArrowRight, Pause, Play, RotateCcw, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../../ui';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { createTimingGame, timingOrderAvailable, timingReducer, timingScore, timingValue, TIMING_RULES, type TradeFraction } from './marketTimingEngine';
import './MarketTimingGame.css';

const money = (value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);
const signedMoney = (value: number) => `${value > 0 ? '+' : ''}${money(value)}`;
const direction = (value: number) => value > 1 ? 'positive' : value < -1 ? 'negative' : '';

export function MarketTimingGame() {
    const [game, dispatch] = useReducer(timingReducer, undefined, createTimingGame);
    const [fraction, setFraction] = useState<TradeFraction>(0.5);
    const board = useRef<HTMLDivElement>(null);
    const resultsPanel = useRef<HTMLElement>(null);
    const running = game.phase === 'running';
    const paused = game.phase === 'paused';
    const ready = game.phase === 'ready';
    const finished = game.phase === 'finished';
    const roundEnded = game.phase === 'round-result' || finished;
    const price = game.history.at(-1)!.price;
    const playerValue = timingValue(game.player, price);
    const dcaValue = timingValue(game.dca, price);
    const edge = playerValue - dcaValue;
    const score = timingScore(game.results);
    const cooldown = Math.max(0, TIMING_RULES.cooldownTicks - (game.tick - game.lastTradeTick));
    const latestResult = game.results.at(-1);

    useEffect(() => {
        if (roundEnded) resultsPanel.current?.scrollIntoView({ block: 'nearest' });
    }, [roundEnded, game.round]);

    useEffect(() => {
        if (!running) return;
        const timer = window.setInterval(() => dispatch({ type: 'tick' }), TIMING_RULES.tickMs);
        return () => window.clearInterval(timer);
    }, [running, game.round]);

    useEffect(() => {
        const hide = () => { if (document.hidden) dispatch({ type: 'pause' }); };
        document.addEventListener('visibilitychange', hide);
        return () => document.removeEventListener('visibilitychange', hide);
    }, []);

    useEffect(() => {
        const shortcut = (event: KeyboardEvent) => {
            if (event.repeat || event.ctrlKey || event.metaKey || event.altKey
                || (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]'))) return;
            const key = event.key.toLowerCase();
            if (key === 'p' && (running || paused)) {
                event.preventDefault(); dispatch({ type: running ? 'pause' : 'resume' });
            } else if (running && (key === 'c' || key === 'v')) {
                event.preventDefault(); dispatch({ type: 'order', side: key === 'c' ? 'buy' : 'sell', fraction });
            }
        };
        window.addEventListener('keydown', shortcut);
        return () => window.removeEventListener('keydown', shortcut);
    }, [fraction, running, paused]);

    const start = () => {
        const seed = crypto.getRandomValues(new Uint32Array(1))[0];
        setFraction(0.5);
        dispatch({ type: 'start', seed });
        window.requestAnimationFrame(() => board.current?.scrollIntoView({ block: 'start' }));
    };

    const orderStatus = game.pending
        ? `${game.pending.side === 'buy' ? 'Compra' : 'Venta'} pendiente · ${((game.pending.executeAt - game.tick) * TIMING_RULES.tickMs / 1000).toFixed(1).replace('.', ',')} s`
        : game.trades.length >= TIMING_RULES.maxOrders ? 'Has usado las 8 órdenes de esta ronda.'
        : cooldown > 0 ? `Próxima orden en ${(cooldown * TIMING_RULES.tickMs / 1000).toFixed(1).replace('.', ',')} s`
        : game.tick + TIMING_RULES.delayTicks > TIMING_RULES.ticks ? 'Ya no hay tiempo para ejecutar otra orden.' : game.feedback;

    return (
        <div className="market-timing-game">
            <AcademyPageHeader className="market-timing-game__header" section="Herramientas">
                <h1>Reto: Market Timing vs DCA</h1>
                <p>Tres mercados distintos. El mismo capital. Tus decisiones frente a diez compras programadas.</p>
            </AcademyPageHeader>

            <p className="timing-goal"><Trophy size={18} aria-hidden="true" /> Gana 2 de 3 rondas y suma al menos 100 € de ventaja sobre el DCA.</p>

            <div className="timing-board" ref={board}>
                <div className="timing-round-header">
                    <span>Ronda {game.round} de {TIMING_RULES.rounds} · {score.wins} ganadas</span>
                    <span className="timing-clock">{paused ? 'En pausa · ' : ''}{((TIMING_RULES.ticks - game.tick) * TIMING_RULES.tickMs / 1000).toFixed(1).replace('.', ',')} s</span>
                </div>
                <progress className="timing-progress" max={TIMING_RULES.ticks} value={game.tick} aria-label="Progreso de la ronda" />

                <div className="timing-stats">
                    <div><span>Tu cartera</span><strong>{money(playerValue)}</strong></div>
                    <div><span>DCA</span><strong>{money(dcaValue)}</strong><small>Incluye el efectivo pendiente</small></div>
                    <div><span>Ventaja en esta ronda</span><strong className={direction(edge)}>{signedMoney(edge)}</strong></div>
                    <div><span>Órdenes usadas</span><strong>{game.trades.length + (game.pending ? 1 : 0)} / {TIMING_RULES.maxOrders}</strong></div>
                </div>

                {ready ? (
                    <div className="timing-intro">
                        <h2>Pon a prueba tus decisiones en tres rondas.</h2>
                        <p>Empiezas cada ronda con 10.000 €. El mercado puede cambiar de dirección; no conocerás las próximas cotizaciones.</p>
                        <p>Puedes invertir por partes. Cada orden tarda dos sesiones en ejecutarse y hay un breve descanso entre operaciones.</p>
                        <Button size="lg" icon={<Play size={18} />} onClick={start}>Empezar reto</Button>
                    </div>
                ) : (
                    <>
                        <div className="timing-quote"><span>Precio del activo · sesión {game.tick} / {TIMING_RULES.ticks}</span><strong>{money(price)}</strong></div>
                        <div className="timing-chart" aria-label="Evolución del precio simulado">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={game.history} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                                    <defs><linearGradient id="timing-price-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0} /></linearGradient></defs>
                                    <CartesianGrid stroke="var(--border-primary)" strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="tick" type="number" domain={[0, TIMING_RULES.ticks]} ticks={[0, 15, 30, 45, 60, 75]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                    <YAxis width={48} domain={['dataMin - 3', 'dataMax + 3']} tickFormatter={value => Number(value).toFixed(0)} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                    <Tooltip formatter={value => [money(Number(value)), 'Precio']} labelFormatter={value => `Sesión ${value}`} contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)', borderRadius: 10, color: 'var(--text-primary)' }} />
                                    <Area type="linear" dataKey="price" stroke="var(--accent-primary)" fill="url(#timing-price-fill)" strokeWidth={2} dot={false} isAnimationActive={false} />
                                    {game.trades.map((trade, index) => <ReferenceDot key={index} x={trade.tick} y={game.history[trade.tick].price} r={4} fill={trade.side === 'buy' ? '#10b981' : '#f59e0b'} stroke="var(--bg-secondary)" />)}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="timing-chart-note">Precio en EUR. Puntos verdes: compras; naranjas: ventas.</p>
                        <div className="timing-wallet"><span>Efectivo: <strong>{money(game.player.cash)}</strong></span><span>Invertido: <strong>{money(game.player.shares * price)}</strong></span><span>Caída máxima: <strong>{game.drawdown.toFixed(1).replace('.', ',')}%</strong></span></div>

                        {!roundEnded && <div className="timing-controls">
                            <fieldset className="timing-portions" disabled={!running}>
                                <legend>Parte del efectivo que compras o de la posición que vendes</legend>
                                {([0.25, 0.5, 1] as TradeFraction[]).map(value => <button key={value} type="button" aria-pressed={fraction === value} onClick={() => setFraction(value)}>{value * 100}%</button>)}
                            </fieldset>
                            <div className="timing-trade-buttons">
                                <Button className="timing-buy" icon={<TrendingUp size={18} />} disabled={!timingOrderAvailable(game, 'buy')} onClick={() => dispatch({ type: 'order', side: 'buy', fraction })}>Comprar {fraction * 100}%</Button>
                                <Button className="timing-sell" variant="secondary" icon={<TrendingDown size={18} />} disabled={!timingOrderAvailable(game, 'sell')} onClick={() => dispatch({ type: 'order', side: 'sell', fraction })}>Vender {fraction * 100}%</Button>
                                <Button variant="ghost" icon={paused ? <Play size={18} /> : <Pause size={18} />} onClick={() => dispatch({ type: paused ? 'resume' : 'pause' })}>{paused ? 'Continuar' : 'Pausar'}</Button>
                            </div>
                            <p className="timing-order-status" role="status">{paused ? 'Mercado detenido. Continúa cuando estés listo.' : orderStatus}</p>
                            <small className="timing-shortcuts">Teclado: C comprar · V vender · P pausar</small>
                        </div>}
                    </>
                )}
            </div>

            {roundEnded && latestResult && <section className="timing-results" ref={resultsPanel} aria-labelledby="timing-result-title">
                <h2 id="timing-result-title">{finished ? score.won ? '¡Reto superado!' : 'Esta vez no has superado el reto' : latestResult.edge > 1 ? 'Ronda a tu favor' : latestResult.edge < -1 ? 'Ronda para el DCA' : 'Ronda empatada'}</h2>
                <p>{score.wins} de {game.results.length} rondas ganadas · Ventaja acumulada: <strong className={direction(score.edge)}>{signedMoney(score.edge)}</strong></p>
                <div className="timing-round-list">
                    {game.results.map(result => <div className="timing-round-result" key={result.round}>
                        <strong>Ronda {result.round}</strong>
                        <span>Tú <b>{money(result.playerValue)}</b></span><span>DCA <b>{money(result.dcaValue)}</b></span>
                        <span className={direction(result.edge)}>Ventaja <b>{signedMoney(result.edge)}</b></span>
                    </div>)}
                </div>
                <p className="timing-result-costs">Esta ronda: {latestResult.trades} órdenes · Comisiones pagadas: tú {money(latestResult.fees)}, DCA {money(latestResult.dcaFees)} · Caída máxima: {latestResult.drawdown.toFixed(1).replace('.', ',')}%.</p>
                {finished && <p>Una buena partida no demuestra que puedas anticipar el mercado de forma repetible. El DCA reparte las entradas; no garantiza una rentabilidad superior.</p>}
                <Button icon={finished ? <RotateCcw size={18} /> : <ArrowRight size={18} />} onClick={finished ? start : () => dispatch({ type: 'next' })}>{finished ? 'Nueva partida' : 'Siguiente ronda'}</Button>
            </section>}

            <details className="timing-rules">
                <summary>Reglas y comparación</summary>
                <p>3 rondas de 30 segundos. Cada una comprime 75 sesiones simuladas y empieza con 10.000 € para ambas estrategias. El DCA compra 1.000 € en diez fechas fijas, desde la primera sesión.</p>
                <p>Tienes 8 órdenes por ronda. Se ejecutan dos sesiones después de enviarlas, al precio que haya entonces, con cuatro sesiones de descanso desde la última ejecución. Ambas estrategias pagan un 0,15% de comisión y un 0,10% de diferencial por compra o venta.</p>
                <p>Se compara efectivo más participaciones al último precio, descontando los costes pagados. La caída máxima mide cuánto retrocedió tu cartera desde su máximo. Cambiar de pestaña pausa la partida; el mercado simulado no sigue sin ti.</p>
            </details>
        </div>
    );
}

export default MarketTimingGame;
