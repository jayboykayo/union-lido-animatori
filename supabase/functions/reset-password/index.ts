// supabase/functions/reset-password/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')!
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: caller } } = await userSupabase.auth.getUser()
    const { data: callerProfile } = await userSupabase
      .from('profiles').select('ruolo').eq('id', caller?.id).single()

    if (callerProfile?.ruolo !== 'moderatore') {
      return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 403, headers: corsHeaders })
    }

    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { userId, newPassword } = await req.json()

    // Reset password e rimetti primo_accesso a true
    const { error } = await adminSupabase.auth.admin.updateUserById(userId, { password: newPassword })
    if (error) throw error

    await adminSupabase.from('profiles').update({ primo_accesso: true }).eq('id', userId)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
