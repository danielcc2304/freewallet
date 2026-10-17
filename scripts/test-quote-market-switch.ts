import assert from 'node:assert/strict';
import {getPortfolioAssetQuote} from '../src/services/portfolioQuoteService';
import {dailyPriceQuote,type DailyPrice} from '../src/services/dailyMarketData';
import {applicableQuoteUpdates} from '../src/services/dashboardIntegrity';
import {stockQuoteVenueChanged} from '../src/services/market/stockQuoteMarkets';
import type {Asset} from '../src/types/types';

const memory=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value),removeItem:(key:string)=>memory.delete(key)}});
const now=Date.now(),at=new Date(now-3600000).toISOString(),fresh=new Date(now).toISOString();
const asset:Asset={id:'n',type:'stock',symbol:'NXTE.XD',name:'Synthetic security',isin:'ES0126962069',currency:'EUR',quantity:10,purchasePrice:1,purchaseDate:'2026-01-01',currentPrice:1.4,quotedAt:fresh,quoteInstrument:'NXTE.XD'};
const price:DailyPrice={instrument:'NXT:BME',price_eur:1.2,previous_close_eur:1.1,quoted_at:at,checked_at:fresh,source:'Google Finance'};
assert.equal(stockQuoteVenueChanged(asset),true);
assert.equal(dailyPriceQuote(asset,price,now)?.price,1.2,'A newer Cboe timestamp must not block the selected Madrid series');
assert.equal(dailyPriceQuote({...asset,quoteInstrument:'NXT:BME'},price,now),undefined,'Dates remain monotonic within the same venue');
assert.equal(dailyPriceQuote({...asset,quoteInstrument:undefined},price,now)?.price,1.2,'A legacy quote of unknown venue cannot block the verified default');
assert.equal(dailyPriceQuote(asset,{...price,instrument:'NXTE.XD'},now),undefined,'An explicitly different venue is not a selected-market fallback');
const originalFetch=globalThis.fetch;
try {
    globalThis.fetch=async()=>new Response(`AF_initDataCallback({key:'test',data:${JSON.stringify([['/g/test',['NXT','BME'],'Synthetic security',0,'EUR',[1.2],null,1.1,null,'ES',null,[Math.floor((now-3600000)/1000)]]])}, sideChannel:{}})`);
    const changed=await getPortfolioAssetQuote(asset,undefined,true);
    assert.equal(changed?.price,1.2);assert.equal(changed?.quoteInstrument,'NXT:BME');
    assert.equal(await getPortfolioAssetQuote({...asset,quoteInstrument:'NXT:BME'},undefined,true),null,'A provider cannot roll a venue back to an older observation');
    const updates=[{id:asset.id,updates:{currentPrice:1.2,quotedAt:at,quoteInstrument:'NXT:BME'}}];
    assert.equal(applicableQuoteUpdates([asset],[asset],updates).length,1,'The final reducer accepts the venue change');
    assert.equal(applicableQuoteUpdates([asset],[{...asset,quoteInstrument:'NXT:BME'}],updates).length,0,'The reducer rejects stale replies within one venue');
    memory.set('freewallet_settings',JSON.stringify({stockQuoteMarkets:{n:'original'}}));
    const madrid={...asset,quoteInstrument:'NXT:BME'};
    assert.equal(stockQuoteVenueChanged(madrid),true);
    assert.equal(dailyPriceQuote(madrid,{...price,instrument:'NXTE.XD',source:'Yahoo Finance'},now)?.price,1.2,'Changing back to the original market is symmetric');
} finally {globalThis.fetch=originalFetch;}
console.log('PASS: per-venue timestamps, older but correct selected venue, unknown legacy origin, provider and batch parity, reducer protection and switching back.');
