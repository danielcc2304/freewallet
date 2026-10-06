-- Match the Europe/Madrid accounting day used by portfolioCalendar.ts.
-- A late UTC run must not overwrite the preceding Madrid day's valuation.
begin;
create or replace function public.finish_daily_market_refresh(run_id uuid, prices jsonb, failures jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare owner_record record; document jsonb; priced_assets jsonb; stamp timestamptz:=now();
begin
    perform pg_advisory_xact_lock(640610);
    if not exists(select 1 from portfolio_private.market_runs where id=run_id and status='running' and started_at>now()-interval '5 minutes')
    then raise exception 'Expired market run'; end if;
    if jsonb_typeof(prices)<>'array' or jsonb_typeof(failures)<>'array' then raise exception 'Invalid batch'; end if;
    insert into portfolio_private.market_prices
    select p.instrument, (p.quoted_at at time zone 'UTC')::date,p.quoted_at,p.price_eur,p.previous_close_eur,p.original_price,p.original_currency,p.fx_rate,p.fx_at,p.source,p.checked_at
    from jsonb_to_recordset(prices) as p(instrument text,quoted_at timestamptz,price_eur numeric,previous_close_eur numeric,original_price numeric,original_currency text,fx_rate numeric,fx_at timestamptz,source text,checked_at timestamptz)
    where p.quoted_at<=stamp+interval '5 minutes' and p.checked_at between stamp-interval '5 minutes' and stamp+interval '5 minutes'
    on conflict(instrument,quote_date) do update set quoted_at=excluded.quoted_at,price_eur=excluded.price_eur,previous_close_eur=excluded.previous_close_eur,
        original_price=excluded.original_price,original_currency=excluded.original_currency,fx_rate=excluded.fx_rate,fx_at=excluded.fx_at,source=excluded.source,checked_at=excluded.checked_at
    where excluded.quoted_at>=market_prices.quoted_at;
    for owner_record in select user_id,revision from public.user_portfolios order by user_id for update loop
        select (d.data->>'freewallet_portfolio_v1')::jsonb into document from portfolio_private.documents d where d.user_id=owner_record.user_id;
        if document is null then continue; end if;
        select jsonb_agg(a.asset || case when a.asset->>'type'='cash' then jsonb_build_object('currentPrice',1,'previousClose',1,'currency','EUR','quotedAt',stamp,'lastCheckedAt',stamp,'quoteSource','Saldo')
            else jsonb_build_object('currentPrice',q.price_eur,'previousClose',q.previous_close_eur,'currency','EUR','quotedAt',q.quoted_at,'lastQuoteAt',q.quoted_at,'lastCheckedAt',q.checked_at,'quoteSource',q.source) end)
        into priced_assets from jsonb_array_elements(document->'assets') a(asset)
        left join lateral (select * from portfolio_private.market_prices q where q.instrument=coalesce(nullif(a.asset->>'isin',''),upper(a.asset->>'symbol')) order by quoted_at desc limit 1) q on true
        having count(*)>0 and bool_and(a.asset->>'type'='cash' or (q.checked_at>=stamp-interval '5 minutes' and q.quoted_at>=stamp-case when a.asset->>'type'='fund' then interval '7 days' when a.asset->>'type'='crypto' then interval '2 days' else interval '4 days' end));
        if priced_assets is not null then
            insert into portfolio_private.daily_snapshots values(owner_record.user_id,(stamp at time zone 'Europe/Madrid')::date,owner_record.revision,stamp,priced_assets,coalesce(document->'transactions','[]'))
            on conflict(user_id,snapshot_date) do update set revision=excluded.revision,collected_at=excluded.collected_at,assets=excluded.assets,transactions=excluded.transactions;
        end if;
    end loop;
    update portfolio_private.market_runs set finished_at=stamp,status=case when jsonb_array_length(finish_daily_market_refresh.failures)=0 then 'success' when jsonb_array_length(prices)=0 then 'failed' else 'partial' end,
        success_count=jsonb_array_length(prices),failures=finish_daily_market_refresh.failures where id=run_id;
end $$;

commit;
