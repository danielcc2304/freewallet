begin;
-- Administrative evidence and rollback data only. Never exposed as an API,
-- never writable/readable by a signed-in client or the routine market worker.
create table portfolio_private.support_repairs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default clock_timestamp(),
    reason text not null check(length(reason) between 1 and 1000),
    before_state jsonb not null check(jsonb_typeof(before_state)='object' and octet_length(before_state::text)<=33554432),
    after_summary jsonb not null check(jsonb_typeof(after_summary)='object' and octet_length(after_summary::text)<=1048576)
);
alter table portfolio_private.support_repairs enable row level security;
revoke all on portfolio_private.support_repairs from public,anon,authenticated,service_role;
create index support_repairs_user_date_idx on portfolio_private.support_repairs(user_id,created_at desc);
commit;
