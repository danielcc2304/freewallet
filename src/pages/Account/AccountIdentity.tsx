import {useEffect,useRef,useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {AtSign,Check,Mail,Pencil,UserRound,X} from 'lucide-react';
import {Button} from '../../components/ui/Button';
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
    return <div className="account-page__identity">
        <div className="account-page__identity-heading">
            <div className="account-page__avatar" aria-hidden="true">{profile?.username.slice(0,2).toUpperCase()||<UserRound size={26}/>}</div>
            <div><span className="account-page__step">Tu perfil</span><h2>{profile?`@${profile.username}`:loading?'Cargando perfil…':'Tu cuenta'}</h2></div>
        </div>
        <dl className="account-page__identity-fields">
            <div><dt><Mail size={16} aria-hidden="true"/> Correo electrónico</dt><dd className="account-page__email">{user.email}</dd></div>
            <div><dt><AtSign size={16} aria-hidden="true"/> Nombre de usuario</dt><dd>{profile?.username??'Pendiente de cargar'}{profile&&!editing&&<Button type="button" variant="ghost" size="sm" icon={<Pencil size={15}/>} aria-label="Cambiar nombre de usuario" onClick={()=>{setDraft(profile.username);setEditing(true);setError('');}}>Cambiar</Button>}</dd></div>
        </dl>
        {editing&&<form className="account-page__form account-page__username-form" onSubmit={event=>void save(event)}>
            <label htmlFor="account-username">Nuevo nombre de usuario<input id="account-username" autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={32} value={draft} onChange={event=>setDraft(event.target.value)} required aria-describedby="account-username-help"/></label>
            <small id="account-username-help" className="account-page__help">{usernameHint} Empieza por una letra o un número. No distingue mayúsculas.</small>
            <div className="account-page__actions"><Button loading={saving} disabled={saving||!validUsername(draft)||normalizeUsername(draft)===profile?.username} icon={<Check size={16}/>}>Guardar nombre</Button><Button type="button" variant="ghost" disabled={saving} icon={<X size={16}/>} onClick={()=>{setEditing(false);setDraft(profile?.username??'');setError('');}}>Cancelar</Button></div>
        </form>}
        {error&&<p className="account-page__profile-error" role="alert">{error}{!profile&&<Button variant="ghost" type="button" onClick={()=>{setLoading(true);setReload(value=>value+1);}}>Reintentar</Button>}</p>}
        <p className="account-page__help">Puedes entrar con tu usuario o tu correo. La recuperación de acceso se envía a tu correo.</p>
    </div>;
}
