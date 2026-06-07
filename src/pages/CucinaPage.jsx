import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getTurniCucina, completaTurno, getAllProfiles } from '../lib/supabase'
import { format, isToday, isPast, startOfToday, addMonths, subMonths } from 'date-fns'
import { it } from 'date-fns/locale'
import { ChefHat, CheckCircle, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import LoadingSpinner from '../components/layout/LoadingSpinner'

export default function CucinaPage() {
  const { profile, user } = useAuth()
  const [mese, setMese] = useState(new Date())
  const [turni, setTurni] = useState([])
  const [colleghi, setColleghi] = useState([])
  const [loading, setLoading] = useState(true)

  const meseStr = format(mese, 'yyyy-MM')
  const meseLabel = format(mese, 'MMMM yyyy', { locale: it })

  useEffect(() => {
    if (profile?.gruppo_cucina) {
      fetchTurni()
      fetchColleghi()
    } else {
      setLoading(false)
    }
  }, [mese, profile])

  const fetchTurni = async () => {
    setLoading(true)
    const { data } = await getTurniCucina(profile.gruppo_cucina, meseStr)
    setTurni(data || [])
    setLoading(false)
  }

  const fetchColleghi = async () => {
    const { data } = await getAllProfiles()
    setColleghi(
      (data || []).filter(p => p.gruppo_cucina === profile?.gruppo_cucina && p.id !== user?.id)
    )
  }

  const handleCompleta = async (id) => {
    await completaTurno(id)
    fetchTurni()
  }

  const oggi = format(startOfToday(), 'yyyy-MM-dd')
  const turnoOggi = turni.find(t => t.data === oggi)
  const prossimo = turni.find(t => t.animatore_id === user?.id && t.data >= oggi && !t.completato)
  const miei = turni.filter(t => t.animatore_id === user?.id)

  if (!profile?.gruppo_cucina) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-8 text-center">
        <ChefHat size={48} className="text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">Non sei assegnato a nessun gruppo cucina.</p>
        <p className="text-gray-400 text-sm mt-1">Contatta il moderatore.</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <ChefHat size={22} className="text-corallo-500" />
          Cucina
        </h1>
        <div className="bg-corallo-100 text-corallo-700 font-bold text-sm px-3 py-1.5 rounded-xl">
          Gruppo {profile.gruppo_cucina}
        </div>
      </div>

      {/* Info gruppo */}
      {colleghi.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Il tuo gruppo cucina</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="bg-mare-50 text-mare-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              {profile.nome} {profile.cognome} (tu)
            </span>
            {colleghi.map(c => (
              <span key={c.id} className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                {c.nome} {c.cognome}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Banner oggi */}
      {turnoOggi && (
        <div className={`rounded-2xl p-4 ${
          turnoOggi.animatore_id === user?.id
            ? 'bg-gradient-to-r from-corallo-500 to-corallo-400 text-white'
            : 'bg-gray-100 text-gray-700'
        }`}>
          <p className="font-bold text-base">
            {turnoOggi.animatore_id === user?.id ? '🫧 Oggi tocca a te!' : '🍽️ Turno di oggi'}
          </p>
          <p className={`text-sm mt-0.5 ${turnoOggi.animatore_id === user?.id ? 'text-corallo-100' : 'text-gray-500'}`}>
            {turnoOggi.profiles?.nome} {turnoOggi.profiles?.cognome}
          </p>
          {turnoOggi.animatore_id === user?.id && !turnoOggi.completato && (
            <button
              onClick={() => handleCompleta(turnoOggi.id)}
              className="mt-3 bg-white text-corallo-600 font-semibold text-sm px-4 py-2 rounded-xl flex items-center gap-2 transition active:scale-95"
            >
              <CheckCircle size={16} />
              Segna come completato
            </button>
          )}
          {turnoOggi.completato && (
            <div className="mt-2 flex items-center gap-1.5 text-sm opacity-80">
              <CheckCircle size={16} />
              Completato ✓
            </div>
          )}
        </div>
      )}

      {/* Prossimo turno mio */}
      {prossimo && prossimo.data !== oggi && (
        <div className="card p-4 border-l-4 border-l-corallo-400">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Il tuo prossimo turno</p>
          <p className="font-bold text-gray-900 text-lg">
            {format(new Date(prossimo.data + 'T12:00:00'), "EEEE d MMMM", { locale: it })}
          </p>
        </div>
      )}

      {/* Calendario turni */}
      <div>
        {/* Nav mese */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setMese(m => subMonths(m, 1))} className="p-2 rounded-xl hover:bg-gray-100 transition">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h2 className="font-bold text-gray-800 capitalize">{meseLabel}</h2>
          <button onClick={() => setMese(m => addMonths(m, 1))} className="p-2 rounded-xl hover:bg-gray-100 transition">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {loading ? <LoadingSpinner fullScreen={false} /> : (
          <div className="space-y-2">
            {turni.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Nessun turno registrato per questo mese.
              </div>
            ) : (
              turni.map(t => {
                const isMio = t.animatore_id === user?.id
                const isOggi = t.data === oggi
                const passato = t.data < oggi
                return (
                  <div key={t.id} className={`card p-3 flex items-center gap-3 ${isMio ? 'border-corallo-200' : ''} ${isOggi ? 'ring-2 ring-corallo-400' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-center ${
                      isMio ? 'bg-corallo-100' : 'bg-gray-100'
                    }`}>
                      <span className={`font-bold text-sm ${isMio ? 'text-corallo-600' : 'text-gray-500'}`}>
                        {format(new Date(t.data + 'T12:00:00'), 'd')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${passato && !isOggi ? 'text-gray-400' : 'text-gray-800'}`}>
                        {t.profiles?.nome} {t.profiles?.cognome}
                        {isMio && <span className="text-corallo-500 ml-1 text-xs">(tu)</span>}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
                        {format(new Date(t.data + 'T12:00:00'), 'EEEE', { locale: it })}
                      </p>
                    </div>
                    {t.completato && (
                      <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                    )}
                    {isMio && isOggi && !t.completato && (
                      <button
                        onClick={() => handleCompleta(t.id)}
                        className="bg-corallo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition active:scale-95"
                      >
                        Fatto
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
