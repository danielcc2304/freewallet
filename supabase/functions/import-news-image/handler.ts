export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'no-store'};
const json = (value:unknown,status=200) => new Response(JSON.stringify(value),{status,headers:{...CORS,'Content-Type':'application/json'}});

export function isGooglePhotoShare(value:string):boolean {
    try {
        const url=new URL(value);
        return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&(
            (url.hostname==='photos.app.goo.gl'&&/^\/[a-zA-Z0-9]+$/.test(url.pathname))||
            (url.hostname==='photos.google.com'&&url.pathname.startsWith('/share/')));
    } catch {return false;}
}
function isGoogleImage(value:string):boolean {
    try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&/^lh\d+\.googleusercontent\.com$/.test(url.hostname);} catch {return false;}
}
export function imageFormat(bytes:Uint8Array):{mime:string;extension:string}|null {
    if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return {mime:'image/jpeg',extension:'jpg'};
    if([137,80,78,71,13,10,26,10].every((byte,i)=>bytes[i]===byte))return {mime:'image/png',extension:'png'};
    const header=new TextDecoder().decode(bytes.slice(0,12));
    if(header.startsWith('GIF87a')||header.startsWith('GIF89a'))return {mime:'image/gif',extension:'gif'};
    if(header.startsWith('RIFF')&&header.slice(8)==='WEBP')return {mime:'image/webp',extension:'webp'};
    return null;
}
async function bounded(response:Response|Request,max:number):Promise<Uint8Array> {
    if(Number(response.headers.get('content-length'))>max){await response.body?.cancel();throw new Error('El archivo supera el tamaño permitido.');}
    const reader=response.body?.getReader();if(!reader)throw new Error('Respuesta vacía.');
    const chunks:Uint8Array[]=[];let size=0;
    try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max)throw new Error('El archivo supera el tamaño permitido.');chunks.push(value);}}
    finally {await reader.cancel().catch(()=>{});reader.releaseLock();}
    const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}return result;
}
async function googleFetch(url:string,kind:'page'|'image',fetcher:typeof fetch,signal:AbortSignal):Promise<Response> {
    for(let step=0;step<6;step++) {
        if(!(kind==='page'?isGooglePhotoShare(url):isGoogleImage(url)))throw new Error('El enlace no corresponde a una foto pública de Google Fotos.');
        const response=await fetcher(url,{redirect:'manual',signal,headers:{Accept:kind==='page'?'text/html':'image/jpeg,image/png,image/webp,image/gif'}});
        if([301,302,303,307,308].includes(response.status)) {
            const destination=response.headers.get('location');await response.body?.cancel();
            if(!destination)throw new Error('Enlace de Google Fotos no disponible.');url=new URL(destination,url).toString();continue;
        }
        if(!response.ok){await response.body?.cancel();throw new Error('No se pudo abrir la foto. Comprueba que el enlace sea público.');}
        return response;
    }
    throw new Error('El enlace tiene demasiadas redirecciones.');
}
function decodeAttribute(value:string):string {
    return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi,entity=>{
        const names:Record<string,string>={'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'};
        if(names[entity.toLowerCase()])return names[entity.toLowerCase()];
        const code=entity.toLowerCase().startsWith('&#x')?parseInt(entity.slice(3,-1),16):parseInt(entity.slice(2,-1),10);
        return code>0&&code<=0x10ffff?String.fromCodePoint(code):'';
    });
}
export async function readPublicGooglePhoto(url:string,fetcher:typeof fetch=fetch):Promise<{bytes:Uint8Array;mime:string;extension:string}> {
    const signal=AbortSignal.timeout(20000);
    const page=await googleFetch(url,'page',fetcher,signal);
    if(!page.headers.get('content-type')?.includes('text/html'))throw new Error('Google Fotos no devolvió una página pública.');
    const html=new TextDecoder().decode(await bounded(page,2*1024*1024));let source:string|null=null;
    for(const tag of html.match(/<meta\s[^>]*>/gi)??[]) {
        const attrs:Record<string,string>={};for(const match of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g))attrs[match[1].toLowerCase()]=decodeAttribute(match[3]);
        if(attrs.property==='og:image'||attrs.name==='og:image'){source=attrs.content;break;}
    }
    if(!source||!isGoogleImage(source))throw new Error('No se encontró una foto pública. Descárgala de Google Fotos y súbela desde tu dispositivo.');
    // Drop the social-card crop, keeping the original aspect ratio.
    source=source.replace(/=[\w-]+$/,'')+'=w1920';
    const image=await googleFetch(source,'image',fetcher,signal);
    if(!image.headers.get('content-type')?.toLowerCase().startsWith('image/'))throw new Error('El enlace no devuelve una imagen.');
    const bytes=await bounded(image,MAX_IMAGE_BYTES);const format=imageFormat(bytes);
    if(!format)throw new Error('Formato no compatible. Usa JPG, PNG, WebP o GIF.');
    return {bytes,...format};
}
export interface ImageDependencies {
    authorize:(token:string)=>Promise<string|null>;
    upload:(userId:string,bytes:Uint8Array,mime:string,extension:string,token:string)=>Promise<string>;
    fetcher?:typeof fetch;
}
export async function handleImportNewsImage(request:Request,deps:ImageDependencies):Promise<Response> {
    if(request.method==='OPTIONS')return new Response('ok',{headers:CORS});
    if(request.method!=='POST')return json({error:'Método no permitido.'},405);
    const token=request.headers.get('authorization')??'';
    if(!/^Bearer \S+$/.test(token))return json({error:'Inicia sesión como editor para importar imágenes.'},401);
    try {
        const user=await deps.authorize(token);if(!user)return json({error:'Necesitas acceso editorial y completar el autenticador si está activo.'},403);
        const raw=new TextDecoder().decode(await bounded(request,4096));let url:string;
        try {const body=JSON.parse(raw);url=typeof body.url==='string'?body.url.trim():'';} catch {return json({error:'Introduce un enlace válido.'},400);}
        if(!isGooglePhotoShare(url))return json({error:'Usa un enlace compartido de Google Fotos. Los enlaces privados no se pueden importar.'},400);
        const {bytes,mime,extension}=await readPublicGooglePhoto(url,deps.fetcher);
        const publicUrl=await deps.upload(user,bytes,mime,extension,token);return json({url:publicUrl});
    } catch(error) {return json({error:error instanceof Error?error.message:'No se pudo importar la foto.'},400);}
}
