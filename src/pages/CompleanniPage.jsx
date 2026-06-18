import { useEffect, useState } from 'react'
import { getAllCompleanni } from '../lib/supabase'
import { useLanguage } from '../hooks/useLanguage'
import { format, differenceInYears } from 'date-fns'
import { it, enUS, de } from 'date-fns/locale'
import { Cake } from 'lucide-react'
import LoadingSpinner from '../components/layout/LoadingSpinner'

const DATE_LOCALES = { it, en: enUS, de }

function getNextBirthday(dataNascita) {
  const oggi = new Date()
  const nascita = new Date(dataNascita + 'T12:00:00')
  const thisYear = new Date(oggi.getFullYear(), nascita.getMonth(), nascita.getDate())
  if (thisYear >= oggi) return thisYear
  return new Date(oggi.getFullYear() + 1, nascita.getMonth(), nascita.getDate())
}

function sortByBirthday(profiles) {
  return [...profiles].sort((a, b) => getNextBirthday(a.data_nascita) - getNextBirthday(b.data_nascita))
}

export default function CompleanniPage() {
  const { t, lang } = useLanguage()
  const [profili, setProfili] = useState([])
  const [loading, setLoading] = useState(true)
  const dateLocale = DATE_LOCALES[lang] || it

  useEffect(() => {
    getAllCompleanni().then(({ data }) => {
      try {
        const conData = (data || []).filter(p => !!p.data_nascita)
        setProfili(sortByBirthday(conData))
      } catch (e) { console.error(e) }
      setLoading(false)
    })
  }, [])

  const oggi = new Date()
  const todayMM = String(oggi.getMonth() + 1).padStart(2, '0')
  const todayDD = String(oggi.getDate()).padStart(2, '0')

  const isToday = (d) => { if (!d) return false; const p = d.split('-'); return p[1] === todayMM && p[2] === todayDD }
  const isThisMonth = (d) => { if (!d) return false; return d.split('-')[1] === todayMM }
  const eta = (d) => { try { return differenceInYears(oggi, new Date(d)) } catch { return '?' } }

  const getCountdown = (dataNascita) => {
    const now = new Date(); now.setHours(0,0,0,0)
    const next = getNextBirthday(dataNascita); next.setHours(0,0,0,0)
    const diff = Math.round((next - now) / (1000 * 60 * 60 * 24))
    if (diff === 0) return t('oggi')
    if (diff === 1) return t('domani')
    return `${t('tra')} ${diff} ${t('giorni')}`
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <h1 className="text-xl font-extrabold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
        <Cake size={22} className="text-pink-500" />
        {t('compleanniTeamTitle')}
      </h1>

      {loading ? <LoadingSpinner fullScreen={false} /> : profili.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Cake size={36} className="mx-auto mb-3 opacity-30" />
          <p>{t('nessunoCompleanno')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {profili.map(p => {
            const oggiFlag = isToday(p.data_nascita)
            const meseFlag = isThisMonth(p.data_nascita)
            const countdown = getCountdown(p.data_nascita)
            let mmdd = ''
            try { mmdd = format(new Date(p.data_nascita + 'T12:00:00'), 'd MMMM', { locale: dateLocale }) }
            catch { mmdd = p.data_nascita }

            return (
              <div key={p.id} className={`card p-4 flex items-center gap-3 ${oggiFlag ? 'border-pink-300 bg-pink-50/50 dark:bg-pink-900/20' : ''}`}>
                <div className="w-14 h-14 rounded-2xl flex-shrink-0 overflow-hidden shadow-sm">
                  {p.avatar_url
                    ? <img src={p.avatar_url} alt={p.nome} className="w-full h-full object-cover" />
                    : <div className={`w-full h-full flex items-center justify-center ${oggiFlag ? 'bg-pink-500' : 'bg-gradient-to-br from-mare-400 to-corallo-400'}`}>
                        {oggiFlag ? <span className="text-2xl">🎂</span> : <span className="text-white font-bold text-lg">{p.nome?.[0]}{p.cognome?.[0]}</span>}
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 dark:text-white">{p.nome} {p.cognome}</p>
                    {oggiFlag && <span className="bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce-gentle">{t('oggi')}</span>}
                    {meseFlag && !oggiFlag && <span className="bg-pink-100 text-pink-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">{t('questoMese')}</span>}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 capitalize">
                    {mmdd} · {t('compie')} {eta(p.data_nascita) + (oggiFlag ? 0 : 1)} {t('anni')}
                  </p>
                  <p className={`text-xs font-medium mt-1 ${oggiFlag ? 'text-pink-500' : 'text-mare-500'}`}>{countdown}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}