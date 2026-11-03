import { commentStyles } from './commentStyles';
import { cn } from '../../utils/cn';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Link} from 'react-router-dom';
import {ChevronDown,ChevronUp,MessageSquare,Pencil,RefreshCw,Reply,Send,Trash2,X} from 'lucide-react';
import {Button,ConfirmDialog} from '../ui';
import {useNewsCommentIdentity} from '../../hooks/useNewsCommentIdentity';
import {listNewsComments,listNewsReplies,createNewsComment,createNewsReply,editNewsComment,deleteNewsComment,type NewsComment,type CommentCursor} from '../../services/newsComments';
import { inputStyles } from '../ui/Input';

const commentInput = inputStyles({ className: 'tw:min-h-[110px] tw:resize-y tw:p-[.9rem] tw:border-line-strong tw:bg-surface tw:font-[inherit] tw:leading-[1.6] tw:focus-visible:outline-solid tw:focus-visible:outline-2 tw:focus-visible:outline-accent tw:focus-visible:outline-offset-[3px]' });

const formatDate=(date:string)=>new Date(date).toLocaleString('es-ES',{dateStyle:'medium',timeStyle:'short'});
const message=(error:unknown)=>error instanceof Error?error.message:'No se pudo completar la acción.';
interface Thread {items:NewsComment[];cursor:CommentCursor|null;loading:boolean;open:boolean;error:string}

