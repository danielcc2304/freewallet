import {Button} from '../../components/ui/Button';
import {useEffect,useState} from 'react';
import {getAppSupabaseClient} from '../../services/supabaseClient';
import {useAccount} from '../../context/AccountContext';
import type {FeedbackTone} from '../../components/ui/FeedbackToast';
import {mfaQrImage} from '../../services/mfaQr';

export function AccountMfa({notify}:{notify:(text:string,tone?:FeedbackTone)=>void}){
    const account=useAccount();
    const [factor,setFactor]=useState('');const [required,setRequired]=useState(false);
    const [enabled,setEnabled]=useState(false);const [qr,setQr]=useState('');
    const [pendingFactor,setPendingFactor]=useState('');
    const [secret,setSecret]=useState('');const [showSecret,setShowSecret]=useState(false);
    const [code,setCode]=useState('');const [busy,setBusy]=useState(false);
    useEffect(()=>{
        let disposed=false;
        void getAppSupabaseClient().then(async(client)=>{
            const {data,error}=await client.auth.mfa.getAuthenticatorAssuranceLevel();
            if(error)throw error;
            const factors=await client.auth.mfa.listFactors();if(factors.error)throw factors.error;
            if(disposed)return;
            const verified=factors.data.totp.find(item=>item.status==='verified');setFactor(verified?.id??'');setEnabled(!!verified);
            setPendingFactor(factors.data.all.find(f=>f.factor_type==='totp'&&f.status==='unverified'&&f.friendly_name==='FreeWallet')?.id??'');
            setRequired(data.nextLevel==='aal2'&&data.currentLevel!=='aal2');
            if(data.nextLevel==='aal2'&&!verified)notify('Esta cuenta usa un segundo factor distinto de TOTP. Utiliza tu método habitual de acceso; no desactives la protección.','info');
        }).catch(()=>{if(!disposed)notify('No se pudo comprobar la verificación en dos pasos.','error');});
        return()=>{disposed=true;};
    },[notify]);
    const enroll=async()=>{
        if(busy)return;setBusy(true);
        try{
            const client=await getAppSupabaseClient();
            const result=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'FreeWallet',issuer:'FreeWallet'});
            if(result.error)throw result.error;
            setFactor(result.data.id);
            setSecret(result.data.totp.secret);setShowSecret(false);setRequired(true);
            try{setQr(mfaQrImage(result.data.totp.qr_code));}
            catch{setQr('');setShowSecret(true);notify('No se pudo mostrar el QR. Puedes añadir la cuenta con la clave manual.','info');}
        }catch(error){notify(error instanceof Error?error.message:'No se pudo iniciar la configuración.','error');}
        finally{setBusy(false);}
    };
    const verify=async(event:React.FormEvent)=>{
        event.preventDefault();if(busy)return;setBusy(true);
        try{
            const client=await getAppSupabaseClient();
            const result=await client.auth.mfa.challengeAndVerify({factorId:factor,code});if(result.error)throw result.error;
            setCode('');setQr('');setSecret('');setShowSecret(false);setEnabled(true);setRequired(false);
            await account.refresh();notify('Verificación en dos pasos completada.');
        }catch(error){notify(error instanceof Error?error.message:'El código no es válido o ha caducado.','error');}
        finally{setBusy(false);}
    };
    return <div className="card account-page__form"><h2>Verificación en dos pasos</h2>
        <p>{enabled?'Tu cuenta tiene un autenticador configurado.':'Puedes proteger el acceso a tu cartera con una aplicación de autenticación.'}</p>
        {!enabled&&!secret && <><p>Al confirmar el autenticador se cerrarán las otras sesiones. Completa o exporta los cambios pendientes en tus dispositivos antes de activarlo.</p>
            {pendingFactor ? <Button variant="secondary" disabled={busy} onClick={()=>{
                if(!window.confirm('¿Eliminar la configuración de autenticador que quedó sin confirmar? No se eliminará un factor ya verificado.'))return;
                setBusy(true);void getAppSupabaseClient().then(async(client)=>{const result=await client.auth.mfa.unenroll({factorId:pendingFactor});if(result.error)throw result.error;setPendingFactor('');notify('Configuración pendiente eliminada.');}).catch(()=>notify('No se pudo eliminar la configuración pendiente.','error')).finally(()=>setBusy(false));
            }}>Eliminar configuración pendiente</Button>:<Button variant="secondary" disabled={busy||account.sync.status==='saving'||account.sync.status==='conflict'} onClick={()=>void enroll()}>Configurar autenticador</Button>}</>}
        {secret && <div className="account-page__mfa-setup">
            <p>En Google Authenticator u otra aplicación, pulsa «Añadir cuenta» y elige «Escanear un código QR».</p>
            {qr && <img className="account-page__mfa-qr" width="248" height="248" src={qr} alt="Código QR privado para configurar el autenticador" onError={()=>{setQr('');setShowSecret(true);notify('No se pudo cargar el QR. Usa la clave de configuración manual.','info');}}/>}
            <Button type="button" variant="secondary" aria-expanded={showSecret} aria-controls="account-mfa-manual" onClick={()=>setShowSecret(current=>!current)}>{showSecret?'Ocultar clave manual':'No puedo escanear: usar clave manual'}</Button>
            {showSecret && <div id="account-mfa-manual" className="account-page__mfa-manual">
                <p>Si estás usando el mismo móvil, elige «Introducir una clave de configuración» en tu autenticador. Nombre: FreeWallet. Tipo: basado en tiempo.</p>
                <label>Clave de configuración<input readOnly value={secret} autoComplete="off" spellCheck={false} onFocus={event=>event.currentTarget.select()}/></label>
            </div>}
            <p className="account-page__help">No compartas el QR ni la clave. Después introduce aquí el código de 6 cifras que muestra el autenticador. Si no se acepta, comprueba que la fecha y hora del móvil sean automáticas.</p>
        </div>}
        {required&&factor && <form className="account-page__form" onSubmit={event=>void verify(event)}>
            <label>Código del autenticador<input value={code} onChange={event=>setCode(event.target.value.replace(/\D/g,''))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required/></label>
            <Button disabled={busy||code.length!==6}>{busy?'Verificando…':'Verificar código'}</Button>
        </form>}
    </div>;
}
