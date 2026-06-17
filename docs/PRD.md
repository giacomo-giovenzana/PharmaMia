# PharmaMia - Product Requirements Document

**Autore:** ARchetipo
**Data:** 2026-06-17
**Versione:** 1.0

---

## Elevator Pitch

> PharmaMia trasforma l'armadietto dei medicinali di casa in un inventario intelligente e condiviso: ti ricorda scadenze, dosi residue e riacquisti, ti guida nelle terapie e ti permette di condividere i farmaci con la tua rete di parenti e amici per non sprecare nulla.
>
> Per **le famiglie e i caregiver che gestiscono i farmaci di più persone**, che hanno il problema di **scadenze dimenticate, scorte esaurite all'improvviso, doppioni e terapie seguite a memoria**, **PharmaMia** è una **PWA di gestione della farmacia domestica** che **ricorda al posto loro e connette gli armadietti di una rete di fiducia**. A differenza di **una lista cartacea o un'app di promemoria generica**, il nostro prodotto **mette la condivisione di famiglia e l'anti-spreco al centro dell'esperienza**.

---

## Vision

PharmaMia vuole eliminare il carico mentale della gestione dei farmaci domestici e ridurre lo spreco di medicinali, trasformando la cura della salute familiare da attività individuale, fragile e basata sulla memoria, in un sistema condiviso, affidabile e collaborativo. La visione di lungo termine è diventare il punto di riferimento per la gestione della farmacia di casa per nuclei familiari e reti di fiducia, dove ogni confezione è tracciata, ogni terapia è supportata e nessun farmaco utile viene gettato mentre un'altra persona della rete potrebbe averne bisogno.

### Product Differentiator

A differenza delle app di promemoria farmaci (focalizzate sul singolo individuo) e dei semplici inventari domestici, PharmaMia nasce **multi-utente e di rete**: la farmacia condivisa di famiglia e il prestito anti-spreco tra reti collegate non sono funzioni accessorie ma il cuore del prodotto. L'inserimento a bassa frizione tramite scansione del codice a barre/AIC e l'integrazione con il database farmaci AIFA rendono l'esperienza immediata, mentre il modello caregiver permette a una persona di vigilare sulla salute di più familiari.

---

## User Personas

### Persona 1: Giulia

**Ruolo:** Caregiver di famiglia
**Età:** 38 | **Background:** Lavoratrice e madre di due figli, gestisce informalmente anche la salute dei genitori anziani che vivono nelle vicinanze.

**Obiettivi:**
- Non sbagliare mai una terapia, per sé, i figli o i genitori
- Evitare di ricomprare farmaci già presenti in casa
- Avere una visione unica e sempre aggiornata di tutti gli armadietti di cui si occupa

**Punti di dolore:**
- Carico mentale costante: scadenze e scorte sparse su più case
- "Ce l'avevamo o no?" — incertezza che porta a doppioni o mancanze
- Difficoltà a coordinarsi con fratelli/partner su chi compra cosa

**Comportamenti e strumenti:**
- Vive sullo smartphone, usa note, promemoria e chat di famiglia in modo frammentato
- Fa la spesa in farmacia di corsa, spesso senza certezze su cosa serve davvero

**Motivazioni:** Proteggere la famiglia e ridurre lo stress organizzativo quotidiano.
**Competenza tecnica:** Media — a suo agio con le app mobili di uso comune.

#### Customer Journey - Giulia

| Fase | Azione | Pensiero | Emozione | Opportunità |
|---|---|---|---|---|
| Consapevolezza | Scopre l'app cercando un modo per non dimenticare le scadenze | "Forse smetto di gestire tutto a memoria" | Speranza, scetticismo | Messaggio centrato sul caregiver e sulla famiglia |
| Considerazione | Confronta con app di promemoria generiche | "Questa capisce che gestisco più persone" | Interesse | Evidenziare farmacia condivisa e ruolo caregiver |
| Primo utilizzo | Scansiona le prime confezioni e crea l'household di famiglia | "Più facile del previsto" | Sollievo | Onboarding rapido con scansione e inviti |
| Uso regolare | Riceve avvisi, gestisce terapie dei genitori, evita un doppione | "Mi fido, non devo più ricordare io" | Tranquillità | Notifiche utili e non invadenti, riepiloghi |
| Advocacy | Invita fratelli e amici nella rete anti-spreco | "Dovremmo usarla tutti in famiglia" | Orgoglio | Inviti fluidi e valore visibile della rete |

---

### Persona 2: Marco

**Ruolo:** Paziente cronico
**Età:** 67 | **Background:** Pensionato con terapia quotidiana fissa per pressione e colesterolo; vive con la moglie, figli vicini.

