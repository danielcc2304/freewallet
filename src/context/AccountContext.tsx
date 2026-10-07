import {createContext,useContext,useEffect,useState,useSyncExternalStore,useCallback} from 'react';
import type {ReactNode} from 'react';
import type {Session,User} from '@supabase/supabase-js';
import {getAppSupabaseClient,isAppBackendConfigured} from '../services/supabaseClient';
import {portfolioStorage} from '../services/portfolioCloudStorage';
import type {CloudData} from '../services/portfolioCloudStorage';
import {readCloudPortfolio,writeCloudPortfolio} from '../services/portfolioRepository';
import {AccountScope} from '../services/accountScope';
import {AccountConnectionState} from '../components/ui/AccountConnectionState';

const portfolioCloudEnabled=isAppBackendConfigured && import.meta.env.VITE_PORTFOLIO_CLOUD_ENABLED==='true';
const scope=new AccountScope();
interface AccountValue {
    user:User|null; recovery:boolean; enabled:boolean; sync:ReturnType<typeof portfolioStorage.getSnapshot>;
    refresh:()=>Promise<void>; importLocal:(data:CloudData,id:string)=>Promise<void>; logout:()=>Promise<void>;
}
const Context=createContext<AccountValue|null>(null);
export function AccountProvider({children}:{children:ReactNode}) {
    const [user,setUser]=useState<User|null>(null);
    const [ready,setReady]=useState(!portfolioCloudEnabled);
    const [recovery,setRecovery]=useState(false);
    const sync=useSyncExternalStore(portfolioStorage.subscribe,portfolioStorage.getSnapshot,portfolioStorage.getSnapshot);
    const refresh=useCallback(async()=>{
        if(!portfolioStorage.cloud || portfolioStorage.busy) return;
        const ticket=scope.request();
        try {
            const result=await readCloudPortfolio(ticket.userId,portfolioStorage.currentRevision<0?null:portfolioStorage.currentRevision,ticket.signal);
            if(ticket.isCurrent()) portfolioStorage.hydrate(result);
        } finally {ticket.finish();}
    },[]);
    useEffect(()=>{
        if(!portfolioCloudEnabled) return;
        let cancelled=false;let unsubscribe:(()=>void)|undefined;let sequence=0;
        let lastId:string|null|undefined;
        const adopt=async(session:Session|null)=>{
            const id=session?.user.id??null;
            if(id===lastId) return;
            const turn=++sequence;
            lastId=id;
            scope.change(id);portfolioStorage.select(id,id ? async(revision,requestId,data,baseline)=>{
                const ticket=scope.request();
                try {const result=await writeCloudPortfolio(ticket.userId,revision,requestId,data,ticket.signal,baseline);if(!ticket.isCurrent())throw new Error('La sesión ha cambiado.');return result;}
                finally {ticket.finish();}
            }:undefined);
            setUser(session?.user??null);
            if(!id){setReady(true);return;}
            setReady(false);
            try {
                const client=await getAppSupabaseClient();
                const verified=await client.auth.getUser();
                if(verified.error || !verified.data.user || verified.data.user.id!==id) throw new Error('No se pudo verificar la sesión. Vuelve a entrar.');
                const ticket=scope.request();
                let record;
                try {record=await readCloudPortfolio(id,null,ticket.signal);} finally {ticket.finish();}
                if(!cancelled && turn===sequence) {setUser(verified.data.user);portfolioStorage.hydrate(record);}
            } catch(error) {
                if(!cancelled && turn===sequence) portfolioStorage.fail(error instanceof Error ? error.message:'No se pudo cargar la cartera. Comprueba la conexión.');
            } finally {if(!cancelled && turn===sequence)setReady(true);}
        };
        void getAppSupabaseClient().then(async(client)=>{
            if(cancelled)return;
            const subscription=client.auth.onAuthStateChange((event,session)=>{
                if(event==='PASSWORD_RECOVERY')setRecovery(true);
                // Never await another Auth call under the callback's Auth lock.
                setTimeout(()=>{if(!cancelled)void adopt(session);},0);
            });
            unsubscribe=()=>subscription.data.subscription.unsubscribe();
            const {data,error}=await client.auth.getSession();
            if(!cancelled) {if(error)portfolioStorage.fail('No se pudo leer la sesión.');await adopt(data.session);}
        }).catch(()=>{if(!cancelled){portfolioStorage.fail('No se pudo iniciar la conexión con Supabase.');setReady(true);}});
        return ()=>{cancelled=true;sequence++;unsubscribe?.();scope.change(null);};
    },[]);
    useEffect(()=>{
        if(!user)return;
        const check=()=>{
            const editing=window.location.pathname==='/add' || window.location.pathname==='/portfolio-csv'
                || document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
            if(!editing && document.visibilityState==='visible' && navigator.onLine && ['synced','empty'].includes(portfolioStorage.getSnapshot().status))void refresh().catch(()=>{});
        };
        const timer=window.setInterval(check,30000);
        window.addEventListener('focus',check);window.addEventListener('online',check);document.addEventListener('visibilitychange',check);
        const beforeUnload=(event:BeforeUnloadEvent)=>{if(portfolioStorage.busy || ['error','conflict'].includes(portfolioStorage.getSnapshot().status)){event.preventDefault();event.returnValue='';}};
        window.addEventListener('beforeunload',beforeUnload);
        return()=>{clearInterval(timer);window.removeEventListener('focus',check);window.removeEventListener('online',check);document.removeEventListener('visibilitychange',check);window.removeEventListener('beforeunload',beforeUnload);};
    },[user,refresh]);
    const importLocal=async(data:CloudData,id:string)=>{
        if(!user || portfolioStorage.currentRevision>=0)throw new Error('No se reemplazará una cartera existente.');
        const ticket=scope.request();
        try{const result=await writeCloudPortfolio(ticket.userId,-1,id,data,ticket.signal);if(ticket.isCurrent())portfolioStorage.hydrate(result);}
        finally{ticket.finish();}
    };
    const logout=async()=>{
        if(portfolioStorage.busy || (portfolioStorage.currentRevision>=0 && ['error','conflict'].includes(sync.status)))throw new Error('Exporta tus cambios pendientes y recupera la cartera antes de salir.');
        const client=await getAppSupabaseClient();const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;
        setRecovery(false);
    };
    if(!ready)return <AccountConnectionState />;
    return <Context.Provider value={{user,recovery,enabled:portfolioCloudEnabled,sync,refresh,importLocal,logout}}>
        <div key={`${sync.userId??'local'}:${sync.viewEpoch}`}>{children}</div>
    </Context.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export function useAccount(){const context=useContext(Context);if(!context)throw new Error('AccountProvider required');return context;}
