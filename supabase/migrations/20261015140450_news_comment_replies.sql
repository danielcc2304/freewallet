begin;
alter table news_private.comments
    add column parent_id uuid references news_private.comments(id) on delete cascade,
    add column reply_to_id uuid references news_private.comments(id) on delete cascade,
    add column deleted_at timestamptz,
    add constraint news_comment_reply_shape check ((parent_id is null)=(reply_to_id is null) and parent_id is distinct from id and reply_to_id is distinct from id);
create index news_comments_root_page_idx on news_private.comments(post_id,created_at desc,id desc) where parent_id is null;
create index news_comments_reply_page_idx on news_private.comments(parent_id,created_at,id) where deleted_at is null;
create index news_comments_reply_target_idx on news_private.comments(reply_to_id);

create or replace function news_private.comment_json(entry news_private.comments) returns jsonb
language sql stable security definer set search_path='' as $$
    select jsonb_build_object('id',entry.id,'body',case when entry.deleted_at is null then entry.body else '' end,
        'username',case when entry.deleted_at is not null then 'Comentario eliminado' else coalesce((select username from account_private.profiles where user_id=entry.author_id),'Cuenta eliminada') end,
        'createdAt',entry.created_at,'updatedAt',entry.updated_at,'deleted',entry.deleted_at is not null,
        'parentId',entry.parent_id,'replyToId',entry.reply_to_id,
        'replyToUsername',(select case when c.deleted_at is not null then null else p.username end from news_private.comments c left join account_private.profiles p on p.user_id=c.author_id where c.id=entry.reply_to_id),
        'replyCount',(select count(*) from news_private.comments c where c.parent_id=entry.id and c.deleted_at is null),
        'canEdit',entry.deleted_at is null and coalesce(entry.author_id=auth.uid(),false),
        'canDelete',entry.deleted_at is null and (coalesce(entry.author_id=auth.uid(),false) or news_private.can_moderate(entry.post_id)))
