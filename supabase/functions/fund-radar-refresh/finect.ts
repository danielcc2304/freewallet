type Obj=Record<string,unknown>;
const obj=(v:unknown):Obj=>v&&typeof v==='object'&&!Array.isArray(v)?v as Obj:{};
const arr=(v:unknown):unknown[]=>Array.isArray(v)?v:[];
const num=(v:unknown):number|null=>typeof v==='number'&&Number.isFinite(v)?v:null;
const text=(v:unknown):string|undefined=>typeof v==='string'&&v.trim()?v:undefined;
const date=(v:unknown):string|null=>{
    if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}/.test(v))return null;
    const day=v.slice(0,10);const ms=Date.parse(day);
    return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===day&&ms<=Date.now()+300000?day:null;
};
export interface ProviderMetrics { [key:string]:unknown;dates:Record<string,string|null> }
export interface FinectRadarResult {metrics:ProviderMetrics;category:string|null;sourceUrl:string;profile:Obj}
export function extractRadarModel(html:string):unknown {
    const match=html.match(/window\.INITIAL_STATE\s*=\s*(?:"((?:\\[\s\S]|[^"\\])*)"|'((?:\\[\s\S]|[^'\\])*)')/);
    if(!match)throw new Error('Finect no devolvió su ficha estructurada');
    const raw=match[1]!==undefined?JSON.parse(`"${match[1]}"`):match[2].replace(/\\(['"\\/bfnrt]|u[\da-fA-F]{4}|x[\da-fA-F]{2})/g,(_,e:string)=>e.startsWith('u')||e.startsWith('x')?String.fromCharCode(parseInt(e.slice(1),16)):({b:'\b',f:'\f',n:'\n',r:'\r',t:'\t'} as Record<string,string>)[e]??e);
    let state:Obj;try{state=obj(JSON.parse(raw));}catch{state=obj(JSON.parse(decodeURIComponent(raw)));}
    return obj(obj(state.fund).fund).model??obj(obj(state.products).product).model;
}
export function parseFinectRadar(model:unknown,isin:string,sourceUrl:string):FinectRadarResult {
    const m=obj(model);
    // A match in a list of other share classes is insufficient: the statistics
    // must belong to the requested page/class itself, not a sibling class.
    if(m.isin!==isin)throw new Error('La clase de Finect no coincide con el ISIN');
    const selected=obj(arr(m.classes).find(c=>obj(c).isin===isin)??m.class);
    const currency=text(obj(selected.currency).code)??text(obj(m.currency).code);
    const stats=obj(m.stats),metrics:ProviderMetrics={dates:{}};
    if(currency&&/^[A-Z]{3}$/.test(currency))metrics.currency=currency;
    const put=(key:string,value:unknown,asOf:unknown,min:number,max:number)=>{
        const n=num(value);if(n===null||n<min||n>max||asOf!=null&&!date(asOf))return;
        metrics[key]=n;metrics.dates[key]=date(asOf);
    };
    const performance=arr(obj(stats.performance).periods).map(obj);
    for(const [key,period,type] of [['ytd','M0','accumulated'],['y1','M12','accumulated'],['y3','M36','annualized'],['y5','M60','annualized']]){
        const point=performance.filter(p=>p.period===period&&p.type===type).sort((a,b)=>String(b.date??'').localeCompare(String(a.date??'')))[0];
        if(point)put(key,point.value,point.date,-100,10000);
    }
    for(const [key,source,min,max] of [['volatility','standardDeviation',0,1000],['maxDrawdown','maxDrawdown',-100,0],['sharpe','sharpeRatio',-100,100]] as const){
        const point=arr(stats[source]).map(obj).filter(p=>p.period==='M36').sort((a,b)=>String(b.date??'').localeCompare(String(a.date??'')))[0];
        if(point)put(key,point.value,point.date,min,max);
    }
    if(metrics.volatility!==undefined&&metrics.maxDrawdown!==undefined)metrics.window='3y';
    const quote=obj(selected.lastQuote??m.lastQuote);put('nav',quote.price,quote.datetime,Number.MIN_VALUE,1e15);
    put('risk',m.srri,null,1,7);
    if(typeof metrics.risk==='number'&&!Number.isInteger(metrics.risk)){delete metrics.risk;delete metrics.dates.risk;}
    const fees=obj(selected.fees);put('ter',obj(fees.ter).value??obj(fees.ogc).value,null,0,100);
    if(Object.keys(metrics).filter(k=>!['dates','window','currency'].includes(k)).length===0)throw new Error('Finect no devolvió métricas utilizables');
    const category=obj(arr(m.category)[0]??arr(m.categories)[0]);
    const manager=obj(m.managementCompany);
    return {metrics,category:text(category.name)??null,sourceUrl,profile:{name:text(selected.name)??text(m.name),manager:text(manager.name)??text(obj(manager.organization).displayName),description:text(m.description)?.slice(0,4000),aum:num(selected.classTotalNetAsset)??num(m.totalNetAsset),minimumInvestment:num(obj(selected.minimalInvestment).amount)}};
}
export async function fetchFinectRadar(isin:string,key:string,signal:AbortSignal,fetcher:typeof fetch=fetch):Promise<FinectRadarResult> {
    if(!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin))throw new Error('ISIN no válido');
    const get=async(url:string,kind:'json'|'text')=>{
        const response=await fetcher(url,{signal:AbortSignal.any([signal,AbortSignal.timeout(12000)]),redirect:'error',headers:{'User-Agent':'Mozilla/5.0',Accept:kind==='json'?'application/json':'text/html'}});
        if(!response.ok)throw new Error(`Finect respondió ${response.status}`);
        const body=await response.text();if(body.length>4_000_000)throw new Error('Ficha demasiado grande');
        return kind==='json'?JSON.parse(body):body;
    };
    const search=obj(await get(`https://api.finect.com/v4/search?${new URLSearchParams({key,limit:'50',q:isin,type:'product'})}`,'json'));
    const match=arr(search.data).map(obj).find(item=>item.type==='fund'&&obj(item.entity).isin===isin);
    const alias=text(obj(match?.entity).alias);if(!alias)throw new Error('ISIN no encontrado en Finect');
    const sourceUrl=`https://www.finect.com/fondos-inversion/${isin}-${encodeURIComponent(alias)}`;
    try{return parseFinectRadar(extractRadarModel(await get(sourceUrl,'text') as string),isin,sourceUrl);}
    catch(error){
        if(signal.aborted)throw error;
        const payload=obj(await get(`https://api.finect.com/v4/products/${encodeURIComponent(alias)}?${new URLSearchParams({key})}`,'json'));
        return parseFinectRadar(obj(payload.data).entity,isin,sourceUrl);
    }
}
