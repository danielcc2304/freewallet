begin;

-- Extend the row-locked, session/MFA checked command; never persist an empty
-- destination separately. Existing receipts/revision checks cover both changes.
do $migration$
declare definition text; original text; marker text; replacement text;
begin
    select pg_get_functiondef('portfolio_private.write_state(bigint,uuid,text,jsonb)'::regprocedure) into original;
    if strpos(original,'old_target is null or target_asset is null') = 0 then
        raise exception 'Review transfer destination migration: command changed';
    end if;
    definition := replace(original,
        'old_asset is null or old_target is null or target_asset is null',
        'old_asset is null or target_asset is null');
    definition := replace(definition, 'old_target->>', 'coalesce(old_target,target_asset)->>');
    -- The new position is only a metadata template: its proposed cost/units are
    -- always discarded and recomputed from the verified transfer amounts.
    definition := replace(definition,
        $text$target_old_qty := coalesce((coalesce(old_target,target_asset)->>'quantity')::numeric,0);$text$,
        $text$target_old_qty := coalesce((old_target->>'quantity')::numeric,0);$text$);
    definition := replace(definition,
        $text$target_old_price := coalesce((coalesce(old_target,target_asset)->>'purchasePrice')::numeric,0);$text$,
        $text$target_old_price := coalesce((old_target->>'purchasePrice')::numeric,0);$text$);
    definition := replace(definition, 'target_new := old_target || jsonb_build_object(', 'target_new := coalesce(old_target,target_asset) || jsonb_build_object(');
    marker := $marker$                if (case when nullif(old_asset->>'isin','') is not null$marker$;
    replacement := $replacement$                if old_target is null and (
                    coalesce(target_asset->>'isin','') !~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'
                    or exists (select 1 from jsonb_array_elements(previous->'assets') a
                        where upper(regexp_replace(coalesce(nullif(a->>'isin',''),a->>'symbol'),'\s','','g')) = target_asset->>'isin')
                    or exists (select 1 from jsonb_array_elements(previous->'transactions') t
                        where t->>'assetId'=target_id or t->>'transferToAssetId'=target_id)
                ) then raise exception 'New transfer destination already exists or has invalid ISIN' using errcode='22023'; end if;
                if upper(regexp_replace(coalesce(nullif(old_asset->>'isin',''),old_asset->>'symbol'),'\s','','g'))
                    = upper(regexp_replace(coalesce(nullif(coalesce(old_target,target_asset)->>'isin',''),coalesce(old_target,target_asset)->>'symbol'),'\s','','g')) then
                    raise exception 'Transfer destination must be another fund' using errcode='22023'; end if;
                if (case when nullif(old_asset->>'isin','') is not null$replacement$;
    if strpos(definition,marker)=0 then raise exception 'Review transfer identity check'; end if;
    definition := replace(definition,marker,replacement);
    marker := $marker$                ) positions where position is not null;$marker$;
    replacement := marker || $replacement$
                if old_target is null then assets := assets || jsonb_build_array(target_new); end if;$replacement$;
    if strpos(definition,marker)=0 then raise exception 'Review transfer position assembly'; end if;
    definition := replace(definition,marker,replacement);
    -- Imported funds on either side may require their one explicit opening basis.
    definition := replace(definition,
        $text$or (operation is not null and item->>'assetId' is distinct from operation->>'assetId')$text$,
        $text$or (operation is not null and item->>'assetId' is distinct from operation->>'assetId' and (operation->>'type' <> 'transfer' or item->>'assetId' is distinct from operation->>'transferToAssetId'))$text$);
    execute definition;
end $migration$;

commit;
