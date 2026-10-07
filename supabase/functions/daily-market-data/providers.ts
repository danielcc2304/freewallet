/** Server-only providers. Dates are provider observations, never fetch dates. */
export interface MarketPrice {
    instrument: string; quoted_at: string; price_eur: number; previous_close_eur: number | null;
    original_price: number; original_currency: string; fx_rate: number; fx_at: string | null;
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
async function json(url: string): Promise<unknown> {
    const response = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) throw new Error(`Proveedor HTTP ${response.status}`);
    return response.json();
}
interface RawQuote { price: number; previous: number | null; currency: string; at: string; source: MarketPrice['source']; previousAt?: string }
export function parseFund(payload: unknown, isin: string): RawQuote {
    const root = record(payload), data = record(root.data);
    const model = record(data.entity ?? data);
    const classes = Array.isArray(model.classes) ? model.classes.map(record) : [];
    const directClass = record(model.class);
    const selected = classes.find(c => c.isin === isin) ?? (directClass.isin === isin ? directClass : {});
    if (model.isin !== isin && selected.isin !== isin) throw new Error('La clase del fondo no coincide con el ISIN');
    const quote = record(selected.lastQuote ?? model.lastQuote);
    const currency = record(selected.currency ?? model.currency).code;
    if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) throw new Error('Divisa desconocida');
    const price = positive(quote.price);
    const previous = typeof quote.change === 'number' && Number.isFinite(quote.change) && price - quote.change > 0 ? price - quote.change : null;
    return { price, previous, currency, at: date(quote.datetime), source: 'Finect' };
}
async function fund(isin: string, key: string): Promise<RawQuote> {
    const params = new URLSearchParams({ key, limit: '50', q: isin, type: 'product' });
    const search = record(await json(`https://api.finect.com/v4/search?${params}`));
    const matches = Array.isArray(search.data) ? search.data.map(record) : [];
    const match = matches.find(m => m.type === 'fund' && record(m.entity).isin === isin);
    const alias = record(match?.entity).alias;
    if (typeof alias !== 'string') throw new Error('ISIN no encontrado en Finect');
    return parseFund(await json(`https://api.finect.com/v4/products/${encodeURIComponent(alias)}?${new URLSearchParams({ key })}`), isin);
}
interface Candle { at: string; close: number }
export function parseChart(payload: unknown): { currency: string; candles: Candle[] } {
    const chart = record(record(payload).chart);
    const result = Array.isArray(chart.result) ? record(chart.result[0]) : {};
    const meta = record(result.meta);
    const currency = meta.currency;
    if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) throw new Error('Divisa desconocida');
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
async function chart(symbol: string): Promise<ReturnType<typeof parseChart>> {
    for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
        try { return parseChart(await json(`https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`)); }
        catch (error) { if (host.startsWith('query2')) throw error; }
    }
    throw new Error('Mercado no disponible');
}
async function sessionQuote(symbol: string): Promise<RawQuote> {
    for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
        try {
            const payload = record(await json(`https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`));
            const results = record(payload.chart).result;
            const meta = record(Array.isArray(results) ? record(results[0]).meta : {});
            if (typeof meta.symbol !== 'string' || meta.symbol.toUpperCase() !== symbol.toUpperCase()) throw new Error('Instrumento de mercado incorrecto');
            if (typeof meta.currency !== 'string' || !/^[A-Z]{3}$/.test(meta.currency)) throw new Error('Divisa desconocida');
            if (typeof meta.regularMarketTime !== 'number') throw new Error('Fecha de cotización desconocida');
            const previous = [meta.regularMarketPreviousClose, meta.previousClose, meta.chartPreviousClose]
                .find(value => typeof value === 'number' && Number.isFinite(value) && value > 0);
            return { price: positive(meta.regularMarketPrice), previous: typeof previous === 'number' ? previous : null,
                currency: meta.currency, at: date(new Date(meta.regularMarketTime * 1000).toISOString()), source: 'Yahoo Finance' };
        } catch (error) { if (host.startsWith('query2')) throw error; }
    }
    throw new Error('Mercado no disponible');
}
export function fxAt(candles: Candle[], at: string): Candle {
    // Compare by observation day: daily FX candles can precede the stock close
    // timestamp. Do not use today's FX to convert an older fund NAV.
    const day = at.slice(0, 10);
    const candidate = candles.filter(c => c.at.slice(0, 10) <= day).at(-1);
    if (!candidate || Date.parse(day) - Date.parse(candidate.at.slice(0, 10)) > 4 * 86400000) throw new Error('Sin cambio de divisa fechado');
    return candidate;
}
export async function fetchMarketPrice(instrument: string, finectKey: string, fxCache = new Map<string, Promise<ReturnType<typeof parseChart>>>()): Promise<MarketPrice> {
    let raw: RawQuote;
    if (/^[A-Z]{2}[A-Z0-9]{10}$/.test(instrument)) raw = await fund(instrument, finectKey);
    else {
        const data = await chart(instrument);
        const last = data.candles.at(-1)!;
        raw = { price: last.close, previous: data.candles.at(-2)?.close ?? null, currency: data.currency, at: last.at, source: 'Yahoo Finance', previousAt: data.candles.at(-2)?.at };
        // Sparse listings such as NXTE.XD may have only one monthly candle.
        // The one-day metadata provides an actual previous session close; a
        // range-start close from the monthly chart would be the wrong baseline.
        // Restrict this fallback to EUR: other currencies also need the date
        // of the previous close to convert it using the appropriate FX rate.
        if (raw.previous === null && raw.currency === 'EUR') {
            try {
                const current = await sessionQuote(instrument);
                if (current.currency === 'EUR' && current.at >= raw.at) raw = current;
            } catch { /* Keep the valid price and its unavailable previous close. */ }
        }
    }
    let rate = 1, previousRate = 1, fxDate: string | null = null;
    if (raw.currency !== 'EUR') {
        const symbol = `${raw.currency}EUR=X`;
        if (!fxCache.has(symbol)) fxCache.set(symbol, chart(symbol));
        const fx = (await fxCache.get(symbol)!).candles;
        const observation = fxAt(fx, raw.at);
        rate = observation.close; fxDate = observation.at;
        // Without a separately dated previous NAV, using the current FX for
        // previous close would invent a daily EUR movement. Leave it unavailable.
        previousRate = raw.previousAt ? fxAt(fx, raw.previousAt).close : NaN;
    }
    return { instrument, quoted_at: raw.at, price_eur: positive(raw.price * rate),
        previous_close_eur: raw.previous && Number.isFinite(previousRate) ? raw.previous * previousRate : null,
        original_price: raw.price, original_currency: raw.currency, fx_rate: rate, fx_at: fxDate,
        source: raw.source, checked_at: new Date().toISOString() };
}
