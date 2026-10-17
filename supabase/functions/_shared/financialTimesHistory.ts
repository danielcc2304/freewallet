import {load} from 'cheerio/slim';
import {fundClassIdentity} from './fundQuotePolicy.ts';

export interface FinancialTimesFundIdentity {symbol:string;className:string;currency:string}
const record=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'?v as Record<string,unknown>:{};
/** Bind the numeric series id to the requested ISIN and its actual class currency. */
export function readFinancialTimesIdentity(html:string,isin:string,expectedCurrency?:string):FinancialTimesFundIdentity {
    if(!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(isin))throw Error('ISIN de FT inválido');
    const $=load(html),matches=new Map<string,FinancialTimesFundIdentity>();
    const className=$('h1').first().text().trim();
    for(const node of $('[data-mod-config]').toArray()){
        try{
            const config=JSON.parse($(node).attr('data-mod-config')!);
            const [requested,currency,...extra]=String(config.symbol??'').split(':');
            if(requested===isin&&!extra.length&&/^[A-Z]{3}$/.test(currency)&&(!expectedCurrency||currency===expectedCurrency)
                &&config.assetClass==='Fund'&&/^\d+$/.test(config.xid)&&className){
                matches.set(`${config.xid}:${currency}`,{symbol:String(config.xid),className,currency});
            }
        }catch{/* Ignore unrelated page modules, never infer an identifier from a title. */}
    }
    if(matches.size!==1)throw Error('FT no confirma de forma inequívoca el ISIN y la divisa');
    return [...matches.values()][0];
}
export function readFinancialTimesHistory(payload:unknown,identity:FinancialTimesFundIdentity):Array<{at:string;price:number}> {
    const root=record(payload),elements=Array.isArray(root.Elements)?root.Elements.map(record):[];
    const element=elements.find(e=>e.Symbol===identity.symbol&&e.Type==='price');
    if(root.Status!==1||!element||element.Status!==1||element.IssueType!=='OF'||element.Currency!==identity.currency
        ||typeof element.CompanyName!=='string'||fundClassIdentity(element.CompanyName)!==fundClassIdentity(identity.className))throw Error('FT devuelve otro instrumento, clase o divisa');
    const closes=(Array.isArray(element.ComponentSeries)?element.ComponentSeries.map(record):[]).find(s=>s.Type==='Close')?.Values;
    if(!Array.isArray(root.Dates)||!Array.isArray(closes)||root.Dates.length!==closes.length)throw Error('Serie de FT incompleta');
    const rows=root.Dates.flatMap((date,i)=>{
        if(closes[i]===null)return [];
        if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}T00:00:00$/.test(date)
            ||typeof closes[i]!=='number'||!Number.isFinite(closes[i])||closes[i]<=0)throw Error('NAV de FT inválido');
        const at=date+'.000Z',time=Date.parse(at);
        if(!Number.isFinite(time)||new Date(time).toISOString()!==at||time>Date.now()+300000)throw Error('Fecha de FT inválida');
        return [{at,price:closes[i] as number}];
    }).sort((a,b)=>a.at.localeCompare(b.at));
    if(rows.length<2||new Set(rows.map(p=>p.at)).size!==rows.length)throw Error('FT no devuelve dos cierres distintos');
    return rows;
}
