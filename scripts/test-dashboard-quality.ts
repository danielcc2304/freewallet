import assert from 'node:assert/strict';
import { DashboardMarketHistoryCache } from '../src/services/dashboardMarketHistory';
import { positionLotCounts } from '../src/services/dashboardIntegrity';
import type { Asset, HistoricalDataPoint, TimePeriod } from '../src/types/types';

const lot: Asset = {id:'first', symbol:'SYNTH', name:'Synthetic', type:'stock', quantity:1, purchasePrice:10, purchaseDate:'2026-01-01', currency:'EUR'};
assert.deepEqual(positionLotCounts([lot, {...lot,id:'second',purchaseDate:'2026-02-01'}]),{extraLots:1,duplicateIds:0});
assert.equal(positionLotCounts([lot,lot]).duplicateIds,1);
assert.equal(positionLotCounts([lot,{...lot,id:'usd',currency:'USD'}]).extraLots,0);
const candle=(date:string,close:number):HistoricalDataPoint=>({date,close,open:close,high:close,low:close,volume:0,currency:'EUR'});
const cache=new DashboardMarketHistoryCache();
const calls:TimePeriod[]=[];let fail=false;
const loader=async (_symbol:string,period:TimePeriod)=>{
    calls.push(period);if(fail)throw new Error('Temporary outage');
    return period==='ALL'?[candle('2026-09-15',100),candle('2026-09-20',101),candle('2026-10-01',102)]
        :[candle('2026-09-20',105),candle('2026-10-02',110)];
};
const signal=new AbortController().signal;
const start=Date.parse('2026-10-02T12:00:00Z');const hour=3600000;
await cache.load('TEST',signal,loader,start);
for(let minutes=5;minutes<360;minutes+=5)await cache.load('test',signal,loader,start+minutes*60000);
assert.deepEqual(calls,['ALL'],'Five-minute quotes must not download all historical candles again');
const tail=await cache.load('TEST',signal,loader,start+6*hour);
assert.deepEqual(calls,['ALL','1M']);assert.equal(tail[0].date,'2026-09-15');assert.equal(tail[1].close,105);
assert.ok(!tail.some(p=>p.date==='2026-10-01'),'Removed overlapping candles must not survive a provider correction');
fail=true;const retained=await cache.load('TEST',signal,loader,start+12*hour);
assert.deepEqual(retained,tail);
await cache.load('TEST',signal,loader,start+12*hour+1000);assert.equal(calls.length,3);
await cache.load('TEST',signal,loader,start+12*hour+5*60000);assert.equal(calls.length,4);
fail=false;await cache.load('TEST',signal,loader,start+26*86400000);assert.equal(calls.at(-1),'ALL');
const aborted=new AbortController();aborted.abort();
await assert.rejects(new DashboardMarketHistoryCache().load('TEST',aborted.signal,loader,start));
const bounded=new DashboardMarketHistoryCache(1);const before=calls.length;
await bounded.load('A',signal,loader,start);await bounded.load('B',signal,loader,start);await bounded.load('A',signal,loader,start);
assert.equal(calls.length-before,3,'Cache must evict old symbols');
console.log('PASS: legitimate lots, duplicate IDs, six-hour history cache, incremental corrections, bounded retries, cancellation and eviction.');
