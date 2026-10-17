begin;

-- Verified venue metadata only. No user holdings or mutable client URLs.
create table portfolio_private.stock_quote_listings (
    security_isin text not null check(security_isin ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'),
    market_id text not null,
    instrument text not null unique check(instrument ~ '^[A-Z0-9.-]+:[A-Z]+$'),
    google_listing text not null check(google_listing=instrument),
    currency text not null check(currency ~ '^[A-Z]{3}$'),
    original_symbols text[] not null,
    is_default boolean not null default false,
    primary key(security_isin,market_id)
);
alter table portfolio_private.stock_quote_listings enable row level security;
revoke all on portfolio_private.stock_quote_listings from public,anon,authenticated,service_role;
create unique index stock_quote_default_security on portfolio_private.stock_quote_listings(security_isin) where is_default;
insert into portfolio_private.stock_quote_listings values
('ES0126962069','BME','NXT:BME','NXT:BME','EUR',array['NXTE.XD','NXTE.XC','B02.F','B02.HM','B02.MU','B02.HA','0R6G.L','NXT.MC'],true);

-- Same ISIN/verified-symbol and explicit/default preference rules as the client.
create function portfolio_private.valuation_instrument(kind text,symbol text,isin text,asset_id text,settings jsonb)
returns text language sql stable security definer set search_path='' as $$
    select coalesce((select l.instrument from portfolio_private.stock_quote_listings l
        where kind='stock' and (
            nullif(upper(btrim(isin)),'')=l.security_isin or
            nullif(btrim(isin),'') is null and upper(btrim(symbol))=any(l.original_symbols))
        and (settings->'stockQuoteMarkets'->>asset_id=l.market_id or
            l.is_default and coalesce(settings->'stockQuoteMarkets'->>asset_id,'')<>'original'
            and not exists(select 1 from portfolio_private.stock_quote_listings sibling where sibling.security_isin=l.security_isin and sibling.market_id=settings->'stockQuoteMarkets'->>asset_id))
        order by l.market_id limit 1),portfolio_private.instrument_key(kind,symbol,isin))
$$;
revoke all on function portfolio_private.valuation_instrument(text,text,text,text,jsonb) from public,anon,authenticated,service_role;

alter table portfolio_private.market_prices drop constraint market_prices_source_check;
alter table portfolio_private.market_prices add constraint market_prices_source_check
    check(source in ('Finect','Yahoo Finance','VDOS/Quefondos','Cobas AM','Azvalor','Financial Times','Google Finance'));

-- Preserve the live function's lease, auth, cadence and ledger protections.
-- Fail closed if an earlier migration has not installed the expected contract.
do $migration$
declare definition text; original text;
begin
    original:=pg_get_functiondef('public.begin_daily_market_refresh(text)'::regprocedure);
    definition:=replace(original,
        'portfolio_private.instrument_key(asset_type,symbol,isin) instrument,asset_type kind,upper(btrim(symbol)) symbol,isin',
        'portfolio_private.valuation_instrument(asset_type,symbol,isin,id,coalesce((select (d.data->>''freewallet_settings'')::jsonb from portfolio_private.documents d where d.user_id=portfolio_positions.user_id),''{}''::jsonb)) instrument,asset_type kind,upper(btrim(symbol)) symbol,isin');
    if definition=original then raise exception 'Missing typed market worker contract';end if;
    definition:=replace(definition,'''isin'',typed.isin)',
        '''isin'',typed.isin,''googleListing'',(select l.google_listing from portfolio_private.stock_quote_listings l where l.instrument=typed.instrument),''quoteCurrency'',(select l.currency from portfolio_private.stock_quote_listings l where l.instrument=typed.instrument))');
    if strpos(definition,'''googleListing''')=0 then raise exception 'Missing market descriptor contract';end if;
    execute definition;

    original:=pg_get_functiondef('portfolio_private.capture_snapshot(uuid,uuid)'::regprocedure);
    definition:=replace(original,'declare ','declare quote_settings jsonb; ');
    definition:=replace(definition,
        'select (d.data->>''freewallet_portfolio_v1'')::jsonb into document',
        'select (d.data->>''freewallet_portfolio_v1'')::jsonb,coalesce((d.data->>''freewallet_settings'')::jsonb,''{}''::jsonb) into document,quote_settings');
    definition:=replace(definition,
        'portfolio_private.instrument_key(a.asset->>''type'',a.asset->>''symbol'',a.asset->>''isin'')',
        'portfolio_private.valuation_instrument(a.asset->>''type'',a.asset->>''symbol'',a.asset->>''isin'',a.asset->>''id'',quote_settings)');
    definition:=replace(definition,'''currentPrice'',q.price_eur', '''quoteInstrument'',q.instrument,''currentPrice'',q.price_eur');
    if definition=original or strpos(definition,'into document,quote_settings')=0 or strpos(definition,'valuation_instrument')=0 then raise exception 'Missing snapshot pricing contract';end if;
    execute definition;

    original:=pg_get_functiondef('portfolio_private.read_market_base()'::regprocedure);
    definition:=replace(original,'declare owner_id uuid:=portfolio_private.require_user();',
        'declare owner_id uuid:=portfolio_private.require_user(); quote_settings jsonb:=coalesce((select (d.data->>''freewallet_settings'')::jsonb from portfolio_private.documents d where d.user_id=owner_id),''{}''::jsonb);');
    definition:=replace(definition,'portfolio_private.instrument_key(asset_type,symbol,isin)',
        'portfolio_private.valuation_instrument(asset_type,symbol,isin,id,quote_settings)');
    if definition=original or strpos(definition,'quote_settings jsonb')=0 or strpos(definition,'valuation_instrument')=0 then raise exception 'Missing market read contract';end if;
    execute definition;
end $migration$;

-- Historic observations retain their actual venue; do not relabel/reprice them.
comment on table portfolio_private.stock_quote_listings is 'Verified stock venues shared with the browser registry; private worker metadata, not user-selectable URLs.';
commit;
