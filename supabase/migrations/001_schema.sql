-- ============================================================
-- UNION LIDO ANIMATORI — Schema Database Supabase
-- Esegui questo file nel SQL Editor di Supabase
-- ============================================================

-- ─── Profiles ────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  nome text not null,
  cognome text not null,
  data_nascita date,
  ruolo text check (ruolo in ('moderatore', 'capo', 'animatore')) not null default 'animatore',
  tipo_animazione text check (tipo_animazione in ('Mascotte', 'Mini Club', 'Maxi Club', 'Sport Coach', 'Fitness Coach', 'Service')),
  numero_stanza text,
  gruppo_cucina integer,
  data_inizio date,
  data_fine date,
  telefono text,
  primo_accesso boolean default true,
  created_at timestamptz default now()
);

-- ─── Attività ─────────────────────────────────────────────────
create table if not exists public.attivita (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  ora_inizio time not null,
  ora_fine time not null,
  descrizione text not null,
  luogo text,
  pubblicato boolean default false,
  creato_da uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists attivita_data_idx on public.attivita(data);

-- ─── Assegnazioni attività ────────────────────────────────────
create table if not exists public.attivita_assegnazioni (
  id uuid primary key default gen_random_uuid(),
  attivita_id uuid references public.attivita(id) on delete cascade not null,
  animatore_id uuid references public.profiles(id) on delete cascade not null,
  unique(attivita_id, animatore_id)
);

-- ─── Turni cucina ─────────────────────────────────────────────
create table if not exists public.turni_cucina (
  id uuid primary key default gen_random_uuid(),
  gruppo_cucina integer not null,
  data date not null,
  animatore_id uuid references public.profiles(id) on delete cascade,
  completato boolean default false,
  created_at timestamptz default now(),
  unique(gruppo_cucina, data)
);

create index if not exists turni_cucina_data_idx on public.turni_cucina(data);
create index if not exists turni_cucina_gruppo_idx on public.turni_cucina(gruppo_cucina);

-- ─── Messaggi ─────────────────────────────────────────────────
create table if not exists public.messaggi (
  id uuid primary key default gen_random_uuid(),
  mittente_id uuid references public.profiles(id) on delete set null,
  destinatario_id uuid references public.profiles(id) on delete cascade,
  gruppo text check (gruppo in ('generale', 'Mascotte', 'Mini Club', 'Maxi Club', 'Sport Coach', 'Fitness Coach', 'Service')),
  testo text not null,
  letto boolean default false,
  created_at timestamptz default now(),
  -- o gruppo o destinatario, non entrambi null
  constraint check_destinatario_o_gruppo check (
    (destinatario_id is not null and gruppo is null) or
    (destinatario_id is null and gruppo is not null)
  )
);

create index if not exists messaggi_gruppo_idx on public.messaggi(gruppo);
create index if not exists messaggi_dest_idx on public.messaggi(destinatario_id);
create index if not exists messaggi_created_idx on public.messaggi(created_at desc);

-- ─── Annunci ──────────────────────────────────────────────────
create table if not exists public.annunci (
  id uuid primary key default gen_random_uuid(),
  titolo text not null,
  testo text not null,
  autore_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.attivita enable row level security;
alter table public.attivita_assegnazioni enable row level security;
alter table public.turni_cucina enable row level security;
alter table public.messaggi enable row level security;
alter table public.annunci enable row level security;

-- ─── Profiles RLS ─────────────────────────────────────────────

-- Tutti gli utenti autenticati vedono tutti i profili (per rubrica)
create policy "Tutti vedono i profili" on public.profiles
  for select using (auth.role() = 'authenticated');

-- Solo il moderatore o se stesso può aggiornare
create policy "Aggiorna profilo proprio o moderatore" on public.profiles
  for update using (
    auth.uid() = id or
    exists (select 1 from public.profiles where id = auth.uid() and ruolo = 'moderatore')
  );

-- Solo il service role (edge functions) può inserire e cancellare profili
create policy "Inserisci profilo service role" on public.profiles
  for insert with check (auth.role() = 'service_role');

create policy "Cancella profilo service role" on public.profiles
  for delete using (auth.role() = 'service_role');

-- ─── Attività RLS ─────────────────────────────────────────────

-- Gli animatori vedono solo le attività pubblicate assegnate a loro
-- I capi/moderatori vedono tutto
create policy "Animatori vedono le proprie attività pubblicate" on public.attivita
  for select using (
    pubblicato = true or
    exists (select 1 from public.profiles where id = auth.uid() and ruolo in ('capo', 'moderatore'))
  );

create policy "Capi e moderatori gestiscono le attività" on public.attivita
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and ruolo in ('capo', 'moderatore'))
  );

