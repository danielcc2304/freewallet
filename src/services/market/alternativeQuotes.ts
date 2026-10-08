import type { StockQuote } from '../../types/types';

const coinIds: Record<string,string> = {BTC:'bitcoin',ETH:'ethereum',ROSE:'oasis-network',SOL:'solana',ADA:'cardano',XRP:'ripple',DOT:'polkadot',DOGE:'dogecoin',AVAX:'avalanche-2',LINK:'chainlink',LTC:'litecoin',BCH:'bitcoin-cash',ATOM:'cosmos',AAVE:'aave',UNI:'uniswap',USDT:'tether',USDC:'usd-coin'};
export function cryptoCoinId(symbol: string) { return coinIds[/^([A-Z0-9]+)-(EUR|USD)$/.exec(symbol.toUpperCase())?.[1] ?? '']; }
function observation(price: unknown, at: unknown, now: number) {
    return typeof price === 'number' && Number.isFinite(price) && price > 0
        && typeof at === 'number' && Number.isFinite(at) && at > 0 && at * 1000 <= now + 300000;
}
export function parseCoinGeckoQuote(payload: unknown, symbol: string, now = Date.now()): StockQuote | null {
    const id = cryptoCoinId(symbol);
    if (!id || !payload || typeof payload !== 'object') return null;
    const coin = (payload as Record<string, unknown>)[id];
    if (!coin || typeof coin !== 'object') return null;
    const {eur, last_updated_at} = coin as Record<string,unknown>;
    if (!observation(eur,last_updated_at,now)) return null;
    // CoinGecko's rolling 24-hour change is NOT the previous UTC close.
    return {symbol:symbol.replace(/-(USD|EUR)$/,'-EUR'),name:symbol,price:eur as number,previousClose:NaN,change:NaN,changePercent:NaN,open:NaN,high:eur as number,low:eur as number,volume:0,
        currency:'EUR',quotedAt:new Date((last_updated_at as number)*1000).toISOString(),checkedAt:new Date(now).toISOString(),origin:'provider',source:'CoinGecko'};
}
export function parseGoogleFinanceQuote(html: string, listing: string, now = Date.now()): StockQuote | null {
    if (!/^[A-Z0-9.-]+:[A-Z]+$/.test(listing) || html.length > 2500000) return null;
    const [ticker,exchange] = listing.split(':');
    const found: StockQuote[] = [];
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

const cache = new Map<string,{at:number;quote:StockQuote|null}>();
function remember(key: string, quote: StockQuote | null) {
    cache.delete(key);cache.set(key,{at:Date.now(),quote});
    if(cache.size>100)cache.delete(cache.keys().next().value!);
}
export async function alternativeQuote(kind:'stock'|'crypto', symbol:string, signal?:AbortSignal, force=false):Promise<StockQuote|null> {
    const key = `${kind}:${symbol}`;
    const existing = cache.get(key);
    if (!force && existing && Date.now()-existing.at < 45000) return existing.quote;
    const id = kind==='crypto' ? cryptoCoinId(symbol) : undefined;
    if (kind==='crypto' && !id || kind==='stock' && !/^[A-Z0-9.-]+:[A-Z]+$/.test(symbol)) return null;
    const url = kind==='stock' ? `/__market/google/finance/quote/${encodeURIComponent(symbol)}?hl=en&_cb=${Math.floor(Date.now()/60000)}`
        : `/__market/coingecko/api/v3/simple/price?ids=${id}&vs_currencies=eur&include_last_updated_at=true`;
    try {
        const response = await fetch(url,{signal:signal ? AbortSignal.any([signal,AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000),cache:'no-store'});
        if (!response.ok) throw new Error('Alternative quote unavailable');
        const content = await response.text();
        if (content.length > 2500000) throw new Error('Quote response too large');
        const quote = kind==='stock' ? parseGoogleFinanceQuote(content,symbol) : parseCoinGeckoQuote(JSON.parse(content),symbol);
        if (!signal?.aborted) {
            remember(key,quote);
        }
        return quote;
    } catch { if (!signal?.aborted) remember(key,null); return null; }
}
