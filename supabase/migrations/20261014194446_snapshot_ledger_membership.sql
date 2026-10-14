begin;

-- A high-water mark bounds ledger entries, but cannot express removals. Store
-- exact membership while retaining immutable payloads for earlier snapshots.
do $$
declare definition text; changed text;
begin
 definition:=pg_get_functiondef('portfolio_private.capture_snapshot(uuid,uuid)'::regprocedure);
 changed:=replace(definition,
   'assets,transactions,ledger_version,observation_from',
   'assets,transactions,ledger_version,legacy_ledger_ids,observation_from');
 if changed=definition then raise exception 'Snapshot insert columns not found'; end if;
 definition:=changed;
 changed:=replace(definition,
   $old$priced_assets,'[]',highwater,coalesce(from_at,stamp)$old$,
   $new$priced_assets,'[]',highwater,(select coalesce(jsonb_agg(t->>'id'),'[]'::jsonb) from jsonb_array_elements(document->'transactions') t),coalesce(from_at,stamp)$new$);
 if changed=definition then raise exception 'Snapshot membership insert not found'; end if;
 definition:=changed;
 changed:=replace(definition,'legacy_ledger_ids=null','legacy_ledger_ids=excluded.legacy_ledger_ids');
 if changed=definition then raise exception 'Snapshot membership update not found'; end if;
 execute changed;

 -- The legacy RPC also respects exact membership, including an empty list.
 definition:=pg_get_functiondef('portfolio_private.read_market_data()'::regprocedure);
 changed:=replace(definition,
   '(l.entry_no<=s.ledger_version or s.legacy_ledger_ids ? l.transaction_id)',
   '(case when s.legacy_ledger_ids is not null then s.legacy_ledger_ids ? l.transaction_id else l.entry_no<=s.ledger_version end)');
 if changed=definition then raise exception 'Legacy snapshot membership predicate not found'; end if;
 execute changed;
end $$;

-- Repair only snapshots captured at the current revision. Earlier revisions
-- cannot safely inherit today's operations. Never change positions or trades.
update portfolio_private.daily_snapshots s
set legacy_ledger_ids=(select coalesce(jsonb_agg(t->>'id'),'[]'::jsonb)
 from jsonb_array_elements((d.data->>'freewallet_portfolio_v1')::jsonb->'transactions') t)
from public.user_portfolios p,portfolio_private.documents d
where s.user_id=p.user_id and d.user_id=p.user_id and s.revision=p.revision
 and s.legacy_ledger_ids is null and s.ledger_version is not null
 and jsonb_typeof((d.data->>'freewallet_portfolio_v1')::jsonb->'transactions')='array'
 and not exists(
  select 1 from jsonb_array_elements((d.data->>'freewallet_portfolio_v1')::jsonb->'transactions') t
  where not exists(select 1 from portfolio_private.snapshot_ledger l
   where l.user_id=s.user_id and l.entry_no<=s.ledger_version
    and l.transaction_id=t->>'id' and l.payload=t));

revoke all on function portfolio_private.capture_snapshot(uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function portfolio_private.read_market_data() from public,anon,authenticated;
grant execute on function portfolio_private.read_market_data() to authenticated;
commit;
