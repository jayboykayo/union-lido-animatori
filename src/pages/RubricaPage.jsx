import { useEffect, useState } from 'react'
import { getAllProfiles } from '../lib/supabase'
import { useLanguage } from '../hooks/useLanguage'
import { Search, Phone, MessageCircle } from 'lucide-react'
import TipoBadge from '../components/layout/TipoBadge'
import LoadingSpinner from '../components/layout/LoadingSpinner'

const TIPI = ['Tutti', 'Mascotte', 'Mini Club', 'Sport Coach', 'Fitness Coach', 'Service']

export default function RubricaPage() {
  const { t } = useLanguage()
  const [profili, setProfili] = useState([])
  const [query, setQuery] = useState('')
  const [filtro, setFiltro] = useState('Tutti')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllProfiles().then(({ data }) => {
      setProfili((data || []).filter(p => p.ruolo === 'animatore' || p.ruolo === 'capo'))
      setLoading(false)
    })
  }, [])

  const filtrati = profili.filter(p => {
    const matchQuery = `${p.nome} ${p.cognome}`.toLowerCase().includes(query.toLowerCase())
    const matchFiltro = filtro === 'Tutti' || (p.tipi_animazione || []).includes(filtro)
    return matchQuery && matchFiltro
  })

  const grouped = TIPI.slice(1).reduce((acc, tipo) => {
    const list = filtrati.filter(p => (p.tipi_animazione || []).includes(tipo))
    if (list.length) acc[tipo] = list
    return acc
  }, {})

  const capi = filtrati.filter(p => p.ruolo === 'capo')

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <h1 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4">{t('rubricaTeam')}</h1>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" className="input pl-10" placeholder={t('cercaPerNome')} value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-5">
        {TIPI.map(tipo => (
          <button key={tipo} onClick={() => setFiltro(tipo)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition ${filtro === tipo ? 'bg-mare-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
            {tipo === 'Tutti' ? t('tutti') : tipo}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner fullScreen={false} /> : (
        <div className="space-y-6">
          {capi.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('capi')}</h2>
              <div className="space-y-2">{capi.map(p => <ProfileCard key={p.id} profilo={p} />)}</div>
            </section>
          )}
          {filtro === 'Tutti'
            ? Object.entries(grouped).map(([tipo, lista]) => (
              <section key={tipo}>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{tipo}</h2>
                <div className="space-y-2">{lista.map(p => <ProfileCard key={p.id} profilo={p} />)}</div>
              </section>
            ))
            : <div className="space-y-2">{filtrati.filter(p => p.ruolo === 'animatore').map(p => <ProfileCard key={p.id} profilo={p} />)}</div>
          }
          {filtrati.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Search size={36} className="mx-auto mb-3 opacity-30" />
              <p>{t('nessunoRisultato')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ProfileCard({ profilo: p }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-12 h-12 rounded-2xl flex-shrink-0 shadow-sm overflow-hidden">
        {p.avatar_url
          ? <img src={p.avatar_url} alt={p.nome} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-mare-400 to-corallo-400 flex items-center justify-center">
              <span className="text-white font-bold">{p.nome?.[0]}{p.cognome?.[0]}</span>
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 dark:text-white">{p.nome} {p.cognome}</p>
        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
          {(p.tipi_animazione || []).map(t => <TipoBadge key={t} tipo={t} size="xs" />)}
          {p.ruolo === 'capo' && <TipoBadge tipo="capo" size="xs" />}
        </div>
      </div>
      {p.telefono && (
        <div className="flex gap-1.5 flex-shrink-0">
          <a href={`tel:${p.telefono}`} className="w-9 h-9 bg-green-100 text-green-600 rounded-xl flex items-center justify-center active:scale-90 transition"><Phone size={17} /></a>
          <a href={`https://wa.me/${p.telefono?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-green-500 text-white rounded-xl flex items-center justify-center active:scale-90 transition"><MessageCircle size={17} /></a>
        </div>
      )}
    </div>
  )
}