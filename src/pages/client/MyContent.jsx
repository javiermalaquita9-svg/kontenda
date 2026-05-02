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

const DAY_HEADERS   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAY_NAMES_ES  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MONTH_SHORT   = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const MONTH_FULL_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

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

function getWeekStart(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}

function dateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

// ── Info field ───────────────────────────────────────────────────
function InfoField({ label, children }) {
  return (
    <div>
      <p className="text-k-muted text-xs mb-1">{label}</p>
      {children}
    </div>
  )
}

// ── Piece detail panel ───────────────────────────────────────────
function PieceDetailPanel({ piece, onClose, clientId }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-k-bg">
      <div
        className="flex items-center justify-between px-4 md:px-6 h-14 shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="text-k-muted hover:text-k-text transition-colors shrink-0">
            <FiArrowLeft size={18} />
          </button>
          <h2 className="text-k-text font-semibold text-base truncate">{piece.title}</h2>
          <StatusBadge status={piece.status} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
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

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
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

        <div
          className="h-80 md:h-auto md:w-80 shrink-0 flex flex-col"
          style={{ borderTop: '1px solid var(--color-border)', borderLeft: 'none' }}
        >
          <style>{`@media (min-width: 768px) { .chat-border { border-left: 1px solid var(--color-border) !important; border-top: none !important; } }`}</style>
          <div className="chat-border h-full flex flex-col" style={{ background: 'var(--color-surface)' }}>
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
    </div>
  )
}

