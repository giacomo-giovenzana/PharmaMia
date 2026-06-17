-- GRANT espliciti per esporre le tabelle via PostgREST (API Supabase)
-- Necessario perché auto_expose_new_tables non è abilitato nel config.toml

grant usage on schema public to anon, authenticated;

-- Catalogo AIFA: sola lettura per anon e authenticated (RLS gestisce il controllo fine)
grant select on public.drugs_catalog to anon, authenticated;

-- Tabelle tenant: CRUD per authenticated (le RLS policy limitano i dati per household)
grant select, insert, update, delete on public.households          to authenticated;
grant select, insert, update, delete on public.household_members   to authenticated;
grant select, insert, update, delete on public.medications         to authenticated;
grant select, insert, update, delete on public.therapies           to authenticated;

-- Funzione RLS helper: eseguibile da authenticated
grant execute on function public.is_household_member(uuid) to authenticated;
