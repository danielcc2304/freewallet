begin;
-- Normalized historical observations. The compatibility document is a backup;
-- none of these tables contains CSV text or depends on a spreadsheet layout.
create table portfolio_private.historical_archives (
 user_id uuid primary key references public.user_portfolios(user_id) on delete cascade,
 metadata jsonb not null, updated_at timestamptz not null default now()
);
create table portfolio_private.historical_valuations (
 user_id uuid not null references portfolio_private.historical_archives(user_id) on delete cascade,
 observed_at timestamptz not null check(isfinite(observed_at)),
 value_eur numeric not null check(value_eur between 0 and 1e12),
 contributed_eur numeric not null check(contributed_eur between 0 and 1e12),
 cadence text not null check(cadence in ('daily','monthly')), origin text not null check(origin in ('import','agent')), return_unavailable boolean not null default false,
 primary key(user_id,observed_at)
);
create table portfolio_private.historical_cash_flows (
 user_id uuid not null references portfolio_private.historical_archives(user_id) on delete cascade,
 id text not null check(length(id) between 1 and 200), event_date date not null check(isfinite(event_date)),
 amount_eur numeric not null check(amount_eur between -1e12 and 1e12),
 date_precision text not null check(date_precision in ('day','month')), source text not null check(length(source)<=200),
 primary key(user_id,id)
);
create index historical_cash_flow_dates on portfolio_private.historical_cash_flows(user_id,event_date,id);
create table portfolio_private.historical_benchmarks (
 user_id uuid not null references portfolio_private.historical_archives(user_id) on delete cascade,
 observed_at timestamptz not null check(isfinite(observed_at)), isin text not null,
 kind text not null check(kind in ('nav','accumulated-return')), value numeric not null,
 portfolio_accum_pct numeric, source text not null default 'import',
 check(isin ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'),
 check((kind='nav' and value>0 and value<=1e12 and portfolio_accum_pct is null)
    or (kind='accumulated-return' and value between -100 and 1e9 and portfolio_accum_pct between -100 and 1e9)),
 primary key(user_id,isin,kind,observed_at)
);
create table portfolio_private.history_event_receipts (
 user_id uuid not null references public.user_portfolios(user_id) on delete cascade,
 request_id uuid not null, request_hash text not null, created_at timestamptz not null default now(),
 primary key(user_id,request_id)
);
create index history_receipts_dates on portfolio_private.history_event_receipts(user_id,created_at);
alter table portfolio_private.historical_archives enable row level security;
alter table portfolio_private.historical_valuations enable row level security;
alter table portfolio_private.historical_cash_flows enable row level security;
alter table portfolio_private.historical_benchmarks enable row level security;
alter table portfolio_private.history_event_receipts enable row level security;
revoke all on portfolio_private.historical_archives,portfolio_private.historical_valuations,
 portfolio_private.historical_cash_flows,portfolio_private.historical_benchmarks,portfolio_private.history_event_receipts from public,anon,authenticated;

create function portfolio_private.materialize_history(owner_id uuid,archive jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare item jsonb; field text; key text; day date; at_time timestamptz;
begin
 if jsonb_typeof(archive) is distinct from 'object' or archive->>'version' is distinct from '1'
 or jsonb_typeof(archive->'identity') is distinct from 'string' or length(archive->>'identity')>200
 or jsonb_typeof(archive->'label') is distinct from 'string' or length(archive->>'label')>500
 or jsonb_typeof(archive->'importedAt') is distinct from 'string'
 or jsonb_typeof(archive->'linkedAssetIds') is distinct from 'array'
 or jsonb_array_length(archive->'linkedAssetIds')>21000
 or jsonb_typeof(archive->'evolutionCount') is distinct from 'number'
 or jsonb_typeof(archive->'dailyCount') is distinct from 'number'
 or (archive->>'evolutionCount')::numeric not between 0 and 50000
 or (archive->>'dailyCount')::numeric not between 0 and 50000
 or (archive->'riskFreeAnnualPct' is distinct from 'null'::jsonb and
    (jsonb_typeof(archive->'riskFreeAnnualPct') is distinct from 'number' or (archive->>'riskFreeAnnualPct')::numeric not between -100 and 100))
 then raise exception 'Invalid history metadata' using errcode='22023'; end if;
 for key in select jsonb_object_keys(archive) loop
  if key not in ('version','identity','label','importedAt','linkedAssetIds','valuations','cashFlows','benchmarkReturns','benchmarkNavs','riskFreeAnnualPct','evolutionCount','dailyCount') then raise exception 'Unsupported history field' using errcode='22023'; end if;
 end loop;
 for item in select * from jsonb_array_elements(archive->'linkedAssetIds') loop
  if jsonb_typeof(item)<>'string' or length(item#>>'{}') not between 1 and 200 then raise exception 'Invalid history scope' using errcode='22023'; end if;
 end loop;
 foreach field in array array['valuations','cashFlows','benchmarkReturns','benchmarkNavs'] loop
  if jsonb_typeof(archive->field) is distinct from 'array' or jsonb_array_length(archive->field)>50000 then raise exception 'Invalid history collection' using errcode='22023'; end if;
 end loop;
 insert into portfolio_private.historical_archives(user_id,metadata) values(owner_id,archive-array['valuations','cashFlows','benchmarkReturns','benchmarkNavs'])
 on conflict(user_id) do update set metadata=excluded.metadata,updated_at=clock_timestamp();
 delete from portfolio_private.historical_valuations where user_id=owner_id;
 delete from portfolio_private.historical_cash_flows where user_id=owner_id;
 delete from portfolio_private.historical_benchmarks where user_id=owner_id;
 for item in select * from jsonb_array_elements(archive->'valuations') loop
  if jsonb_typeof(item) is distinct from 'object' or item->>'date' is null or item->>'date' !~ '^\d{4}-\d{2}-\d{2}(T|$)'
  or jsonb_typeof(item->'value') is distinct from 'number' or jsonb_typeof(item->'invested') is distinct from 'number'
  or item->>'cadence' is null or item->>'cadence' not in ('daily','monthly')
  or (item ? 'returnUnavailable' and jsonb_typeof(item->'returnUnavailable')<>'boolean') then raise exception 'Invalid valuation' using errcode='22023'; end if;
  at_time:=(item->>'date')::timestamptz;
  if at_time>now()+interval '5 minutes' then raise exception 'Future valuation' using errcode='22023'; end if;
  insert into portfolio_private.historical_valuations values(owner_id,at_time,(item->>'value')::numeric,(item->>'invested')::numeric,item->>'cadence',coalesce(item->>'historyOrigin','import'),coalesce((item->>'returnUnavailable')::boolean,false));
 end loop;
 for item in select * from jsonb_array_elements(archive->'cashFlows') loop
  if jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item->'id') is distinct from 'string'
  or item->>'date' is null or item->>'date' !~ '^\d{4}-\d{2}-\d{2}$'
  or jsonb_typeof(item->'amount') is distinct from 'number' or item->>'precision' is null or item->>'precision' not in ('day','month')
  or jsonb_typeof(item->'source') is distinct from 'string' then raise exception 'Invalid cash flow' using errcode='22023'; end if;
  day:=(item->>'date')::date;
  if day>(now() at time zone 'Europe/Madrid')::date or (item->>'precision'='month' and day<>(date_trunc('month',day)+interval '1 month - 1 day')::date) then raise exception 'Invalid cash-flow date or precision' using errcode='22023'; end if;
  insert into portfolio_private.historical_cash_flows values(owner_id,item->>'id',day,(item->>'amount')::numeric,item->>'precision',item->>'source');
 end loop;
 for item in select * from jsonb_array_elements(archive->'benchmarkReturns') loop
  if item->>'date' is null or item->>'date' !~ '^\d{4}-\d{2}-\d{2}(T|$)' or jsonb_typeof(item->'portfolioAccumPct') is distinct from 'number'
   or jsonb_typeof(item->'benchmarkAccumPct') is distinct from 'number' then raise exception 'Invalid benchmark return' using errcode='22023'; end if;
  at_time:=(item->>'date')::timestamptz;
  if at_time>now()+interval '5 minutes' then raise exception 'Future benchmark observation' using errcode='22023'; end if;
  insert into portfolio_private.historical_benchmarks values(owner_id,at_time,'IE00BYX5NX33','accumulated-return',(item->>'benchmarkAccumPct')::numeric,(item->>'portfolioAccumPct')::numeric,coalesce(item->>'source','import'));
 end loop;
 for item in select * from jsonb_array_elements(archive->'benchmarkNavs') loop
  if item->>'date' is null or item->>'date' !~ '^\d{4}-\d{2}-\d{2}(T|$)' or jsonb_typeof(item->'nav') is distinct from 'number'
    or item->>'currency' is distinct from 'EUR' or jsonb_typeof(item->'isin') is distinct from 'string' or jsonb_typeof(item->'source') is distinct from 'string' then raise exception 'Invalid benchmark NAV' using errcode='22023'; end if;
  at_time:=(item->>'date')::timestamptz;
  if at_time>now()+interval '5 minutes' then raise exception 'Future benchmark NAV' using errcode='22023'; end if;
  insert into portfolio_private.historical_benchmarks values(owner_id,at_time,item->>'isin','nav',(item->>'nav')::numeric,null,item->>'source');
 end loop;
exception when invalid_text_representation or datetime_field_overflow or unique_violation or check_violation then
 raise exception 'Invalid or duplicated historical observation' using errcode='22023';
end $$;
revoke all on function portfolio_private.materialize_history(uuid,jsonb) from public,anon,authenticated;

create function portfolio_private.history_document_trigger() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 -- Older clients may submit full backups without this new field. Preserve it.
 if tg_op='UPDATE' and old.data ? 'freewallet_history_archive_v1' and not new.data ? 'freewallet_history_archive_v1' then
  new.data:=new.data||jsonb_build_object('freewallet_history_archive_v1',old.data->'freewallet_history_archive_v1');
 end if;
 if new.data ? 'freewallet_history_archive_v1' and (tg_op='INSERT' or new.data->'freewallet_history_archive_v1' is distinct from old.data->'freewallet_history_archive_v1') then
  perform portfolio_private.materialize_history(new.user_id,(new.data->>'freewallet_history_archive_v1')::jsonb);
 end if;
 return new;
end $$;
revoke all on function portfolio_private.history_document_trigger() from public,anon,authenticated;
create trigger structured_history_document before insert or update of data on portfolio_private.documents
for each row execute function portfolio_private.history_document_trigger();

-- Preserve the installed MFA, revision, receipt and chronological-trade logic.
do $$declare signature text; definition text; changed text;
begin
 foreach signature in array array['portfolio_private.write_state(bigint,uuid,text,jsonb)','portfolio_private.patch_state(bigint,uuid,jsonb,text[])'] loop
  definition:=pg_get_functiondef(signature::regprocedure);
  changed:=replace(definition,'''freewallet_workbook_link''','''freewallet_workbook_link'',''freewallet_history_archive_v1''');
  if definition=changed then raise exception 'History backup allowlist not found'; end if;
  execute changed;
 end loop;
end $$;

create function portfolio_private.read_history(known_updated_at timestamptz default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=portfolio_private.require_user(); metadata jsonb; archive jsonb; updated timestamptz;
begin
 select h.metadata,h.updated_at into metadata,updated from portfolio_private.historical_archives h where h.user_id=uid;
 if metadata is null then return jsonb_build_object('revision',(select revision from public.user_portfolios where user_id=uid),'archive',null,'updatedAt',null); end if;
 if updated=known_updated_at then return jsonb_build_object('revision',(select revision from public.user_portfolios where user_id=uid),'archive',null,'updatedAt',updated); end if;
 archive:=metadata||jsonb_build_object(
 'valuations',(select coalesce(jsonb_agg(jsonb_build_object('date',to_char(observed_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'value',value_eur,'invested',contributed_eur,'cadence',cadence,'historyOrigin',origin,'returnUnavailable',return_unavailable) order by observed_at),'[]') from portfolio_private.historical_valuations where user_id=uid),
 'cashFlows',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'date',event_date,'amount',amount_eur,'precision',date_precision,'source',source) order by event_date,id),'[]') from portfolio_private.historical_cash_flows where user_id=uid),
 'benchmarkReturns',(select coalesce(jsonb_agg(jsonb_build_object('date',to_char(observed_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'portfolioAccumPct',portfolio_accum_pct,'benchmarkAccumPct',value,'source',source) order by observed_at),'[]') from portfolio_private.historical_benchmarks where user_id=uid and kind='accumulated-return'),
 'benchmarkNavs',(select coalesce(jsonb_agg(jsonb_build_object('date',to_char(observed_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'nav',value,'currency','EUR','isin',isin,'source',source) order by observed_at),'[]') from portfolio_private.historical_benchmarks where user_id=uid and kind='nav'));
 return jsonb_build_object('revision',(select revision from public.user_portfolios where user_id=uid),'archive',archive,'updatedAt',updated);
end $$;
create function public.read_portfolio_history(known_updated_at timestamptz default null) returns jsonb language sql stable security invoker set search_path='' as $$select portfolio_private.read_history(known_updated_at)$$;
revoke all on function portfolio_private.read_history(timestamptz),public.read_portfolio_history(timestamptz) from public,anon,authenticated;
grant execute on function portfolio_private.read_history(timestamptz),public.read_portfolio_history(timestamptz) to authenticated;

create function portfolio_private.upsert_history(expected_revision bigint,request_id uuid,events jsonb) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='10s' as $$
declare uid uuid:=portfolio_private.require_user(); rev bigint; archive jsonb; document jsonb; field text; combined jsonb; hash text; existing text; result jsonb;
begin
 if expected_revision is null or expected_revision<0 or request_id is null or jsonb_typeof(events) is distinct from 'object' or octet_length(events::text)>1048576 then raise exception 'Invalid history request' using errcode='22023'; end if;
 hash:=encode(sha256(convert_to(jsonb_build_array(expected_revision,events)::text,'UTF8')),'hex');
 select revision into rev from public.user_portfolios where user_id=uid for update;
 select request_hash into existing from portfolio_private.history_event_receipts r where r.user_id=uid and r.request_id=upsert_history.request_id;
 if found then
  if existing<>hash then raise exception 'Request identifier reused' using errcode='22023'; end if;
  return portfolio_private.read_history();
 end if;
 if rev is null or rev<>expected_revision then raise exception 'Portfolio changed on another device' using errcode='40001'; end if;
 select data into document from portfolio_private.documents where user_id=uid;
 archive:=(document->>'freewallet_history_archive_v1')::jsonb;
 if archive is null then
  if coalesce(document->>'freewallet_portfolio_csv_evolution_raw','')<>'' then raise exception 'Migrate imported history first' using errcode='22023'; end if;
  archive:=jsonb_build_object('version',1,'identity','native','label','Histórico de cartera','importedAt',to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'linkedAssetIds',(select coalesce(jsonb_agg(distinct id),'[]') from (select a->>'id' id from jsonb_array_elements((document->>'freewallet_portfolio_v1')::jsonb->'assets') a union select t->>'assetId' from jsonb_array_elements((document->>'freewallet_portfolio_v1')::jsonb->'transactions') t) ids),
    'valuations','[]'::jsonb,'cashFlows','[]'::jsonb,'benchmarkReturns','[]'::jsonb,'benchmarkNavs','[]'::jsonb,'riskFreeAnnualPct',null,'evolutionCount',0,'dailyCount',0);
 end if;
 for field in select jsonb_object_keys(events) loop
  if field not in ('valuations','cashFlows','benchmarkReturns','benchmarkNavs') or jsonb_typeof(events->field)<>'array' or jsonb_array_length(events->field)>1000 then raise exception 'Unsupported history events' using errcode='22023'; end if;
  -- Retries/corrections replace a dated observation; a cash flow uses its ID.
  if field='valuations' then
   events:=jsonb_set(events,array[field],(select coalesce(jsonb_agg(value||'{"historyOrigin":"agent"}'::jsonb),'[]') from jsonb_array_elements(events->field)));
  elsif field='benchmarkReturns' then
   events:=jsonb_set(events,array[field],(select coalesce(jsonb_agg(value||'{"source":"agent"}'::jsonb),'[]') from jsonb_array_elements(events->field)));
  end if;
  select coalesce(jsonb_agg(value order by event_key),'[]') into combined from (
   select distinct on(event_key) value,event_key from (
    select value,ordinality,case when field='cashFlows' then value->>'id' when field='benchmarkNavs' then (value->>'isin')||':'||(value->>'date') else value->>'date' end event_key
    from jsonb_array_elements((archive->field)||(events->field)) with ordinality
   ) items order by event_key,ordinality desc
  ) deduplicated;
  archive:=jsonb_set(archive,array[field],combined);
 end loop;
 result:=portfolio_private.patch_state(expected_revision,request_id,jsonb_build_object('freewallet_history_archive_v1',archive::text),'{}');
 insert into portfolio_private.history_event_receipts values(uid,request_id,hash,now());
 delete from portfolio_private.history_event_receipts where user_id=uid and created_at<now()-interval '90 days';
 return portfolio_private.read_history();
end $$;
create function public.upsert_portfolio_history(expected_revision bigint,request_id uuid,events jsonb) returns jsonb
language sql security invoker set search_path='' as $$select portfolio_private.upsert_history(expected_revision,request_id,events)$$;
revoke all on function portfolio_private.upsert_history(bigint,uuid,jsonb),public.upsert_portfolio_history(bigint,uuid,jsonb) from public,anon,authenticated;
grant execute on function portfolio_private.upsert_history(bigint,uuid,jsonb),public.upsert_portfolio_history(bigint,uuid,jsonb) to authenticated;
commit;
