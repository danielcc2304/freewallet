-- FreeWallet: contenido editorial de Noticias
--
-- Ejecuta este archivo en el SQL Editor de Supabase. Después crea tu usuario
-- desde Authentication > Users y añade su UUID en news_admins.

create extension if not exists pgcrypto;

do $$
begin
    create type public.news_status as enum ('draft', 'published');
exception
    when duplicate_object then null;
end $$;

create table if not exists public.news_admins (
    user_id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

create table if not exists public.news_posts (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    title text not null check (char_length(title) between 1 and 180),
    excerpt text not null default '' check (char_length(excerpt) <= 500),
    content text not null default '',
    cover_image_url text,
    status public.news_status not null default 'draft',
    published_at timestamptz,
    author_id uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists news_posts_published_at_idx
    on public.news_posts (published_at desc)
    where status = 'published';

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

create or replace function public.is_news_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.news_admins
        where user_id = auth.uid()
    );
$$;

revoke all on function public.is_news_admin() from public;
grant execute on function public.is_news_admin() to anon, authenticated;

alter table public.news_admins enable row level security;
alter table public.news_posts enable row level security;

grant select on public.news_posts to anon, authenticated;
grant insert, update, delete on public.news_posts to authenticated;
grant select on public.news_admins to authenticated;

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
using (user_id = auth.uid());

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

