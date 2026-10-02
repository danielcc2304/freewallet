begin;
create or replace function portfolio_private.require_user() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
    if owner_id is null or not exists (
        select 1 from auth.users u where u.id=owner_id
        and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
    ) or not exists (
        select 1 from auth.sessions s where s.user_id=owner_id and s.id::text=auth.jwt()->>'session_id'
    ) then raise exception 'Confirmed account and active session required' using errcode='42501'; end if;
    if exists (select 1 from auth.mfa_factors f where f.user_id=owner_id and f.status='verified')
        and auth.jwt()->>'aal' is distinct from 'aal2' then
        raise exception 'Second factor required' using errcode='42501'; end if;
    return owner_id;
end $$;
revoke all on function portfolio_private.require_user() from public,anon,authenticated;
commit;
