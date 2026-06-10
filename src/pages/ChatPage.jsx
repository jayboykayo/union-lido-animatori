import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getMessaggiGruppo, getMessaggiPrivati, inviaMessaggio, getAllProfiles, segnaLetti } from '../lib/supabase'
import { useRealtime } from '../hooks/useRealtime'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Send, ChevronLeft, Users, User } from 'lucide-react'
import TipoBadge from '../components/layout/TipoBadge'

const GRUPPI = ['generale', 'Mascotte', 'Mini Club', 'Sport Coach', 'Fitness Coach', 'Service']

export default function ChatPage() {
  const { profile, user } = useAuth()
  const [view, setView] = useState('list') // 'list' | 'group' | 'private'
  const [activeChat, setActiveChat] = useState(null) // { type: 'group'|'private', id, label }
  const [animatori, setAnimatori] = useState([])

  useEffect(() => {
    getAllProfiles().then(({ data }) => setAnimatori((data || []).filter(p => p.id !== user?.id)))
  }, [])

  const openGroup = (gruppo) => {
    setActiveChat({ type: 'group', id: gruppo, label: gruppo === 'generale' ? '🌊 Tutti gli animatori' : gruppo })
    setView('group')
  }

  const openPrivate = (animatore) => {
    setActiveChat({
      type: 'private',
      id: animatore.id,
      label: `${animatore.nome} ${animatore.cognome}`,
      tipo: animatore.tipo_animazione,
    })
    setView('private')
  }

  if (view !== 'list') {
    return (
      <ChatWindow
        chat={activeChat}
        userId={user?.id}
        profile={profile}
        onBack={() => setView('list')}
      />
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <h1 className="text-xl font-extrabold text-gray-900 mb-5">Chat</h1>

      {/* Gruppi */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Gruppi</h2>
        <div className="space-y-2">
          {GRUPPI.filter(g => g === 'generale' || (profile?.tipi_animazione || []).includes(g) || profile?.ruolo !== 'animatore').map(gruppo => (
            <button
              key={gruppo}
              onClick={() => openGroup(gruppo)}
              className="card w-full p-4 flex items-center gap-3 active:scale-98 transition text-left"
            >
              <div className="w-11 h-11 bg-mare-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-mare-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{gruppo === 'generale' ? 'Tutti gli animatori' : gruppo}</p>
                <p className="text-gray-400 text-xs mt-0.5">{gruppo === 'generale' ? 'Gruppo generale' : 'Gruppo tipo'}</p>
              </div>
              <ChevronLeft size={18} className="text-gray-300 rotate-180" />
            </button>
          ))}
        </div>
      </div>

      {/* Chat private */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Messaggi privati</h2>
        <div className="space-y-2">
          {animatori.map(a => (
            <button
              key={a.id}
              onClick={() => openPrivate(a)}
              className="card w-full p-4 flex items-center gap-3 active:scale-98 transition text-left"
            >
              <div className="w-11 h-11 bg-gradient-to-br from-mare-400 to-corallo-400 rounded-xl flex items-center justify-center flex-shrink-0 flex-shrink-0">
                <span className="text-white font-bold text-sm">{a.nome?.[0]}{a.cognome?.[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800">{a.nome} {a.cognome}</p>
                {a.tipo_animazione && <TipoBadge tipo={a.tipo_animazione} size="xs" />}
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
  const [messaggi, setMessaggi] = useState([])
  const [testo, setTesto] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchMessages()
    if (chat.type === 'private') segnaLetti(userId, chat.id)
  }, [chat])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messaggi])

  const fetchMessages = async () => {
    setLoading(true)
    let data
    if (chat.type === 'group') {
      const res = await getMessaggiGruppo(chat.id)
      data = res.data
    } else {
      const res = await getMessaggiPrivati(userId, chat.id)
      data = res.data
    }
    setMessaggi(data || [])
    setLoading(false)
  }

  // Realtime
  useRealtime(
    `chat-${chat.type}-${chat.id}`,
    chat.type === 'group' ? { column: 'gruppo', value: chat.id } : null,
    (newMsg) => {
      if (chat.type === 'private') {
        const isRelevant =
          (newMsg.mittente_id === userId && newMsg.destinatario_id === chat.id) ||
          (newMsg.mittente_id === chat.id && newMsg.destinatario_id === userId)
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
      mittente_id: userId,
      testo: text,
      ...(chat.type === 'group'
        ? { gruppo: chat.id, destinatario_id: null }
        : { destinatario_id: chat.id, gruppo: null }
      ),
    }
    await inviaMessaggio(msg)
    setTesto('')
    setSending(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const grouped = groupByDate(messaggi)

  return (
    <div className="flex flex-col h-[calc(100vh-116px)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-xl transition">
          <ChevronLeft size={22} />
        </button>
        <div className="w-9 h-9 bg-gradient-to-br from-mare-400 to-corallo-400 rounded-xl flex items-center justify-center flex-shrink-0">
          {chat.type === 'group' ? <Users size={16} className="text-white" /> : <User size={16} className="text-white" />}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{chat.label}</p>
          {chat.tipo && <TipoBadge tipo={chat.tipo} size="xs" />}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-mare-200 border-t-mare-500 rounded-full animate-spin" />
          </div>
        ) : messaggi.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">💬</p>
            <p className="text-sm">Nessun messaggio ancora.<br />Sii il primo a scrivere!</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium px-2 capitalize">{date}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="space-y-1">
                {msgs.map((m, i) => {
                  const isMine = m.mittente_id === userId
                  const showName = !isMine && (i === 0 || msgs[i - 1]?.mittente_id !== m.mittente_id)
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                        {showName && !isMine && (
                          <p className="text-xs text-gray-400 mb-1 ml-1 font-medium">
                            {m.profiles?.nome} {m.profiles?.cognome}
                          </p>
                        )}
                        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMine
                            ? 'bg-mare-500 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 shadow-sm rounded-bl-sm border border-gray-100'
                        }`}>
                          {m.testo}
                        </div>
                        <p className={`text-[10px] text-gray-400 mt-0.5 ${isMine ? 'mr-1' : 'ml-1'}`}>
                          {format(new Date(m.created_at), 'HH:mm')}
                        </p>
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

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-end gap-2">
        <textarea
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-mare-400 max-h-28 min-h-[44px]"
          placeholder="Scrivi un messaggio..."
          value={testo}
          onChange={e => setTesto(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!testo.trim() || sending}
          className="w-11 h-11 bg-mare-500 disabled:bg-gray-300 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}

function groupByDate(messaggi) {
  const groups = {}
  messaggi.forEach(m => {
    const d = new Date(m.created_at)
    const key = format(d, 'EEEE d MMMM', { locale: it })
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  })
  return groups
}
