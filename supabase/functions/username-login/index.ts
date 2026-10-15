import {createClient} from 'npm:@supabase/supabase-js@2.112.4';
import {handleUsernameLogin,LoginRateLimitError} from './handler.ts';

// Public entry point: authentication is the user's password, verified by Auth.
// Administrative credentials are only used for the private, rate-limited lookup.
Deno.serve((request:Request)=>{
    const url=Deno.env.get('SUPABASE_URL')!;
    const server=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
    const auth=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(12000)})}});
    return handleUsernameLogin(request,{
        prepare:async(username,clientHash)=>{
            const {data,error}=await server.rpc('prepare_username_login',{login_username:username,client_hash:clientHash}).abortSignal(AbortSignal.timeout(8000));
            if(error||!data)throw new Error('Login unavailable');return data;
        },
        signIn:async(email,password,captchaToken)=>{
            const {data,error}=await auth.auth.signInWithPassword({email,password,options:{captchaToken}});
            if(error?.status===429)throw new LoginRateLimitError();
            if(error&&(error.status===0||(error.status??0)>=500||error.name==='AuthRetryableFetchError'))throw error;
            if(error)return null;
            return data.session;
        },
    });
});