**Obiettivi:**
- Prendere la dose giusta al momento giusto, ogni giorno
- Non restare mai senza i farmaci della terapia cronica

**Punti di dolore:**
- Dimentica se ha già preso la dose
- Si accorge troppo tardi che la confezione è quasi finita
- Diffida delle interfacce complicate

**Comportamenti e strumenti:**
- Usa lo smartphone per poche cose essenziali (chiamate, messaggi)
- Si affida ai familiari per la gestione "digitale"

**Motivazioni:** Autonomia nella gestione della propria salute e sicurezza di non sbagliare.
**Competenza tecnica:** Bassa — ha bisogno di caratteri grandi, pochi passaggi e chiarezza.

#### Customer Journey - Marco

| Fase | Azione | Pensiero | Emozione | Opportunità |
|---|---|---|---|---|
| Consapevolezza | La figlia gli installa l'app | "Speriamo sia semplice" | Diffidenza | Setup delegato al caregiver |
| Considerazione | Vede i promemoria della terapia | "Almeno mi avvisa" | Curiosità cauta | Interfaccia grande e leggibile |
| Primo utilizzo | Conferma una dose con un tap | "Facile, ci riesco" | Rassicurazione | Flusso dose minimale, un solo tap |
| Uso regolare | Segue la terapia e viene avvisato prima di restare senza | "Non resto più senza pastiglie" | Sicurezza | Avvisi scorta basse anticipati |
| Advocacy | Lo racconta agli amici coetanei | "Funziona anche per me" | Soddisfazione | Semplicità come messaggio chiave |

---

## Brainstorming Insights

> Scoperte chiave e direzioni alternative esplorate durante la sessione di inception.

### Assunzioni messe in discussione

- **"Il problema è ricordare le scadenze."** Sfidata da Costanza: il problema più profondo è il **carico mentale del caregiver** che gestisce i farmaci di più persone. Questo ha spostato il baricentro dell'MVP sulla famiglia/condivisione.
- **"L'utente inserisce i farmaci manualmente."** Sfidata come principale punto di frizione: l'inserimento manuale è dove gli inventari domestici muoiono. Decisione: inserimento tramite **scansione barcode/codice AIC** con database farmaci, manuale solo come fallback.

### Nuove direzioni scoperte

- La condivisione non è una feature finale ma il **differenziatore centrale**: farmacia di famiglia + prestito anti-spreco tra reti collegate.
- Il modello **caregiver** (una persona gestisce i farmaci di più membri) come capability di primo livello.
- L'anti-spreco come leva valoriale e potenziale motore di crescita virale (inviti nella rete).

---

## Product Scope

### MVP - Minimum Viable Product

- Inventario farmaci con inserimento via **scansione barcode/AIC** (auto-compilazione da DB farmaci) e fallback manuale
- Registrazione di scadenza, dosi/quantità disponibili e consumo dosi
- **Avvisi di scadenza imminente** e **avvisi di scorta bassa / necessità di riacquisto**
- Dashboard con farmaci in scadenza, scaduti e scorte basse
- **Piano terapeutico** con promemoria di assunzione e decremento automatico delle scorte
- **Farmacia condivisa (household)** con inviti, vista condivisa dell'inventario e ruolo caregiver
- **Richiesta di prestito anti-spreco** tra membri di reti collegate (richiesta → accetta/rifiuta)
- Autenticazione e isolamento dei dati per household
- PWA installabile con notifiche Web Push

### Growth Features (Post-MVP)

- Monetizzazione **freemium**: gratuito per singolo armadietto; premium per household multiple, funzioni avanzate caregiver e storico
- Lista della spesa farmaci e integrazione con riacquisto/farmacie
- Riconoscimento OCR del foglietto illustrativo e avvisi su interazioni tra farmaci
- Statistiche di aderenza terapeutica e report condivisibili (es. con il medico)
- Gestione di farmaci da banco vs su prescrizione, ricette e promemoria visita

### Vision (Future)

- Integrazione con Fascicolo Sanitario Elettronico / sistemi sanitari
- Suggerimenti di donazione di farmaci non scaduti a enti/associazioni (anti-spreco esteso)
- Assistente conversazionale per la gestione della terapia
- Apertura a una rete di fiducia più ampia (vicinato, comunità) con regole di privacy granulari

---

## Technical Architecture

> **Proposta da:** Leonardo (Architect)

### System Architecture

PharmaMia è una **Single Page Application installabile come PWA** che comunica con un backend gestito (BaaS). Il client React gestisce scansione, UI e funzionamento offline dell'inventario; il backend Supabase fornisce autenticazione, database Postgres multi-tenant con Row-Level Security, realtime per la condivisione e funzioni schedulate per il calcolo di scadenze e scorte. Le notifiche raggiungono l'utente via Web Push attraverso il service worker della PWA.

