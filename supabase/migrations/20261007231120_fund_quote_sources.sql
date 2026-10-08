begin;

alter table portfolio_private.market_prices drop constraint market_prices_source_check;
alter table portfolio_private.market_prices add constraint market_prices_source_check
    check(source in ('Finect','Yahoo Finance','VDOS/Quefondos','Cobas AM','Azvalor'));

-- A manual refresh is scoped to an authenticated owner's funds (or the
-- benchmark). Never expose an unrestricted provider proxy or the batch key.
create table portfolio_private.fund_quote_requests(
    user_id uuid not null references auth.users(id) on delete cascade,
    isin text not null, requested_at timestamptz not null, primary key(user_id,isin)
);
alter table portfolio_private.fund_quote_requests enable row level security;
revoke all on portfolio_private.fund_quote_requests from public,anon,authenticated;

create function portfolio_private.prepare_fund_quote(isin text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=portfolio_private.require_user(); fund_name text; allowed boolean; cached jsonb;
begin
    if isin is null or isin!~ '^[A-Z]{2}[A-Z0-9]{10}$' then raise exception 'Invalid fund ISIN' using errcode='22023'; end if;
    select p.name into fund_name from public.portfolio_positions p where p.user_id=owner_id and p.asset_type='fund'
        and portfolio_private.instrument_key(p.asset_type,p.symbol,p.isin)=prepare_fund_quote.isin limit 1;
    if fund_name is null then select benchmark_name into fund_name from portfolio_private.market_settings where benchmark_isin=prepare_fund_quote.isin; end if;
    if fund_name is null then raise exception 'Fund is not in this portfolio' using errcode='42501'; end if;
    select to_jsonb(p) into cached from portfolio_private.market_prices p where p.instrument=prepare_fund_quote.isin order by quoted_at desc limit 1;
    insert into portfolio_private.fund_quote_requests values(owner_id,isin,now())
        on conflict on constraint fund_quote_requests_pkey do update set requested_at=excluded.requested_at
        where fund_quote_requests.requested_at<=now()-interval '30 seconds' returning true into allowed;
    return jsonb_build_object('allowed',coalesce(allowed,false),'name',fund_name,'cached',cached);
end $$;
revoke all on function portfolio_private.prepare_fund_quote(text) from public,anon;
grant execute on function portfolio_private.prepare_fund_quote(text) to authenticated;

create function public.prepare_fund_quote(isin text) returns jsonb
language sql security invoker set search_path='' as $$select portfolio_private.prepare_fund_quote(isin)$$;
revoke all on function public.prepare_fund_quote(text) from public,anon;
grant execute on function public.prepare_fund_quote(text) to authenticated;

commit;
