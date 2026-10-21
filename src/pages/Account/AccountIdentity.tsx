import {useEffect,useRef,useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {AtSign,Check,Mail,Pencil,UserRound,X} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Input} from '../../components/ui/Input';
import {AccountActions,AccountDetail,AccountHelp,AccountInset} from './AccountLayout';
import {getAppSupabaseClient} from '../../services/supabaseClient';
import {changeUsername,readAccountProfile,normalizeUsername,validUsername,usernameHint,type AccountProfile} from '../../services/accountProfile';
import type {FeedbackTone} from '../../components/ui/FeedbackToast';

export function AccountIdentity({user,notify}:{user:User;notify:(text:string,tone?:FeedbackTone)=>void}){
    const [profile,setProfile]=useState<AccountProfile|null>(null);
    const [draft,setDraft]=useState('');const [editing,setEditing]=useState(false);
    const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);
    const [error,setError]=useState('');const [reload,setReload]=useState(0);
    const generation=useRef(0);
    useEffect(()=>{
        const ticket=++generation.current;
        void getAppSupabaseClient().then(client=>readAccountProfile(client,user.id)).then(value=>{
            if(ticket!==generation.current)return;
            setProfile(value);setDraft(value.username);setEditing(false);setError('');
        }).catch(()=>{if(ticket===generation.current){setProfile(null);setError('No se pudo cargar tu perfil. Puedes seguir entrando con tu correo.');}})
            .finally(()=>{if(ticket===generation.current){setLoading(false);setSaving(false);}});
        return()=>{generation.current=ticket+1;};
    },[user.id,reload]);
    const save=async(event:React.FormEvent)=>{
        event.preventDefault();if(saving||!validUsername(draft))return;
        const ticket=generation.current;setSaving(true);setError('');
        try{
            const client=await getAppSupabaseClient();
            const result=await changeUsername(client,draft,user.id);
            if(ticket!==generation.current)return;
            setProfile(result);setDraft(result.username);setEditing(false);notify('Nombre de usuario actualizado.');
        }catch(failure){if(ticket===generation.current)setError(failure instanceof Error?failure.message:'No se pudo guardar el nombre.');}
        finally{if(ticket===generation.current)setSaving(false);}
    };
    return <div className="account-page__identity tw:grid tw:gap-5">
        <div className="account-page__identity-heading tw:flex tw:items-center tw:gap-4 tw:min-w-0">
            <div className="account-page__avatar tw:grid tw:place-items-center tw:shrink-0 tw:basis-[64px] tw:h-[64px] tw:border tw:border-[rgba(var(--accent-rgb),.25)] tw:rounded-[20px] tw:bg-[linear-gradient(135deg,rgba(var(--accent-rgb),.17),rgba(59,130,246,.12))] tw:text-accent tw:text-xl tw:font-bold tw:max-[600px]:basis-[52px] tw:max-[600px]:h-[52px] tw:max-[600px]:rounded-2xl" aria-hidden="true">{profile?.username.slice(0,2).toUpperCase()||<UserRound size={26}/>}</div>
            <div className="tw:min-w-0"><span className="account-page__step tw:text-accent tw:text-sm tw:font-semibold">Tu perfil</span><h2 className="tw:mt-1 tw:mx-0 tw:mb-0 tw:wrap-anywhere tw:text-[clamp(1.25rem,3vw,1.65rem)] tw:leading-[1.35]">{profile?`@${profile.username}`:loading?'Cargando perfil…':'Tu cuenta'}</h2></div>
        </div>
        <dl className="account-page__identity-fields tw:grid tw:grid-cols-2 tw:gap-4 tw:m-0 tw:max-[600px]:grid-cols-1">
            <AccountDetail icon={<Mail size={16} aria-hidden="true"/>} label="Correo electrónico" className="account-page__email tw:text-base tw:font-medium">{user.email}</AccountDetail>
            <AccountDetail icon={<AtSign size={16} aria-hidden="true"/>} label="Nombre de usuario">{profile?.username??'Pendiente de cargar'}{profile&&!editing&&<Button type="button" variant="ghost" size="sm" icon={<Pencil size={15}/>} aria-label="Cambiar nombre de usuario" onClick={()=>{setDraft(profile.username);setEditing(true);setError('');}}>Cambiar</Button>}</AccountDetail>
        </dl>
        {editing&&<AccountInset as="form" className="account-page__form account-page__username-form tw:grid tw:gap-4" onSubmit={event=>void save(event)}>
            <Input density="comfortable" label="Nuevo nombre de usuario" id="account-username" autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={32} value={draft} onChange={event=>setDraft(event.target.value)} required hint={`${usernameHint} Empieza por una letra o un número. No distingue mayúsculas.`}/>
            <AccountActions className="tw:m-0"><Button loading={saving} disabled={saving||!validUsername(draft)||normalizeUsername(draft)===profile?.username} icon={<Check size={16}/>}>Guardar nombre</Button><Button type="button" variant="ghost" disabled={saving} icon={<X size={16}/>} onClick={()=>{setEditing(false);setDraft(profile?.username??'');setError('');}}>Cancelar</Button></AccountActions>
        </AccountInset>}
        {error&&<p className="account-page__profile-error tw:text-negative" role="alert">{error}{!profile&&<Button variant="ghost" type="button" onClick={()=>{setLoading(true);setReload(value=>value+1);}}>Reintentar</Button>}</p>}
        <AccountHelp>Puedes entrar con tu usuario o tu correo. La recuperación de acceso se envía a tu correo.</AccountHelp>
    </div>;
}
