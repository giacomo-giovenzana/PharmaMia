# PharmaMia – Prototipo MVP

Apri `index.html` nel browser per esplorare il prototipo.

## Schermate

| File | Schermata | Descrizione |
|---|---|---|
| `index.html` | **Dashboard** | Riepilogo stato armadietto, alert urgenti, terapie del giorno, rete |
| `inventory.html` | **Inventario** | Lista farmaci con filtri (tutti / in scadenza / scorte basse / scaduti) |
| `scan.html` | **Scansione** | Overlay camera con rilevamento barcode e risultato dal database AIFA |
| `medicine.html` | **Aggiungi farmaco** | Form con dati auto-compilati da scansione + configurazione piano terapeutico |
| `therapy.html` | **Terapie** | Calendario settimanale, dosi del giorno, piani attivi, grafico aderenza |
| `household.html` | **Famiglia** | Household condiviso, armadietti per membro, richiesta prestito anti-spreco |

## Flussi interattivi

- **Dashboard → alert** cliccabili → `inventory.html`
- **Scan** → rilevamento automatico dopo 2 secondi → bottom sheet con risultato AIFA → `medicine.html`
- **Terapie** → bottone "Conferma dose" aggiorna lo stato in-page
- **Famiglia** → richiesta prestito accettabile/rifiutabile con animazione
- **Inventario** → filtri per stato funzionanti via JS
- **Farmaco** → toggle piano terapeutico espande form configurazione

## Design system

- Teal primario `#0D7A6A` — salute, fiducia, cura
- Sfondo `#ECF0FA` — bianco freddo contemporaneo, non clinico
- Playfair Display per i nomi dei farmaci — leggibilità + calore editoriale
- Plus Jakarta Sans per il corpo — pulito, accessibile a tutte le età
- Barre di progresso + bordo colorato sinistro per indicatori di stato visivi immediati
