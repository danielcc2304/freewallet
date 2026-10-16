import {createClient} from 'npm:@supabase/supabase-js@2.112.4';
import {fetchFinectRadar} from './finect.ts';
import {handleRadarRefresh} from './handler.ts';
const url=Deno.env.get('SUPABASE_URL')!;
const service=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve((request:Request)=>handleRadarRefresh(request,{
    claim:async(request,fundId)=>{
        const job=request.headers.get('x-job-secret');
        const client=job?service:createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:request.headers.get('authorization')!}},auth:{persistSession:false,autoRefreshToken:false}});
        const {data,error}=await client.rpc('begin_fund_radar_refresh',{job_secret:job,requested_id:fundId}).abortSignal(AbortSignal.timeout(10000));
        if(error)throw error;return data;
    },
    fetchFund:(isin,signal)=>fetchFinectRadar(isin,Deno.env.get('FINECT_API_KEY')||'OgcqanUxQ4S6Y5VVvnwlJayUuxeg8Ah5',signal),
    finish:async(lease,items)=>{const {data,error}=await service.rpc('finish_fund_radar_refresh',{lease,items}).abortSignal(AbortSignal.timeout(12000));if(error)throw error;return data;},
}));
