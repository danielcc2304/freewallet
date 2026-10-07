import { quoteCurrency, datedFx, marketSymbolMatches } from '../_shared/quoteCurrency.ts';

/** Server-only providers. Dates are provider observations, never fetch dates. */
export interface MarketPrice {
    instrument: string; quoted_at: string; price_eur: number; previous_close_eur: number | null;
    original_price: number; original_currency: string; original_unit: string; unit_scale: number; fx_rate: number; fx_at: string | null;
    source: 'Finect' | 'Yahoo Finance'; checked_at: string;
}
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === 'object' ? value as RecordValue : {};
const positive = (value: unknown): number => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new Error('Precio inválido');
    return value;
};
const date = (value: unknown): string => {
    const timestamp = typeof value === 'string' ? Date.parse(value) : NaN;
    if (!Number.isFinite(timestamp) || timestamp > Date.now() + 300000) throw new Error('Fecha de cotización inválida');
    return new Date(timestamp).toISOString();
};
export async function providerJson(url: string, signal?: AbortSignal): Promise<unknown> {
    for (let attempt = 0; attempt < 3; attempt++) {
        signal?.throwIfAborted();
        try {
            const response = await fetch(url, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(8000)]) : AbortSignal.timeout(8000),
                headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' } });
            if (response.ok) return await response.json();
            await response.body?.cancel();
            if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 2) throw new Error(`Proveedor HTTP ${response.status}`);
            const retryAfter = Number(response.headers.get('retry-after'));
            await retryDelay(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(3000, retryAfter * 1000) : 250 * 2 ** attempt, signal);
        } catch (error) {
            signal?.throwIfAborted();
            if (attempt === 2 || error instanceof Error && error.message.startsWith('Proveedor HTTP')) throw error;
            await retryDelay(250 * 2 ** attempt, signal);
        }
    }
    throw new Error('Proveedor no disponible');
}
function retryDelay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        const cancel = () => { clearTimeout(timer); signal?.removeEventListener('abort', cancel); reject(signal?.reason); };
        const timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve(); }, ms);
        signal?.addEventListener('abort', cancel, { once: true });
        if (signal?.aborted) cancel();
    });
}
interface RawQuote { price: number; previous: number | null; currency: string; at: string; source: MarketPrice['source']; previousAt?: string }
export function parseFund(payload: unknown, isin: string): RawQuote {
    const root = record(payload), data = record(root.data);
    const model = record(data.entity ?? data);
    const classes = Array.isArray(model.classes) ? model.classes.map(record) : [];
    const directClass = record(model.class);
    const selected = classes.find(c => c.isin === isin) ?? (directClass.isin === isin ? directClass : {});
    if (model.isin !== isin && selected.isin !== isin) throw new Error('La clase del fondo no coincide con el ISIN');
    const quote = record(selected.isin === isin ? selected.lastQuote ?? (model.isin === isin ? model.lastQuote : undefined) : model.lastQuote);
    const currency = record(selected.isin === isin ? selected.currency ?? (model.isin === isin ? model.currency : undefined) : model.currency).code;
    if (typeof currency !== 'string') throw new Error('Divisa desconocida');
    quoteCurrency(currency);
    const price = positive(quote.price);
    const previous = typeof quote.change === 'number' && Number.isFinite(quote.change) && price - quote.change > 0 ? price - quote.change : null;
    return { price, previous, currency, at: date(quote.datetime), source: 'Finect' };
}
async function fund(isin: string, key: string, signal?: AbortSignal): Promise<RawQuote> {
    const params = new URLSearchParams({ key, limit: '50', q: isin, type: 'product' });
    const search = record(await providerJson(`https://api.finect.com/v4/search?${params}`, signal));
    const matches = Array.isArray(search.data) ? search.data.map(record) : [];
    const match = matches.find(m => m.type === 'fund' && record(m.entity).isin === isin);
    const alias = record(match?.entity).alias;
    if (typeof alias !== 'string') throw new Error('ISIN no encontrado en Finect');
    return parseFund(await providerJson(`https://api.finect.com/v4/products/${encodeURIComponent(alias)}?${new URLSearchParams({ key })}`, signal), isin);
}
interface Candle { at: string; close: number }
export function parseChart(payload: unknown, expectedSymbol?: string): { currency: string; candles: Candle[] } {
    const chart = record(record(payload).chart);
    const result = Array.isArray(chart.result) ? record(chart.result[0]) : {};
    const meta = record(result.meta);
    if (expectedSymbol && !marketSymbolMatches(expectedSymbol,meta.symbol,meta.currency)) throw new Error(`Instrumento de mercado incorrecto: ${expectedSymbol} / ${typeof meta.symbol==='string' ? meta.symbol : 'sin identificador'}`);
    const currency = meta.currency;
    if (typeof currency !== 'string') throw new Error('Divisa desconocida');
    quoteCurrency(currency);
    const indicators = record(result.indicators);
    const quote = Array.isArray(indicators.quote) ? record(indicators.quote[0]) : {};
    const closes = Array.isArray(quote.close) ? quote.close : [];
    const timestamps = Array.isArray(result.timestamp) ? result.timestamp : [];
    const candles = timestamps.flatMap((t, index) => {
        const close = closes[index];
        if (typeof t !== 'number' || typeof close !== 'number' || !Number.isFinite(close) || close <= 0) return [];
        return [{ at: date(new Date(t * 1000).toISOString()), close }];
    }).sort((a, b) => a.at.localeCompare(b.at));
    if (!candles.length) throw new Error('Sin cierres disponibles');
    return { currency, candles };
}
async function chart(symbol: string, signal?: AbortSignal): Promise<ReturnType<typeof parseChart>> {
    for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
        try { return parseChart(await providerJson(`https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`, signal), symbol); }
        catch (error) { if (host.startsWith('query2')) throw error; }
    }
    throw new Error('Mercado no disponible');
}
async function sessionQuote(symbol: string, signal?: AbortSignal): Promise<RawQuote> {
    for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
        try {
            const payload = record(await providerJson(`https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`, signal));
            const results = record(payload.chart).result;
            const meta = record(Array.isArray(results) ? record(results[0]).meta : {});
            if (typeof meta.symbol !== 'string' || meta.symbol.toUpperCase() !== symbol.toUpperCase()) throw new Error('Instrumento de mercado incorrecto');
            if (typeof meta.currency !== 'string') throw new Error('Divisa desconocida');
            quoteCurrency(meta.currency);
            if (typeof meta.regularMarketTime !== 'number') throw new Error('Fecha de cotización desconocida');
            const previous = [meta.regularMarketPreviousClose, meta.previousClose, meta.chartPreviousClose]
                .find(value => typeof value === 'number' && Number.isFinite(value) && value > 0);
            return { price: positive(meta.regularMarketPrice), previous: typeof previous === 'number' ? previous : null,
                currency: meta.currency, at: date(new Date(meta.regularMarketTime * 1000).toISOString()), source: 'Yahoo Finance' };
        } catch (error) { if (host.startsWith('query2')) throw error; }
    }
    throw new Error('Mercado no disponible');
}
export const fxAt = datedFx;
export interface MarketInstrument { instrument: string; symbol: string; isin?: string | null; type: 'stock' | 'etf' | 'fund' | 'crypto' }
export async function fetchMarketPrice(input: MarketInstrument | string, finectKey: string,
    fxCache = new Map<string, Promise<ReturnType<typeof parseChart>>>(), signal?: AbortSignal): Promise<MarketPrice> {
    // Strings remain accepted only for callers predating the typed RPC contract.
    const descriptor: MarketInstrument = typeof input === 'string'
        ? { instrument: input, symbol: input, type: /^[A-Z]{2}[A-Z0-9]{10}$/.test(input) ? 'fund' : 'stock', isin: input } : input;
    const { instrument, symbol, type, isin } = descriptor;
    let raw: RawQuote;
    if (type === 'fund') {
        if (!isin || !/^[A-Z]{2}[A-Z0-9]{10}$/.test(isin)) throw new Error('ISIN de fondo inválido');
        raw = await fund(isin, finectKey, signal);
    } else {
        const data = await chart(symbol, signal);
        const last = data.candles.at(-1)!;
        const previous = data.candles.at(-2);
        raw = { price: last.close, previous: previous?.close ?? null, currency: data.currency, at: last.at,
            source: 'Yahoo Finance', previousAt: previous?.at };
        try {
            const current = await sessionQuote(symbol, signal);
            if (current.currency === raw.currency && current.at >= raw.at) {
                const previousCandle = data.candles.filter(c => c.at.slice(0, 10) < current.at.slice(0, 10)).at(-1);
                if (previousCandle && current.previous && Math.abs(previousCandle.close / current.previous - 1) < 0.000001)
                    current.previousAt = previousCandle.at;
                raw = current;
            }
        } catch { signal?.throwIfAborted(); /* Keep a valid dated daily quote. */ }
    }
    const { currency, scale } = quoteCurrency(raw.currency);
    let rate = 1, previousRate = 1, fxDate: string | null = null;
    if (currency !== 'EUR') {
        const fxSymbol = `${currency}EUR=X`;
        if (!fxCache.has(fxSymbol)) fxCache.set(fxSymbol, chart(fxSymbol, signal));
        try {
            const fx = (await fxCache.get(fxSymbol)!).candles;
            const observation = fxAt(fx, raw.at);
            rate = observation.close; fxDate = observation.at;
            previousRate = raw.previousAt ? fxAt(fx, raw.previousAt).close : NaN;
        } catch (error) { fxCache.delete(fxSymbol); throw error; }
    }
    return { instrument, quoted_at: raw.at, price_eur: positive(raw.price * scale * rate),
        previous_close_eur: raw.previous && Number.isFinite(previousRate) ? raw.previous * scale * previousRate : null,
        original_price: raw.price, original_currency: currency, original_unit: raw.currency, unit_scale: scale,
        fx_rate: rate, fx_at: fxDate, source: raw.source, checked_at: new Date().toISOString() };
}
