import { useState } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc, // NEW: Import setDoc
} from 'firebase/firestore'
import {
  FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiX, FiCheck, FiGlobe,
  FiMapPin, FiFolder, FiInstagram, FiFacebook, FiYoutube, FiEye, FiEyeOff, FiMail,
} from 'react-icons/fi'
import { SiTiktok } from 'react-icons/si'
import { createAuthUser, changeAuthUserPassword, sendResetEmail } from '../../firebase/auth'
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
  name: '', email: '', phone: '', region: '', comuna: '', description: '', logoUrl: '',
  password: '', // NEW: Add password field
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
  const [saving, setSaving]             = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Change password panel (edit mode)
  const [pwPanel, setPwPanel]           = useState(false)
  const [newPw, setNewPw]               = useState('')
  const [showNewPw, setShowNewPw]       = useState(false)
  const [savingPw, setSavingPw]         = useState(false)
  const [sendingReset, setSendingReset] = useState(false)

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
      name:           client.name           ?? '',
      phone:          client.phone          ?? '',
      email:          client.email          ?? '',
      region:         client.region         ?? '',
      comuna:         client.comuna         ?? '',
      description:    client.description    ?? '',
      password:       client.loginPassword  ?? '',
      logoUrl:        client.logoUrl        ?? '',
      quickLinks:     client.quickLinks     ?? [],
      contentPillars: client.contentPillars ?? [...DEFAULT_PILLARS],
      objectives:     client.objectives     ?? [...DEFAULT_OBJECTIVES],
      tags:           client.tags           ?? [],
      formats:        client.formats        ?? [...DEFAULT_FORMATS],
    })
    setPwPanel(false)
    setNewPw('')
    setView('form')
  }

  async function handleSave() {
    if (!form.name.trim()) { showToast('El nombre del cliente es requerido.', 'error'); return }
    if (!form.email.trim()) { showToast('El email del cliente es requerido.', 'error'); return }
    
    // NEW: Password validation for new clients
    if (!editingId) { // Only for new clients
      if (!form.password.trim()) { showToast('La contraseña es requerida para nuevos clientes.', 'error'); return }
      if (form.password.length < 6) { // Firebase default minimum password length
        showToast('La contraseña debe tener al menos 6 caracteres.', 'error'); return
      }
    }

    setSaving(true)
    try {
      const { password, ...clientData } = form // Separate password from client data
      let clientIdToUse = editingId;

      if (editingId) {
        await updateDoc(doc(db, 'clients', editingId), clientData)
        showToast('Cliente actualizado.')
      } else {
        // 1. Crear usuario en Firebase Auth PRIMERO para validar que el email esté disponible
        const firebaseUser = await createAuthUser(form.email, password)

        // 2. Si Auth es exitoso, crear documento del cliente en Firestore
        const clientRef = await addDoc(collection(db, 'clients'), { ...clientData, loginPassword: password, createdAt: serverTimestamp() })
        clientIdToUse = clientRef.id; // Obtener el ID recién creado

        // 3. Create user document in Firestore (linking Firebase UID to client ID and role)
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          role: 'client',
          clientId: clientIdToUse,
          email: form.email,
          displayName: form.name,
        })
        showToast('Cliente creado.')
      }
      setView('list')
    } catch (error) { // Catch the error object
      console.error("Error al guardar cliente o crear usuario:", error); // Log the full error for debugging

      let errorMessage = 'Error al guardar. Intenta nuevamente.';
      // Check for specific Firebase Auth errors
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'El email ya está registrado. Usa otro o edita el cliente existente.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El formato del email es inválido.';
            break;
          case 'auth/weak-password':
            errorMessage = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
            break;
          default:
            errorMessage = `Error de autenticación: ${error.message}`;
            break;
        }
      }
      showToast(errorMessage, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (newPw.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres.', 'error'); return }
    if (!form.password) {
      showToast('Este cliente no tiene contraseña guardada. Resetéala primero desde Firebase Console → Authentication.', 'error')
      return
    }
    setSavingPw(true)
    try {
      await changeAuthUserPassword(form.email, form.password, newPw)
      await updateDoc(doc(db, 'clients', editingId), { loginPassword: newPw })
      set('password', newPw)
      setNewPw('')
      setPwPanel(false)
      showToast('Contraseña actualizada correctamente.')
    } catch (error) {
      const msg = (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential')
        ? 'La contraseña actual guardada es incorrecta. Actualízala desde Firebase Console y vuelve a intentar.'
        : `Error al cambiar contraseña: ${error.message}`
      showToast(msg, 'error')
    } finally {
      setSavingPw(false)
    }
  }

  async function handleSendResetEmail() {
    if (!form.email) { showToast('Este cliente no tiene email registrado.', 'error'); return }
    setSendingReset(true)
    try {
      await sendResetEmail(form.email)
      showToast(`Correo de restablecimiento enviado a ${form.email}.`)
    } catch (error) {
      const msg = error.code === 'auth/user-not-found'
        ? 'No existe un usuario con ese email en Firebase Auth.'
        : `Error al enviar el correo: ${error.message}`
      showToast(msg, 'error')
    } finally {
      setSendingReset(false)
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
            <h1 className="text-k-text text-2xl font-semibold">Registro de Clientes</h1>
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
        <h1 className="text-k-text text-2xl font-semibold">{editingId ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</h1> {/* MODIFIED: Title change */}
      </div>

      <div className="flex flex-col gap-4">
        {/* Sección 1 — Datos */}
        <Section title="Datos del cliente">
          {/* Campos señuelo ocultos para evitar que el navegador autocomplete con credenciales del admin */}
          <input type="text" autoComplete="username" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          <input type="password" autoComplete="current-password" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre completo *">
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nombre del cliente" autoComplete="off" name="cliente-nombre" className={INP} style={INP_STYLE} />
            </Field>
            <Field label="Correo electrónico">
              <input type="text" inputMode="email" value={form.email} onChange={e => set('email', e.target.value)} autoComplete="off" name="cliente-correo" placeholder="email@ejemplo.com" className={INP} style={INP_STYLE} />
            </Field>
            <Field label="Teléfono">
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+56912345678" autoComplete="off" name="cliente-telefono" className={INP} style={INP_STYLE} />
            </Field>
            <Field label="Región">
              <input value={form.region} onChange={e => set('region', e.target.value)} placeholder="Ej: Región Metropolitana" autoComplete="off" name="cliente-region" className={INP} style={INP_STYLE} />
            </Field>
            <Field label="Comuna">
              <input value={form.comuna} onChange={e => set('comuna', e.target.value)} placeholder="Ej: Las Condes" autoComplete="off" name="cliente-comuna" className={INP} style={INP_STYLE} />
            </Field>
            <Field label={editingId ? 'Contraseña de acceso' : 'Contraseña del cliente *'}>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={editingId ? undefined : e => set('password', e.target.value)}
                  readOnly={!!editingId}
                  autoComplete="new-password"
                  name="cliente-password"
                  placeholder={editingId ? '(no registrada)' : '••••••••'}
                  className={`${INP} ${editingId ? 'opacity-60 cursor-default pr-24' : ''}`}
                  style={INP_STYLE}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {editingId && (
                    <button type="button" onClick={() => { setPwPanel(p => !p); setNewPw('') }}
                      className="text-xs text-k-orange hover:text-k-orange/80 font-medium transition-colors">
                      Cambiar
                    </button>
                  )}
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="text-k-muted hover:text-k-text transition-colors">
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Panel de cambio de contraseña */}
              {editingId && pwPanel && (
                <div className="mt-3 p-4 bg-k-surface2 rounded-card flex flex-col gap-3" style={{ border: '1px solid var(--color-border)' }}>
                  <p className="text-k-muted text-xs">Nueva contraseña para <span className="text-k-text">{form.email}</span></p>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleChangePassword() }}
                      autoComplete="new-password"
                      name="cliente-nueva-password"
                      placeholder="Nueva contraseña (mín. 6 caracteres)"
                      className={`${INP} pr-10`}
                      style={INP_STYLE}
                    />
                    <button type="button" onClick={() => setShowNewPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-k-muted hover:text-k-text transition-colors">
                      {showNewPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" onClick={handleChangePassword} disabled={savingPw || !newPw}
                      className="flex items-center gap-1.5 px-4 py-2 bg-k-orange hover:bg-k-orange/90 text-white text-xs font-medium rounded-card transition-colors disabled:opacity-50">
                      <FiCheck size={13} />
                      {savingPw ? 'Guardando...' : 'Guardar contraseña'}
                    </button>
                    <button type="button" onClick={() => { setPwPanel(false); setNewPw('') }}
                      className="px-4 py-2 text-k-muted hover:text-k-text text-xs rounded-card transition-colors" style={{ border: '1px solid var(--color-border)' }}>
                      Cancelar
                    </button>
                    <button type="button" onClick={handleSendResetEmail} disabled={sendingReset}
                      className="flex items-center gap-1.5 px-4 py-2 text-k-muted hover:text-k-text text-xs rounded-card transition-colors disabled:opacity-50 ml-auto" style={{ border: '1px solid var(--color-border)' }}>
                      <FiMail size={13} />
                      {sendingReset ? 'Enviando...' : 'Enviar reset por email'}
                    </button>
                  </div>
                </div>
              )}
            </Field>
          </div>
          {!editingId && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-k-lila/20 text-k-lila font-medium">Rol: cliente</span>
              <span className="text-k-muted text-xs">Se asignará automáticamente al crear la cuenta</span>
            </div>
          )}
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
                const { Icon } = LINK_ICONS[lk.icon] ?? { Icon: FiGlobe, label: 'Web' }
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
