import assert from 'node:assert/strict';
import {PortfolioCloudStorage,captureLocalPortfolio,canonicalPortfolio,portfolioStorage} from '../src/services/portfolioCloudStorage';
import type {CloudData,CloudRecord} from '../src/services/portfolioCloudStorage';

const local=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{value:{getItem:(key:string)=>local.get(key)??null,setItem:(key:string,value:string)=>local.set(key,value),removeItem:(key:string)=>local.delete(key)}});
const network={onLine:true};Object.defineProperty(globalThis,'navigator',{value:network,configurable:true});
const position={id:'test',symbol:'TEST',name:'Synthetic',type:'stock',quantity:1,purchasePrice:10,purchaseDate:'2026-01-01',currency:'EUR',currentPrice:12};
const portfolio=JSON.stringify({version:1,assets:[position],transactions:[]});
local.set('freewallet_portfolio_v1',portfolio);local.set('freewallet_finnhub_key','private-device-only');local.set('freewallet-news-auth','private-session');
const backup=captureLocalPortfolio();assert.equal('freewallet_finnhub_key' in backup,false);assert.equal('freewallet-news-auth' in backup,false);
assert.equal(JSON.parse(backup.freewallet_portfolio_v1).assets[0].currentPrice,undefined);
const storage=new PortfolioCloudStorage();
const annotations=new PortfolioCloudStorage();
annotations.select('A',async(revision,_id,data)=>({revision:revision+1,data}));
annotations.hydrate({revision:0,data:{freewallet_settings:'{"apiEnabled":false}'}});
annotations.setItem('freewallet_settings','{"apiEnabled":false,"discardedPositionRecords":[{"assetId":"bad","deletionId":"deleted","confirmedAt":"2026-10-08"}]}');
assert.equal(annotations.getConfirmedItem('freewallet_settings'),'{"apiEnabled":false}','Pending annotations must not alter displayed financial results');
await annotations.flush();
assert.match(annotations.getConfirmedItem('freewallet_settings')!,/discardedPositionRecords/);
annotations.select('B');assert.equal(annotations.getConfirmedItem('freewallet_settings'),null,'Another account never inherits a correction');
assert.equal(storage.getItem('freewallet_portfolio_v1'),portfolio);
const saved: {id:string;revision:number;data:CloudData}[]=[];
storage.select('A',async(revision,id,data)=>{saved.push({id,revision,data});return {revision:revision+1,data};});
assert.equal(storage.getItem('freewallet_portfolio_v1'),null,'Account never falls back to guest data');
assert.throws(()=>storage.setItem('freewallet_history','[]'));
storage.hydrate({revision:1,data:backup});
storage.setItem('freewallet_theme_mode','light');await storage.flush();
assert.equal(storage.getSnapshot().status,'synced');assert.equal(saved.length,1);
await storage.flush();assert.equal(saved.length,1,'No-op must not call the backend');
storage.setItem('freewallet_portfolio_v1',portfolio);await storage.flush();assert.equal(saved.length,1,'Quotes must not trigger a state write');
assert.equal(JSON.parse(storage.getItem('freewallet_portfolio_v1')!).assets[0].currentPrice,12);
storage.setItem('freewallet_theme_mode','dark');await storage.flush();
assert.equal(JSON.parse(storage.getItem('freewallet_portfolio_v1')!).assets[0].currentPrice,12,'Acknowledgement retains quote cache');
network.onLine=false;assert.throws(()=>storage.setItem('freewallet_theme_mode','system'));network.onLine=true;
let attempts=0;const ids:string[]=[];
storage.select('A',async(revision,id,data)=>{ids.push(id);if(attempts++===0)throw new Error('Network lost after sending');return {revision:revision+1,data};});
storage.hydrate({revision:2,data:backup});storage.setItem('freewallet_theme_mode','dark');
await assert.rejects(storage.flush());assert.equal(storage.getSnapshot().status,'error');
assert.equal(storage.exportData().freewallet_theme_mode,'dark','Pending edits remain exportable');
assert.throws(()=>storage.setItem('freewallet_theme_mode','system'));
await storage.flush();assert.equal(ids[0],ids[1],'Uncertain retry preserves request identifier');
assert.equal(storage.getSnapshot().status,'synced');
// A lost acknowledgement can be retried after another device has changed
// unrelated fields. Only edits queued after our original request may be sent.
const shared={...backup,freewallet_theme_mode:'light',freewallet_goals:'[{"targetAmount":1000}]',freewallet_watchlist:'[]',freewallet_history:'[]'};
const external={...shared,freewallet_theme_mode:'dark',freewallet_goals:'[{"targetAmount":9000}]',freewallet_history:'[{"date":"2026-10-01","value":25,"invested":20}]'};
delete (external as CloudData).freewallet_watchlist;
let loseReceipt:(error:Error)=>void=()=>{};
const retried:Array<{revision:number;id:string;data:CloudData;baseline:CloudData}>=[];
storage.select('A',async(revision,id,data,baseline)=>{
    retried.push({revision,id,data,baseline:baseline!});
    if(retried.length===1)return new Promise((_resolve,reject)=>{loseReceipt=reject;});
    if(retried.length===2)return {revision:4,data:external};
    assert.deepEqual(Object.fromEntries(Object.entries(data).filter(([key,value])=>baseline![key]!==value)),{freewallet_appearance_mode:'liquid-glass'});
    assert.equal('freewallet_watchlist' in data,false,'Remote deletion must not be resurrected');
    return {revision:5,data};
});
storage.hydrate({revision:2,data:shared});storage.setItem('freewallet_theme_mode','dark');
const lostReceipt=storage.flush();storage.setItem('freewallet_appearance_mode','liquid-glass');
loseReceipt(new Error('Receipt lost after commit'));await assert.rejects(lostReceipt);
await storage.flush();
assert.equal(retried.length,3);assert.equal(retried[0].id,retried[1].id);
assert.deepEqual(retried[0].baseline,retried[1].baseline,'The uncertain retry must keep its original baseline');
assert.equal(retried[2].revision,4);assert.equal(storage.exportData().freewallet_goals,external.freewallet_goals);
assert.equal(storage.exportData().freewallet_history,external.freewallet_history);
assert.equal(storage.getSnapshot().status,'synced');
// A queued deletion is still an intentional local edit after acknowledgement.
let acknowledgeRemoval:(record:CloudRecord)=>void=()=>{};let removalWrites=0;
storage.select('A',async(revision,_id,data)=>{
    if(++removalWrites===1)return new Promise(resolve=>{acknowledgeRemoval=resolve;});
    assert.equal('freewallet_history' in data,false);return {revision:revision+1,data};
});
storage.hydrate({revision:1,data:shared});storage.setItem('freewallet_theme_mode','dark');
const removalFlight=storage.flush();storage.removeItem('freewallet_history');
acknowledgeRemoval({revision:2,data:{...shared,freewallet_theme_mode:'dark'}});await removalFlight;
assert.equal(removalWrites,2);assert.equal(storage.getItem('freewallet_history'),null);
// Concurrent changes to the same field are never silently resolved by a retry.
for(const localGoal of ['[{"targetAmount":3000}]',null,external.freewallet_goals]) {
    let acknowledgeConflict:(record:CloudRecord)=>void=()=>{};let conflictWrites=0;
    storage.select('A',()=>{conflictWrites++;return new Promise(resolve=>{acknowledgeConflict=resolve;});});
    storage.hydrate({revision:1,data:shared});storage.setItem('freewallet_theme_mode','dark');
    const conflictFlight=storage.flush();
    if(localGoal===null)storage.removeItem('freewallet_goals');else storage.setItem('freewallet_goals',localGoal);
    acknowledgeConflict({revision:4,data:external});
    if(localGoal===external.freewallet_goals) {
        await conflictFlight;assert.equal(storage.getSnapshot().status,'synced','Identical concurrent edits need no conflict');
    } else {
        await assert.rejects(conflictFlight);assert.equal(storage.getSnapshot().status,'conflict');
        assert.equal(storage.getItem('freewallet_goals'),localGoal,'Conflicting local edit remains exportable');
        await assert.rejects(storage.flush());storage.discard();
        assert.equal(storage.getItem('freewallet_goals'),external.freewallet_goals,'Discard restores the acknowledged server version');
    }
    assert.equal(conflictWrites,1,'A conflict must not send a follow-up overwrite');
}
storage.select('A',async()=>{throw {code:'40001'};});storage.hydrate({revision:4,data:backup});
storage.setItem('freewallet_theme_mode','dark');await assert.rejects(storage.flush());
assert.equal(storage.getSnapshot().status,'conflict');await assert.rejects(storage.flush());
assert.equal(storage.exportData().freewallet_theme_mode,'dark');storage.discard();
assert.equal(storage.exportData().freewallet_theme_mode,undefined,'Discard is explicit');
let finish:(record:CloudRecord)=>void=()=>{};
storage.select('A',()=>new Promise(resolve=>{finish=resolve;}));storage.hydrate({revision:1,data:backup});storage.setItem('freewallet_theme_mode','dark');
const inFlight=storage.flush();storage.select('B');storage.hydrate({revision:8,data:{freewallet_portfolio_v1:canonicalPortfolio(JSON.stringify({version:1,assets:[],transactions:[]}))}});
finish({revision:2,data:{...backup,freewallet_theme_mode:'dark'}});await assert.rejects(inFlight);
assert.equal(storage.getSnapshot().userId,'B');assert.equal(storage.currentRevision,8);
assert.equal(JSON.parse(storage.getItem('freewallet_portfolio_v1')!).assets.length,0,'Late A response cannot contaminate B');
assert.equal(storage.recoveredData(),null,'B cannot export A pending edits');
storage.select('A');assert.equal(storage.recoveredData()?.freewallet_theme_mode,'dark','Reauthenticated account can recover an interrupted draft');
storage.select(null);assert.equal(local.get('freewallet_portfolio_v1'),portfolio,'Migration/logout never mutate the local backup');
const {commitPortfolioState}=await import('../src/services/storageService');
let bWrites=0;
portfolioStorage.select('A',async(revision,_id,data)=>({revision:revision+1,data}));
portfolioStorage.hydrate({revision:1,data:backup});
const operation=commitPortfolioState([position],[]);
portfolioStorage.select('B',async(revision,_id,data)=>{bWrites++;return {revision:revision+1,data};});
portfolioStorage.hydrate({revision:1,data:{freewallet_portfolio_v1:JSON.stringify({version:1,assets:[],transactions:[]})}});
await assert.rejects(operation,/sesión ha cambiado/);
assert.equal(bWrites,0,'Account switch during pre-operation flush must not send A positions as B');
assert.equal(JSON.parse(portfolioStorage.getItem('freewallet_portfolio_v1')!).assets.length,0);
portfolioStorage.select(null);
console.log('Sync passed: whitelist, guest isolation, quotes, queued edits/deletions, unrelated remote updates, exact retry, concurrent-field conflicts, export/discard, offline mode and late-session responses.');

const cashRecord = (rate: number | undefined) => JSON.stringify({version:1,assets:[{...position,type:'cash',cashTae:rate}],transactions:[]});
assert.equal(JSON.parse(canonicalPortfolio(cashRecord(2.5))).assets[0].cashTae,2.5);
assert.equal(JSON.parse(canonicalPortfolio(cashRecord(0))).assets[0].cashTae,0);
assert.notEqual(canonicalPortfolio(cashRecord(2.5)),canonicalPortfolio(cashRecord(3)), 'A TAE change must be a persisted portfolio mutation');
assert.equal(JSON.parse(canonicalPortfolio(cashRecord(undefined))).assets[0].cashTae,undefined);
