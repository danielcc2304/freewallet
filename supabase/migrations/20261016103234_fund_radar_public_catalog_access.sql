-- is_news_admin intentionally is not executable by anon. Separate policies
-- avoid evaluating that editor-only function when visitors read active funds.
alter policy radar_catalog_read on public.fund_radar_catalog to authenticated;
create policy radar_catalog_public_read on public.fund_radar_catalog for select to anon using(is_active);
