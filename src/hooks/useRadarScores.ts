import { useEffect, useMemo, useState } from 'react';
import type { RadarFund } from '../services/fundRadar/types';
import { scoreRadarFunds } from '../services/funds/fundScoring';
import type { RadarEvidence } from '../services/funds/radarPerformance';
import { isApiEnabled } from '../services/storageService';
/** Two workers bound provider load; the quote service shares its history cache.
 * Requests stop when leaving the radar or changing the catalogue. */
export function useRadarScores(funds: RadarFund[]) {
    const [evidence,setEvidence]=useState<Record<string,RadarEvidence>>({});
    const [loading,setLoading]=useState(false);
    useEffect(()=>{
        const controller=new AbortController();let disposed=false;
        setEvidence({});
        const configured=funds.filter(f=>f.extra.comparison?.accumulation);
        if(!configured.length||!isApiEnabled()){setLoading(false);return;}
        setLoading(true);
        const now=new Date();
        const startDate=Date.UTC(now.getUTCFullYear()-3,now.getUTCMonth()-2,1);
        const endDate=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1)-1;
        const requests=new Map<string,Promise<RadarEvidence['fund']>>();
        const history=(isin:string)=>{
            if(!requests.has(isin))requests.set(isin,import('../services/apiService').then(api=>api.getAssetChartData(isin,'ALL',controller.signal,{startDate,endDate})));
            return requests.get(isin)!;
        };
        let next=0;
        const worker=async()=>{
            while(next<configured.length&&!disposed){
                const f=configured[next++], config=f.extra.comparison!;
                try{
                    const [fund,benchmark]=await Promise.all([history(f.isin),config.method!=='sortino'&&config.benchmarkIsin?history(config.benchmarkIsin):Promise.resolve([])]);
                    if(!disposed)setEvidence(previous=>({...previous,[f.id]:{fund,benchmark}}));
                }catch{/* Scoring explicitly reports unavailable history; no fabricated fallback. */}
            }
        };
        void Promise.all(Array.from({length:Math.min(2,configured.length)},worker)).finally(()=>{if(!disposed)setLoading(false);});
        return()=>{disposed=true;controller.abort();};
    },[funds]);
    const scores=useMemo(()=>scoreRadarFunds(funds,new Date(),evidence),[funds,evidence]);
    return {scores,loading};
}
