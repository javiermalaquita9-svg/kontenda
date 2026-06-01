import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useClients } from '../../hooks/useClients'
import { useToast } from '../../context/ToastContext'
import { inputToTs } from '../../utils/date'

const DEFAULT_PILLAR_LABELS = [
  'Educación y Valor',
  'Inspiración y Detrás de Escena',
  'Comercial y Promocional',
  'Interacción y Entretenimiento',
]

function equalPillars(pillars) {
  const n = pillars.length
  if (!n) return {}
  const base = Math.floor(100 / n)
  const rem = 100 - base * n
  return Object.fromEntries(pillars.map((p, i) => [p, i === 0 ? base + rem : base]))
}

const BLANK = {
  title:       '',
  clientId:    '',
  publishDate: '',
  objective:   '',
  format:      '',
  tag:         '',
  description: '',
  driveUrl:    '',
  frameUrl:    '',
  hashtags:    '',
  copy:        '',
  pillars:     equalPillars(DEFAULT_PILLAR_LABELS),
}

const INP = 'w-full bg-k-surface2 text-k-text text-sm px-3.5 py-2.5 rounded-card outline-none focus:ring-2 focus:ring-k-orange/30 placeholder:text-k-muted/40'
const INP_S = { border: '1px solid var(--color-border)' }

