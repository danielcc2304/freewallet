import {load} from 'cheerio/slim';
import {fundClassIdentity} from '../_shared/fundQuotePolicy.ts';
import type {FundObservation} from '../_shared/fundQuotePolicy.ts';
import type {FundTransport} from './fundSources.ts';

const record=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'?v as Record<string,unknown>:{};
export function financialTimesIdentity(html:string,isin:string) {
    const $=load(html);
    const candidates=$('[data-mod-config]').toArray().flatMap(node=>{
        try {const config=JSON.parse($(node).attr('data-mod-config')!);
            return config.symbol===`${isin}:EUR`&&config.assetClass==='Fund'&&/^\d+$/.test(config.xid)?[String(config.xid)]:[];
        }catch{return [];}
    });
    const ids=[...new Set(candidates)];
    const className=$('h1').first().text().trim();
    if(ids.length!==1||!className)throw new Error('FT no confirma el ISIN y la clase EUR');
    return {symbol:ids[0],className};
}
export function parseFinancialTimesFund(payload:unknown,isin:string,identity:{symbol:string;className:string}):FundObservation {
    const root=record(payload),elements=Array.isArray(root.Elements)?root.Elements.map(record):[];
    const element=elements.find(e=>e.Symbol===identity.symbol&&e.Type==='price');
    if(root.Status!==1||!element||element.Status!==1||element.IssueType!=='OF'||element.Currency!=='EUR'
        ||typeof element.CompanyName!=='string'||fundClassIdentity(element.CompanyName)!==fundClassIdentity(identity.className))throw new Error('FT devuelve otro instrumento o divisa');
    const closes=(Array.isArray(element.ComponentSeries)?element.ComponentSeries.map(record):[]).find(s=>s.Type==='Close')?.Values;
    if(!Array.isArray(root.Dates)||!Array.isArray(closes)||root.Dates.length!==closes.length)throw new Error('Serie de FT incompleta');
    const rows=root.Dates.flatMap((date,i)=>{
        if(closes[i]===null)return [];
        if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}T00:00:00$/.test(date)
            ||typeof closes[i]!=='number'||!Number.isFinite(closes[i])||closes[i]<=0)throw new Error('NAV de FT inválido');
        const at=date+'.000Z',time=Date.parse(at);
        if(!Number.isFinite(time)||new Date(time).toISOString()!==at||time>Date.now()+300000)throw new Error('Fecha de FT inválida');
        return [{at,price:closes[i] as number}];
    }).sort((a,b)=>a.at.localeCompare(b.at));
    if(rows.length<2||new Set(rows.map(p=>p.at)).size!==rows.length)throw new Error('FT no devuelve dos cierres distintos');
    const last=rows.at(-1)!,previous=rows.at(-2)!;
    // Dates labels are NAV accounting days. QuoteTimeLast is a different
    // timezone-based timestamp and must never shift this series by one day.
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
