-- Catalogo farmaci AIFA — sola lettura per utenti autenticati, non modificabile
create table public.drugs_catalog (
  id               uuid primary key default gen_random_uuid(),
  aic_code         text not null,             -- Codice AIC (Autorizzazione Immissione in Commercio)
  ean_code         text,                       -- Codice EAN/barcode
  name             text not null,              -- Denominazione del medicinale
  active_ingredient text,                      -- Principio attivo
  form             text,                       -- Forma farmaceutica (es. compressa, sciroppo)
  dosage           text,                       -- Dosaggio (es. 500mg)
  atc_code         text,                       -- Codice ATC classificazione anatomico-terapeutica
  manufacturer     text,                       -- Titolare AIC
  package_desc     text,                       -- Descrizione confezione
  is_otc           boolean default false,      -- Da banco (OTC) vs prescrizione
  requires_prescription boolean default true,
  created_at       timestamptz not null default now()
);

-- Indice univoco su AIC (codice ufficiale AIFA)
create unique index drugs_catalog_aic_code_idx on public.drugs_catalog (aic_code);

-- Indice su EAN per lookup rapido da barcode scanner
create index drugs_catalog_ean_code_idx on public.drugs_catalog (ean_code) where ean_code is not null;

-- Indice full-text su nome per ricerca (italiano)
create index drugs_catalog_name_fts_idx on public.drugs_catalog
  using gin(to_tsvector('italian', name));
