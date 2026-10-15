begin;
-- Same limit for top-level comments, replies and subsequent edits.
alter table news_private.comments drop constraint comments_body_check;
alter table news_private.comments add constraint comments_body_check
    check (char_length(btrim(body)) between 1 and 10000 and body ~ '[^[:space:]]');
create or replace function news_private.create_comment(article_id uuid,comment_id uuid,comment_body text,expected_user_id uuid,target_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=portfolio_private.require_user(); clean text:=btrim(comment_body); entry news_private.comments; limits news_private.comment_limits; target news_private.comments; root_id uuid;
begin
    if owner_id is distinct from expected_user_id then raise exception 'Account changed' using errcode='42501';end if;
    if clean is null or clean !~ '[^[:space:]]' or char_length(clean) not between 1 and 10000 or comment_id is null then raise exception 'Invalid comment' using errcode='22023';end if;
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
    if clean is null or clean !~ '[^[:space:]]' or char_length(clean) not between 1 and 10000 then raise exception 'Invalid comment' using errcode='22023';end if;
    perform 1 from public.news_posts where id=article_id and status='published' for share;
    if not found then raise exception 'Article unavailable' using errcode='42501';end if;
    select * into entry from news_private.comments where id=comment_id and post_id=article_id and author_id=owner_id and deleted_at is null for update;
    if not found then raise exception 'Comment unavailable' using errcode='42501';end if;
    if entry.updated_at is distinct from expected_updated_at then raise exception 'Comment changed' using errcode='40001';end if;
    update news_private.comments set body=clean,updated_at=clock_timestamp() where id=comment_id returning * into entry;
    return news_private.comment_json(entry);
end $$;

commit;
