import type { HistoricalDataPoint } from '../../types/types';
export type ScoringMethod = 'cash' | 'index' | 'active' | 'sortino';
export const methodLabels: Record<ScoringMethod,string> = {
    cash: 'Exceso anualizado frente a referencia', index: 'Error total de seguimiento',
    active: 'Ratio de información', sortino: 'Sortino',
};
export interface RadarEvidence { fund: HistoricalDataPoint[]; benchmark?: HistoricalDataPoint[] }
export interface MonthlySample { dates: string[]; fund: number[]; benchmark: number[] }
const dayMs=86400000;
/** 37 consecutive common month-end observations; no interpolation or forward fill.
 * Closed months only. Up to seven calendar days accommodates non-trading days. */
export function monthlySample(evidence: RadarEvidence, currency: string, now: Date, needsBenchmark: boolean): MonthlySample | null {
    const dates: string[]=[], fund: number[]=[], benchmark: number[]=[];
    const valid = (points: HistoricalDataPoint[]) => {
        const map=new Map<string,number>();
        for(const p of points){const date=p.date.slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||!Number.isFinite(p.close)||p.close<=0||(p.currency&&p.currency!==currency))continue;map.set(date,p.close);}
        return map;
    };
    const f=valid(evidence.fund), b=valid(evidence.benchmark??[]);
    const common=[...f.keys()].filter(d=>!needsBenchmark||b.has(d)).sort();
    for(let offset=37;offset>=1;offset--){
        const end=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-offset+1,0));
        const month=end.toISOString().slice(0,7);
        const date=common.filter(d=>d.slice(0,7)===month&&Date.parse(d)<=end.getTime()).at(-1);
        if(!date||end.getTime()-Date.parse(date)>7*dayMs)return null;
        dates.push(date);fund.push(f.get(date)!);benchmark.push(needsBenchmark?b.get(date)!:1);
    }
    return {dates,fund,benchmark};
}
const mean=(x:number[])=>x.reduce((s,v)=>s+v,0)/x.length;
const stdev=(x:number[])=>Math.sqrt(x.reduce((s,v)=>s+(v-mean(x))**2,0)/(x.length-1));
/** NAV histories must be accumulation/total-return series in the same currency.
 * Returns are decimal fractions; output excess/tracking are percentage points. */
export function evaluateMonthly(sample: MonthlySample, method: ScoringMethod, annualTargetPct?: number) {
    if(sample.fund.length<3||sample.benchmark.length!==sample.fund.length||[...sample.fund,...sample.benchmark].some(x=>!Number.isFinite(x)||x<=0))throw new Error('Serie mensual no válida');
    const returns=sample.fund.slice(1).map((p,i)=>p/sample.fund[i]-1);
    const reference=sample.benchmark.slice(1).map((p,i)=>p/sample.benchmark[i]-1);
    const active=returns.map((r,i)=>r-reference[i]);
    const excessCagr=(Math.pow(sample.fund.at(-1)!/sample.fund[0],12/returns.length)-Math.pow(sample.benchmark.at(-1)!/sample.benchmark[0],12/returns.length))*100;
    let peak=sample.fund[0], drawdown=0;
    for(const price of sample.fund){peak=Math.max(peak,price);drawdown=Math.min(drawdown,price/peak-1);}
    const trackingError=stdev(active)*Math.sqrt(12)*100;
    let value:number|null=null;
    if(method==='cash')value=excessCagr;
    if(method==='index')value=-Math.sqrt(mean(active.map(r=>r*r))*12)*100;
    if(method==='active'){const denominator=stdev(active);if(denominator>1e-10)value=mean(active)*Math.sqrt(12)/denominator;}
    if(method==='sortino'&&annualTargetPct!=null&&annualTargetPct>-100&&Number.isFinite(annualTargetPct)){
        const target=Math.pow(1+annualTargetPct/100,1/12)-1;
        const shortfall=returns.map(r=>r-target);
        const downside=Math.sqrt(mean(shortfall.map(r=>Math.min(0,r)**2)));
        if(downside>1e-10)value=mean(shortfall)*Math.sqrt(12)/downside;
    }
    return {value:value!=null&&Number.isFinite(value)?(value===0?0:value):null,excessCagr,trackingError,drawdown:drawdown*100,volatility:stdev(returns)*Math.sqrt(12)*100};
}
