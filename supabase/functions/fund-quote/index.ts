import {createClient} from 'npm:@supabase/supabase-js@2.112.4';
import {fetchMarketPrice} from '../daily-market-data/providers.ts';
import {handleFundQuote} from './handler.ts';
import type {FundQuoteContext} from './handler.ts';

const key=Deno.env.get('FINECT_API_KEY')||'OgcqanUxQ4S6Y5VVvnwlJayUuxeg8Ah5';
Deno.serve((request:Request)=>handleFundQuote(request,{
    context:async(authorization,isin)=>{
        const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{
            global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
        // PostgREST validates the JWT; the RPC also checks the active session,
        // confirmed account, MFA, ownership and the per-owner request interval.
        const {data,error}=await client.rpc('prepare_fund_quote',{isin}).abortSignal(AbortSignal.timeout(8000));
        if(error||!data)throw new Error('Fund access denied');return data as FundQuoteContext;
    },
    quote:(isin,signal)=>fetchMarketPrice({instrument:isin,symbol:isin,isin,type:'fund'},key,new Map(),signal),
}));
