import assert from 'node:assert/strict';
import {financialTimesIdentity,parseFinancialTimesFund,fetchFinancialTimesFund} from '../supabase/functions/daily-market-data/financialTimesFund';
import {fetchFreshFund} from '../supabase/functions/daily-market-data/fundSources';
const isin='IE00BYX5NX33',className='Fidelity MSCI World Index Fund EUR P Acc';
const html=`<h1>${className}</h1><section data-mod-config='{"symbol":"${isin}:EUR","assetClass":"Fund","xid":"12345"}'></section>`;
const identity=financialTimesIdentity(html,isin);
const payload={Status:1,Dates:['2026-10-06T00:00:00','2026-10-07T00:00:00'],Elements:[{Symbol:'12345',Type:'price',Status:1,IssueType:'OF',Currency:'EUR',CompanyName:className,
 QuoteTimeLast:'2026-10-06T23:00:00',ComponentSeries:[{Type:'Close',Values:[14.6921,14.6948]}]}]};
const quote=parseFinancialTimesFund(payload,isin,identity);
assert.equal(quote.at,'2026-10-07T00:00:00.000Z','Use the series NAV date, never the timezone-shifted quote timestamp');
assert.equal(quote.price,14.6948,'Keep all decimals from the JSON series, not the rounded HTML price');
assert.equal(quote.previous,14.6921);assert.equal(quote.history?.length,2);
assert.throws(()=>financialTimesIdentity(html.replace(isin,'IE00BYX5NX34'),isin));
assert.throws(()=>financialTimesIdentity(html.replace(':EUR',':USD'),isin));
for(const patch of [{Currency:'USD'},{CompanyName:className.replace('P Acc','I Acc')},{Symbol:'999'},{IssueType:'ETF'},{Status:0}])
 assert.throws(()=>parseFinancialTimesFund({...payload,Elements:[{...payload.Elements[0],...patch}]},isin,identity));
for(const dates of [['2099-10-06T00:00:00','2099-10-07T00:00:00'],['2026-02-30T00:00:00','2026-10-07T00:00:00'],['2026-10-06T00:00:00','2026-10-06T00:00:00']])
 assert.throws(()=>parseFinancialTimesFund({...payload,Dates:dates},isin,identity));
for(const values of [[14.69],[14.69,NaN],[14.69,0]])assert.throws(()=>parseFinancialTimesFund({...payload,Elements:[{...payload.Elements[0],ComponentSeries:[{Type:'Close',Values:values}]}]},isin,identity));
let posts=0;
const transport={text:async(url:string)=>{if(!url.includes('markets.ft.com'))throw Error('Source down');return html;},json:async()=>{throw Error('Yahoo down');},
 postJson:async(url:string,body:unknown)=>{assert.equal(url,'https://markets.ft.com/data/chartapi/series');assert.equal((body as {dataNormalized:boolean}).dataNormalized,false);posts++;return payload;}};
assert.deepEqual(await fetchFinancialTimesFund(isin,transport),quote);
const selected=await fetchFreshFund(isin,async()=>({...quote,at:'2026-10-06T00:00:00.000Z',price:14.6921,source:'Finect' as const}),transport);
assert.equal(selected.source,'Financial Times');assert.equal(selected.price,14.6948);assert.equal(posts,2);
const fallback=await fetchFreshFund(isin,async()=>({...quote,source:'Finect' as const}),{...transport,postJson:async()=>{throw Error('FT down');}});
assert.equal(fallback.source,'Finect','A failed optional provider cannot discard a valid NAV');
console.log('PASS: FT exact ISIN/class/currency, unrounded NAV, accounting date, recent history, latest source and provider fallback.');
