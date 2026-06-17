-- Inventario farmaci di una household
-- catalog_id nullable: un farmaco può essere registrato manualmente senza corrispondenza AIFA
create table public.medications (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  catalog_id   uuid references public.drugs_catalog(id) on delete set null,
  name         text not null,                  -- nome visualizzato (copiato dal catalogo o inserito manualmente)
  quantity     numeric(10,2) not null default 0,
  unit         text not null default 'pz',     -- pz, ml, mg, ...
  expires_at   date,
  location     text,                            -- dove è conservato (es. "armadio bagno")
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index medications_household_idx on public.medications (household_id);
create index medications_catalog_idx  on public.medications (catalog_id) where catalog_id is not null;

-- Piani terapeutici: terapia ciclica o continuativa per un membro
create table public.therapies (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references public.households(id) on delete cascade,
  member_id       uuid not null references auth.users(id) on delete cascade,
  catalog_id      uuid references public.drugs_catalog(id) on delete restrict,
  medication_id   uuid references public.medications(id) on delete set null,
  name            text not null,
  dosage          text,                          -- descrizione posologia (es. "1 compressa a stomaco pieno")
  frequency       text,                          -- es. "ogni 8 ore", "1 volta al giorno"
  start_date      date not null,
  end_date        date,                          -- null = terapia continuativa
  active          boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index therapies_household_idx  on public.therapies (household_id);
create index therapies_member_idx     on public.therapies (member_id);
create index therapies_catalog_idx    on public.therapies (catalog_id) where catalog_id is not null;
