import {fundSourcePriority} from '../_shared/fundQuotePolicy.ts';
import type {MarketPrice} from '../daily-market-data/providers.ts';

export interface FundQuoteContext {allowed:boolean;name:string;cached:MarketPrice|null}
export interface FundQuoteDependencies {
    context:(authorization:string,isin:string)=>Promise<FundQuoteContext>;
    quote:(isin:string,signal:AbortSignal)=>Promise<MarketPrice>;
}
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type',
    'Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
function usable(quote:MarketPrice|null,isin:string):quote is MarketPrice {
    return !!quote&&quote.instrument===isin&&Number.isFinite(quote.price_eur)&&quote.price_eur>0
        && Number.isFinite(Date.parse(quote.quoted_at))&&Date.parse(quote.quoted_at)<=Date.now()+300000
        &&Date.parse(quote.quoted_at)>=Date.now()-7*86400000;
}
export async function handleFundQuote(request:Request,dependencies:FundQuoteDependencies):Promise<Response> {
    if(request.method==='OPTIONS')return new Response('ok',{headers});
    if(request.method!=='POST')return json({error:'Método no permitido'},405);
    const authorization=request.headers.get('authorization');
    if(!authorization?.startsWith('Bearer '))return json({error:'Necesitas una sesión activa'},401);
    let isin:string;
    try {
        if(Number(request.headers.get('content-length'))>1024)return json({error:'Petición demasiado grande'},413);
        const text=await request.text();if(text.length>1024)return json({error:'Petición demasiado grande'},413);
        const body=JSON.parse(text);isin=typeof body.isin==='string'?body.isin.trim().toUpperCase():'';
        if(!/^[A-Z]{2}[A-Z0-9]{10}$/.test(isin))return json({error:'ISIN no válido'},400);
    }catch{return json({error:'Petición no válida'},400);}
    let context:FundQuoteContext;
    try{context=await dependencies.context(authorization,isin);}catch{return json({error:'La sesión o el acceso al fondo no son válidos'},403);}
    const cached=usable(context.cached,isin)?context.cached:null;
    if(!context.allowed)return cached?json({quote:cached,cached:true}):json({error:'Espera unos segundos para volver a consultar'},429);
    try {
        const fresh=await dependencies.quote(isin,AbortSignal.timeout(25000));
        if(!usable(fresh,isin))throw new Error('NAV no válido');
        const retain=cached&&(cached.quoted_at.slice(0,10)>fresh.quoted_at.slice(0,10)
            ||cached.quoted_at.slice(0,10)===fresh.quoted_at.slice(0,10)&&fundSourcePriority(cached.source)<fundSourcePriority(fresh.source));
        return json({quote:retain?cached:fresh,cached:!!retain});
    }catch{return cached?json({quote:cached,cached:true}):json({error:'No se ha podido consultar un NAV válido'},503);}
}
