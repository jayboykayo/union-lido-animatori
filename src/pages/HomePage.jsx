import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import {
  getCompleannioOggi, getAnnunci, getAttivitaGiorno, getTurniCucina
} from '../lib/supabase'
import { format } from 'date-fns'
import { it, enUS, de } from 'date-fns/locale'
import { Cake, Megaphone, CalendarDays, ChefHat, ChevronRight, Sun } from 'lucide-react'
import TipoBadge from '../components/layout/TipoBadge'
import LoadingSpinner from '../components/layout/LoadingSpinner'

const DATE_LOCALES = { it, en: enUS, de }

export default function HomePage() {
  const { profile, user } = useAuth()
  const { t, lang } = useLanguage()
  const [compleanni, setCompleanni] = useState([])
  const [annunci, setAnnunci] = useState([])
  const [attivita, setAttivita] = useState([])
  const [prossimoCucina, setProssimoCucina] = useState(null)
  const [loading, setLoading] = useState(true)

  const dateLocale = DATE_LOCALES[lang] || it
  const oggi = format(new Date(), 'yyyy-MM-dd')
  const oggiLabel = format(new Date(), "EEEE d MMMM", { locale: dateLocale })

  useEffect(() => {
    if (!profile) return
    Promise.all([
      fetchCompleanni(),
      fetchAnnunci(),
      fetchAttivita(),
      fetchCucina(),
    ]).finally(() => setLoading(false))
  }, [profile])

  const fetchCompleanni = async () => {
    const { data } = await getCompleannioOggi()
    setCompleanni(data || [])
  }

  const fetchAnnunci = async () => {
    const { data } = await getAnnunci(3)
    setAnnunci(data || [])
  }

  const fetchAttivita = async () => {
    if (!user) return
    const { data } = await getAttivitaGiorno(oggi, user.id, profile.ruolo)
    setAttivita((data || []).slice(0, 3))
  }

  const fetchCucina = async () => {
    if (!profile.gruppo_cucina) return
    const mese = format(new Date(), 'yyyy-MM')
    const { data } = await getTurniCucina(profile.gruppo_cucina, mese)
    if (!data) return
    const prossimo = data.find(t =>
      t.animatore_id === user.id && t.data >= oggi && !t.completato
    )
    setProssimoCucina(prossimo)
  }

  const ora = new Date().getHours()
  const saluto = ora < 12 ? t('buongiorno') : ora < 18 ? t('buonPomeriggio') : t('buonasera')

  if (loading) return <LoadingSpinner fullScreen={false} />

  return (
    <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
      {/* Header saluto */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Sun size={14} />
            <span className="capitalize">{oggiLabel}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
            {saluto}, <br />
            <span className="text-mare-600">{profile?.nome}!</span>
          </h1>
          {profile?.tipi_animazione?.length > 0 && (
            <div className="mt-2 flex gap-1 flex-wrap">
              {profile.tipi_animazione.map(tipo => (
                <TipoBadge key={tipo} tipo={tipo} />
              ))}
            </div>
          )}
        </div>
        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt={profile.nome} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-mare-400 to-corallo-400 flex items-center justify-center">
                <span className="text-2xl font-black text-white">
                  {profile?.nome?.[0]}{profile?.cognome?.[0]}
                </span>
              </div>
          }
        </div>
      </div>

      {/* Banner compleanno */}
      {compleanni.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500 to-corallo-500 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="text-3xl animate-bounce-gentle">🎂</div>
            <div>
              <p className="text-white font-bold text-base">
                {compleanni.map(c => `${c.nome} ${c.cognome}`).join(', ')}
              </p>
              <p className="text-pink-100 text-sm">
                {compleanni.length === 1 ? t('festeggia') : t('festeggiano')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Programma oggi */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <CalendarDays size={18} className="text-mare-500" />
            {t('programmaDiOggi')}
          </h2>
          <Link to="/programma" className="text-mare-500 text-sm font-medium flex items-center gap-1">
            {t('vediTutto')} <ChevronRight size={16} />
          </Link>
        </div>
        {attivita.length === 0 ? (
          <div className="card p-5 text-center text-gray-400 text-sm">
            {t('nessuna_attivita')}
          </div>
        ) : (
          <div className="space-y-2">
            {attivita.map((a) => (
              <div key={a.id} className="card p-4 flex items-center gap-3">
                <div className="bg-mare-50 dark:bg-mare-900/30 rounded-xl px-3 py-2 text-center min-w-[56px]">
                  <p className="text-mare-700 dark:text-mare-300 font-bold text-sm leading-none">
                    {a.ora_inizio?.slice(0, 5)}
                  </p>
                  <p className="text-mare-400 text-[10px] mt-0.5">
                    {a.ora_fine?.slice(0, 5)}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-white truncate">{a.descrizione}</p>
                  {a.luogo && <p className="text-gray-400 text-sm truncate">📍 {a.luogo}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Prossimo turno cucina */}
      {profile?.gruppo_cucina && (
        <section>
          <Link to="/cucina" className="card p-4 flex items-center gap-4 active:scale-98 transition">
            <div className="w-12 h-12 bg-corallo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <ChefHat size={24} className="text-corallo-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 dark:text-white">{t('turnoCucina')}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                {prossimoCucina
                  ? `${t('prossimoTurno')}: ${format(new Date(prossimoCucina.data + 'T12:00:00'), 'd MMM', { locale: dateLocale })}`
                  : t('nessunTurno')}
              </p>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </Link>
        </section>
      )}

      {/* Ultimi annunci */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Megaphone size={18} className="text-corallo-500" />
            {t('annunciTitle')}
          </h2>
          <Link to="/annunci" className="text-mare-500 text-sm font-medium flex items-center gap-1">
            {t('tutti')} <ChevronRight size={16} />
          </Link>
        </div>
        {annunci.length === 0 ? (
          <div className="card p-5 text-center text-gray-400 text-sm">
            {t('nessunAnnuncio')}
          </div>
        ) : (
          <div className="space-y-2">
            {annunci.map((a) => (
              <div key={a.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-800 dark:text-white flex-1">{a.titolo}</h3>
                  <span className="text-gray-400 text-xs flex-shrink-0 mt-0.5">
                    {format(new Date(a.created_at), 'd MMM', { locale: dateLocale })}
                  </span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5 line-clamp-2">{a.testo}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {t('di')} {a.profiles?.nome} {a.profiles?.cognome}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Compleanni */}
      <section>
        <Link to="/compleanni" className="card p-4 flex items-center gap-4 active:scale-98 transition">
          <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Cake size={24} className="text-pink-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800 dark:text-white">{t('compeanniTeam')}</p>
            <p className="text-gray-400 text-sm mt-0.5">{t('scopriChiFesteggia')}</p>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </Link>
      </section>
    </div>
  )
}