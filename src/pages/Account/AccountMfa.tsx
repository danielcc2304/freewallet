import {Button} from '../../components/ui/Button';
import {useEffect,useRef,useState} from 'react';
import {getAppSupabaseClient} from '../../services/supabaseClient';
import {useAccount} from '../../context/AccountContext';
import type {FeedbackTone} from '../../components/ui/FeedbackToast';
import {createMfaQrImage} from '../../services/mfaQr';
import {disableAuthenticator} from '../../services/mfaManagement';
import {Input} from '../../components/ui/Input';
import {AccountPanel,AccountHelp} from './AccountLayout';

export function AccountMfa({notify,onVerified}:{notify:(text:string,tone?:FeedbackTone)=>void;onVerified?:()=>void}){
    const account=useAccount();
    const [factor,setFactor]=useState('');const [required,setRequired]=useState(false);
    const [enabled,setEnabled]=useState(false);const [qr,setQr]=useState('');
    const [pendingFactor,setPendingFactor]=useState('');
    const [secret,setSecret]=useState('');const [showSecret,setShowSecret]=useState(false);
    const [code,setCode]=useState('');const [busy,setBusy]=useState(false);
    const [removing,setRemoving]=useState(false);
    const generation=useRef(0);
    useEffect(()=>{
        const ticket=++generation.current;
        let disposed=false;
        void getAppSupabaseClient().then(async(client)=>{
            const {data,error}=await client.auth.mfa.getAuthenticatorAssuranceLevel();
            if(error)throw error;
            const factors=await client.auth.mfa.listFactors();if(factors.error)throw factors.error;
            if(disposed)return;
            setRemoving(false);setCode('');setSecret('');setQr('');setShowSecret(false);setBusy(false);
            const verified=factors.data.totp.find(item=>item.status==='verified');setFactor(verified?.id??'');setEnabled(!!verified);
            setPendingFactor(factors.data.all.find(f=>f.factor_type==='totp'&&f.status==='unverified'&&f.friendly_name==='FreeWallet')?.id??'');
            setRequired(data.nextLevel==='aal2'&&data.currentLevel!=='aal2');
            if(data.nextLevel==='aal2'&&!verified)notify('Esta cuenta usa un segundo factor distinto de TOTP. Utiliza tu método habitual de acceso; no desactives la protección.','info');
        }).catch(()=>{if(!disposed)notify('No se pudo comprobar la verificación en dos pasos.','error');});
        return()=>{disposed=true;generation.current=ticket+1;};
    },[notify,account.user?.id]);
    const enroll=async()=>{
        if(busy)return;setBusy(true);
        try{
            const client=await getAppSupabaseClient();
            const result=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'FreeWallet',issuer:'FreeWallet'});
            if(result.error)throw result.error;
            setFactor(result.data.id);
            setSecret(result.data.totp.secret);setShowSecret(false);setRequired(true);
            try{setQr(await createMfaQrImage(result.data.totp.qr_code,result.data.totp.uri));}
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
            notify('Verificación en dos pasos completada.');onVerified?.();
            // Authentication has succeeded independently of portfolio loading.
            // A temporary data error must not strand the verified editor here.
            void account.refresh().catch(()=>notify('Verificación completada. No se pudo actualizar la cartera; reintenta desde Mi cuenta.','info'));
        }catch(error){notify(error instanceof Error?error.message:'El código no es válido o ha caducado.','error');}
        finally{setBusy(false);}
    };
    const remove=async(event:React.FormEvent)=>{
        event.preventDefault();if(busy||!account.user)return;
        const ticket=generation.current;
        const isCurrent=()=>ticket===generation.current;
        const userId=account.user.id;
        setBusy(true);
        try{
            const client=await getAppSupabaseClient();
            await disableAuthenticator(client.auth,{factorId:factor,code,userId,isCurrent});
            if(!isCurrent())return;
            setRemoving(false);setCode('');setRequired(false);setEnabled(false);setFactor('');
            notify('Autenticador eliminado.');
            // Deletion has already succeeded, even if refreshing the session fails.
            try{
                const refreshed=await client.auth.refreshSession();if(refreshed.error)throw refreshed.error;
                if(!isCurrent())return;
                const factors=await client.auth.mfa.listFactors();if(factors.error)throw factors.error;
                if(!isCurrent())return;
                const remaining=factors.data.totp.find(item=>item.status==='verified');
                setEnabled(!!remaining);setFactor(remaining?.id??'');
                const assurance=await client.auth.mfa.getAuthenticatorAssuranceLevel();
                if(assurance.error)throw assurance.error;
                if(!isCurrent())return;
                setRequired(assurance.data.nextLevel==='aal2'&&assurance.data.currentLevel!=='aal2');
                if(factors.data.all.some(item=>item.status==='verified'))notify('Se ha eliminado este autenticador. Los demás factores siguen activos.','info');
                await account.refresh();
            }catch{
                if(isCurrent())notify('Autenticador eliminado. Vuelve a iniciar sesión para actualizar el estado de la cuenta.','info');
            }
        }catch(error){
            if(isCurrent())notify(error instanceof Error?error.message:'No se pudo desactivar el autenticador. Comprueba el código e inténtalo de nuevo.','error');
        }finally{if(isCurrent())setBusy(false);}
    };
    return <AccountPanel className="account-page__form tw:grid tw:gap-4"><h2 className="tw:text-xl tw:leading-[1.35]">Verificación en dos pasos</h2>
        <p>{enabled?'Tu cuenta tiene un autenticador configurado.':'Puedes proteger el acceso a tu cartera con una aplicación de autenticación.'}</p>
        {enabled&&!removing && <Button type="button" variant="secondary" disabled={busy||account.sync.status==='saving'||account.sync.status==='conflict'} onClick={()=>{setCode('');setRemoving(true);}}>Desactivar autenticador</Button>}
        {removing && <p>Dejarás de usar este autenticador para acceder. Confirma con su código actual de 6 cifras.</p>}
        {!enabled&&!secret && <><p>Al confirmar el autenticador se cerrarán las otras sesiones. Completa o exporta los cambios pendientes en tus dispositivos antes de activarlo.</p>
            {pendingFactor ? <Button variant="secondary" disabled={busy} onClick={()=>{
                if(!window.confirm('¿Eliminar la configuración de autenticador que quedó sin confirmar? No se eliminará un factor ya verificado.'))return;
                setBusy(true);void getAppSupabaseClient().then(async(client)=>{const result=await client.auth.mfa.unenroll({factorId:pendingFactor});if(result.error)throw result.error;setPendingFactor('');notify('Configuración pendiente eliminada.');}).catch(()=>notify('No se pudo eliminar la configuración pendiente.','error')).finally(()=>setBusy(false));
            }}>Eliminar configuración pendiente</Button>:<Button variant="secondary" disabled={busy||account.sync.status==='saving'||account.sync.status==='conflict'} onClick={()=>void enroll()}>Configurar autenticador</Button>}</>}
        {secret && <div className="account-page__mfa-setup tw:grid tw:gap-4 tw:min-w-0">
            <p>En Google Authenticator u otra aplicación, pulsa «Añadir cuenta» y elige «Escanear un código QR».</p>
            {qr && <img className="account-page__mfa-qr tw:block tw:w-[248px] tw:h-[248px] tw:max-w-full tw:object-contain tw:p-[24px] tw:bg-white tw:rounded-xl tw:justify-self-center tw:[image-rendering:pixelated]" width="248" height="248" src={qr} alt="Código QR privado para configurar el autenticador" onError={()=>{setQr('');setShowSecret(true);notify('No se pudo cargar el QR. Usa la clave de configuración manual.','info');}}/>}
            <Button type="button" variant="secondary" aria-expanded={showSecret} aria-controls="account-mfa-manual" onClick={()=>setShowSecret(current=>!current)}>{showSecret?'Ocultar clave manual':'No puedo escanear: usar clave manual'}</Button>
            {showSecret && <div id="account-mfa-manual" className="account-page__mfa-manual tw:grid tw:gap-4 tw:min-w-0">
                <p>Si estás usando el mismo móvil, elige «Introducir una clave de configuración» en tu autenticador. Nombre: FreeWallet. Tipo: basado en tiempo.</p>
                <Input density="comfortable" label="Clave de configuración" readOnly value={secret} autoComplete="off" spellCheck={false} onFocus={event=>event.currentTarget.select()}/>
            </div>}
            <AccountHelp>No compartas el QR ni la clave. Después introduce aquí el código de 6 cifras que muestra el autenticador. Si no se acepta, comprueba que la fecha y hora del móvil sean automáticas.</AccountHelp>
        </div>}
        {(required||removing)&&factor && <form className="account-page__form tw:grid tw:gap-4" onSubmit={event=>void (removing?remove(event):verify(event))}>
            <Input density="comfortable" label="Código del autenticador" value={code} onChange={event=>setCode(event.target.value.replace(/\D/g,''))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required/>
            <Button disabled={busy||code.length!==6}>{busy?'Verificando…':removing?'Confirmar desactivación':'Verificar código'}</Button>
            {removing && <Button type="button" variant="secondary" disabled={busy} onClick={()=>{setRemoving(false);setCode('');}}>Cancelar</Button>}
        </form>}
    </AccountPanel>;
}
