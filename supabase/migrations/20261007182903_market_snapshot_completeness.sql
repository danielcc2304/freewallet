begin;

-- A LEFT JOIN without a price produces NULL. bool_and ignores NULL inputs,
-- so explicitly reject each missing observation before replacing a snapshot.
create or replace function portfolio_private.capture_snapshot(run_id uuid, portfolio_id uuid) returns text
language plpgsql security definer set search_path='' set lock_timeout='500ms' set statement_timeout='5s' as $$
declare rev bigint; document jsonb; priced_assets jsonb; stamp timestamptz; highwater bigint; from_at timestamptz; to_at timestamptz;
begin
    select finished_at into stamp from portfolio_private.market_runs r where r.id=run_id and r.status in ('success','partial');
    if stamp is null or stamp<now()-interval '5 minutes' then return 'expired'; end if;
    select revision into rev from public.user_portfolios where user_id=portfolio_id for update;
    select (d.data->>'freewallet_portfolio_v1')::jsonb into document from portfolio_private.documents d where d.user_id=portfolio_id;
    if document is null then return 'empty'; end if;
    select jsonb_agg((a.asset-'quoteOrigin'-'lastReadAt') || case when a.asset->>'type'='cash' then jsonb_build_object('currentPrice',1,'previousClose',1,'currency','EUR','quotedAt',stamp,'lastCheckedAt',stamp,'quoteSource','Saldo')
        else jsonb_build_object('currentPrice',q.price_eur,'previousClose',q.previous_close_eur,'currency','EUR','quotedAt',q.quoted_at,'lastQuoteAt',q.quoted_at,'lastCheckedAt',q.checked_at,'quoteSource',q.source,
            'originalPrice',q.original_price,'originalCurrency',q.original_currency,'originalUnit',q.original_unit,'unitScale',q.unit_scale,'fxRate',q.fx_rate,'fxAt',q.fx_at,'valuationBasis','quote-date-fx') end),
        min(q.quoted_at),max(q.quoted_at)
    into priced_assets,from_at,to_at from jsonb_array_elements(document->'assets') a(asset)
    left join lateral (select * from portfolio_private.market_prices q where q.instrument=portfolio_private.instrument_key(a.asset->>'type',a.asset->>'symbol',a.asset->>'isin') order by quoted_at desc limit 1) q on true
    having count(*)>0 and bool_and(a.asset->>'type'='cash' or coalesce(
        q.run_id=capture_snapshot.run_id and q.quoted_at>=stamp-case when a.asset->>'type'='fund' then interval '7 days' when a.asset->>'type'='crypto' then interval '2 days' else interval '4 days' end,
        false));
    if priced_assets is null then return 'incomplete'; end if;
    if exists(select 1 from jsonb_array_elements(document->'transactions') t join portfolio_private.snapshot_ledger l on l.user_id=portfolio_id and l.transaction_id=t->>'id' where l.payload<>t) then raise exception 'Immutable snapshot ledger changed'; end if;
    insert into portfolio_private.snapshot_ledger(user_id,transaction_id,payload)
    select portfolio_id,t->>'id',t from jsonb_array_elements(document->'transactions') t on conflict(user_id,transaction_id) do nothing;
    select coalesce(max(entry_no),0) into highwater from portfolio_private.snapshot_ledger where user_id=portfolio_id;
    insert into portfolio_private.daily_snapshots(user_id,snapshot_date,revision,collected_at,assets,transactions,ledger_version,observation_from,observation_to,run_id)
    values(portfolio_id,(stamp at time zone 'Europe/Madrid')::date,rev,stamp,priced_assets,'[]',highwater,coalesce(from_at,stamp),coalesce(to_at,stamp),run_id)
    on conflict(user_id,snapshot_date) do update set revision=excluded.revision,collected_at=excluded.collected_at,assets=excluded.assets,transactions='[]',ledger_version=excluded.ledger_version,legacy_ledger_ids=null,
        observation_from=excluded.observation_from,observation_to=excluded.observation_to,run_id=excluded.run_id where excluded.collected_at>=daily_snapshots.collected_at;
    return 'captured';
exception when lock_not_available then return 'busy';
end $$;

commit;
