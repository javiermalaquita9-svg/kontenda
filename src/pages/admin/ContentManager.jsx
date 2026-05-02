import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import {
  FiGrid, FiList, FiExternalLink, FiEdit2, FiTrash2, FiX,
  FiArrowLeft, FiFolder, FiVideo,
} from 'react-icons/fi'
import { db } from '../../firebase/config'
import { useClients } from '../../hooks/useClients'
import { usePieces } from '../../hooks/usePieces'
import { useToast } from '../../context/ToastContext'
import StatusBadge from '../../components/shared/StatusBadge'
import FormatBadge from '../../components/shared/FormatBadge'
import ChatPanel from '../../components/shared/ChatPanel'
import { formatDate, tsToInput, inputToTs } from '../../utils/date'

const PILLAR_KEYS = [
  { key: 'education',   label: 'Educación y Valor' },
  { key: 'inspiration', label: 'Inspiración y Detrás de Escena' },
  { key: 'commercial',  label: 'Comercial y Promocional' },
  { key: 'interaction', label: 'Interacción y Entretenimiento' },
]

const ALL_FORMATS = ['Reels/TikTok', 'Post', 'Carrusel', 'Story', 'Meta Ads']
const STATUS_OPTIONS = [
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aprobado',    label: 'Aprobado' },
  { value: 'publicado',   label: 'Publicado' },
  { value: 'archivado',   label: 'Archivado' },
]

const INP = 'w-full bg-k-bg text-k-text text-sm px-3.5 py-2.5 rounded-card outline-none focus:ring-2 focus:ring-k-orange/30 placeholder:text-k-muted/40'
const INP_S = { border: '1px solid var(--color-border)' }

