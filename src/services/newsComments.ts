import {getAppSupabaseClient} from './supabaseClient';

export interface NewsComment {id:string;body:string;username:string;createdAt:string;updatedAt:string;canEdit:boolean;canDelete:boolean;parentId:string|null;replyToId:string|null;replyToUsername:string|null;replyCount:number;deleted:boolean}
export interface CommentCursor {createdAt:string;id:string}
export interface NewsCommentPage {items:NewsComment[];nextCursor:CommentCursor|null}

async function request<T>(name:string,args:Record<string,unknown>,userId?:string,signal?:AbortSignal):Promise<T>{
    const client=await getAppSupabaseClient();
    const session=await client.auth.getSession();
    if(session.error||(userId&&session.data.session?.user.id!==userId))throw new Error('La sesión ha cambiado. Vuelve a iniciar sesión.');
    const query=client.rpc(name,args).abortSignal(signal??AbortSignal.timeout(15000));
    // Pin the owner token instead of letting a later account switch choose it.
    if(session.data.session)query.setHeader('Authorization',`Bearer ${session.data.session.access_token}`);
    const {data,error}=await query;
    if(error){
        if(error.code==='54000')throw new Error('Espera 20 segundos entre comentarios. El límite es de 20 comentarios por hora.');
        if(error.code==='40001')throw new Error('El comentario ha cambiado. Actualiza los comentarios antes de continuar.');
        if(error.code==='42501')throw new Error('No se pudo autorizar la acción. Comprueba tu sesión, el autenticador y que la noticia siga publicada.');
        if(error.code==='22023'||error.code==='23514')throw new Error('El comentario debe tener entre 1 y 10000 caracteres.');
        throw new Error('No se pudieron guardar o cargar los comentarios. Inténtalo de nuevo.');
    }
    if((name==='list_news_comments'||name==='list_news_comment_replies')&&(!data||!Array.isArray(data.items)))throw new Error('No se pudieron cargar los comentarios. Inténtalo de nuevo.');
    if((name==='create_news_comment'||name==='create_news_reply'||name==='edit_news_comment')&&(!data||typeof data.id!=='string'||typeof data.body!=='string'))throw new Error('No se pudo confirmar el comentario. Actualiza la conversación antes de reintentarlo.');
    return data as T;
}
export const listNewsComments=(postId:string,cursor:CommentCursor|null=null,signal?:AbortSignal)=>request<NewsCommentPage>('list_news_comments',{article_id:postId,before_at:cursor?.createdAt??null,before_id:cursor?.id??null},undefined,signal);
export const createNewsComment=(postId:string,id:string,body:string,userId:string)=>request<NewsComment>('create_news_comment',{article_id:postId,comment_id:id,comment_body:body.trim(),expected_user_id:userId},userId);
export const editNewsComment=(postId:string,comment:NewsComment,body:string,userId:string)=>request<NewsComment>('edit_news_comment',{article_id:postId,comment_id:comment.id,comment_body:body.trim(),expected_updated_at:comment.updatedAt,expected_user_id:userId},userId);
export const deleteNewsComment=(postId:string,comment:NewsComment,userId:string)=>request<boolean>('delete_news_comment',{article_id:postId,comment_id:comment.id,expected_updated_at:comment.updatedAt,expected_user_id:userId},userId);

export const listNewsReplies=(postId:string,rootId:string,cursor:CommentCursor|null=null,signal?:AbortSignal)=>request<NewsCommentPage>('list_news_comment_replies',{article_id:postId,root_id:rootId,after_at:cursor?.createdAt??null,after_id:cursor?.id??null},undefined,signal);
export const createNewsReply=(postId:string,id:string,body:string,userId:string,targetId:string)=>request<NewsComment>('create_news_reply',{article_id:postId,comment_id:id,comment_body:body.trim(),expected_user_id:userId,reply_to_id:targetId},userId);
