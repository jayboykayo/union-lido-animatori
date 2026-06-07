import { useEffect, useState } from 'react'
import { getAllProfiles, createUser, deleteUser, resetUserPassword, updateProfile } from '../lib/supabase'
import { Plus, Edit2, Trash2, KeyRound, X, Search, ChevronDown } from 'lucide-react'
import TipoBadge from '../components/layout/TipoBadge'
import LoadingSpinner from '../components/layout/LoadingSpinner'

const RUOLI = ['animatore', 'capo', 'moderatore']
const TIPI = ['Mascotte', 'Mini Club', 'Maxi Club', 'Sport Coach', 'Fitness Coach', 'Service']

const emptyForm = {
  nome: '', cognome: '', data_nascita: '', username: '',
  password: '', ruolo: 'animatore', tipo_animazione: 'Mini Club',
  numero_stanza: '', gruppo_cucina: '', data_inizio: '', data_fine: '', telefono: ''
}

export default function ModeratorePanel() {
  const [profili, setProfili] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [resetModal, setResetModal] = useState(null)
  const [newPw, setNewPw] = useState('')

  useEffect(() => { fetchProfili() }, [])

  const fetchProfili = async () => {
    setLoading(true)
    const { data } = await getAllProfiles()
    setProfili(data || [])
    setLoading(false)
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      nome: p.nome || '', cognome: p.cognome || '',
      data_nascita: p.data_nascita || '', username: p.username || '',
      password: '', ruolo: p.ruolo || 'animatore',
      tipo_animazione: p.tipo_animazione || 'Mini Club',
      numero_stanza: p.numero_stanza || '', gruppo_cucina: p.gruppo_cucina || '',
      data_inizio: p.data_inizio || '', data_fine: p.data_fine || '',
      telefono: p.telefono || ''
    })
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.nome.trim() || !form.cognome.trim()) { setError('Nome e cognome obbligatori'); return }
    if (!editing && (!form.username.trim() || !form.password)) { setError('Username e password obbligatori per i nuovi utenti'); return }
    setSaving(true)
    setError('')

    if (editing) {
      const { error } = await updateProfile(editing.id, {
        nome: form.nome, cognome: form.cognome, data_nascita: form.data_nascita || null,
        ruolo: form.ruolo, tipo_animazione: form.ruolo === 'animatore' ? form.tipo_animazione : null,
        numero_stanza: form.numero_stanza || null,
        gruppo_cucina: form.gruppo_cucina ? parseInt(form.gruppo_cucina) : null,
        data_inizio: form.data_inizio || null, data_fine: form.data_fine || null,
        telefono: form.telefono || null,
      })
      if (error) { setError('Errore: ' + error.message); setSaving(false); return }
    } else {
      const { error } = await createUser({
        username: form.username.trim().toLowerCase(),
        password: form.password,
        nome: form.nome, cognome: form.cognome,
        data_nascita: form.data_nascita || null,
        ruolo: form.ruolo,
        tipo_animazione: form.ruolo === 'animatore' ? form.tipo_animazione : null,
        numero_stanza: form.numero_stanza || null,
        gruppo_cucina: form.gruppo_cucina ? parseInt(form.gruppo_cucina) : null,
        data_inizio: form.data_inizio || null, data_fine: form.data_fine || null,
        telefono: form.telefono || null,
      })
      if (error) { setError('Errore: ' + (error.message || 'impossibile creare utente')); setSaving(false); return }
    }

    setSaving(false)
    setShowForm(false)
    fetchProfili()
  }

  const handleDelete = async (id, nome) => {
    if (!confirm(`Eliminare ${nome}? Questa azione è irreversibile.`)) return
    await deleteUser(id)
    fetchProfili()
  }

  const handleReset = async () => {
    if (!newPw || newPw.length < 8) return
    await resetUserPassword(resetModal.id, newPw)
    setResetModal(null)
    setNewPw('')
    alert('Password resettata con successo!')
  }

  const filtered = profili.filter(p =>
    `${p.nome} ${p.cognome} ${p.username}`.toLowerCase().includes(query.toLowerCase())
  )

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Moderatore</h1>
          <p className="text-sm text-gray-400 mt-0.5">{profili.length} utenti totali</p>
        </div>
        <button onClick={openCreate} className="btn-primary py-2.5 px-4 text-sm">
          <Plus size={16} /> Nuovo utente
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-10" placeholder="Cerca utente..." value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {/* Lista */}
      {loading ? <LoadingSpinner fullScreen={false} /> : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-mare-400 to-corallo-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{p.nome?.[0]}{p.cognome?.[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{p.nome} {p.cognome}</p>
                  <p className="text-xs text-gray-400 mt-0.5">@{p.username}</p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    <TipoBadge tipo={p.ruolo} size="xs" />
                    {p.tipo_animazione && <TipoBadge tipo={p.tipo_animazione} size="xs" />}
                    {p.numero_stanza && <span className="badge bg-gray-100 text-gray-500 text-[10px]">Stanza {p.numero_stanza}</span>}
                    {p.gruppo_cucina && <span className="badge bg-corallo-100 text-corallo-600 text-[10px]">Cucina {p.gruppo_cucina}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-mare-500 hover:bg-mare-50 rounded-lg transition">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => { setResetModal(p); setNewPw('') }} className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition">
                    <KeyRound size={15} />
                  </button>
                  <button onClick={() => handleDelete(p.id, `${p.nome} ${p.cognome}`)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {(p.data_inizio || p.telefono) && (
                <div className="mt-2.5 pt-2.5 border-t border-gray-50 flex gap-3 text-xs text-gray-400 flex-wrap">
                  {p.data_inizio && p.data_fine && <span>📅 {p.data_inizio} → {p.data_fine}</span>}
                  {p.telefono && <span>📞 {p.telefono}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form crea/modifica */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end overflow-hidden">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[92vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editing ? 'Modifica utente' : 'Nuovo utente'}</h2>
              <button onClick={() => setShowForm(false)}><X size={22} className="text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              {/* Nome e cognome */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Nome *</label>
                  <input className="input" value={form.nome} onChange={e => f('nome', e.target.value)} placeholder="Mario" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Cognome *</label>
                  <input className="input" value={form.cognome} onChange={e => f('cognome', e.target.value)} placeholder="Rossi" />
                </div>
              </div>

              {/* Username e password (solo creazione) */}
              {!editing && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Username *</label>
                    <input className="input" value={form.username} onChange={e => f('username', e.target.value)} placeholder="mario.rossi" autoCapitalize="none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Password temp. *</label>
                    <input type="text" className="input" value={form.password} onChange={e => f('password', e.target.value)} placeholder="Temporanea" />
                  </div>
                </div>
              )}

              {/* Data nascita */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Data di nascita</label>
                <input type="date" className="input" value={form.data_nascita} onChange={e => f('data_nascita', e.target.value)} />
              </div>

              {/* Ruolo */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Ruolo *</label>
                <div className="relative">
                  <select className="input appearance-none pr-10" value={form.ruolo} onChange={e => f('ruolo', e.target.value)}>
                    {RUOLI.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Tipo animazione */}
              {form.ruolo === 'animatore' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Tipo animazione</label>
                  <div className="relative">
                    <select className="input appearance-none pr-10" value={form.tipo_animazione} onChange={e => f('tipo_animazione', e.target.value)}>
                      {TIPI.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Stanza e gruppo cucina */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">N. Stanza</label>
                  <input className="input" value={form.numero_stanza} onChange={e => f('numero_stanza', e.target.value)} placeholder="42" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Gruppo cucina</label>
                  <input type="number" className="input" value={form.gruppo_cucina} onChange={e => f('gruppo_cucina', e.target.value)} placeholder="1" min="1" />
                </div>
              </div>

              {/* Periodo permanenza */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Inizio</label>
                  <input type="date" className="input" value={form.data_inizio} onChange={e => f('data_inizio', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Fine</label>
                  <input type="date" className="input" value={form.data_fine} onChange={e => f('data_fine', e.target.value)} />
                </div>
              </div>

              {/* Telefono */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Telefono</label>
                <input type="tel" className="input" value={form.telefono} onChange={e => f('telefono', e.target.value)} placeholder="+39 333 1234567" />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>
              )}

              <button onClick={handleSave} disabled={saving} className="btn-primary w-full mt-2">
                {saving
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : editing ? 'Salva modifiche' : 'Crea utente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal reset password */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Reset password</h2>
              <button onClick={() => setResetModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Imposta una nuova password temporanea per <strong>{resetModal.nome} {resetModal.cognome}</strong>.
              L'utente dovrà cambiarla al prossimo accesso.
            </p>
            <input
              type="text"
              className="input mb-4"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="Nuova password temporanea"
            />
            <button onClick={handleReset} disabled={newPw.length < 8} className="btn-primary w-full">
              <KeyRound size={16} /> Imposta password
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
