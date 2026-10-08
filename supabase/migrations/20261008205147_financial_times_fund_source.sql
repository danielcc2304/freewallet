begin;
alter table portfolio_private.market_prices drop constraint market_prices_source_check;
alter table portfolio_private.market_prices add constraint market_prices_source_check
 check(source in ('Finect','Yahoo Finance','VDOS/Quefondos','Cobas AM','Azvalor','Financial Times'));
commit;
