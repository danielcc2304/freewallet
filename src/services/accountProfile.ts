import type {SupabaseClient} from '@supabase/supabase-js';

export interface AccountProfile {userId:string;username:string;createdAt:string}
export const usernameHint='Entre 3 y 32 caracteres: letras, números, puntos, guiones y guion bajo.';
export const normalizeUsername=(value:string)=>value.trim().toLowerCase();
export const validUsername=(value:string)=>/^[a-z0-9][a-z0-9._-]{2,31}$/.test(normalizeUsername(value));

export async function readAccountProfile(client:SupabaseClient,userId:string):Promise<AccountProfile>{
    const {data,error}=await client.rpc('my_account_profile');
    if(error||!data?.username||data.userId!==userId)throw new Error('No se pudo cargar tu nombre de usuario.');
    return data as AccountProfile;
}
export async function changeUsername(client:SupabaseClient,username:string,userId:string):Promise<AccountProfile>{
    if(!validUsername(username))throw new Error(usernameHint);
    const {data,error}=await client.rpc('change_my_username',{new_username:normalizeUsername(username),expected_user_id:userId});
    if(error){
        if(error.code==='23505')throw new Error('Ese nombre de usuario ya está ocupado.');
        if(error.code==='42501')throw new Error('Confirma tu sesión y el autenticador, si lo tienes activo, antes de cambiar el nombre.');
        throw new Error('No se pudo cambiar el nombre de usuario. Inténtalo de nuevo.');
    }
    if(!data?.username||data.userId!==userId)throw new Error('No se pudo confirmar el cambio de nombre.');
    return data as AccountProfile;
}

export async function signInWithIdentifier(client:SupabaseClient,identifier:string,password:string){
    const login=identifier.trim();
    if(login.includes('@'))return client.auth.signInWithPassword({email:login,password});
    if(!validUsername(login))throw new Error('Usuario o contraseña incorrectos.');
    const {data,error}=await client.functions.invoke('username-login',{body:{username:normalizeUsername(login),password}});
    if(error){
        const response='context' in error&&error.context instanceof Response?error.context:null;
        if(response?.status===429)throw new Error('Demasiados intentos. Espera unos minutos o entra con tu correo.');
        if(response?.status===401)throw new Error('Usuario o contraseña incorrectos.');
        throw new Error('No se pudo iniciar sesión. Inténtalo de nuevo o usa tu correo.');
    }
    if(!data?.access_token||!data?.refresh_token)throw new Error('No se pudo confirmar la sesión.');
    return client.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});
}
