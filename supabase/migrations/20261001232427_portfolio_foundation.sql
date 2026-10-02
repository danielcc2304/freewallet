-- Phase 1 only: no existing objects, Auth settings or real portfolios are changed.
-- Client writes intentionally remain denied until the atomic command API is tested.
begin;

create schema portfolio_private;
revoke all on schema portfolio_private from public, anon, authenticated;

create table public.user_portfolios (
    user_id uuid primary key references auth.users(id) on delete cascade,
    revision bigint not null default 0 check (revision >= 0),
    schema_version integer not null default 1 check (schema_version = 1),
    accounting_currency text not null default 'EUR' check (accounting_currency = 'EUR'),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.portfolio_positions (
    user_id uuid not null references public.user_portfolios(user_id) on delete cascade,
    id text not null check (length(id) between 1 and 128),
    symbol text not null check (length(btrim(symbol)) between 1 and 128),
    name text not null check (length(btrim(name)) between 1 and 500),
    asset_type text not null check (asset_type in ('stock','etf','fund','crypto','cash')),
    isin text check (isin ~ '^[A-Z]{2}[A-Z0-9]{10}$'),
    quantity numeric(30,12) not null check (quantity >= 0 and quantity <> 'NaN'::numeric),
    purchase_price_eur numeric(30,12) not null check (purchase_price_eur >= 0 and purchase_price_eur <> 'NaN'::numeric),
    purchase_date date not null check (purchase_date between date '1900-01-01' and date '2100-12-31'),
    primary key (user_id, id)
);

create table public.portfolio_transactions (
    user_id uuid not null references public.user_portfolios(user_id) on delete cascade,
    id text not null check (length(id) between 1 and 128),
    -- No FK to current positions: sold/deleted assets must keep their ledger.
    asset_id text not null check (length(asset_id) between 1 and 128),
    asset_symbol text not null check (length(asset_symbol) between 1 and 128),
    asset_name text not null check (length(asset_name) between 1 and 500),
    asset_type text not null check (asset_type in ('stock','etf','fund','crypto','cash')),
    operation_type text not null check (operation_type in ('buy','sell','edit','delete')),
    operation_date date not null check (operation_date between date '1900-01-01' and date '2100-12-31'),
    quantity numeric(30,12) check (quantity >= 0 and quantity <> 'NaN'::numeric),
    price_eur numeric(30,12) check (price_eur >= 0 and price_eur <> 'NaN'::numeric),
    total_eur numeric(38,12) check (total_eur >= 0 and total_eur <> 'NaN'::numeric),
    original_currency text check (original_currency ~ '^[A-Z]{3}$'),
    original_price numeric(30,12) check (original_price >= 0 and original_price <> 'NaN'::numeric),
    fx_rate numeric(30,12) check (fx_rate > 0 and fx_rate <> 'NaN'::numeric),
    fx_date date check (fx_date between date '1900-01-01' and date '2100-12-31'),
    provenance text not null check (provenance in ('initial-position','trade','legacy-import')),
    notes text check (length(notes) <= 4000),
    recorded_at timestamptz not null,
    primary key (user_id, id)
);
create index portfolio_transactions_date_idx on public.portfolio_transactions(user_id, operation_date desc, id);

create table public.portfolio_valuations (
    user_id uuid not null references public.user_portfolios(user_id) on delete cascade,
    valuation_date date not null check (valuation_date between date '1900-01-01' and date '2100-12-31'),
    cadence text not null check (cadence in ('daily','monthly')),
    source text not null check (source in ('quotes-v2','market-estimate','excel-import','legacy-import')),
    value_eur numeric(38,12) not null check (value_eur >= 0 and value_eur <> 'NaN'::numeric),
    invested_eur numeric(38,12) not null check (invested_eur >= 0 and invested_eur <> 'NaN'::numeric),
    return_unavailable boolean not null default true,
    ledger_key text check (length(ledger_key) <= 512),
    primary key (user_id, valuation_date, cadence, source)
);

create table public.portfolio_preferences (
    user_id uuid primary key references public.user_portfolios(user_id) on delete cascade,
    api_enabled boolean not null default true,
    theme text not null default 'system' check (theme in ('light','dark','system')),
    dashboard_period text not null default 'YTD' check (dashboard_period in ('1D','7D','1M','3M','YTD','ALL'))
);

create table public.portfolio_targets (
    user_id uuid not null,
    position_id text not null,
    target_percent numeric(7,4) not null check (target_percent between 0 and 100 and target_percent <> 'NaN'::numeric),
    primary key (user_id, position_id),
    foreign key (user_id, position_id) references public.portfolio_positions(user_id, id) on delete cascade
);

create table public.portfolio_imports (
    user_id uuid not null references public.user_portfolios(user_id) on delete cascade,
    id uuid not null default gen_random_uuid(),
    source text not null check (source in ('local-migration','excel-import')),
    format_version integer not null check (format_version = 1),
    -- Explicitly collected workbook/history metadata, not an unrestricted localStorage dump.
    payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 4194304),
    created_at timestamptz not null default now(),
    primary key (user_id, id)
);
create index portfolio_imports_date_idx on public.portfolio_imports(user_id, created_at desc, id);

create table portfolio_private.command_receipts (
    user_id uuid not null references public.user_portfolios(user_id) on delete cascade,
    request_id uuid not null,
    request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
    result_revision bigint not null check (result_revision >= 0),
    created_at timestamptz not null default now(),
    primary key (user_id, request_id)
);
alter table portfolio_private.command_receipts enable row level security;
revoke all on portfolio_private.command_receipts from public, anon, authenticated;

-- All client mutations denied. Later migrations must expose tested atomic RPCs,
-- not grant table writes that bypass revisions, idempotency or ledger consistency.
do $$
declare table_name text;
begin
    foreach table_name in array array['user_portfolios','portfolio_positions','portfolio_transactions',
        'portfolio_valuations','portfolio_preferences','portfolio_targets','portfolio_imports']
    loop
        execute format('alter table public.%I enable row level security', table_name);
        execute format('revoke all on public.%I from public, anon, authenticated', table_name);
        execute format('grant select on public.%I to authenticated', table_name);
        execute format('create policy owner_read on public.%I for select to authenticated using
            ((select auth.uid()) = user_id and not coalesce((select auth.jwt()->>''is_anonymous''), ''false'')::boolean)', table_name);
    end loop;
end $$;

commit;