function SelectBtn({ value, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-card text-sm transition-colors ${
        active ? 'bg-k-orange text-white' : 'bg-k-surface2 text-k-muted hover:text-k-text'
      }`}>
      {value}
    </button>
  )
}

export default function CreatePiece() {
  const navigate = useNavigate()
  const { clients } = useClients()
  const { showToast } = useToast()

  const [form, setForm]     = useState(BLANK)
  const [saving, setSaving] = useState(false)

  const selectedClient = useMemo(
    () => clients.find(c => c.id === form.clientId) ?? null,
    [clients, form.clientId]
  )

  function set(key, val) { setForm(p => ({ ...p, [key]: val })) }
  function setPillar(key, val) {
    setForm(p => ({ ...p, pillars: { ...p.pillars, [key]: val } }))
  }

  const activePillars = useMemo(() => {
    if (selectedClient?.contentPillars?.length) return selectedClient.contentPillars
    return DEFAULT_PILLAR_LABELS
  }, [selectedClient])

  function handleClientChange(id) {
    const client = clients.find(c => c.id === id)
    const pillars = client?.contentPillars?.length ? client.contentPillars : DEFAULT_PILLAR_LABELS
    setForm(p => ({ ...p, clientId: id, objective: '', format: '', tag: '', pillars: equalPillars(pillars) }))
  }

  const total = Object.values(form.pillars).reduce((s, v) => s + (parseInt(v) || 0), 0)
  const totalOk = total === 100

  async function handleSave() {
    if (!form.title.trim())   { showToast('El título es requerido.', 'error'); return }
    if (!form.clientId)       { showToast('Selecciona un cliente.', 'error'); return }
    if (!totalOk)             { showToast('Los pilares deben sumar 100%.', 'error'); return }
    if (!form.publishDate)    { showToast('La fecha de publicación es requerida.', 'error'); return }

    setSaving(true)
    try {
      const data = {
        title:       form.title.trim(),
        clientId:    form.clientId,
        clientName:  selectedClient?.name ?? '',
        publishDate: inputToTs(form.publishDate),
        objective:   form.objective,
        pillars: Object.fromEntries(
          Object.entries(form.pillars).map(([k, v]) => [k, parseInt(v) || 0])
        ),
        format:         form.format,
        tag:            form.tag,
        description:    form.description.trim(),
        driveUrl:       form.driveUrl.trim(),
        frameUrl:       form.frameUrl.trim(),
        hashtags:       form.hashtags.trim(),
        copy:           form.copy.trim(),
        status:         'en_revision',
        reviewRounds:    0,
        maxReviewRounds: 3,
        createdAt:      serverTimestamp(),
      }
      await addDoc(collection(db, 'clients', form.clientId, 'pieces'), data)
      showToast('Pieza creada correctamente.')
      navigate('/admin/gestor')
    } catch {
      showToast('Error al guardar. Intenta nuevamente.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-k-text text-2xl font-semibold">Crear Pieza</h1>
        <p className="text-k-muted text-sm mt-0.5">Nueva pieza de contenido</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Columna izquierda ── */}
        <div className="flex flex-col gap-5 flex-[3]">

          {/* Título */}
          <div>
            <label className="block text-k-muted text-sm mb-1.5">Nombre de la pieza *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej: Reel de producto X" className={INP} style={INP_S} />
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-k-muted text-sm mb-1.5">Cliente *</label>
            <select value={form.clientId} onChange={e => handleClientChange(e.target.value)} className={`${INP} cursor-pointer`} style={INP_S}>
              <option value="">Selecciona un cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-k-muted text-sm mb-1.5">Fecha de publicación *</label>
            <input type="date" value={form.publishDate} onChange={e => set('publishDate', e.target.value)} className={`${INP} cursor-pointer`} style={INP_S} />
          </div>

          {/* Objetivo */}
          {selectedClient?.objectives?.length > 0 && (
            <div>
              <label className="block text-k-muted text-sm mb-2">Objetivo principal</label>
              <div className="flex flex-wrap gap-2">
                {selectedClient.objectives.map(obj => (
                  <SelectBtn key={obj} value={obj} active={form.objective === obj} onClick={() => set('objective', form.objective === obj ? '' : obj)} />
                ))}
              </div>
            </div>
          )}

          {/* Pilares */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-k-muted text-sm">Pilares de contenido *</label>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${totalOk ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                {total}%
              </span>
            </div>
            <div className="bg-k-surface rounded-card p-4 flex flex-col gap-3" style={{ border: '1px solid var(--color-border)' }}>
              {activePillars.map(pillar => (
                <div key={pillar} className="flex items-center gap-3">
                  <span className="text-k-muted text-sm flex-1 min-w-0 truncate">{pillar}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number" min="0" max="100"
                      value={form.pillars[pillar] ?? 0}
                      onChange={e => setPillar(pillar, e.target.value)}
                      className="w-16 bg-k-surface2 text-k-text text-sm text-center px-2 py-1.5 rounded-card outline-none focus:ring-2 focus:ring-k-orange/30"
                      style={INP_S}
                    />
                    <span className="text-k-muted text-sm">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formato */}
          {selectedClient?.formats?.length > 0 && (
            <div>
              <label className="block text-k-muted text-sm mb-2">Formato</label>
              <div className="flex flex-wrap gap-2">
                {selectedClient.formats.map(fmt => (
                  <SelectBtn key={fmt} value={fmt} active={form.format === fmt} onClick={() => set('format', form.format === fmt ? '' : fmt)} />
                ))}
              </div>
            </div>
          )}

          {/* Etiqueta */}
          {selectedClient?.tags?.length > 0 && (
            <div>
              <label className="block text-k-muted text-sm mb-2">Etiqueta</label>
              <div className="flex flex-wrap gap-2">
                {selectedClient.tags.map(tag => (
                  <SelectBtn key={tag} value={tag} active={form.tag === tag} onClick={() => set('tag', form.tag === tag ? '' : tag)} />
                ))}
              </div>
            </div>
          )}

          {!form.clientId && (
            <p className="text-k-muted text-xs italic">Selecciona un cliente para ver los objetivos, formatos y etiquetas disponibles.</p>
          )}
        </div>

        {/* ── Columna derecha ── */}
        <div className="flex flex-col gap-5 flex-[2]">
          <div>
            <label className="block text-k-muted text-sm mb-1.5">Descripción del video</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="¿De qué trata esta pieza?" className={`${INP} resize-none`} style={INP_S} />
          </div>

          <div>
            <label className="block text-k-muted text-sm mb-1.5">Enlace carpeta Drive</label>
            <input value={form.driveUrl} onChange={e => set('driveUrl', e.target.value)} placeholder="https://drive.google.com/..." className={INP} style={INP_S} />
          </div>

          <div>
            <label className="block text-k-muted text-sm mb-1.5">Enlace Frame.io</label>
            <input value={form.frameUrl} onChange={e => set('frameUrl', e.target.value)} placeholder="https://app.frame.io/..." className={INP} style={INP_S} />
          </div>

          <div>
            <label className="block text-k-muted text-sm mb-1.5">Hashtags</label>
            <textarea value={form.hashtags} onChange={e => set('hashtags', e.target.value)} rows={3} placeholder="#marca #producto..." className={`${INP} resize-none`} style={INP_S} />
          </div>

          <div>
            <label className="block text-k-muted text-sm mb-1.5">Copy de la publicación</label>
            <textarea value={form.copy} onChange={e => set('copy', e.target.value)} rows={5} placeholder="Texto para la publicación en redes..." className={`${INP} resize-none`} style={INP_S} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
        <button onClick={() => navigate('/admin/gestor')} className="w-full sm:w-auto px-5 py-2.5 rounded-card text-sm text-k-muted hover:text-k-text transition-colors" style={{ border: '1px solid var(--color-border)' }}>
          Cancelar
        </button>
        <button onClick={handleSave} disabled={saving} className="w-full sm:w-auto px-5 py-2.5 rounded-card text-sm font-medium bg-k-orange hover:bg-k-orange/90 text-white transition-colors disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar pieza'}
        </button>
      </div>
    </div>
  )
}