$$;
create or replace function news_private.list_comments(article_id uuid,before_at timestamptz default null,before_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare entries jsonb:='[]'; entry news_private.comments; i integer:=0; more boolean:=false; cursor_data jsonb:=null;
begin
    if not exists(select 1 from public.news_posts where id=article_id and status='published') then
        return jsonb_build_object('items','[]'::jsonb,'nextCursor',null);
    end if;
    if (before_at is null)<>(before_id is null) then raise exception 'Invalid cursor' using errcode='22023'; end if;
    for entry in select * from news_private.comments where post_id=article_id and parent_id is null
        and (deleted_at is null or exists(select 1 from news_private.comments child where child.parent_id=news_private.comments.id and child.deleted_at is null))
        and (before_at is null or (created_at,id)<(before_at,before_id))
        order by created_at desc,id desc limit 21 loop
        i:=i+1;
        if i=21 then more:=true;exit;end if;
        entries:=entries||jsonb_build_array(news_private.comment_json(entry));
        cursor_data:=jsonb_build_object('createdAt',entry.created_at,'id',entry.id);
    end loop;
    return jsonb_build_object('items',entries,'nextCursor',case when more then cursor_data else null end);
end $$;


create function news_private.list_replies(article_id uuid,root_id uuid,after_at timestamptz default null,after_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare entries jsonb:='[]'; entry news_private.comments; i integer:=0; more boolean:=false; cursor_data jsonb:=null;
begin
    if not exists(select 1 from public.news_posts where id=article_id and status='published') or not exists(select 1 from news_private.comments where id=root_id and post_id=article_id and parent_id is null) then
        return jsonb_build_object('items','[]'::jsonb,'nextCursor',null);
    end if;
    if (after_at is null)<>(after_id is null) then raise exception 'Invalid cursor' using errcode='22023';end if;
    for entry in select * from news_private.comments where post_id=article_id and parent_id=root_id and deleted_at is null
        and (after_at is null or (created_at,id)>(after_at,after_id)) order by created_at,id limit 21 loop
        i:=i+1;if i=21 then more:=true;exit;end if;
        entries:=entries||jsonb_build_array(news_private.comment_json(entry));
        cursor_data:=jsonb_build_object('createdAt',entry.created_at,'id',entry.id);
    end loop;
    return jsonb_build_object('items',entries,'nextCursor',case when more then cursor_data else null end);
end $$;
create function public.list_news_comment_replies(article_id uuid,root_id uuid,after_at timestamptz default null,after_id uuid default null) returns jsonb
language sql stable security invoker set search_path='' as $$select news_private.list_replies(article_id,root_id,after_at,after_id)$$;
create function news_private.create_comment(article_id uuid,comment_id uuid,comment_body text,expected_user_id uuid,target_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=portfolio_private.require_user(); clean text:=btrim(comment_body); entry news_private.comments; limits news_private.comment_limits; target news_private.comments; root_id uuid;
begin
    if owner_id is distinct from expected_user_id then raise exception 'Account changed' using errcode='42501';end if;
    if clean is null or clean !~ '[^[:space:]]' or char_length(clean) not between 1 and 2000 or comment_id is null then raise exception 'Invalid comment' using errcode='22023';end if;
    -- Share the article row lock with edits/deletions so publication cannot race.
    perform 1 from public.news_posts where id=article_id and status='published' for share;
    if not found then raise exception 'Article unavailable' using errcode='42501';end if;
    if target_id is not null then
        select * into target from news_private.comments where id=target_id and post_id=article_id and deleted_at is null for share;
        if not found then raise exception 'Reply target unavailable' using errcode='42501';end if;
        root_id:=coalesce(target.parent_id,target.id);
    end if;
    insert into news_private.comment_limits(user_id) values(owner_id) on conflict do nothing;
    select * into limits from news_private.comment_limits where user_id=owner_id for update;
    select * into entry from news_private.comments where id=comment_id;
    if found then
        if entry.author_id=owner_id and entry.post_id=article_id and entry.body=clean and entry.deleted_at is null and entry.reply_to_id is not distinct from target_id then return news_private.comment_json(entry);end if;
        raise exception 'Comment conflict' using errcode='40001';
    end if;
    if limits.last_post_at>now()-interval '20 seconds' or (limits.window_at>now()-interval '1 hour' and limits.posts>=20) then
        raise exception 'Comment rate limit' using errcode='54000';
    end if;
    insert into news_private.comments(id,post_id,author_id,body,parent_id,reply_to_id) values(comment_id,article_id,owner_id,clean,root_id,target_id) returning * into entry;
    update news_private.comment_limits set last_post_at=now(),
        posts=case when window_at<=now()-interval '1 hour' then 1 else posts+1 end,
        window_at=case when window_at<=now()-interval '1 hour' then now() else window_at end where user_id=owner_id;
    return news_private.comment_json(entry);
end $$;

create or replace function news_private.edit_comment(article_id uuid,comment_id uuid,comment_body text,expected_updated_at timestamptz,expected_user_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=portfolio_private.require_user(); clean text:=btrim(comment_body); entry news_private.comments;
begin
    if owner_id is distinct from expected_user_id then raise exception 'Account changed' using errcode='42501';end if;
    if clean is null or clean !~ '[^[:space:]]' or char_length(clean) not between 1 and 2000 then raise exception 'Invalid comment' using errcode='22023';end if;
    perform 1 from public.news_posts where id=article_id and status='published' for share;
    if not found then raise exception 'Article unavailable' using errcode='42501';end if;
    select * into entry from news_private.comments where id=comment_id and post_id=article_id and author_id=owner_id and deleted_at is null for update;
    if not found then raise exception 'Comment unavailable' using errcode='42501';end if;
    if entry.updated_at is distinct from expected_updated_at then raise exception 'Comment changed' using errcode='40001';end if;
    update news_private.comments set body=clean,updated_at=clock_timestamp() where id=comment_id returning * into entry;
    return news_private.comment_json(entry);
end $$;

create or replace function news_private.delete_comment(article_id uuid,comment_id uuid,expected_updated_at timestamptz,expected_user_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=portfolio_private.require_user(); entry news_private.comments;
begin
    if owner_id is distinct from expected_user_id then raise exception 'Account changed' using errcode='42501';end if;
    perform 1 from public.news_posts where id=article_id and status='published' for share;
    if not found then raise exception 'Article unavailable' using errcode='42501';end if;
    select * into entry from news_private.comments where id=comment_id and post_id=article_id for update;
    if not found or entry.deleted_at is not null then return false;end if;
    if entry.author_id is distinct from owner_id and not news_private.can_moderate(article_id) then raise exception 'Comment unavailable' using errcode='42501';end if;
    if entry.updated_at is distinct from expected_updated_at then raise exception 'Comment changed' using errcode='40001';end if;
    update news_private.comments set body='Comentario eliminado',deleted_at=clock_timestamp(),updated_at=clock_timestamp() where id=comment_id;
    return true;
end $$;


-- Keep the original top-level RPC compatible with already deployed clients.
create or replace function news_private.create_comment(article_id uuid,comment_id uuid,comment_body text,expected_user_id uuid) returns jsonb
language sql security invoker set search_path='' as $$select news_private.create_comment(article_id,comment_id,comment_body,expected_user_id,null)$$;
create function public.create_news_reply(article_id uuid,comment_id uuid,comment_body text,expected_user_id uuid,reply_to_id uuid) returns jsonb
language sql security invoker set search_path='' as $$select news_private.create_comment(article_id,comment_id,comment_body,expected_user_id,reply_to_id)$$;
revoke all on function news_private.create_comment(uuid,uuid,text,uuid,uuid),news_private.list_replies(uuid,uuid,timestamptz,uuid),public.list_news_comment_replies(uuid,uuid,timestamptz,uuid),public.create_news_reply(uuid,uuid,text,uuid,uuid) from public,anon,authenticated;
grant execute on function news_private.list_replies(uuid,uuid,timestamptz,uuid),public.list_news_comment_replies(uuid,uuid,timestamptz,uuid) to anon,authenticated;
grant execute on function news_private.create_comment(uuid,uuid,text,uuid,uuid),public.create_news_reply(uuid,uuid,text,uuid,uuid) to authenticated;
commit;
