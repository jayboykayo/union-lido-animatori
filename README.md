# Union Lido Animatori 🌊

App PWA per la gestione del team animatori del Camping Union Lido.

## Stack
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Supabase (Auth, Database, Realtime, Edge Functions)
- **Hosting**: Vercel

---

## Setup completo passo per passo

### 1. Crea il progetto Supabase

1. Vai su [supabase.com](https://supabase.com) → **New project**
2. Dai un nome (es. `union-lido`) e scegli la regione più vicina (Europa)
3. Prendi nota di:
   - **Project URL**: `https://xxxx.supabase.co`
   - **Anon Key**: nella sezione *Settings → API*
   - **Service Role Key**: nella sezione *Settings → API* (tienila segreta!)

### 2. Esegui lo schema SQL

1. Nel pannello Supabase vai su **SQL Editor**
2. Incolla il contenuto di `supabase/migrations/001_schema.sql`
3. Clicca **Run**

### 3. Deploy delle Edge Functions

Installa la CLI di Supabase:
```bash
npm install -g supabase
supabase login
supabase link --project-ref TUO_PROJECT_REF
```

Deploya le funzioni:
```bash
supabase functions deploy create-user
supabase functions deploy delete-user
supabase functions deploy reset-password
supabase functions deploy genera-turni
```

Imposta i secrets per le funzioni (service role key):
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tua_service_role_key
```

### 4. Configura le variabili d'ambiente

Copia `.env.example` in `.env`:
```bash
cp .env.example .env
```

Compila con i tuoi valori:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tua_anon_key
```

### 5. Installa e avvia in sviluppo

```bash
npm install
npm run dev
```

### 6. Deploy su Vercel

1. Vai su [vercel.com](https://vercel.com) → **New Project**
2. Importa il repository GitHub
3. Aggiungi le variabili d'ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Clicca **Deploy**

---

## Crea il primo moderatore

Dopo il setup del DB, crea manualmente il primo account moderatore dal **SQL Editor** di Supabase:

```sql
-- 1. Crea l'utente auth
select auth.create_user(
  '{"email": "admin@unionlido.internal", "password": "TuaPasswordForte123!", "email_confirm": true}'::jsonb
);

-- 2. Prendi l'UUID appena creato
select id from auth.users where email = 'admin@unionlido.internal';

-- 3. Crea il profilo (sostituisci l'UUID)
insert into public.profiles (id, username, nome, cognome, ruolo, primo_accesso)
values (
  'UUID-QUI',
  'admin',
  'Admin',
  'Moderatore',
  'moderatore',
  false  -- il moderatore non deve cambiare password al primo accesso
);
```

Poi accedi con `username: admin` e la password che hai scelto.

---

## Genera i turni cucina

Dal pannello Moderatore, oppure direttamente dall'app (se implementato il pulsante),
chiama la edge function `genera-turni` con il mese desiderato:

```bash
curl -X POST https://xxxx.supabase.co/functions/v1/genera-turni \
  -H "Authorization: Bearer TOKEN_MODERATORE" \
  -H "Content-Type: application/json" \
  -d '{"mese": "2026-07"}'
```

---

## Struttura file

```
union-lido/
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── AppLayout.jsx       # Layout principale con nav
│   │       ├── LoadingSpinner.jsx
│   │       └── TipoBadge.jsx
│   ├── hooks/
│   │   ├── useAuth.jsx             # Context auth
│   │   └── useRealtime.js          # Hook Supabase Realtime
│   ├── lib/
│   │   └── supabase.js             # Client + helpers
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── CambioPasswordPage.jsx
│   │   ├── HomePage.jsx            # Dashboard
│   │   ├── ProgrammaPage.jsx       # Programma giornaliero
│   │   ├── ChatPage.jsx            # Chat realtime
│   │   ├── CucinaPage.jsx          # Turni cucina
│   │   ├── RubricaPage.jsx         # Rubrica team
│   │   ├── AnnunciPage.jsx         # Bacheca
│   │   ├── CompleanniPage.jsx
│   │   ├── ProfiloPage.jsx
│   │   └── ModeratorePanel.jsx     # Admin panel
│   ├── styles/
│   │   └── global.css
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   ├── functions/
│   │   ├── create-user/
│   │   ├── delete-user/
│   │   ├── reset-password/
│   │   └── genera-turni/
│   └── migrations/
│       └── 001_schema.sql
├── index.html
├── vite.config.js
├── tailwind.config.js
└── vercel.json
```

---

## Ruoli e permessi

| Funzionalità | Animatore | Capo | Moderatore |
|---|---|---|---|
| Vedere programma proprio | ✅ | ✅ | ✅ |
| Creare/modificare attività | ❌ | ✅ | ✅ |
| Pubblicare programma | ❌ | ✅ | ✅ |
| Chat gruppo generale | ✅ | ✅ | ✅ |
| Chat gruppo tipo | Solo il proprio | ✅ | ✅ |
| Chat privata | ✅ | ✅ | ✅ |
| Pubblicare annunci | ❌ | ✅ | ✅ |
| Gestire utenti | ❌ | ❌ | ✅ |
| Generare turni cucina | ❌ | ✅ | ✅ |
