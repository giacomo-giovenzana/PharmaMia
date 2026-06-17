-- Seed del catalogo farmaci AIFA
-- Fonte: campione sintetico rappresentativo per sviluppo/test locale
-- Script di trasformazione: dati generati con struttura reale AIFA (AIC, EAN, ATC)
-- Per aggiornare con dati reali: sostituire seed/data/farmaci_aifa.csv con export ufficiale AIFA
--   e ri-eseguire: supabase db reset

-- Tronca prima di reinserire per idempotenza
truncate table public.drugs_catalog restart identity cascade;

-- \copy usa il filesystem del client (dove gira psql / supabase CLI)
-- Il path è relativo alla project root (pharmamia-mvp/)
\copy public.drugs_catalog (aic_code, ean_code, name, active_ingredient, form, dosage, atc_code, manufacturer, package_desc, is_otc, requires_prescription)
from 'supabase/seed/data/farmaci_aifa.csv'
with (format csv, header true, null '');
