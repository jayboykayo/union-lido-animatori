import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  getAttivitaGiorno, getAllProfiles, createAttivita,
  updateAttivita, deleteAttivita, assegnaAnimatori, pubblicaAttivita
} from '../lib/supabase'
import { format, addDays, subDays, startOfToday } from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Send, CheckCircle } from 'lucide-react'
import LoadingSpinner from '../components/layout/LoadingSpinner'
import TipoBadge from '../components/layout/TipoBadge'

export default function ProgrammaPage() {
  const { profile, user, isCapo } = useAuth()
  const [data, setData] = useState(startOfToday())
  const [attivita, setAttivita] = useState([])
  const [animatori, setAnimatori] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const dataStr = format(data, 'yyyy-MM-dd')
  const dataLabel = format(data, "EEEE d MMMM yyyy", { locale: it })
  const isPubblicato = attivita.some(a => a.pubblicato)

  useEffect(() => { fetchAll() }, [data])

  useEffect(() => {
    if (isCapo) fetchAnimatori()
  }, [isCapo])

  const fetchAll = async () => {
    setLoading(true)
    const { data: rows } = await getAttivitaGiorno(dataStr, user?.id, profile?.ruolo)
    setAttivita(rows || [])
    setLoading(false)
  }

  const fetchAnimatori = async () => {
    const { data } = await getAllProfiles()
    setAnimatori((data || []).filter(p => p.ruolo === 'animatore'))
  }

  const handlePubblica = async () => {
    await pubblicaAttivita(dataStr)
    fetchAll()
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header navigazione data */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-4 sticky top-14 z-20">
        <div className="flex items-center justify-between">
          <button onClick={() => setData(d => subDays(d, 1))} className="p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition">
            <ChevronLeft size={22} className="text-gray-600" />
          </button>
          <div className="text-center">
            <p className="font-bold text-gray-900 dark:text-white capitalize text-sm">{dataLabel}</p>
            <button
              onClick={() => setData(startOfToday())}
              className="text-xs text-mare-500 font-medium mt-0.5"
            >
              Torna a oggi
            </button>
          </div>
          <button onClick={() => setData(d => addDays(d, 1))} className="p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition">
            <ChevronRight size={22} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Actions capo */}
        {isCapo && (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(null); setShowForm(true) }}
              className="btn-primary flex-1 py-2.5"
            >
              <Plus size={18} />
              Aggiungi attività
            </button>
            {attivita.length > 0 && !isPubblicato && (
              <button onClick={handlePubblica} className="btn-coral px-4 py-2.5">
                <Send size={16} />
                Pubblica
              </button>
            )}
            {isPubblicato && (
              <div className="flex items-center gap-1.5 px-3 text-green-600 bg-green-50 rounded-xl border border-green-200 text-sm font-medium">
                <CheckCircle size={16} />
                Pubblicato
              </div>
            )}
          </div>
        )}

        {/* Lista attività */}
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : attivita.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🌴</p>
            <p className="text-gray-500 font-medium">Nessuna attività per questo giorno</p>
            {!isCapo && <p className="text-gray-400 text-sm mt-1">Goditi il tempo libero!</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {attivita.map((a) => (
              <AttivitaCard
                key={a.id}
                attivita={a}
                isCapo={isCapo}
                onEdit={() => { setEditing(a); setShowForm(true) }}
                onDelete={() => handleDelete(a.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <AttivitaForm
          editing={editing}
          dataStr={dataStr}
          animatori={animatori}
          userId={user?.id}
          onSave={() => { setShowForm(false); setEditing(null); fetchAll() }}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )

  async function handleDelete(id) {
    if (!confirm('Eliminare questa attività?')) return
    await deleteAttivita(id)
    fetchAll()
  }
}

function AttivitaCard({ attivita: a, isCapo, onEdit, onDelete }) {
  const assegnati = a.attivita_assegnazioni || []
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="bg-mare-50 rounded-xl px-3 py-2 text-center min-w-[60px] flex-shrink-0">
          <p className="text-mare-700 font-bold text-sm">{a.ora_inizio?.slice(0, 5)}</p>
          <div className="w-full h-px bg-mare-200 my-1" />
          <p className="text-mare-400 text-xs">{a.ora_fine?.slice(0, 5)}</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800">{a.descrizione}</p>
          {a.luogo && <p className="text-gray-400 text-sm mt-0.5">📍 {a.luogo}</p>}
          {!a.pubblicato && isCapo && (
            <span className="inline-block mt-1.5 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
              Non pubblicato
            </span>
          )}
          {assegnati.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {assegnati.map(aa => (
                <span key={aa.animatore_id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {aa.profiles?.nome} {aa.profiles?.cognome}
                </span>
              ))}
            </div>
          )}
        </div>
        {isCapo && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button onClick={onEdit} className="p-2 text-gray-400 hover:text-mare-500 hover:bg-mare-50 rounded-lg transition">
              <Edit2 size={16} />
            </button>
            <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AttivitaForm({ editing, dataStr, animatori, userId, onSave, onClose }) {
  const [form, setForm] = useState({
    ora_inizio: editing?.ora_inizio?.slice(0, 5) || '09:00',
    ora_fine: editing?.ora_fine?.slice(0, 5) || '10:00',
    descrizione: editing?.descrizione || '',
    luogo: editing?.luogo || '',
  })
  const [selAnimatori, setSelAnimatori] = useState(
    editing?.attivita_assegnazioni?.map(a => a.animatore_id) || []
  )
  const [saving, setSaving] = useState(false)

  const toggleAnimatore = (id) => {
    setSelAnimatori(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSave = async () => {
    if (!form.descrizione.trim()) return
    setSaving(true)
    if (editing) {
      await updateAttivita(editing.id, { ...form, ora_inizio: form.ora_inizio + ':00', ora_fine: form.ora_fine + ':00' })
    } else {
      const { data } = await createAttivita({
        ...form,
        ora_inizio: form.ora_inizio + ':00',
        ora_fine: form.ora_fine + ':00',
        data: dataStr,
        creato_da: userId,
        pubblicato: false,
      })
      if (data && selAnimatori.length) await assegnaAnimatori(data.id, selAnimatori)
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            {editing ? 'Modifica attività' : 'Nuova attività'}
          </h2>
          <button onClick={onClose} className="text-gray-400 p-1">✕</button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Inizio</label>
              <input type="time" className="input" value={form.ora_inizio} onChange={e => setForm(f => ({ ...f, ora_inizio: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Fine</label>
              <input type="time" className="input" value={form.ora_fine} onChange={e => setForm(f => ({ ...f, ora_fine: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Attività *</label>
            <input className="input" placeholder="Es. Tornei in piscina" value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Luogo</label>
            <input className="input" placeholder="Es. Piscina principale" value={form.luogo} onChange={e => setForm(f => ({ ...f, luogo: e.target.value }))} />
          </div>

          {!editing && animatori.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Assegna animatori</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {animatori.map(a => (
                  <label key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-mare-500 rounded"
                      checked={selAnimatori.includes(a.id)}
                      onChange={() => toggleAnimatore(a.id)}
                    />
                    <span className="flex-1 font-medium text-sm">{a.nome} {a.cognome}</span>
                    <TipoBadge tipo={a.tipo_animazione} size="xs" />
                  </label>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full mt-2">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editing ? 'Salva modifiche' : 'Crea attività'}
          </button>
        </div>
      </div>
    </div>
  )
}
