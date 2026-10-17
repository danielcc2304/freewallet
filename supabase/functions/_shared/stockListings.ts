/** Verified security/venue registry. The SQL migration seeds the same entries;
 * regression tests compare both. Never use company-name similarity here. */
export const VERIFIED_STOCK_LISTINGS = [{
    isin: 'ES0126962069', marketId: 'BME', label: 'Madrid · BME (NXT)', instrument: 'NXT:BME',
    google: 'NXT:BME', currency: 'EUR', default: true,
    aliases: ['NXTE.XD','NXTE.XC','B02.F','B02.HM','B02.MU','B02.HA','0R6G.L','NXT.MC'],
}] as const;
export function verifiedStockListings(asset: {type: string; symbol: string; isin?: string}) {
    if (asset.type !== 'stock') return [];
    const isin = asset.isin?.trim().toUpperCase(), symbol = asset.symbol.trim().toUpperCase();
    return VERIFIED_STOCK_LISTINGS.filter(row => isin ? row.isin === isin : (row.aliases as readonly string[]).includes(symbol));
}
