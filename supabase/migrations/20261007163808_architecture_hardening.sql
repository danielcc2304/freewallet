begin;

-- Editorial rights use the same confirmed-account, live-session and MFA guard
-- as portfolios. Public wrappers never run with elevated privileges.
create function portfolio_private.news_access(owner_only boolean default false) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare uid uuid;
begin
    begin uid:=portfolio_private.require_user(); exception when insufficient_privilege then return false; end;
    return exists(select 1 from auth.users u where u.id=uid and lower(u.email)='daniel230401@gmail.com')
        or exists(select 1 from public.news_admins n where n.user_id=uid and n.status='active' and (not owner_only or n.role='owner'));
end $$;
create or replace function public.is_news_owner() returns boolean language sql stable security invoker set search_path='' as $$select portfolio_private.news_access(true)$$;
create or replace function public.is_news_admin() returns boolean language sql stable security invoker set search_path='' as $$select portfolio_private.news_access(false)$$;

-- Move the existing mutation helpers behind invoker wrappers without changing
-- their public names or arguments used by deployed clients.
alter function public.ensure_news_owner() set schema portfolio_private;
alter function public.has_pending_news_invitation() set schema portfolio_private;
alter function public.accept_news_editor_invitation() set schema portfolio_private;
alter function public.revoke_news_editor(uuid) set schema portfolio_private;
create or replace function portfolio_private.ensure_news_owner() returns boolean
language plpgsql security definer set search_path='' as $$
declare uid uuid:=portfolio_private.require_user(); email text;
begin
    select lower(u.email) into email from auth.users u where u.id=uid;
    if email<>'daniel230401@gmail.com' then return false; end if;
    insert into public.news_admins(user_id,email,role,status,accepted_at) values(uid,email,'owner','active',now())
    on conflict(user_id) do update set role='owner',status='active',email=excluded.email,accepted_at=coalesce(news_admins.accepted_at,excluded.accepted_at);
    return true;
end $$;
create or replace function portfolio_private.has_pending_news_invitation() returns boolean
language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=portfolio_private.require_user();
begin return exists(select 1 from public.news_admins n join auth.users u on u.id=n.user_id where n.user_id=uid and n.role='editor' and n.status='invited' and lower(n.email)=lower(u.email)); end $$;
create or replace function portfolio_private.accept_news_editor_invitation() returns boolean
language plpgsql security definer set search_path='' as $$
declare uid uuid:=portfolio_private.require_user();
begin
    update public.news_admins n set status='active',accepted_at=now() from auth.users u
    where n.user_id=uid and u.id=uid and n.role='editor' and n.status='invited' and lower(n.email)=lower(u.email);
    return found;