**Pattern architetturale:** SPA client-side + Backend-as-a-Service (Supabase), con logica di dominio nel client e regole di accesso/sicurezza demandate al database (RLS) e a Edge Functions.

**Componenti principali:**
- **Client PWA (React)**: inventario, scansione, terapie, dashboard, gestione household, funzionamento offline e installazione
- **Modulo di scansione**: `BarcodeDetector` API con fallback `@zxing/library`, mappatura barcode/AIC → farmaco
- **Backend Supabase**: Auth, Postgres (household, membri, farmaci, terapie, dosi, richieste di prestito), Realtime, Storage
- **Database farmaci**: dataset AIFA importato in Postgres, lookup AIC/EAN
- **Servizio notifiche**: Web Push (VAPID) + Edge Function/`pg_cron` schedulati per scadenze e scorte basse

### Technology Stack

| Layer | Tecnologia | Versione | Motivazione |
|---|---|---|---|
| Linguaggio | TypeScript | 5.x | Tipizzazione end-to-end, riduce errori su dati sanitari |
| Backend Framework | Supabase (Postgres + Edge Functions Deno) | Cloud | Auth, RLS multi-tenant, realtime e scheduling pronti, zero ops |
| Frontend Framework | React + Vite | React 18 / Vite 5 | Ecosistema maturo, build veloce, ottimo supporto PWA |
| Database | PostgreSQL | 15+ | Relazionale, RLS per isolamento household, adatto a dati strutturati |
| ORM | supabase-js (+ SQL/`pg_cron`) | latest | Accesso tipizzato e RLS lato DB |
| Auth | Supabase Auth | | Email/social, gestione sessioni, integrato con RLS |
| Testing | Vitest + React Testing Library + Playwright | | Unit, componenti ed e2e su flussi critici |

### Project Structure

**Pattern organizzativo:** organizzazione per funzionalità (feature-based) nel client, con uno strato condiviso per dominio e accesso dati.

```text
pharmamia/
├── src/
│   ├── features/
│   │   ├── inventory/        # farmaci, scadenze, scorte
│   │   ├── scanning/         # BarcodeDetector + fallback ZXing
│   │   ├── therapy/          # piani terapeutici, promemoria dosi
│   │   ├── household/        # farmacia condivisa, membri, ruoli
│   │   ├── lending/          # richieste di prestito anti-spreco
│   │   ├── notifications/    # Web Push, preferenze avvisi
│   │   └── auth/             # login, sessione
│   ├── shared/               # componenti UI, hook, utils, client supabase
│   ├── domain/               # tipi e logica di dominio (farmaco, dose, scadenza)
│   └── pwa/                  # service worker, manifest, offline
├── supabase/
│   ├── migrations/           # schema, policy RLS
│   ├── functions/            # edge functions (notifiche, job schedulati)
│   └── seed/                 # import dataset farmaci AIFA
├── public/
└── tests/                    # unit, integrazione, e2e
```

### Development Environment

Ambiente locale con Node.js e Supabase CLI per eseguire lo stack (Postgres + Auth + functions) in locale tramite Docker. Variabili d'ambiente per chiavi Supabase e VAPID. Seed del dataset farmaci per lo sviluppo.

**Strumenti richiesti:** Node.js 20+, npm/pnpm, Supabase CLI, Docker, un browser con supporto PWA per il test delle notifiche.

### CI/CD & Deployment

**Build tool:** Vite

**Pipeline:** su push/PR — lint + type-check, test unit/componenti, build PWA, e2e Playwright sui flussi critici (scansione, terapia, prestito); migration Supabase applicate in modo controllato.

**Strategia di deployment:** deploy continuo del frontend da Git; migration ed Edge Functions Supabase versionate e applicate via CLI in pipeline.

**Infrastruttura target:** frontend su Vercel/Netlify (CDN + HTTPS), backend su Supabase Cloud (Postgres gestito, Auth, Functions, Storage).

### Architecture Decision Records (ADR)

