import type { Asset } from '../../types/types';
import { getSettings } from '../storageService';
import { verifiedStockListings } from '../../../supabase/functions/_shared/stockListings';

export interface StockQuoteMarket { id: string; label: string; yahoo?: string; google?: string; instrument?: string; isDefault?: boolean }
type StockMarketAsset = Pick<Asset, 'type'|'symbol'|'isin'> & {id?: string};
export function googleListing(symbol: string, exchange?: string): string | undefined {
    const suffixes: Record<string, string> = {MC:'BME',PA:'EPA',AS:'AMS',MI:'BIT',BR:'EBR',LS:'ELI',DE:'ETR',F:'FRA',L:'LON',SW:'SWX',TO:'TSE',AX:'ASX',HK:'HKG',T:'TYO'};
    const match = /^([A-Z0-9-]+)\.([A-Z]+)$/.exec(symbol.toUpperCase());
    if (match && suffixes[match[2]]) return `${match[1]}:${suffixes[match[2]]}`;
    const exchanges: Record<string,string> = {NMS:'NASDAQ',NGM:'NASDAQ',NCM:'NASDAQ',NYQ:'NYSE',ASE:'NYSEAMERICAN'};
    return /^[A-Z][A-Z0-9-]*$/.test(symbol) && exchange && exchanges[exchange] ? `${symbol}:${exchanges[exchange]}` : undefined;
}
export function stockQuoteMarkets(asset: StockMarketAsset): StockQuoteMarket[] {
    if (asset.type !== 'stock') return [];
    const symbol = asset.symbol.trim().toUpperCase();
    const original = {id:'original',label:`Mercado del registro (${symbol})`,yahoo:symbol,google:googleListing(symbol)};
    return [original, ...verifiedStockListings(asset).map(row => ({
        id: row.marketId, label: row.label, google: row.google, instrument: row.instrument, isDefault: row.default,
    }))];
}
export function selectedStockQuoteMarket(asset: StockMarketAsset): StockQuoteMarket | undefined {
    const choices = stockQuoteMarkets(asset);
    const preference = asset.id ? getSettings().stockQuoteMarkets?.[asset.id] : undefined;
    return choices.find(choice => choice.id === preference) ?? choices.find(choice=>choice.isDefault) ?? choices[0];
}

export function stockQuoteInstrument(asset: StockMarketAsset): string {
    return selectedStockQuoteMarket(asset)?.instrument ?? asset.symbol.trim().toUpperCase();
}
/** Legacy original quotes keep monotonic dates; a different verified venue is a new series. */
export function stockQuoteVenueChanged(asset: StockMarketAsset & {quoteInstrument?: string}): boolean {
    if (asset.type !== 'stock') return false;
    const expected = stockQuoteInstrument(asset);
    return asset.quoteInstrument ? asset.quoteInstrument !== expected : expected !== asset.symbol.trim().toUpperCase();
}
