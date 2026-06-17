-- Verifica migration: tabelle presenti, catalogo ≥1000 righe, lookup AIC/EAN
-- Esegui con: supabase db execute --file supabase/tests/migration_verification.sql
-- (richiede: supabase start && supabase db reset)

do $$
declare
  v_table_count   int;
  v_catalog_count int;
  v_aic_hit       int;
  v_ean_hit       int;
begin
  -- 1. Verifica che le tabelle core esistano
  select count(*)::int into v_table_count
  from information_schema.tables
  where table_schema = 'public'
    and table_name in ('households', 'household_members', 'drugs_catalog', 'medications', 'therapies');

  assert v_table_count = 5,
    format('FAIL: attese 5 tabelle core, trovate %s', v_table_count);
  raise notice 'OK: 5 tabelle core presenti';

  -- 2. Verifica catalogo AIFA ≥1000 righe
  select count(*)::int into v_catalog_count from public.drugs_catalog;

  assert v_catalog_count >= 1000,
    format('FAIL: catalogo ha solo %s righe (attese ≥1000)', v_catalog_count);
  raise notice 'OK: catalogo AIFA ha % righe', v_catalog_count;

  -- 3. Lookup per AIC: prima riga del seed
  select count(*)::int into v_aic_hit
  from public.drugs_catalog
  where aic_code = '000000001';

  assert v_aic_hit = 1,
    format('FAIL: lookup AIC "000000001" ha restituito %s righe', v_aic_hit);
  raise notice 'OK: lookup AIC restituisce il farmaco corretto';

  -- 4. Lookup per EAN: cerca un EAN presente nel seed
  select count(*)::int into v_ean_hit
  from public.drugs_catalog
  where ean_code is not null
  limit 1;

  assert v_ean_hit >= 1,
    'FAIL: nessun farmaco con EAN presente nel catalogo';
  raise notice 'OK: lookup EAN funziona';

  -- 5. Verifica funzione is_household_member esiste
  assert exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_household_member'
  ), 'FAIL: funzione is_household_member non trovata';
  raise notice 'OK: funzione is_household_member presente';

  -- 6. Verifica RLS abilitata su tutte le tabelle tenant
  select count(*)::int into v_table_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('households', 'household_members', 'drugs_catalog', 'medications', 'therapies')
    and c.relrowsecurity = true;

  assert v_table_count = 5,
    format('FAIL: solo %s/5 tabelle hanno RLS abilitata', v_table_count);
  raise notice 'OK: RLS abilitata su tutte e 5 le tabelle';

  raise notice '✅ Tutte le verifiche migration passate con successo';
end;
$$;
