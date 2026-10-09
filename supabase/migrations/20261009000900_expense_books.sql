begin;
-- The expense book is independent of investment positions and portfolio revisions.
create schema expense_private;
revoke all on schema expense_private from public, anon;
create table expense_private.books (
    user_id uuid primary key references auth.users(id) on delete cascade,
    revision bigint not null default 0 check (revision >= 0),
    data jsonb not null check (jsonb_typeof(data)='object' and octet_length(data::text)<=2097152),
    updated_at timestamptz not null default now()
);
create table expense_private.receipts (
    user_id uuid not null references expense_private.books(user_id) on delete cascade,
    request_id uuid not null, fingerprint text not null, result_revision bigint not null,
    created_at timestamptz not null default now(), primary key (user_id, request_id)
);
create index expense_receipts_time_idx on expense_private.receipts(user_id,created_at);
alter table expense_private.books enable row level security;
alter table expense_private.receipts enable row level security;
revoke all on expense_private.books,expense_private.receipts from public,anon,authenticated;
-- Tables have no client policies or grants. Guarded functions are the only access path.
create function expense_private.validate_book(payload jsonb) returns void
language plpgsql immutable set search_path='' as $$
declare key text; lim integer; item jsonb; account jsonb; category_ids text[]; account_ids text[]; occurrences text[];
begin
 if payload is null or jsonb_typeof(payload)<>'object' or payload->'version'<>'1'::jsonb or payload->'version' is null or octet_length(payload::text)>2097152 then raise exception 'Invalid expense book' using errcode='22023';end if;
 for key,lim in select * from (values ('accounts',30),('categories',100),('entries',10000),('budgets',240),('recurring',200),('goals',100)) x loop
  if payload->key is null or jsonb_typeof(payload->key)<>'array' or jsonb_array_length(payload->key)>lim then raise exception 'Invalid expense collection' using errcode='22023';end if;
  if exists(select 1 from jsonb_array_elements(payload->key) x where jsonb_typeof(x)<>'object' or jsonb_typeof(x->case when key='budgets' then 'month' else 'id' end) is distinct from 'string' or coalesce(x->>case when key='budgets' then 'month' else 'id' end,'')='' or length(x->>case when key='budgets' then 'month' else 'id' end)>150) then raise exception 'Invalid expense identifiers' using errcode='22023';end if;
  if (select count(distinct x->>case when key='budgets' then 'month' else 'id' end) from jsonb_array_elements(payload->key) x)<>jsonb_array_length(payload->key) then raise exception 'Duplicate expense identifiers' using errcode='22023';end if;
 end loop;
 if jsonb_array_length(payload->'accounts')=0 or jsonb_array_length(payload->'categories')=0 then raise exception 'Account and category required' using errcode='22023';end if;
 select array_agg(x->>'id') into account_ids from jsonb_array_elements(payload->'accounts') x;
 select array_agg(x->>'id') into category_ids from jsonb_array_elements(payload->'categories') x;
 for item in select * from jsonb_array_elements(payload->'accounts') loop
  if coalesce(item->>'name','')='' or length(item->>'name')>80 or coalesce(item->>'type','') not in('bank','cash','credit') or jsonb_typeof(item->'archived') is distinct from 'boolean' or jsonb_typeof(item->'openingBalanceCents') is distinct from 'number' or coalesce(item->>'openingBalanceCents','')!~'^-?[0-9]+$' or abs((item->>'openingBalanceCents')::numeric)>100000000000 or coalesce(item->>'openingDate','')!~'^(20|21)[0-9]{2}-[0-9]{2}-[0-9]{2}$' then raise exception 'Invalid expense account' using errcode='22023';end if;
  perform (item->>'openingDate')::date;
 end loop;
 for item in select * from jsonb_array_elements(payload->'categories') loop
  if coalesce(item->>'name','')='' or length(item->>'name')>60 or coalesce(item->>'color','')!~'^#[0-9A-Fa-f]{6}$' or coalesce(item->>'group','') not in('needs','wants','savings') then raise exception 'Invalid expense category' using errcode='22023';end if;
 end loop;
 for item in select * from jsonb_array_elements(payload->'entries') loop
  if coalesce(item->>'kind','') not in('income','expense','transfer','refund') or jsonb_typeof(item->'amountCents') is distinct from 'number' or coalesce(item->>'amountCents','')!~'^[0-9]+$' or (item->>'amountCents')::numeric not between 1 and 100000000000 or not coalesce(item->>'accountId'=any(account_ids),false) or coalesce(item->>'description','')='' or length(item->>'description')>200 or jsonb_typeof(item->'note') is distinct from 'string' or length(item->>'note')>1000 or jsonb_typeof(item->'tags') is distinct from 'array' or jsonb_array_length(item->'tags')>8 or coalesce(item->>'date','')!~'^(20|21)[0-9]{2}-[0-9]{2}-[0-9]{2}$' then raise exception 'Invalid expense entry' using errcode='22023';end if;
  perform (item->>'date')::date;
  if item->>'kind'='transfer' then
   if not coalesce(item->>'toAccountId'=any(account_ids),false) or item->>'toAccountId'=item->>'accountId' then raise exception 'Invalid transfer' using errcode='22023';end if;
  elsif item->>'kind'<>'income' and not coalesce(item->>'categoryId'=any(category_ids),false) then raise exception 'Invalid expense category reference' using errcode='22023';end if;
  if exists(select 1 from jsonb_array_elements(payload->'accounts') a where (a->>'id'=item->>'accountId' or (item->>'kind'='transfer' and a->>'id'=item->>'toAccountId')) and (a->>'openingDate')::date>(item->>'date')::date) then raise exception 'Entry precedes opening balance' using errcode='22023';end if;
  if exists(select 1 from jsonb_array_elements(item->'tags') t where jsonb_typeof(t)<>'string' or length(t#>>'{}')>40) then raise exception 'Invalid tags' using errcode='22023';end if;
  if item ? 'recurrenceId' then
   if coalesce(item->>'recurrenceId','')='' or coalesce(item->>'scheduledDate','')!~'^(20|21)[0-9]{2}-[0-9]{2}-[0-9]{2}$' then raise exception 'Invalid recurring reference' using errcode='22023';end if;
   perform (item->>'scheduledDate')::date;
  end if;
 end loop;
 select array_agg((x->>'recurrenceId')||':'||(x->>'scheduledDate')) into occurrences from jsonb_array_elements(payload->'entries') x where x ? 'recurrenceId';
 if cardinality(occurrences)<>(select count(distinct d) from unnest(occurrences) d) then raise exception 'Duplicate recurring occurrence' using errcode='22023';end if;
 for item in select * from jsonb_array_elements(payload->'budgets') loop
  if (item->>'month'<>'default' and coalesce(item->>'month','')!~'^(20|21)[0-9]{2}-(0[1-9]|1[0-2])$') or jsonb_typeof(item->'limitCents') is distinct from 'number' or coalesce(item->>'limitCents','')!~'^[0-9]+$' or (item->>'limitCents')::numeric>100000000000 or jsonb_typeof(item->'categoryLimits') is distinct from 'array' or jsonb_array_length(item->'categoryLimits')>100 then raise exception 'Invalid budget' using errcode='22023';end if;
  if exists(select 1 from jsonb_array_elements(item->'categoryLimits') l where not coalesce(l->>'categoryId'=any(category_ids),false) or jsonb_typeof(l->'limitCents') is distinct from 'number' or coalesce(l->>'limitCents','')!~'^[0-9]+$' or (l->>'limitCents')::numeric>100000000000) then raise exception 'Invalid category budget' using errcode='22023';end if;
  if (select count(distinct l->>'categoryId') from jsonb_array_elements(item->'categoryLimits') l)<>jsonb_array_length(item->'categoryLimits') or ((select coalesce(sum((l->>'limitCents')::numeric),0) from jsonb_array_elements(item->'categoryLimits') l)>(item->>'limitCents')::numeric) then raise exception 'Category limits exceed budget or are duplicated' using errcode='22023';end if;
 end loop;
 for item in select * from jsonb_array_elements(payload->'recurring') loop
  if coalesce(item->>'title','')='' or length(item->>'title')>200 or coalesce(item->>'kind','') not in('income','expense') or jsonb_typeof(item->'amountCents') is distinct from 'number' or coalesce(item->>'amountCents','')!~'^[0-9]+$' or (item->>'amountCents')::numeric not between 1 and 100000000000 or not coalesce(item->>'accountId'=any(account_ids),false) or (item->>'kind'='expense' and not coalesce(item->>'categoryId'=any(category_ids),false)) or coalesce(item->>'frequency','') not in('weekly','monthly','yearly') or jsonb_typeof(item->'paused') is distinct from 'boolean' or jsonb_typeof(item->'skippedDates') is distinct from 'array' or jsonb_array_length(item->'skippedDates')>2000 or coalesce(item->>'startDate','')!~'^(20|21)[0-9]{2}-[0-9]{2}-[0-9]{2}$' then raise exception 'Invalid recurrence' using errcode='22023';end if;
  perform (item->>'startDate')::date;
  if item ? 'endDate' then
   if coalesce(item->>'endDate','')!~'^(20|21)[0-9]{2}-[0-9]{2}-[0-9]{2}$' or (item->>'endDate')::date<(item->>'startDate')::date then raise exception 'Invalid recurrence end' using errcode='22023';end if;
  end if;
  if exists(select 1 from jsonb_array_elements(payload->'accounts') a where a->>'id'=item->>'accountId' and (a->>'openingDate')::date>(item->>'startDate')::date) then raise exception 'Recurrence precedes opening balance' using errcode='22023';end if;
  for account in select * from jsonb_array_elements(item->'skippedDates') loop if jsonb_typeof(account)<>'string' or coalesce(account#>>'{}','')!~'^(20|21)[0-9]{2}-[0-9]{2}-[0-9]{2}$' then raise exception 'Invalid skipped date' using errcode='22023';end if;perform (account#>>'{}')::date;end loop;
 end loop;
 for item in select * from jsonb_array_elements(payload->'goals') loop
  if coalesce(item->>'name','')='' or length(item->>'name')>80 or jsonb_typeof(item->'targetCents') is distinct from 'number' or coalesce(item->>'targetCents','')!~'^[0-9]+$' or (item->>'targetCents')::numeric not between 1 and 100000000000 or jsonb_typeof(item->'savedCents') is distinct from 'number' or coalesce(item->>'savedCents','')!~'^[0-9]+$' or (item->>'savedCents')::numeric>100000000000 then raise exception 'Invalid goal' using errcode='22023';end if;
  if item ? 'deadline' then if coalesce(item->>'deadline','')!~'^(20|21)[0-9]{2}-[0-9]{2}-[0-9]{2}$' then raise exception 'Invalid goal deadline' using errcode='22023';end if;perform (item->>'deadline')::date;end if;
 end loop;
end $$;
create function expense_private.read_book() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare owner_id uuid:=portfolio_private.require_user(); result jsonb;
begin select jsonb_build_object('revision',revision,'book',data) into result from expense_private.books where user_id=owner_id;return result;end $$;
create function expense_private.save_book(expected_revision bigint,request_id uuid,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='10s' as $$
declare owner_id uuid:=portfolio_private.require_user(); current_revision bigint; digest text; receipt expense_private.receipts%rowtype; result jsonb;
begin
 if expected_revision is null or expected_revision < -1 or request_id is null then raise exception 'Invalid expense request' using errcode='22023';end if;
 perform expense_private.validate_book(payload);
 digest:=encode(sha256(convert_to(jsonb_build_array(expected_revision,payload)::text,'UTF8')),'hex');
 -- Serialize writers per account, including the first creation; no global lock.
 perform pg_advisory_xact_lock(hashtextextended(owner_id::text,771));
 select * into receipt from expense_private.receipts where user_id=owner_id and expense_private.receipts.request_id=save_book.request_id;
 if found then
  if receipt.fingerprint<>digest then raise exception 'Request identifier reused' using errcode='22023';end if;
  -- A retry never repeats the write. Return current state if another device
  -- changed the book after the acknowledged request.
  select jsonb_build_object('revision',revision,'book',data) into result from expense_private.books where user_id=owner_id;
  return result;
 end if;
 if (select count(*) from expense_private.receipts where user_id=owner_id and created_at>now()-interval '1 minute')>=60 then raise exception 'Too many expense saves' using errcode='54000';end if;
 select revision into current_revision from expense_private.books where user_id=owner_id for update;
 if coalesce(current_revision,-1)<>expected_revision then raise exception 'Expense book changed in another device' using errcode='40001';end if;
 insert into expense_private.books(user_id,revision,data) values(owner_id,0,payload)
 on conflict(user_id) do update set revision=expense_private.books.revision+1,data=excluded.data,updated_at=now()
 returning jsonb_build_object('revision',revision,'book',data) into result;
 insert into expense_private.receipts(user_id,request_id,fingerprint,result_revision) values(owner_id,request_id,digest,(result->>'revision')::bigint);
 -- Receipts bound retries to 90 days and keep storage proportional to active use.
 delete from expense_private.receipts where user_id=owner_id and created_at<now()-interval '90 days';
 return result;
end $$;
revoke all on all functions in schema expense_private from public,anon,authenticated;
grant usage on schema expense_private to authenticated;
grant execute on function expense_private.read_book(),expense_private.save_book(bigint,uuid,jsonb) to authenticated;
create function public.expense_read_book() returns jsonb language sql stable security invoker set search_path='' as $$ select expense_private.read_book() $$;
create function public.expense_save_book(expected_revision bigint,request_id uuid,payload jsonb) returns jsonb language sql security invoker set search_path='' as $$ select expense_private.save_book(expected_revision,request_id,payload) $$;
revoke all on function public.expense_read_book(),public.expense_save_book(bigint,uuid,jsonb) from public,anon;
grant execute on function public.expense_read_book(),public.expense_save_book(bigint,uuid,jsonb) to authenticated;
commit;
