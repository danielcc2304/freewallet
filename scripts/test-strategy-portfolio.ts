import assert from 'node:assert/strict';
import {ASSET_KEYS,MODEL_PORTFOLIOS,type Allocation} from '../src/data/academy/portfolioModels';
import {DEFAULT_ALLOCATION,EMPTY_ALLOCATION,DEFAULT_ASSUMPTIONS,STRESS_SCENARIOS,allocationQuery,calculateAllocationScenario,modelAllocation,normalizeAllocation,readAllocationQuery,validAllocation} from '../src/utils/strategyPortfolio';
const close=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
assert.equal(new Set(MODEL_PORTFOLIOS.map(model=>model.id)).size,MODEL_PORTFOLIOS.length);
for(const model of MODEL_PORTFOLIOS){assert.ok(validAllocation(modelAllocation(model)),model.id);assert.equal(model.data.reduce((sum,part)=>sum+part.value,0),100);}
assert.deepEqual(MODEL_PORTFOLIOS.filter(model=>model.horizons.includes('short')&&model.risk==='conservative').map(model=>model.id),['short-reserve']);
const allWeather=MODEL_PORTFOLIOS.find(model=>model.id==='all-weather')!;
assert.deepEqual(modelAllocation(allWeather),{stocks:30,bonds:55,cash:0,crypto:0,gold:7.5,commodities:7.5,reits:0});
const input=DEFAULT_ALLOCATION;const shocks=STRESS_SCENARIOS[0].shocks;
const calc=(allocation=input,rho=.25)=>calculateAllocationScenario(allocation,DEFAULT_ASSUMPTIONS,rho,shocks,10000);
const result=calc();close(result.annualReturn,4.4);close(result.volatility,Math.sqrt(139.6));close(result.stress,-24.2);close(result.stressEuros,-2420);close(result.stressValue,7580);
// Independent covariance expansion: wStocks=.6, sigmaStocks=18; wBonds=.4, sigmaBonds=7.
close(calc(input,0).volatility,Math.sqrt(.6**2*18**2+.4**2*7**2));
close(calc(input,1).volatility,.6*18+.4*7);
for(const rho of [0,.25,1]){const single=calc({...EMPTY_ALLOCATION,stocks:100},rho);close(single.annualReturn,6);close(single.volatility,18);close(single.stress,-35);}
const cash=calc({...EMPTY_ALLOCATION,cash:100});close(cash.volatility,0);close(cash.annualReturn,1);
assert.ok(calc(input,0).volatility<calc(input,.25).volatility&&calc(input,.25).volatility<calc(input,1).volatility);
const negative=structuredClone(DEFAULT_ASSUMPTIONS);negative.stocks.annualReturn=-10;close(calculateAllocationScenario(input,negative,.25,shocks,10000).annualReturn,-5.2);
const zero=Object.fromEntries(ASSET_KEYS.map(key=>[key,-100])) as Allocation;close(calculateAllocationScenario(input,DEFAULT_ASSUMPTIONS,.25,zero,10000).stressValue,0);
for(const invalid of [{...input,stocks:59},{...input,stocks:61},{...input,stocks:-1,bonds:101},{...input,stocks:NaN},{...input,bonds:Infinity}]){assert.equal(validAllocation(invalid),false);assert.throws(()=>calc(invalid));}
for(const rho of [-.1,1.1,NaN])assert.throws(()=>calc(input,rho));
for(const amount of [0,-100,Infinity,1e13])assert.throws(()=>calculateAllocationScenario(input,DEFAULT_ASSUMPTIONS,.25,shocks,amount));
for(const change of [{annualReturn:NaN,volatility:7},{annualReturn:101,volatility:7},{annualReturn:2,volatility:-1},{annualReturn:2,volatility:201}])assert.throws(()=>calculateAllocationScenario(input,{...DEFAULT_ASSUMPTIONS,bonds:change},.25,shocks,10000));
assert.throws(()=>calculateAllocationScenario(input,DEFAULT_ASSUMPTIONS,.25,{...shocks,stocks:-101},10000));
assert.deepEqual(normalizeAllocation({...EMPTY_ALLOCATION,stocks:1,bonds:1,cash:1}),{stocks:33.34,bonds:33.33,cash:33.33,crypto:0,gold:0,commodities:0,reits:0});
assert.equal(normalizeAllocation(EMPTY_ALLOCATION),null);assert.equal(normalizeAllocation({...input,stocks:-1}),null);
const original=modelAllocation(allWeather);const url=allocationQuery(original,12345.67,allWeather.id);const restored=readAllocationQuery(new URLSearchParams(url));assert.deepEqual(restored.allocation,original);close(restored.capital,12345.67);assert.equal(restored.model?.id,allWeather.id);assert.equal(restored.error,null);
for(const value of ['null','{}','[]','not-json',JSON.stringify({...input,stocks:10})])assert.ok(readAllocationQuery(new URLSearchParams({allocation:value})).error);
assert.ok(readAllocationQuery(new URLSearchParams({capital:'Infinity'})).error);
assert.deepEqual(input,{stocks:60,bonds:40,cash:0,crypto:0,gold:0,commodities:0,reits:0},'Calculations must not mutate the input');
console.log('PASS: model totals and classifications, seven-block transfer, covariance math, negative/zero scenarios, invalid inputs, explicit normalization and URL round-trip.');
