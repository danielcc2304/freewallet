import {load} from 'cheerio/slim';
import {quoteCurrency} from '../_shared/quoteCurrency.ts';
import {fundClassIdentity,newestFundObservation} from '../_shared/fundQuotePolicy.ts';
import type {FundObservation} from '../_shared/fundQuotePolicy.ts';

type JsonRecord=Record<string,unknown>;
const record=(value:unknown):JsonRecord=>value&&typeof value==='object'?value as JsonRecord:{};
const nav=(value:unknown):number=>{if(typeof value!=='number'||!Number.isFinite(value)||value<=0)throw new Error('NAV inválido');return value;};
function spanishNumber(text:string):number{return nav(Number(text.trim().replace(/\./g,'').replace(',','.')));}
export function navDay(day:number,month:number,year:number):string {
    const time=Date.UTC(year,month-1,day),date=new Date(time);
    if(year<1900||date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day||time>Date.now()+300000)throw new Error('Fecha de NAV inválida');
    return date.toISOString();
}
function europeanDate(text:string):string {
    const match=/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text.trim());
    if(!match)throw new Error('Fecha de NAV no encontrada');return navDay(Number(match[1]),Number(match[2]),Number(match[3]));
}
export function parseQuefondos(html:string,isin:string):FundObservation {
    const $=load(html),title=$('title').text();
    if(!title.includes(`(${isin})`))throw new Error('Quefondos no confirma el ISIN solicitado');
    const section=$('h4').filter((_,node)=>$(node).text().trim()==='Última valoración').parent();
    const priceText=section.find('p').filter((_,node)=>$(node).find('.floatleft').text().trim()==='Valor liquidativo:').find('.floatright').text().trim();
    const priceMatch=/^([\d.,]+)\s+([A-Z]{3})$/.exec(priceText);
    if(!priceMatch)throw new Error('Quefondos no devuelve precio y divisa válidos');quoteCurrency(priceMatch[2]);
    const at=section.find('p').filter((_,node)=>$(node).find('.floatleft').text().trim()==='Fecha:').find('.floatright').text();
    const className=title.split(`(${isin})`)[0].trim();
    return {isin,className,currency:priceMatch[2],price:spanishNumber(priceMatch[1]),at:europeanDate(at),previous:null,source:'VDOS/Quefondos'};
}
export function parseCobas(html:string,isin:string):FundObservation {
    if(isin!=='ES0119199018')throw new Error('Clase de Cobas no configurada');
    const $=load(html),heading=$('h3').filter((_,node)=>$(node).text().trim()==='Datos del fondo - Cobas Internacional FI Clase D');
    const details=heading.next('article');
    const field=(label:string)=>details.find('.value-row').filter((_,node)=>$(node).find('.keys').text().trim()===label).find('.values').text().trim();
    if(field('Código ISIN')!==isin||field('Divisa')!=='EUR')throw new Error('La ficha de Cobas no confirma clase y divisa');
    const quote=$('h3.no').filter((_,node)=>$(node).text().trim()==='Cobas Internacional FI Clase D').parent();
    const priceText=quote.find('.each-data').filter((_,node)=>$(node).find('.title').text().trim()==='Valor liquidativo').find('.number').text().trim();
    const days=[...$.root().text().matchAll(/Fecha valor liquidativo:\s*(\d{1,2}-\d{1,2}-\d{4})/g)].map(m=>europeanDate(m[1]));
    if(!days.length||new Set(days).size!==1||!priceText.endsWith('€'))throw new Error('Fecha o divisa de Cobas ambigua');
    return {isin,className:'Cobas Internacional D FI',currency:'EUR',price:spanishNumber(priceText.replace('€','')),at:days[0],previous:null,source:'Cobas AM'};
}
export function parseAzvalor(page:string,xml:string,isin:string):FundObservation {
    if(isin!=='ES0112611001')throw new Error('Clase de Azvalor no configurada');
    const $page=load(page);$page('script,style').remove();
    const identity=$page('*').toArray().some(node=>$page(node).text().trim()===isin
        ||new RegExp(`^ISIN\\s*${isin}$`).test($page(node).text().trim()));
    if(!identity)throw new Error('Azvalor no confirma el ISIN');
    if(!$page('a').toArray().some(node=>$page(node).attr('href')==='https://areacliente.azvalor.com/api/product/international/prices?filename=international'))throw new Error('Serie de Azvalor no confirmada');
    const $=load(xml,{xmlMode:true}),rows=$('ss\\:Row').toArray().map(node=>$(node).find('ss\\:Data').toArray().map(cell=>$(cell).text()));
    if(rows[0]?.join('|')!=='Date|NAV')throw new Error('Serie de Azvalor no interpretable');
    const prices=rows.slice(1).map(row=>({at:europeanDate(row[0]),price:nav(Number(row[1]))})).sort((a,b)=>a.at.localeCompare(b.at));
    const last=prices.at(-1),previous=prices.filter(p=>p.at!==last?.at).at(-1);
    if(!last)throw new Error('Azvalor no ha publicado NAV');
    return {isin,className:'Azvalor Internacional FI',currency:'EUR',...last,previous:previous?.price??null,previousAt:previous?.at,source:'Azvalor'};
}
export function yahooFundSymbols(payload:unknown,isin:string,className:string):string[] {
    const quotes=record(payload).quotes;
    return Array.isArray(quotes)?[...new Set(quotes.map(record).filter(q=>q.quoteType==='MUTUALFUND'
        &&typeof q.symbol==='string'&&/^0P[A-Z0-9]{8}\.[A-Z]{1,3}$/.test(q.symbol)
        &&(q.isin===undefined||q.isin===isin)&&typeof q.longname==='string'
        &&fundClassIdentity(q.longname)===fundClassIdentity(className)).map(q=>q.symbol as string))]:[];
}
export function parseYahooFund(payload:unknown,symbol:string,isin:string,className:string,currency:string):FundObservation {
    const results=record(record(payload).chart).result,result=record(Array.isArray(results)?results[0]:undefined),meta=record(result.meta);
    if(meta.symbol!==symbol||meta.instrumentType!=='MUTUALFUND'||meta.currency!==currency
        ||typeof meta.longName!=='string'||fundClassIdentity(meta.longName)!==fundClassIdentity(className))throw new Error('Yahoo no confirma la clase del fondo');
    quoteCurrency(currency);
    const timestamps=Array.isArray(result.timestamp)?result.timestamp:[],quote=record(result.indicators).quote;
    const closes=record(Array.isArray(quote)?quote[0]:undefined).close;
    const prices=timestamps.flatMap((t,i)=>{
        const close=Array.isArray(closes)?closes[i]:undefined;
        if(typeof t!=='number'||!Number.isFinite(t)||typeof close!=='number'||!Number.isFinite(close)||close<=0)return [];
        const date=new Date(t*1000);return [{at:navDay(date.getUTCDate(),date.getUTCMonth()+1,date.getUTCFullYear()),price:close}];
    }).sort((a,b)=>a.at.localeCompare(b.at));
    const last=prices.at(-1),previous=prices.filter(p=>p.at!==last?.at).at(-1);
    if(!last)throw new Error('Yahoo no devuelve una serie de NAV válida');
    return {isin,className,currency,...last,previous:previous?.price??null,previousAt:previous?.at,source:'Yahoo Finance'};
}
export interface FundTransport {json:(url:string,signal?:AbortSignal)=>Promise<unknown>;text:(url:string,signal?:AbortSignal)=>Promise<string>}
export async function fetchFreshFund(isin:string,finect:()=>Promise<FundObservation>,transport:FundTransport,signal?:AbortSignal):Promise<FundObservation> {
    const requests:Promise<FundObservation>[]=[finect(),transport.text(`https://www.quefondos.com/es/fondos/ficha/index.html?isin=${isin}`,signal).then(html=>parseQuefondos(html,isin))];
    if(isin==='ES0119199018')requests.push(transport.text('https://www.cobasam.com/productos/inversion-libre/cobas_internacional/',signal).then(html=>parseCobas(html,isin)));
    if(isin==='ES0112611001')requests.push(Promise.all([transport.text('https://www.azvalor.com/fondos-de-inversion/azvalor-internacional/',signal),transport.text('https://areacliente.azvalor.com/api/product/international/prices?filename=international',signal)]).then(([page,xml])=>parseAzvalor(page,xml,isin)));
    const settled=await Promise.allSettled(requests),observations=settled.flatMap(result=>result.status==='fulfilled'?[result.value]:[]);
    signal?.throwIfAborted();
    const identity=observations.find(q=>q.source==='Finect')??observations[0];
    if(identity)try {
        const search=await transport.json(`https://query1.finance.yahoo.com/v1/finance/search?${new URLSearchParams({q:isin,quotesCount:'10',newsCount:'0'})}`,signal);
        const symbols=yahooFundSymbols(search,isin,identity.className);
        for(const symbol of symbols.slice(0,2))try {
            const payload=await transport.json(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`,signal);
            observations.push(parseYahooFund(payload,symbol,isin,identity.className,identity.currency));break;
        }catch{signal?.throwIfAborted();}
    }catch{signal?.throwIfAborted();}
    if(!observations.length)throw new Error('Ninguna fuente ha devuelto un NAV válido para el ISIN');
    return newestFundObservation(observations);
}
