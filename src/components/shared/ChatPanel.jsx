import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { FiSend } from 'react-icons/fi'

export default function ChatPanel({ clientId, pieceId, userRole, reviewRounds = 0, maxReviewRounds = 3 }) {
  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [sending,   setSending]   = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!clientId || !pieceId) return
    const q = query(
      collection(db, 'clients', clientId, 'pieces', pieceId, 'messages'),
      orderBy('createdAt')
    )
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [clientId, pieceId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!clientId || !pieceId || !input.trim() || sending) return
    setSending(true)
    try {
      await addDoc(
        collection(db, 'clients', clientId, 'pieces', pieceId, 'messages'),
        { text: input.trim(), role: userRole, createdAt: serverTimestamp() }
      )
      setInput('')
    } finally {
      setSending(false)
    }
  }

  const roundsLeft = maxReviewRounds - reviewRounds

  return (
    <div className="flex flex-col h-full">
      {/* Header rounds badge */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-card text-xs font-medium ${
          roundsLeft === 0 ? 'bg-red-500/15 text-red-400' : 'bg-k-yellow/15 text-k-yellow'
        }`}>
          <span>Cambios pendientes</span>
          <span className="font-bold">({reviewRounds}/{maxReviewRounds})</span>
        </div>
        {/* Round bars */}
        <div className="flex gap-1 mt-2.5">
          {Array.from({ length: maxReviewRounds }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < reviewRounds
                  ? i === reviewRounds - 1 ? 'bg-k-yellow' : 'bg-k-orange'
                  : 'bg-k-surface2'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
        {messages.length === 0 && (
          <p className="text-k-muted text-sm text-center py-8">Sin mensajes aún.</p>
        )}
        {messages.map(msg => {
          const isMe = msg.role === userRole
          const time = msg.createdAt?.toDate?.()?.toLocaleTimeString('es-CL', {
            hour: '2-digit', minute: '2-digit',
          }) ?? ''
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] px-3 py-2 rounded-card text-sm ${
                isMe ? 'bg-k-orange/20 text-k-text' : 'bg-k-surface2 text-k-text'
              }`}>
                <p className="leading-snug">{msg.text}</p>
                <p className="text-k-muted text-[10px] mt-1 text-right">{time}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 p-3 shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-k-surface2 text-k-text text-sm px-3 py-2 rounded-card outline-none focus:ring-2 focus:ring-k-orange/30 placeholder:text-k-muted/40"
          style={{ border: '1px solid var(--color-border)' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="px-3 py-2 bg-k-orange hover:bg-k-orange/90 text-white rounded-card transition-colors disabled:opacity-40 shrink-0"
        >
          <FiSend size={15} />
        </button>
      </form>
    </div>
  )
}
