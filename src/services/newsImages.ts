import {getAppSupabaseClient} from './supabaseClient';
import {isGooglePhotoShare,imageFormat,MAX_IMAGE_BYTES} from '../../supabase/functions/import-news-image/handler';
export {isGooglePhotoShare};

export async function uploadNewsImage(file:File):Promise<string> {
    if(!file.size||file.size>MAX_IMAGE_BYTES)throw new Error('La imagen debe ocupar como máximo 8 MB.');
    const format=imageFormat(new Uint8Array(await file.slice(0,12).arrayBuffer()));
    if(!format)throw new Error('Usa una imagen JPG, PNG, WebP o GIF.');
    const client=await getAppSupabaseClient();const {data,error}=await client.auth.getSession();
    if(error||!data.session)throw new Error('Inicia sesión como editor para subir imágenes.');
    const token=data.session.access_token;const user=data.session.user.id;const path=`${user}/${crypto.randomUUID()}.${format.extension}`;
    const {error:uploadError}=await client.storage.from('news-images').upload(path,file,{contentType:format.mime,cacheControl:'31536000',upsert:false,headers:{Authorization:`Bearer ${token}`}});
    if(uploadError)throw new Error('No se pudo subir la imagen. Comprueba tu sesión y tus permisos editoriales.');
    return client.storage.from('news-images').getPublicUrl(path).data.publicUrl;
}
export async function importGoogleNewsImage(url:string):Promise<string> {
    const client=await getAppSupabaseClient();const {data,error}=await client.auth.getSession();
    if(error||!data.session)throw new Error('Inicia sesión como editor para importar imágenes.');
    const result=await client.functions.invoke('import-news-image',{body:{url},headers:{Authorization:`Bearer ${data.session.access_token}`},signal:AbortSignal.timeout(40000)});
    if(result.error) {
        let detail='No se pudo importar la foto. Puedes descargarla y subirla desde el dispositivo.';
        if(result.error.context instanceof Response) {
            const body=await result.error.context.json().catch(()=>null);if(typeof body?.error==='string')detail=body.error;
        }
        throw new Error(detail);
    }
    if(typeof result.data?.url!=='string')throw new Error('No se pudo confirmar la importación.');return result.data.url;
}
