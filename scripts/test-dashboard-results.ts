import assert from 'node:assert/strict';
import { calculatePortfolioResults } from '../src/services/portfolioResults';
import { createQuoteSnapshot, normalizePortfolioTransactions } from '../src/services/portfolioPerformance';
import { portfolioQuoteStatus } from '../src/services/portfolioQuoteStatus';
import type { Asset, PortfolioTransaction } from '../src/types/types';

const now = Date.parse('2026-10-06T14:00:00Z');
const asset: Asset = { id:'a',symbol:'TEST',name:'Synthetic',type:'stock',quantity:5,purchasePrice:10,purchaseDate:'2026-01-01',currentPrice:10,currency:'EUR',quotedAt:'2026-10-06T12:00:00Z',lastCheckedAt:'2026-10-06T13:59:00Z' };
const trade = (id:string,type:'buy'|'sell',quantity:number,price:number,date='2026-01-01'): PortfolioTransaction => ({id,assetId:asset.id,assetSymbol:asset.symbol,assetName:asset.name,assetType:asset.type,type,quantity,price,total:quantity*price,date,createdAt:date+'T12:00:00Z'});
const buy = trade('1','buy',10,10), sell = trade('2','sell',5,20,'2026-02-01');
let result = calculatePortfolioResults([asset],[sell,buy],now);
assert.equal(result.realizedGain,50); assert.equal(result.unrealizedGain,0); assert.equal(result.totalGain,50); assert.equal(result.percentageGain,0);
result = calculatePortfolioResults([], [buy,trade('2','sell',10,20,'2026-02-01')], now);
assert.equal(result.realizedGain,100); assert.equal(result.totalGain,100); assert.ok(Number.isNaN(result.percentageGain),'No percent against zero remaining cost');
result = calculatePortfolioResults([{...asset,quantity:10,purchasePrice:15,currentPrice:18}],[buy,trade('2','buy',10,20,'2026-02-01'),trade('3','sell',10,12,'2026-03-01')],now);
assert.equal(result.realizedGain,-30); assert.equal(result.unrealizedGain,30); assert.equal(result.totalGain,0);
result = calculatePortfolioResults([{...asset,quantity:10,purchasePrice:20,currentPrice:20}],[buy,sell,trade('3','buy',5,30,'2026-03-01')],now);
assert.equal(result.realizedGain,50); assert.equal(result.unrealizedGain,0);
// Importing a position supplies an opening cost, not invented earlier sales.
assert.equal(calculatePortfolioResults([asset],[],now).realizedGain,0);
const wrongBuy={...buy,assetId:'mistake'};
const wrongDelete={...wrongBuy,id:'wrong-delete',type:'delete' as const,date:'2026-02-01'};
const correction=[{assetId:'mistake',deletionId:'wrong-delete',confirmedAt:'2026-02-02T12:00:00Z'}];
assert.ok(Number.isNaN(calculatePortfolioResults([asset],[wrongBuy,wrongDelete],now).realizedGain),'A deletion is unresolved until explicitly classified');
const corrected=calculatePortfolioResults([asset],[wrongBuy,wrongDelete],now,correction);
assert.equal(corrected.realizedGain,0);assert.equal(corrected.totalGain,0);assert.equal(corrected.deletionReviews[0].discarded,true);
assert.ok(Number.isNaN(calculatePortfolioResults([asset],[wrongBuy,wrongDelete],now).totalGain),'Undo restores the unresolved state');
assert.ok(Number.isNaN(calculatePortfolioResults([asset],[wrongBuy,{...sell,assetId:'mistake'},wrongDelete],now,correction).totalGain),'Sales cannot be hidden as an erroneous record');
assert.ok(Number.isNaN(calculatePortfolioResults([asset],[wrongBuy,wrongDelete],now,[{...correction[0],deletionId:'another-deletion'}]).totalGain),'Corrections must identify the actual deletion');
assert.equal(calculatePortfolioResults([{...asset,quantity:0}],[],now).realizedGain,0,'An imported empty position has no gain');
const opening = normalizePortfolioTransactions([{...asset,quantity:10}],[]);
assert.equal(calculatePortfolioResults([asset],[...opening,sell],now).totalGain,50);
for (const transactions of [[sell],[buy,sell,sell],[buy,{...sell,quantity:11,total:220}],[{...buy,total:NaN},sell],[buy,{...sell,date:'2026-02-30'}],[buy,{...sell,type:'delete' as const}]]) {
    const r=calculatePortfolioResults([asset],transactions,now);
    assert.ok(Number.isNaN(r.realizedGain));assert.ok(Number.isNaN(r.totalGain));assert.ok(r.resultUnavailableReason);
}
assert.ok(Number.isNaN(calculatePortfolioResults([{...asset,purchasePrice:11}],[buy,sell],now).totalGain),'Unexplained basis edit');
assert.ok(Number.isNaN(calculatePortfolioResults([], [buy],now).totalGain),'Deleting a holding is not selling it');
assert.ok(Number.isNaN(calculatePortfolioResults([asset], [buy,{...buy,id:'edit',type:'edit',date:'2026-01-15'},sell],now).realizedGain),'An edit before a sale makes its cost unverifiable');
assert.equal(calculatePortfolioResults([{...asset,quantity:10}], [buy,{...sell,date:'2026-12-01'}],now).realizedGain,0,'Future sales are excluded');
assert.equal(calculatePortfolioResults([asset], [buy,{...sell,total:90}],now).realizedGain,40,'Recorded net proceeds take priority over gross price');
assert.equal(calculatePortfolioResults([{...asset,type:'cash',quantity:100,purchasePrice:1,currentPrice:1}], [],now).realizedGain,0);
assert.ok(Number.isNaN(calculatePortfolioResults([asset,asset],[buy,sell],now).totalGain),'Duplicate positions');
assert.ok(createQuoteSnapshot([asset],[],new Date(now).toISOString()));
const day=86400000;
for (const [type,margin] of [['fund',7],['stock',4],['crypto',2]] as const) {
    const valid={...asset,type,quotedAt:new Date(now-margin*day).toISOString()};
    assert.ok(createQuoteSnapshot([valid],[],new Date(now).toISOString()));
    assert.equal(createQuoteSnapshot([{...valid,quotedAt:new Date(now-margin*day-1).toISOString()}],[],new Date(now).toISOString()),null,'A recent provider check cannot rescue a stale price');
}
for (const quotedAt of [undefined,'invalid','2026-11-01T12:00:00Z']) assert.equal(createQuoteSnapshot([{...asset,quotedAt}],[],new Date(now).toISOString()),null);
assert.equal(createQuoteSnapshot([{...asset,lastCheckedAt:undefined}],[],new Date(now).toISOString()),null,'A price timestamp is not evidence of a provider check');
const batch={...asset,quoteOrigin:'batch' as const,lastCheckedAt:'2026-10-05T20:00:00Z',lastReadAt:new Date(now).toISOString()};
assert.equal(createQuoteSnapshot([{...batch,lastCheckedAt:new Date(now).toISOString()}],[],new Date(now).toISOString()),null,'Even a freshly completed batch must not be restamped by the browser');
assert.equal(portfolioQuoteStatus(batch,now).valuationBlockers.length,0);
assert.ok(portfolioQuoteStatus(batch,now).blockers.length);
assert.equal(createQuoteSnapshot([batch],[],new Date(now).toISOString()),null,'Reading yesterday’s batch cannot fabricate today’s snapshot');
assert.ok(createQuoteSnapshot([{...asset,type:'cash',currentPrice:1,quotedAt:undefined,lastCheckedAt:undefined}],[],new Date(now).toISOString()));
console.log('Dashboard results passed: realized and unrealized gains, closed positions, average cost, incomplete ledgers, quote-date limits and batch freshness.');

const reconstructed = calculatePortfolioResults([asset], [buy, { ...sell, estimated: true }], now);
assert.equal(reconstructed.resultEstimated, true);
assert.equal(reconstructed.realizedGain, 50);
assert.equal(reconstructed.totalGain, 50);
assert.equal(calculatePortfolioResults([asset], [buy, sell], now).resultEstimated, false);
assert.equal(calculatePortfolioResults([{...asset,quantity:10}], [buy, { ...sell, estimated:true,date:'2027-01-01' }], now).resultEstimated, false);
