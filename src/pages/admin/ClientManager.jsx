import { useState } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import {
  FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiX, FiCheck, FiGlobe,
  FiMapPin, FiFolder, FiInstagram, FiFacebook, FiYoutube,
} from 'react-icons/fi'
import { SiTiktok } from 'react-icons/si'
import { db } from '../../firebase/config'
import { useClients } from '../../hooks/useClients'
import { useToast } from '../../context/ToastContext'

// ── Icon config ────────────────────────────────────────────────
const LINK_ICONS = {
  instagram: { Icon: FiInstagram, label: 'Instagram' },
  tiktok:    { Icon: SiTiktok,    label: 'TikTok' },
  facebook:  { Icon: FiFacebook,  label: 'Facebook' },
  youtube:   { Icon: FiYoutube,   label: 'YouTube' },
  maps:      { Icon: FiMapPin,    label: 'Google Maps' },
  web:       { Icon: FiGlobe,     label: 'Web' },
  drive:     { Icon: FiFolder,    label: 'Drive' },
}

const DEFAULT_PILLARS   = ['Educación y Valor', 'Inspiración y Detrás de Escena', 'Comercial y Promocional', 'Interacción y Entretenimiento']
const DEFAULT_OBJECTIVES = ['Posicionamiento', 'Autoridad y Confianza', 'Conversión y Ventas']
const DEFAULT_FORMATS   = ['Reels/TikTok', 'Post', 'Carrusel', 'Story', 'Meta Ads']

const BLANK_FORM = {
  name: '', email: '', rut: '', address: '', description: '', logoUrl: '',
  quickLinks: [],
  contentPillars: [...DEFAULT_PILLARS],
  objectives: [...DEFAULT_OBJECTIVES],
  tags: [],
  formats: [...DEFAULT_FORMATS],
}

// ── Local helpers ──────────────────────────────────────────────
const INP = 'w-full bg-k-surface2 text-k-text text-sm px-3.5 py-2.5 rounded-card outline-none focus:ring-2 focus:ring-k-orange/30 placeholder:text-k-muted/40'
const INP_STYLE = { border: '1px solid var(--color-border)' }

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-k-muted text-sm mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-k-surface rounded-card-lg p-6" style={{ border: '1px solid var(--color-border)' }}>
      <h3 className="text-k-text font-semibold text-sm mb-4 uppercase tracking-wide opacity-70">{title}</h3>
      {children}
    </div>
  )
}

