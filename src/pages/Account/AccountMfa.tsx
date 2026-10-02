import {useEffect,useState} from 'react';
import {getAppSupabaseClient} from '../../services/supabaseClient';
import {useAccount} from '../../context/AccountContext';

export function AccountMfa(){
    const account=useAccount();
    const [factor,setFactor]=useState('');const [required,setRequired]=useState(false);
    const [enabled,setEnabled]=useState(false);const [qr,setQr]=useState('');
    const [pendingFactor,setPendingFactor]=useState('');
    const [code,setCode]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
    useEffect(()=>{
        let disposed=false;
        void getAppSupabaseClient().then(async(client)=>{
            const {data,error}=await client.auth.mfa.getAuthenticatorAssuranceLevel();
            if(error)throw error;
            const factors=await client.auth.mfa.listFactors();if(factors.error)throw factors.error;
            if(disposed)return;
            const verified=factors.data.totp[0];setFactor(verified?.id??'');setEnabled(!!verified);
            setPendingFactor(factors.data.all.find(f=>f.factor_type==='totp'&&f.status==='unverified'&&f.friendly_name==='FreeWallet')?.id??'');
            setRequired(data.nextLevel==='aal2'&&data.currentLevel!=='aal2');
            if(data.nextLevel==='aal2'&&!verified)setMessage('Esta cuenta usa un segundo factor distinto de TOTP. Utiliza tu método habitual de acceso; no desactives la protección.');
        }).catch(()=>{if(!disposed)setMessage('No se pudo comprobar la verificación en dos pasos.');});
        return()=>{disposed=true;};
    },[]);
    const enroll=async()=>{
        if(busy)return;setBusy(true);setMessage('');
        try{
            const client=await getAppSupabaseClient();
            const result=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'FreeWallet'});
            if(result.error)throw result.error;
            setFactor(result.data.id);
            const source=result.data.totp.qr_code;const prefix='data:image/svg+xml;utf-8,';
            setQr(source.startsWith(prefix)?'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(source.slice(prefix.length)):source);setRequired(true);
        }catch(error){setMessage(error instanceof Error?error.message:'No se pudo iniciar la configuración.');}
        finally{setBusy(false);}
    };
    const verify=async(event:React.FormEvent)=>{
        event.preventDefault();if(busy)return;setBusy(true);setMessage('');
        try{
            const client=await getAppSupabaseClient();
            const result=await client.auth.mfa.challengeAndVerify({factorId:factor,code});if(result.error)throw result.error;
            setCode('');setQr('');setEnabled(true);setRequired(false);
            await account.refresh();setMessage('Verificación en dos pasos completada.');
        }catch(error){setMessage(error instanceof Error?error.message:'El código no es válido o ha caducado.');}
        finally{setBusy(false);}
    };
    return <div className="card account-page__form"><h2>Verificación en dos pasos</h2>
        <p>{enabled?'Tu cuenta tiene un autenticador configurado.':'Puedes proteger el acceso a tu cartera con una aplicación de autenticación.'}</p>
        {!enabled&&!qr && <><p>Al confirmar el autenticador se cerrarán las otras sesiones. Completa o exporta los cambios pendientes en tus dispositivos antes de activarlo.</p>
            {pendingFactor ? <button className="btn btn--secondary" disabled={busy} onClick={()=>{
                if(!window.confirm('¿Eliminar la configuración de autenticador que quedó sin confirmar? No se eliminará un factor ya verificado.'))return;
                setBusy(true);void getAppSupabaseClient().then(async(client)=>{const result=await client.auth.mfa.unenroll({factorId:pendingFactor});if(result.error)throw result.error;setPendingFactor('');}).catch(()=>setMessage('No se pudo eliminar la configuración pendiente.')).finally(()=>setBusy(false));
            }}>Eliminar configuración pendiente</button>:<button className="btn btn--secondary" disabled={busy||account.sync.status==='saving'||account.sync.status==='conflict'} onClick={()=>void enroll()}>Configurar autenticador</button>}</>}
        {qr && <><p>Escanea el código con tu aplicación. No compartas esta imagen.</p><img width="220" height="220" src={qr} alt="Código QR privado para configurar el autenticador"/></>}
        {required&&factor && <form className="account-page__form" onSubmit={event=>void verify(event)}>
            <label>Código del autenticador<input value={code} onChange={event=>setCode(event.target.value.replace(/\D/g,''))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required/></label>
            <button className="btn btn--primary" disabled={busy||code.length!==6}>{busy?'Verificando…':'Verificar código'}</button>
        </form>}
        {message&&<p role="status">{message}</p>}
    </div>;
}
