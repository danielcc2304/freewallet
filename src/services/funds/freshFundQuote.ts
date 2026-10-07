import {getAppSupabaseClient,appBackendConfig} from '../supabaseClient';
import {portfolioStorage} from '../portfolioCloudStorage';
import {dailyPriceQuote} from '../dailyMarketData';
import type {DailyPrice} from '../dailyMarketData';
import type {Asset,StockQuote} from '../../types/types';

/** Signed-in manual refreshes use the same NAV selection as the batch. */
export async function freshFundQuote(asset:Asset,isin:string,signal?:AbortSignal):Promise<StockQuote|null> {
    const owner=portfolioStorage.getSnapshot().userId,epoch=portfolioStorage.epoch;
    if(!owner||!appBackendConfig)return null;
    const client=await getAppSupabaseClient(),session=await client.auth.getSession();
    if(session.error||session.data.session?.user.id!==owner||portfolioStorage.epoch!==epoch)return null;
    const response=await fetch(`${appBackendConfig.url}/functions/v1/fund-quote`,{method:'POST',headers:{
        apikey:appBackendConfig.key,Authorization:`Bearer ${session.data.session.access_token}`,'Content-Type':'application/json'},
        body:JSON.stringify({isin}),signal:signal??AbortSignal.timeout(35000)});
    if(!response.ok||portfolioStorage.epoch!==epoch)return null;
    const data=await response.json() as {quote?:DailyPrice;cached?:boolean};
    if(portfolioStorage.epoch!==epoch||data.quote?.instrument!==isin)return null;
    const quote=dailyPriceQuote(asset,data.quote);
    return quote?{...quote,origin:data.cached?'batch':'provider'}:null;
}
