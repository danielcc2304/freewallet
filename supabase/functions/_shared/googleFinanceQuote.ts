/** Pure parser shared by the browser and the market worker. Never evaluates scripts. */
export interface GoogleFinanceQuote {
    symbol: string; name: string; price: number; previousClose: number; change: number; changePercent: number;
    open: number; high: number; low: number; volume: number; currency: string; quotedAt: string; checkedAt: string;
    origin: 'provider'; source: 'Google Finance'; exchange: string;
}
function observation(price: unknown, at: unknown, now: number) {
    return typeof price === 'number' && Number.isFinite(price) && price > 0
        && typeof at === 'number' && Number.isFinite(at) && at > 0 && at * 1000 <= now + 300000;
}
export function parseGoogleFinanceQuote(html: string, listing: string, now = Date.now()): GoogleFinanceQuote | null {
    if (!/^[A-Z0-9.-]+:[A-Z]+$/.test(listing) || html.length > 2500000) return null;
    const [ticker,exchange] = listing.split(':');
    const found: GoogleFinanceQuote[] = [];
    const walk = (value: unknown, depth = 0) => {
        if (!Array.isArray(value) || depth > 35) return;
        if (Array.isArray(value[1]) && value[1][0] === ticker && value[1][1] === exchange && typeof value[2] === 'string'
            && typeof value[4] === 'string' && Array.isArray(value[5]) && Array.isArray(value[11])) {
            const price = value[5][0], timestamp = value[11][0], previous = value[7];
            if (observation(price,timestamp,now) && /^[A-Z]{3}$/.test(value[4])) {
                const previousClose = typeof previous === 'number' && previous > 0 ? previous : NaN;
                found.push({symbol:listing,name:value[2],price,previousClose,change:price-previousClose,
                    changePercent:previousClose>0?(price/previousClose-1)*100:NaN,open:previousClose,high:price,low:price,volume:0,currency:value[4],
                    quotedAt:new Date(timestamp*1000).toISOString(),checkedAt:new Date(now).toISOString(),origin:'provider',source:'Google Finance',exchange});
            }
        }
        value.forEach(child => walk(child,depth+1));
    };
    // Read JSON arrays only. Provider scripts are never evaluated.
    for (const match of html.matchAll(/AF_initDataCallback\(\{key:[\s\S]*?data:(\[[\s\S]*?\]), sideChannel:/g)) {
        try { walk(JSON.parse(match[1])); } catch { /* A changed provider structure is unavailable. */ }
    }
    return found.sort((a,b)=>Date.parse(a.quotedAt!)-Date.parse(b.quotedAt!)).at(-1) ?? null;
}
