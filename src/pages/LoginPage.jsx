import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../lib/supabase'
import { Waves, Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) return
    setLoading(true)
    setError('')

    const { error } = await signIn(username.trim().toLowerCase(), password)

    if (error) {
      setError('Username o password errati.')
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-fuchsia-600 to-orange-400 flex flex-col">
      {/* Header decorativo */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur rounded-3xl mb-4 animate-bounce-gentle">
              <Waves size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Union Lido
            </h1>
            <p className="text-mare-100 mt-1 font-medium">Team Animatori</p>
          </div>

          {/* Form card */}
          <div className="card p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Accedi</h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="mario.rossi"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input pr-12"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                  >
                    {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    Accedi
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-mare-100 text-sm mt-6">
            Per accedere contatta il tuo capo o il moderatore.
          </p>
        </div>
      </div>

      {/* Footer onde */}
      <div className="text-center text-white/40 text-xs pb-8">
        © {new Date().getFullYear()} Union Lido · Camping Village
      </div>
    </div>
  )
}
