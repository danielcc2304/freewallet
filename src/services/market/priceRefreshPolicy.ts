import type { Asset } from '../../types/types';
import { LIVE_PRICE_REFRESH_INTERVAL_MS, PRICE_REFRESH_INTERVAL_MS } from '../../constants/app';
import { isMarketSessionOpen } from './marketSessions';

export function priceRefreshInterval(asset: Pick<Asset,'type'|'symbol'>, dashboardVisible: boolean, now = Date.now()) {
    const active = asset.type==='crypto' || asset.type==='stock' && isMarketSessionOpen(asset.symbol,now);
    return dashboardVisible && active ? LIVE_PRICE_REFRESH_INTERVAL_MS : PRICE_REFRESH_INTERVAL_MS;
}
