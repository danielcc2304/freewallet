import assert from 'node:assert/strict';
import { extractFinectInitialState, normalizeFinectFundModel } from '../src/services/finect/finectService';
import { selectFundHoldings, holdingsCoverage, availableFundDistributions, fundDistributionLabel } from '../src/services/fundBreakdown';
import { buildConsolidatedPortfolioExposures } from '../src/services/portfolioComposition';

const model = { name: 'Synthetic fund', alias: 'synthetic', isin: 'IE00BYX5NX33',
    description: 'A 50% allocation with "quotes" and apostrophes: l\'entreprise.',
    portfolio: { holdings: Array.from({length:18},(_,i)=>({name:`Synthetic issuer ${String.fromCharCode(65+i).repeat(3)}`,weight:2})) },
    breakdown: [{type:'asset-allocation',items:[{drawer:'Equity',values:{long:70}},{drawer:'Cash',values:{long:30}}]}],
};
const state = {fund:{fund:{model}},filters:{country:"eq+'esp'"}};
for (const html of [
    `<script>window.INITIAL_STATE=${JSON.stringify(JSON.stringify(state))};</script>`,
    `<script>window.INITIAL_STATE="${encodeURIComponent(JSON.stringify(state))}";</script>`,
    `<script>window.INITIAL_STATE='${JSON.stringify(state).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}';</script>`,
]) assert.deepEqual(extractFinectInitialState(html),state,'Reads the whole state, including escaped delimiters and literal percent signs');
assert.throws(()=>extractFinectInitialState('window.INITIAL_STATE="{invalid}";'),/interpretar/);
assert.throws(()=>extractFinectInitialState('window.INITIAL_STATE=alert(1);'),/información/);
const parsed=normalizeFinectFundModel(model,'IE00BYX5NX33','https://www.finect.com/fondos-inversion/synthetic');
assert.equal(parsed.holdings.length,18,'Do not discard positions beyond the first ten');
const saved=[{name:'Synthetic saved',symbol:'SAVED',percentage:10}];
const remote=parsed.holdings.map(h=>({name:h.name,symbol:h.name,percentage:h.weight}));
assert.equal(selectFundHoldings(saved,remote).source,'provider');
assert.equal(selectFundHoldings(saved,remote).holdings.length,18);
assert.equal(selectFundHoldings([{...saved[0],percentage:80}],remote).source,'saved','A smaller response cannot silently erase a richer saved portfolio');
assert.equal(selectFundHoldings(saved,[]).holdings.length,1,'Provider missing data retains a saved breakdown');
assert.equal(selectFundHoldings([{...saved[0],percentage:NaN}],remote).source,'provider');
const asset={id:'fund',symbol:'IE00BYX5NX33',name:'Synthetic fund',type:'fund' as const,quantity:1,purchasePrice:100,currentPrice:100,purchaseDate:'2026-01-01',currency:'EUR'};
const exposures=buildConsolidatedPortfolioExposures([asset],new Map([[asset.id,remote]]));
assert.equal(exposures.filter(e=>!e.isResidual).length,18);
assert.equal(exposures.filter(e=>e.isResidual).reduce((sum,e)=>sum+e.value,0),64);
assert.equal(exposures.reduce((sum,e)=>sum+e.value,0),100);
assert.equal(holdingsCoverage(remote),36);
assert.equal(availableFundDistributions(parsed.breakdowns).length,1,'Asset allocation is available even without sector data');
assert.equal(fundDistributionLabel('asset-allocation'),'Tipos de activo');
assert.equal(fundDistributionLabel('regional-exposure'),'Distribución geográfica');
console.log('Fund breakdown passed: current/legacy Finect state, escaped quotes, all published positions, one source per fund, saved fallback, distributions and exact residual reconciliation.');