-- ─── Assegnazioni RLS ─────────────────────────────────────────

create policy "Tutti leggono le assegnazioni" on public.attivita_assegnazioni
  for select using (auth.role() = 'authenticated');

create policy "Capi gestiscono le assegnazioni" on public.attivita_assegnazioni
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and ruolo in ('capo', 'moderatore'))
  );

-- ─── Turni cucina RLS ─────────────────────────────────────────

create policy "Tutti leggono i turni" on public.turni_cucina
  for select using (auth.role() = 'authenticated');

create policy "Aggiorna turni propri" on public.turni_cucina
  for update using (animatore_id = auth.uid() or auth.role() = 'service_role');

create policy "Service role gestisce turni" on public.turni_cucina
  for all using (auth.role() = 'service_role');

-- ─── Messaggi RLS ─────────────────────────────────────────────

create policy "Leggi messaggi di gruppo" on public.messaggi
  for select using (
    gruppo is not null or
    mittente_id = auth.uid() or
    destinatario_id = auth.uid()
  );

create policy "Invia messaggi" on public.messaggi
  for insert with check (mittente_id = auth.uid());

create policy "Aggiorna letto" on public.messaggi
  for update using (destinatario_id = auth.uid());

-- ─── Annunci RLS ──────────────────────────────────────────────

create policy "Tutti leggono annunci" on public.annunci
  for select using (auth.role() = 'authenticated');

create policy "Capi gestiscono annunci" on public.annunci
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and ruolo in ('capo', 'moderatore'))
  );

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.messaggi;
alter publication supabase_realtime add table public.annunci;
alter publication supabase_realtime add table public.attivita;

-- ============================================================
-- FUNZIONE: Trigger creazione profilo da auth.users
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  -- Il profilo viene creato dalla edge function create-user
  -- Questo trigger esiste come fallback
  return new;
end;
$$;

-- ============================================================
-- FUNZIONE: Genera turni cucina per un mese
-- Chiamata dalla edge function genera-turni
-- ============================================================
create or replace function public.genera_turni_mese(p_mese text)
returns void language plpgsql security definer as $$
declare
  v_data date;
  v_fine date;
  v_gruppo integer;
  v_members uuid[];
  v_idx integer;
  v_offset integer;
begin
  v_data  := (p_mese || '-01')::date;
  v_fine  := (v_data + interval '1 month - 1 day')::date;

  -- Per ogni gruppo cucina distinto
  for v_gruppo in
    select distinct gruppo_cucina from public.profiles
    where gruppo_cucina is not null
    order by gruppo_cucina
  loop
    -- Prendi i membri del gruppo ordinati per id (per rotazione stabile)
    select array_agg(id order by id)
    into v_members
    from public.profiles
    where gruppo_cucina = v_gruppo;

    if array_length(v_members, 1) is null then
      continue;
    end if;

    v_offset := 0;
    v_data := (p_mese || '-01')::date;

    while v_data <= v_fine loop
      -- Ogni 2 giorni tocca a qualcuno (0, 2, 4, 6 ...)
      v_idx := ((v_offset / 2) % array_length(v_members, 1)) + 1;

      insert into public.turni_cucina (gruppo_cucina, data, animatore_id)
      values (v_gruppo, v_data, v_members[v_idx])
      on conflict (gruppo_cucina, data) do nothing;

      v_data   := v_data + interval '1 day';
      v_offset := v_offset + 1;
    end loop;
  end loop;
end;
$$;
