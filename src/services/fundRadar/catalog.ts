import { getAppSupabaseClient, isAppBackendConfigured } from '../supabaseClient';
import { validateDraft, type RadarDraft, type RadarFund } from './types';
const selection='*,fund_radar_data(fund_id,metrics,profile,provider_category,source_url,checked_at,last_success_at)';
function fail(error:{code?:string;message?:string}|null):never {
    if(error?.code==='23505')throw new Error('Ya existe un fondo con ese ISIN, quizá esté retirado.');
    if(error?.code==='42501')throw new Error('Tu sesión no tiene acceso editorial. Comprueba también la verificación en dos pasos.');
    throw new Error('No se pudo guardar el fondo. Revisa los campos y tu conexión.');
}
export async function loadRadarCatalog():Promise<RadarFund[]> {
    if(!isAppBackendConfigured)throw new Error('El catálogo necesita la conexión de Supabase.');
    const client=await getAppSupabaseClient();const all:RadarFund[]=[];
    for(let from=0;;from+=500){
        const {data,error}=await client.from('fund_radar_catalog').select(selection).order('id').range(from,from+499);
        if(error)throw new Error('No se pudo cargar el catálogo. Vuelve a intentarlo.');
        all.push(...data as unknown as RadarFund[]);if(data.length<500)break;
    }
    return all;
}
async function checkIdentity(expected:string) {
    const client=await getAppSupabaseClient();const {data,error}=await client.auth.getUser();
    if(error||data.user?.id!==expected)throw new Error('La cuenta ha cambiado. Cierra el formulario y comprueba tu sesión.');
    return client;
}
export async function saveRadarFund(draft:RadarDraft,existing:RadarFund|null,editorId:string):Promise<RadarFund> {
    validateDraft(draft);const client=await checkIdentity(editorId);
    const request=existing?client.from('fund_radar_catalog').update(draft).eq('id',existing.id).eq('version',existing.version):client.from('fund_radar_catalog').insert(draft);
    const {data,error}=await request.select(selection).maybeSingle();
    if(error)fail(error);if(!data)throw new Error('La ficha ha cambiado o tu permiso ha caducado. Actualiza el catálogo antes de guardar.');
    return data as unknown as RadarFund;
}
export async function setRadarFundActive(fund:RadarFund,active:boolean,editorId:string):Promise<void> {
    const client=await checkIdentity(editorId);
    const {data,error}=await client.from('fund_radar_catalog').update({is_active:active}).eq('id',fund.id).eq('version',fund.version).select('id').maybeSingle();
    if(error)fail(error);if(!data)throw new Error('La ficha cambió. Actualiza el catálogo y vuelve a intentarlo.');
}
export async function refreshRadarData(editorId:string,fundId?:string):Promise<{updated:number;failed:number;requested:number}> {
    const client=await checkIdentity(editorId);
    const {data,error}=await client.functions.invoke('fund-radar-refresh',{body:fundId?{fundId}:{}});
    if(error)throw new Error('No se pudo actualizar Finect. Comprueba la sesión o inténtalo más tarde.');
    return data;
}