// ── Piece mini card (week / day view) ────────────────────────────
function PieceMini({ piece, onSelect, onCycleStatus }) {
  return (
    <div
      className="rounded-card cursor-pointer hover:brightness-110 transition-all"
      style={{
        background: 'var(--color-surface2)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${FORMAT_BORDER[piece.format] ?? 'var(--color-border)'}`,
        padding: '8px 10px',
      }}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-k-text text-sm font-medium leading-snug">{piece.title}</p>
        <StatusBadge status={piece.status} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {piece.format && <FormatBadge format={piece.format} />}
        {piece.objective && <span className="text-k-muted text-xs">{piece.objective}</span>}
      </div>
      <button
        onClick={onCycleStatus}
        className="flex items-center gap-1 mt-1.5"
        title="Clic para cambiar estado"
      >
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[piece.status] ?? 'bg-k-muted'}`} />
        <span className="text-k-muted text-[11px] hover:text-k-text transition-colors">
          {STATUS_LABEL[piece.status] ?? piece.status}
        </span>
      </button>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export default function MyContent() {
  const { clientId } = useAuth()
  const { pieces, loading } = usePieces(clientId)
  const [clientData,   setClientData]  = useState(null)
  const [selected,     setSelected]    = useState(null)
  const [currentDate,  setCurrentDate] = useState(new Date())
  const [viewMode,     setViewMode]    = useState('semana')
  const [dragId,       setDragId]      = useState(null)
  const [dragOverDay,  setDragOverDay] = useState(null)

  useEffect(() => {
    if (!clientId) return
    getDoc(doc(db, 'clients', clientId)).then(snap => {
      if (snap.exists()) setClientData(snap.data())
    })
  }, [clientId])

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Map keyed by "year-month-day" for week/day views
  const piecesByDate = useMemo(() => {
    const map = {}
    pieces.forEach(p => {
      if (!p.publishDate) return
      const d = p.publishDate.toDate()
      const k = dateKey(d)
      if (!map[k]) map[k] = []
      map[k].push(p)
    })
    return map
  }, [pieces])

  function getPiecesForDate(date) {
    return piecesByDate[dateKey(date)] ?? []
  }

  // Map keyed by day-of-month for month view
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
  const isTodayDate = date =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  // Week
  const weekStart = getWeekStart(currentDate)
  const weekDays  = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  // Navigation
  function navigate(dir) {
    setCurrentDate(prev => {
      const d = new Date(prev)
      if (viewMode === 'mes')    return new Date(d.getFullYear(), d.getMonth() + dir, 1)
      d.setDate(d.getDate() + (viewMode === 'semana' ? dir * 7 : dir))
      return new Date(d)
    })
  }

  // Nav label
  const navLabel = viewMode === 'mes'
    ? getMonthLabel(currentDate)
    : viewMode === 'semana'
    ? `${weekDays[0].getDate()} ${MONTH_SHORT[weekDays[0].getMonth()]} – ${weekDays[6].getDate()} ${MONTH_SHORT[weekDays[6].getMonth()]}`
    : `${DAY_NAMES_ES[currentDate.getDay()]} ${currentDate.getDate()} de ${MONTH_FULL_ES[currentDate.getMonth()]}`

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-k-text text-2xl font-semibold">Mi Contenido</h1>
          <p className="text-k-muted text-sm mt-1">
            {pieces.length} pieza{pieces.length !== 1 ? 's' : ''} en total
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          {/* View toggle */}
          <div className="flex rounded-card overflow-hidden self-start sm:self-auto" style={{ border: '1px solid var(--color-border)' }}>
            {[
              { key: 'dia',    label: 'Día' },
              { key: 'semana', label: 'Semana' },
              { key: 'mes',    label: 'Mes' },
            ].map(v => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === v.key ? 'bg-k-orange text-white' : 'text-k-muted hover:text-k-text'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-card text-k-muted hover:text-k-text hover:bg-k-surface2 transition-colors"
            >
              <FiChevronLeft size={16} />
            </button>
            <span className="text-k-text text-sm font-medium min-w-[160px] text-center">
              {navLabel}
            </span>
            <button
              onClick={() => navigate(1)}
              className="p-2 rounded-card text-k-muted hover:text-k-text hover:bg-k-surface2 transition-colors"
            >
              <FiChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="ml-1 px-3 py-1.5 rounded-card text-xs text-k-muted hover:text-k-text transition-colors"
              style={{ border: '1px solid var(--color-border)' }}
            >
              Hoy
            </button>
          </div>
        </div>
      </div>

      {/* Quick links */}
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

      {/* Views */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-k-orange/30 border-t-k-orange rounded-full animate-spin" />
        </div>
      ) : viewMode === 'mes' ? (
        /* ── Mes ── */
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
              if (!day) return <div key={`empty-${idx}`} className="bg-k-bg min-h-[90px]" />
              const dayPieces  = piecesByDay[day] ?? []
              const isDragOver = dragOverDay === day

              return (
                <div
                  key={day}
                  className={`bg-k-bg min-h-[90px] p-1.5 flex flex-col gap-1 transition-colors ${
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
                  <span className={`text-xs font-medium self-start px-1 py-0.5 rounded ${
                    isToday(day) ? 'bg-k-orange text-white' : 'text-k-muted'
                  }`}>
                    {day}
                  </span>

                  {dayPieces.map(piece => (
                    <div
                      key={piece.id}
                      draggable
                      onDragStart={e => { e.dataTransfer.setData('pieceId', piece.id); setDragId(piece.id) }}
                      onDragEnd={() => { setDragId(null); setDragOverDay(null) }}
                      onClick={() => setSelected(piece)}
                      className={`w-full rounded text-left cursor-grab active:cursor-grabbing transition-opacity ${
                        dragId === piece.id ? 'opacity-40' : 'hover:brightness-110'
                      }`}
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderLeft: `3px solid ${FORMAT_BORDER[piece.format] ?? 'var(--color-border)'}`,
                        padding: '4px 6px',
                      }}
                    >
                      <p className="text-k-text text-[10px] font-medium leading-snug truncate">{piece.title}</p>
                      <button
                        onClick={e => cycleStatus(piece, e)}
                        className="flex items-center gap-1 mt-0.5"
                        title="Clic para cambiar estado"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[piece.status] ?? 'bg-k-muted'}`} />
                        <span className="text-k-muted text-[9px] truncate">
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
      ) : viewMode === 'semana' ? (
        /* ── Semana ── */
        <div className="flex flex-col gap-2">
          {weekDays.map(date => {
            const dayPieces = getPiecesForDate(date)
            const todayMark = isTodayDate(date)
            return (
              <div
                key={dateKey(date)}
                className="bg-k-surface rounded-card-lg overflow-hidden"
                style={{ border: `1px solid ${todayMark ? 'rgba(232,106,26,0.4)' : 'var(--color-border)'}` }}
              >
                <div
                  className="px-4 py-2.5 flex items-center justify-between"
                  style={{ borderBottom: dayPieces.length > 0 ? '1px solid var(--color-border)' : 'none' }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold shrink-0 ${
                      todayMark ? 'bg-k-orange text-white' : 'text-k-text'
                    }`}>
                      {date.getDate()}
                    </span>
                    <span className="text-k-muted text-sm">
                      {DAY_NAMES_ES[date.getDay()]} · {MONTH_SHORT[date.getMonth()]}
                    </span>
                  </div>
                  <span className="text-k-muted text-xs">
                    {dayPieces.length > 0 ? `${dayPieces.length} pieza${dayPieces.length !== 1 ? 's' : ''}` : ''}
                  </span>
                </div>

                {dayPieces.length > 0 && (
                  <div className="p-3 flex flex-col gap-2">
                    {dayPieces.map(piece => (
                      <PieceMini
                        key={piece.id}
                        piece={piece}
                        onSelect={() => setSelected(piece)}
                        onCycleStatus={e => cycleStatus(piece, e)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Día ── */
        <div className="flex flex-col gap-3">
          {getPiecesForDate(currentDate).length === 0 ? (
            <div className="bg-k-surface rounded-card-lg p-10 text-center" style={{ border: '1px solid var(--color-border)' }}>
              <p className="text-k-muted text-sm">Sin piezas para este día.</p>
            </div>
          ) : (
            getPiecesForDate(currentDate).map(piece => (
              <PieceMini
                key={piece.id}
                piece={piece}
                onSelect={() => setSelected(piece)}
                onCycleStatus={e => cycleStatus(piece, e)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
