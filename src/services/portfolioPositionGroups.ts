import type { Asset } from '../types/types';
import { assetValue, hasValidPrice } from './assetValuation';
import { dailyAssetVariation } from './dashboardIntegrity';

/** A display projection only. Never persist these synthetic assets or use
 * their identifiers to record trades, edits or deletions. */
export function portfolioPositionGroups(assets: Asset[], now = Date.now()) {
    const symbolIsins = new Map<string, Set<string>>();
    const normalize = (value: string) => value.trim().toUpperCase();
    const symbolKey = (a: Asset) => JSON.stringify([a.type,normalize(a.symbol),a.currency || 'EUR']);
    for (const asset of assets) {
        if (asset.isin) {
            const known = symbolIsins.get(symbolKey(asset)) ?? new Set<string>();
            known.add(normalize(asset.isin));symbolIsins.set(symbolKey(asset),known);
        }
    }
    const groups = new Map<string,Asset[]>();
    for (const asset of assets) {
        const known = symbolIsins.get(symbolKey(asset));
        const isin = asset.isin ? normalize(asset.isin) : known?.size === 1 ? [...known][0] : '';
        // Separate trading listings/currencies; equal company names are not identity.
        const key = JSON.stringify([asset.type,isin || normalize(asset.symbol),asset.currency || 'EUR',
            asset.type==='stock' || asset.type==='etf' ? normalize(asset.symbol) : '']);
        groups.set(key,[...(groups.get(key) ?? []),asset]);
    }
    return [...groups].map(([key,lots]) => {
        if (lots.length===1) return {key,asset:lots[0],lots,estimatedCount:hasValidPrice(lots[0])?0:1,mixedPrices:false,mixedDates:false,
            currentValue:assetValue(lots[0]),investedValue:lots[0].purchasePrice*lots[0].quantity,...dailyAssetVariation(lots[0],now)};
        const quantity=lots.reduce((sum,a)=>sum+a.quantity,0);
        const investedValue=lots.reduce((sum,a)=>sum+a.purchasePrice*a.quantity,0);
        const currentValue=lots.reduce((sum,a)=>sum+assetValue(a),0);
        const estimatedCount=lots.filter(a=>!hasValidPrice(a)).length;
        const variations=lots.map(a=>dailyAssetVariation(a,now));
        const sameDay=!!variations[0].quoteDay && variations.every(v=>v.quoteDay===variations[0].quoteDay);
        const validVariation=sameDay && variations.every(v=>Number.isFinite(v.latestChange));
        const previousValue=lots.reduce((sum,a)=>sum+(a.previousClose ?? NaN)*a.quantity,0);
        const latestChange=validVariation ? variations.reduce((sum,v)=>sum+v.latestChange,0) : NaN;
        const latestChangePercent=validVariation && previousValue>0 ? latestChange/previousValue*100 : NaN;
        const dates=lots.map(a=>a.quotedAt || a.lastQuoteAt).filter((date):date is string=>!!date && Number.isFinite(Date.parse(date)))
            .sort((a,b)=>Date.parse(a)-Date.parse(b));
        const asset:Asset={...lots[0],isin:lots.find(a=>a.isin)?.isin,id:`position-group:${key}`,quantity,purchasePrice:quantity>0?investedValue/quantity:0,
            cashTae:lots.every(lot=>lot.cashTae===lots[0].cashTae)?lots[0].cashTae:undefined,
            currentPrice:quantity>0?currentValue/quantity:0,previousClose:validVariation&&quantity>0?previousValue/quantity:undefined,
            quotedAt:dates.length===lots.length?dates[0]:undefined,lastQuoteAt:dates.length===lots.length?dates[0]:undefined,
            purchaseDate:[...lots].sort((a,b)=>a.purchaseDate.localeCompare(b.purchaseDate))[0].purchaseDate};
        return {key,asset,lots,estimatedCount,currentValue,investedValue,
            mixedPrices:new Set(lots.map(a=>a.currentPrice)).size>1 || estimatedCount>0,
            mixedDates:dates.length!==lots.length || new Set(dates).size>1,
            latestChange,latestChangePercent,quoteDay:sameDay?variations[0].quoteDay:undefined,
            isToday:sameDay && variations.every(v=>v.isToday),todayChange:validVariation && variations.every(v=>v.isToday)?latestChange:NaN,
            todayChangePercent:validVariation && variations.every(v=>v.isToday)?latestChangePercent:NaN};
    });
}
