import {readFinancialTimesIdentity,readFinancialTimesHistory} from '../_shared/financialTimesHistory.ts';
import type {FundObservation} from '../_shared/fundQuotePolicy.ts';
import type {FundTransport} from './fundSources.ts';

export function financialTimesIdentity(html:string,isin:string) {
    const {symbol,className}=readFinancialTimesIdentity(html,isin,'EUR');
    return {symbol,className};
}
export function parseFinancialTimesFund(payload:unknown,isin:string,identity:{symbol:string;className:string}):FundObservation {
    const rows=readFinancialTimesHistory(payload,{...identity,currency:'EUR'});
    const last=rows.at(-1)!,previous=rows.at(-2)!;
    return {isin,className:identity.className,currency:'EUR',...last,previous:previous.price,previousAt:previous.at,
        source:'Financial Times',history:rows};
}
export async function fetchFinancialTimesFund(isin:string,transport:FundTransport,signal?:AbortSignal) {
    if(!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(isin)||!transport.postJson)throw new Error('Consulta FT no disponible');
    const bounded=signal?AbortSignal.any([signal,AbortSignal.timeout(14000)]):AbortSignal.timeout(14000);
    const identity=financialTimesIdentity(await transport.text(`https://markets.ft.com/data/funds/tearsheet/summary?s=${isin}:EUR`,bounded),isin);
    const payload=await transport.postJson('https://markets.ft.com/data/chartapi/series',{
        days:30,dataNormalized:false,dataPeriod:'Day',dataInterval:1,realtime:false,yFormat:'0.0000',timeServiceFormat:'JSON',returnDateType:'ISO8601',
        elements:[{Label:'fund',Type:'price',Symbol:identity.symbol,OverlayIndicators:[],Params:{}}],
    },bounded);
    return parseFinancialTimesFund(payload,isin,identity);
}
