import {createClient} from 'npm:@supabase/supabase-js@2.112.4';
import {handleImportNewsImage} from './handler.ts';

// JWT verification at the gateway; the RPC also enforces live session, editor and MFA.
// Storage writes use the caller's JWT and bucket RLS, never a service key.
Deno.serve((request:Request)=>{
    const client=(token:string)=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{
        auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:token},fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(15000)})},
    });
    return handleImportNewsImage(request,{
        authorize:async token=>{
            const userClient=client(token);const {data:user,error}=await userClient.auth.getUser();
            if(error||!user.user)return null;
            const {data:allowed,error:denied}=await userClient.rpc('is_news_admin');
            return !denied&&allowed===true?user.user.id:null;
        },
        upload:async(userId,bytes,mime,extension,token)=>{
            const userClient=client(token);const path=`${userId}/${crypto.randomUUID()}.${extension}`;
            const {error}=await userClient.storage.from('news-images').upload(path,bytes,{contentType:mime,cacheControl:'31536000',upsert:false});
            if(error)throw new Error('No se pudo guardar la imagen. Comprueba tu sesión y vuelve a intentarlo.');
            return userClient.storage.from('news-images').getPublicUrl(path).data.publicUrl;
        },
    });
});
