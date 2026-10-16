begin;

-- Public, non-privileged validation helper; no data access or SECURITY DEFINER.
create function public.fund_radar_metrics_valid(m jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare k text; v jsonb; n numeric; d text; dk text;
begin
    if jsonb_typeof(m)<>'object' or octet_length(m::text)>12000 then return false; end if;
    for k,v in select * from jsonb_each(m) loop
        if v='null'::jsonb then continue; end if;
        if k='currency' then if v#>>'{}' !~ '^[A-Z]{3}$' then return false; end if;
        elsif k='window' then if v#>>'{}'<>'3y' then return false; end if;
        elsif k='dates' then
            if jsonb_typeof(v)<>'object' then return false; end if;
            for dk,d in select key,value from jsonb_each_text(v) loop
                if dk not in ('ytd','y1','y3','y5','volatility','maxDrawdown','sharpe','ter','risk','nav') or d !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
                perform d::date;
            end loop;
        elsif k in ('ytd','y1','y3','y5','volatility','maxDrawdown','sharpe','ter','risk','nav') then
            if jsonb_typeof(v)<>'number' then return false; end if;
            n:=(v#>>'{}')::numeric;
            if k in ('ytd','y1','y3','y5') and not(n between -100 and 10000) then return false;
            elsif k='volatility' and not(n between 0 and 1000) then return false;
            elsif k='maxDrawdown' and not(n between -100 and 0) then return false;
            elsif k='sharpe' and not(n between -100 and 100) then return false;
            elsif k='ter' and not(n between 0 and 100) then return false;
            elsif k='risk' and (not(n between 1 and 7) or n<>trunc(n)) then return false;
            elsif k='nav' and not(n>0 and n<1e15) then return false; end if;
        else return false; end if;
    end loop;
    return true;
exception when others then return false;
end $$;

-- Keep the newest observation for each metric; a fresh HTTP request may carry
-- older NAV/statistics, especially when HTML and API caches differ.
create function public.fund_radar_merge_metrics(previous jsonb,incoming jsonb) returns jsonb
language plpgsql immutable security invoker set search_path='' as $$
declare merged jsonb:=previous; dates jsonb:=coalesce(previous->'dates','{}'); k text; v jsonb; old_date text; new_date text;
begin
    for k,v in select * from jsonb_each(incoming) where key<>'dates' loop
        if v='null'::jsonb then continue;end if;
        if k in ('currency','window') then merged:=jsonb_set(merged,array[k],v);continue;end if;
        old_date:=previous->'dates'->>k;new_date:=incoming->'dates'->>k;
        if previous ? k and old_date is not null and (new_date is null or new_date<old_date) then continue;end if;
        merged:=jsonb_set(merged,array[k],v);
        dates:=jsonb_set(dates,array[k],coalesce(to_jsonb(new_date),'null'::jsonb));
    end loop;
    return merged || jsonb_build_object('dates',dates);
end $$;

create table public.fund_radar_catalog (
    id text primary key default gen_random_uuid()::text,
    isin text not null unique check(isin ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'),
    name text not null check(length(btrim(name)) between 2 and 200),
    category text not null check(length(btrim(category)) between 2 and 100),
    manager text not null default '' check(length(manager)<=200),
    description text not null default '' check(length(description)<=4000),
    source_url text check(source_url is null or (length(source_url)<=2000 and source_url ~ '^https://[^[:space:]]+$')),
    manual_metrics jsonb not null default '{}' check(public.fund_radar_metrics_valid(manual_metrics)),
    extra jsonb not null default '{}' check(jsonb_typeof(extra)='object' and octet_length(extra::text)<=12000),
    auto_refresh boolean not null default true,
    is_active boolean not null default true,
    version bigint not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    updated_by uuid default auth.uid()
);
create table public.fund_radar_data (
    fund_id text primary key references public.fund_radar_catalog(id) on delete cascade,
    metrics jsonb not null default '{}' check(public.fund_radar_metrics_valid(metrics)),
    provider_category text,
    profile jsonb not null default '{}',
    source_url text,
    checked_at timestamptz,
    last_success_at timestamptz,
    error text,
    lease_id uuid,
    lease_until timestamptz,
    leased_isin text
);
create table public.fund_radar_audit (
    id bigint generated always as identity primary key,
    fund_id text not null references public.fund_radar_catalog(id),
    actor_id uuid,
    changed_at timestamptz not null default now(),
    action text not null,
    before_data jsonb,
    after_data jsonb not null
);
create index fund_radar_audit_fund_time on public.fund_radar_audit(fund_id,changed_at desc);
create function portfolio_private.fund_radar_stamp() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
    if tg_op='INSERT' then new.version:=1;new.created_at:=now();
    else if new.isin<>old.isin then raise exception 'ISIN is immutable; create another share class'; end if;new.id:=old.id;new.version:=old.version+1;new.created_at:=old.created_at;end if;
    new.updated_at:=now();new.updated_by:=auth.uid();return new;
end $$;
create function portfolio_private.fund_radar_audit() returns trigger
language plpgsql security definer set search_path='' as $$
begin
    insert into public.fund_radar_audit(fund_id,actor_id,action,before_data,after_data)
    values(new.id,auth.uid(),case when tg_op='INSERT' then 'create' when old.is_active and not new.is_active then 'archive' when not old.is_active and new.is_active then 'restore' else 'edit' end,
        case when tg_op='UPDATE' then to_jsonb(old) end,to_jsonb(new));return new;
end $$;
create trigger fund_radar_stamp before insert or update on public.fund_radar_catalog for each row execute function portfolio_private.fund_radar_stamp();
create trigger fund_radar_audit after insert or update on public.fund_radar_catalog for each row execute function portfolio_private.fund_radar_audit();
revoke all on function portfolio_private.fund_radar_stamp(),portfolio_private.fund_radar_audit() from public,anon,authenticated,service_role;

alter table public.fund_radar_catalog enable row level security;
alter table public.fund_radar_data enable row level security;
alter table public.fund_radar_audit enable row level security;
revoke all on public.fund_radar_catalog,public.fund_radar_data,public.fund_radar_audit from anon,authenticated;
grant select on public.fund_radar_catalog to anon,authenticated;
-- Internal leases/errors remain server-only. Public readers see provider data and timestamps.
grant select(fund_id,metrics,profile,provider_category,source_url,checked_at,last_success_at) on public.fund_radar_data to anon,authenticated;
grant select on public.fund_radar_audit to authenticated;
grant insert(isin,name,category,manager,description,source_url,manual_metrics,extra,auto_refresh,is_active),
    update(isin,name,category,manager,description,source_url,manual_metrics,extra,auto_refresh,is_active) on public.fund_radar_catalog to authenticated;
grant all on public.fund_radar_catalog,public.fund_radar_data,public.fund_radar_audit to service_role;
create policy radar_catalog_read on public.fund_radar_catalog for select to anon,authenticated using(is_active or (select public.is_news_admin()));
create policy radar_catalog_insert on public.fund_radar_catalog for insert to authenticated with check((select public.is_news_admin()));
create policy radar_catalog_update on public.fund_radar_catalog for update to authenticated using((select public.is_news_admin())) with check((select public.is_news_admin()));
create policy radar_data_read on public.fund_radar_data for select to anon,authenticated using(exists(select 1 from public.fund_radar_catalog c where c.id=fund_id));
create policy radar_audit_read on public.fund_radar_audit for select to authenticated using((select public.is_news_admin()));

-- A lease limits editor-triggered refreshes and prevents overlapping workers.
create function portfolio_private.begin_fund_radar_refresh(job_secret text default null,requested_id text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; lease uuid:=gen_random_uuid(); job boolean;
begin
    job:=coalesce(auth.jwt()->>'role','')='service_role' and job_secret is not null and exists(select 1 from vault.decrypted_secrets where name='daily_market_job_secret' and decrypted_secret=job_secret);
    if not job and not public.is_news_admin() then raise exception 'Editorial access required' using errcode='42501'; end if;
    perform pg_advisory_xact_lock(640616);
    insert into public.fund_radar_data(fund_id) select id from public.fund_radar_catalog where is_active and auto_refresh on conflict do nothing;
    with claimed as (
        update public.fund_radar_data d set lease_id=lease,lease_until=now()+interval '3 minutes',leased_isin=c.isin
        from public.fund_radar_catalog c
        where c.id=d.fund_id and c.is_active and c.auto_refresh and (requested_id is null or c.id=requested_id)
            and (d.lease_until is null or d.lease_until<now())
            and (d.checked_at is null or d.checked_at<now()-case when job then interval '20 hours' else interval '15 minutes' end)
        returning c.id,c.isin
    ) select coalesce(jsonb_agg(to_jsonb(claimed)),'[]') into result from claimed;
    return jsonb_build_object('lease',lease,'funds',result);
end $$;
create function public.begin_fund_radar_refresh(job_secret text default null,requested_id text default null) returns jsonb
language sql security invoker set search_path='' as $$select portfolio_private.begin_fund_radar_refresh(job_secret,requested_id)$$;
revoke all on function public.begin_fund_radar_refresh(text,text),portfolio_private.begin_fund_radar_refresh(text,text) from public,anon;
grant execute on function public.begin_fund_radar_refresh(text,text),portfolio_private.begin_fund_radar_refresh(text,text) to authenticated,service_role;

create function public.finish_fund_radar_refresh(lease uuid,items jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare item jsonb; updated integer:=0; failed integer:=0; skipped integer:=0; affected integer;
begin
    for item in select * from jsonb_array_elements(items) loop
        update public.fund_radar_data d set checked_at=now(),lease_id=null,lease_until=null,
            metrics=case when item->>'error' is null then public.fund_radar_merge_metrics(d.metrics,coalesce(item->'metrics','{}')) else d.metrics end,
            profile=case when item->>'error' is null then d.profile || coalesce(item->'profile','{}') else d.profile end,
            provider_category=coalesce(item->>'category',d.provider_category),source_url=coalesce(item->>'sourceUrl',d.source_url),
            last_success_at=case when item->>'error' is null then now() else d.last_success_at end,
            error=left(item->>'error',300)
        from public.fund_radar_catalog c where c.id=d.fund_id and d.fund_id=item->>'id' and d.lease_id=lease and d.lease_until>now()
            and c.isin=d.leased_isin and c.is_active and c.auto_refresh;
        get diagnostics affected=row_count;
        if affected=0 then skipped:=skipped+1;elsif item->>'error' is null then updated:=updated+1;else failed:=failed+1;end if;
    end loop;
    return jsonb_build_object('updated',updated,'failed',failed,'skipped',skipped);
end $$;
revoke all on function public.finish_fund_radar_refresh(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.finish_fund_radar_refresh(uuid,jsonb) to service_role;

-- Dispatch at 09:15 Europe/Madrid, independent of the price/snapshot worker.
create function portfolio_private.dispatch_fund_radar_refresh() returns void
language plpgsql security definer set search_path='' as $$
declare url text; secret text;
begin
    if extract(hour from now() at time zone 'Europe/Madrid')<>9 then return;end if;
    select decrypted_secret into url from vault.decrypted_secrets where name='daily_market_project_url';
    select decrypted_secret into secret from vault.decrypted_secrets where name='daily_market_job_secret';
    if url is null or secret is null then raise exception 'Radar worker not configured';end if;
    perform net.http_post(url:=url||'/functions/v1/fund-radar-refresh',headers:=jsonb_build_object('Content-Type','application/json','x-job-secret',secret),body:='{}',timeout_milliseconds:=150000);
end $$;
revoke all on function portfolio_private.dispatch_fund_radar_refresh() from public,anon,authenticated,service_role;
-- Scheduler installation is conditional so the same schema is testable locally.
do $$begin
    if exists(select 1 from pg_extension where extname='pg_cron') then
        perform cron.schedule('freewallet-fund-radar','15 7,8 * * *','select portfolio_private.dispatch_fund_radar_refresh()');
    end if;
end $$;

-- One-time import of the existing catalog; no runtime dependency on BEST_FUNDS.
-- Dates are deliberately unknown instead of inventing a recent revision.
insert into public.fund_radar_catalog(id,isin,name,category,manager,description,source_url,manual_metrics,extra)
select id,isin,name,category,manager,description,source_url,manual_metrics,extra
from jsonb_to_recordset('[{"id":"dws-floating-rate","isin":"LU0034353002","name":"DWS Floating Rate Notes LC","category":"Monetario","manager":"DWS Investment S.A.","description":"Fondo de renta fija ultra corto plazo con exposición a instrumentos de tipo flotante.","source_url":"https://www.finect.com/fondos-inversion/LU0034353002-Dws_floating_rate_notes_lc","manual_metrics":{"ytd":0.34,"y1":2.67,"y3":3.75,"y5":2.13,"volatility":0.25,"maxDrawdown":-0.07,"sharpe":2.34,"ter":0.26,"risk":1,"dates":{}},"extra":{"aum":"5.760,2 M€ (clase) / 11.234,2 M€ (fondo)"}},{"id":"groupama-tresorerie","isin":"FR0000989626","name":"Groupama Trésorerie IC","category":"Monetario","manager":"Groupama Asset Management","description":"Monetario EUR.","source_url":"https://www.finect.com/fondos-inversion/FR0000989626-Groupama_tresorerie_ic","manual_metrics":{"ytd":0.24,"y1":2.27,"y3":3.24,"y5":1.9,"volatility":0.11,"maxDrawdown":-0.02,"sharpe":7.87,"ter":0.15,"risk":1,"dates":{}},"extra":{"aum":"4.688,8 M€ (clase) / 7.102,5 M€ (fondo)"}},{"id":"abaco-rf-mixta","isin":"ES0140072010","name":"Ábaco Renta Fija Mixta Global R FI","category":"Mixto Defensivo","manager":"Ábaco Capital SGIIC","description":"Mixto defensivo global.","source_url":"https://www.finect.com/fondos-inversion/ES0140072010-Abaco_renta_fija_mixta_global_r_fi","manual_metrics":{"ytd":2.84,"y1":8.33,"y3":6.53,"y5":7.41,"volatility":2.55,"maxDrawdown":-0.95,"sharpe":1.7,"ter":1.03,"risk":3,"dates":{}},"extra":{"aum":"16,7 M€ (clase) / 109,4 M€ (fondo)"}},{"id":"carmignac-credit","isin":"LU1623762843","name":"Carmignac Portfolio Credit A EUR Acc","category":"Renta Fija Corporativa","manager":"Carmignac Gestion Luxembourg S.A.","description":"RF flexible centrada en crédito.","source_url":"https://www.finect.com/fondos-inversion/LU1623762843-Carmignac_pf_credit_a_eur_acc","manual_metrics":{"ytd":1.18,"y1":5.86,"y3":7.71,"y5":2.68,"volatility":2.6,"maxDrawdown":-1.1,"sharpe":1.68,"ter":1.2,"risk":2,"dates":{}},"extra":{"aum":"1.414,7 M€ (clase) / 2.610,9 M€ (fondo)"}},{"id":"fidelity-msci-world","isin":"IE00BYX5NX33","name":"Fidelity MSCI World Index Fund P-ACC-EUR","category":"Renta Variable Pasiva","manager":"FIL Investment Management (Luxembourg) S.A., Ireland Branch","description":"Indexado MSCI World.","source_url":"https://www.finect.com/fondos-inversion/IE00BYX5NX33-Fidelity_msci_world_index_eur_p_acc","manual_metrics":{"ytd":0.96,"y1":3.26,"y3":14.81,"y5":11.98,"volatility":13.32,"maxDrawdown":-12.49,"sharpe":0.39,"ter":0.12,"risk":6,"dates":{}},"extra":{"aum":"1.531,1 M€ (clase) / 2.305,5 M€ (fondo)"}},{"id":"vanguard-emerging","isin":"IE0031786142","name":"Vanguard Emerging Markets Stock Index Fund Inv EUR Acc","category":"Renta Variable Pasiva","manager":"Vanguard Group (Ireland) Limited","description":"Indexado de Mercados Emergentes.","source_url":"https://www.finect.com/fondos-inversion/IE0031786142-Vanguard_emerg_mkts_stk_idx_inv_eur_acc","manual_metrics":{"ytd":9.71,"y1":25.23,"y3":13.95,"y5":4.41,"volatility":12.48,"maxDrawdown":-6.95,"sharpe":1.19,"ter":0.23,"risk":6,"dates":{}},"extra":{"aum":"377,6 M€ (clase) / 15.790,0 M€ (fondo)"}},{"id":"myinvestor-value","isin":"ES0165243025","name":"MyInvestor Value C FI","category":"Renta Variable Activa","manager":"Andbank Wealth Management SGIIC","description":"Fondo Value de empresas de pequeña y mediana capitalización europeas.","source_url":"https://www.finect.com/fondos-inversion/ES0165243025-Myinvestor_value_c_fi","manual_metrics":{"ytd":6.39,"y1":19.3,"volatility":8.03,"maxDrawdown":-3.94,"sharpe":1.98,"ter":1.49,"risk":5,"dates":{}},"extra":{"aum":"27,6 M€ (clase/fondo)"}},{"id":"cobas-internacional","isin":"ES0119199000","name":"Cobas Internacional C FI","category":"Renta Variable Activa","manager":"Cobas Asset Management SGIIC S.A.","description":"Value global small/mid.","source_url":"https://www.finect.com/fondos-inversion/ES0119199000-Cobas_internacional_c_fi","manual_metrics":{"ytd":16.74,"y1":42.48,"y3":20.55,"y5":21.83,"volatility":16.63,"maxDrawdown":-16.87,"sharpe":1.19,"ter":1.62,"risk":5,"dates":{}},"extra":{"aum":"119,0 M€ (clase) / 926,2 M€ (fondo)"}},{"id":"fidelity-global-technology","isin":"LU1213836080","name":"Fidelity Funds - Global Technology Fund A-Acc-EUR","category":"Renta Variable Activa","manager":"Fidelity (FIL Inv Mgmt (Lux) S.A.)","description":"Renta variable global centrada en tecnología; no indexado.","source_url":"https://www.finect.com/fondos-inversion/LU1213836080-Fidelity_global_technology_aacceur","manual_metrics":{"ytd":-1.14,"y1":4.88,"y3":17.64,"y5":12.7,"volatility":18.16,"maxDrawdown":-15.3,"sharpe":0.49,"ter":1.89,"risk":6,"dates":{}},"extra":{"aum":"3.613,4 M€ (clase) / 28.367,7 M€ (fondo)"}},{"id":"fidelity-sp500-index","isin":"IE00BYX5MX67","name":"Fidelity S&P 500 Index Fund EUR P Acc","category":"Renta Variable Pasiva","manager":"FIL Investment Management (Luxembourg) S.A., Ireland Branch","description":"Indexado al S&P 500 (clase EUR P Acc).","source_url":"https://www.finect.com/fondos-inversion/IE00BYX5MX67-Fidelity_sp_500_index_eur_p_acc","manual_metrics":{"ytd":-0.93,"y1":-0.73,"y3":15.44,"y5":13.31,"volatility":15.43,"maxDrawdown":-15.52,"sharpe":0.16,"ter":0.06,"risk":6,"dates":{}},"extra":{"aum":"1.069,0 M€ (clase) / 1.646,3 M€ (fondo)"}},{"id":"carmignac-securite","isin":"FR0010149120","name":"Carmignac Sécurité AW EUR Acc","category":"Renta Fija Corto Plazo","manager":"Carmignac Gestion","description":"Fondo de renta fija diversificada de corto plazo que busca rendimiento superior a su benchmark con volatilidad contenida.","source_url":"https://www.finect.com/fondos-inversion/FR0010149120-Carmignac_securite_aw_eur_acc","manual_metrics":{"ytd":0.56,"y1":2.23,"y3":3.57,"y5":1.37,"volatility":1.61,"maxDrawdown":-1.23,"sharpe":0.56,"ter":1.11,"risk":3,"dates":{}},"extra":{"aum":"4.956,7 M€ (clase) / 5.226,9 M€ (fondo)","allocation":[]}},{"id":"storm-bond-nordic","isin":"LU0840159460","name":"Storm Fund II - Storm Bond Fund RC EUR","category":"Renta Fija High Yield","manager":"Storm Capital Management","description":"RF corporativa sub-investment grade de los países nórdicos. Enfoque en sectores resilientes y crédito de corta duración.","source_url":"https://www.finect.com/fondos-inversion/LU0840159460-Storm_fund_ii_storm_bond_rc_eur","manual_metrics":{"ytd":1.6,"y1":6.89,"y3":6.5,"y5":5.8,"volatility":2.2,"maxDrawdown":-5,"sharpe":1.82,"ter":1.01,"risk":2,"dates":{}},"extra":{"aum":"1.114,3 M€"}},{"id":"helium-invest-arbitrage","isin":"LU1995645790","name":"Helium Invest A","category":"Retorno Absoluto","manager":"Syquant Capital","description":"Estrategia alternativa de arbitraje de crédito y situaciones especiales orientada a la preservación de capital.","source_url":"https://www.finect.com/fondos-inversion/LU1995645790-Helium_invest_a_eur","manual_metrics":{"ytd":0.76,"y1":4.5,"y3":3.2,"y5":2.8,"volatility":1.2,"maxDrawdown":-1.5,"sharpe":1.54,"ter":1.4,"risk":2,"dates":{}},"extra":{"aum":"354,9 M€"}},{"id":"cartesio-x-defensive","isin":"ES0116567035","name":"Cartesio X FI","category":"Mixto Defensivo","manager":"Cartesio Inversiones SGIIC","description":"Mixto defensivo que combina renta fija europea con una exposición controlada (máx 40%) a renta variable de alta calidad.","source_url":"https://www.finect.com/fondos-inversion/ES0116567035-Cartesio_x_fi","manual_metrics":{"ytd":1.71,"y1":12.71,"y3":8.24,"y5":5.62,"volatility":4.15,"maxDrawdown":-4.5,"sharpe":1.42,"ter":0.75,"risk":2,"dates":{}},"extra":{"aum":"485,8 M€"}},{"id":"azvalor-internacional","isin":"ES0112611001","name":"Azvalor Internacional FI","category":"Renta Variable Activa","manager":"Azvalor Asset Management","description":"Value investing puro centrado en empresas infravaloradas con ventajas competitivas y balances sólidos a nivel global.","source_url":"https://www.finect.com/fondos-inversion/ES0112611001-Azvalor_internacional_fi","manual_metrics":{"ytd":20.08,"y1":45.5,"y3":15.6,"y5":23.2,"volatility":16.54,"maxDrawdown":-12.64,"sharpe":1.3,"ter":1.87,"risk":5,"dates":{}},"extra":{"aum":"3.130,0 M€"}},{"id":"horos-internacional","isin":"ES0146309002","name":"Horos Value Internacional FI","category":"Renta Variable Activa","manager":"Horos Asset Management","description":"Fondo de autor con filosofía value, especializado en descubrir valor en compañías de pequeña y mediana capitalización fuera del radar del mercado.","source_url":"https://www.finect.com/fondos-inversion/ES0146309002-Horos_value_internacional_fi","manual_metrics":{"ytd":0.02,"y1":20.35,"y3":14.59,"y5":16.07,"volatility":12.66,"maxDrawdown":-11.96,"sharpe":1.28,"ter":1.8,"risk":4,"dates":{}},"extra":{"aum":"275,0 M€"}},{"id":"hamco-sicav-global","isin":"LU3038481936","name":"Hamco SICAV Global Value Fund R","category":"Renta Variable Activa","manager":"Andbank Asset Management Luxembourg","description":"Renta variable global gestionada bajo principios de valor relativo, buscando ineficiencias en valoraciones de empresas medianas.","source_url":"https://www.finect.com/fondos-inversion/LU3038481936-Hamco_sicav_global_value_r","manual_metrics":{"ytd":9.99,"y1":19.83,"y3":11.03,"y5":18.31,"volatility":12.63,"maxDrawdown":-8.1,"sharpe":1.24,"ter":1.5,"risk":3,"dates":{}},"extra":{"aum":"102,8 M€"}},{"id":"neuberger-short-duration-i","isin":"IE00BFZMJT78","name":"Neuberger Berman Short Duration Euro Bond Fund I","category":"Renta Fija Corto Plazo","manager":"Neuberger Berman Asset Management Ireland Limited","description":"Gestión activa de renta fija euro de corta duración. Mínima volatilidad y máxima protección en giros de mercado.","source_url":"https://www.finect.com/fondos-inversion/IE00BFZMJT78-Neuberger_berman_short_er_bd_euriacc","manual_metrics":{"ytd":0.76,"y1":2.8,"y3":2.5,"y5":1.9,"volatility":0.85,"maxDrawdown":-0.45,"sharpe":2.1,"ter":0.26,"risk":1,"dates":{}},"extra":{"aum":"4.014,5 M€"}},{"id":"pareto-nordic-credit","isin":"LU2200514128","name":"Pareto Nordic Cross Credit R EUR","category":"Renta Fija High Yield","manager":"Pareto Asset Management","description":"RF corporativa nórdica con foco en sostenibilidad. Combina crédito senior y subordinado (CoCos) para optimizar el perfil riesgo/retorno.","source_url":"https://www.finect.com/fondos-inversion/LU2200514128-Pareto_nordic_cross_credit_r_eur","manual_metrics":{"ytd":0.56,"y1":4.11,"y3":3.8,"y5":3.2,"volatility":0.84,"maxDrawdown":-1.95,"sharpe":1.62,"ter":1.11,"risk":2,"dates":{}},"extra":{"aum":"1.070,0 M€"}},{"id":"evercapital-ucits-i","isin":"LU1953238794","name":"EC SICAV - EverCapital Investments UCITS I Fund Class Retail","category":"Renta Fija High Yield","manager":"EverCapital (Andbank)","description":"Fondo flexible global con gestión activa que combina renta variable y deuda. Busca retornos descorrelacionados mediante diversificación estratégica.","source_url":"https://www.finect.com/fondos-inversion/LU1953238794-Evercapital_investments_ucits_i_r","manual_metrics":{"ytd":6.02,"y1":10.24,"y3":5.17,"y5":6.13,"volatility":8.94,"maxDrawdown":-4.2,"sharpe":0.45,"ter":3.16,"risk":3,"dates":{}},"extra":{"aum":"12,4 M€"}}]'::jsonb) as f(id text,isin text,name text,category text,manager text,description text,source_url text,manual_metrics jsonb,extra jsonb)
on conflict(isin) do nothing;

commit;
