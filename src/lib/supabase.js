import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Mancano le variabili d\'ambiente Supabase. Copia .env.example in .env e compila i valori.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

// ─── Auth helpers ────────────────────────────────────────────
export const signIn = (username, password) =>
  supabase.auth.signInWithPassword({ email: `${username}@unionlido.internal`, password })

export const signOut = () => supabase.auth.signOut()

export const changePassword = (newPassword) =>
  supabase.auth.updateUser({ password: newPassword })

// ─── Profile helpers ─────────────────────────────────────────
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export const getAllProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('cognome')
  return { data, error }
}

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// ─── Admin: create user ───────────────────────────────────────
export const createUser = async (userData) => {
  // Uses Supabase admin API via edge function (see supabase/functions/create-user)
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: userData,
  })
  return { data, error }
}

export const deleteUser = async (userId) => {
  const { data, error } = await supabase.functions.invoke('delete-user', {
    body: { userId },
  })
  return { data, error }
}

export const resetUserPassword = async (userId, newPassword) => {
  const { data, error } = await supabase.functions.invoke('reset-password', {
    body: { userId, newPassword },
  })
  return { data, error }
}

// ─── Attività ─────────────────────────────────────────────────
export const getAttivitaGiorno = async (data, animatoreId, ruolo) => {
  if (ruolo === 'animatore') {
    const { data: rows, error } = await supabase
      .from('attivita')
      .select(`*, attivita_assegnazioni!inner(animatore_id)`)
      .eq('data', data)
      .eq('pubblicato', true)
      .eq('attivita_assegnazioni.animatore_id', animatoreId)
      .order('ora_inizio')
    return { data: rows, error }
  } else {
    const { data: rows, error } = await supabase
      .from('attivita')
      .select(`*, attivita_assegnazioni(animatore_id, profiles(nome, cognome))`)
      .eq('data', data)
      .order('ora_inizio')
    return { data: rows, error }
  }
}

export const createAttivita = async (attivita) => {
  const { data, error } = await supabase
    .from('attivita')
    .insert(attivita)
    .select()
    .single()
  return { data, error }
}

export const updateAttivita = async (id, updates) => {
  const { data, error } = await supabase
    .from('attivita')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export const deleteAttivita = async (id) => {
  const { error } = await supabase.from('attivita').delete().eq('id', id)
  return { error }
}

export const assegnaAnimatori = async (attivitaId, animatoreIds) => {
  const rows = animatoreIds.map((id) => ({ attivita_id: attivitaId, animatore_id: id }))
  const { error } = await supabase.from('attivita_assegnazioni').insert(rows)
  return { error }
}

export const pubblicaAttivita = async (data) => {
  const { error } = await supabase
    .from('attivita')
    .update({ pubblicato: true })
    .eq('data', data)
  return { error }
}

// ─── Turni cucina ─────────────────────────────────────────────
export const getTurniCucina = async (gruppoCucina, mese) => {
  const inizio = `${mese}-01`
  const fine = `${mese}-31`
  const { data, error } = await supabase
    .from('turni_cucina')
    .select(`*, profiles(nome, cognome)`)
    .eq('gruppo_cucina', gruppoCucina)
    .gte('data', inizio)
    .lte('data', fine)
    .order('data')
  return { data, error }
}

export const generaTurniMese = async (mese) => {
  const { data, error } = await supabase.functions.invoke('genera-turni', {
    body: { mese },
  })
  return { data, error }
}

export const completaTurno = async (id) => {
  const { data, error } = await supabase
    .from('turni_cucina')
    .update({ completato: true })
    .eq('id', id)
  return { data, error }
}

// ─── Messaggi ─────────────────────────────────────────────────
export const getMessaggiGruppo = async (gruppo, limit = 50) => {
  const { data, error } = await supabase
    .from('messaggi')
    .select(`*, profiles:mittente_id(nome, cognome)`)
    .eq('gruppo', gruppo)
    .is('destinatario_id', null)
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data: data?.reverse(), error }
}

export const getMessaggiPrivati = async (userId, altroUserId, limit = 50) => {
  const { data, error } = await supabase
    .from('messaggi')
    .select(`*, profiles:mittente_id(nome, cognome)`)
    .or(
      `and(mittente_id.eq.${userId},destinatario_id.eq.${altroUserId}),and(mittente_id.eq.${altroUserId},destinatario_id.eq.${userId})`
    )
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data: data?.reverse(), error }
}

export const inviaMessaggio = async (msg) => {
  const { data, error } = await supabase.from('messaggi').insert(msg).select().single()
  return { data, error }
}

export const getUnreadCount = async (userId) => {
  const { count, error } = await supabase
    .from('messaggi')
    .select('*', { count: 'exact', head: true })
    .eq('destinatario_id', userId)
    .eq('letto', false)
  return { count, error }
}

export const segnaLetti = async (userId, mittentId) => {
  const { error } = await supabase
    .from('messaggi')
    .update({ letto: true })
    .eq('destinatario_id', userId)
    .eq('mittente_id', mittentId)
  return { error }
}

// ─── Annunci ──────────────────────────────────────────────────
export const getAnnunci = async (limit = 10) => {
  const { data, error } = await supabase
    .from('annunci')
    .select(`*, profiles:autore_id(nome, cognome)`)
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data, error }
}

export const creaAnnuncio = async (annuncio) => {
  const { data, error } = await supabase.from('annunci').insert(annuncio).select().single()
  return { data, error }
}

export const eliminaAnnuncio = async (id) => {
  const { error } = await supabase.from('annunci').delete().eq('id', id)
  return { error }
}

// ─── Compleanni ───────────────────────────────────────────────
export const getCompleannioOggi = async () => {
  const oggi = new Date()
  const mese = String(oggi.getMonth() + 1).padStart(2, '0')
  const giorno = String(oggi.getDate()).padStart(2, '0')
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, cognome, data_nascita')
    .like('data_nascita', `%-${mese}-${giorno}`)
  return { data, error }
}

export const getAllCompleanni = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, cognome, data_nascita, avatar_url')
    .not('data_nascita', 'is', null)
    .order('data_nascita')
  return { data, error }
}
// ─── Avatar ───────────────────────────────────────────────────
export const uploadAvatar = async (userId, file) => {
  const ext = file.name.split('.').pop()
  const path = `${userId}.${ext}`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })
  if (error) return { error }
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: data.publicUrl })
    .eq('id', userId)
  return { url: data.publicUrl, error: updateError }
}

export const getAvatarUrl = (userId, ext = 'png') => {
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${userId}.${ext}`)
  return data.publicUrl
}
// ─── Notifiche ────────────────────────────────────────────────
export const sendNotification = async (title, message) => {
  const { data, error } = await supabase.functions.invoke('send-notification', {
    body: { title, message },
  })
  return { data, error }
}