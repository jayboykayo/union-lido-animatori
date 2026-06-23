import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { getPrenotazioniLavatrice, creaPrenotazioneLavatrice, eliminaPrenotazioneLavatrice } from '../lib/supabase'
import { format, addDays, subDays, startOfToday } from 'date-fns'
import { it, enUS, de } from 'date-fns/locale'
import { WashingMachine, Plus, Trash2, X, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import LoadingSpinner from '../components/layout/LoadingSpinner'

const DATE_LOCALES = { it, en: enUS, de }

const PROGRAMMI = [
  { nome: 'Rapido', durata: 15 },
  { nome: 'Rapido 60min', durata: 60 },
  { nome: 'Capi scuri/Jeans', durata: 96 },
  { nome: 'Misti', durata: 105 },
  { nome: 'Sintetici', durata: 110 },
  { nome: 'Delicati/A mano', durata: 90 },
  { nome: 'Centrifuga/Scarico', durata: 15 },
  { nome: 'Antiallergico', durata: 197 },
  { nome: 'Risciacquo', durata: 30 },
  { nome: 'Lana', durata: 39 },
  { nome: 'Colorati', durata: 225 },
  { nome: 'Cotone 20°C', durata: 96 },
  { nome: 'Cotone (con pre lavaggio)', durata: 164 },
  { nome: 'Eco 40-60', durata: 208 },
  { nome: 'Cotone', durata: 230 },
]

function formatDurata(minuti) {
  const h = Math.floor(minuti / 60)
  const m = minuti % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default function LavatricePage() {
  const { user, profile } = useAuth()
  const { lang } = useLanguage()
  const dateLocale = DATE_LOCALES[lang] || it
  const [data, setData] = useState(startOfToday())
  const [prenotazioni, setPrenotazioni] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedLavatrice, setSelectedLavatrice] = useState('pia')
  const [selectedProgramma, setSelectedProgramma] = useState(PROGRAMMI[0])
  const [selectedOra, setSelectedOra] = useState('08:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const dataStr = format(data, 'yyyy-MM-dd')
  const dataLabel = format(data, "EEEE d MMMM yyyy", { locale: dateLocale })

  useEffect(() => { fetchPrenotazioni() }, [data])

  const fetchPrenotazioni = async () => {
    setLoading(true)
    const { data: rows } = await getPrenotazioniLavatrice(dataStr)
    setPrenotazioni(rows || [])
    setLoading(false)
  }

  const prenotazioniPia = prenotazioni.filter(p => p.lavatrice === 'pia')
  const prenotazioniMarghe = prenotazioni.filter(p => p.lavatrice === 'marghe')

  const isOverlapping = (lavatrice, inizioMinuti, fineMinuti) => {
    return prenotazioni
      .filter(p => p.lavatrice === lavatrice)
      .some(p => {
        const pInizio = timeToMinutes(format(new Date(p.inizio), 'HH:mm'))
        const pFine = timeToMinutes(format(new Date(p.fine), 'HH:mm'))
        return inizioMinuti < pFine && fineMinuti > pInizio
      })
  }

  const handleSave = async () => {
    setError('')
    const inizioMinuti = timeToMinutes(selectedOra)
    const fineMinuti = inizioMinuti + selectedProgramma.durata

    if (fineMinuti > 24 * 60) {
      setError('Il programma supera la mezzanotte. Scegli un orario precedente.')
      return
    }

    if (isOverlapping(selectedLavatrice, inizioMinuti, fineMinuti)) {
      setError('Questo orario si sovrappone con una prenotazione esistente!')
      return
    }

    setSaving(true)
    const inizio = new Date(`${dataStr}T${selectedOra}:00`)
    const fine = new Date(inizio.getTime() + selectedProgramma.durata * 60000)

    await creaPrenotazioneLavatrice({
      animatore_id: user.id,
      lavatrice: selectedLavatrice,
      programma: selectedProgramma.nome,
      durata_minuti: selectedProgramma.durata,
      inizio: inizio.toISOString(),
      fine: fine.toISOString(),
    })

    setSaving(false)
    setShowForm(false)
    fetchPrenotazioni()
  }

  const handleElimina = async (id, animatoreId) => {
    if (animatoreId !== user.id) return
    if (!confirm('Eliminare questa prenotazione?')) return
    await eliminaPrenotazioneLavatrice(id)
    fetchPrenotazioni()
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <WashingMachine size={22} className="text-mare-500" />
          Lavatrice
        </h1>
        <button onClick={() => { setShowForm(true); setError('') }} className="btn-primary py-2.5 px-4 text-sm">
          <Plus size={16} /> Prenota
        </button>
      </div>

      {/* Navigazione data */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-3 mb-5 flex items-center justify-between">
        <button onClick={() => setData(d => subDays(d, 1))} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="text-center">
          <p className="font-bold text-gray-900 dark:text-white capitalize text-sm">{dataLabel}</p>
          <button onClick={() => setData(startOfToday())} className="text-xs text-mare-500 font-medium mt-0.5">
            Torna a oggi
          </button>
        </div>
        <button onClick={() => setData(d => addDays(d, 1))} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {loading ? <LoadingSpinner fullScreen={false} /> : (
        <div className="space-y-5">
          {/* Lavatrice Pia */}
          <LavatriceSection
            nome="Lavatrice Pia"
            colore="blue"
            prenotazioni={prenotazioniPia}
            userId={user.id}
            onElimina={handleElimina}
          />
          {/* Lavatrice Marghe */}
          <LavatriceSection
            nome="Lavatrice Marghe"
            colore="purple"
            prenotazioni={prenotazioniMarghe}
            userId={user.id}
            onElimina={handleElimina}
          />
        </div>
      )}

      {/* Form prenotazione */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end overflow-hidden">
          <div className="bg-white dark:bg-gray-800 w-full rounded-t-3xl p-6 max-h-[92vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold dark:text-white">Nuova prenotazione</h2>
              <button onClick={() => setShowForm(false)}><X size={22} className="text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              {/* Scegli lavatrice */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Lavatrice</label>
                <div className="grid grid-cols-2 gap-2">
                  {['pia', 'marghe'].map(l => (
                    <button
                      key={l}
                      onClick={() => setSelectedLavatrice(l)}
                      className={`py-3 rounded-xl font-semibold text-sm transition ${selectedLavatrice === l ? 'bg-mare-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                    >
                      {l === 'pia' ? '🫧 Lavatrice Pia' : '🫧 Lavatrice Marghe'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ora inizio */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Ora di inizio</label>
                <input type="time" className="input" value={selectedOra} onChange={e => setSelectedOra(e.target.value)} />
              </div>

              {/* Programma */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Programma</label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {PROGRAMMI.map(p => (
                    <button
                      key={p.nome}
                      onClick={() => setSelectedProgramma(p)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition text-left ${selectedProgramma.nome === p.nome ? 'bg-mare-500 text-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                    >
                      <span className="font-medium text-sm">{p.nome}</span>
                      <span className={`text-xs font-semibold flex items-center gap-1 ${selectedProgramma.nome === p.nome ? 'text-mare-100' : 'text-gray-400'}`}>
                        <Clock size={12} />
                        {formatDurata(p.durata)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Riepilogo */}
              {selectedProgramma && (
                <div className="bg-mare-50 dark:bg-mare-900/20 rounded-xl p-4">
                  <p className="text-sm font-semibold text-mare-700 dark:text-mare-300">Riepilogo prenotazione</p>
                  <p className="text-sm text-mare-600 dark:text-mare-400 mt-1">
                    {selectedLavatrice === 'pia' ? 'Lavatrice Pia' : 'Lavatrice Marghe'} · {selectedProgramma.nome}
                  </p>
                  <p className="text-sm text-mare-600 dark:text-mare-400">
                    {selectedOra} → {minutesToTime(timeToMinutes(selectedOra) + selectedProgramma.durata)} ({formatDurata(selectedProgramma.durata)})
                  </p>
                </div>
              )}

              {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}

              <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
                {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Conferma prenotazione'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LavatriceSection({ nome, colore, prenotazioni, userId, onElimina }) {
  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  }
  const iconColor = colore === 'blue' ? 'text-blue-500' : 'text-purple-500'
  const badgeColor = colore === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'

  return (
    <div className={`rounded-2xl border p-4 ${colorMap[colore]}`}>
      <div className="flex items-center gap-2 mb-3">
        <WashingMachine size={18} className={iconColor} />
        <h2 className="font-bold text-gray-800 dark:text-white">{nome}</h2>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
          {prenotazioni.length} prenotazioni
        </span>
      </div>

      {prenotazioni.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-3">Nessuna prenotazione per oggi</p>
      ) : (
        <div className="space-y-2">
          {prenotazioni.map(p => {
            const isMia = p.animatore_id === userId
            const inizioStr = format(new Date(p.inizio), 'HH:mm')
            const fineStr = format(new Date(p.fine), 'HH:mm')
            return (
              <div key={p.id} className={`bg-white dark:bg-gray-800 rounded-xl p-3 flex items-center gap-3 ${isMia ? 'ring-2 ring-mare-400' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 dark:text-white text-sm">
                      {p.profiles?.nome} {p.profiles?.cognome}
                      {isMia && <span className="text-mare-500 ml-1 text-xs">(tu)</span>}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.programma}</p>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1 mt-0.5">
                    <Clock size={11} />
                    {inizioStr} → {fineStr} ({formatDurata(p.durata_minuti)})
                  </p>
                </div>
                {isMia && (
                  <button onClick={() => onElimina(p.id, p.animatore_id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}