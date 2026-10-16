import { effectiveMetrics, type RadarFund } from '../fundRadar/types';
export interface RadarScore {value:number|null;rank:number|null;peers:number;reason:string;raw:number|null}
/** Relative heuristic, not a forecast. Returns already include fund expenses:
 * TER is displayed/filterable but is not subtracted for a second time.
 * Compare only matching category, currency, 3Y window and observation month.
 */
export function scoreRadarFunds(funds:RadarFund[],now=new Date()):Map<string,RadarScore> {
    const result=new Map<string,RadarScore>();
    const groups=new Map<string,{id:string;raw:number}[]>();
    for(const fund of funds){
        const m=effectiveMetrics(fund);
        let reason='';
        if(!fund.is_active)reason='Fondo retirado';
        else if([m.y3,m.volatility,m.maxDrawdown].some(n=>n==null||!Number.isFinite(n)))reason='Faltan rentabilidad, volatilidad o caída a 3 años';
        else if(m.window!=='3y'||!m.currency)reason='Divisa o período de riesgo sin verificar';
        const dates=[m.dates?.y3,m.dates?.volatility,m.dates?.maxDrawdown];
        if(!reason&&dates.some(d=>!d||!Number.isFinite(Date.parse(d))||d>now.toISOString().slice(0,10)))reason='Fecha de las métricas sin verificar';
        if(!reason&&dates.some(d=>now.getTime()-Date.parse(d!)>90*86400000))reason='Métricas con más de 90 días';
        if(!reason&&Math.max(...dates.map(d=>Date.parse(d!)))-Math.min(...dates.map(d=>Date.parse(d!)))>45*86400000)reason='Las fechas de riesgo y rentabilidad difieren más de 45 días';
        result.set(fund.id,{value:null,rank:null,peers:0,reason,raw:null});
        if(reason)continue;
        const raw=m.y3!-0.5*m.volatility!-0.25*Math.abs(m.maxDrawdown!);
        const groupKey=[fund.category.trim().toLocaleLowerCase('es'),m.currency,dates[0]!.slice(0,7)].join('|');
        const group=groups.get(groupKey)??[];group.push({id:fund.id,raw});groups.set(groupKey,group);
    }
    for(const group of groups.values()){
        group.sort((a,b)=>b.raw-a.raw||a.id.localeCompare(b.id));
        for(const item of group){
            if(group.length<5){result.set(item.id,{value:null,rank:null,peers:group.length,raw:item.raw,reason:'Muestra insuficiente: se necesitan al menos 5 fondos comparables'});continue;}
            const better=group.filter(g=>g.raw>item.raw).length;
            const equal=group.filter(g=>g.raw===item.raw).length;
            const score=100*(group.length-1-better-(equal-1)/2)/(group.length-1);
            result.set(item.id,{value:score,rank:better+1,peers:group.length,raw:item.raw,reason:''});
        }
    }
    return result;
}
