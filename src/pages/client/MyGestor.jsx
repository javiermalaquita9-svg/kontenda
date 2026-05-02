import { useState, useMemo } from 'react'
import { doc, deleteDoc, updateDoc } from 'firebase/firestore'
import {
  FiArrowLeft, FiExternalLink, FiEdit2, FiTrash2, FiGrid, FiList,
} from 'react-icons/fi'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import { usePieces } from '../../hooks/usePieces'
import { formatDate } from '../../utils/date'
import StatusBadge from '../../components/shared/StatusBadge'
import FormatBadge from '../../components/shared/FormatBadge'
import ChatPanel from '../../components/shared/ChatPanel'

const ALL_FORMATS = ['Reels/TikTok', 'Post', 'Carrusel', 'Story', 'Meta Ads']

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

function InfoField({ label, children }) {
  return (
    <div>
      <p className="text-k-muted text-xs mb-1">{label}</p>
      {children}
    </div>
  )
}

function PieceDetailPanel({ piece, clientId, onClose }) {
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
              <InfoField label="Fecha">
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
                <InfoField label="Copy">
                  <p className="text-k-text text-sm leading-relaxed whitespace-pre-wrap">{piece.copy}</p>
                </InfoField>
              </div>
            )}
            {piece.hashtags && (
              <div>
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

export default function MyGestor() {
  const { clientId }         = useAuth()
  const { pieces, loading }  = usePieces(clientId)
  const [activeTab,   setActiveTab]   = useState('all')
  const [viewMode,    setViewMode]    = useState('table')
  const [selected,    setSelected]    = useState(null)
  const [pubFilter,   setPubFilter]   = useState('all')

  async function handleDelete(piece) {
    if (!window.confirm(`¿Quitar la pieza "${piece.title}"?`)) return
    await deleteDoc(doc(db, 'clients', clientId, 'pieces', piece.id))
  }

  async function handleStatusChange(piece, newStatus) {
    await updateDoc(
      doc(db, 'clients', clientId, 'pieces', piece.id),
      { status: newStatus }
    )
  }

  const active = useMemo(() => pieces.filter(p => {
    if (p.status === 'publicado') return false
    if (activeTab !== 'all' && p.format !== activeTab) return false
    return true
  }), [pieces, activeTab])

  const published = useMemo(() => {
    const list = pieces.filter(p => p.status === 'publicado')
    if (pubFilter !== 'all') return list.filter(p => p.format === pubFilter)
    return list
  }, [pieces, pubFilter])

  const usedFormats = useMemo(() => {
    const s = new Set(pieces.filter(p => p.status !== 'publicado').map(p => p.format).filter(Boolean))
    return ALL_FORMATS.filter(f => s.has(f))
  }, [pieces])

  const pubFormats = useMemo(() => {
    const s = new Set(pieces.filter(p => p.status === 'publicado').map(p => p.format).filter(Boolean))
    return ALL_FORMATS.filter(f => s.has(f))
  }, [pieces])

  if (selected) {
    return <PieceDetailPanel piece={selected} clientId={clientId} onClose={() => setSelected(null)} />
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-k-text text-2xl font-semibold">Mi Gestor</h1>
          <p className="text-k-muted text-sm mt-1">Registro de todo tu contenido</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('cards')}
            className={`p-2 rounded-card transition-colors ${viewMode === 'cards' ? 'bg-k-surface2 text-k-text' : 'text-k-muted hover:text-k-text'}`}>
            <FiGrid size={16} />
          </button>
          <button onClick={() => setViewMode('table')}
            className={`p-2 rounded-card transition-colors ${viewMode === 'table' ? 'bg-k-surface2 text-k-text' : 'text-k-muted hover:text-k-text'}`}>
            <FiList size={16} />
          </button>
        </div>
      </div>

      {/* Format tabs */}
      <div className="flex mb-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
        {[{ key: 'all', label: 'Todos' }, ...usedFormats.map(f => ({ key: f, label: f }))].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key ? 'border-k-orange text-k-orange' : 'border-transparent text-k-muted hover:text-k-text'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-k-orange/30 border-t-k-orange rounded-full animate-spin" />
        </div>
      ) : viewMode === 'cards' ? (
        active.length === 0 ? (
          <div className="bg-k-surface rounded-card-lg p-12 text-center" style={{ border: '1px solid var(--color-border)' }}>
            <p className="text-k-muted text-sm">No hay piezas activas con este filtro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {active.map(p => (
              <div key={p.id}
                className="bg-k-surface rounded-card-lg p-4 flex flex-col gap-3"
                style={{
                  border: '1px solid var(--color-border)',
                  borderLeft: `3px solid ${FORMAT_BORDER[p.format] ?? 'var(--color-border)'}`,
                }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-k-text font-medium text-sm leading-snug">{p.title}</p>
                  <StatusBadge status={p.status} />
                </div>
                {p.format && <FormatBadge format={p.format} />}
                {p.objective && <p className="text-k-muted text-xs">{p.objective}</p>}
                <p className="text-k-muted text-xs">{formatDate(p.publishDate)}</p>
                <div className="flex items-center gap-2 mt-auto">
                  <select
                    value={p.status ?? 'en_revision'}
                    onChange={e => handleStatusChange(p, e.target.value)}
                    className="flex-1 bg-k-bg text-k-text text-xs px-2 py-1.5 rounded-card outline-none cursor-pointer"
                    style={{ border: '1px solid var(--color-border)' }}>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <button onClick={() => setSelected(p)}
                    className="p-1.5 rounded-card text-k-muted hover:text-k-text transition-colors"
                    style={{ border: '1px solid var(--color-border)' }}>
                    <FiEdit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(p)}
                    className="p-1.5 rounded-card text-k-muted hover:text-red-400 transition-colors"
                    style={{ border: '1px solid var(--color-border)' }}>
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Table view */
        active.length === 0 ? (
          <div className="bg-k-surface rounded-card-lg p-12 text-center" style={{ border: '1px solid var(--color-border)' }}>
            <p className="text-k-muted text-sm">No hay piezas activas con este filtro.</p>
          </div>
        ) : (
          <div className="rounded-card-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            <table className="w-full">
              <thead>
                <tr className="bg-k-surface" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Título', 'Formato', 'Objetivo', 'Fecha', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="text-left text-xs text-k-muted font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {active.map(p => (
                  <tr key={p.id} className="hover:bg-k-surface/50 transition-colors" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-8 rounded-full shrink-0" style={{ background: FORMAT_BORDER[p.format] ?? 'var(--color-border)' }} />
                        <span className="text-k-text text-sm font-medium">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><FormatBadge format={p.format} /></td>
                    <td className="px-4 py-3 text-k-muted text-sm">{p.objective || '—'}</td>
                    <td className="px-4 py-3 text-k-muted text-sm">{formatDate(p.publishDate)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={p.status ?? 'en_revision'}
                        onChange={e => handleStatusChange(p, e.target.value)}
                        className="bg-k-surface2 text-k-text text-xs px-2 py-1 rounded outline-none cursor-pointer"
                        style={{ border: '1px solid var(--color-border)' }}>
                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setSelected(p)} className="text-k-muted hover:text-k-text text-xs flex items-center gap-1 transition-colors">
                          <FiEdit2 size={12} /> Ver
                        </button>
                        <button onClick={() => handleDelete(p)} className="text-k-muted hover:text-red-400 transition-colors">
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Published section */}
      {published.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-k-text font-semibold text-sm">Contenido publicado</h2>
            {pubFormats.length > 1 && (
              <select
                value={pubFilter}
                onChange={e => setPubFilter(e.target.value)}
                className="bg-k-surface text-k-text text-xs px-2.5 py-1.5 rounded-card outline-none cursor-pointer"
                style={{ border: '1px solid var(--color-border)' }}>
                <option value="all">Todos los formatos</option>
                {pubFormats.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            )}
          </div>
          <div className="rounded-card-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            <table className="w-full">
              <thead>
                <tr className="bg-k-surface" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Título', 'Formato', 'Objetivo', 'Fecha publicación', 'Acciones'].map(h => (
                    <th key={h} className="text-left text-xs text-k-muted font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {published.map(p => (
                  <tr key={p.id} className="hover:bg-k-surface/50 transition-colors" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-8 rounded-full shrink-0" style={{ background: FORMAT_BORDER[p.format] ?? 'var(--color-border)' }} />
                        <div>
                          <p className="text-k-text text-sm font-medium">{p.title}</p>
                          <span className="text-xs text-green-400">Publicado</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><FormatBadge format={p.format} /></td>
                    <td className="px-4 py-3 text-k-muted text-sm">{p.objective || '—'}</td>
                    <td className="px-4 py-3 text-k-muted text-sm">{formatDate(p.publishDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setSelected(p)} className="text-k-muted hover:text-k-text text-xs flex items-center gap-1 transition-colors">
                          <FiEdit2 size={12} /> Ver
                        </button>
                        <button onClick={() => handleDelete(p)} className="text-k-muted hover:text-red-400 transition-colors">
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