export function NewsComments({postId}:{postId:string}){
    const identity=useNewsCommentIdentity();
    const [items,setItems]=useState<NewsComment[]>([]);
    const [cursor,setCursor]=useState<CommentCursor|null>(null);
    const [threads,setThreads]=useState<Record<string,Thread>>({});
    const threadsRef=useRef(threads);threadsRef.current=threads;
    const [loading,setLoading]=useState(true);
    const [loadingMore,setLoadingMore]=useState(false);
    const [error,setError]=useState('');
    const [notice,setNotice]=useState('');
    const [reload,setReload]=useState(0);
    const [body,setBody]=useState('');
    const [editing,setEditing]=useState<NewsComment|null>(null);
    const [editBody,setEditBody]=useState('');
    const [replying,setReplying]=useState<NewsComment|null>(null);
    const [replyBody,setReplyBody]=useState('');
    const [deleting,setDeleting]=useState<NewsComment|null>(null);
    const [busy,setBusy]=useState(false);
    const [viewer,setViewer]=useState<string|null>(null);
    const generation=useRef(0);
    const operation=useRef(false);
    const lastUser=useRef<string|null>(null);
    const pending=useRef<Record<string,{id:string;body:string}>>({});
    const replyInput=useRef<HTMLTextAreaElement>(null);
    const canWrite=!!identity.userId&&identity.confirmed&&!identity.mfaRequired&&!identity.loading;

    useEffect(()=>{
        const ticket=++generation.current;const controller=new AbortController();
        void Promise.resolve().then(async()=>{
            if(controller.signal.aborted)return;
            setLoading(true);setError('');setLoadingMore(false);setThreads({});
            setEditing(null);setDeleting(null);setReplying(null);setReplyBody('');setBusy(false);operation.current=false;
            if(lastUser.current!==identity.userId){setBody('');pending.current={};setNotice('');lastUser.current=identity.userId;}
            try{
                const page=await listNewsComments(postId,null,controller.signal);
                if(ticket!==generation.current)return;
                setItems(page.items);setCursor(page.nextCursor);setViewer(identity.userId);
            }catch(failure){if(ticket===generation.current&&!controller.signal.aborted)setError(message(failure));}
            finally{if(ticket===generation.current)setLoading(false);}
        });
        return()=>{generation.current=ticket+1;controller.abort();};
    },[postId,identity.userId,identity.version,reload]);

    useEffect(()=>{if(replying)replyInput.current?.focus();},[replying]);

    const more=async()=>{
        if(!cursor||loadingMore)return;
        const ticket=generation.current;setLoadingMore(true);setError('');
        try{const page=await listNewsComments(postId,cursor);if(ticket!==generation.current)return;
            setItems(current=>[...current,...page.items.filter(item=>!current.some(old=>old.id===item.id))]);setCursor(page.nextCursor);
        }catch(failure){if(ticket===generation.current)setError(message(failure));}
        finally{if(ticket===generation.current)setLoadingMore(false);}
    };
    const loadReplies=async(rootId:string,append=false)=>{
        const current=threadsRef.current[rootId];if(current?.loading)return;
        const ticket=generation.current;
        setThreads(all=>({...all,[rootId]:{items:all[rootId]?.items??[],cursor:all[rootId]?.cursor??null,open:true,loading:true,error:''}}));
        try{
            const page=await listNewsReplies(postId,rootId,append?current?.cursor:null);
            if(ticket!==generation.current)return;
            setThreads(all=>({...all,[rootId]:{items:append?[...all[rootId].items,...page.items.filter(item=>!all[rootId].items.some(old=>old.id===item.id))]:page.items,cursor:page.nextCursor,open:true,loading:false,error:''}}));
        }catch(failure){if(ticket===generation.current)setThreads(all=>({...all,[rootId]:{...all[rootId],loading:false,error:message(failure)}}));}
    };
    const toggleReplies=(rootId:string)=>{
        const thread=threads[rootId];
        if(!thread){void loadReplies(rootId);return;}
        setThreads(all=>({...all,[rootId]:{...all[rootId],open:!all[rootId].open}}));
    };
    const mutate=async(task:(userId:string)=>Promise<void>)=>{
        if(!canWrite||!identity.userId||operation.current)return;
        operation.current=true;const ticket=generation.current;setBusy(true);setError('');setNotice('');
        try{await task(identity.userId);}catch(failure){if(ticket===generation.current)setError(message(failure));}
        finally{if(ticket===generation.current){operation.current=false;setBusy(false);}}
    };
    const publish=(event:FormEvent,isReply=false)=>{
        event.preventDefault();const value=isReply?replyBody:body;const target=isReply?replying:null;
        if(!value.trim()||value.length>10000||(isReply&&!target)|| (target&&threads[target.parentId??target.id]?.loading))return;
        const text=value.trim();const targetId=target?.id??null;
        const pendingKey=targetId??'root';
        if(pending.current[pendingKey]?.body!==text)pending.current[pendingKey]={id:crypto.randomUUID(),body:text};
        const id=pending.current[pendingKey].id;const ticket=generation.current;
        void mutate(async userId=>{
            const item=target?await createNewsReply(postId,id,text,userId,target.id):await createNewsComment(postId,id,text,userId);
            if(ticket!==generation.current)return;
            if(target){
                const rootId=target.parentId??target.id;
                setItems(current=>current.map(root=>root.id===rootId?{...root,replyCount:(root.replyCount??0)+1}:root));
                // Reload the first page so a reply cannot skip earlier, unloaded responses.
                void loadReplies(rootId);
                setReplying(null);setReplyBody('');setNotice('Respuesta publicada.');
            }else{setItems(current=>[item,...current.filter(old=>old.id!==item.id)]);setBody('');setNotice('Comentario publicado.');}
            delete pending.current[pendingKey];
        });
    };
    const saveEdit=(event:FormEvent)=>{
        event.preventDefault();if(!editing||!editBody.trim()||editBody.length>10000)return;
        const selected=editing;const ticket=generation.current;
        void mutate(async userId=>{const item=await editNewsComment(postId,selected,editBody,userId);if(ticket!==generation.current)return;
            if(item.parentId)setThreads(all=>({...all,[item.parentId!]:{...all[item.parentId!],items:all[item.parentId!].items.map(old=>old.id===item.id?item:old)}}));
            else setItems(current=>current.map(old=>old.id===item.id?item:old));
            setEditing(null);setNotice('Comentario actualizado.');
        });
    };
    const remove=()=>{
        if(!deleting)return;const selected=deleting;const ticket=generation.current;
        void mutate(async userId=>{await deleteNewsComment(postId,selected,userId);if(ticket!==generation.current)return;
            if(selected.parentId){
                const rootId=selected.parentId;
                setThreads(all=>({...all,[rootId]:{...all[rootId],items:all[rootId].items.filter(item=>item.id!==selected.id)}}));
                setItems(current=>current.map(root=>root.id===rootId?{...root,replyCount:Math.max(0,root.replyCount-1)}:root).filter(root=>!root.deleted||root.replyCount>0));
            }else setItems(current=>current.flatMap(item=>item.id!==selected.id?[item]:(item.replyCount>0?[{...item,body:'',username:'Comentario eliminado',deleted:true,canEdit:false,canDelete:false}]:[])));
            if(replying?.id===selected.id){setReplying(null);setReplyBody('');}
            setDeleting(null);setNotice('Comentario eliminado.');
        });
    };
    const startReply=(item:NewsComment)=>{setReplying(item);setReplyBody('');setEditing(null);setError('');};
    const renderComment=(item:NewsComment)=> <article className={cn(commentStyles['news-comments__item'], item.parentId && commentStyles['news-comments__item--reply'])} key={item.id}>
        <header><span className={commentStyles['news-comments__avatar']} aria-hidden="true">{item.deleted?'—':item.username.slice(0,2).toUpperCase()}</span>
            <div><strong>{item.deleted||item.username==='Cuenta eliminada'?item.username:`@${item.username}`}</strong><time dateTime={item.createdAt}>{formatDate(item.createdAt)}{!item.deleted&&item.updatedAt!==item.createdAt?' · editado':''}</time></div>
            {canWrite&&viewer===identity.userId&&!item.deleted&&<div className={commentStyles['news-comments__actions']}>
                <Button type="button" variant="ghost" size="sm" aria-label={`Responder a ${item.username}`} icon={<Reply size={16}/>} disabled={busy||threads[item.parentId??item.id]?.loading} onClick={()=>startReply(item)}>Responder</Button>
                {item.canEdit&&<Button type="button" variant="ghost" size="sm" aria-label={`Editar comentario de ${item.username}`} icon={<Pencil size={16}/>} disabled={busy} onClick={()=>{setEditing(item);setEditBody(item.body);setReplying(null);setError('');}}>Editar</Button>}
                {item.canDelete&&<Button type="button" variant="ghost" size="sm" aria-label={`Eliminar comentario de ${item.username}`} icon={<Trash2 size={16}/>} disabled={busy} onClick={()=>setDeleting(item)}>Eliminar</Button>}
            </div>}
        </header>
        {item.deleted?<p className={commentStyles['news-comments__hint']}>Este comentario se ha eliminado.</p>:editing?.id===item.id?<form className={commentStyles['news-comments__form']} onSubmit={saveEdit}>
            <label htmlFor={`edit-comment-${item.id}`}>Editar comentario</label><textarea className={commentInput} id={`edit-comment-${item.id}`} value={editBody} onChange={event=>setEditBody(event.target.value)} rows={4} maxLength={10000} required disabled={busy}/>
            <div className={commentStyles['news-comments__edit-actions']}><Button type="submit" loading={busy} disabled={busy||!editBody.trim()}>Guardar cambios</Button><Button type="button" variant="ghost" disabled={busy} onClick={()=>setEditing(null)}>Cancelar</Button></div>
        </form>:<>{item.replyToUsername&&<span className={commentStyles['news-comments__reply-target']}>En respuesta a @{item.replyToUsername}</span>}<p className={commentStyles['news-comments__body']}>{item.body}</p></>}
        {replying?.id===item.id&&<form className={cn(commentStyles['news-comments__form'], commentStyles['news-comments__reply-form'])} onSubmit={event=>publish(event,true)}>
            <div className={commentStyles['news-comments__reply-label']}><label htmlFor="news-reply-body">Responder a @{item.username}</label><Button type="button" variant="ghost" size="sm" icon={<X size={16}/>} aria-label="Cancelar respuesta" disabled={busy} onClick={()=>setReplying(null)}>Cancelar</Button></div>
            <textarea className={commentInput} ref={replyInput} id="news-reply-body" value={replyBody} onChange={event=>setReplyBody(event.target.value)} maxLength={10000} rows={3} required disabled={busy}/>
            <div className={commentStyles['news-comments__form-footer']}><small>{replyBody.length}/10000</small><Button type="submit" icon={<Send size={16}/>} loading={busy} disabled={busy||!replyBody.trim()||threads[item.parentId??item.id]?.loading}>Publicar respuesta</Button></div>
        </form>}
    </article>;

    return <section className={commentStyles['news-comments']} aria-labelledby="news-comments-title">
        <header className={commentStyles['news-comments__heading']}><div><MessageSquare size={22} aria-hidden="true"/><h2 id="news-comments-title">Comentarios</h2></div>
            <Button type="button" variant="ghost" size="sm" icon={<RefreshCw size={16}/>} disabled={loading||busy} onClick={()=>setReload(value=>value+1)}>Actualizar</Button>
        </header>
        {identity.loading?<p role="status" className={commentStyles['news-comments__hint']}>Comprobando sesión…</p>:canWrite?<form className={commentStyles['news-comments__form']} onSubmit={event=>publish(event)}>
            <label htmlFor="news-comment-body">Comparte tu opinión</label>
            <textarea className={commentInput} id="news-comment-body" value={body} onChange={event=>setBody(event.target.value)} maxLength={10000} rows={4} placeholder="¿Qué opinas del análisis?" required aria-describedby="news-comment-help" disabled={busy}/>
            <div className={commentStyles['news-comments__form-footer']}><small id="news-comment-help">Tu comentario y tu usuario serán públicos. {body.length}/10000</small><Button type="submit" icon={<Send size={16}/>} loading={busy&&!editing&&!deleting&&!replying} disabled={busy||!body.trim()}>Publicar comentario</Button></div>
        </form>:<div className={commentStyles['news-comments__login']}><p>{identity.mfaRequired?'Completa la verificación en dos pasos para comentar.':identity.userId?'Confirma tu correo para participar.':'Inicia sesión para participar en la conversación.'}</p><Link to="/account">{identity.mfaRequired?'Verificar mi cuenta':'Ir a Mi cuenta'}</Link></div>}
        {error&&<p className={commentStyles['news-comments__error']} role="alert">{error}<Button type="button" variant="ghost" size="sm" disabled={busy} onClick={()=>setReload(value=>value+1)}>Reintentar carga</Button></p>}
        {notice&&<p className={commentStyles['news-comments__notice']} role="status">{notice}</p>}
        {loading?<p className={commentStyles['news-comments__hint']} role="status">Cargando comentarios…</p>:<>
            {!items.length&&!error&&<p className={commentStyles['news-comments__empty']}>Aún no hay comentarios. Abre la conversación.</p>}
            <div className={commentStyles['news-comments__list']}>{items.map(item=><div className={commentStyles['news-comments__thread']} key={item.id}>
                {renderComment(item)}
                {(item.replyCount>0||threads[item.id])&&<Button type="button" variant="ghost" size="sm" icon={threads[item.id]?.open?<ChevronUp size={16}/>:<ChevronDown size={16}/>} aria-expanded={threads[item.id]?.open??false} aria-controls={`replies-${item.id}`} disabled={busy} onClick={()=>toggleReplies(item.id)}>{threads[item.id]?.open?'Ocultar respuestas':`Ver respuestas (${item.replyCount??0})`}</Button>}
                {threads[item.id]?.open&&<div className={commentStyles['news-comments__replies']} id={`replies-${item.id}`}>
                    {threads[item.id].items.map(renderComment)}
                    {threads[item.id].loading&&<p role="status" className={commentStyles['news-comments__hint']}>Cargando respuestas…</p>}
                    {threads[item.id].error&&<div role="alert" className={commentStyles['news-comments__error']}>{threads[item.id].error}<Button type="button" variant="ghost" size="sm" onClick={()=>void loadReplies(item.id)}>Reintentar respuestas</Button></div>}
                    {threads[item.id].cursor&&<Button type="button" variant="ghost" size="sm" disabled={busy||threads[item.id].loading} onClick={()=>void loadReplies(item.id,true)}>Ver más respuestas</Button>}
                </div>}
            </div>)}</div>
            {cursor&&<Button type="button" variant="secondary" loading={loadingMore} disabled={loadingMore||busy} onClick={()=>void more()}>Ver más comentarios</Button>}
        </>}
        <ConfirmDialog isOpen={!!deleting} onClose={()=>{if(!busy)setDeleting(null);}} onConfirm={remove} loading={busy} title="Eliminar comentario" message="Se eliminará el texto del comentario. Las respuestas de otras personas se conservarán." confirmText="Eliminar comentario" variant="danger"/>
    </section>;
}