function ChipInput({ chips, onAdd, onRemove, placeholder }) {
  const [val, setVal] = useState('')
  function add() {
    const trimmed = val.trim()
    if (trimmed && !chips.includes(trimmed)) { onAdd(trimmed); setVal('') }
  }
  return (
    <>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {chips.map((c, i) => (
          <span key={i} className="flex items-center gap-1 bg-k-surface2 text-k-text text-xs px-2.5 py-1 rounded-full">
            {c}
            <button type="button" onClick={() => onRemove(i)} className="text-k-muted hover:text-red-400 ml-0.5 leading-none">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          className={`${INP} flex-1`}
          style={INP_STYLE}
        />
        <button type="button" onClick={add} className="px-3 py-2 bg-k-surface2 hover:bg-k-surface2/70 text-k-muted hover:text-k-text rounded-card text-sm transition-colors" style={INP_STYLE}>
          +
        </button>
      </div>
    </>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function ClientManager() {
  const { clients, loading } = useClients()
  const { showToast } = useToast()

  const [view, setView]           = useState('list')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm]           = useState(BLANK_FORM)
  const [saving, setSaving]       = useState(false)

  // Quick link form
  const [linkForm, setLinkForm] = useState({ label: '', url: '', icon: 'instagram' })

  function set(key, val) { setForm(p => ({ ...p, [key]: val })) }

  function openNew() {
    setEditingId(null)
    setForm(BLANK_FORM)
    setView('form')
  }

  function openEdit(client) {
    setEditingId(client.id)
    setForm({
      name:           client.name          ?? '',
      email:          client.email         ?? '',
      rut:            client.rut           ?? '',
      address:        client.address       ?? '',
      description:    client.description   ?? '',
      logoUrl:        client.logoUrl       ?? '',
      quickLinks:     client.quickLinks    ?? [],
      contentPillars: client.contentPillars ?? [...DEFAULT_PILLARS],
      objectives:     client.objectives    ?? [...DEFAULT_OBJECTIVES],
      tags:           client.tags          ?? [],
      formats:        client.formats       ?? [...DEFAULT_FORMATS],
    })
    setView('form')
  }

  async function handleSave() {
    if (!form.name.trim()) { showToast('El nombre del cliente es requerido.', 'error'); return }
    setSaving(true)
    try {
      const data = { ...form }
      if (editingId) {
        await updateDoc(doc(db, 'clients', editingId), data)
        showToast('Cliente actualizado.')
      } else {
        await addDoc(collection(db, 'clients'), { ...data, createdAt: serverTimestamp() })
        showToast('Cliente creado.')
      }
      setView('list')
    } catch {
      showToast('Error al guardar. Intenta nuevamente.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`¿Eliminar el cliente "${name}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteDoc(doc(db, 'clients', id))
      showToast('Cliente eliminado.')
    } catch {
      showToast('Error al eliminar.', 'error')
    }
  }

  function addLink() {
    if (!linkForm.label.trim() || !linkForm.url.trim()) return
    set('quickLinks', [...form.quickLinks, { ...linkForm }])
    setLinkForm({ label: '', url: '', icon: 'instagram' })
  }

  function toggleFormat(fmt) {
    set('formats', form.formats.includes(fmt)
      ? form.formats.filter(f => f !== fmt)
      : [...form.formats, fmt])
  }

  // ── List view ──────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-k-text text-2xl font-semibold">Gestión de Clientes</h1>
            <p className="text-k-muted text-sm mt-0.5">{clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 bg-k-orange hover:bg-k-orange/90 text-white text-sm font-medium px-4 py-2.5 rounded-card transition-colors">
            <FiPlus size={16} />
            Nuevo Cliente
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-k-orange/30 border-t-k-orange rounded-full animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-k-surface rounded-card-lg p-12 text-center" style={{ border: '1px solid var(--color-border)' }}>
            <p className="text-k-muted text-sm">No hay clientes aún. Crea el primero.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {clients.map(client => {
              const Icon = LINK_ICONS[client.quickLinks?.[0]?.icon]?.Icon
              return (
                <div key={client.id} className="bg-k-surface rounded-card-lg p-5 flex flex-col gap-3" style={{ border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-3">
                    {client.logoUrl ? (
                      <img src={client.logoUrl} alt={client.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-k-surface2 flex items-center justify-center text-k-orange font-bold text-lg shrink-0">
                        {client.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-k-text font-medium text-sm truncate">{client.name}</p>
                      <p className="text-k-muted text-xs truncate">{client.email}</p>
                    </div>
                  </div>

                  {/* Quick links preview */}
                  {client.quickLinks?.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {client.quickLinks.slice(0, 4).map((lk, i) => {
                        const Ic = LINK_ICONS[lk.icon]?.Icon ?? FiGlobe
                        return (
                          <a key={i} href={lk.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-k-muted hover:text-k-text text-xs px-2 py-1 rounded bg-k-surface2 transition-colors">
                            <Ic size={11} /> {lk.label}
                          </a>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => openEdit(client)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-k-muted hover:text-k-text bg-k-surface2 hover:bg-k-surface2/70 px-3 py-2 rounded-card transition-colors">
                      <FiEdit2 size={13} /> Editar
                    </button>
                    <button onClick={() => handleDelete(client.id, client.name)} className="px-3 py-2 rounded-card text-k-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Form view ──────────────────────────────────────────────
  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setView('list')} className="text-k-muted hover:text-k-text transition-colors">
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-k-text text-2xl font-semibold">
          {editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h1>
      </div>

      <div className="flex flex-col gap-4">
        {/* Sección 1 — Datos */}
        <Section title="Datos del cliente">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre completo *">
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nombre del cliente" className={INP} style={INP_STYLE} />
            </Field>
            <Field label="Correo electrónico">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@ejemplo.com" className={INP} style={INP_STYLE} />
            </Field>
            <Field label="RUT">
              <input value={form.rut} onChange={e => set('rut', e.target.value)} placeholder="12.345.678-9" className={INP} style={INP_STYLE} />
            </Field>
            <Field label="Dirección">
              <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Av. Principal 123" className={INP} style={INP_STYLE} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Descripción del negocio">
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="¿A qué se dedica este cliente?" className={`${INP} resize-none`} style={INP_STYLE} />
            </Field>
          </div>
        </Section>

        {/* Sección 2 — Logo */}
        <Section title="Logo">
          <Field label="URL del logo (PNG/JPG/SVG)">
            <input value={form.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://..." className={INP} style={INP_STYLE} />
          </Field>
          {form.logoUrl && (
            <div className="mt-3 flex items-center gap-3">
              <img src={form.logoUrl} alt="preview" className="w-16 h-16 rounded-card object-cover bg-k-surface2" onError={e => { e.target.style.display = 'none' }} />
              <p className="text-k-muted text-xs">Vista previa del logo</p>
            </div>
          )}
        </Section>

        {/* Sección 3 — Accesos rápidos */}
        <Section title="Botones de acceso rápido">
          {/* Existing links */}
          {form.quickLinks.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {form.quickLinks.map((lk, i) => {
                const { Icon, label } = LINK_ICONS[lk.icon] ?? { Icon: FiGlobe, label: 'Web' }
                return (
                  <div key={i} className="flex items-center gap-2 bg-k-surface2 px-3 py-2 rounded-card" style={{ border: '1px solid var(--color-border)' }}>
                    <Icon size={14} className="text-k-muted shrink-0" />
                    <span className="text-k-text text-sm">{lk.label}</span>
                    <span className="text-k-muted text-xs truncate flex-1 text-right">{lk.url}</span>
                    <button type="button" onClick={() => set('quickLinks', form.quickLinks.filter((_, j) => j !== i))} className="text-k-muted hover:text-red-400 ml-1 shrink-0">
                      <FiX size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add link form */}
          <div className="flex gap-2 flex-wrap">
            <input value={linkForm.label} onChange={e => setLinkForm(p => ({ ...p, label: e.target.value }))} placeholder="Label (ej: Instagram)" className={`${INP} flex-1 min-w-32`} style={INP_STYLE} />
            <input value={linkForm.url} onChange={e => setLinkForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." className={`${INP} flex-[2] min-w-48`} style={INP_STYLE} />
            <select value={linkForm.icon} onChange={e => setLinkForm(p => ({ ...p, icon: e.target.value }))} className="bg-k-surface2 text-k-text text-sm px-3 py-2.5 rounded-card outline-none cursor-pointer" style={INP_STYLE}>
              {Object.entries(LINK_ICONS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button type="button" onClick={addLink} className="flex items-center gap-1.5 px-3 py-2.5 bg-k-surface2 hover:bg-k-surface2/70 text-k-muted hover:text-k-text text-sm rounded-card transition-colors" style={INP_STYLE}>
              <FiPlus size={14} /> Agregar
            </button>
          </div>
        </Section>

        {/* Sección 4 — Configuración de contenido */}
        <Section title="Configuración de contenido">
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-k-muted text-sm mb-2">Pilares de contenido</p>
              <ChipInput
                chips={form.contentPillars}
                onAdd={c => set('contentPillars', [...form.contentPillars, c])}
                onRemove={i => set('contentPillars', form.contentPillars.filter((_, j) => j !== i))}
                placeholder="Agregar pilar..."
              />
            </div>

            <div>
              <p className="text-k-muted text-sm mb-2">Objetivos</p>
              <ChipInput
                chips={form.objectives}
                onAdd={c => set('objectives', [...form.objectives, c])}
                onRemove={i => set('objectives', form.objectives.filter((_, j) => j !== i))}
                placeholder="Agregar objetivo..."
              />
            </div>

            <div>
              <p className="text-k-muted text-sm mb-2">Etiquetas</p>
              <ChipInput
                chips={form.tags}
                onAdd={c => set('tags', [...form.tags, c])}
                onRemove={i => set('tags', form.tags.filter((_, j) => j !== i))}
                placeholder="Agregar etiqueta..."
              />
            </div>

            <div>
              <p className="text-k-muted text-sm mb-2">Formatos</p>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_FORMATS.map(fmt => {
                  const active = form.formats.includes(fmt)
                  return (
                    <button key={fmt} type="button" onClick={() => toggleFormat(fmt)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-card text-sm transition-colors ${
                        active ? 'bg-k-orange text-white' : 'bg-k-surface2 text-k-muted hover:text-k-text'
                      }`}>
                      {active && <FiCheck size={13} />}
                      {fmt}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button onClick={() => setView('list')} className="px-5 py-2.5 rounded-card text-sm text-k-muted hover:text-k-text transition-colors" style={{ border: '1px solid var(--color-border)' }}>
          Cancelar
        </button>
        <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-card text-sm font-medium bg-k-orange hover:bg-k-orange/90 text-white transition-colors disabled:opacity-50">
          {saving ? 'Guardando...' : editingId ? 'Actualizar cliente' : 'Guardar cliente'}
        </button>
      </div>
    </div>
  )
}
