export const TIMING_RULES = {
    capital: 10000,
    rounds: 3,
    ticks: 75,
    tickMs: 400,
    maxOrders: 8,
    delayTicks: 2,
    cooldownTicks: 4,
    feeRate: 0.0015,
    spread: 0.001,
    dcaEvery: 8,
    dcaOrders: 10,
    winningEdge: 100,
} as const;

export type TradeSide = 'buy' | 'sell';
export type TradeFraction = 0.25 | 0.5 | 1;
export interface TimingWallet { cash: number; shares: number; fees: number }
export interface TimingTrade { tick: number; side: TradeSide; price: number; shares: number; fee: number }
export interface TimingRoundResult {
    round: number;
    playerValue: number;
    dcaValue: number;
    edge: number;
    trades: number;
    fees: number;
    dcaFees: number;
    drawdown: number;
}
export interface TimingGame {
    phase: 'ready' | 'running' | 'paused' | 'round-result' | 'finished';
    seed: number;
    round: number;
    tick: number;
    path: number[];
    history: { tick: number; price: number }[];
    player: TimingWallet;
    dca: TimingWallet;
    trades: TimingTrade[];
    pending: { side: TradeSide; fraction: TradeFraction; executeAt: number } | null;
    lastTradeTick: number;
    peak: number;
    drawdown: number;
    results: TimingRoundResult[];
    feedback: string;
}
export type TimingAction =
    | { type: 'start'; seed: number }
    | { type: 'order'; side: TradeSide; fraction: TradeFraction }
    | { type: 'tick' | 'pause' | 'resume' | 'next' };

/** Repeatable simulated markets with changing trends, volatility and occasional gaps. */
export function generateTimingPrices(seed: number): number[] {
    let state = seed >>> 0;
    const random = () => {
        state += 0x6D2B79F5;
        let value = Math.imul(state ^ state >>> 15, 1 | state);
        value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
        return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(random(), 1e-10))) * Math.cos(2 * Math.PI * random());
    const prices = [100];
    let regimeEnds = 0, drift = 0, volatility = 0;
    for (let tick = 1; tick <= TIMING_RULES.ticks; tick++) {
        if (tick > regimeEnds) {
            drift = [-0.0028, -0.0008, 0.0008, 0.0028][Math.floor(random() * 4)];
            volatility = 0.007 + random() * 0.013;
            regimeEnds = tick + 9 + Math.floor(random() * 16);
        }
        const jump = random() < 0.035 ? (random() < 0.5 ? -1 : 1) * (0.035 + random() * 0.055) : 0;
        const change = Math.max(-0.13, Math.min(0.13, drift + volatility * normal() + jump));
        prices.push(Math.max(5, prices.at(-1)! * Math.exp(change)));
    }
    return prices;
}

export function timingValue(wallet: TimingWallet, price: number): number {
    return wallet.cash + wallet.shares * price;
}

function buy(wallet: TimingWallet, budget: number, quote: number) {
    const amount = Math.min(wallet.cash, Math.max(0, budget));
    const price = quote * (1 + TIMING_RULES.spread);
    const fee = amount * TIMING_RULES.feeRate;
    const shares = (amount - fee) / price;
    return { wallet: { cash: Math.max(0, wallet.cash - amount), shares: wallet.shares + shares, fees: wallet.fees + fee }, price, fee, shares };
}

function sell(wallet: TimingWallet, fraction: TradeFraction, quote: number) {
    const shares = wallet.shares * fraction;
    const price = quote * (1 - TIMING_RULES.spread);
    const gross = shares * price;
    const fee = gross * TIMING_RULES.feeRate;
    return { wallet: { cash: wallet.cash + gross - fee, shares: Math.max(0, wallet.shares - shares), fees: wallet.fees + fee }, price, fee, shares };
}

const emptyWallet = (): TimingWallet => ({ cash: TIMING_RULES.capital, shares: 0, fees: 0 });

