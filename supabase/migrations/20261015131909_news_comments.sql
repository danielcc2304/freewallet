begin;
create schema news_private;
revoke all on schema news_private from public,anon,authenticated;
create table news_private.comments (
    id uuid primary key,
    post_id uuid not null references public.news_posts(id) on delete cascade,
    author_id uuid references auth.users(id) on delete set null,
    body text not null check(char_length(btrim(body)) between 1 and 2000 and body ~ '[^[:space:]]'),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index news_comments_post_page_idx on news_private.comments(post_id,created_at desc,id desc);
create index news_comments_author_idx on news_private.comments(author_id);
alter table news_private.comments enable row level security;
revoke all on news_private.comments from public,anon,authenticated;
create table news_private.comment_limits (
    user_id uuid primary key references auth.users(id) on delete cascade,
    last_post_at timestamptz,
    window_at timestamptz not null default now(),
    posts integer not null default 0
);
alter table news_private.comment_limits enable row level security;
revoke all on news_private.comment_limits from public,anon,authenticated;

create function news_private.can_moderate(article_id uuid) returns boolean
language plpgsql stable security definer set search_path='' as $$
begin
    if auth.uid() is null then return false; end if;
    return portfolio_private.news_access(true) or (
        exists(select 1 from public.news_posts where id=article_id and author_id=auth.uid())
        and portfolio_private.news_access(false));
end $$;
create function news_private.comment_json(entry news_private.comments) returns jsonb
language sql stable security definer set search_path='' as $$
    select jsonb_build_object('id',entry.id,'body',entry.body,
        'username',coalesce((select username from account_private.profiles where user_id=entry.author_id),'Cuenta eliminada'),
        'createdAt',entry.created_at,'updatedAt',entry.updated_at,
        'canEdit',coalesce(entry.author_id=auth.uid(),false),
        'canDelete',coalesce(entry.author_id=auth.uid(),false) or news_private.can_moderate(entry.post_id))
$$;

-- Only published articles have a public discussion. No email or author UUID is
-- returned. The explicit publication check is the public read authorization.
create function news_private.list_comments(article_id uuid,before_at timestamptz default null,before_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare entries jsonb:='[]'; entry news_private.comments; i integer:=0; more boolean:=false; cursor_data jsonb:=null;
begin
    if not exists(select 1 from public.news_posts where id=article_id and status='published') then
        return jsonb_build_object('items','[]'::jsonb,'nextCursor',null);
    end if;
    if (before_at is null)<>(before_id is null) then raise exception 'Invalid cursor' using errcode='22023'; end if;
    for entry in select * from news_private.comments where post_id=article_id
        and (before_at is null or (created_at,id)<(before_at,before_id))
        order by created_at desc,id desc limit 21 loop
        i:=i+1;
        if i=21 then more:=true;exit;end if;
        entries:=entries||jsonb_build_array(news_private.comment_json(entry));
        cursor_data:=jsonb_build_object('createdAt',entry.created_at,'id',entry.id);
    end loop;
    return jsonb_build_object('items',entries,'nextCursor',case when more then cursor_data else null end);
end $$;

create function news_private.create_comment(article_id uuid,comment_id uuid,comment_body text,expected_user_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=portfolio_private.require_user(); clean text:=btrim(comment_body); entry news_private.comments; limits news_private.comment_limits;
begin
    if owner_id is distinct from expected_user_id then raise exception 'Account changed' using errcode='42501';end if;
    if clean is null or clean !~ '[^[:space:]]' or char_length(clean) not between 1 and 2000 or comment_id is null then raise exception 'Invalid comment' using errcode='22023';end if;
    -- Share the article row lock with edits/deletions so publication cannot race.
    perform 1 from public.news_posts where id=article_id and status='published' for share;
    if not found then raise exception 'Article unavailable' using errcode='42501';end if;
    insert into news_private.comment_limits(user_id) values(owner_id) on conflict do nothing;
    select * into limits from news_private.comment_limits where user_id=owner_id for update;
    select * into entry from news_private.comments where id=comment_id;
    if found then
        if entry.author_id=owner_id and entry.post_id=article_id and entry.body=clean then return news_private.comment_json(entry);end if;
        raise exception 'Comment conflict' using errcode='40001';
    end if;
    if limits.last_post_at>now()-interval '20 seconds' or (limits.window_at>now()-interval '1 hour' and limits.posts>=20) then
        raise exception 'Comment rate limit' using errcode='54000';
    end if;
    insert into news_private.comments(id,post_id,author_id,body) values(comment_id,article_id,owner_id,clean) returning * into entry;
    update news_private.comment_limits set last_post_at=now(),
        posts=case when window_at<=now()-interval '1 hour' then 1 else posts+1 end,
        window_at=case when window_at<=now()-interval '1 hour' then now() else window_at end where user_id=owner_id;
    return news_private.comment_json(entry);
end $$;

create function news_private.edit_comment(article_id uuid,comment_id uuid,comment_body text,expected_updated_at timestamptz,expected_user_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=portfolio_private.require_user(); clean text:=btrim(comment_body); entry news_private.comments;
begin
    if owner_id is distinct from expected_user_id then raise exception 'Account changed' using errcode='42501';end if;
    if clean is null or clean !~ '[^[:space:]]' or char_length(clean) not between 1 and 2000 then raise exception 'Invalid comment' using errcode='22023';end if;
    perform 1 from public.news_posts where id=article_id and status='published' for share;
    if not found then raise exception 'Article unavailable' using errcode='42501';end if;
    select * into entry from news_private.comments where id=comment_id and post_id=article_id and author_id=owner_id for update;
    if not found then raise exception 'Comment unavailable' using errcode='42501';end if;
    if entry.updated_at is distinct from expected_updated_at then raise exception 'Comment changed' using errcode='40001';end if;
    update news_private.comments set body=clean,updated_at=clock_timestamp() where id=comment_id returning * into entry;
    return news_private.comment_json(entry);
end $$;

create function news_private.delete_comment(article_id uuid,comment_id uuid,expected_updated_at timestamptz,expected_user_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=portfolio_private.require_user(); entry news_private.comments;
begin
    if owner_id is distinct from expected_user_id then raise exception 'Account changed' using errcode='42501';end if;
    perform 1 from public.news_posts where id=article_id and status='published' for share;
    if not found then raise exception 'Article unavailable' using errcode='42501';end if;
    select * into entry from news_private.comments where id=comment_id and post_id=article_id for update;
    if not found then return false;end if;
    if entry.author_id is distinct from owner_id and not news_private.can_moderate(article_id) then raise exception 'Comment unavailable' using errcode='42501';end if;
    if entry.updated_at is distinct from expected_updated_at then raise exception 'Comment changed' using errcode='40001';end if;
    delete from news_private.comments where id=comment_id;
    return true;
end $$;

revoke all on function news_private.can_moderate(uuid),news_private.comment_json(news_private.comments),news_private.list_comments(uuid,timestamptz,uuid),news_private.create_comment(uuid,uuid,text,uuid),news_private.edit_comment(uuid,uuid,text,timestamptz,uuid),news_private.delete_comment(uuid,uuid,timestamptz,uuid) from public,anon,authenticated;
grant usage on schema news_private to anon,authenticated;
grant execute on function news_private.list_comments(uuid,timestamptz,uuid) to anon,authenticated;
grant execute on function news_private.create_comment(uuid,uuid,text,uuid),news_private.edit_comment(uuid,uuid,text,timestamptz,uuid),news_private.delete_comment(uuid,uuid,timestamptz,uuid) to authenticated;
create function public.list_news_comments(article_id uuid,before_at timestamptz default null,before_id uuid default null) returns jsonb
language sql stable security invoker set search_path='' as $$select news_private.list_comments(article_id,before_at,before_id)$$;
create function public.create_news_comment(article_id uuid,comment_id uuid,comment_body text,expected_user_id uuid) returns jsonb
language sql security invoker set search_path='' as $$select news_private.create_comment(article_id,comment_id,comment_body,expected_user_id)$$;
create function public.edit_news_comment(article_id uuid,comment_id uuid,comment_body text,expected_updated_at timestamptz,expected_user_id uuid) returns jsonb
language sql security invoker set search_path='' as $$select news_private.edit_comment(article_id,comment_id,comment_body,expected_updated_at,expected_user_id)$$;
create function public.delete_news_comment(article_id uuid,comment_id uuid,expected_updated_at timestamptz,expected_user_id uuid) returns boolean
language sql security invoker set search_path='' as $$select news_private.delete_comment(article_id,comment_id,expected_updated_at,expected_user_id)$$;
revoke all on function public.list_news_comments(uuid,timestamptz,uuid),public.create_news_comment(uuid,uuid,text,uuid),public.edit_news_comment(uuid,uuid,text,timestamptz,uuid),public.delete_news_comment(uuid,uuid,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.list_news_comments(uuid,timestamptz,uuid) to anon,authenticated;
grant execute on function public.create_news_comment(uuid,uuid,text,uuid),public.edit_news_comment(uuid,uuid,text,timestamptz,uuid),public.delete_news_comment(uuid,uuid,timestamptz,uuid) to authenticated;
commit;
