import { categoryScores } from './categoryScore';
import { effectiveMetrics, type RadarFund } from '../fundRadar/types';
import { evaluateMonthly, monthlySample, methodLabels, type RadarEvidence, type ScoringMethod } from './radarPerformance';
export interface RadarScore {
    value: number|null; grade:number|null; provisional:boolean; rank:number|null; peers:number;
    reason:string; comparisonReason:string; category:string|null; label:string;
    method?: ScoringMethod; startDate?:string; endDate?:string;
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
        if(!config){score.reason='Pendiente de configurar método y referencia de comparación.';continue;}
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
        const group=groups.get(key)??[];group.push({id:fund.id,value:score.value});groups.set(key,group);
    }
    for(const group of groups.values()){
        const grades=categoryScores(group.map(item=>item.value));
        group.forEach((item,i)=>{const score=result.get(item.id)!;score.peers=group.length;if(grades){score.grade=grades[i];score.provisional=group.length<5;score.rank=group.filter(x=>x.value>item.value).length+1;score.comparisonReason='';}});
    }
    return result;
}
