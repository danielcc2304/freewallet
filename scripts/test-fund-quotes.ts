import assert from 'node:assert/strict';
import {fetchFreshFund,parseQuefondos,parseCobas,parseAzvalor,parseYahooFund,yahooFundSymbols,navDay} from '../supabase/functions/daily-market-data/fundSources';
import {newestFundObservation} from '../supabase/functions/_shared/fundQuotePolicy';
import type {FundObservation} from '../supabase/functions/_shared/fundQuotePolicy';
import {handleFundQuote} from '../supabase/functions/fund-quote/handler';
import type {MarketPrice} from '../supabase/functions/daily-market-data/providers';

const isin='ES0119199018',className='Cobas Internacional D FI',at='2026-10-06T00:00:00.000Z';
const finect:FundObservation={isin,className,currency:'EUR',price:294.89686,at:'2026-10-02T00:00:00.000Z',previous:296.3613,source:'Finect'};
const vdos=`<title>COBAS INTERNACIONAL, FI D (${isin}) · Gestora</title><div><h4>Última valoración</h4>
    <p><span class="floatleft">Valor liquidativo: </span><span class="floatright">297,769724 EUR</span></p>
    <p><span class="floatleft">Fecha: </span><span class="floatright">05/10/2026</span></p></div>`;
const cobas=`<h3 class="no">Cobas Internacional FI Clase D</h3><div></div>`;
const manager=`<section><h3 class="no">Cobas Internacional FI Clase D</h3><div class="each-data"><p class="number">299,038746 €</p><p class="title">Valor liquidativo</p></div></section>
    <p>Fecha valor liquidativo: 6-10-2026</p><h3>Datos del fondo - Cobas Internacional FI Clase D</h3><article>
    <div class="value-row"><p class="keys">Código ISIN</p><p class="values">${isin}</p></div><div class="value-row"><p class="keys">Divisa</p><p class="values">EUR</p></div></article>`;
assert.equal(parseQuefondos(vdos,isin).price,297.769724);
assert.throws(()=>parseQuefondos(vdos.replace(isin,'ES0119199000'),isin));
assert.throws(()=>parseQuefondos(vdos.replace('05/10/2026','31/02/2026'),isin));
assert.throws(()=>parseQuefondos(vdos.replace('297,769724','NaN'),isin));
assert.throws(()=>navDay(1,1,2100));
assert.equal(parseCobas(manager,isin).price,299.038746);
assert.throws(()=>parseCobas(manager.replace('Código ISIN','Wrong field'),isin));
assert.throws(()=>parseCobas(cobas,isin));
const azIsin='ES0112611001',azPage=`<p>ISIN ${azIsin}</p><a href="https://areacliente.azvalor.com/api/product/international/prices?filename=international">Histórico</a>`;
const azXml='<?xml version="1.0"?><ss:Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><ss:Table>'+[
    ['Date','NAV'],['05/10/2026','354.593476'],['06/10/2026','355.218728']].map(row=>'<ss:Row>'+row.map(cell=>`<ss:Cell><ss:Data>${cell}</ss:Data></ss:Cell>`).join('')+'</ss:Row>').join('')+'</ss:Table></ss:Workbook>';
assert.equal(parseAzvalor(azPage,azXml,azIsin).previous,354.593476);
assert.throws(()=>parseAzvalor(azPage.replace(azIsin,'ES0112611002'),azXml,azIsin));
const symbol='0P0001LFVO.F',search={quotes:[{symbol,quoteType:'MUTUALFUND',longname:className},
    {symbol:'ES0119199018.SG',quoteType:'MUTUALFUND',longname:className},{symbol:'DI4A.F',quoteType:'ETF',longname:className},
    {symbol:'0P0001LFVB.F',quoteType:'MUTUALFUND',longname:'Cobas Internacional B FI'}]};
assert.deepEqual(yahooFundSymbols(search,isin,className),[symbol],'Only an independently class-matched NAV series is allowed');
const chart={chart:{result:[{meta:{symbol,currency:'EUR',instrumentType:'MUTUALFUND',longName:className},
    timestamp:[Date.parse('2026-10-05T06:00:00Z')/1000,Date.parse('2026-10-06T06:00:00Z')/1000,Date.parse('2026-10-07T06:00:00Z')/1000],
    indicators:{quote:[{close:[297.76971435546875,299.03875732421875,null]}]}}]}};
