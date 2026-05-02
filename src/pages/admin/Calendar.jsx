import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc, Timestamp } from 'firebase/firestore'
import { FiChevronLeft, FiChevronRight, FiGlobe, FiMapPin, FiFolder, FiInstagram, FiFacebook, FiYoutube } from 'react-icons/fi'
import { SiTiktok } from 'react-icons/si'
import { db } from '../../firebase/config'
import { useClients } from '../../hooks/useClients'
import { usePieces } from '../../hooks/usePieces'
import { useToast } from '../../context/ToastContext'
import FormatBadge from '../../components/shared/FormatBadge'
import { getMonthLabel } from '../../utils/date'

const DAY_HEADERS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const LINK_ICONS = {
  instagram: FiInstagram,
  tiktok:    SiTiktok,
  facebook:  FiFacebook,
  youtube:   FiYoutube,
  maps:      FiMapPin,
  web:       FiGlobe,
  drive:     FiFolder,
}

const STATUS_OPTIONS = [
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aprobado',    label: 'Aprobado' },
  { value: 'publicado',   label: 'Publicado' },
  { value: 'archivado',   label: 'Archivado' },
]

const FORMAT_BORDER = {
  'Reels/TikTok': '#E86A1A',
  'Post':         '#a292c5',
  'Carrusel':     '#60a5fa',
  'Story':        '#f472b6',
  'Meta Ads':     '#f87171',
}

export default function Calendar() {
  const navigate      = useNavigate()
  const { clients }   = useClients()
  const { showToast } = useToast()

  const [currentDate,  setCurrentDate]  = useState(new Date())
  const [clientFilter, setClientFilter] = useState('')
  const [dragId,       setDragId]       = useState(null)
  const [dragOverDay,  setDragOverDay]  = useState(null)

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const { pieces } = usePieces(clientFilter || null)

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
  const isToday = (day) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  async function handleStatusChange(piece, newStatus) {
    try {
      await updateDoc(doc(db, 'clients', piece.clientId, 'pieces', piece.id), { status: newStatus })
    } catch {
      showToast('Error al actualizar estado.', 'error')
    }
  }

  async function movePiece(pieceId, toDay) {
    const piece = pieces.find(p => p.id === pieceId)
    if (!piece) return
    const newDate = new Date(year, month, toDay, 12, 0, 0)
    try {
      await updateDoc(
        doc(db, 'clients', piece.clientId, 'pieces', pieceId),
        { publishDate: Timestamp.fromDate(newDate) }
      )
    } catch {
      showToast('Error al mover pieza.', 'error')
    }
  }

  const selectedClient = clients.find(c => c.id === clientFilter)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="px-8 py-4 shrink-0" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-k-text text-xl font-semibold">Calendario de Publicación</h1>
            <p className="text-k-muted text-xs mt-0.5">Organiza tus piezas por mes y cliente</p>
          </div>

          <div className="flex items-center gap-3">
            <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
              className="bg-k-surface2 text-k-text text-sm px-3 py-2 rounded-card outline-none cursor-pointer"
              style={{ border: '1px solid var(--color-border)' }}>
              <option value="">Todos los clientes</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-card text-k-muted hover:text-k-text hover:bg-k-surface2 transition-colors">
                <FiChevronLeft size={16} />
              </button>
              <span className="text-k-text text-sm font-medium w-36 text-center">{getMonthLabel(currentDate)}</span>
              <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-card text-k-muted hover:text-k-text hover:bg-k-surface2 transition-colors">
                <FiChevronRight size={16} />
              </button>
            </div>

            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 rounded-card text-sm text-k-muted hover:text-k-text transition-colors" style={{ border: '1px solid var(--color-border)' }}>
              Hoy
            </button>
          </div>
        </div>

        {selectedClient?.quickLinks?.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {selectedClient.quickLinks.map((lk, i) => {
              const Icon = LINK_ICONS[lk.icon] ?? FiGlobe
              return (
                <a key={i} href={lk.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-k-muted hover:text-k-text bg-k-surface2 px-3 py-1.5 rounded-card transition-colors"
                  style={{ border: '1px solid var(--color-border)' }}>
                  <Icon size={12} /> {lk.label}
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto px-8 py-4">
        <div className="grid grid-cols-7 gap-px mb-1">
          {DAY_HEADERS.map(d => (
            <div key={d} className="text-k-muted text-xs font-medium text-center py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-k-surface2" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="bg-k-bg min-h-[120px]" />

            const dayPieces  = piecesByDay[day] ?? []
            const isDragOver = dragOverDay === day

            return (
              <div
                key={day}
                className={`bg-k-bg min-h-[120px] p-2 flex flex-col gap-1.5 transition-colors ${
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
                    className={`rounded p-1.5 cursor-grab active:cursor-grabbing transition-opacity ${
                      dragId === piece.id ? 'opacity-40' : 'hover:brightness-110'
                    }`}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderLeft: `3px solid ${FORMAT_BORDER[piece.format] ?? 'var(--color-border)'}`,
                    }}
                  >
                    <p
                      className="text-k-text text-[11px] font-medium leading-snug truncate mb-1 hover:text-k-orange transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/gestor?piece=${piece.id}&client=${piece.clientId}`)}
                    >
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

                    <select
                      value={piece.status ?? 'en_revision'}
                      onChange={e => handleStatusChange(piece, e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className="w-full bg-k-surface2 text-k-text text-[10px] px-1.5 py-1 rounded outline-none cursor-pointer"
                      style={{ border: '1px solid var(--color-border)' }}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
