import { useState, useEffect, useMemo } from 'react'
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'
import {
  FiArrowLeft, FiExternalLink, FiChevronLeft, FiChevronRight,
  FiGlobe, FiMapPin, FiFolder, FiInstagram, FiFacebook, FiYoutube,
} from 'react-icons/fi'
import { SiTiktok } from 'react-icons/si'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import { usePieces } from '../../hooks/usePieces'
import { formatDate, getMonthLabel } from '../../utils/date'
import StatusBadge from '../../components/shared/StatusBadge'
import FormatBadge from '../../components/shared/FormatBadge'
import ChatPanel from '../../components/shared/ChatPanel'

const LINK_ICONS = {
  instagram: FiInstagram,
  tiktok:    SiTiktok,
  facebook:  FiFacebook,
  youtube:   FiYoutube,
  maps:      FiMapPin,
  web:       FiGlobe,
  drive:     FiFolder,
}

const DAY_HEADERS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const STATUS_CYCLE = ['en_revision', 'aprobado', 'publicado']

const STATUS_DOT = {
  en_revision: 'bg-k-yellow',
  aprobado:    'bg-k-lila',
  publicado:   'bg-green-400',
  archivado:   'bg-k-muted',
}

const STATUS_LABEL = {
  en_revision: 'En revisión',
  aprobado:    'Aprobado',
  publicado:   'Publicado',
  archivado:   'Archivado',
}

const FORMAT_BORDER = {
  'Reels/TikTok': '#E86A1A',
  'Post':         '#a292c5',
  'Carrusel':     '#60a5fa',
  'Story':        '#f472b6',
  'Meta Ads':     '#f87171',
}

function InfoField({ label, children }) {
  return (
    <div>
      <p className="text-k-muted text-xs mb-1">{label}</p>
      {children}
    </div>
  )
}