// ── Piece card ──────────────────────────────────────────────────
function PieceCard({ piece, clients, onView, onDelete }) {
  const client = clients.find(c => c.id === piece.clientId)
  const mainPillar = PILLAR_KEYS.reduce((max, pk) =>
    (piece.pillars?.[pk.key] ?? 0) > (piece.pillars?.[max.key] ?? 0) ? pk : max
  , PILLAR_KEYS[0])

  return (
    <div className="bg-k-surface rounded-card-lg p-4 flex flex-col gap-3" style={{ border: '1px solid var(--color-border)' }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-k-text font-medium text-sm leading-snug">{piece.title}</p>
        <StatusBadge status={piece.status} />
      </div>

      {/* Client */}
      <div className="flex items-center gap-2">
        {client?.logoUrl
          ? <img src={client.logoUrl} alt={client.name} className="w-5 h-5 rounded-full object-cover" />
          : <div className="w-5 h-5 rounded-full bg-k-surface2 flex items-center justify-center text-k-orange text-xs font-bold">{client?.name?.[0]}</div>
        }
        <span className="text-k-muted text-xs">{piece.clientName}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {piece.format && <FormatBadge format={piece.format} />}
        <span className="text-k-muted text-xs">{mainPillar.label}</span>
      </div>

      <div className="text-k-muted text-xs">{formatDate(piece.publishDate)}</div>

      <div className="flex gap-2 mt-auto">
        <button onClick={() => onView(piece)} className="flex-1 text-xs text-k-muted hover:text-k-text bg-k-surface2 hover:bg-k-surface2/70 px-3 py-2 rounded-card transition-colors flex items-center justify-center gap-1.5">
          <FiEdit2 size={12} /> Ver / Editar
        </button>
        <button onClick={() => onDelete(piece)} className="px-3 py-2 rounded-card text-k-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <FiTrash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Review panel ────────────────────────────────────────────────
function ReviewPanel({ piece, clients, onClose, onSaved }) {
  const { showToast } = useToast()
  const client = clients.find(c => c.id === piece.clientId)

  const [form, setForm]     = useState({
    title:       piece.title ?? '',
    publishDate: tsToInput(piece.publishDate),
    objective:   piece.objective ?? '',
    format:      piece.format ?? '',
    tag:         piece.tag ?? '',
    description: piece.description ?? '',
    driveUrl:    piece.driveUrl ?? '',
    frameUrl:    piece.frameUrl ?? '',
    hashtags:    piece.hashtags ?? '',
    copy:        piece.copy ?? '',
    status:      piece.status ?? 'en_revision',
    pillars:     piece.pillars ?? { education: 25, inspiration: 25, commercial: 25, interaction: 25 },
  })
  const [saving, setSaving] = useState(false)

  function set(key, val) { setForm(p => ({ ...p, [key]: val })) }

  async function handleSave() {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'clients', piece.clientId, 'pieces', piece.id), {
        ...form,
        publishDate: inputToTs(form.publishDate),
        pillars: {
          education:   parseInt(form.pillars.education)   || 0,
          inspiration: parseInt(form.pillars.inspiration) || 0,
          commercial:  parseInt(form.pillars.commercial)  || 0,
          interaction: parseInt(form.pillars.interaction) || 0,
        },
      })
      showToast('Pieza actualizada.')
      onSaved()
    } catch {
      showToast('Error al guardar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-k-bg" style={{ left: '240px' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 h-14 shrink-0" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-k-muted hover:text-k-text transition-colors">
            <FiArrowLeft size={18} />
          </button>
          <h2 className="text-k-text font-semibold text-base truncate">{piece.title}</h2>
          <StatusBadge status={form.status} />
        </div>
        <div className="flex items-center gap-2">
          {piece.driveUrl && (
            <a href={piece.driveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-k-muted hover:text-k-text bg-k-surface2 px-3 py-2 rounded-card transition-colors" style={{ border: '1px solid var(--color-border)' }}>
              <FiFolder size={13} /> Drive
            </a>
          )}
          {piece.frameUrl && (
            <a href={piece.frameUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-k-muted hover:text-k-text bg-k-surface2 px-3 py-2 rounded-card transition-colors" style={{ border: '1px solid var(--color-border)' }}>
              <FiVideo size={13} /> Frame.io
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: editable form ── */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-k-muted text-sm mb-1.5">Título</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} className={INP} style={INP_S} />
            </div>
            <div>
              <label className="block text-k-muted text-sm mb-1.5">Fecha de publicación</label>
              <input type="date" value={form.publishDate} onChange={e => set('publishDate', e.target.value)} className={`${INP} cursor-pointer`} style={INP_S} />
            </div>
            <div>
              <label className="block text-k-muted text-sm mb-1.5">Formato</label>
              <select value={form.format} onChange={e => set('format', e.target.value)} className={`${INP} cursor-pointer`} style={INP_S}>
                <option value="">Sin formato</option>
                {(client?.formats ?? []).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-k-muted text-sm mb-1.5">Objetivo</label>
              <select value={form.objective} onChange={e => set('objective', e.target.value)} className={`${INP} cursor-pointer`} style={INP_S}>
                <option value="">Sin objetivo</option>
                {(client?.objectives ?? []).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-k-muted text-sm mb-1.5">Etiqueta</label>
              <select value={form.tag} onChange={e => set('tag', e.target.value)} className={`${INP} cursor-pointer`} style={INP_S}>
                <option value="">Sin etiqueta</option>
                {(client?.tags ?? []).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-k-muted text-sm mb-1.5">Estado</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={`${INP} cursor-pointer`} style={INP_S}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Pilares */}
          <div className="mb-4">
            <label className="block text-k-muted text-sm mb-2">Pilares de contenido</label>
            <div className="grid grid-cols-2 gap-2">
              {PILLAR_KEYS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2 bg-k-surface rounded-card px-3 py-2" style={{ border: '1px solid var(--color-border)' }}>
                  <span className="text-k-muted text-xs flex-1 truncate">{label}</span>
                  <input type="number" min="0" max="100"
                    value={form.pillars[key]}
                    onChange={e => set('pillars', { ...form.pillars, [key]: e.target.value })}
                    className="w-14 bg-k-bg text-k-text text-xs text-center px-2 py-1 rounded outline-none focus:ring-1 focus:ring-k-orange/40"
                    style={INP_S}
                  />
                  <span className="text-k-muted text-xs">%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Drive / Frame links */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-k-muted text-sm mb-1.5">Drive URL</label>
              <input value={form.driveUrl} onChange={e => set('driveUrl', e.target.value)} placeholder="https://drive.google.com/..." className={INP} style={INP_S} />
            </div>
            <div>
              <label className="block text-k-muted text-sm mb-1.5">Frame.io URL</label>
              <input value={form.frameUrl} onChange={e => set('frameUrl', e.target.value)} placeholder="https://app.frame.io/..." className={INP} style={INP_S} />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-k-muted text-sm mb-1.5">Descripción</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className={`${INP} resize-none`} style={INP_S} />
          </div>
          <div className="mb-4">
            <label className="block text-k-muted text-sm mb-1.5">Hashtags</label>
            <textarea value={form.hashtags} onChange={e => set('hashtags', e.target.value)} rows={2} className={`${INP} resize-none`} style={INP_S} />
          </div>
          <div className="mb-6">
            <label className="block text-k-muted text-sm mb-1.5">Copy de publicación</label>
            <textarea value={form.copy} onChange={e => set('copy', e.target.value)} rows={4} className={`${INP} resize-none`} style={INP_S} />
          </div>

          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-card text-sm font-medium bg-k-orange hover:bg-k-orange/90 text-white transition-colors disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        {/* ── Right: chat ── */}
        <div className="w-80 shrink-0 flex flex-col" style={{ borderLeft: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <ChatPanel
            clientId={piece.clientId}
            pieceId={piece.id}
            userRole="admin"
            reviewRounds={piece.reviewRounds ?? 0}
            maxReviewRounds={piece.maxReviewRounds ?? 3}
          />
        </div>
      </div>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────
export default function ContentManager() {
  const [searchParams] = useSearchParams()
  const { clients }          = useClients()
  const { showToast }        = useToast()

  const [clientFilter, setClientFilter] = useState(searchParams.get('client') ?? '')
  const [activeTab,    setActiveTab]    = useState('all')
  const [viewMode,     setViewMode]     = useState('cards')
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')
  const [selectedPiece, setSelectedPiece] = useState(null)

  const { pieces, loading } = usePieces(clientFilter || null)

  // Open piece from query param (e.g., from Calendar)
  useEffect(() => {
    const pid = searchParams.get('piece')
    if (pid && pieces.length > 0) {
      const found = pieces.find(p => p.id === pid)
      if (found) setSelectedPiece(found)
    }
  }, [searchParams, pieces])

  async function handleDelete(piece) {
    if (!window.confirm(`¿Quitar la pieza "${piece.title}"?`)) return
    try {
      await deleteDoc(doc(db, 'clients', piece.clientId, 'pieces', piece.id))
      showToast('Pieza eliminada.')
    } catch {
      showToast('Error al eliminar.', 'error')
    }
  }

  // Filter logic
  const filtered = useMemo(() => {
    return pieces.filter(p => {
      if (p.status === 'publicado') return false // published go to bottom table
      if (activeTab !== 'all' && p.format !== activeTab) return false
      if (dateFrom && p.publishDate) {
        const d = p.publishDate.toDate()
        if (d < new Date(dateFrom + 'T00:00:00')) return false
      }
      if (dateTo && p.publishDate) {
        const d = p.publishDate.toDate()
        if (d > new Date(dateTo + 'T23:59:59')) return false
      }
      return true
    })
  }, [pieces, activeTab, dateFrom, dateTo])

  const published = useMemo(() => pieces.filter(p => p.status === 'publicado'), [pieces])

  // Format tabs — only show tabs that have content
  const usedFormats = useMemo(() => {
    const s = new Set(pieces.filter(p => p.status !== 'publicado').map(p => p.format).filter(Boolean))
    return ALL_FORMATS.filter(f => s.has(f))
  }, [pieces])

  if (selectedPiece) {
    return (
      <ReviewPanel
        piece={selectedPiece}
        clients={clients}
        onClose={() => setSelectedPiece(null)}
        onSaved={() => setSelectedPiece(null)}
      />
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-k-text text-2xl font-semibold">Gestor de Contenido</h1>
          <p className="text-k-muted text-sm mt-0.5">{filtered.length} pieza{filtered.length !== 1 ? 's' : ''} activa{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('cards')} className={`p-2 rounded-card transition-colors ${viewMode === 'cards' ? 'bg-k-surface2 text-k-text' : 'text-k-muted hover:text-k-text'}`}>
            <FiGrid size={16} />
          </button>
          <button onClick={() => setViewMode('table')} className={`p-2 rounded-card transition-colors ${viewMode === 'table' ? 'bg-k-surface2 text-k-text' : 'text-k-muted hover:text-k-text'}`}>
            <FiList size={16} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="bg-k-surface text-k-text text-sm px-3 py-2 rounded-card outline-none cursor-pointer" style={{ border: '1px solid var(--color-border)' }}>
          <option value="">Todos los clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-k-surface text-k-text text-sm px-3 py-2 rounded-card outline-none cursor-pointer" style={{ border: '1px solid var(--color-border)' }} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-k-surface text-k-text text-sm px-3 py-2 rounded-card outline-none cursor-pointer" style={{ border: '1px solid var(--color-border)' }} />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo('') }} className="text-k-muted hover:text-k-text text-sm flex items-center gap-1">
            <FiX size={14} /> Limpiar fechas
          </button>
        )}
      </div>

      {/* Format tabs */}
      {usedFormats.length > 0 && (
        <div className="flex gap-0 mb-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {[{ key: 'all', label: 'Todos' }, ...usedFormats.map(f => ({ key: f, label: f }))].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key ? 'border-k-orange text-k-orange' : 'border-transparent text-k-muted hover:text-k-text'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-k-orange/30 border-t-k-orange rounded-full animate-spin" />
        </div>
      ) : viewMode === 'cards' ? (
        filtered.length === 0 ? (
          <div className="bg-k-surface rounded-card-lg p-12 text-center" style={{ border: '1px solid var(--color-border)' }}>
            <p className="text-k-muted text-sm">No hay piezas activas con estos filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map(p => (
              <PieceCard key={p.id} piece={p} clients={clients} onView={setSelectedPiece} onDelete={handleDelete} />
            ))}
          </div>
        )
      ) : (
        /* Table view */
        <div className="rounded-card-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
          <table className="w-full">
            <thead>
              <tr className="bg-k-surface" style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Título', 'Cliente', 'Formato', 'Pilar', 'Fecha', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left text-xs text-k-muted font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const mainPillar = PILLAR_KEYS.reduce((max, pk) =>
                  (p.pillars?.[pk.key] ?? 0) > (p.pillars?.[max.key] ?? 0) ? pk : max
                , PILLAR_KEYS[0])
                return (
                  <tr key={p.id} className="hover:bg-k-surface/50 transition-colors" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-3 text-k-text text-sm font-medium">{p.title}</td>
                    <td className="px-4 py-3 text-k-muted text-sm">{p.clientName}</td>
                    <td className="px-4 py-3"><FormatBadge format={p.format} /></td>
                    <td className="px-4 py-3 text-k-muted text-xs">{mainPillar.label}</td>
                    <td className="px-4 py-3 text-k-muted text-sm">{formatDate(p.publishDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedPiece(p)} className="text-k-muted hover:text-k-text text-xs flex items-center gap-1">
                          <FiEdit2 size={12} /> Ver
                        </button>
                        <button onClick={() => handleDelete(p)} className="text-k-muted hover:text-red-400 transition-colors">
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Published section */}
      {published.length > 0 && (
        <div className="mt-10">
          <h2 className="text-k-text font-semibold mb-3">Registro de Contenido Publicado</h2>
          <div className="rounded-card-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            <table className="w-full">
              <thead>
                <tr className="bg-k-surface" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Título', 'Cliente', 'Formato', 'Fecha publicación', 'Pilar', 'Acciones'].map(h => (
                    <th key={h} className="text-left text-xs text-k-muted font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {published.map(p => {
                  const mainPillar = PILLAR_KEYS.reduce((max, pk) =>
                    (p.pillars?.[pk.key] ?? 0) > (p.pillars?.[max.key] ?? 0) ? pk : max
                  , PILLAR_KEYS[0])
                  return (
                    <tr key={p.id} className="hover:bg-k-surface/50 transition-colors" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td className="px-4 py-3 text-k-text text-sm font-medium">{p.title}</td>
                      <td className="px-4 py-3 text-k-muted text-sm">{p.clientName}</td>
                      <td className="px-4 py-3"><FormatBadge format={p.format} /></td>
                      <td className="px-4 py-3 text-k-muted text-sm">{formatDate(p.publishDate)}</td>
                      <td className="px-4 py-3 text-k-muted text-xs">{mainPillar.label}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedPiece(p)} className="text-k-muted hover:text-k-text text-xs flex items-center gap-1"><FiEdit2 size={12} /> Ver</button>
                          <button onClick={() => handleDelete(p)} className="text-k-muted hover:text-red-400 transition-colors"><FiTrash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
