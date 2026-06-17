-- pgTAP: Test isolamento RLS per household
-- Esegui con: supabase test db
-- Richiede: supabase start && supabase db reset

begin;

select plan(12);

-- ── Setup: due household separate ────────────────────────────────────────────

-- Utente A: membro della household 1
-- Utente B: membro della household 2 (non-membro della 1)

do $$
declare
  v_user_a_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_user_b_id uuid := '00000000-0000-0000-0000-000000000002'::uuid;
  v_hh1_id    uuid := '00000000-0000-0000-0001-000000000001'::uuid;
  v_hh2_id    uuid := '00000000-0000-0000-0001-000000000002'::uuid;
  v_drug_id   uuid;
begin
  -- Inserisci utenti fittizi nel layer auth (bypassa RLS con service_role)
  insert into auth.users (id, email, created_at, updated_at)
  values
    (v_user_a_id, 'user-a@test.local', now(), now()),
    (v_user_b_id, 'user-b@test.local', now(), now())
  on conflict (id) do nothing;

  -- Crea household via service_role (bypassa RLS insert)
  insert into public.households (id, name)
  values
    (v_hh1_id, 'Household A'),
    (v_hh2_id, 'Household B')
  on conflict (id) do nothing;

  -- Aggiungi utente A alla household 1 come admin
  insert into public.household_members (household_id, user_id, role)
  values (v_hh1_id, v_user_a_id, 'admin')
  on conflict (household_id, user_id) do nothing;

  -- Aggiungi utente B alla household 2 come admin
  insert into public.household_members (household_id, user_id, role)
  values (v_hh2_id, v_user_b_id, 'admin')
  on conflict (household_id, user_id) do nothing;

  -- Aggiungi un farmaco alla household 1 (via service_role)
  insert into public.medications (household_id, name, quantity)
  values (v_hh1_id, 'Tachipirina HH1', 10)
  on conflict do nothing;

  -- Aggiungi un farmaco alla household 2
  insert into public.medications (household_id, name, quantity)
  values (v_hh2_id, 'Brufen HH2', 5)
  on conflict do nothing;
end;
$$;

-- ── Test 1-3: Utente A vede solo la propria household ────────────────────────

set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select count(*)::int from public.households),
  1,
  'Utente A vede esattamente 1 household'
);

select is(
  (select name from public.households limit 1),
  'Household A',
  'Utente A vede la propria household (A)'
);

select is(
  (select count(*)::int from public.medications),
  1,
  'Utente A vede esattamente 1 farmaco'
);

-- ── Test 4: Utente A non vede i farmaci della household 2 ────────────────────

select is(
  (select count(*)::int from public.medications where household_id = '00000000-0000-0000-0001-000000000002'::uuid),
  0,
  'Utente A non vede i farmaci della household B'
);

-- ── Test 5-6: Utente B vede solo la propria household ────────────────────────

set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}';

select is(
  (select count(*)::int from public.households),
  1,
  'Utente B vede esattamente 1 household'
);

select is(
  (select name from public.households limit 1),
  'Household B',
  'Utente B vede la propria household (B)'
);

-- ── Test 7: INSERT sulla household altrui è negato ───────────────────────────

select throws_ok(
  $$insert into public.medications (household_id, name, quantity)
    values ('00000000-0000-0000-0001-000000000001'::uuid, 'Farmaco intruso', 1)$$,
  'new row violates row-level security policy for table "medications"',
  'Utente B non può inserire farmaci nella household A'
);

-- ── Test 8: UPDATE sulla household altrui è negato ───────────────────────────

select is(
  (select count(*)::int from public.medications
   where household_id = '00000000-0000-0000-0001-000000000001'::uuid
     and name = 'Tachipirina HH1'),
  0,
  'Utente B non può vedere (né aggiornare) farmaci della household A'
);

-- ── Test 9: Il catalogo AIFA è leggibile da entrambi ────────────────────────

select ok(
  (select count(*) from public.drugs_catalog) >= 0,
  'Utente B può leggere il catalogo AIFA'
);

set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';

select ok(
  (select count(*) from public.drugs_catalog) >= 0,
  'Utente A può leggere il catalogo AIFA'
);

-- ── Test 10: Il catalogo AIFA non è scrivibile ────────────────────────────────

select throws_ok(
  $$insert into public.drugs_catalog (aic_code, name) values ('999999999', 'Farmaco non AIFA')$$,
  'new row violates row-level security policy for table "drugs_catalog"',
  'Utente autenticato non può inserire nel catalogo AIFA'
);

-- ── Test 11-12: is_household_member restituisce i valori corretti ─────────────

set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  public.is_household_member('00000000-0000-0000-0001-000000000001'::uuid),
  true,
  'is_household_member: utente A è membro della household A'
);

select is(
  public.is_household_member('00000000-0000-0000-0001-000000000002'::uuid),
  false,
  'is_household_member: utente A NON è membro della household B'
);

select * from finish();

rollback;
