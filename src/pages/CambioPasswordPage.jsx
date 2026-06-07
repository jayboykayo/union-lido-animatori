import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword, updateProfile } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function CambioPasswordPage() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (pw1.length < 8) { setError('La password deve essere di almeno 8 caratteri.'); return }
    if (pw1 !== pw2) { setError('Le password non coincidono.'); return }

    setLoading(true)
    setError('')

    const { error: pwError } = await changePassword(pw1)
    if (pwError) { setError('Errore nel cambio password: ' + pwError.message); setLoading(false); return }

    // Segna primo accesso come completato
    await updateProfile(user.id, { primo_accesso: false })
    await refreshProfile()
    navigate('/')
  }

  const strength = pw1.length === 0 ? 0 : pw1.length < 6 ? 1 : pw1.length < 10 ? 2 : 3
  const strengthLabel = ['', 'Debole', 'Buona', 'Ottima']
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-green-500']

  return (
    <div className="min-h-screen bg-gradient-to-br from-mare-500 to-corallo-500 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mb-3">
            <KeyRound size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Benvenuto!</h1>
          <p className="text-mare-100 mt-1 text-sm">
            Scegli una nuova password per il tuo account
          </p>
        </div>

        <div className="card p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Nuova password
              </label>
              <div className="relative">
                <input
                  type={show1 ? 'text' : 'password'}
                  className="input pr-12"
                  value={pw1}
                  onChange={(e) => setPw1(e.target.value)}
                  placeholder="Minimo 8 caratteri"
                  required
                />
                <button type="button" onClick={() => setShow1(!show1)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1">
                  {show1 ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {pw1 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${strength >= i ? strengthColor[strength] : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strength === 1 ? 'text-red-500' : strength === 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {strengthLabel[strength]}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Conferma password
              </label>
              <div className="relative">
                <input
                  type={show2 ? 'text' : 'password'}
                  className="input pr-12"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  placeholder="Ripeti la password"
                  required
                />
                <button type="button" onClick={() => setShow2(!show2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1">
                  {show2 ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {pw2 && pw1 === pw2 && (
                  <CheckCircle size={18} className="absolute right-10 top-1/2 -translate-y-1/2 text-green-500" />
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Imposta password e accedi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
