import type { Asset } from '../../types/types';
import { getSettings } from '../storageService';
import { verifiedSecurityAlias } from '../securityAliases';

export interface StockQuoteMarket { id: string; label: string; yahoo?: string; google?: string }
export function googleListing(symbol: string, exchange?: string): string | undefined {
    const suffixes: Record<string, string> = {MC:'BME',PA:'EPA',AS:'AMS',MI:'BIT',BR:'EBR',LS:'ELI',DE:'ETR',F:'FRA',L:'LON',SW:'SWX',TO:'TSE',AX:'ASX',HK:'HKG',T:'TYO'};
    const match = /^([A-Z0-9-]+)\.([A-Z]+)$/.exec(symbol.toUpperCase());
    if (match && suffixes[match[2]]) return `${match[1]}:${suffixes[match[2]]}`;
    const exchanges: Record<string,string> = {NMS:'NASDAQ',NGM:'NASDAQ',NCM:'NASDAQ',NYQ:'NYSE',ASE:'NYSEAMERICAN'};
    return /^[A-Z][A-Z0-9-]*$/.test(symbol) && exchange && exchanges[exchange] ? `${symbol}:${exchanges[exchange]}` : undefined;
}
export function stockQuoteMarkets(asset: Pick<Asset,'type'|'name'|'symbol'|'isin'>): StockQuoteMarket[] {
    if (asset.type !== 'stock') return [];
    const symbol = asset.symbol.trim().toUpperCase();
    const original = {id:'original',label:`Mercado del registro (${symbol})`,yahoo:symbol,google:googleListing(symbol)};
    // Verified security identity, never a fuzzy name-only substitution.
    const nextil = verifiedSecurityAlias('',symbol)
        ?? (asset.isin==='ES0126962069' ? {isin:'ES0126962069'} : undefined);
    return nextil && (!asset.isin || asset.isin === nextil.isin)
        ? [original,{id:'BME',label:'Madrid · BME (NXT)',google:'NXT:BME'}] : [original];
}
export function selectedStockQuoteMarket(asset: Asset): StockQuoteMarket | undefined {
    const choices = stockQuoteMarkets(asset);
    const preference = getSettings().stockQuoteMarkets?.[asset.id];
    return choices.find(choice => choice.id === preference) ?? choices.find(choice=>choice.id==='BME') ?? choices[0];
}
