begin;
create index news_invitation_requests_inviter_idx on portfolio_private.news_invitation_requests(invited_by);
-- Evaluate Auth once per statement on the retained read policies. Direct table
-- access is still revoked; RPC guards remain the authority for portfolio access.
do $$declare name text;begin
    foreach name in array array['user_portfolios','portfolio_positions','portfolio_transactions','portfolio_valuations','portfolio_preferences','portfolio_targets','portfolio_imports'] loop
        execute format('alter policy owner_read on public.%I using (user_id=(select auth.uid()))',name);
    end loop;
end $$;
-- Exactly one SELECT policy for each role; anonymous readers never execute
-- an editorial authorization function.
alter policy "Public can read published news" on public.news_posts to anon;
alter policy "Admins can read every news post" on public.news_posts using (status='published' or (select public.is_news_admin()));
commit;
