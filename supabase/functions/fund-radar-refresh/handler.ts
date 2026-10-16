import type {FinectRadarResult} from './finect.ts';
interface Claim {lease:string;funds:{id:string;isin:string}[]}
export interface RadarRefreshDependencies {
    claim:(request:Request,fundId:string|null)=>Promise<Claim>;
    fetchFund:(isin:string,signal:AbortSignal)=>Promise<FinectRadarResult>;
    finish:(lease:string,items:Record<string,unknown>[])=>Promise<{updated:number;failed:number;skipped:number}>;
}
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type,x-job-secret','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
export async function handleRadarRefresh(request:Request,deps:RadarRefreshDependencies):Promise<Response> {
    if(request.method==='OPTIONS')return new Response('ok',{headers});
    if(request.method!=='POST')return json({error:'Método no permitido'},405);
    if(!request.headers.has('x-job-secret')&&!request.headers.get('authorization')?.startsWith('Bearer '))return json({error:'Necesitas acceso editorial'},401);
    let fundId:string|null=null;
    try{const raw=await request.text();if(raw.length>2048)return json({error:'Petición demasiado grande'},413);const body=raw?JSON.parse(raw):{};if(body.fundId!==undefined){if(typeof body.fundId!=='string'||!/^[\w-]{1,100}$/.test(body.fundId))throw new Error();fundId=body.fundId;}}catch{return json({error:'Petición no válida'},400);}
    let claim:Claim;
    try{claim=await deps.claim(request,fundId);}catch{return json({error:'No tienes acceso editorial o la sesión ha caducado'},403);}
    if(!claim.funds.length)return json({updated:0,failed:0,requested:0});
    const signal=AbortSignal.timeout(105000),items:Record<string,unknown>[]=[];let next=0;
    async function worker(){while(next<claim.funds.length){const fund=claim.funds[next++];try{
        if(signal.aborted)throw new Error('Tiempo de consulta agotado');
        const data=await deps.fetchFund(fund.isin,signal);items.push({id:fund.id,...data});
    }catch{items.push({id:fund.id,error:'No se pudieron consultar datos válidos de Finect. Se conserva la última información.'});}}}
    await Promise.all(Array.from({length:Math.min(4,claim.funds.length)},worker));
    try{const published=await deps.finish(claim.lease,items);return json({...published,requested:claim.funds.length});}
    catch{return json({error:'No se pudieron publicar los datos. Se conserva la información anterior.'},503);}
}
