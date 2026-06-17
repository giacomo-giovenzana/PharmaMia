-- Households: gruppi familiari che condividono l'inventario farmaci
create table public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Membri delle household con ruoli
create type public.household_role as enum ('admin', 'member');

create table public.household_members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         public.household_role not null default 'member',
  joined_at    timestamptz not null default now(),
  unique (household_id, user_id)
);

create index on public.household_members (household_id);
create index on public.household_members (user_id);

-- Helper SECURITY DEFINER per evitare ricorsione RLS
-- Usata nelle policy: is_household_member(household_id) -> bool
create or replace function public.is_household_member(p_household_id uuid)
  returns boolean
  language sql
  security definer
  stable
  set search_path = public
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = p_household_id
      and user_id = auth.uid()
  );
$$;
