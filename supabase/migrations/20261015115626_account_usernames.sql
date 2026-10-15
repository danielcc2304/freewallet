begin;
create schema account_private;
revoke all on schema account_private from public, anon, authenticated;

create table account_private.profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    username text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint valid_username check(username = lower(username) and username ~ '^[a-z0-9][a-z0-9._-]{2,31}$')
);
alter table account_private.profiles enable row level security;
revoke all on account_private.profiles from public, anon, authenticated;

-- Used only by the auth trigger and the one-time backfill. No caller-controlled
-- owner lookup or metadata is used for authorization.
create function account_private.assign_username(owner_id uuid, email_address text, requested text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare base text; candidate text; existing text; suffix text; attempt integer := 1;
begin
    select username into existing from account_private.profiles where user_id=owner_id;
    if found then return existing; end if;
    if requested is not null then
        base := lower(btrim(requested));
        if base !~ '^[a-z0-9][a-z0-9._-]{2,31}$' then
            raise exception 'invalid_username' using errcode='22023';
        end if;
    else
        base := left(regexp_replace(lower(split_part(coalesce(email_address,''),'@',1)), '[^a-z0-9._-]', '_','g'),32);
        base := regexp_replace(base,'^[^a-z0-9]+','');
        if length(base)<3 then base := 'usuario_' || left(replace(owner_id::text,'-',''),12); end if;
    end if;
    candidate := base;
    loop
        begin
            insert into account_private.profiles(user_id,username) values(owner_id,candidate);
            return candidate;
        exception when unique_violation then
            if requested is not null then raise exception 'username_taken' using errcode='23505'; end if;
            attempt := attempt+1; suffix := '_' || attempt::text;
            candidate := left(base,32-length(suffix)) || suffix;
        end;
    end loop;
end $$;
revoke all on function account_private.assign_username(uuid,text,text) from public,anon,authenticated;

-- Old application versions and administrative invitations can still create an
-- account without metadata; they receive a generated name just like old users.
create function account_private.on_auth_user_created() returns trigger
language plpgsql security definer set search_path = '' as $$
declare assigned text;
begin
    if coalesce(new.is_anonymous,false) then return new; end if;
    assigned := account_private.assign_username(new.id,new.email,nullif(new.raw_user_meta_data->>'username',''));
    update auth.users set raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb)||jsonb_build_object('username',assigned) where id=new.id;
    return new;
end $$;
revoke all on function account_private.on_auth_user_created() from public,anon,authenticated;
create trigger freewallet_assign_username after insert on auth.users
for each row execute function account_private.on_auth_user_created();

do $$ declare u record; assigned text; begin
    for u in select id,email from auth.users where not coalesce(is_anonymous,false) order by created_at,id loop
        assigned := account_private.assign_username(u.id,u.email);
        update auth.users set raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb)||jsonb_build_object('username',assigned) where id=u.id;
    end loop;
end $$;

create function account_private.read_profile() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); profile jsonb;
begin
    -- Reading one's own name is allowed before completing MFA. Changes below
    -- use the existing stricter account/MFA guard.
    if owner_id is null or not exists(select 1 from auth.users u where u.id=owner_id and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false))
      or not exists(select 1 from auth.sessions s where s.user_id=owner_id and s.id::text=auth.jwt()->>'session_id') then
        raise exception 'Active confirmed session required' using errcode='42501';
    end if;
    select jsonb_build_object('userId',user_id,'username',username,'createdAt',created_at) into profile from account_private.profiles where user_id=owner_id;
    return profile;
end $$;
create function account_private.change_username(new_username text,expected_user_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := portfolio_private.require_user(); chosen text := lower(btrim(new_username));
begin
    if owner_id is distinct from expected_user_id then raise exception 'Account changed' using errcode='42501'; end if;
    if chosen is null or chosen !~ '^[a-z0-9][a-z0-9._-]{2,31}$' then raise exception 'invalid_username' using errcode='22023'; end if;
    update account_private.profiles set username=chosen,updated_at=now() where user_id=owner_id;
    if not found then raise exception 'Profile not found' using errcode='42501'; end if;
    update auth.users set raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb)||jsonb_build_object('username',chosen) where id=owner_id;
    return account_private.read_profile();
exception when unique_violation then raise exception 'username_taken' using errcode='23505';
end $$;
revoke all on function account_private.read_profile(),account_private.change_username(text,uuid) from public,anon,authenticated;
grant usage on schema account_private to authenticated,service_role;
grant execute on function account_private.read_profile(),account_private.change_username(text,uuid) to authenticated;
create function public.my_account_profile() returns jsonb language sql stable security invoker set search_path='' as $$select account_private.read_profile()$$;
create function public.change_my_username(new_username text,expected_user_id uuid) returns jsonb language sql security invoker set search_path='' as $$select account_private.change_username(new_username,expected_user_id)$$;
revoke all on function public.my_account_profile(),public.change_my_username(text,uuid) from public,anon,authenticated;
grant execute on function public.my_account_profile(),public.change_my_username(text,uuid) to authenticated;

create table account_private.login_buckets (
    bucket_key text primary key,
    expires_at timestamptz not null,
    attempts integer not null
);
create index account_login_buckets_expiry on account_private.login_buckets(expires_at);
alter table account_private.login_buckets enable row level security;
revoke all on account_private.login_buckets from public,anon,authenticated;

-- Only the password-verifying Edge Function can call this. It never returns
-- the email to the browser, even for an existing username with a wrong password.
create function account_private.prepare_username_login(login_username text, client_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare chosen text:=lower(btrim(login_username)); key text; max_attempts integer; total integer; limited boolean:=false; address text;
begin
    if auth.jwt()->>'role' is distinct from 'service_role' then raise exception 'Server only' using errcode='42501'; end if;
    if chosen is null or chosen !~ '^[a-z0-9][a-z0-9._-]{2,31}$' or client_hash !~ '^[a-f0-9]{64}$' or client_hash is null then
        raise exception 'Invalid login request' using errcode='22023';
    end if;
    delete from account_private.login_buckets where expires_at<now()-interval '1 day';
    -- Consistent lock order across all requests; counters are durable on denial.
    for key,max_attempts in select 'global',200 union all select 'ip:'||client_hash,30 union all select 'username:'||chosen,10 loop
        insert into account_private.login_buckets(bucket_key,expires_at,attempts) values(key,now()+interval '5 minutes',1)
        on conflict(bucket_key) do update set
            attempts=case when account_private.login_buckets.expires_at<=now() then 1 else account_private.login_buckets.attempts+1 end,
            expires_at=case when account_private.login_buckets.expires_at<=now() then now()+interval '5 minutes' else account_private.login_buckets.expires_at end
        returning attempts into total;
        if total>max_attempts then limited:=true; end if;
    end loop;
    if limited then return jsonb_build_object('allowed',false); end if;
    select u.email into address from account_private.profiles p join auth.users u on u.id=p.user_id where p.username=chosen and not coalesce(u.is_anonymous,false);
    return jsonb_build_object('allowed',true,'email',address);
end $$;
revoke all on function account_private.prepare_username_login(text,text) from public,anon,authenticated;
grant execute on function account_private.prepare_username_login(text,text) to service_role;
create function public.prepare_username_login(login_username text,client_hash text) returns jsonb
language sql security invoker set search_path='' as $$select account_private.prepare_username_login(login_username,client_hash)$$;
revoke all on function public.prepare_username_login(text,text) from public,anon,authenticated;
grant execute on function public.prepare_username_login(text,text) to service_role;
commit;
