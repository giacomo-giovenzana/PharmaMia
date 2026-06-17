-- US-022: add lot and serial columns to medications
alter table public.medications
  add column if not exists lot    text,
  add column if not exists serial text;
