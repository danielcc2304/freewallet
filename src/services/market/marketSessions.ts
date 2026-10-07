import type { Asset } from '../../types/types';

interface Session { zone: string; start: number; end: number }
const EUROPE: Session = { zone: 'Europe/Madrid', start: 9 * 60, end: 18 * 60 };
const US: Session = { zone: 'America/New_York', start: 9 * 60 + 30, end: 16 * 60 + 30 };

/** Regular-session windows include 30 minutes to collect delayed closing quotes.
 * Time zones handle DST. Holidays remain the provider's responsibility; a
 * successful request does not make its last traded price a new observation.
 */
export function isMarketSessionOpen(symbol: string, now = Date.now()): boolean {
    const normalized = symbol.trim().toUpperCase();
    let session: Session | undefined;
    if (/\.(MC|XD|XC|PA|AS|MI|BR|LS|DE|SW)$/.test(normalized)) session = EUROPE;
    else if (/\.L$/.test(normalized)) session = { zone: 'Europe/London', start: 8 * 60, end: 17 * 60 };
    else if (/\.(F|HM|MU|HA|BE|DU|SG)$/.test(normalized)) session = { zone: 'Europe/Berlin', start: 8 * 60, end: 22 * 60 + 30 };
    else if (/^[A-Z][A-Z0-9^-]*$/.test(normalized) && !/^[A-Z]{2}[A-Z0-9]{10}$/.test(normalized)) session = US;
    // Unknown exchanges use direct requests rather than guessing a closed market.
    if (!session) return true;
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: session.zone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const part = (name: string) => parts.find(item => item.type === name)?.value;
    if (part('weekday') === 'Sat' || part('weekday') === 'Sun') return false;
    const minute = Number(part('hour')) * 60 + Number(part('minute'));
    return minute >= session.start && minute < session.end;
}

export function prefersBatchQuote(asset: Pick<Asset, 'type' | 'symbol'>, now = Date.now()): boolean {
    return asset.type === 'fund' || asset.type === 'cash'
        || (asset.type !== 'crypto' && !isMarketSessionOpen(asset.symbol, now));
}
