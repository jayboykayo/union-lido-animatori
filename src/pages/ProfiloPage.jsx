import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { format, differenceInYears } from 'date-fns'
import { it, enUS, de } from 'date-fns/locale'
import { User, BedDouble, Calendar, ChefHat, Phone, Shield } from 'lucide-react'
import TipoBadge from '../components/layout/TipoBadge'

const DATE_LOCALES = { it, en: enUS, de }

export default function ProfiloPage() {
  const { profile } = useAuth()
  const { t, lang } = useLanguage()
  const dateLocale = DATE_LOCALES[lang] || it
  if (!profile) return null

  const eta = profile.data_nascita ? differenceInYears(new Date(), new Date(profile.data_nascita)) : null

  const items = [
    { icon: User, label: t('username'), value: `@${profile.username || '—'}` },
    { icon: BedDouble, label: t('stanza'), value: profile.numero_stanza ? `${t('stanza')} ${profile.numero_stanza}` : '—' },
    { icon: Calendar, label: t('permanenza'), value: profile.data_inizio && profile.data_fine
        ? `${format(new Date(profile.data_inizio + 'T12:00:00'), 'd MMM', { locale: dateLocale })} → ${format(new Date(profile.data_fine + 'T12:00:00'), 'd MMM yyyy', { locale: dateLocale })}`
        : '—'
    },
    { icon: ChefHat, label: t('gruppoCucina'), value: profile.gruppo_cucina ? `${t('gruppo')} ${profile.gruppo_cucina}` : '—' },
    { icon: Phone, label: t('telefono'), value: profile.telefono || '—' },
    { icon: Shield, label: t('ruolo'), value: profile.ruolo },
  ]

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <div className="flex flex-col items-center py-8 mb-4">
        <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-lg mb-4">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.nome} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-mare-400 to-corallo-500 flex items-center justify-center">
                <span className="text-white font-extrabold text-3xl">{profile.nome?.[0]}{profile.cognome?.[0]}</span>
              </div>
          }
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{profile.nome} {profile.cognome}</h1>
        {eta !== null && <p className="text-gray-400 text-sm mt-1">{eta} {t('anni')}</p>}
        <div className="flex gap-2 mt-3 flex-wrap justify-center">
          {(profile.tipi_animazione || []).map(tipo => <TipoBadge key={tipo} tipo={tipo} />)}
          {profile.ruolo !== 'animatore' && <TipoBadge tipo={profile.ruolo} />}
        </div>
      </div>

      <div className="card divide-y divide-gray-50 dark:divide-gray-700">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 px-4 py-3.5">
            <div className="w-9 h-9 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className="text-gray-800 dark:text-white font-semibold text-sm mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}