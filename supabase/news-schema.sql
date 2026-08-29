-- FreeWallet: contenido editorial de Noticias
--
-- Ejecuta este archivo en el SQL Editor de Supabase. La primera cuenta
-- propietaria queda fijada por email en las funciones de autorización; no se
-- guarda ninguna contraseña en esta aplicación.

create extension if not exists pgcrypto;

create table if not exists public.news_admins (
    user_id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    role text not null default 'editor',
    status text not null default 'active',
    invited_by uuid references auth.users(id) on delete set null,
    invited_at timestamptz,
    accepted_at timestamptz,
    created_at timestamptz not null default now()
);

-- Compatibilidad con la primera versión de la tabla, por si ya se ejecutó.
alter table public.news_admins add column if not exists email text;
alter table public.news_admins add column if not exists role text not null default 'editor';
alter table public.news_admins add column if not exists status text not null default 'active';
alter table public.news_admins add column if not exists invited_by uuid references auth.users(id) on delete set null;
alter table public.news_admins add column if not exists invited_at timestamptz;
alter table public.news_admins add column if not exists accepted_at timestamptz;

update public.news_admins as admins
set email = lower(users.email)
from auth.users as users
where users.id = admins.user_id
  and (admins.email is null or admins.email = '');

alter table public.news_admins alter column email set not null;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'news_admins_role_check'
          and conrelid = 'public.news_admins'::regclass
    ) then
        alter table public.news_admins
            add constraint news_admins_role_check check (role in ('owner', 'editor'));
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'news_admins_status_check'
          and conrelid = 'public.news_admins'::regclass
    ) then
        alter table public.news_admins
            add constraint news_admins_status_check check (status in ('invited', 'active', 'revoked'));
    end if;
end $$;

create table if not exists public.news_posts (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    title text not null check (char_length(title) between 1 and 180),
    excerpt text not null default '' check (char_length(excerpt) <= 500),
    content text not null default '',
    cover_image_url text,
    status text not null default 'draft' check (status in ('draft', 'published')),
    published_at timestamptz,
    author_id uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Compatibilidad con instalaciones que usaban el enum news_status.
alter table public.news_posts alter column status drop default;
alter table public.news_posts alter column status type text using status::text;
alter table public.news_posts drop constraint if exists news_posts_status_check;
alter table public.news_posts
    add constraint news_posts_status_check check (status in ('draft', 'published'));
alter table public.news_posts alter column status set default 'draft';

create index if not exists news_posts_published_at_idx
    on public.news_posts (published_at desc)
    where status = 'published';

create index if not exists news_admins_email_idx
    on public.news_admins (lower(email));

create or replace function public.set_news_post_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_news_posts_updated_at on public.news_posts;
create trigger set_news_posts_updated_at
before update on public.news_posts
for each row execute function public.set_news_post_updated_at();

-- Este email es una allowlist de bootstrap, no una contraseña. La cuenta debe
-- existir en Authentication y Supabase sigue validando su contraseña y email.
create or replace function public.is_news_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select auth.uid() is not null
        and (
            lower(coalesce(auth.jwt() ->> 'email', '')) = 'daniel230401@gmail.com'
            or exists (
                select 1
                from public.news_admins
                where user_id = auth.uid()
                  and role = 'owner'
                  and status = 'active'
            )
        );
$$;

create or replace function public.is_news_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select public.is_news_owner()
        or exists (
            select 1
            from public.news_admins
            where user_id = auth.uid()
              and role = 'editor'
              and status = 'active'
        );
$$;

create or replace function public.ensure_news_owner()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
    if auth.uid() is null or current_email <> 'daniel230401@gmail.com' then
        return false;
    end if;

    insert into public.news_admins (user_id, email, role, status, accepted_at)
    values (auth.uid(), current_email, 'owner', 'active', now())
    on conflict (user_id) do update
        set email = excluded.email,
            role = 'owner',
            status = 'active',
            accepted_at = coalesce(public.news_admins.accepted_at, excluded.accepted_at);

    return true;
end;
$$;

create or replace function public.has_pending_news_invitation()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select auth.uid() is not null
        and exists (
            select 1
            from public.news_admins
            where user_id = auth.uid()
              and role = 'editor'
              and status = 'invited'
              and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        );
$$;

create or replace function public.accept_news_editor_invitation()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.news_admins
    set status = 'active',
        accepted_at = now(),
        email = lower(coalesce(auth.jwt() ->> 'email', email))
    where user_id = auth.uid()
      and role = 'editor'
      and status = 'invited'
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''));

    return found;
end;
$$;

create or replace function public.revoke_news_editor(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_news_owner() then
        return false;
    end if;

    update public.news_admins
    set status = 'revoked'
    where user_id = target_user_id
      and role = 'editor'
      and status <> 'revoked';

    return found;
end;
$$;

revoke all on function public.is_news_owner() from public;
revoke all on function public.is_news_admin() from public;
revoke all on function public.ensure_news_owner() from public;
revoke all on function public.has_pending_news_invitation() from public;
revoke all on function public.accept_news_editor_invitation() from public;
revoke all on function public.revoke_news_editor(uuid) from public;

grant execute on function public.is_news_owner() to authenticated;
grant execute on function public.is_news_admin() to anon, authenticated;
grant execute on function public.ensure_news_owner() to authenticated;
grant execute on function public.has_pending_news_invitation() to authenticated;
grant execute on function public.accept_news_editor_invitation() to authenticated;
grant execute on function public.revoke_news_editor(uuid) to authenticated;

alter table public.news_admins enable row level security;
alter table public.news_posts enable row level security;

revoke all on table public.news_admins from anon, authenticated;
grant select on public.news_admins to authenticated;
grant select on public.news_posts to anon, authenticated;
grant insert, update, delete on public.news_posts to authenticated;

drop policy if exists "Public can read published news" on public.news_posts;
create policy "Public can read published news"
on public.news_posts
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Admins can read every news post" on public.news_posts;
create policy "Admins can read every news post"
on public.news_posts
for select
to authenticated
using (public.is_news_admin());

drop policy if exists "Admins can create news posts" on public.news_posts;
create policy "Admins can create news posts"
on public.news_posts
for insert
to authenticated
with check (public.is_news_admin() and author_id = auth.uid());

drop policy if exists "Admins can update news posts" on public.news_posts;
create policy "Admins can update news posts"
on public.news_posts
for update
to authenticated
using (public.is_news_admin())
with check (public.is_news_admin());

drop policy if exists "Admins can delete news posts" on public.news_posts;
create policy "Admins can delete news posts"
on public.news_posts
for delete
to authenticated
using (public.is_news_admin());

drop policy if exists "Users can read own news admin membership" on public.news_admins;
create policy "Users can read own news admin membership"
on public.news_admins
for select
to authenticated
using (user_id = auth.uid() or public.is_news_owner());

-- Bucket opcional para futuras imágenes subidas desde el editor.
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can view news images" on storage.objects;
create policy "Public can view news images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'news-images');

drop policy if exists "Admins can upload news images" on storage.objects;
create policy "Admins can upload news images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'news-images' and public.is_news_admin());

drop policy if exists "Admins can update news images" on storage.objects;
create policy "Admins can update news images"
on storage.objects
for update
to authenticated
using (bucket_id = 'news-images' and public.is_news_admin())
with check (bucket_id = 'news-images' and public.is_news_admin());

drop policy if exists "Admins can delete news images" on storage.objects;
create policy "Admins can delete news images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'news-images' and public.is_news_admin());
