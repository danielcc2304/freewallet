export const RADAR_METRIC_LABELS={ytd:'Rentabilidad YTD',y1:'Rentabilidad 1 año',y3:'Rentabilidad 3 años anualizada',y5:'Rentabilidad 5 años anualizada',volatility:'Volatilidad 3 años',maxDrawdown:'Caída máxima 3 años',sharpe:'Sharpe 3 años',ter:'TER anual',risk:'Riesgo (1–7)',nav:'Valor liquidativo'};
export const METRIC_KEYS = ['ytd','y1','y3','y5','volatility','maxDrawdown','sharpe','ter','risk','nav'] as const;
export type MetricKey = typeof METRIC_KEYS[number];
export type RadarMetrics = Partial<Record<MetricKey, number | null>> & {
    dates?: Partial<Record<MetricKey,string|null>>;
    currency?: string | null;
    window?: '3y' | null;
};
export interface RadarExtra {
    aum?: string; duration?: number; rating?: string; yieldToMaturity?: number; minInvestment?: string;
    allocation?: {label:string;value:number}[];
}
export interface RadarFund {
    id:string;isin:string;name:string;category:string;manager:string;description:string;
    source_url:string|null;manual_metrics:RadarMetrics;extra:RadarExtra;auto_refresh:boolean;is_active:boolean;
    version:number;created_at:string;updated_at:string;updated_by:string|null;
    fund_radar_data?: {metrics:RadarMetrics;profile?:{name?:string;manager?:string;description?:string;aum?:number;minimumInvestment?:number};provider_category:string|null;source_url:string|null;checked_at:string|null;last_success_at:string|null} | null;
}
export type RadarDraft = Pick<RadarFund,'isin'|'name'|'category'|'manager'|'description'|'source_url'|'manual_metrics'|'extra'|'auto_refresh'|'is_active'>;
export function effectiveMetrics(fund: RadarFund): RadarMetrics {
    if (!fund.auto_refresh || !fund.fund_radar_data) return fund.manual_metrics;
    const auto=fund.fund_radar_data.metrics;
    return {...fund.manual_metrics,...auto,dates:{...fund.manual_metrics.dates,...auto.dates}};
}
export function validIsin(value:string):boolean {
    if(!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(value))return false;
    const digits=[...value].map(c=>/[A-Z]/.test(c)?String(c.charCodeAt(0)-55):c).join('');
    let sum=0;
    for(let i=digits.length-1,double=false;i>=0;i--,double=!double){let n=Number(digits[i]);if(double)n*=2;sum+=n>9?n-9:n;}
    return sum%10===0;
}
export function validateDraft(draft:RadarDraft, now=new Date()):void {
    if(!validIsin(draft.isin))throw new Error('Comprueba el ISIN y su dígito de control.');
    for(const [key,max] of [['name',200],['category',100]] as const)if(draft[key].trim().length<2||draft[key].length>max)throw new Error('Indica nombre y categoría válidos.');
    if(draft.manager.length>200||draft.description.length>4000)throw new Error('La gestora o la descripción supera el límite.');
    if(draft.source_url){let url:URL;try{url=new URL(draft.source_url);}catch{throw new Error('Indica un enlace HTTPS válido.');}if(url.protocol!=='https:'||url.username||url.password||url.href.length>2000)throw new Error('Indica un enlace HTTPS público sin credenciales.');}
    const m=draft.manual_metrics;
    for(const key of METRIC_KEYS){const n=m[key];if(n==null)continue;
        const [min,max]=key==='nav'?[Number.MIN_VALUE,1e15]:key==='risk'?[1,7]:key==='ter'?[0,100]:key==='volatility'?[0,1000]:key==='maxDrawdown'?[-100,0]:key==='sharpe'?[-100,100]:[-100,10000];
        if(!Number.isFinite(n)||n<min||n>max||key==='risk'&&!Number.isInteger(n))throw new Error(`Valor no válido en ${key}. Usa porcentajes, no fracciones.`);
    }
    if(m.currency&&!/^[A-Z]{3}$/.test(m.currency))throw new Error('La divisa debe tener tres letras (EUR, USD…).');
    for(const d of Object.values(m.dates??{}))if(d&&(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d||d>now.toISOString().slice(0,10)))throw new Error('La fecha de los datos no puede ser inválida o futura.');
    for(const key of ['aum','minInvestment','rating'] as const)if(draft.extra[key]&&draft.extra[key]!.length>(key==='rating'?40:200))throw new Error('Un dato de referencia supera el límite.');
    for(const [key,min,max] of [['duration',0,100],['yieldToMaturity',-100,1000]] as const){const n=draft.extra[key];if(n!=null&&(!Number.isFinite(n)||n<min||n>max))throw new Error('Comprueba la duración o la TIR de referencia.');}
    const allocations=draft.extra.allocation??[];
    if(allocations.length>30||allocations.some(a=>!a.label.trim()||a.label.length>80||!Number.isFinite(a.value)||a.value<0||a.value>100)||allocations.reduce((s,a)=>s+a.value,0)>100.01)throw new Error('Comprueba el desglose: nombres, porcentajes y suma máxima del 100 %.');
}
