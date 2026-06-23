import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import {
  getMessaggiGruppo, getMessaggiPrivati, inviaMessaggio, getAllProfiles,
  segnaLetti, sendNotification, uploadChatFoto, toggleFissaMessaggio, getMessaggiFissati
} from '../lib/supabase'
import { useRealtime } from '../hooks/useRealtime'
import { format } from 'date-fns'
import { it, enUS, de } from 'date-fns/locale'
import { Send, ChevronLeft, Users, User, Image, Pin, PinOff, X } from 'lucide-react'
import TipoBadge from '../components/layout/TipoBadge'

const GRUPPI_BASE = ['generale', 'Mascotte', 'Mini Club', 'Sport Coach', 'Fitness Coach', 'Service']
const DATE_LOCALES = { it, en: enUS, de }

export default function ChatPage() {
  const { profile, user } = useAuth()
  const { t } = useLanguage()
  const [view, setView] = useState('list')
  const [activeChat, setActiveChat] = useState(null)
  const [animatori, setAnimatori] = useState([])

  useEffect(() => {
    getAllProfiles().then(({ data }) => setAnimatori((data || []).filter(p => p.id !== user?.id)))
  }, [])

  const gruppoCucina = profile?.gruppo_cucina ? `cucina-${profile.gruppo_cucina}` : null

  const openGroup = (gruppo, label) => {
    setActiveChat({ type: 'group', id: gruppo, label })
    setView('group')
  }

  const openPrivate = (animatore) => {
    setActiveChat({ type: 'private', id: animatore.id, label: `${animatore.nome} ${animatore.cognome}`, tipo: animatore.tipo_animazione })
    setView('private')
  }

  if (view !== 'list') {
    return <ChatWindow chat={activeChat} userId={user?.id} profile={profile} onBack={() => setView('list')} />
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <h1 className="text-xl font-extrabold text-gray-900 dark:text-white mb-5">{t('chat')}</h1>

      <div className="mb-6">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('gruppi')}</h2>
        <div className="space-y-2">
          {GRUPPI_BASE.filter(g => g === 'generale' || (profile?.tipi_animazione || []).includes(g) || profile?.ruolo !== 'animatore').map(gruppo => (
            <button key={gruppo} onClick={() => openGroup(gruppo, gruppo === 'generale' ? `🌊 ${t('tuttiGliAnimatori')}` : gruppo)} className="card w-full p-4 flex items-center gap-3 active:scale-98 transition text-left">
              <div className="w-11 h-11 bg-mare-100 dark:bg-mare-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-mare-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 dark:text-white">{gruppo === 'generale' ? t('tuttiGliAnimatori') : gruppo}</p>
                <p className="text-gray-400 text-xs mt-0.5">{gruppo === 'generale' ? t('gruppoGenerale') : t('gruppoTipo')}</p>
              </div>
              <ChevronLeft size={18} className="text-gray-300 rotate-180" />
            </button>
          ))}

          {/* Gruppo cucina */}
          {gruppoCucina && (
            <button onClick={() => openGroup(gruppoCucina, `🍳 Cucina gruppo ${profile.gruppo_cucina}`)} className="card w-full p-4 flex items-center gap-3 active:scale-98 transition text-left">
              <div className="w-11 h-11 bg-corallo-100 dark:bg-corallo-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-corallo-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 dark:text-white">Cucina gruppo {profile.gruppo_cucina}</p>
                <p className="text-gray-400 text-xs mt-0.5">Chat del tuo gruppo cucina</p>
              </div>
              <ChevronLeft size={18} className="text-gray-300 rotate-180" />
            </button>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('messaggiPrivati')}</h2>
        <div className="space-y-2">
          {animatori.map(a => (
            <button key={a.id} onClick={() => openPrivate(a)} className="card w-full p-4 flex items-center gap-3 active:scale-98 transition text-left">
              <div className="w-11 h-11 bg-gradient-to-br from-mare-400 to-corallo-400 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{a.nome?.[0]}{a.cognome?.[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 dark:text-white">{a.nome} {a.cognome}</p>
                {(a.tipi_animazione || []).map(tipo => <TipoBadge key={tipo} tipo={tipo} size="xs" />)}
              </div>
              <ChevronLeft size={18} className="text-gray-300 rotate-180" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ChatWindow({ chat, userId, profile, onBack }) {
  const { t, lang } = useLanguage()
  const [messaggi, setMessaggi] = useState([])
  const [fissati, setFissati] = useState([])
  const [showFissati, setShowFissati] = useState(false)
  const [testo, setTesto] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const dateLocale = DATE_LOCALES[lang] || it

  useEffect(() => {
    fetchMessages()
    if (chat.type === 'group') fetchFissati()
    if (chat.type === 'private') segnaLetti(userId, chat.id)
  }, [chat])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messaggi])

  const fetchMessages = async () => {
    setLoading(true)
    const res = chat.type === 'group' ? await getMessaggiGruppo(chat.id) : await getMessaggiPrivati(userId, chat.id)
    setMessaggi(res.data || [])
    setLoading(false)
  }

  const fetchFissati = async () => {
    const { data } = await getMessaggiFissati(chat.id)
    setFissati(data || [])
  }

  useRealtime(
    `chat-${chat.type}-${chat.id}`,
    chat.type === 'group' ? { column: 'gruppo', value: chat.id } : null,
    (newMsg) => {
      if (chat.type === 'private') {
        const isRelevant = (newMsg.mittente_id === userId && newMsg.destinatario_id === chat.id) || (newMsg.mittente_id === chat.id && newMsg.destinatario_id === userId)
        if (!isRelevant) return
      }
      setMessaggi(prev => [...prev, newMsg])
    }
  )

  const handleSend = async () => {
    const text = testo.trim()
    if (!text || sending) return
    setSending(true)
    const msg = {
      mittente_id: userId, testo: text,
      ...(chat.type === 'group' ? { gruppo: chat.id, destinatario_id: null } : { destinatario_id: chat.id, gruppo: null }),
    }
    await inviaMessaggio(msg)
    if (chat.type === 'private') await sendNotification(`Nuovo messaggio da ${profile?.nome}`, text)
    setTesto('')
    setSending(false)
  }

  const handleFotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingFoto(true)
    const { url, error } = await uploadChatFoto(file)
    if (!error && url) {
      const msg = {
        mittente_id: userId, testo: '', immagine_url: url,
        ...(chat.type === 'group' ? { gruppo: chat.id, destinatario_id: null } : { destinatario_id: chat.id, gruppo: null }),
      }
      await inviaMessaggio(msg)
    }
    setUploadingFoto(false)
    e.target.value = ''
  }

  const handlePin = async (msg) => {
    const nuovoStato = !msg.fissato
    if (nuovoStato && fissati.length >= 5) {
      alert('Puoi fissare al massimo 5 messaggi/foto per gruppo. Rimuovi un pin per aggiungerne uno nuovo.')
      return
    }
    await toggleFissaMessaggio(msg.id, nuovoStato)
    setMessaggi(prev => prev.map(m => m.id === msg.id ? { ...m, fissato: nuovoStato } : m))
    fetchFissati()
  }

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }
  const grouped = groupByDate(messaggi, dateLocale)

  return (
    <div className="flex flex-col h-[calc(100vh-116px)]">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"><ChevronLeft size={22} /></button>
        <div className="w-9 h-9 bg-gradient-to-br from-mare-400 to-corallo-400 rounded-xl flex items-center justify-center flex-shrink-0">
          {chat.type === 'group' ? <Users size={16} className="text-white" /> : <User size={16} className="text-white" />}
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900 dark:text-white text-sm">{chat.label}</p>
          {chat.tipo && <TipoBadge tipo={chat.tipo} size="xs" />}
        </div>
        {chat.type === 'group' && fissati.length > 0 && (
          <button onClick={() => setShowFissati(true)} className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold px-2.5 py-1.5 rounded-xl">
            <Pin size={13} /> {fissati.length}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-mare-200 border-t-mare-500 rounded-full animate-spin" />
          </div>
        ) : messaggi.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">💬</p>
            <p className="text-sm">{t('nessunoMessaggio')}<br />{t('siiIlPrimo')}</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400 font-medium px-2 capitalize">{date}</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="space-y-1">
                {msgs.map((m, i) => {
                  const isMine = m.mittente_id === userId
                  const showName = !isMine && (i === 0 || msgs[i - 1]?.mittente_id !== m.mittente_id)
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>
                      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                        {showName && !isMine && <p className="text-xs text-gray-400 mb-1 ml-1 font-medium">{m.profiles?.nome} {m.profiles?.cognome}</p>}
                        <div className="relative">
                          {m.immagine_url ? (
                            <img
                              src={m.immagine_url}
                              alt="foto chat"
                              className="rounded-2xl max-w-[220px] max-h-[280px] object-cover shadow-sm cursor-pointer"
                              onClick={() => window.open(m.immagine_url, '_blank')}
                            />
                          ) : (
                            <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? 'bg-mare-500 text-white rounded-br-sm' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm rounded-bl-sm border border-gray-100 dark:border-gray-600'}`}>
                              {m.testo}
                            </div>
                          )}
                          {chat.type === 'group' && (
                            <button
                              onClick={() => handlePin(m)}
                              className={`absolute -top-2 ${isMine ? '-left-2' : '-right-2'} w-6 h-6 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition ${m.fissato ? 'bg-yellow-400 text-white opacity-100' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300'}`}
                            >
                              {m.fissato ? <Pin size={12} /> : <PinOff size={12} />}
                            </button>
                          )}
                        </div>
                        <p className={`text-[10px] text-gray-400 mt-0.5 ${isMine ? 'mr-1' : 'ml-1'}`}>{format(new Date(m.created_at), 'HH:mm')}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 py-3 flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFoto}
          className="w-11 h-11 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-2xl flex items-center justify-center flex-shrink-0 active:scale-95 transition"
        >
          {uploadingFoto ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Image size={18} />}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
        <textarea
          className="flex-1 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-mare-400 max-h-28 min-h-[44px]"
          placeholder={t('scriviMessaggio')} value={testo} onChange={e => setTesto(e.target.value)} onKeyDown={handleKey} rows={1}
        />
        <button onClick={handleSend} disabled={!testo.trim() || sending} className="w-11 h-11 bg-mare-500 disabled:bg-gray-300 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0">
          <Send size={18} />
        </button>
      </div>

      {showFissati && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowFissati(false)}>
          <div className="bg-white dark:bg-gray-800 w-full rounded-t-3xl p-5 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Pin size={18} className="text-yellow-500" /> Messaggi fissati ({fissati.length}/5)
              </h3>
              <button onClick={() => setShowFissati(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              {fissati.map(m => (
                <div key={m.id} className="card p-3">
                  <p className="text-xs text-gray-400 mb-1">{m.profiles?.nome} {m.profiles?.cognome} · {format(new Date(m.created_at), 'd MMM HH:mm', { locale: dateLocale })}</p>
                  {m.immagine_url ? (
                    <img src={m.immagine_url} alt="foto fissata" className="rounded-xl max-h-48 object-cover" />
                  ) : (
                    <p className="text-sm text-gray-800 dark:text-white">{m.testo}</p>
                  )}
                  <button onClick={() => handlePin(m)} className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1">
                    <PinOff size={12} /> Rimuovi pin
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function groupByDate(messaggi, dateLocale) {
  const groups = {}
  messaggi.forEach(m => {
    const key = format(new Date(m.created_at), 'EEEE d MMMM', { locale: dateLocale })
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  })
  return groups
}