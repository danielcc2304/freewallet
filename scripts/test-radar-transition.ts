import assert from 'node:assert/strict';
import { scoreRadarFunds } from '../src/services/funds/fundScoring';
import type { RadarFund } from '../src/services/fundRadar/types';
const now=new Date('2026-11-17T12:00:00Z');
const fund=(id:string,sharpe:number):RadarFund=>({id,isin:'FR0000989626',name:id,category:'Monetario',manager:'',description:'',source_url:null,manual_metrics:{},extra:{},auto_refresh:true,is_active:true,version:1,created_at:'',updated_at:'',updated_by:null,fund_radar_data:{metrics:{sharpe,currency:'EUR',window:'3y',dates:{sharpe:'2026-10-31'}},provider_category:id,source_url:null,checked_at:null,last_success_at:null}});
const funds=[fund('a',3.95),fund('b',2.83)];
const scores=scoreRadarFunds(funds,now);
assert.ok(scores.get('a')!.grade!>scores.get('b')!.grade!);
assert.equal(scores.get('a')!.method,'published-sharpe');assert.equal(scores.get('a')!.provisional,true);
assert.equal(scores.get('a')!.value,3.95);assert.match(scores.get('a')!.label,/provisional/);
assert.equal(scoreRadarFunds([funds[0]],now).get('a')!.grade,null);
for(const metrics of [{sharpe:NaN},{sharpe:null},{dates:{sharpe:'2020-10-31'}},{dates:{sharpe:'2026-02-31'}},{dates:{sharpe:'2027-01-01'}},{currency:null},{window:null}]){
 const invalid={...funds[0],fund_radar_data:{...funds[0].fund_radar_data!,metrics:{...funds[0].fund_radar_data!.metrics,...metrics}}};
 assert.equal(scoreRadarFunds([invalid,...funds.slice(1)],now).get('a')!.grade,null);
}
assert.equal(scoreRadarFunds([{...funds[0],auto_refresh:false}],now).get('a')!.value,null,'Never trust undated manual legacy ratios');
const configured={...funds[0],extra:{comparison:{method:'sortino' as const,currency:'EUR',accumulation:true,targetAnnualPct:0}}};
assert.equal(scoreRadarFunds([configured,...funds.slice(1)],now).get('a')!.method,'sortino','Explicit advanced configuration always wins');
assert.equal(scoreRadarFunds([configured,...funds.slice(1)],now).get('a')!.grade,null,'Never disguise a configured advanced metric as a fallback');
assert.ok([...scoreRadarFunds(Array.from({length:6},(_,i)=>fund(String(i),i)),now).values()].every(s=>s.provisional),'Transition grades remain provisional even with many peers');
console.log('PASS: existing catalog receives explicit published-Sharpe transition grades, excluding stale/invalid/manual data; configured advanced methods remain separate.');
