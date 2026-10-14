begin;

-- Revision mismatches are an expected concurrency outcome. Return them from
-- the public RPC boundary instead of raising SQLSTATE 40001, which Postgres
-- records at ERROR level for every stale client retry.
create or replace function public.commit_portfolio(expected_revision bigint, request_id uuid, mode text, data jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
    return portfolio_private.write_state(expected_revision, request_id, mode, data);
exception when sqlstate '40001' then
    return jsonb_build_object('conflict', true);
end $$;

create or replace function public.patch_portfolio(expected_revision bigint, request_id uuid, changes jsonb, removed text[] default '{}')
returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
    return portfolio_private.patch_state(expected_revision, request_id, changes, removed);
exception when sqlstate '40001' then
    return jsonb_build_object('conflict', true);
end $$;

commit;
