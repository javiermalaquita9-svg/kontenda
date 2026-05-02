import { useState, useMemo, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore'
import {
  FiPlus, FiX, FiEdit2, FiTrash2, FiCopy, FiArchive, FiLink, FiFileText,
} from 'react-icons/fi'
import { db } from '../../firebase/config'
import { useClients } from '../../hooks/useClients'
import { useScripts } from '../../hooks/useScripts'
import { useToast } from '../../context/ToastContext'

const BLANK_IDEA   = { type: 'idea',   clientId: '', title: '', description: '', pillar: '', objective: '' }
const BLANK_SCRIPT = { type: 'script', clientId: '', title: '', duration: '', pillar: '', objective: '', description: '' }

const INP   = 'w-full bg-k-surface2 text-k-text text-sm px-3.5 py-2.5 rounded-card outline-none focus:ring-2 focus:ring-k-orange/30 placeholder:text-k-muted/40'
const INP_S = { border: '1px solid var(--color-border)' }

function Tag({ children, color = 'lila' }) {
  const cls = color === 'orange' ? 'bg-k-orange/10 text-k-orange' : 'bg-k-lila/10 text-k-lila'
  return <span className={`text-xs px-2 py-0.5 rounded font-medium ${cls}`}>{children}</span>
}

export default function Scripts() {
  const { clients }         = useClients()
  const { scripts, loading } = useScripts()
  const { showToast }       = useToast()

  const [activeTab,   setActiveTab]   = useState('ideas')
  const [formOpen,    setFormOpen]    = useState(false)
  const [editingId,   setEditingId]   = useState(null)
  const [form,        setForm]        = useState(BLANK_IDEA)
  const [saving,      setSaving]      = useState(false)
  const [linkScript,  setLinkScript]  = useState(null)
  const [linkPieces,  setLinkPieces]  = useState([])

  const ideas   = scripts.filter(s => s.type === 'idea')
  const guiones = scripts.filter(s => s.type === 'script')

  const selectedClient = useMemo(
    () => clients.find(c => c.id === form.clientId) ?? null,
    [clients, form.clientId]
  )

  // Load pieces when link modal opens
  useEffect(() => {
    if (!linkScript?.clientId) { setLinkPieces([]); return }
    const unsub = onSnapshot(
      collection(db, 'clients', linkScript.clientId, 'pieces'),
      snap => setLinkPieces(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [linkScript])

  function set(key, val) { setForm(p => ({ ...p, [key]: val })) }

  function openNew() {
    setEditingId(null)
    setForm(activeTab === 'ideas' ? { ...BLANK_IDEA } : { ...BLANK_SCRIPT })
    setFormOpen(true)
  }

  function openEdit(script) {
    setEditingId(script.id)
    setForm({ ...script })
    setFormOpen(true)
  }

  function switchTab(tab) {
    setActiveTab(tab)
    setFormOpen(false)
    setEditingId(null)
  }

  function convertToScript(idea) {
    setEditingId(null)
    setForm({
      type:        'script',
      clientId:    idea.clientId,
      title:       idea.title,
      description: idea.description,
      pillar:      idea.pillar,
      objective:   idea.objective,
      duration:    '',
    })
    setActiveTab('guiones')
    setFormOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.clientId) {
      showToast('Título y cliente son requeridos.', 'error')
      return
    }
    setSaving(true)
    try {
      const data = {
        type:        form.type,
        clientId:    form.clientId,
        clientName:  clients.find(c => c.id === form.clientId)?.name ?? '',
        title:       form.title.trim(),
        description: form.description.trim(),
        pillar:      form.pillar,
        objective:   form.objective,
        archived:    false,
        ...(form.type === 'script' && { duration: form.duration }),
      }
      if (editingId) {
        await updateDoc(doc(db, 'scripts', editingId), data)
        showToast('Actualizado.')
      } else {
        await addDoc(collection(db, 'scripts'), { ...data, createdAt: serverTimestamp() })
        showToast(form.type === 'idea' ? 'Idea guardada.' : 'Guion guardado.')
      }
      setFormOpen(false)
    } catch {
      showToast('Error al guardar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive(id) {
    try {
      await updateDoc(doc(db, 'scripts', id), { archived: true })
      showToast('Archivado.')
    } catch {
      showToast('Error.', 'error')
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`¿Eliminar "${title}"?`)) return
    try {
      await deleteDoc(doc(db, 'scripts', id))
      showToast('Eliminado.')
    } catch {
      showToast('Error al eliminar.', 'error')
    }
  }

  async function copyToClipboard(script) {
    try {
      await navigator.clipboard.writeText(`${script.title}\n\n${script.description}`)
      showToast('Copiado al portapapeles.')
    } catch {
      showToast('No se pudo copiar.', 'error')
    }
  }

  async function linkToPiece(pieceId) {
    if (!linkScript) return
    try {
      await updateDoc(doc(db, 'scripts', linkScript.id), { linkedPieceId: pieceId })
      showToast('Vinculado correctamente.')
      setLinkScript(null)
    } catch {
      showToast('Error al vincular.', 'error')
    }
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-k-text text-2xl font-semibold">Guiones</h1>
          <p className="text-k-muted text-sm mt-0.5">Ideas y guiones de contenido</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-k-orange hover:bg-k-orange/90 text-white text-sm font-medium px-4 py-2.5 rounded-card transition-colors">
          <FiPlus size={16} />
          {activeTab === 'ideas' ? 'Nueva Idea' : 'Nuevo Guion'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex mb-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
        {[{ key: 'ideas', label: 'Ideas', count: ideas.length }, { key: 'guiones', label: 'Guiones', count: guiones.length }].map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-k-orange text-k-orange' : 'border-transparent text-k-muted hover:text-k-text'}`}>
            {t.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === t.key ? 'bg-k-orange/15' : 'bg-k-surface2'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Form */}
      {formOpen && (
        <div className="bg-k-surface rounded-card-lg p-6 mb-6" style={{ border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-k-text font-semibold">
              {editingId ? 'Editar' : activeTab === 'ideas' ? 'Nueva Idea' : 'Nuevo Guion'}
            </h3>
            <button onClick={() => setFormOpen(false)} className="text-k-muted hover:text-k-text transition-colors">
              <FiX size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-k-muted text-sm mb-1.5">Cliente *</label>
              <select value={form.clientId} onChange={e => set('clientId', e.target.value)} className={`${INP} cursor-pointer`} style={INP_S}>
                <option value="">Selecciona un cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-k-muted text-sm mb-1.5">Título *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Título..." className={INP} style={INP_S} />
            </div>
            {form.type === 'script' && (
              <div>
                <label className="block text-k-muted text-sm mb-1.5">Duración estimada</label>
                <input value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="ej: 60 segundos, 3 min" className={INP} style={INP_S} />
              </div>
            )}
            <div>
              <label className="block text-k-muted text-sm mb-1.5">Pilar de contenido</label>
              <select value={form.pillar} onChange={e => set('pillar', e.target.value)} className={`${INP} cursor-pointer`} style={INP_S}>
                <option value="">Sin pilar</option>
                {(selectedClient?.contentPillars ?? []).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-k-muted text-sm mb-1.5">Objetivo</label>
              <select value={form.objective} onChange={e => set('objective', e.target.value)} className={`${INP} cursor-pointer`} style={INP_S}>
                <option value="">Sin objetivo</option>
                {(selectedClient?.objectives ?? []).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-k-muted text-sm mb-1.5">
              {form.type === 'script' ? 'Contenido del guion' : 'Descripción breve'}
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={form.type === 'script' ? 10 : 3}
              placeholder={form.type === 'script' ? 'Escribe el guion completo aquí...' : 'Descripción breve de la idea...'}
              className={`${INP} resize-none`}
              style={INP_S}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setFormOpen(false)} className="px-5 py-2.5 rounded-card text-sm text-k-muted hover:text-k-text transition-colors" style={INP_S}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-card text-sm font-medium bg-k-orange hover:bg-k-orange/90 text-white transition-colors disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-k-orange/30 border-t-k-orange rounded-full animate-spin" />
        </div>
      ) : activeTab === 'ideas' ? (
        ideas.length === 0 ? (
          <div className="bg-k-surface rounded-card-lg p-12 text-center" style={{ border: '1px solid var(--color-border)' }}>
            <p className="text-k-muted text-sm">No hay ideas. Crea la primera.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {ideas.map(idea => (
              <div key={idea.id} className="bg-k-surface rounded-card-lg p-5 flex flex-col gap-3" style={{ border: '1px solid var(--color-border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-k-muted text-xs">{idea.clientName}</p>
                </div>
                <h3 className="text-k-text font-medium text-sm leading-snug">{idea.title}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {idea.pillar    && <Tag>{idea.pillar}</Tag>}
                  {idea.objective && <span className="text-k-muted text-xs">{idea.objective}</span>}
                </div>
                {idea.description && (
                  <p className="text-k-muted text-xs leading-relaxed line-clamp-3">{idea.description}</p>
                )}
                <div className="flex gap-1.5 flex-wrap mt-auto pt-1">
                  <button onClick={() => convertToScript(idea)} className="flex items-center gap-1 text-xs text-k-orange hover:text-k-orange/80 bg-k-orange/10 px-2.5 py-1.5 rounded-card transition-colors">
                    <FiFileText size={11} /> Crear guion
                  </button>
                  <button onClick={() => copyToClipboard(idea)} className="flex items-center gap-1 text-xs text-k-muted hover:text-k-text bg-k-surface2 px-2.5 py-1.5 rounded-card transition-colors">
                    <FiCopy size={11} /> Copiar
                  </button>
                  <button onClick={() => handleArchive(idea.id)} className="flex items-center gap-1 text-xs text-k-muted hover:text-k-text bg-k-surface2 px-2.5 py-1.5 rounded-card transition-colors">
                    <FiArchive size={11} /> Archivar
                  </button>
                  <button onClick={() => openEdit(idea)} className="flex items-center gap-1 text-xs text-k-muted hover:text-k-text bg-k-surface2 px-2.5 py-1.5 rounded-card transition-colors">
                    <FiEdit2 size={11} /> Editar
                  </button>
                  <button onClick={() => handleDelete(idea.id, idea.title)} className="text-k-muted hover:text-red-400 bg-k-surface2 px-2.5 py-1.5 rounded-card transition-colors">
                    <FiTrash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        guiones.length === 0 ? (
          <div className="bg-k-surface rounded-card-lg p-12 text-center" style={{ border: '1px solid var(--color-border)' }}>
            <p className="text-k-muted text-sm">No hay guiones. Crea el primero.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {guiones.map(g => (
              <div key={g.id} className="bg-k-surface rounded-card-lg p-5 flex flex-col gap-3" style={{ border: '1px solid var(--color-border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-k-text font-medium text-sm leading-snug">{g.title}</h3>
                  {g.linkedPieceId && <Tag color="orange">Vinculado</Tag>}
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="text-k-muted text-xs">{g.clientName}</span>
                  {g.duration && <span className="text-k-muted text-xs">· {g.duration}</span>}
                  {g.pillar && <Tag>{g.pillar}</Tag>}
                </div>
                {g.description && (
                  <p className="text-k-muted text-xs leading-relaxed line-clamp-4">{g.description}</p>
                )}
                <div className="flex gap-1.5 flex-wrap mt-auto pt-1">
                  <button onClick={() => setLinkScript(g)} className="flex items-center gap-1 text-xs text-k-muted hover:text-k-text bg-k-surface2 px-2.5 py-1.5 rounded-card transition-colors">
                    <FiLink size={11} /> Vincular pieza
                  </button>
                  <button onClick={() => openEdit(g)} className="flex items-center gap-1 text-xs text-k-muted hover:text-k-text bg-k-surface2 px-2.5 py-1.5 rounded-card transition-colors">
                    <FiEdit2 size={11} /> Editar
                  </button>
                  <button onClick={() => handleDelete(g.id, g.title)} className="text-k-muted hover:text-red-400 bg-k-surface2 px-2.5 py-1.5 rounded-card transition-colors">
                    <FiTrash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Link to piece modal */}
      {linkScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-k-surface rounded-card-lg p-6 w-full max-w-md mx-4" style={{ border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-k-text font-semibold">Vincular con pieza</h3>
              <button onClick={() => setLinkScript(null)} className="text-k-muted hover:text-k-text"><FiX size={18} /></button>
            </div>
            <p className="text-k-muted text-sm mb-3">Piezas de {linkScript.clientName}:</p>
            {linkPieces.length === 0 ? (
              <p className="text-k-muted text-sm text-center py-6">No hay piezas para este cliente.</p>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
                {linkPieces.map(piece => (
                  <button key={piece.id} onClick={() => linkToPiece(piece.id)}
                    className={`text-left px-3 py-2.5 rounded-card text-sm transition-colors ${
                      linkScript.linkedPieceId === piece.id
                        ? 'bg-k-orange/10 text-k-orange'
                        : 'text-k-text hover:bg-k-surface2'
                    }`}
                    style={{ border: '1px solid var(--color-border)' }}>
                    {piece.title}
                    {piece.format && <span className="text-k-muted text-xs ml-2">{piece.format}</span>}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setLinkScript(null)} className="mt-4 text-k-muted hover:text-k-text text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
