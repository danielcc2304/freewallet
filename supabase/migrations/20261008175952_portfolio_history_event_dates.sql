begin;
-- Identity follows the instant, not a client's spelling of the timestamp.
-- read_portfolio_history returns UTC ISO dates, while an import may use dates
-- without milliseconds. Both must replace the same observation on correction.
create function portfolio_private.history_event_key(field text,item jsonb) returns text
language plpgsql immutable security invoker set search_path='' set timezone='UTC' as $$
declare instant timestamptz;
begin
 if field='cashFlows' then return item->>'id'; end if;
 if jsonb_typeof(item) is distinct from 'object' or item->>'date' is null
 or item->>'date' !~ '^\d{4}-\d{2}-\d{2}(T|$)' then raise exception 'Invalid history event date' using errcode='22023'; end if;
 instant:=(item->>'date')::timestamptz;
 if not isfinite(instant) then raise exception 'Invalid history event date' using errcode='22023'; end if;
 return case when field='benchmarkNavs' then (item->>'isin')||':' else '' end || extract(epoch from instant)::text;
exception when invalid_text_representation or datetime_field_overflow or invalid_datetime_format then
 raise exception 'Invalid history event date' using errcode='22023';
end $$;
revoke all on function portfolio_private.history_event_key(text,jsonb) from public,anon,authenticated;
do $upgrade$
declare definition text; changed text;
begin
 definition:=pg_get_functiondef('portfolio_private.upsert_history(bigint,uuid,jsonb)'::regprocedure);
 changed:=replace(definition,
  $old$case when field='cashFlows' then value->>'id' when field='benchmarkNavs' then (value->>'isin')||':'||(value->>'date') else value->>'date' end$old$,
  'portfolio_private.history_event_key(field,value)');
 if changed=definition then raise exception 'History event merge not found'; end if;
 execute changed;
end $upgrade$;
commit;
