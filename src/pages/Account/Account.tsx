import {Button} from '../../components/ui/Button';
import {useEffect,useRef,useState} from 'react';
import {useFeedbackNotice} from '../../components/ui/useFeedbackNotice';
import {useAccount} from '../../context/AccountContext';
import {getAppSupabaseClient} from '../../services/supabaseClient';
import {captureLocalPortfolio,portfolioStorage,readPrivateBackup} from '../../services/portfolioCloudStorage';
import type {CloudData} from '../../services/portfolioCloudStorage';
import {AccountPanel,AccountActions,AccountHelp,AccountHeading} from './AccountLayout';
import {AccountMfa} from './AccountMfa';
import {localPortfolioSummary} from '../../services/localPortfolioSummary';
import {AccountIdentity} from './AccountIdentity';
import {PageHeader,Input} from '../../components/ui';
import {Cloud,LogOut,ShieldCheck} from 'lucide-react';
import {normalizeUsername,validUsername,usernameHint,signInWithIdentifier} from '../../services/accountProfile';

function download(data:CloudData){
    const url=URL.createObjectURL(new Blob([JSON.stringify({format:'freewallet-private-backup',version:1,data},null,2)],{type:'application/json'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download='freewallet-copia-privada.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function Account(){
    const account=useAccount();
    const [mode,setMode]=useState<'login'|'register'|'recover'>('login');
    const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [username,setUsername]=useState('');
    const [busy,setBusy]=useState(false);
    const {notify,clearNotice}=useFeedbackNotice();
    useEffect(()=>{if(account.sync.error)notify(account.sync.error,'error');},[account.sync.error,notify]);
    const [preview,setPreview]=useState<CloudData|null>(null);const [confirmed,setConfirmed]=useState(false);
    const fileInput=useRef<HTMLInputElement>(null);const [fileName,setFileName]=useState('');
    const importId=useRef(crypto.randomUUID());
    const [local]=useState(localPortfolioSummary);
    const importHeading=useRef<HTMLHeadingElement>(null);
    useEffect(()=>{if(preview){importHeading.current?.focus({preventScroll:true});importHeading.current?.scrollIntoView({block:'start',behavior:'instant'});}},[preview]);
    const needsImport=!!account.user && !account.recovery && account.sync.status==='empty';
    const reviewLocal=()=>void action(async()=>{setPreview(captureLocalPortfolio());setConfirmed(false);importId.current=crypto.randomUUID();});
    const action=async(task:()=>Promise<void>)=>{if(busy)return;setBusy(true);clearNotice();try{await task();}catch(error){notify(error instanceof Error?error.message:'No se pudo completar la operación.','error');}finally{setBusy(false);}};
    const submit=(event:React.FormEvent)=>{event.preventDefault();void action(async()=>{
        const client=await getAppSupabaseClient();
        const redirectTo=`${window.location.origin}/account`;
        if(account.recovery){const {error}=await client.auth.updateUser({password});if(error)throw error;setPassword('');notify('Contraseña actualizada.');return;}
        if(mode==='recover'){const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo});if(error)throw error;notify('Si existe una cuenta para ese correo, recibirás las instrucciones de recuperación.');return;}
        if(mode==='register'){if(!validUsername(username))throw new Error(usernameHint);const {error}=await client.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:redirectTo,data:{username:normalizeUsername(username)}}});if(error)throw new Error(error.code==='unexpected_failure'?'No se pudo crear la cuenta. Revisa los datos; el nombre de usuario podría estar ocupado.':error.message);setPassword('');notify('Revisa tu correo para confirmar la cuenta antes de importar tu cartera.');return;}
        const {error}=await signInWithIdentifier(client,email,password);if(error)throw error;setPassword('');notify('Sesión iniciada.');
    });};
    const summary=preview?JSON.parse(preview.freewallet_portfolio_v1):null;
    return <section className="account-page tw:max-w-[900px] tw:w-full tw:min-w-0 tw:mx-auto tw:grid tw:gap-5">
        <PageHeader eyebrow="Cuenta" className="tw:mb-0 tw:max-[640px]:mb-0">
            <h1>Mi cuenta</h1><p>Tu perfil, tu acceso y tu cartera, en un solo lugar.</p>
        </PageHeader>
        {needsImport && <AccountPanel className="account-page__welcome tw:grid tw:gap-4 tw:border-line-accent">
            <span className="account-page__step tw:text-accent tw:text-sm tw:font-semibold">Primer paso · Conecta tu cartera</span>
            <h2 className="tw:text-xl tw:leading-[1.35]">{local.found?'Tu cartera está aquí. Falta guardarla en tu cuenta.':'Tu cuenta está lista. Ahora añade tu cartera.'}</h2>
            {local.found ? <>
                <p>Hemos encontrado {local.positions>0?`${local.positions} posiciones guardadas`:'datos de tu cartera'} en este navegador{local.hasWorkbook?' y un Excel cargado':''}. No se han borrado. Al iniciar sesión, no se suben automáticamente a tu cuenta.</p>
                <ol className="tw:pl-[1.4rem] tw:grid tw:gap-[.65rem] tw:leading-[1.55]"><li>Pulsa <strong>Revisar mi cartera</strong>.</li><li>Comprueba que los datos son tuyos.</li><li>Marca la casilla de confirmación y pulsa <strong>Guardar cartera en mi cuenta</strong>.</li></ol>
                <Button className="tw:justify-self-start" disabled={busy} onClick={reviewLocal}>Revisar mi cartera</Button>
                <AccountHelp>Hasta que confirmes, tu cuenta seguirá vacía. La copia de este navegador se conservará también después de importar.</AccountHelp>
            </> : <p>{local.unreadable?'No hemos podido leer la copia de este navegador. No hemos borrado nada. Puedes cargar una copia privada o volver a intentar revisar los datos abajo.':'Si tu cartera está en el móvil, inicia sesión allí y revisa los datos de ese navegador. También puedes cargar una copia privada JSON o empezar una cartera vacía aquí.'}</p>}
            <AccountHelp>Importar un Excel en Portfolio no conecta por sí solo la cartera a tu cuenta. Primero completa este paso; después, los cambios compatibles se guardarán en tu cuenta mientras estés conectado.</AccountHelp>
        </AccountPanel>}
        {!account.enabled && <AccountPanel><p>La sincronización todavía no está activada en este entorno. Tu cartera continúa guardándose solo en este navegador.</p><p>La activación requiere verificar la configuración de acceso y correo de Supabase.</p></AccountPanel>}
        {account.enabled && (!account.user || account.recovery) && <AccountPanel as="form" className="account-page__form account-page__auth tw:grid tw:gap-4 tw:w-full tw:max-w-[560px] tw:justify-self-center" onSubmit={submit}>
            <AccountHeading icon={<ShieldCheck size={22} aria-hidden="true"/>}>{account.recovery?'Nueva contraseña':mode==='login'?'Bienvenido de nuevo':mode==='register'?'Crea tu cuenta':'Recupera tu acceso'}</AccountHeading>
            {!account.recovery&&<AccountHelp>{mode==='login'?'Entra para consultar y sincronizar tu cartera.':mode==='register'?'Elige tu usuario y confirma tu correo para empezar.':'Te enviaremos un enlace para recuperar tu contraseña.'}</AccountHelp>}
            {!account.recovery && <Input density="comfortable" label={mode==='login'?'Usuario o correo electrónico':'Correo electrónico'} id="account-login" type={mode==='login'?'text':'email'} autoComplete={mode==='login'?'username':'email'} autoCapitalize="none" spellCheck={false} value={email} onChange={event=>setEmail(event.target.value)} required maxLength={254}/>}
            {!account.recovery&&mode==='register'&&<Input density="comfortable" label="Nombre de usuario" id="account-register-username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={event=>setUsername(event.target.value)} minLength={3} maxLength={32} required hint={usernameHint}/>}
            {(mode!=='recover'||account.recovery) && <Input density="comfortable" label="Contraseña" type="password" autoComplete={mode==='login'&&!account.recovery?'current-password':'new-password'} value={password} onChange={event=>setPassword(event.target.value)} required minLength={mode==='login'&&!account.recovery?1:12} maxLength={128}/>}
            <Button loading={busy} aria-busy={busy}>{account.recovery?'Guardar contraseña':mode==='login'?'Entrar':mode==='register'?'Crear cuenta':'Enviar instrucciones'}</Button>
            {!account.recovery && <AccountActions>{(['login','register','recover'] as const).filter(item=>item!==mode).map(item=><Button type="button" variant="secondary" key={item} onClick={()=>{setMode(item);clearNotice();setPassword('');}}>{item==='login'?'Entrar':item==='register'?'Crear cuenta':'Olvidé mi contraseña'}</Button>)}</AccountActions>}
        </AccountPanel>}
        {account.user && <AccountPanel>
            <AccountIdentity key={account.user.id} user={account.user} notify={notify}/>
            <div className="account-page__sync-section tw:mt-6 tw:pt-6 tw:border-t tw:border-line">
                <AccountHeading icon={<Cloud size={21} aria-hidden="true"/>}>Tu cartera</AccountHeading>
                <p className="account-page__sync-status tw:inline-flex tw:items-center tw:mt-[.8rem] tw:px-3 tw:py-[.4rem] tw:rounded-full tw:bg-[rgba(var(--accent-rgb),.08)] tw:text-secondary tw:text-[.85rem]" role="status">{account.sync.status==='synced'?'Guardado en tu cuenta':account.sync.status==='empty'?'Sin cartera importada':account.sync.status==='saving'?'Guardando…':account.sync.status==='conflict'?'Conflicto entre dispositivos':'No se pudo confirmar la conexión'}</p>
                {account.sync.recovered && <div role="alert"><p>Una sesión anterior de esta cuenta dejó cambios sin confirmar. Puedes exportarlos y compararlos con la versión del servidor; no se aplicarán automáticamente.</p><Button variant="secondary" onClick={()=>download(portfolioStorage.recoveredData()!)}>Exportar cambios de la sesión anterior</Button></div>}
                <AccountActions>
                    <Button variant="secondary" disabled={busy||account.sync.status==='saving'} onClick={()=>void action(async()=>{portfolioStorage.discard();await account.refresh();setPreview(null);if(portfolioStorage.getSnapshot().status==='synced')notify('Cartera actualizada desde el servidor.');})}>{account.sync.status==='error'||account.sync.status==='conflict'?'Descartar cambios pendientes y cargar servidor':'Cargar versión del servidor'}</Button>
                    {account.sync.status==='error' && portfolioStorage.currentRevision>=0 && <Button disabled={busy} onClick={()=>void action(()=>portfolioStorage.flush())}>Reintentar guardado</Button>}
                    {portfolioStorage.currentRevision>=0 && <Button variant="secondary" onClick={()=>download(portfolioStorage.exportData())}>Exportar copia privada{account.sync.status==='synced'?'':' con cambios pendientes'}</Button>}
                    <Button variant="ghost" icon={<LogOut size={17}/>} disabled={busy||account.sync.status==='saving'} onClick={()=>void action(async()=>{await account.logout();notify('Sesión cerrada en este dispositivo.');})}>Cerrar sesión en este dispositivo</Button>
                </AccountActions>
                <AccountHelp>Sin conexión puedes consultar la cartera guardada. No compartas tu sesión ni tu copia privada.</AccountHelp>
            </div>
        </AccountPanel>}
        {needsImport && <AccountPanel>
            <h2 className="tw:text-xl tw:leading-[1.35]" ref={importHeading} tabIndex={-1}>{preview?'Revisa los datos antes de guardar':'Elige cómo empezar'}</h2>
            <p>No se subirá nada sin tu confirmación. La copia de este navegador permanece intacta.</p>
            <AccountActions>
                <Button variant="secondary" disabled={busy} onClick={reviewLocal}>Revisar datos de este navegador</Button>
                <Button variant="secondary" disabled={busy} onClick={()=>{setPreview({freewallet_portfolio_v1:JSON.stringify({version:1,assets:[],transactions:[]})});setConfirmed(false);importId.current=crypto.randomUUID();}}>Empezar una cartera vacía</Button>
            </AccountActions>
            <div className="account-page__backup tw:relative tw:grid tw:gap-[.65rem] tw:min-w-0 tw:[&_p]:m-0 tw:[&_p]:text-sm tw:[&_p]:text-secondary">
                <label className="tw:font-medium" htmlFor="account-private-backup">Cargar una copia privada</label>
                <input ref={fileInput} id="account-private-backup" className="account-page__file-input tw:sr-only" tabIndex={-1} type="file" accept=".json,application/json" aria-describedby="account-private-backup-help" disabled={busy} onChange={event=>{const file=event.target.files?.[0];setFileName(file?.name??'');setPreview(null);setConfirmed(false);if(file)void action(async()=>{if(file.size>8388608)throw new Error('La copia supera el límite de 8 MB.');setPreview(readPrivateBackup(await file.text()));importId.current=crypto.randomUUID();});}}/>
                <Button type="button" variant="secondary" disabled={busy} aria-describedby="account-private-backup-help account-private-backup-name" onClick={()=>fileInput.current?.click()}>Seleccionar archivo</Button>
                <p id="account-private-backup-name" className="account-page__file-name tw:wrap-anywhere" aria-live="polite">{fileName||'Ningún archivo seleccionado'}</p>
                <p id="account-private-backup-help">Archivo JSON · máximo 8 MB. Podrás revisar los datos antes de importarlos.</p>
            </div>
            {summary && <div>
                <p>{summary.assets.length} posiciones · {summary.transactions.length} movimientos · {Object.keys(preview!).length} apartados</p>
                <p>Coste de las posiciones: {summary.assets.reduce((sum:number,asset:{quantity:number;purchasePrice:number})=>sum+asset.quantity*asset.purchasePrice,0).toLocaleString('es-ES',{style:'currency',currency:'EUR'})}</p>
                <Button variant="secondary" onClick={()=>download(preview!)}>Descargar copia antes de importar</Button>
                <label className="account-page__confirmation tw:flex tw:items-start tw:gap-3 tw:my-4"><input className="tw:shrink-0 tw:w-4 tw:h-4 tw:mt-[.2rem] tw:mx-0 tw:mb-0 tw:accent-accent" type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/>Confirmo que estos datos son míos y quiero guardarlos en mi cuenta.</label>
                <Button loading={busy} disabled={!confirmed||busy} onClick={()=>void action(async()=>{await account.importLocal(preview!,importId.current);setPreview(null);notify('Cartera guardada en tu cuenta. Ya puedes usarla en tus dispositivos. La copia local sigue intacta.');})}>Guardar cartera en mi cuenta</Button>
            </div>}
        </AccountPanel>}
        {account.user && <AccountMfa notify={notify} />}
    </section>;
}
