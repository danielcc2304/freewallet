import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeFundamentals,extractPublicFundamentals,normalizeFundamentalSeries,mergeFundamentals,formatFundamentalMoney,formatFundamentalPercent,hasFundamentals} from '../src/services/market/fundamentals';

const data={quoteSummary:{result:[{price:{symbol:'SAMPLE',currency:'USD',marketCap:{raw:10e9}},defaultKeyStatistics:{trailingEps:{raw:.001234},enterpriseToEbitda:{raw:10},mostRecentQuarter:{raw:1782777600}},summaryDetail:{trailingPE:{raw:-12},dividendYield:{raw:0},dividendRate:{raw:0},fiftyTwoWeekHigh:{raw:200}},financialData:{financialCurrency:'EUR',ebitda:{raw:2e9},profitMargins:{raw:.125},returnOnEquity:{raw:-.2},revenueGrowth:{raw:.03},debtToEquity:{raw:51.72}}}]}};
const n=normalizeFundamentals(data,'SAMPLE');
assert.equal(n.ebitda,2e9);assert.equal(n.financialCurrency,'EUR');assert.equal(n.currency,'USD');assert.equal(n.eps,.001234);
assert.equal(n.dividendYield,0);assert.equal(n.dividendRate,0);assert.equal(n.pe,-12);assert.equal(n.profitMargin,12.5);assert.equal(n.roe,-20);assert.equal(n.revenueGrowth,3);assert.equal(n.debtToEquity,51.72);
assert.equal(n.fundamentalPeriodEnd,'2026-06-30');
assert.match(formatFundamentalMoney(n.ebitda,n.financialCurrency,true),/EUR$/);assert.match(formatFundamentalMoney(n.eps,n.currency),/^0,001234 USD$/);
assert.equal(formatFundamentalPercent(n.debtToEquity),'51,72%');assert.equal(formatFundamentalPercent(n.dividendYield),'0%');assert.equal(formatFundamentalPercent(undefined),'N/D');
assert.equal(formatFundamentalMoney(undefined,'EUR'),'N/D');assert.match(formatFundamentalMoney(10,undefined),/divisa no disponible/);
assert.deepEqual(normalizeFundamentals(data,'UNRELATED'),{});
const embed=(payload:unknown)=>'<script type="application/json" data-sveltekit-fetched>'+JSON.stringify({status:200,body:JSON.stringify(payload)})+'</script>';
const sidebar={quoteResponse:{result:[{symbol:'UNRELATED',currency:'GBP',trailingPE:999}]}};
const html=embed(data)+embed(sidebar);
assert.equal(extractPublicFundamentals(html,'SAMPLE').pe,-12);assert.equal(extractPublicFundamentals(html,'SAMPLE').currency,'USD');
assert.deepEqual(extractPublicFundamentals('<script>window.fake='+JSON.stringify(data)+'</script>','SAMPLE'),{});
assert.deepEqual(extractPublicFundamentals(embed({quoteResponse:{result:[{symbol:'SAMPLE',trailingPE:null,trailingEps:'missing',marketCap:{raw:NaN}}]}}),'SAMPLE'),{});
const v7=normalizeFundamentals({quoteResponse:{result:[{symbol:'SAMPLE',currency:'USD',trailingAnnualDividendYield:{raw:.025},epsTrailingTwelveMonths:{raw:-1.5}}]}},'SAMPLE');
assert.equal(v7.dividendYield,2.5);assert.equal(v7.eps,-1.5);assert.equal(normalizeFundamentals({quoteResponse:{result:[{symbol:'SAMPLE',dividendYield:2.5}]}},'SAMPLE').dividendYield,2.5);
assert.ok(hasFundamentals(v7));assert.equal(hasFundamentals({}),false);
const series=(type:string,value:number,date='2026-06-30',code='EUR')=>({meta:{symbol:['SAMPLE'],type:[type]},[type]:[{asOfDate:date,periodType:type.startsWith('trailing')?'TTM':'3M',currencyCode:code,reportedValue:{raw:value}}]});
const seriesPayload={timeseries:{result:[series('trailingEBITDA',2e9),series('trailingNetIncome',-20),series('trailingTotalRevenue',200),series('quarterlyTotalDebt',50),series('quarterlyStockholdersEquity',100),series('trailingDilutedEPS',-.25),series('trailingPeRatio',50,'2026-09-23')]}};
const normalizedSeries=normalizeFundamentalSeries(seriesPayload,'SAMPLE');
assert.equal(normalizedSeries.profitMargin,-10);assert.equal(normalizedSeries.debtToEquity,50);assert.equal(normalizedSeries.eps,-.25);assert.equal(normalizedSeries.epsCurrency,'EUR');assert.equal(normalizedSeries.fundamentalDates?.pe,'2026-09-23');
assert.equal(normalizedSeries.fundamentalDates?.ebitda,'2026-06-30');assert.equal(normalizedSeries.fundamentalDerived?.profitMargin,true);
assert.deepEqual(normalizeFundamentalSeries(seriesPayload,'UNRELATED'),{});
assert.equal(normalizeFundamentalSeries({timeseries:{result:[series('quarterlyTotalDebt',50),series('quarterlyStockholdersEquity',100,'2025-12-31')]}},'SAMPLE').debtToEquity,undefined);
assert.equal(normalizeFundamentalSeries({timeseries:{result:[series('trailingNetIncome',20),series('trailingTotalRevenue',200,'2026-06-30','USD')]}},'SAMPLE').profitMargin,undefined);
assert.equal(normalizeFundamentalSeries({timeseries:{result:[series('quarterlyTotalDebt',50),series('quarterlyStockholdersEquity',0)]}},'SAMPLE').debtToEquity,undefined);
assert.deepEqual(normalizeFundamentalSeries({timeseries:{result:[series('trailingEBITDA',100,'2099-01-01')]}},'SAMPLE'),{});
const merged=mergeFundamentals(normalizedSeries,n);
assert.equal(merged.epsCurrency,'USD');assert.equal(merged.financialCurrency,'EUR');assert.equal(merged.fundamentalDerived?.profitMargin,undefined);
assert.equal(mergeFundamentals(normalizedSeries,{ebitda:100}).financialCurrency,undefined);
if(process.env.FREEWALLET_STOCK_PROVIDER_FIXTURES){
 const folder=process.env.FREEWALLET_STOCK_PROVIDER_FIXTURES;
 const apple=extractPublicFundamentals(readFileSync(folder+'/fw-stock-AAPL.html','utf8'),'AAPL');
 assert.equal(apple.ebitda,167959003136);assert.equal(apple.financialCurrency,'USD');assert.equal(apple.evToEbitda,29.056);
 for(const symbol of ['AMP.MC','OHLA.MC']){
  const partial=extractPublicFundamentals(readFileSync(folder+'/fw-stock-'+symbol+'.html','utf8'),symbol);
  assert.equal(partial.currency,'EUR');assert.ok(partial.marketCap!>0);assert.equal(partial.ebitda,undefined);assert.equal(partial.pe,undefined);
 }
 for(const [symbol,amount] of [['AMP.MC',48101000],['OHLA.MC',204969000],['B02.F',11808000]] as const){
  const full=normalizeFundamentalSeries(JSON.parse(readFileSync(folder+'/fw-stock-series-'+symbol+'.json','utf8')),symbol);
  assert.equal(full.ebitda,amount);assert.equal(full.financialCurrency,'EUR');assert.ok(full.fundamentalDates?.ebitda);
 }
 console.log('Real public Apple, Nextil, Amper and OHLA fundamentals verified; absent data are not fabricated.');
}
console.log('Stock fundamentals passed: identity, raw/flat values, currencies, monetary scale, margins vs debt/equity, true zero, negative/tiny EPS, source parsing and missing data.');
