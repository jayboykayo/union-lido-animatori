import { useEffect, useState } from 'react'
import { getAllCompleanni } from '../lib/supabase'
import { format, differenceInYears } from 'date-fns'
import { it } from 'date-fns/locale'
import { Cake } from 'lucide-react'
import LoadingSpinner from '../components/layout/LoadingSpinner'

function sortByBirthday(profiles) {
  const today = new Date()
  const todayMD = today.getMonth() * 100 + today.getDate()
  return [...profiles].sort((a, b) => {
    const da = new Date(a.data_nascita)
    const db = new Date(b.data_nascita)
    const aMD = da.getMonth() * 100 + da.getDate()
    const bMD = db.getMonth() * 100 + db.getDate()
    const aVal = aMD >= todayMD ? aMD : aMD + 1200
    const bVal = bMD >= todayMD ? bMD : bMD + 1200
    return aVal - bVal
  })
}

export default function CompleanniPage() {
  const [profili, setProfili] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllCompleanni().then(({ data }) => {
      setProfili(sortByBirthday(data || []))
      setLoading(false)
    })
  }, [])

  const oggi = new Date()
  const todayMM = String(oggi.getMonth() + 1).padStart(2, '0')
  const todayDD = String(oggi.getDate()).padStart(2, '0')

  const isToday = (dataNascita) => {
    if (!dataNascita) return false
    const [, mm, dd] = dataNascita.split('-')
    return mm === todayMM && dd === todayDD
  }

  const isThisMonth = (dataNascita) => {
    if (!dataNascita) return false
    const [, mm] = dataNascita.split('-')
    return mm === todayMM
  }

  const eta = (dataNascita) => differenceInYears(oggi, new Date(dataNascita))

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <h1 className="text-xl font-extrabold text-gray-900 mb-5 flex items-center gap-2">
        <Cake size={22} className="text-pink-500" />
        Compleanni del team
      </h1>

      {loading ? <LoadingSpinner fullScreen={false} /> : (
        <div className="space-y-2">
          {profili.map(p => {
            const oggi_ = isToday(p.data_nascita)
            const mese = isThisMonth(p.data_nascita)
            const dataNascita = new Date(p.data_nascita + 'T12:00:00')
            const mmdd = format(dataNascita, 'd MMMM', { locale: it })
            return (
              <div key={p.id} className={`card p-4 flex items-center gap-3 ${oggi_ ? 'border-pink-300 bg-pink-50/50' : ''}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${oggi_ ? 'bg-pink-500' : 'bg-gradient-to-br from-mare-400 to-corallo-400'}`}>
                  {oggi_
                    ? <span className="text-2xl">🎂</span>
                    : <span className="text-white font-bold">{p.nome?.[0]}{p.cognome?.[0]}</span>
                  }
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">{p.nome} {p.cognome}</p>
                    {oggi_ && (
                      <span className="bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce-gentle">
                        OGGI! 🎉
                      </span>
                    )}
                    {mese && !oggi_ && (
                      <span className="bg-pink-100 text-pink-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Questo mese
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-0.5 capitalize">
                    {mmdd} · {eta(p.data_nascita)} anni
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
