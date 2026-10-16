import assert from 'node:assert/strict';
import {scoreRadarFunds} from '../src/services/funds/fundScoring';
import {effectiveMetrics,validateDraft,validIsin,type RadarFund,type RadarDraft} from '../src/services/fundRadar/types';
import {parseFinectRadar,extractRadarModel,fetchFinectRadar} from '../supabase/functions/fund-radar-refresh/finect';
import {handleRadarRefresh,type RadarRefreshDependencies} from '../supabase/functions/fund-radar-refresh/handler';
const now=new Date('2026-10-16T12:00:00Z');
const fund=(id:string,y3=5):RadarFund=>({id,isin:'IE00BYX5NX33',name:`Fund ${id}`,manager:'Manager',category:'Global EUR',description:'',source_url:null,manual_metrics:{y3,volatility:8,maxDrawdown:-10,ter:0.2,currency:'EUR',window:'3y',dates:{y3:'2026-10-13',volatility:'2026-09-30',maxDrawdown:'2026-09-30'}},extra:{},auto_refresh:false,is_active:true,version:1,created_at:now.toISOString(),updated_at:now.toISOString(),updated_by:null});
const all=Array.from({length:5},(_,i)=>fund(String(i),i));
const scores=scoreRadarFunds(all,now);assert.equal(scores.get('4')?.value,100);assert.equal(scores.get('0')?.value,0);
assert.equal(scoreRadarFunds(all.slice(0,1),now).get('0')?.value,null,'a single fund never receives an invented 90/100');
assert.equal(scoreRadarFunds(all.slice(0,4),now).get('0')?.value,null);
assert.equal(scoreRadarFunds(all.map(f=>({...f,manual_metrics:{...f.manual_metrics,y3:5}})),now).get('0')?.value,50,'ties share a neutral percentile');
const zero=fund('zero',0);assert.notEqual(scoreRadarFunds([...all,zero],now).get('zero')?.value,null,'zero return is data, not missing');
const expensive={...all[4],manual_metrics:{...all[4].manual_metrics,ter:10}};assert.equal(scoreRadarFunds([...all.slice(0,4),expensive],now).get('4')?.value,scores.get('4')?.value,'TER is not deducted twice from net returns');
for(const replacement of [
 {...all[0],manual_metrics:{...all[0].manual_metrics,y3:null}},
 {...all[0],manual_metrics:{...all[0].manual_metrics,window:null}},
 {...all[0],manual_metrics:{...all[0].manual_metrics,currency:'USD'}},
 {...all[0],manual_metrics:{...all[0].manual_metrics,dates:{y3:'2026-01-01',volatility:'2026-01-01',maxDrawdown:'2026-01-01'}}},
 {...all[0],manual_metrics:{...all[0].manual_metrics,dates:{y3:'2099-01-01',volatility:'2026-09-30',maxDrawdown:'2026-09-30'}}},
 {...all[0],manual_metrics:{...all[0].manual_metrics,dates:{y3:'2026-10-13',volatility:'2026-07-31',maxDrawdown:'2026-07-31'}}},
 {...all[0],category:'Another category'},
])assert.equal(scoreRadarFunds([replacement,...all.slice(1)],now).get('0')?.value,null);
const draft:RadarDraft={isin:all[0].isin,name:all[0].name,category:all[0].category,manager:'',description:'',source_url:'https://www.finect.com/',manual_metrics:all[0].manual_metrics,extra:{},auto_refresh:true,is_active:true};
validateDraft(draft,now);assert.equal(validIsin('IE00BYX5NX32'),false);
assert.throws(()=>validateDraft({...draft,source_url:'javascript:alert(1)'},now));
assert.throws(()=>validateDraft({...draft,manual_metrics:{ter:NaN}},now));
assert.throws(()=>validateDraft({...draft,manual_metrics:{risk:1.5}},now));
assert.throws(()=>validateDraft({...draft,extra:{allocation:[{label:'A',value:80},{label:'B',value:40}]}},now));
const auto:RadarFund={...fund('auto'),auto_refresh:true,fund_radar_data:{metrics:{y3:8,dates:{y3:'2026-10-14'}},provider_category:null,source_url:null,checked_at:null,last_success_at:null}};
assert.equal(effectiveMetrics(auto).y3,8);assert.equal(effectiveMetrics(auto).volatility,8);assert.equal(effectiveMetrics({...auto,auto_refresh:false}).y3,5);
const model={isin:'IE00BYX5NX33',name:'Fixture',currency:{code:'EUR'},class:{name:'Fixture EUR',fees:{ter:{value:0.12}}},lastQuote:{price:100,datetime:'2020-01-15'},srri:4,stats:{performance:{periods:[{type:'accumulated',period:'M36',value:40,date:'2020-01-15'},{type:'annualized',period:'M36',value:12,date:'2020-01-15'},{type:'annualized',period:'M60',value:8,date:'2020-01-15'},{type:'accumulated',period:'M0',value:3,date:'2020-01-15'}]},standardDeviation:[{period:'M36',value:10,date:'2020-01-15'}],maxDrawdown:[{period:'M36',value:-20,date:'2020-01-15'}]}};
const result=parseFinectRadar(model,'IE00BYX5NX33','https://www.finect.com/fund');
assert.equal(result.metrics.y3,12,'select annualized, never accumulated 3Y');assert.equal(result.metrics.y5,8);assert.equal(result.metrics.ter,0.12);assert.equal(result.metrics.dates.nav,'2020-01-15');assert.equal(result.metrics.dates.y3,'2020-01-15');
assert.throws(()=>parseFinectRadar({...model,isin:'LU0034353002',classes:[{isin:'IE00BYX5NX33'}]},'IE00BYX5NX33','https://www.finect.com/'),'do not borrow metrics from another class');
assert.equal(parseFinectRadar({...model,lastQuote:{price:120,datetime:'2099-01-01'}},'IE00BYX5NX33','https://www.finect.com/').metrics.nav,undefined,'future-dated NAV is ignored');
const state={fund:{fund:{model}}};assert.deepEqual(extractRadarModel(`window.INITIAL_STATE=${JSON.stringify(JSON.stringify(state))};`),model);
assert.deepEqual(extractRadarModel(`window.INITIAL_STATE='${encodeURIComponent(JSON.stringify(state))}';`),model);
let fetches=0;
const fetched=await fetchFinectRadar('IE00BYX5NX33','public-fixture-key',AbortSignal.timeout(5000),async(url)=>{
 fetches++;const u=new URL(String(url));assert.equal(u.protocol,'https:');assert.ok(['api.finect.com','www.finect.com'].includes(u.hostname));
 if(u.pathname==='/v4/search')return Response.json({data:[{type:'fund',entity:{isin:'IE00BYX5NX33',alias:'fixture'}}]});
 if(u.hostname==='www.finect.com')return new Response('Unavailable',{status:503});
 return Response.json({data:{entity:model}});
});assert.equal(fetches,3);assert.equal(fetched.metrics.nav,100);
let lookups=0,published=0;
const deps:RadarRefreshDependencies={claim:async()=>({lease:'fixture',funds:[{id:'a',isin:'IE00BYX5NX33'},{id:'b',isin:'LU0034353002'}]}),fetchFund:async(isin)=>{lookups++;if(isin==='LU0034353002')throw new Error('Unavailable');return result;},finish:async(_lease,items)=>{published++;assert.equal(items.length,2);assert.ok(items.some(i=>i.error));return{updated:1,failed:1,skipped:0};}};
assert.equal((await handleRadarRefresh(new Request('https://fixture',{method:'POST'}),deps)).status,401);
assert.equal((await handleRadarRefresh(new Request('https://fixture',{method:'POST',headers:{authorization:'Bearer fixture'},body:'{"fundId":"../wrong"}'}),deps)).status,400);
assert.equal(lookups,0);
const denied=await handleRadarRefresh(new Request('https://fixture',{method:'POST',headers:{authorization:'Bearer invalid'},body:'{}'}),{...deps,claim:async()=>{throw new Error('Forbidden');}});assert.equal(denied.status,403);assert.equal(lookups,0);
const response=await handleRadarRefresh(new Request('https://fixture',{method:'POST',headers:{'x-job-secret':'fixture'},body:'{}'}),deps);assert.deepEqual(await response.json(),{updated:1,failed:1,skipped:0,requested:2});assert.equal(published,1);
console.log('Fund radar: eligibility, percentile ties, missing data, validation, class identity, Finect parsing, fallback and authenticated refresh passed');