const yahoo=parseYahooFund(chart,symbol,isin,className,'EUR');
assert.equal(yahoo.at,at);assert.equal(yahoo.previousAt,'2026-10-05T00:00:00.000Z');
assert.throws(()=>parseYahooFund(chart,'OTHER',isin,className,'EUR'));
assert.throws(()=>parseYahooFund(chart,symbol,isin,'Cobas Internacional C FI','EUR'));
assert.throws(()=>parseYahooFund(chart,symbol,isin,className,'USD'));
const pictetIsin='LU0625737910',pictetClass='Pictet-China Index P EUR',pictetSymbol=pictetIsin+'.LU';
const pictetSearch={quotes:[{symbol:pictetSymbol,quoteType:'MUTUALFUND',longname:pictetClass},
    {symbol:'LU0625737928.LU',quoteType:'MUTUALFUND',longname:pictetClass},
    {symbol:pictetIsin+'.SG',quoteType:'MUTUALFUND',longname:pictetClass},
    {symbol:pictetSymbol,quoteType:'MUTUALFUND',longname:'Pictet-China Index P USD'}]};
assert.deepEqual(yahooFundSymbols(pictetSearch,pictetIsin,pictetClass),[pictetSymbol],'An exact ISIN Luxembourg NAV series is valid; other classes and traded quotes are excluded');
const fundChart=(ticker:string,name:string,prices:number[])=>({chart:{result:[{...chart.chart.result[0],
    meta:{symbol:ticker,currency:'EUR',instrumentType:'MUTUALFUND',longName:name},indicators:{quote:[{close:[...prices,null]}]}}]}});
const pictetChart=fundChart(pictetSymbol,pictetClass,[129.52,130.24]);
assert.equal(parseYahooFund(pictetChart,pictetSymbol,pictetIsin,pictetClass,'EUR').price,130.24);
assert.throws(()=>parseYahooFund(fundChart(pictetIsin+'.SG',pictetClass,[129,130]),pictetIsin+'.SG',pictetIsin,pictetClass,'EUR'),'A traded quote must be rejected even by the NAV parser');
const pictetQueries:string[]=[];
const pictet=await fetchFreshFund(pictetIsin,async()=>({...finect,isin:pictetIsin,className:pictetClass,price:128.2}),{
    json:async(url)=>{if(url.includes('/search?')){pictetQueries.push(new URL(url).searchParams.get('q')!);return pictetSearch;}return pictetChart;},
    text:async()=>{throw Error('VDOS unavailable');}});
assert.equal(pictet.at,at);assert.equal(pictet.price,130.24);assert.equal(pictet.previous,129.52);
assert.deepEqual(pictetQueries,[pictetIsin],'A successful ISIN lookup needs no class-name search');
const dwsIsin='LU0034353002',dwsClass='DWS Floating Rate Notes LC',dwsSymbol='0P00000N4I.F';
const dwsFinect:FundObservation={...finect,isin:dwsIsin,className:dwsClass,price:94.56,at:'2026-10-05T00:00:00.000Z'};
const dwsSearch={quotes:[{symbol:dwsSymbol,quoteType:'MUTUALFUND',longname:dwsClass},
    {symbol:'0P00000N4J.F',quoteType:'MUTUALFUND',longname:'DWS Floating Rate Notes LD'}]};
