import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildWorkbookHistory} from '../src/services/portfolioWorkbookHistory';
import {importHistoryArchive,migrateLegacyPortfolioHistory} from '../src/services/imports/portfolioHistoryImport';
import {HISTORY_ARCHIVE_KEY,historicalBundle,readPortfolioHistoryArchive,validateHistoryArchive,emptyHistoryArchive} from '../src/services/portfolioHistoryArchive';
import {performanceSeries,selectPortfolioPeriod} from '../src/services/portfolioPerformance';
import {continuePortfolioHistory} from '../src/services/dashboardHistory';

const now=Date.parse('2026-10-08T20:00:00Z');
const input={evolution:'Mes,Valor Total,Capital Inicial,Capital Aportado\n2025 Dic,1000,1000,0\n2026 Ene,1050,1000,0\n2026 Feb,1100,1000,0\n2026 Mar,1150,1000,0\n2026 Abr,1200,1000,0\n2026 May,1250,1000,0\n2026 Jun,1300,1000,0\n2026 Jul,1400,1000,0\n2026 Ago,1500,1000,0\n2026 Sept,1760,1000,200',daily:'Fecha,Valor portfolio,Flujo neto,Tipo de dato\n2026-10-07,1790,0,Diario',movements:'',comparison:'',advanced:'',label:'synthetic.xlsx'};
const legacy=buildWorkbookHistory(input.evolution,input.daily,input.movements,now);
const archive=importHistoryArchive(input,now);const canonical=historicalBundle(archive,now);
for(const period of ['1D','7D','1M','3M','YTD','ALL'] as const){
 const old=selectPortfolioPeriod(performanceSeries(legacy.points,legacy.flowTransactions,[],{maxGapDays:45}),period,now);
 const migrated=selectPortfolioPeriod(performanceSeries(canonical.points,canonical.flowTransactions,[],{maxGapDays:45}),period,now);
 assert.deepEqual(migrated.performance,old.performance,`${period}: import migration preserves values, dates and flows`);
}
assert.equal(archive.cashFlows[0].precision,'month');assert.equal(archive.cashFlows[0].date,'2026-09-30');
const store=new Map<string,string>();
Object.assign(globalThis,{window:{},localStorage:{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v),removeItem:(k:string)=>store.delete(k)}});
for(const field of ['evolution','daily','movements','comparison','advanced'] as const)store.set(`freewallet_portfolio_csv_${field}_raw`,input[field]);
store.set('freewallet_portfolio_csv_workbook_file',input.label);
assert.equal(migrateLegacyPortfolioHistory(),true);
assert.equal(migrateLegacyPortfolioHistory(),false,'Legacy text is migrated only once');
const correction=JSON.parse(store.get(HISTORY_ARCHIVE_KEY)!);
const originalLast=correction.valuations.at(-1);
originalLast.date=new Date(originalLast.date).toISOString().replace('Z','+00:00');originalLast.value+=1;originalLast.historyOrigin='agent';
store.set(HISTORY_ARCHIVE_KEY,JSON.stringify(correction));
migrateLegacyPortfolioHistory(true);
const reimported=readPortfolioHistoryArchive();
assert.equal(reimported.valuations.length,archive.valuations.length,'Reimporting preserves a corrected instant without ISO-format duplicates');
assert.equal(reimported.valuations.find(p=>p.historyOrigin==='agent')?.value,originalLast.value);
const saved=store.get(HISTORY_ARCHIVE_KEY)!;
for(const key of [...store.keys()].filter(k=>k.startsWith('freewallet_portfolio_csv_')))store.delete(key);
assert.equal(migrateLegacyPortfolioHistory(),false);
assert.equal(store.get(HISTORY_ARCHIVE_KEY),saved,'Removing legacy CSV leaves the independent archive intact');
assert.equal(readPortfolioHistoryArchive().valuations.length,archive.valuations.length);
const continued=continuePortfolioHistory(canonical,[{date:'2026-10-08T12:00:00Z',value:1800,invested:1000}],[],now,true);
assert.equal(continued.history.at(-1)?.value,1800);assert.equal(continued.history.at(-1)?.invested,1200);
// An authoritative new valuation must replace a stale verified endpoint even
// when the local day's ledger contains an unresolved deletion. No return is
// hardcoded, and the deleted record remains in the original ledger.
const deletion={id:'pending-delete',assetId:'removed',assetSymbol:'SYNTHETIC',assetName:'Synthetic',assetType:'stock' as const,type:'delete' as const,date:'2026-10-08',quantity:1,total:10,createdAt:'2026-10-08T10:00:00Z'};
const oldEndpoint=continuePortfolioHistory(canonical,[{date:'2026-10-08T12:00:00Z',value:1800,invested:1000}],[deletion],now,true);
const oldSelection=selectPortfolioPeriod(performanceSeries(oldEndpoint.history,oldEndpoint.transactions,[],{maxGapDays:45}),'YTD',now);
assert.equal(oldSelection.performance.endDate,'2026-10-07');
assert.equal(oldSelection.incompleteSince,'2026-10-08');
const reconciled={...archive,valuations:[...archive.valuations.map(p=>p.date.startsWith('2026-10-07')?{...p,value:1795,historyOrigin:'agent' as const}:p),{...archive.valuations.at(-1)!,date:'2026-10-08T18:00:00Z',value:1760,historyOrigin:'agent' as const}]};
validateHistoryArchive(reconciled);
const ledgerBefore=JSON.stringify([deletion]);
const latest=continuePortfolioHistory(historicalBundle(reconciled,now),[{date:'2026-10-08T19:00:00Z',value:1800,invested:1000}],[deletion],now,true);
const latestSelection=selectPortfolioPeriod(performanceSeries(latest.history,latest.transactions,[],{maxGapDays:45}),'YTD',now);
assert.equal(latestSelection.performance.endDate,'2026-10-08');
assert.equal(latestSelection.incompleteSince,null);
assert.equal(latest.history.at(-1)?.value,1760,'A stale local quote must not override the authoritative daily valuation');
assert.ok(Math.abs(latestSelection.performance.returnPercent!-56)<1e-8);
assert.equal(JSON.stringify([deletion]),ledgerBefore,'Reconciliation never erases a ledger operation');
const newPortfolio=continuePortfolioHistory(historicalBundle(emptyHistoryArchive(),now),[{date:'2026-10-07',value:1000,invested:1000},{date:'2026-10-08',value:1010,invested:1000}],[],now,true);
assert.ok(Math.abs(selectPortfolioPeriod(performanceSeries(newPortfolio.history,[]),'ALL',now).performance.returnPercent!-1)<1e-8,'A portfolio without an import uses the same performance engine');
assert.throws(()=>validateHistoryArchive({...archive,cashFlows:[...archive.cashFlows,...archive.cashFlows]}));
assert.throws(()=>validateHistoryArchive({...archive,valuations:[{date:'2026-10-01',value:Infinity,invested:1000,cadence:'daily'}]}));
assert.throws(()=>validateHistoryArchive({...archive,valuations:[...archive.valuations,{...archive.valuations[0],date:new Date(archive.valuations[0].date).toISOString()}]}),'Equivalent ISO representations identify a duplicate instant');
for(const file of ['src/components/dashboard/useDashboardAnalytics.ts','src/components/dashboard/PortfolioExcelInsights.tsx'])assert.doesNotMatch(readFileSync(file,'utf8'),/pages\/PortfolioCsv|readWorkbookHistory|readWorkbookBenchmarkHistory|csv_.*raw/,'Dashboard must not parse import files');
console.log('PASS: historical migration preserves all periods and precision, runs once, survives removal of every CSV key, continues live valuations, supports portfolios without imports and rejects invalid/duplicated observations.');
