// supabase/functions/create-user/index.ts
// Chiamata dal moderatore per creare un nuovo utente auth + profilo
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verifica che il chiamante sia un moderatore
    const authHeader = req.headers.get('Authorization')!
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: caller } } = await userSupabase.auth.getUser()
    if (!caller) return new Response(JSON.stringify({ error: 'Non autenticato' }), { status: 401, headers: corsHeaders })

    const { data: callerProfile } = await userSupabase
      .from('profiles').select('ruolo').eq('id', caller.id).single()

    if (callerProfile?.ruolo !== 'moderatore') {
      return new Response(JSON.stringify({ error: 'Solo il moderatore può creare utenti' }), { status: 403, headers: corsHeaders })
    }

    // Usa service role per creare l'utente
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    const {
      username, password, nome, cognome, data_nascita, ruolo,
      tipo_animazione, numero_stanza, gruppo_cucina,
      data_inizio, data_fine, telefono
    } = body

    // Crea utente auth con email fake interna
    const email = `${username}@unionlido.internal`
    const { data: newUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) throw authError

    // Crea profilo
    const { error: profileError } = await adminSupabase.from('profiles').insert({
      id: newUser.user.id,
      username,
      nome,
      cognome,
      data_nascita: data_nascita || null,
      ruolo,
      tipo_animazione: ruolo === 'animatore' ? tipo_animazione : null,
      numero_stanza: numero_stanza || null,
      gruppo_cucina: gruppo_cucina ? parseInt(gruppo_cucina) : null,
      data_inizio: data_inizio || null,
      data_fine: data_fine || null,
      telefono: telefono || null,
      primo_accesso: true,
    })

    if (profileError) {
      // Rollback: elimina l'utente auth
      await adminSupabase.auth.admin.deleteUser(newUser.user.id)
      throw profileError
    }

    return new Response(JSON.stringify({ success: true, userId: newUser.user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
