# US-004 — Registrazione e login con email (mockup)

Mockup statici delle schermate di autenticazione per la user story **US-004**
(Epic EP-001 — Autenticazione e Account). Pensati come riferimento visivo per
l'implementazione React 19 + Vite + TypeScript (PWA mobile-first) con **Supabase Auth**.

Le schermate riutilizzano il design system esistente importando direttamente
`../pharmamia-mvp/shared.css` (token colore, font Playfair Display + Plus Jakarta Sans,
teal `#0D7A6A`, sfondo `#ECF0FA`, scocca del telefono, raggi e ombre). Gli stili
specifici dell'autenticazione vivono in `auth.css`, senza toccare il design system.

## Schermate

| File | Schermata | Note |
|------|-----------|------|
| `login.html` | **Accesso** | Email + password, link "Password dimenticata?", link "Registrati", banner di errore "Credenziali errate". Toggle mostra/nascondi password. |
| `register.html` | **Registrazione** | Email, password con indicatore di robustezza e checklist regole, conferma password, validazione client. Banner "Email già registrata" con link all'accesso. |
| `verify-email.html` | **Controlla la tua email** | Stato post-registrazione: indirizzo email evidenziato, 3 step di conferma, bottone "Reinvia email" con cooldown 30s e toast di conferma. |
| `logout-menu.html` | **Menu account / logout** | Bottom sheet account come overlay sulla dashboard, con voce "Esci" che apre una modale di conferma logout. |

## Flussi dimostrati (cliccabili nel browser)

- **Login riuscito** → `login.html`: inserire una password diversa da `sbagliata` e premere "Accedi" → reindirizza alla dashboard `../pharmamia-mvp/index.html`.
- **Login fallito** → password `sbagliata` (precompilata) → mostra il banner "Credenziali errate".
- **Registrazione** → `register.html`: compilare i campi validi → reindirizza a `verify-email.html?email=...` (l'email viene mostrata nella schermata di verifica).
- **Email già registrata** → bottone demo in fondo al form → mostra il banner d'errore.
- **Reinvia email** → `verify-email.html`: bottone "Reinvia email" → toast + cooldown.
- **Logout** → `logout-menu.html`: voce "Esci" → modale di conferma → "Esci dall'account" reindirizza a `login.html`.

## Mappatura con i criteri di accettazione

- *Registrazione con email/password + mail di conferma* → `register.html` → `verify-email.html`.
- *Login con reindirizzamento alla home* → `login.html` → dashboard.
- *Logout con invalidazione sessione e ritorno al login* → `logout-menu.html` → `login.html`.
- *Route protette che reindirizzano al login* → comportamento lato app (router/guard), non visualizzato come schermata: il punto d'arrivo è sempre `login.html`.
- *Gestione errori con messaggi chiari* → banner "Credenziali errate" (login) e "Email già registrata" (registrazione), più errori di campo inline.

## Note di implementazione

- I mockup sono HTML/CSS/JS statici: il JavaScript serve solo a rendere navigabile il prototipo (toggle password, validazione fittizia, toast). Nessuna chiamata reale a Supabase.
- Le schermate di autenticazione non mostrano la bottom nav: usano un layout `auth-screen` centrato dentro la stessa scocca del telefono.
- Per visualizzarli: aprire i file `.html` direttamente nel browser.
