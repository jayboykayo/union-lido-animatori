import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getAnnunci, creaAnnuncio, eliminaAnnuncio } from '../lib/supabase'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Megaphone, Plus, Trash2, X } from 'lucide-react'
import LoadingSpinner from '../components/layout/LoadingSpinner'

export default function AnnunciPage() {
  const { isCapo, user } = useAuth()
  const [annunci, setAnnunci] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titolo: '', testo: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAnnunci() }, [])

  const fetchAnnunci = async () => {
    setLoading(true)
    const { data } = await getAnnunci(30)
    setAnnunci(data || [])
    setLoading(false)
  }

  const handleCrea = async () => {
    if (!form.titolo.trim() || !form.testo.trim()) return
    setSaving(true)
    await creaAnnuncio({ ...form, autore_id: user.id })
    setForm({ titolo: '', testo: '' })
    setShowForm(false)
    setSaving(false)
    fetchAnnunci()
  }

  const handleElimina = async (id) => {
    if (!confirm('Eliminare questo annuncio?')) return
    await eliminaAnnuncio(id)
    fetchAnnunci()
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <Megaphone size={22} className="text-corallo-500" />
          Annunci
        </h1>
        {isCapo && (
          <button onClick={() => setShowForm(true)} className="btn-primary py-2 px-4 text-sm">
            <Plus size={16} /> Nuovo
          </button>
        )}
      </div>

      {loading ? <LoadingSpinner fullScreen={false} /> : annunci.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Megaphone size={40} className="mx-auto mb-3 opacity-20" />
          <p>Nessun annuncio</p>
        </div>
      ) : (
        <div className="space-y-3">
          {annunci.map(a => (
            <div key={a.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h2 className="font-bold text-gray-900">{a.titolo}</h2>
                  <p className="text-gray-500 text-sm mt-1.5 leading-relaxed whitespace-pre-wrap">{a.testo}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-gray-400">
                      {a.profiles?.nome} {a.profiles?.cognome}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(a.created_at), "d MMM 'alle' HH:mm", { locale: it })}
                    </span>
                  </div>
                </div>
                {isCapo && (
                  <button
                    onClick={() => handleElimina(a.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nuovo annuncio */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Nuovo annuncio</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 p-1"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Titolo *</label>
                <input className="input" placeholder="Es. Riunione domani mattina" value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Testo *</label>
                <textarea className="input resize-none" rows={4} placeholder="Scrivi l'annuncio..." value={form.testo} onChange={e => setForm(f => ({ ...f, testo: e.target.value }))} />
              </div>
              <button onClick={handleCrea} disabled={saving} className="btn-coral w-full">
                {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Pubblica annuncio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