for(const primary of [{quotes:[{symbol:'DI4A.F',quoteType:'ETF',longname:'DWS Floating Rate Notes'}]},
    {quotes:[{symbol:'0P00000000.F',quoteType:'MUTUALFUND',longname:dwsClass}]}]) {
    const queries:string[]=[],requested:string[]=[];
    const dws=await fetchFreshFund(dwsIsin,async()=>dwsFinect,{
        json:async(url)=>{
            const parsed=new URL(url);
            if(url.includes('/search?')){const query=parsed.searchParams.get('q')!;queries.push(query);return query===dwsIsin?primary:dwsSearch;}
            const ticker=decodeURIComponent(parsed.pathname.split('/').at(-1)!);requested.push(ticker);
            return ticker===dwsSymbol?fundChart(dwsSymbol,dwsClass,[94.56,94.57]):{chart:{result:[]}};
        },text:async()=>{throw Error('VDOS unavailable');}});
    assert.deepEqual(queries,[dwsIsin,dwsClass],'Search the complete verified class when ISIN candidates are traded quotes or unusable');
    assert.equal(dws.at,at);assert.equal(dws.price,94.57);assert.equal(dws.previous,94.56);
    assert.ok(!requested.includes('DI4A.F')&&!requested.includes('0P00000N4J.F'),'Neither a traded ETF nor a different class may be requested');
    assert.equal(new Set(requested).size,requested.length,'Do not repeat failed chart candidates');
}
const selected=newestFundObservation([finect,yahoo,parseCobas(manager,isin)]);
assert.equal(selected.source,'Cobas AM');assert.equal(selected.price,299.038746);assert.equal(selected.previous,yahoo.previous);
assert.equal(newestFundObservation([finect,parseQuefondos(vdos,isin)]).source,'VDOS/Quefondos');
assert.equal(newestFundObservation([{...finect,at:at,price:299},{...finect,at:at,price:299,previous:null,source:'VDOS/Quefondos'}]).previous,finect.previous,'Preserve a corroborated daily change when choosing a more precise source');
const fetched=await fetchFreshFund(isin,async()=>finect,{json:async(url)=>url.includes('/search?')?search:chart,text:async(url)=>url.includes('cobasam')?manager:vdos});
assert.equal(fetched.source,'Cobas AM');assert.equal(fetched.at,at);
const fallback=await fetchFreshFund(isin,async()=>{throw Error('Finect down');},{json:async()=>{throw Error('Yahoo down');},text:async(url)=>{if(url.includes('cobasam'))throw Error('Manager down');return vdos;}});
assert.equal(fallback.source,'VDOS/Quefondos');
await assert.rejects(fetchFreshFund(isin,async()=>{throw Error('down');},{json:async()=>{throw Error('down');},text:async()=>{throw Error('down');}}));
const today=new Date().toISOString().slice(0,10),stamp=new Date().toISOString();
const cached:MarketPrice={instrument:isin,quoted_at:today+'T00:00:00Z',checked_at:stamp,price_eur:300,previous_close_eur:299,
    original_price:300,original_currency:'EUR',original_unit:'EUR',unit_scale:1,fx_rate:1,fx_at:null,source:'Cobas AM'};
let allowed=true,denied=false,providerCalls=0;
const dependencies={context:async()=>{if(denied)throw Error('Revoked or different owner');return {allowed,name:className,cached};},
    quote:async()=>{providerCalls++;return {...cached,source:'Finect' as const};}};
const request=(body:unknown={isin},auth=true)=>new Request('https://fixture.invalid/fund-quote',{method:'POST',headers:auth?{authorization:'Bearer fixture'}:{},body:JSON.stringify(body)});
assert.equal((await handleFundQuote(request({},false),dependencies)).status,401);
assert.equal((await handleFundQuote(request({isin:'WRONG'}),dependencies)).status,400);
denied=true;assert.equal((await handleFundQuote(request(),dependencies)).status,403);assert.equal(providerCalls,0);
denied=false;allowed=false;assert.equal((await (await handleFundQuote(request(),dependencies)).json()).quote.source,'Cobas AM');assert.equal(providerCalls,0,'Throttled refresh reuses cache without provider calls');
allowed=true;const retained=await (await handleFundQuote(request(),dependencies)).json();assert.equal(retained.quote.source,'Cobas AM');assert.equal(retained.cached,true);
const latest=await (await handleFundQuote(request(),{...dependencies,quote:async()=>({...cached,price_eur:301})})).json();assert.equal(latest.quote.price_eur,301);assert.equal(latest.cached,false);
const failure=await (await handleFundQuote(request(),{...dependencies,quote:async()=>{throw Error('down');}})).json();assert.equal(failure.quote.price_eur,300);
console.log('Fund quotes: Pictet ISIN NAV series, DWS verified-class fallback, rejected traded/other-class prices, exact currency/dates, official precision, latest-date selection, authenticated manual refresh and cached-data preservation passed.');