- **ADR-01 — PWA invece di app nativa:** scelta per distribuzione rapida e multi-device. *Vincolo*: le notifiche Web Push su iOS funzionano solo per PWA installata (iOS 16.4+); va comunicato all'utente in onboarding.
- **ADR-02 — Backend BaaS (Supabase):** accelera auth, multi-tenancy e realtime per la condivisione, evitando un backend custom nell'MVP. *Trade-off*: dipendenza dal vendor.
- **ADR-03 — Isolamento dati via Row-Level Security:** l'accesso ai farmaci è governato dalle policy RLS sull'appartenenza alle household; requisito di sicurezza non negoziabile per dati sanitari.
- **ADR-04 — Scansione con `BarcodeDetector` + fallback ZXing:** l'API nativa non è universale (assente su alcuni browser/iOS Safari), quindi il fallback `@zxing/library` è obbligatorio, non opzionale.
- **ADR-05 — Database farmaci da dataset AIFA:** va definito l'export di riferimento, il mapping EAN↔AIC e la strategia di fallback per le confezioni prive di EAN nel dataset pubblico, con possibilità di completamento manuale.

---

## Functional Requirements

### Inventario farmaci

- **RF-01:** L'utente può aggiungere un farmaco scansionando il codice a barre/codice AIC della confezione, con auto-compilazione di nome, principio attivo e formato dal database farmaci.
- **RF-02:** Se la scansione fallisce o il farmaco non è presente nel database, l'utente può inserirlo manualmente.
- **RF-03:** Per ogni farmaco l'utente registra data di scadenza, quantità/dosi disponibili e posizione (opzionale).
- **RF-04:** L'utente può modificare, consumare (decrementare le dosi) ed eliminare un farmaco dall'inventario.

### Scadenze e scorte

- **RF-05:** Il sistema avvisa l'utente quando un farmaco è prossimo alla scadenza, con soglia configurabile.
- **RF-06:** Il sistema avvisa quando le dosi residue scendono sotto una soglia, segnalando la necessità di riacquisto.
- **RF-07:** L'utente visualizza una dashboard con farmaci in scadenza, scorte basse e farmaci scaduti.

### Piano terapeutico

- **RF-08:** L'utente può definire un piano terapeutico per un farmaco (dose, frequenza, durata, orari).
- **RF-09:** Il sistema invia promemoria per l'assunzione delle dosi secondo il piano.
- **RF-10:** Ogni dose registrata come assunta decrementa automaticamente le scorte e proietta la data stimata di esaurimento.

### Farmacia condivisa (famiglia/rete)

- **RF-11:** L'utente può creare una farmacia condivisa (household) e invitare parenti/amici come membri.
- **RF-12:** I membri di una household vedono l'inventario condiviso e i farmaci disponibili.
- **RF-13:** Un utente può richiedere "in prestito" un farmaco disponibile presso una rete collegata (richiesta anti-spreco), e il membro proprietario può accettare o rifiutare.
- **RF-14:** Un caregiver può gestire farmaci e terapie per conto di altri membri della propria household.

### Account e accesso

- **RF-15:** Il sistema autentica gli utenti e garantisce che ciascun utente acceda solo alle household di cui è membro (isolamento dei dati).
- **RF-16:** L'utente può configurare le proprie preferenze di notifica (canali, soglie, orari).

---

## Non-Functional Requirements

### Security

- **Dati sanitari (GDPR):** i farmaci e le terapie sono dati relativi alla salute; trattamento conforme al GDPR con minimizzazione, consenso esplicito alla condivisione e possibilità di esportazione/cancellazione dei dati.
- **Isolamento multi-tenant:** ogni accesso ai dati è governato da Row-Level Security in base all'appartenenza alle household; nessun dato visibile fuori dalla propria rete.
- **Trasporto e archiviazione sicuri:** HTTPS obbligatorio, dati a riposo cifrati dal provider gestito, gestione sicura dei token di sessione e delle chiavi VAPID.
- **Condivisione consensuale:** la visibilità dei farmaci tra membri richiede invito e accettazione; il prestito richiede approvazione esplicita del proprietario.
- **Accessibilità come requisito:** caratteri grandi, contrasto adeguato e flussi a pochi tap per utenti a bassa competenza tecnica (persona Marco).

### Integrations

- **Database farmaci AIFA:** integrazione/import del dataset per il lookup AIC/EAN, con aggiornamenti periodici e fallback manuale per voci mancanti.
- **Web Push (VAPID):** notifiche push attraverso il service worker della PWA per scadenze, scorte e promemoria dosi.
- **Fotocamera del dispositivo:** accesso via browser per la scansione barcode (`BarcodeDetector` con fallback `@zxing/library`).

---

## Next Steps

1. **Backlog** - Esegui `/archetipo-spec` per trasformare questo PRD in un backlog
2. **Design** - Esegui `/archetipo-design` per i mockup UI (quando applicabile)
3. **Validazione** - Rivedi con gli stakeholder e testa le assunzioni più rischiose

---

_PRD generato tramite ARchetipo Product Inception - 2026-06-17_
_Sessione condotta da: Giacomo con il team ARchetipo_