export function createTimingGame(): TimingGame {
    return { phase: 'ready', seed: 0, round: 1, tick: 0, path: [], history: [{ tick: 0, price: 100 }],
        player: emptyWallet(), dca: emptyWallet(), trades: [], pending: null,
        lastTradeTick: -TIMING_RULES.cooldownTicks, peak: TIMING_RULES.capital, drawdown: 0, results: [], feedback: '' };
}

function startRound(seed: number, round: number, results: TimingRoundResult[]): TimingGame {
    const path = generateTimingPrices((seed + Math.imul(round, 0x9E3779B9)) >>> 0);
    return { ...createTimingGame(), phase: 'running', seed, round, path, results,
        dca: buy(emptyWallet(), TIMING_RULES.capital / TIMING_RULES.dcaOrders, path[0]).wallet,
        feedback: 'Primera compra DCA ejecutada. Tú decides cuándo entrar.' };
}

export function timingOrderAvailable(game: TimingGame, side: TradeSide): boolean {
    return game.phase === 'running' && !game.pending && game.trades.length < TIMING_RULES.maxOrders
        && game.tick + TIMING_RULES.delayTicks <= TIMING_RULES.ticks
        && game.tick - game.lastTradeTick >= TIMING_RULES.cooldownTicks
        && (side === 'buy' ? game.player.cash >= 1 : game.player.shares > 1e-8);
}

export function timingReducer(game: TimingGame, action: TimingAction): TimingGame {
    if (action.type === 'start') return startRound(action.seed >>> 0, 1, []);
    if (action.type === 'pause') return game.phase === 'running' ? { ...game, phase: 'paused' } : game;
    if (action.type === 'resume') return game.phase === 'paused' ? { ...game, phase: 'running' } : game;
    if (action.type === 'next') return game.phase === 'round-result' ? startRound(game.seed, game.round + 1, game.results) : game;
    if (action.type === 'order') {
        if (![0.25, 0.5, 1].includes(action.fraction) || !timingOrderAvailable(game, action.side)) return game;
        return { ...game, pending: { side: action.side, fraction: action.fraction, executeAt: game.tick + TIMING_RULES.delayTicks },
            feedback: `Orden de ${action.side === 'buy' ? 'compra' : 'venta'} enviada.` };
    }
    if (game.phase !== 'running') return game;
    const tick = game.tick + 1;
    const quote = game.path[tick];
    let { player, dca, trades, pending, lastTradeTick, feedback } = game;
    if (pending && pending.executeAt <= tick) {
        const fill = pending.side === 'buy' ? buy(player, player.cash * pending.fraction, quote) : sell(player, pending.fraction, quote);
        player = fill.wallet;
        trades = [...trades, { tick, side: pending.side, price: fill.price, shares: fill.shares, fee: fill.fee }];
        feedback = `${pending.side === 'buy' ? 'Compra' : 'Venta'} ejecutada.`;
        lastTradeTick = tick;
        pending = null;
    }
    if (tick % TIMING_RULES.dcaEvery === 0 && dca.cash >= 1) {
        dca = buy(dca, TIMING_RULES.capital / TIMING_RULES.dcaOrders, quote).wallet;
    }
    const playerValue = timingValue(player, quote);
    const peak = Math.max(game.peak, playerValue);
    const drawdown = Math.max(game.drawdown, (peak - playerValue) / peak * 100);
    const next: TimingGame = { ...game, tick, player, dca, trades, pending, lastTradeTick, peak, drawdown, feedback,
        history: [...game.history, { tick, price: quote }] };
    if (tick < TIMING_RULES.ticks) return next;
    const dcaValue = timingValue(dca, quote);
    const result = { round: game.round, playerValue, dcaValue, edge: playerValue - dcaValue,
        trades: trades.length, fees: player.fees, dcaFees: dca.fees, drawdown };
    return { ...next, phase: game.round === TIMING_RULES.rounds ? 'finished' : 'round-result', results: [...game.results, result] };
}

export function timingScore(results: TimingRoundResult[]) {
    const wins = results.filter(result => result.edge > 1).length;
    const edge = results.reduce((sum, result) => sum + result.edge, 0);
    return { wins, edge, won: results.length === TIMING_RULES.rounds && wins >= 2 && edge >= TIMING_RULES.winningEdge };
}
