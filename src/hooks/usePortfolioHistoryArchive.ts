import { useEffect, useMemo, useState, useRef } from 'react';
import { portfolioStorage } from '../services/portfolioCloudStorage';
import { getAppSupabaseClient, appBackendConfig } from '../services/supabaseClient';
import { readPortfolioHistoryArchive, validateHistoryArchive } from '../services/portfolioHistoryArchive';
import type { PortfolioHistoryArchive } from '../services/portfolioHistoryArchive';

export function usePortfolioHistoryArchive(localRevision: number) {
    const epoch = portfolioStorage.epoch;
    const owner = portfolioStorage.getSnapshot().userId;
    const revision = portfolioStorage.currentRevision;
    const saved = useMemo(() => { void localRevision; void epoch; return readPortfolioHistoryArchive(); }, [localRevision, epoch]);
    const [remote, setRemote] = useState<{epoch:number;revision:number;updatedAt:string;archive:PortfolioHistoryArchive}|null>(null);
    const remoteRef=useRef(remote);
    const [error,setError] = useState({epoch:-1,message:''});
    useEffect(() => {
        if (!owner || revision < 0 || !appBackendConfig || portfolioStorage.getSnapshot().status !== 'synced') return;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(),12000);
        void (async () => {
            const client = await getAppSupabaseClient();
            const session = await client.auth.getSession();
            if(session.error || session.data.session?.user.id !== owner || portfolioStorage.epoch !== epoch) return;
            const response = await fetch(`${appBackendConfig!.url}/rest/v1/rpc/read_portfolio_history`,{
                method:'POST',headers:{apikey:appBackendConfig!.key,Authorization:`Bearer ${session.data.session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({known_updated_at:remoteRef.current?.epoch===epoch ? remoteRef.current.updatedAt : null}),signal:controller.signal,
            });
            if(!response.ok)throw new Error('History read failed');
            const data=await response.json();
            if(data.archive !== null)validateHistoryArchive(data.archive);
            if(!controller.signal.aborted && portfolioStorage.epoch===epoch && data.revision===portfolioStorage.currentRevision){
                const archive=data.archive ?? (remoteRef.current?.epoch===epoch && remoteRef.current.updatedAt===data.updatedAt ? remoteRef.current.archive : null);
                if(archive){const next={epoch,revision:data.revision,updatedAt:data.updatedAt,archive};remoteRef.current=next;setRemote(next);}
                setError({epoch,message:''});
            }
        })().catch(()=>{if(portfolioStorage.epoch===epoch)setError({epoch,message:'No se pudo consultar el histórico. Se conserva la copia guardada.'});}).finally(()=>clearTimeout(timer));
        return()=>{controller.abort();clearTimeout(timer);};
    },[epoch,owner,revision,localRevision]);
    const archive=remote?.epoch===epoch && remote.revision===revision && portfolioStorage.getSnapshot().status==='synced' ? remote.archive : saved;
    return {archive,error:error.epoch===epoch ? error.message : ''};
}
