import { useAuth } from '../hooks/useAuth'
import { format, differenceInYears } from 'date-fns'
import { it } from 'date-fns/locale'
import { User, BedDouble, Calendar, ChefHat, Phone, Shield } from 'lucide-react'
import TipoBadge from '../components/layout/TipoBadge'

export default function ProfiloPage() {
  const { profile } = useAuth()
  if (!profile) return null

  const eta = profile.data_nascita
    ? differenceInYears(new Date(), new Date(profile.data_nascita))
    : null

  const items = [
    { icon: User, label: 'Username', value: `@${profile.username || '—'}` },
    { icon: BedDouble, label: 'Stanza', value: profile.numero_stanza ? `Stanza ${profile.numero_stanza}` : '—' },
    { icon: Calendar, label: 'Permanenza', value: profile.data_inizio && profile.data_fine
        ? `${format(new Date(profile.data_inizio + 'T12:00:00'), 'd MMM', { locale: it })} → ${format(new Date(profile.data_fine + 'T12:00:00'), 'd MMM yyyy', { locale: it })}`
        : '—'
    },
    { icon: ChefHat, label: 'Gruppo cucina', value: profile.gruppo_cucina ? `Gruppo ${profile.gruppo_cucina}` : '—' },
    { icon: Phone, label: 'Telefono', value: profile.telefono || '—' },
    { icon: Shield, label: 'Ruolo', value: profile.ruolo },
  ]

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      {/* Avatar header */}
      <div className="flex flex-col items-center py-8 mb-4">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-mare-400 to-corallo-500 flex items-center justify-center shadow-lg mb-4">
          <span className="text-white font-extrabold text-3xl">
            {profile.nome?.[0]}{profile.cognome?.[0]}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">{profile.nome} {profile.cognome}</h1>
        {eta !== null && (
          <p className="text-gray-400 text-sm mt-1">{eta} anni</p>
        )}
        <div className="flex gap-2 mt-3 flex-wrap justify-center">
          {profile.tipo_animazione && <TipoBadge tipo={profile.tipo_animazione} />}
          {profile.ruolo !== 'animatore' && <TipoBadge tipo={profile.ruolo} />}
        </div>
      </div>

      {/* Dettagli */}
      <div className="card divide-y divide-gray-50">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 px-4 py-3.5">
            <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className="text-gray-800 font-semibold text-sm mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
