/** Shared by the browser and worker. Never uppercase minor-unit codes first. */
export function quoteCurrency(unit: string): { currency: string; scale: number } {
    const minor = { GBp: 'GBP', GBX: 'GBP', ZAc: 'ZAR', ILA: 'ILS' } as Record<string, string>;
    if (minor[unit]) return { currency: minor[unit], scale: 0.01 };
    const currency = unit.toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency) || currency === 'UNK') throw new Error('Divisa desconocida');
    return { currency, scale: 1 };
}
export interface FxObservation { at: string; close: number }
/** Crypto trades every day. Use the actual daily candle for yesterday UTC,
 * rather than assigning a date to Yahoo's slightly different quote metadata.
 */
export function previousCryptoClose(candles: FxObservation[], at: string): FxObservation | undefined {
    const timestamp=Date.parse(at);
    if(!Number.isFinite(timestamp))return undefined;
    const previousDay=new Date(timestamp-86400000).toISOString().slice(0,10);
    return candles.filter(c=>c.at.slice(0,10)===previousDay && Number.isFinite(Date.parse(c.at)) && Number.isFinite(c.close) && c.close>0)
        .sort((a,b)=>a.at.localeCompare(b.at)).at(-1);
}
/** Historical EUR accounting: last FX observation on/before the quote's UTC day. */
export function datedFx(candles: FxObservation[], at: string): FxObservation {
    const day = at.slice(0, 10);
    const candidate = candles.filter(c => c.at.slice(0, 10) <= day && Number.isFinite(c.close) && c.close > 0)
        .sort((a, b) => a.at.localeCompare(b.at)).at(-1);
    if (!Number.isFinite(Date.parse(at)) || !candidate || Date.parse(day) - Date.parse(candidate.at.slice(0, 10)) > 4 * 86400000)
        throw new Error('Sin cambio de divisa fechado');
    return candidate;
}

/** Yahoo abbreviates USD crosses, e.g. USDEUR=X is canonically EUR=X. */
export function marketSymbolMatches(expected: string, actual: unknown, currency: unknown): boolean {
    if(typeof actual!=='string')return false;
    const requested=expected.toUpperCase(),returned=actual.toUpperCase();
    if(requested===returned)return true;
    const usdCross=/^USD([A-Z]{3})=X$/.exec(requested);
    return !!usdCross && returned===usdCross[1]+'=X' && currency===usdCross[1];
}