function PieceDetailPanel({ piece, onClose, clientId }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-k-bg">
      <div
        className="flex items-center justify-between px-6 h-14 shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-k-muted hover:text-k-text transition-colors">
            <FiArrowLeft size={18} />
          </button>
          <h2 className="text-k-text font-semibold text-base truncate">{piece.title}</h2>
          <StatusBadge status={piece.status} />
        </div>
        <div className="flex items-center gap-2">
          {piece.driveUrl && (
            <a href={piece.driveUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-k-muted hover:text-k-text bg-k-surface2 px-3 py-2 rounded-card transition-colors"
              style={{ border: '1px solid var(--color-border)' }}>
              <FiExternalLink size={13} /> Drive
            </a>
          )}
          {piece.frameUrl && (
            <a href={piece.frameUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-k-muted hover:text-k-text bg-k-surface2 px-3 py-2 rounded-card transition-colors"
              style={{ border: '1px solid var(--color-border)' }}>
              <FiExternalLink size={13} /> Frame.io
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-xl">
            <div className="grid grid-cols-2 gap-4 mb-5">
              <InfoField label="Formato">
                {piece.format ? <FormatBadge format={piece.format} /> : <span className="text-k-muted text-sm">—</span>}
              </InfoField>
              <InfoField label="Fecha de publicación">
                <span className="text-k-text text-sm">{formatDate(piece.publishDate)}</span>
              </InfoField>
              {piece.objective && (
                <InfoField label="Objetivo">
                  <span className="text-k-text text-sm">{piece.objective}</span>
                </InfoField>
              )}
              {piece.tag && (
                <InfoField label="Etiqueta">
                  <span className="text-k-text text-sm">{piece.tag}</span>
                </InfoField>
              )}
            </div>
            {piece.description && (
              <div className="mb-4">
                <InfoField label="Descripción">
                  <p className="text-k-text text-sm leading-relaxed whitespace-pre-wrap">{piece.description}</p>
                </InfoField>
              </div>
            )}
            {piece.copy && (
              <div className="mb-4">
                <InfoField label="Copy de publicación">
                  <p className="text-k-text text-sm leading-relaxed whitespace-pre-wrap">{piece.copy}</p>
                </InfoField>
              </div>
            )}
            {piece.hashtags && (
              <div className="mb-4">
                <InfoField label="Hashtags">
                  <p className="text-k-muted text-sm">{piece.hashtags}</p>
                </InfoField>
              </div>
            )}
          </div>
        </div>

        <div className="w-80 shrink-0 flex flex-col" style={{ borderLeft: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <ChatPanel
            clientId={clientId}
            pieceId={piece.id}
            userRole="client"
            reviewRounds={piece.reviewRounds ?? 0}
            maxReviewRounds={piece.maxReviewRounds ?? 3}
          />
        </div>
      </div>
    </div>
  )
}

export default function MyContent() {
  const { clientId } = useAuth()
  const { pieces, loading } = usePieces(clientId)
  const [clientData,  setClientData]  = useState(null)
  const [selected,    setSelected]    = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dragId,      setDragId]      = useState(null)
  const [dragOverDay, setDragOverDay] = useState(null)

  useEffect(() => {
    if (!clientId) return
    getDoc(doc(db, 'clients', clientId)).then(snap => {
      if (snap.exists()) setClientData(snap.data())
    })
  }, [clientId])

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const piecesByDay = useMemo(() => {
    const map = {}
    pieces.forEach(p => {
      if (!p.publishDate) return
      const d = p.publishDate.toDate()
      if (d.getFullYear() !== year || d.getMonth() !== month) return
      const day = d.getDate()
      if (!map[day]) map[day] = []
      map[day].push(p)
    })
    return map
  }, [pieces, year, month])

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const today   = new Date()
  const isToday = day =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  async function movePiece(pieceId, toDay) {
    const newDate = new Date(year, month, toDay, 12, 0, 0)
    try {
      await updateDoc(
        doc(db, 'clients', clientId, 'pieces', pieceId),
        { publishDate: Timestamp.fromDate(newDate) }
      )
    } catch {
      console.error('Error al mover pieza')
    }
  }

  async function cycleStatus(piece, e) {
    e.stopPropagation()
    const current = piece.status ?? 'en_revision'
    const i = STATUS_CYCLE.indexOf(current)
    const next = STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length]
    try {
      await updateDoc(
        doc(db, 'clients', clientId, 'pieces', piece.id),
        { status: next }
      )
    } catch {
      console.error('Error al cambiar estado')
    }
  }

  if (selected) {
    return <PieceDetailPanel piece={selected} clientId={clientId} onClose={() => setSelected(null)} />
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-k-text text-2xl font-semibold">Mi Contenido</h1>
          <p className="text-k-muted text-sm mt-1">
            {pieces.length} pieza{pieces.length !== 1 ? 's' : ''} en total
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="p-2 rounded-card text-k-muted hover:text-k-text hover:bg-k-surface2 transition-colors">
            <FiChevronLeft size={16} />
          </button>
          <span className="text-k-text text-sm font-medium w-36 text-center">
            {getMonthLabel(currentDate)}
          </span>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="p-2 rounded-card text-k-muted hover:text-k-text hover:bg-k-surface2 transition-colors">
            <FiChevronRight size={16} />
          </button>
          <button onClick={() => setCurrentDate(new Date())}
            className="ml-2 px-3 py-1.5 rounded-card text-xs text-k-muted hover:text-k-text transition-colors"
            style={{ border: '1px solid var(--color-border)' }}>
            Hoy
          </button>
        </div>
      </div>

      {clientData?.quickLinks?.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {clientData.quickLinks.map((lk, i) => {
            const Icon = LINK_ICONS[lk.icon] ?? FiGlobe
            return (
              <a key={i} href={lk.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-k-muted hover:text-k-text bg-k-surface px-3 py-1.5 rounded-card transition-colors"
                style={{ border: '1px solid var(--color-border)' }}>
                <Icon size={12} /> {lk.label}
              </a>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-k-orange/30 border-t-k-orange rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-px mb-1">
            {DAY_HEADERS.map(d => (
              <div key={d} className="text-k-muted text-xs font-medium text-center py-2">{d}</div>
            ))}
          </div>

          <div
            className="grid grid-cols-7 gap-px bg-k-surface2 rounded-card-lg overflow-hidden"
            style={{ border: '1px solid var(--color-border)' }}
          >
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="bg-k-bg min-h-[110px]" />
              const dayPieces  = piecesByDay[day] ?? []
              const isDragOver = dragOverDay === day

              return (
                <div
                  key={day}
                  className={`bg-k-bg min-h-[110px] p-2 flex flex-col gap-1.5 transition-colors ${
                    isToday(day) ? 'ring-1 ring-inset ring-k-orange/50' : ''
                  } ${isDragOver ? 'bg-k-orange/5' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOverDay(day) }}
                  onDragLeave={() => setDragOverDay(null)}
                  onDrop={e => {
                    e.preventDefault()
                    const id = e.dataTransfer.getData('pieceId')
                    if (id) movePiece(id, day)
                    setDragId(null)
                    setDragOverDay(null)
                  }}
                >
                  <span className={`text-xs font-medium self-start px-1.5 py-0.5 rounded ${
                    isToday(day) ? 'bg-k-orange text-white' : 'text-k-muted'
                  }`}>
                    {day}
                  </span>

                  {dayPieces.map(piece => (
                    <div
                      key={piece.id}
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData('pieceId', piece.id)
                        setDragId(piece.id)
                      }}
                      onDragEnd={() => { setDragId(null); setDragOverDay(null) }}
                      onClick={() => setSelected(piece)}
                      className={`w-full rounded text-left cursor-grab active:cursor-grabbing transition-opacity ${
                        dragId === piece.id ? 'opacity-40' : 'hover:brightness-110'
                      }`}
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderLeft: `3px solid ${FORMAT_BORDER[piece.format] ?? 'var(--color-border)'}`,
                        padding: '6px 8px',
                      }}
                    >
                      <p className="text-k-text text-[11px] font-medium leading-snug truncate mb-1">
                        {piece.title}
                      </p>

                      {piece.format && (
                        <div className="mb-1">
                          <FormatBadge format={piece.format} />
                        </div>
                      )}

                      {piece.objective && (
                        <p className="text-k-muted text-[10px] mb-1 truncate">{piece.objective}</p>
                      )}

                      {/* Status toggle button */}
                      <button
                        onClick={e => cycleStatus(piece, e)}
                        className="flex items-center gap-1 mt-0.5"
                        title="Clic para cambiar estado"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[piece.status] ?? 'bg-k-muted'}`} />
                        <span className="text-k-muted text-[10px] hover:text-k-text transition-colors truncate">
                          {STATUS_LABEL[piece.status] ?? piece.status}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          {Object.keys(piecesByDay).length === 0 && (
            <div className="mt-4 bg-k-surface rounded-card-lg p-8 text-center" style={{ border: '1px solid var(--color-border)' }}>
              <p className="text-k-muted text-sm">No hay piezas programadas para este mes.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
