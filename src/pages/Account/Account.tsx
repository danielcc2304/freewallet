import {Button} from '../../components/ui/Button';
import {useRef,useState} from 'react';
import {useAccount} from '../../context/AccountContext';
import {getAppSupabaseClient} from '../../services/supabaseClient';
import {captureLocalPortfolio,portfolioStorage,readPrivateBackup} from '../../services/portfolioCloudStorage';
import type {CloudData} from '../../services/portfolioCloudStorage';
import './Account.css';
import {AccountMfa} from './AccountMfa';

function download(data:CloudData){
    const url=URL.createObjectURL(new Blob([JSON.stringify({format:'freewallet-private-backup',version:1,data},null,2)],{type:'application/json'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download='freewallet-copia-privada.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function Account(){
    const account=useAccount();
    const [mode,setMode]=useState<'login'|'register'|'recover'>('login');
    const [email,setEmail]=useState('');const [password,setPassword]=useState('');
    const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
    const [preview,setPreview]=useState<CloudData|null>(null);const [confirmed,setConfirmed]=useState(false);
    const fileInput=useRef<HTMLInputElement>(null);const [fileName,setFileName]=useState('');
    const importId=useRef(crypto.randomUUID());
    const action=async(task:()=>Promise<void>)=>{if(busy)return;setBusy(true);setMessage('');try{await task();}catch(error){setMessage(error instanceof Error?error.message:'No se pudo completar la operación.');}finally{setBusy(false);}};
    const submit=(event:React.FormEvent)=>{event.preventDefault();void action(async()=>{
        const client=await getAppSupabaseClient();
        const redirectTo=`${window.location.origin}/account`;
        if(account.recovery){const {error}=await client.auth.updateUser({password});if(error)throw error;setPassword('');setMessage('Contraseña actualizada.');return;}
        if(mode==='recover'){const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo});if(error)throw error;setMessage('Si existe una cuenta para ese correo, recibirás las instrucciones de recuperación.');return;}
        if(mode==='register'){const {error}=await client.auth.signUp({email,password,options:{emailRedirectTo:redirectTo}});if(error)throw error;setPassword('');setMessage('Revisa tu correo para confirmar la cuenta antes de importar tu cartera.');return;}
        const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;setPassword('');
    });};
    const summary=preview?JSON.parse(preview.freewallet_portfolio_v1):null;
    return <section className="account-page">
        <header><h1>Mi cuenta</h1><p>Tu cartera en tus dispositivos, sin perder la copia local.</p></header>
        {!account.enabled && <div className="card"><p>La sincronización todavía no está activada en este entorno. Tu cartera continúa guardándose solo en este navegador.</p><p>La activación requiere verificar la configuración de acceso y correo de Supabase.</p></div>}
        {account.enabled && (!account.user || account.recovery) && <form className="card account-page__form" onSubmit={submit}>
            <h2>{account.recovery?'Nueva contraseña':mode==='login'?'Entrar':mode==='register'?'Crear cuenta':'Recuperar acceso'}</h2>
            {!account.recovery && <label>Correo electrónico<input type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} required maxLength={254}/></label>}
            {(mode!=='recover'||account.recovery) && <label>Contraseña<input type="password" autoComplete={mode==='login'&&!account.recovery?'current-password':'new-password'} value={password} onChange={event=>setPassword(event.target.value)} required minLength={mode==='login'&&!account.recovery?1:12} maxLength={128}/></label>}
            <Button disabled={busy}>{busy?'Procesando…':account.recovery?'Guardar contraseña':mode==='login'?'Entrar':mode==='register'?'Crear cuenta':'Enviar instrucciones'}</Button>
            {!account.recovery && <div className="account-page__actions">{(['login','register','recover'] as const).filter(item=>item!==mode).map(item=><Button type="button" variant="secondary" key={item} onClick={()=>{setMode(item);setMessage('');setPassword('');}}>{item==='login'?'Entrar':item==='register'?'Crear cuenta':'Olvidé mi contraseña'}</Button>)}</div>}
        </form>}
        {account.user && <div className="card">
            <h2>Tu cuenta</h2><p className="account-page__email">{account.user.email}</p><p>Estado: {account.sync.status==='synced'?'Guardado en tu cuenta':account.sync.status==='empty'?'Sin cartera importada':account.sync.status==='saving'?'Guardando…':account.sync.status==='conflict'?'Conflicto entre dispositivos':'No se pudo confirmar la conexión'}</p>
            {account.sync.error && <p role="alert">{account.sync.error}</p>}
            {account.sync.recovered && <div role="alert"><p>Una sesión anterior de esta cuenta dejó cambios sin confirmar. Puedes exportarlos y compararlos con la versión del servidor; no se aplicarán automáticamente.</p><Button variant="secondary" onClick={()=>download(portfolioStorage.recoveredData()!)}>Exportar cambios de la sesión anterior</Button></div>}
            <div className="account-page__actions">
                <Button variant="secondary" disabled={busy||account.sync.status==='saving'} onClick={()=>void action(async()=>{portfolioStorage.discard();await account.refresh();setPreview(null);})}>{account.sync.status==='error'||account.sync.status==='conflict'?'Descartar cambios pendientes y cargar servidor':'Cargar versión del servidor'}</Button>
                {account.sync.status==='error' && portfolioStorage.currentRevision>=0 && <Button disabled={busy} onClick={()=>void action(()=>portfolioStorage.flush())}>Reintentar guardado</Button>}
                {portfolioStorage.currentRevision>=0 && <Button variant="secondary" onClick={()=>download(portfolioStorage.exportData())}>Exportar copia privada{account.sync.status==='synced'?'':' con cambios pendientes'}</Button>}
                <Button variant="secondary" disabled={busy||account.sync.status==='saving'} onClick={()=>void action(account.logout)}>Cerrar sesión en este dispositivo</Button>
            </div>
            <p>Sin conexión puedes consultar la cartera ya cargada, pero no editarla. No compartas tu sesión ni tu copia exportada.</p>
        </div>}
        {account.user && portfolioStorage.currentRevision<0 && <div className="card">
            <h2>Preparar tu cartera</h2><p>No se subirá nada sin tu confirmación. La copia de este navegador permanece intacta.</p>
            <div className="account-page__actions">
                <Button variant="secondary" disabled={busy} onClick={()=>void action(async()=>{setPreview(captureLocalPortfolio());setConfirmed(false);importId.current=crypto.randomUUID();})}>Revisar datos de este navegador</Button>
                <Button variant="secondary" disabled={busy} onClick={()=>{setPreview({freewallet_portfolio_v1:JSON.stringify({version:1,assets:[],transactions:[]})});setConfirmed(false);importId.current=crypto.randomUUID();}}>Empezar una cartera vacía</Button>
            </div>
            <div className="account-page__backup">
                <label htmlFor="account-private-backup">Cargar una copia privada</label>
                <input ref={fileInput} id="account-private-backup" className="account-page__file-input" tabIndex={-1} type="file" accept=".json,application/json" aria-describedby="account-private-backup-help" disabled={busy} onChange={event=>{const file=event.target.files?.[0];setFileName(file?.name??'');setPreview(null);setConfirmed(false);if(file)void action(async()=>{if(file.size>8388608)throw new Error('La copia supera el límite de 8 MB.');setPreview(readPrivateBackup(await file.text()));importId.current=crypto.randomUUID();});}}/>
                <Button type="button" variant="secondary" disabled={busy} aria-describedby="account-private-backup-help account-private-backup-name" onClick={()=>fileInput.current?.click()}>Seleccionar archivo</Button>
                <p id="account-private-backup-name" className="account-page__file-name" aria-live="polite">{fileName||'Ningún archivo seleccionado'}</p>
                <p id="account-private-backup-help">Archivo JSON · máximo 8 MB. Podrás revisar los datos antes de importarlos.</p>
            </div>
            {summary && <div><p>{summary.assets.length} posiciones · {summary.transactions.length} movimientos · {Object.keys(preview!).length} apartados</p>
                <p>Coste de las posiciones: {summary.assets.reduce((sum:number,asset:{quantity:number;purchasePrice:number})=>sum+asset.quantity*asset.purchasePrice,0).toLocaleString('es-ES',{style:'currency',currency:'EUR'})}</p>
                <Button variant="secondary" onClick={()=>download(preview!)}>Descargar copia antes de importar</Button>
                <label className="account-page__confirmation"><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/>Confirmo que estos datos son míos y quiero guardarlos en mi cuenta.</label>
                <Button disabled={!confirmed||busy} onClick={()=>void action(async()=>{await account.importLocal(preview!,importId.current);setPreview(null);setMessage('Cartera importada. La copia local no se ha modificado.');})}>Confirmar importación</Button>
            </div>}
        </div>}
        {account.user && <AccountMfa />}
        {message && <p role="status" aria-live="polite">{message}</p>}
    </section>;
}
