export interface UsernameLoginDependencies {
    prepare:(username:string,clientHash:string)=>Promise<{allowed:boolean;email:string|null}>;
    signIn:(email:string,password:string,captchaToken?:string)=>Promise<{access_token:string;refresh_token:string}|null>;
}
export class LoginRateLimitError extends Error {}
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type',
    'Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const denied=()=>json({error:'Usuario o contraseña incorrectos.'},401);

export async function handleUsernameLogin(request:Request,dependencies:UsernameLoginDependencies):Promise<Response>{
    if(request.method==='OPTIONS')return new Response('ok',{headers});
    if(request.method!=='POST')return json({error:'Método no permitido.'},405);
    let username:string;let password:string;let captchaToken:string|undefined;
    try{
        if(Number(request.headers.get('content-length'))>4096)return json({error:'Petición demasiado grande.'},413);
        const text=await request.text();if(text.length>4096)return json({error:'Petición demasiado grande.'},413);
        const body=JSON.parse(text);
        username=typeof body.username==='string'?body.username.trim().toLowerCase():'';
        password=typeof body.password==='string'?body.password:'';
        captchaToken=typeof body.captchaToken==='string'?body.captchaToken:undefined;
        if(!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)||!password||password.length>128)return denied();
    }catch{return denied();}
    try{
        // Use the final gateway-added hop, never a caller-provided first entry.
        // Account and global counters also apply, independently of the IP key.
        const ip=request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()||'unknown';
        const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip));
        const clientHash=Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('');
        const prepared=await dependencies.prepare(username,clientHash);
        if(!prepared.allowed)return json({error:'Demasiados intentos. Espera unos minutos o entra con tu correo.'},429);
        // Unknown names also go through Auth. Do not disclose email or existence.
        const session=await dependencies.signIn(prepared.email??'unknown-username@invalid.freewallet',password,captchaToken);
        if(!session||!prepared.email)return denied();
        return json({access_token:session.access_token,refresh_token:session.refresh_token});
    }catch(error){
        if(error instanceof LoginRateLimitError)return json({error:'Demasiados intentos. Espera unos minutos o entra con tu correo.'},429);
        return json({error:'No se pudo iniciar sesión. Inténtalo de nuevo o usa tu correo.'},503);
    }
}
