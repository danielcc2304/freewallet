import axios from 'axios';
import type {HistoricalDataPoint,TimePeriod} from '../../types/types';
import {readFinancialTimesHistory,readFinancialTimesIdentity,type FinancialTimesFundIdentity} from '../../../supabase/functions/_shared/financialTimesHistory';

const identities=new Map<string,{at:number;identity:FinancialTimesFundIdentity}>();
export function fundHistoryWindow(period:TimePeriod,options:{startDate?:number;endDate?:number},now=Date.now()) {
    const end=options.endDate??now,start=new Date(end);
    if(Number.isFinite(options.startDate))start.setTime(options.startDate!);
    else if(period==='ALL')start.setTime(Date.UTC(1900,0,1));
    else if(period==='YTD')start.setUTCMonth(0,1);
    else if(period==='3M'||period==='1M'){
        const day=start.getUTCDate();start.setUTCDate(1);
        start.setUTCMonth(start.getUTCMonth()-(period==='3M'?3:1));
        start.setUTCDate(Math.min(day,new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,0)).getUTCDate()));
    }
    else start.setUTCDate(start.getUTCDate()-(period==='1D'?5:7));
    start.setUTCHours(0,0,0,0);
    if(!Number.isFinite(end)||!Number.isFinite(start.getTime())||start.getTime()>end)throw Error('Período de histórico inválido');
    return {start:start.getTime(),end,days:Math.min(50000,Math.max(7,Math.ceil((now-start.getTime())/86400000)+7))};
}
export async function getFinancialTimesFundHistory(isin:string,period:TimePeriod,signal:AbortSignal,options:{startDate?:number;endDate?:number;forceRefresh?:boolean}={}):Promise<HistoricalDataPoint[]> {
    const window=fundHistoryWindow(period,options);
    const key=isin.trim().toUpperCase(),cached=identities.get(key);
    let identity=cached&&!options.forceRefresh&&Date.now()-cached.at<6*3600000?cached.identity:undefined;
    if(!identity){
        const response=await axios.get('/__market/ft/funds/tearsheet/summary',{params:{s:key},responseType:'text',signal,timeout:8000});
        identity=readFinancialTimesIdentity(response.data,key);
        if(identities.size>=128)identities.delete(identities.keys().next().value!);
        identities.set(key,{identity,at:Date.now()});
    }
    const response=await axios.post('/__market/ft/chartapi/series',{
        days:window.days,dataNormalized:false,dataPeriod:'Day',dataInterval:1,realtime:false,yFormat:'0.0000',timeServiceFormat:'JSON',returnDateType:'ISO8601',
        elements:[{Label:'fund',Type:'price',Symbol:identity.symbol,OverlayIndicators:[],Params:{}}],
    },{signal,timeout:10000});
    const rows=readFinancialTimesHistory(response.data,identity).filter(p=>Date.parse(p.at)<=window.end);
    let baseline=-1;
    for(let i=0;i<rows.length;i++)if(Date.parse(rows[i].at)<=window.start)baseline=i;
    const selected=rows.slice(baseline>=0?baseline:0).filter(p=>baseline>=0||Date.parse(p.at)>=window.start);
    const points=(period==='1D'?selected.slice(-2):selected).map(p=>({date:p.at.slice(0,10),timestamp:Date.parse(p.at),currency:identity.currency,
        source:'Financial Times' as const,sourceSymbol:key,open:p.price,high:p.price,low:p.price,close:p.price,volume:0}));
    return points;
}

/** Independent providers: use the first usable series and cancel the remainder.
 * An empty response, error or single quote never blocks another provider.
 */
export async function firstUsableFundHistory(loaders:Array<(signal:AbortSignal)=>Promise<HistoricalDataPoint[]>>,signal?:AbortSignal):Promise<HistoricalDataPoint[]> {
    if(signal?.aborted)throw new DOMException('Aborted','AbortError');
    const controllers=loaders.map(()=>new AbortController());
    let abort:()=>void=()=>{};
    let timeout:ReturnType<typeof setTimeout>|undefined;
    const cancelled=new Promise<never>((_resolve,reject)=>{abort=()=>reject(new DOMException('Aborted','AbortError'));signal?.addEventListener('abort',abort,{once:true});});
    const deadline=new Promise<never>((_resolve,reject)=>{timeout=setTimeout(()=>reject(Error('Fund history timed out')),15000);});
    try{
        return await Promise.race([Promise.any(loaders.map(async(loader,i)=>{
            const rows=await loader(controllers[i].signal);
            if(rows.length<2)throw Error('No usable fund history');
            return rows;
        })),cancelled,deadline]);
    }catch(error){if(signal?.aborted)throw error;return [];}
    finally{clearTimeout(timeout);signal?.removeEventListener('abort',abort);controllers.forEach(c=>c.abort());}
}