end $$;
create or replace function portfolio_private.revoke_news_editor(target_user_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
begin
    if not portfolio_private.news_access(true) then raise exception 'Owner session required' using errcode='42501'; end if;
    update public.news_admins set status='revoked' where user_id=target_user_id and role='editor' and status<>'revoked';
    return found;
end $$;
create function public.ensure_news_owner() returns boolean language sql security invoker set search_path='' as $$select portfolio_private.ensure_news_owner()$$;
create function public.has_pending_news_invitation() returns boolean language sql stable security invoker set search_path='' as $$select portfolio_private.has_pending_news_invitation()$$;
create function public.accept_news_editor_invitation() returns boolean language sql security invoker set search_path='' as $$select portfolio_private.accept_news_editor_invitation()$$;
create function public.revoke_news_editor(target_user_id uuid) returns boolean language sql security invoker set search_path='' as $$select portfolio_private.revoke_news_editor(target_user_id)$$;
alter function public.set_news_post_updated_at() set search_path='';
revoke all on function public.is_news_owner(), public.is_news_admin(), public.ensure_news_owner(), public.has_pending_news_invitation(), public.accept_news_editor_invitation(), public.revoke_news_editor(uuid),
    portfolio_private.news_access(boolean), portfolio_private.ensure_news_owner(), portfolio_private.has_pending_news_invitation(), portfolio_private.accept_news_editor_invitation(), portfolio_private.revoke_news_editor(uuid) from public,anon,authenticated;
grant execute on function public.is_news_owner(),public.is_news_admin(),public.ensure_news_owner(),public.has_pending_news_invitation(),public.accept_news_editor_invitation(),public.revoke_news_editor(uuid),
    portfolio_private.news_access(boolean),portfolio_private.ensure_news_owner(),portfolio_private.has_pending_news_invitation(),portfolio_private.accept_news_editor_invitation(),portfolio_private.revoke_news_editor(uuid) to authenticated;

-- Public reads remain available without an account. Writers must be the author
-- or owner; editors cannot reassign another editor's article to themselves.
drop policy "Admins can update news posts" on public.news_posts;
create policy "Admins can update news posts" on public.news_posts for update to authenticated
using ((select public.is_news_owner()) or ((select public.is_news_admin()) and author_id=(select auth.uid())))
with check ((select public.is_news_owner()) or ((select public.is_news_admin()) and author_id=(select auth.uid())));
drop policy "Admins can delete news posts" on public.news_posts;
create policy "Admins can delete news posts" on public.news_posts for delete to authenticated
using ((select public.is_news_owner()) or ((select public.is_news_admin()) and author_id=(select auth.uid())));
alter policy "Admins can create news posts" on public.news_posts with check ((select public.is_news_admin()) and author_id=(select auth.uid()));
alter policy "Admins can read every news post" on public.news_posts using ((select public.is_news_admin()));
alter policy "Users can read own news admin membership" on public.news_admins using ((select public.is_news_owner()) or (user_id=(select auth.uid()) and ((select public.is_news_admin()) or (select public.has_pending_news_invitation()))));
alter policy "Admins can upload news images" on storage.objects with check (bucket_id='news-images' and (select public.is_news_admin()));
alter policy "Admins can update news images" on storage.objects using (bucket_id='news-images' and (select public.is_news_admin()) and (owner_id=(select auth.uid())::text or (select public.is_news_owner())))
with check (bucket_id='news-images' and (select public.is_news_admin()) and (owner_id=(select auth.uid())::text or (select public.is_news_owner())));
alter policy "Admins can delete news images" on storage.objects using (bucket_id='news-images' and (select public.is_news_admin()) and (owner_id=(select auth.uid())::text or (select public.is_news_owner())));
create index if not exists news_posts_author_idx on public.news_posts(author_id);
create index if not exists news_admins_invited_by_idx on public.news_admins(invited_by);

-- The request is durable BEFORE sending email. Retrying links any Auth account
-- already created by an earlier attempt rather than sending a second email.
create table portfolio_private.news_invitation_requests (
    id uuid primary key default gen_random_uuid(), email text not null unique,
    invited_by uuid references auth.users(id) on delete set null,
    state text not null check(state in ('sending','sent','registered','failed')),
    attempted_at timestamptz not null default now(), completed_at timestamptz,
    attempts integer not null default 1, last_error text
);
alter table portfolio_private.news_invitation_requests enable row level security;
revoke all on portfolio_private.news_invitation_requests from public,anon,authenticated;
create function portfolio_private.prepare_news_invitation(target_email text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=portfolio_private.require_user(); target uuid; req portfolio_private.news_invitation_requests%rowtype; invite_email text:=lower(btrim(target_email));
begin
    if not portfolio_private.news_access(true) then raise exception 'Owner required' using errcode='42501'; end if;
    if invite_email is null or length(invite_email)>254 or invite_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or invite_email='daniel230401@gmail.com' then raise exception 'Invalid email' using errcode='22023'; end if;
    perform pg_advisory_xact_lock(hashtextextended('news-invite:'||invite_email,0));
    select id into target from auth.users u where lower(u.email)=invite_email;
    if target is not null and exists(select 1 from public.news_admins n where n.user_id=target and (n.role='owner' or n.status='active')) then
        return jsonb_build_object('deliveryRequired',false,'state','active');
    end if;
    select * into req from portfolio_private.news_invitation_requests r where r.email=invite_email for update;
    if target is not null then
        insert into public.news_admins(user_id,email,role,status,invited_by,invited_at) values(target,invite_email,'editor','invited',uid,now())
        on conflict(user_id) do update set status='invited',invited_by=excluded.invited_by,invited_at=coalesce(news_admins.invited_at,excluded.invited_at) where news_admins.role='editor';
        insert into portfolio_private.news_invitation_requests(email,invited_by,state,completed_at) values(invite_email,uid,'registered',now())
        on conflict(email) do update set state='registered',completed_at=now(),last_error=null returning * into req;
        return jsonb_build_object('id',req.id,'deliveryRequired',false,'state',req.state);
    end if;
    if req.id is not null and req.state='sending' and req.attempted_at>now()-interval '3 minutes' then
        return jsonb_build_object('id',req.id,'deliveryRequired',false,'state','sending');
    end if;
    insert into portfolio_private.news_invitation_requests(email,invited_by,state) values(invite_email,uid,'sending')
    on conflict(email) do update set state='sending',invited_by=excluded.invited_by,attempted_at=now(),completed_at=null,attempts=news_invitation_requests.attempts+1,last_error=null returning * into req;
    return jsonb_build_object('id',req.id,'deliveryRequired',true,'state','sending');
end $$;
create function public.prepare_news_invitation(target_email text) returns jsonb language sql security invoker set search_path='' as $$select portfolio_private.prepare_news_invitation(target_email)$$;
create function public.complete_news_invitation(invitation_id uuid, delivery_error boolean default false) returns boolean
language plpgsql security definer set search_path='' as $$
declare req portfolio_private.news_invitation_requests%rowtype; target uuid;
begin
    select * into req from portfolio_private.news_invitation_requests where id=invitation_id for update;
    if req.id is null then raise exception 'Invitation not found'; end if;
    select id into target from auth.users u where lower(u.email)=req.email;
    if target is not null then
        insert into public.news_admins(user_id,email,role,status,invited_by,invited_at) values(target,req.email,'editor','invited',req.invited_by,req.attempted_at)
        on conflict(user_id) do update set status='invited',invited_by=excluded.invited_by,invited_at=excluded.invited_at where news_admins.role='editor' and news_admins.status<>'active';
        update portfolio_private.news_invitation_requests set state=case when delivery_error then 'registered' else 'sent' end,completed_at=now(),last_error=null where id=invitation_id;
        return true;
    end if;
    update portfolio_private.news_invitation_requests set state='failed',completed_at=now(),last_error='Auth account not created; invitation can be retried' where id=invitation_id;
    return false;
end $$;
revoke all on function public.prepare_news_invitation(text),portfolio_private.prepare_news_invitation(text),public.complete_news_invitation(uuid,boolean) from public,anon,authenticated;
grant execute on function public.prepare_news_invitation(text),portfolio_private.prepare_news_invitation(text) to authenticated;
grant execute on function public.complete_news_invitation(uuid,boolean) to service_role;

commit;
