import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chooseUnderlyingResult } from '../src/services/dashboardIntegrity';
import { underlyingQueries } from '../src/services/underlyingInstruments';
import type { SearchResult } from '../src/types/types';
const stock=(symbol:string,name:string,isin?:string):SearchResult=>({symbol,name,isin,type:'stock',currency:'Unknown',region:'Global'});
const alibaba={symbol:'Alibaba Group Holding Ltd Ordinary Shares',name:'Alibaba Group Holding Ltd Ordinary Shares',percentage:2};
assert.deepEqual(underlyingQueries(alibaba),[{query:'9988.HK',isinSearch:false}]);
assert.equal(chooseUnderlyingResult([stock('BABA','Alibaba Group Holding Limited'),stock('9988.HK','Alibaba Group Holding Limited')],alibaba)?.symbol,'9988.HK');
assert.equal(chooseUnderlyingResult([stock('BABA','Alibaba Group Holding Limited')],alibaba),undefined,'Ordinary shares never fall back to the ADR');
assert.equal(chooseUnderlyingResult([stock('9988.HK','Unrelated Holding Limited')],alibaba),undefined);
assert.equal(chooseUnderlyingResult([stock('9988.HK','Alibaba Group Holding Limited','US01609W1027')],{...alibaba,isin:'KYG017191142'}),undefined);
const alphabet={symbol:'',name:'Alphabet Inc Class A',percentage:2};
assert.equal(chooseUnderlyingResult([stock('B02.F','Nueva Expresion Textil, S.A.')],{symbol:'ES0126962069',isin:'ES0126962069',name:'Nueva Expresion Textil SA',percentage:1})?.symbol,'B02.F');
assert.equal(chooseUnderlyingResult([stock('GOOG','Alphabet Inc.'),stock('GOOGL','Alphabet Inc.')],alphabet)?.symbol,'GOOGL');
assert.equal(chooseUnderlyingResult([stock('GOOG','Alphabet Inc.')],alphabet),undefined);
const samsung={symbol:'KR7005931001',isin:'KR7005931001',name:'Samsung Electronics Co Ltd Pfd Registered Shs Non-Voting',percentage:1};
assert.equal(chooseUnderlyingResult([stock('005935.KS','Samsung Electronics Co., Ltd.')],samsung,true)?.symbol,'005935.KS');
assert.equal(chooseUnderlyingResult([stock('005935.KS','Samsung Electronics Co., Ltd.')],samsung),undefined,'Name alone cannot prove the requested ISIN');
assert.equal(chooseUnderlyingResult([stock('005935.KS','Unrelated Company')],samsung,true),undefined);
assert.equal(chooseUnderlyingResult([stock('005935.KS','Samsung Electronics Co., Ltd.','KR7005930003')],samsung,true),undefined);
assert.equal(chooseUnderlyingResult([stock('ONE','Example Company'),stock('TWO','Example Company')],{symbol:'',name:'Example Company',percentage:1}),undefined);
const fixtures=process.env.FREEWALLET_UNDERLYING_FIXTURES;
if(fixtures){
 for(const [isin,name,symbol] of [
  ['KYG017191142',alibaba.name,'9988.HK'],['KYG875721634','Tencent Holdings Ltd','0700.HK'],
  ['TW0002330008','Taiwan Semiconductor Manufacturing Co Ltd','2330.TW'],['KR7005930003','Samsung Electronics Co Ltd','005930.KS'],
  ['KYG9830T1067','Xiaomi Corp Class B','1810.HK'],['KYG596691041','Meituan Class B','3690.HK'],
  ['US02079K1079','Alphabet Inc Class C','GOOG'],['US30303M1027','Meta Platforms Inc Class A','META'],
 ]){
  const payload=JSON.parse(readFileSync(`${fixtures}/fw-underlying-${isin}.json`,'utf8'));
  const results:SearchResult[]=payload.quotes.filter((r:{quoteType:string})=>r.quoteType==='EQUITY').map((r:{symbol:string;longname?:string;shortname?:string;isin?:string})=>stock(r.symbol,r.longname||r.shortname||r.symbol,r.isin));
  assert.equal(chooseUnderlyingResult(results,{symbol:isin,isin,name,percentage:1},true)?.symbol,symbol);
 }
 for(const [name,symbol] of [
  [alibaba.name,'9988.HK'],['Tencent Holdings Ltd','0700.HK'],['Xiaomi Corp Class B','1810.HK'],['Meituan Class B','3690.HK'],
  ['Alphabet Inc Class C','GOOG'],[alphabet.name,'GOOGL'],['Meta Platforms Inc Class A','META'],['Apple Inc','AAPL'],
  ['NVIDIA Corp','NVDA'],['Microsoft Corp','MSFT'],['Amazon.com Inc','AMZN'],['Broadcom Inc','AVGO'],['Micron Technology Inc','MU'],
  ['PDD Holdings Inc ADR','PDD'],['NetEase Inc Ordinary Shares','9999.HK'],
 ]){
  const payload=JSON.parse(readFileSync(`${fixtures}/fw-underlying-ticker-${symbol}.json`,'utf8'));
  const results:SearchResult[]=payload.quotes.filter((r:{quoteType:string})=>r.quoteType==='EQUITY').map((r:{symbol:string;longname?:string;shortname?:string;isin?:string})=>stock(r.symbol,r.longname||r.shortname||r.symbol,r.isin));
  const holding={name,symbol:name,percentage:1};
  assert.equal(chooseUnderlyingResult(results,holding)?.symbol,symbol);
  assert.deepEqual(underlyingQueries(holding),[{query:symbol,isinSearch:false}]);
 }
 console.log('Actual Yahoo responses verified for eight ISIN lookups and all fifteen referenced listings.');
}
console.log('Underlying resolution passed: ordinary shares vs ADR, exact classes, company identity, ISIN provenance/conflicts and ambiguous names.');
