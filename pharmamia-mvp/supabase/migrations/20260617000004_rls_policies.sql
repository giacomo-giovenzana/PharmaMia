-- Row-Level Security: tutte le tabelle tenant sono isolate per household
-- Il catalogo AIFA è in sola lettura per tutti gli utenti autenticati

-- ── households ──────────────────────────────────────────────────────────────
alter table public.households enable row level security;

-- Un utente vede solo le household di cui è membro
create policy "households: select own" on public.households
  for select to authenticated
  using (public.is_household_member(id));

-- Solo un admin può creare una household (al momento via service role)
-- La creazione viene gestita da una Edge Function con service_role key
-- che aggiunge automaticamente il creatore come admin
create policy "households: insert service_role" on public.households
  for insert to service_role
  with check (true);

create policy "households: update admin" on public.households
  for update to authenticated
  using (
    exists (
      select 1 from public.household_members
      where household_id = id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

create policy "households: delete admin" on public.households
  for delete to authenticated
  using (
    exists (
      select 1 from public.household_members
      where household_id = id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

-- ── household_members ────────────────────────────────────────────────────────
alter table public.household_members enable row level security;

-- Un membro vede tutti i membri della propria household
create policy "household_members: select own" on public.household_members
  for select to authenticated
  using (public.is_household_member(household_id));

-- Solo admin possono aggiungere/rimuovere membri
create policy "household_members: insert admin" on public.household_members
  for insert to authenticated
  with check (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = household_id
        and hm.user_id = auth.uid()
        and hm.role = 'admin'
    )
  );

create policy "household_members: update admin" on public.household_members
  for update to authenticated
  using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = household_id
        and hm.user_id = auth.uid()
        and hm.role = 'admin'
    )
  );

create policy "household_members: delete admin" on public.household_members
  for delete to authenticated
  using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = household_id
        and hm.user_id = auth.uid()
        and hm.role = 'admin'
    )
  );

-- ── medications ─────────────────────────────────────────────────────────────
alter table public.medications enable row level security;

create policy "medications: select own household" on public.medications
  for select to authenticated
  using (public.is_household_member(household_id));

create policy "medications: insert own household" on public.medications
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy "medications: update own household" on public.medications
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "medications: delete own household" on public.medications
  for delete to authenticated
  using (public.is_household_member(household_id));

-- ── therapies ───────────────────────────────────────────────────────────────
alter table public.therapies enable row level security;

create policy "therapies: select own household" on public.therapies
  for select to authenticated
  using (public.is_household_member(household_id));

create policy "therapies: insert own household" on public.therapies
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy "therapies: update own household" on public.therapies
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "therapies: delete own household" on public.therapies
  for delete to authenticated
  using (public.is_household_member(household_id));

-- ── drugs_catalog ────────────────────────────────────────────────────────────
alter table public.drugs_catalog enable row level security;

-- Catalogo AIFA: sola lettura per tutti gli autenticati, nessuna scrittura diretta
create policy "drugs_catalog: select authenticated" on public.drugs_catalog
  for select to authenticated
  using (true);
