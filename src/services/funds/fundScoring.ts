import { categoryScores } from './categoryScore';
import { effectiveMetrics, type RadarFund } from '../fundRadar/types';
import { evaluateMonthly, monthlySample, methodLabels, type RadarEvidence, type ScoringMethod } from './radarPerformance';
export interface RadarScore {
    value: number|null; grade:number|null; provisional:boolean; rank:number|null; peers:number;
    reason:string; comparisonReason:string; category:string|null; label:string;
    groupId?: string; method?: ScoringMethod | 'published-sharpe'; startDate?:string; endDate?:string;
    statistics?: ReturnType<typeof evaluateMonthly>;
}
/** Never infer downside risk, benchmark excess or beta from aggregated volatility. */
export function scoreRadarFunds(funds:RadarFund[],now=new Date(),evidence:Record<string,RadarEvidence|undefined>={}):Map<string,RadarScore>{
    const result=new Map<string,RadarScore>(), groups=new Map<string,{id:string;value:number}[]>();
    for(const fund of funds){
        const config=fund.extra.comparison, metrics=effectiveMetrics(fund);
        const subcategory=fund.fund_radar_data?.provider_category?.trim();
        const score:RadarScore={value:null,grade:null,provisional:false,rank:null,peers:0,reason:'',comparisonReason:'Sin nota: se necesitan al menos dos fondos comparables.',category:subcategory??null,label:config?methodLabels[config.method]:'Método pendiente',method:config?.method};
        result.set(fund.id,score);
        if(!fund.is_active){score.reason='Fondo retirado';continue;}
        if(!config){
            const published=fund.auto_refresh?fund.fund_radar_data?.metrics:undefined;
            const date=published?.dates?.sharpe;
            const validDate=typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date&&Date.parse(date)<=now.getTime()&&now.getTime()-Date.parse(date)<=90*86400000;
            if(!published||published.window!=='3y'||!published.currency||!/^[A-Z]{3}$/.test(published.currency)||published.sharpe==null||!Number.isFinite(published.sharpe)||!validDate){score.reason='Sin datos recientes y verificados para una nota provisional.';continue;}
            score.method='published-sharpe';score.label='Sharpe publicado · provisional';score.value=published.sharpe;
            score.category=fund.category;score.provisional=true;score.startDate=undefined;score.endDate=date;
            const key=JSON.stringify(['published-sharpe',fund.category.trim().toLowerCase(),published.currency,date.slice(0,7)]);
            score.groupId=key;
            const group=groups.get(key)??[];group.push({id:fund.id,value:score.value});groups.set(key,group);
            score.comparisonReason='Sin nota: falta otro fondo con Sharpe verificable en esta categoría, divisa y mes.';
            continue;
        }
        if(!config.accumulation){score.reason='Se necesita un histórico de rentabilidad total; los precios sin dividendos no bastan.';continue;}
        if(!metrics.currency||metrics.currency!==config.currency){score.reason='Divisa de comparación sin verificar.';continue;}
        if(config.method!=='sortino'&&!config.benchmarkIsin){score.reason='Falta una referencia verificada.';continue;}
        if(config.method!=='sortino'&&config.benchmarkIsin===fund.isin){score.reason='El fondo no puede ser su propia referencia.';continue;}
        if(config.method==='sortino'&&(config.targetAnnualPct==null||!Number.isFinite(config.targetAnnualPct)||config.targetAnnualPct<=-100)){score.reason='Falta un objetivo anual explícito para Sortino.';continue;}
        const history=evidence[fund.id];
        if(!history){score.reason='Histórico de comparación pendiente o no disponible.';continue;}
        const sample=monthlySample(history,config.currency,now,config.method!=='sortino');
        if(!sample){score.reason='Se necesitan 37 cierres mensuales consecutivos y recientes, en la misma divisa.';continue;}
        score.startDate=sample.dates[0];score.endDate=sample.dates.at(-1);
        score.statistics=evaluateMonthly(sample,config.method,config.targetAnnualPct);score.value=score.statistics.value;
        if(score.value===null){score.reason='Riesgo de desviación nulo o insuficiente: no se asigna un ratio infinito.';continue;}
        if(!subcategory){score.comparisonReason='Sin nota: subcategoría del proveedor sin verificar.';continue;}
        const key=JSON.stringify([fund.category.toLowerCase().trim(),subcategory.toLowerCase(),config.method,config.currency,config.method==='sortino'?config.targetAnnualPct:config.benchmarkIsin,score.startDate,score.endDate]);
        score.groupId=key;
        const group=groups.get(key)??[];group.push({id:fund.id,value:score.value});groups.set(key,group);
    }
    for(const group of groups.values()){
        const grades=categoryScores(group.map(item=>item.value));
        group.forEach((item,i)=>{const score=result.get(item.id)!;score.peers=group.length;if(grades){score.grade=grades[i];score.provisional=score.method==='published-sharpe'||group.length<5;score.rank=group.filter(x=>x.value>item.value).length+1;score.comparisonReason='';}});
    }
    return result;
}
