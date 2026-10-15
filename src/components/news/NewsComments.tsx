import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {MessageSquare,Pencil,RefreshCw,Send,Trash2} from 'lucide-react';
import {Button,ConfirmDialog} from '../ui';
import {useNewsCommentIdentity} from '../../hooks/useNewsCommentIdentity';
import {listNewsComments,createNewsComment,editNewsComment,deleteNewsComment,type NewsComment,type CommentCursor} from '../../services/newsComments';
import './NewsComments.css';

const formatDate=(date:string)=>new Date(date).toLocaleString('es-ES',{dateStyle:'medium',timeStyle:'short'});
const message=(error:unknown)=>error instanceof Error?error.message:'No se pudo completar la acción.';

export function NewsComments({postId}:{postId:string}){
    const identity=useNewsCommentIdentity();
    const [items,setItems]=useState<NewsComment[]>([]);const [cursor,setCursor]=useState<CommentCursor|null>(null);
    const [loading,setLoading]=useState(true);const [loadingMore,setLoadingMore]=useState(false);
    const [error,setError]=useState('');const [notice,setNotice]=useState('');const [reload,setReload]=useState(0);
    const [body,setBody]=useState('');const [editing,setEditing]=useState<NewsComment|null>(null);const [editBody,setEditBody]=useState('');
    const [deleting,setDeleting]=useState<NewsComment|null>(null);const [busy,setBusy]=useState(false);
    const [viewer,setViewer]=useState<string|null>(null);
    const generation=useRef(0);const operation=useRef(false);const lastUser=useRef<string|null>(null);
    const pending=useRef<{id:string;body:string}|null>(null);
    const canWrite=!!identity.userId&&identity.confirmed&&!identity.mfaRequired&&!identity.loading;
    useEffect(()=>{
        const ticket=++generation.current;const controller=new AbortController();
        void Promise.resolve().then(async()=>{
            if(controller.signal.aborted)return;
            setLoading(true);setError('');setLoadingMore(false);setEditing(null);setDeleting(null);setBusy(false);operation.current=false;
            if(lastUser.current!==identity.userId){setBody('');pending.current=null;setNotice('');lastUser.current=identity.userId;}
            try{
                const page=await listNewsComments(postId,null,controller.signal);
                if(ticket!==generation.current)return;
                setItems(page.items);setCursor(page.nextCursor);setViewer(identity.userId);
            }catch(failure){if(ticket===generation.current&&!controller.signal.aborted)setError(message(failure));}
            finally{if(ticket===generation.current)setLoading(false);}
        });
        return()=>{generation.current=ticket+1;controller.abort();};
    },[postId,identity.userId,identity.version,reload]);
    const more=async()=>{
        if(!cursor||loadingMore)return;
        const ticket=generation.current;setLoadingMore(true);setError('');
        try{const page=await listNewsComments(postId,cursor);if(ticket!==generation.current)return;
            setItems(current=>[...current,...page.items.filter(item=>!current.some(old=>old.id===item.id))]);setCursor(page.nextCursor);
        }catch(failure){if(ticket===generation.current)setError(message(failure));}
        finally{if(ticket===generation.current)setLoadingMore(false);}
    };
    const mutate=async(task:(userId:string)=>Promise<void>)=>{
        if(!canWrite||!identity.userId||operation.current)return;
        operation.current=true;const ticket=generation.current;setBusy(true);setError('');setNotice('');
        try{await task(identity.userId);}catch(failure){if(ticket===generation.current)setError(message(failure));}
        finally{if(ticket===generation.current){operation.current=false;setBusy(false);}}
    };
    const publish=(event:React.FormEvent)=>{
        event.preventDefault();if(!body.trim()||body.length>2000)return;
        const text=body.trim();if(pending.current?.body!==text)pending.current={id:crypto.randomUUID(),body:text};
        const id=pending.current.id;const ticket=generation.current;
        void mutate(async userId=>{const item=await createNewsComment(postId,id,text,userId);if(ticket!==generation.current)return;
            setItems(current=>[item,...current.filter(old=>old.id!==item.id)]);setBody('');pending.current=null;setNotice('Comentario publicado.');
        });
    };
    const saveEdit=(event:React.FormEvent)=>{
        event.preventDefault();if(!editing||!editBody.trim()||editBody.length>2000)return;
        const selected=editing;const ticket=generation.current;
        void mutate(async userId=>{const item=await editNewsComment(postId,selected,editBody,userId);if(ticket!==generation.current)return;
            setItems(current=>current.map(old=>old.id===item.id?item:old));setEditing(null);setNotice('Comentario actualizado.');
        });
    };
    const remove=()=>{
        if(!deleting)return;const selected=deleting;const ticket=generation.current;
        void mutate(async userId=>{await deleteNewsComment(postId,selected,userId);if(ticket!==generation.current)return;
            setItems(current=>current.filter(item=>item.id!==selected.id));setDeleting(null);setNotice('Comentario eliminado.');
        });
    };
    return <section className="news-comments" aria-labelledby="news-comments-title">
        <header className="news-comments__heading"><div><MessageSquare size={22} aria-hidden="true"/><h2 id="news-comments-title">Comentarios</h2></div>
            <Button type="button" variant="ghost" size="sm" icon={<RefreshCw size={16}/>} disabled={loading||busy} onClick={()=>setReload(value=>value+1)}>Actualizar</Button>
        </header>
        {identity.loading?<p role="status" className="news-comments__hint">Comprobando sesión…</p>:canWrite?<form className="news-comments__form" onSubmit={publish}>
            <label htmlFor="news-comment-body">Comparte tu opinión</label>
            <textarea id="news-comment-body" value={body} onChange={event=>setBody(event.target.value)} maxLength={2000} rows={4} placeholder="¿Qué opinas del análisis?" required aria-describedby="news-comment-help" disabled={busy}/>
            <div className="news-comments__form-footer"><small id="news-comment-help">Tu comentario y tu usuario serán públicos. {body.length}/2000</small><Button type="submit" icon={<Send size={16}/>} loading={busy&&!editing&&!deleting} disabled={busy||!body.trim()}>Publicar comentario</Button></div>
        </form>:<div className="news-comments__login"><p>{identity.mfaRequired?'Completa la verificación en dos pasos para comentar.':identity.userId?'Confirma tu correo para participar.':'Inicia sesión para participar en la conversación.'}</p><Link to="/account">{identity.mfaRequired?'Verificar mi cuenta':'Ir a Mi cuenta'}</Link></div>}
        {error&&<p className="news-comments__error" role="alert">{error}<Button type="button" variant="ghost" size="sm" disabled={busy} onClick={()=>setReload(value=>value+1)}>Reintentar carga</Button></p>}
        {notice&&<p className="news-comments__notice" role="status">{notice}</p>}
        {loading?<p className="news-comments__hint" role="status">Cargando comentarios…</p>:<>
            {!items.length&&!error&&<p className="news-comments__empty">Aún no hay comentarios. Abre la conversación.</p>}
            <div className="news-comments__list">{items.map(item=><article className="news-comments__item" key={item.id}>
                <header><span className="news-comments__avatar" aria-hidden="true">{item.username.slice(0,2).toUpperCase()}</span><div><strong>{item.username==='Cuenta eliminada'?item.username:`@${item.username}`}</strong><time dateTime={item.createdAt}>{formatDate(item.createdAt)}{item.updatedAt!==item.createdAt?' · editado':''}</time></div>
                    {canWrite&&viewer===identity.userId&&(item.canEdit||item.canDelete)&&<div className="news-comments__actions">
                        {item.canEdit&&<Button type="button" variant="ghost" size="sm" aria-label={`Editar comentario de ${item.username}`} icon={<Pencil size={16}/>} disabled={busy} onClick={()=>{setEditing(item);setEditBody(item.body);setError('');}}>Editar</Button>}
                        {item.canDelete&&<Button type="button" variant="ghost" size="sm" aria-label={`Eliminar comentario de ${item.username}`} icon={<Trash2 size={16}/>} disabled={busy} onClick={()=>setDeleting(item)}>Eliminar</Button>}
                    </div>}
                </header>
                {editing?.id===item.id?<form className="news-comments__form" onSubmit={saveEdit}>
                    <label htmlFor={`edit-comment-${item.id}`}>Editar comentario</label><textarea id={`edit-comment-${item.id}`} value={editBody} onChange={event=>setEditBody(event.target.value)} rows={4} maxLength={2000} required disabled={busy}/>
                    <div className="news-comments__edit-actions"><Button type="submit" loading={busy} disabled={busy||!editBody.trim()}>Guardar cambios</Button><Button type="button" variant="ghost" disabled={busy} onClick={()=>setEditing(null)}>Cancelar</Button></div>
                </form>:<p className="news-comments__body">{item.body}</p>}
            </article>)}</div>
            {cursor&&<Button type="button" variant="secondary" loading={loadingMore} disabled={loadingMore||busy} onClick={()=>void more()}>Ver más comentarios</Button>}
        </>}
        <ConfirmDialog isOpen={!!deleting} onClose={()=>{if(!busy)setDeleting(null);}} onConfirm={remove} loading={busy} title="Eliminar comentario" message="El comentario se eliminará de esta noticia. Esta acción no se puede deshacer." confirmText="Eliminar comentario" variant="danger"/>
    </section>;
}
