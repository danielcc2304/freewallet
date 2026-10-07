import {getAppSupabaseClient,appBackendConfig} from './supabaseClient';
import type {CloudData, CloudRecord} from './portfolioCloudStorage';

async function request(name:string, args:Record<string,unknown>, userId:string, signal?:AbortSignal):Promise<CloudRecord|null> {
    const client=await getAppSupabaseClient();
    const session=await client.auth.getSession();
    if(session.error || !session.data.session || session.data.session.user.id!==userId || !appBackendConfig)
        throw new Error('La sesión ha cambiado. No se han enviado los datos de esta cartera.');
    // Pin this request's token. The shared SDK otherwise resolves Authorization
    // lazily, which could send A's pending payload with B's newly opened session.
    const token=session.data.session.access_token;
    const controller=new AbortController();
    const cancel=()=>controller.abort();signal?.addEventListener('abort',cancel,{once:true});
    if(signal?.aborted)controller.abort();
    const deadline=setTimeout(cancel,15000);
    let data;let error:{code:string}|null=null;
    try {
        const response=await fetch(`${appBackendConfig.url}/rest/v1/rpc/${name}`,{
            method:'POST',headers:{apikey:appBackendConfig.key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
            body:JSON.stringify(args),signal:controller.signal,
        });
        const payload=await response.json();
        if(response.ok)data=payload;else error={code:payload.code??String(response.status)};
    }
    finally{clearTimeout(deadline);signal?.removeEventListener('abort',cancel);}
    if(error) {
        const message=error.code==='40001'?'La cartera cambió en otro dispositivo.':error.code==='42501'?'Verifica tu sesión y, si está activado, el segundo factor.':error.code==='54000'?'Hay demasiados guardados. Espera un minuto y reintenta.':
            ['22023','23514','23502','23505','22003','22007'].includes(error.code)?'Los datos no son compatibles. Revisa identificadores, fechas, importes y el máximo de doce decimales.':'No se pudo confirmar la conexión con tu cartera.';
        throw Object.assign(new Error(message),{code:error.code});
    }
    if(data===null) return null;
    if(!Number.isSafeInteger(data.revision) || data.revision<0 || (data.data!==null && (typeof data.data!=='object' || Array.isArray(data.data) || Object.values(data.data).some(value=>typeof value!=='string')))) throw new Error('Respuesta de cartera no válida.');
    return data as CloudRecord;
}
export const readCloudPortfolio=(userId:string,revision:number|null=null,signal?:AbortSignal)=>request('read_portfolio',{known_revision:revision},userId,signal);
export async function writeCloudPortfolio(userId:string,revision:number,id:string,data:CloudData,signal?:AbortSignal,baseline?:CloudData):Promise<CloudRecord> {
    const delta=baseline && revision>=0 ? {
        changes:Object.fromEntries(Object.entries(data).filter(([key,value])=>baseline[key]!==value)),
        removed:Object.keys(baseline).filter(key=>!(key in data)),
    } : null;
    const result=delta ? await request('patch_portfolio',{expected_revision:revision,request_id:id,...delta},userId,signal)
        : await request('commit_portfolio',{expected_revision:revision,request_id:id,mode:revision<0?'import':'save',data},userId,signal);
    if(!result || !result.data) throw new Error('No se pudo confirmar el guardado.');
    if(result.patch) {
        if(!baseline || !Array.isArray(result.removed) || result.removed.some(key=>typeof key!=='string')) throw new Error('Respuesta incremental no válida.');
        const merged={...baseline,...result.data};
        for(const key of result.removed) delete merged[key];
        return {revision:result.revision,data:merged};
    }
    return result;
}
