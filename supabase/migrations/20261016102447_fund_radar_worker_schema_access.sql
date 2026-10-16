-- The invoker RPC delegates into the private schema. Only the trusted server
-- role gains schema visibility; function EXECUTE grants remain restricted.
grant usage on schema portfolio_private to service_role;
