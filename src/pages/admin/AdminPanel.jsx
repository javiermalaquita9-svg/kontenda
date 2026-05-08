import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc, setDoc,
  onSnapshot, query, orderBy, increment,
} from 'firebase/firestore'
import { FiPlus, FiX, FiEdit2, FiTrash2, FiRefreshCw, FiCheck, FiFileText } from 'react-icons/fi'
import { db } from '../../firebase/config'
import { useClients } from '../../hooks/useClients'
import { useToast } from '../../context/ToastContext'
import { tsToInput, inputToTs } from '../../utils/date'
import RoundIndicator from '../../components/shared/RoundIndicator'
import ClientBrandView from './ClientBrandView'

// ── Constants ──────────────────────────────────────────────────
const PLAN_NAMES    = ['Plan Basic', 'Plan Emprendedor', 'Plan Pro']
const STATUS_OPTS   = [{ v: 'active', l: 'Activo' }, { v: 'paused', l: 'Pausado' }, { v: 'cancelled', l: 'Cancelado' }]
const DEL_STATUSES  = [{ v: 'pending', l: 'Pendiente' }, { v: 'available', l: 'Disponible' }, { v: 'in_review', l: 'En revisión' }]
const ASSET_STATES  = ['pending', 'uploaded', 'reviewed']
const ASSET_LABELS  = { pending: 'Pendiente', uploaded: 'Subido', reviewed: 'Revisado' }
const ASSET_CLS     = {
  pending:  'bg-k-surface2 text-k-muted',
  uploaded: 'bg-k-orange/10 text-k-orange',
  reviewed: 'bg-green-500/10 text-green-400',
}
const ASSET_SLOTS = [
  { key: 'briefStatus',      linkKey: 'briefDriveLink',      label: 'Manual de marca' },
  { key: 'logoStatus',       linkKey: 'logoDriveLink',       label: 'Logo (AI/SVG/PNG)' },
  { key: 'photosStatus',     linkKey: 'photosDriveLink',     label: 'Buyer persona' },
  { key: 'referencesStatus', linkKey: 'referencesDriveLink', label: 'Referencias visuales' },
]

const BLANK_PLAN = {
  planName: 'Plan Basic', planTitle: '', planPrice: '', currency: 'USD', status: 'active',
  startDate: '', nextBilling: '', monthsActive: 0, minMonths: 3,
  totalPieces: 0, producedPieces: 0, includes: [], payments: [],
}

const BLANK_DELIVERY = {
  deliveryNumber: 1, title: '', pieces: '', scheduledDate: '',
  status: 'pending', driveLink: '', frameLink: '', reviewRounds: 0, maxReviewRounds: 3,
}

// ── Helpers ────────────────────────────────────────────────────
const INP   = 'w-full bg-k-bg text-k-text text-sm px-3.5 py-2.5 rounded-card outline-none focus:ring-2 focus:ring-k-orange/30 placeholder:text-k-muted/40'
const INP_S = { border: '1px solid var(--color-border)' }

function SectionTitle({ children }) {
  return (
    <h2 className="text-k-text font-semibold text-sm uppercase tracking-wide opacity-70 mb-3">{children}</h2>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-k-muted text-sm mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function cycleStatus(current) {
  const i = ASSET_STATES.indexOf(current ?? 'pending')
  return ASSET_STATES[(i + 1) % ASSET_STATES.length]
}

function DeliveryBorder({ status }) {
  const color = status === 'available' ? 'var(--color-orange)' :
                status === 'in_review'  ? 'var(--color-yellow)' : 'var(--color-surface2)'
  return { borderLeft: `3px solid ${color}` }
}

// ── Main component ─────────────────────────────────────────────
export default function AdminPanel() {
  const { clients }   = useClients()
  const { showToast } = useToast()

  const [clientId,    setClientId]    = useState('')
  const [plan,        setPlan]        = useState(null)
  const [planForm,    setPlanForm]    = useState({ ...BLANK_PLAN })
  const [deliveries,  setDeliveries]  = useState([])
  const [assets,      setAssets]      = useState(null)
  const [savingPlan,  setSavingPlan]  = useState(false)
  const [delForm,     setDelForm]     = useState(null)   // null | delivery object
  const [editingDelId, setEditingDelId] = useState(null)
  const [savingDel,   setSavingDel]   = useState(false)
  const [brandViewClientId, setBrandViewClientId] = useState(null)
  const [includeInput,  setIncludeInput]  = useState('')
  const [paymentInput,  setPaymentInput]  = useState({ date: '', planName: '', amount: '', currency: '' })

  // Subscribe to client data
  useEffect(() => {
    if (!clientId) {
      Promise.resolve().then(() => {
        setPlan(null)
        setDeliveries([])
        setAssets(null)
      })
      return
    }
    const subs = []

    subs.push(onSnapshot(
      doc(db, 'clients', clientId, 'plan', 'current'),
      snap => {
        const d = snap.exists() ? snap.data() : null
        setPlan(d)
        setPlanForm(d ? {
          planName:      d.planName      ?? 'Plan Basic',
          planTitle:     d.planTitle     ?? '',
          planPrice:     d.planPrice     ?? '',
          currency:      d.currency      ?? 'USD',
          status:        d.status        ?? 'active',
          startDate:     tsToInput(d.startDate),
          nextBilling:   tsToInput(d.nextBilling),
          monthsActive:  d.monthsActive  ?? 0,
          minMonths:     d.minMonths     ?? 3,
          totalPieces:   d.totalPieces   ?? 0,
          producedPieces: d.producedPieces ?? 0,
          includes:      d.includes      ?? [],
          payments:      d.payments      ?? [],
        } : { ...BLANK_PLAN })
      }
    ))

    subs.push(onSnapshot(
      query(collection(db, 'clients', clientId, 'deliveries'), orderBy('deliveryNumber')),
      snap => setDeliveries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    ))

    subs.push(onSnapshot(
      doc(db, 'clients', clientId, 'brandAssets', 'current'),
      snap => setAssets(snap.exists() ? snap.data() : null)
    ))

    return () => subs.forEach(u => u())
  }, [clientId])

  // ── Plan ──────────────────────────────────────────────────────
  function setP(key, val) { setPlanForm(p => ({ ...p, [key]: val })) }

  function addInclude() {
    if (!includeInput.trim()) return
    setP('includes', [...planForm.includes, includeInput.trim()])
    setIncludeInput('')
  }

  async function savePlan() {
    if (!clientId) return
    setSavingPlan(true)
    try {
      await setDoc(
        doc(db, 'clients', clientId, 'plan', 'current'),
        {
          ...planForm,
          planPrice:      parseFloat(planForm.planPrice)     || 0,
          monthsActive:   parseInt(planForm.monthsActive)    || 0,
          minMonths:      parseInt(planForm.minMonths)        || 3,
          totalPieces:    parseInt(planForm.totalPieces)     || 0,
          producedPieces: parseInt(planForm.producedPieces)  || 0,
          startDate:      inputToTs(planForm.startDate),
          nextBilling:    inputToTs(planForm.nextBilling),
          payments:       planForm.payments,
          planTitle:      planForm.planTitle ?? '',
        },
        { merge: true }
      )
      showToast('Plan guardado.')
    } catch {
      showToast('Error al guardar plan.', 'error')
    } finally {
      setSavingPlan(false)
    }
  }

  // ── Deliveries ─────────────────────────────────────────────────
  function setD(key, val) { setDelForm(p => ({ ...p, [key]: val })) }

  function openNewDelivery() {
    const nextNum = deliveries.length > 0 ? Math.max(...deliveries.map(d => d.deliveryNumber)) + 1 : 1
    setDelForm({ ...BLANK_DELIVERY, deliveryNumber: nextNum })
    setEditingDelId(null)
  }

  function openEditDelivery(delivery) {
    setDelForm({
      deliveryNumber: delivery.deliveryNumber ?? 1,
      title:          delivery.title          ?? '',
      pieces:         delivery.pieces         ?? '',
      scheduledDate:  tsToInput(delivery.scheduledDate),
      status:         delivery.status         ?? 'pending',
      driveLink:      delivery.driveLink      ?? '',
      frameLink:      delivery.frameLink      ?? '',
      reviewRounds:   delivery.reviewRounds   ?? 0,
      maxReviewRounds: delivery.maxReviewRounds ?? 3,
    })
    setEditingDelId(delivery.id)
  }

  async function saveDelivery() {
    if (!delForm.title.trim()) { showToast('El título es requerido.', 'error'); return }
    setSavingDel(true)
    try {
      const data = {
        ...delForm,
        deliveryNumber:  parseInt(delForm.deliveryNumber)  || 1,
        reviewRounds:    parseInt(delForm.reviewRounds)    || 0,
        maxReviewRounds: parseInt(delForm.maxReviewRounds) || 3,
        scheduledDate:   inputToTs(delForm.scheduledDate),
      }
      if (editingDelId) {
        await updateDoc(doc(db, 'clients', clientId, 'deliveries', editingDelId), data)
        showToast('Entrega actualizada.')
      } else {
        await addDoc(collection(db, 'clients', clientId, 'deliveries'), data)
        showToast('Entrega creada.')
      }
      setDelForm(null)
    } catch {
      showToast('Error al guardar entrega.', 'error')
    } finally {
      setSavingDel(false)
    }
  }

  async function addRound(delivery) {
    if ((delivery.reviewRounds ?? 0) >= (delivery.maxReviewRounds ?? 3)) {
      showToast('Límite de rondas alcanzado.', 'warning'); return
    }
    await updateDoc(doc(db, 'clients', clientId, 'deliveries', delivery.id), { reviewRounds: increment(1) })
    showToast('+1 ronda de revisión.')
  }

  async function resetRounds(delivery) {
    if (!window.confirm('¿Resetear las rondas de revisión?')) return
    await updateDoc(doc(db, 'clients', clientId, 'deliveries', delivery.id), { reviewRounds: 0 })
    showToast('Rondas reseteadas.')
  }

  async function deleteDelivery(delivery) {
    if (!window.confirm(`¿Eliminar la entrega "${delivery.title}"?`)) return
    await deleteDoc(doc(db, 'clients', clientId, 'deliveries', delivery.id))
    showToast('Entrega eliminada.')
  }

  // ── Brand Assets ──────────────────────────────────────────────
  async function toggleAsset(key, currentVal) {
    const next = cycleStatus(currentVal)
    try {
      await setDoc(
        doc(db, 'clients', clientId, 'brandAssets', 'current'),
        { [key]: next },
        { merge: true }
      )
    } catch {
      showToast('Error.', 'error')
    }
  }

  async function toggleBrandKit() {
    try {
      await setDoc(
        doc(db, 'clients', clientId, 'brandAssets', 'current'),
        { brandKitReady: !(assets?.brandKitReady ?? false) },
        { merge: true }
      )
    } catch {
      showToast('Error.', 'error')
    }
  }

  async function saveBriefUrl(url) {
    await setDoc(
      doc(db, 'clients', clientId, 'brandAssets', 'current'),
      { briefTemplateUrl: url },
      { merge: true }
    )
  }

  async function saveDriveLink(linkKey, url) {
    try {
      await setDoc(
        doc(db, 'clients', clientId, 'brandAssets', 'current'),
        { [linkKey]: url },
        { merge: true }
      )
    } catch {
      showToast('Error al guardar.', 'error')
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-k-text text-2xl font-semibold">Panel Interno</h1>
        <p className="text-k-muted text-sm mt-0.5">Gestiona los datos del portal del cliente</p>
      </div>

      {/* Client selector */}
      <div className="mb-8">
        <label className="block text-k-muted text-sm mb-1.5">Cliente</label>
        <select value={clientId} onChange={e => setClientId(e.target.value)}
          className="bg-k-surface text-k-text text-sm px-3.5 py-2.5 rounded-card outline-none cursor-pointer w-72"
          style={{ border: '1px solid var(--color-border)' }}>
          <option value="">Selecciona un cliente...</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!clientId ? (
        <div className="bg-k-surface rounded-card-lg p-12 text-center" style={{ border: '1px solid var(--color-border)' }}>
          <p className="text-k-muted text-sm">Selecciona un cliente para gestionar su portal.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* ── SECCIÓN 1: Plan ── */}
          <div className="bg-k-surface rounded-card-lg p-6" style={{ border: '1px solid var(--color-border)' }}>
            <div className="flex items-start justify-between mb-1">
              <SectionTitle>Plan del cliente</SectionTitle>
              <button 
                onClick={() => setBrandViewClientId(clientId)}
                className="flex items-center gap-2 text-sm text-k-text bg-k-surface2 hover:bg-k-surface2/80 px-3 py-1.5 rounded-card transition-colors"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <FiFileText size={14} className="text-k-orange" />
                Ver datos del formulario
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Field label="Nombre del plan">
                <select value={planForm.planName} onChange={e => setP('planName', e.target.value)} className={`${INP} cursor-pointer`} style={INP_S}>
                  {PLAN_NAMES.map(n => <option key={n}>{n}</option>)}
                </select>
              </Field>
              <Field label="Precio">
                <input type="number" value={planForm.planPrice} onChange={e => setP('planPrice', e.target.value)} placeholder="0" className={INP} style={INP_S} />
              </Field>
              <Field label="Moneda">
                <select value={planForm.currency} onChange={e => setP('currency', e.target.value)} className={`${INP} cursor-pointer`} style={INP_S}>
                  <option value="USD">Dólares (USD)</option>
                  <option value="CLP">Pesos chilenos (CLP)</option>
                </select>
              </Field>
              <Field label="Estado">
                <select value={planForm.status} onChange={e => setP('status', e.target.value)} className={`${INP} cursor-pointer`} style={INP_S}>
                  {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </Field>
              <Field label="Inicio del plan">
                <input type="date" value={planForm.startDate} onChange={e => setP('startDate', e.target.value)} className={`${INP} cursor-pointer`} style={INP_S} />
              </Field>
              <Field label="Próximo cobro">
                <input type="date" value={planForm.nextBilling} onChange={e => setP('nextBilling', e.target.value)} className={`${INP} cursor-pointer`} style={INP_S} />
              </Field>
              <Field label="Meses activos">
                <input type="number" value={planForm.monthsActive} onChange={e => setP('monthsActive', e.target.value)} min="0" className={INP} style={INP_S} />
              </Field>
              <Field label="Meses mínimos">
                <input type="number" value={planForm.minMonths} onChange={e => setP('minMonths', e.target.value)} min="0" className={INP} style={INP_S} />
              </Field>
              <Field label="Total de piezas">
                <input type="number" value={planForm.totalPieces} onChange={e => setP('totalPieces', e.target.value)} min="0" className={INP} style={INP_S} />
              </Field>
              <Field label="Piezas producidas">
                <input type="number" value={planForm.producedPieces} onChange={e => setP('producedPieces', e.target.value)} min="0" className={INP} style={INP_S} />
              </Field>
            </div>

            {/* Plan title + includes */}
            <div className="mb-4 rounded-card-lg p-4" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface2)' }}>
              <label className="block text-k-muted text-sm mb-1.5">Título del plan</label>
              <input
                value={planForm.planTitle}
                onChange={e => setP('planTitle', e.target.value)}
                placeholder="Ej: El plan ideal para emprendedores"
                className={`${INP} mb-4`}
                style={INP_S}
              />
              <label className="block text-k-muted text-sm mb-2">Lo que incluye</label>
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                {planForm.includes.map((item, i) => (
                  <span key={i} className="flex items-center gap-1 bg-k-surface text-k-text text-xs px-2.5 py-1 rounded-full">
                    {item}
                    <button type="button" onClick={() => setP('includes', planForm.includes.filter((_, j) => j !== i))} className="text-k-muted hover:text-red-400 ml-0.5">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={includeInput} onChange={e => setIncludeInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInclude() } }}
                  placeholder="Agregar ítem..." className={`${INP} flex-1`} style={INP_S} />
                <button onClick={addInclude} className="px-3 py-2 bg-k-surface hover:bg-k-surface/70 text-k-muted rounded-card text-sm transition-colors" style={INP_S}>+</button>
              </div>
            </div>

            {/* Historial de pagos */}
            <div className="mb-4">
              <label className="block text-k-muted text-sm mb-2">Historial de pagos</label>

              {/* Pagos existentes */}
              {planForm.payments.length > 0 && (
                <div className="rounded-card overflow-hidden mb-2" style={{ border: '1px solid var(--color-border)' }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface2)' }}>
                        {['Fecha', 'Plan', 'Monto', ''].map(h => (
                          <th key={h} className="text-left text-xs text-k-muted font-medium px-3 py-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {planForm.payments.map((p, i) => (
                        <tr key={i} style={{ borderBottom: i < planForm.payments.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                          <td className="px-3 py-2 text-k-muted text-xs">{p.date}</td>
                          <td className="px-3 py-2 text-k-text text-xs">{p.planName}</td>
                          <td className="px-3 py-2 text-k-text text-xs font-medium">
                            {p.currency ?? planForm.currency} {parseFloat(p.amount ?? 0).toLocaleString('es-CL')}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => setP('payments', planForm.payments.filter((_, j) => j !== i))}
                              className="text-k-muted hover:text-red-400 text-xs transition-colors"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Agregar pago */}
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="date"
                  value={paymentInput.date}
                  onChange={e => setPaymentInput(p => ({ ...p, date: e.target.value }))}
                  className={`${INP} cursor-pointer col-span-1`} style={INP_S}
                />
                <input
                  value={paymentInput.planName}
                  onChange={e => setPaymentInput(p => ({ ...p, planName: e.target.value }))}
                  placeholder={planForm.planName || 'Plan'}
                  className={`${INP} col-span-1`} style={INP_S}
                />
                <input
                  type="number"
                  value={paymentInput.amount}
                  onChange={e => setPaymentInput(p => ({ ...p, amount: e.target.value }))}
                  placeholder={`Monto (${planForm.currency || 'USD'})`}
                  className={`${INP} col-span-1`} style={INP_S}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!paymentInput.date || !paymentInput.amount) return
                    const entry = {
                      date:     paymentInput.date,
                      planName: paymentInput.planName || planForm.planName,
                      amount:   parseFloat(paymentInput.amount) || 0,
                      currency: planForm.currency || 'USD',
                    }
                    setP('payments', [...planForm.payments, entry])
                    setPaymentInput({ date: '', planName: '', amount: '', currency: '' })
                  }}
                  className="px-3 py-2 bg-k-surface2 hover:bg-k-surface2/70 text-k-muted hover:text-k-text rounded-card text-sm transition-colors"
                  style={INP_S}
                >
                  + Pago
                </button>
              </div>
            </div>

            <button onClick={savePlan} disabled={savingPlan} className="px-5 py-2.5 rounded-card text-sm font-medium bg-k-orange hover:bg-k-orange/90 text-white transition-colors disabled:opacity-50">
              {savingPlan ? 'Guardando...' : plan ? 'Actualizar plan' : 'Crear plan'}
            </button>
          </div>

          {/* ── SECCIÓN 2: Entregas ── */}
          <div className="bg-k-surface rounded-card-lg p-6" style={{ border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Entregas del mes</SectionTitle>
              <button onClick={openNewDelivery} className="flex items-center gap-1.5 text-sm text-k-muted hover:text-k-text bg-k-surface2 px-3 py-2 rounded-card transition-colors" style={{ border: '1px solid var(--color-border)' }}>
                <FiPlus size={14} /> Nueva entrega
              </button>
            </div>

            {/* Delivery form */}
            {delForm && (
              <div className="bg-k-bg rounded-card-lg p-5 mb-4" style={{ border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-k-text font-medium text-sm">{editingDelId ? 'Editar entrega' : 'Nueva entrega'}</h4>
                  <button onClick={() => setDelForm(null)} className="text-k-muted hover:text-k-text"><FiX size={16} /></button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <Field label="# Entrega">
                    <input type="number" value={delForm.deliveryNumber} onChange={e => setD('deliveryNumber', e.target.value)} min="1" className={INP} style={INP_S} />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Título *">
                      <input value={delForm.title} onChange={e => setD('title', e.target.value)} placeholder="Entrega 1 — Contenido mensual" className={INP} style={INP_S} />
                    </Field>
                  </div>
                  <Field label="Piezas">
                    <input value={delForm.pieces} onChange={e => setD('pieces', e.target.value)} placeholder="3 reels + 2 posts" className={INP} style={INP_S} />
                  </Field>
                  <Field label="Fecha coordinada">
                    <input type="date" value={delForm.scheduledDate} onChange={e => setD('scheduledDate', e.target.value)} className={`${INP} cursor-pointer`} style={INP_S} />
                  </Field>
                  <Field label="Estado">
                    <select value={delForm.status} onChange={e => setD('status', e.target.value)} className={`${INP} cursor-pointer`} style={INP_S}>
                      {DEL_STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                    </select>
                  </Field>
                  <Field label="Link Drive">
                    <input value={delForm.driveLink} onChange={e => setD('driveLink', e.target.value)} placeholder="https://..." className={INP} style={INP_S} />
                  </Field>
                  <Field label="Link Frame.io">
                    <input value={delForm.frameLink} onChange={e => setD('frameLink', e.target.value)} placeholder="https://..." className={INP} style={INP_S} />
                  </Field>
                  <Field label="Rondas usadas">
                    <input type="number" value={delForm.reviewRounds} onChange={e => setD('reviewRounds', e.target.value)} min="0" max="10" className={INP} style={INP_S} />
                  </Field>
                  <Field label="Máx. rondas">
                    <input type="number" value={delForm.maxReviewRounds} onChange={e => setD('maxReviewRounds', e.target.value)} min="1" max="10" className={INP} style={INP_S} />
                  </Field>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setDelForm(null)} className="px-4 py-2 rounded-card text-sm text-k-muted hover:text-k-text transition-colors" style={{ border: '1px solid var(--color-border)' }}>Cancelar</button>
                  <button onClick={saveDelivery} disabled={savingDel} className="px-4 py-2 rounded-card text-sm font-medium bg-k-orange hover:bg-k-orange/90 text-white transition-colors disabled:opacity-50">
                    {savingDel ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            )}

            {/* Delivery list */}
            {deliveries.length === 0 ? (
              <p className="text-k-muted text-sm text-center py-6">No hay entregas. Crea la primera.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {deliveries.map(delivery => (
                  <div key={delivery.id} className="rounded-card-lg p-4 flex flex-col gap-2"
                    style={{ background: 'var(--color-surface2)', ...DeliveryBorder({ status: delivery.status }), border: '1px solid var(--color-border)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-k-muted text-xs mr-2">#{delivery.deliveryNumber}</span>
                        <span className="text-k-text font-medium text-sm">{delivery.title}</span>
                        {delivery.pieces && <span className="text-k-muted text-xs ml-2">· {delivery.pieces}</span>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        delivery.status === 'available' ? 'bg-k-orange/15 text-k-orange' :
                        delivery.status === 'in_review'  ? 'bg-k-yellow/15 text-k-yellow' :
                        'bg-k-surface2 text-k-muted'
                      }`}>
                        {DEL_STATUSES.find(s => s.v === delivery.status)?.l ?? delivery.status}
                      </span>
                    </div>

                    <RoundIndicator used={delivery.reviewRounds ?? 0} max={delivery.maxReviewRounds ?? 3} />
                    <p className="text-k-muted text-xs">
                      Rondas: {delivery.reviewRounds ?? 0}/{delivery.maxReviewRounds ?? 3}
                    </p>

                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => openEditDelivery(delivery)} className="flex items-center gap-1 text-xs text-k-muted hover:text-k-text bg-k-surface px-2.5 py-1.5 rounded-card transition-colors">
                        <FiEdit2 size={11} /> Editar
                      </button>
                      <button onClick={() => addRound(delivery)} className="flex items-center gap-1 text-xs text-k-muted hover:text-k-orange bg-k-surface px-2.5 py-1.5 rounded-card transition-colors">
                        <FiPlus size={11} /> +1 Ronda
                      </button>
                      <button onClick={() => resetRounds(delivery)} className="flex items-center gap-1 text-xs text-k-muted hover:text-k-text bg-k-surface px-2.5 py-1.5 rounded-card transition-colors">
                        <FiRefreshCw size={11} /> Resetear
                      </button>
                      <button onClick={() => deleteDelivery(delivery)} className="text-k-muted hover:text-red-400 bg-k-surface px-2.5 py-1.5 rounded-card transition-colors">
                        <FiTrash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── SECCIÓN 3: Archivos de marca ── */}
          <div className="bg-k-surface rounded-card-lg p-6" style={{ border: '1px solid var(--color-border)' }}>
            <SectionTitle>Archivos de marca</SectionTitle>

            {/* File slots */}
            <div className="flex flex-col gap-2 mb-4">
              {ASSET_SLOTS.map(({ key, linkKey, label }) => {
                const status  = assets?.[key]     ?? 'pending'
                const linkVal = assets?.[linkKey] ?? ''
                return (
                  <div key={key} className="rounded-card p-3" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface2)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-k-text text-sm">{label}</span>
                      <button onClick={() => toggleAsset(key, status)} className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${ASSET_CLS[status]}`}>
                        {ASSET_LABELS[status]}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        key={`${clientId}-${linkKey}`}
                        defaultValue={linkVal}
                        onBlur={e => saveDriveLink(linkKey, e.target.value)}
                        placeholder="Link de Drive del archivo..."
                        className={`${INP} flex-1 text-xs`}
                        style={INP_S}
                      />
                      {linkVal && (
                        <a href={linkVal} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-card text-xs text-k-muted hover:text-k-text transition-colors shrink-0"
                          style={{ border: '1px solid var(--color-border)' }}>
                          <FiCheck size={12} /> Ver
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Brand kit ready */}
            <div className="flex items-center justify-between px-4 py-3 rounded-card mb-4" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface2)' }}>
              <div>
                <span className="text-k-text text-sm font-medium">Brand Kit listo</span>
                <p className="text-k-muted text-xs mt-0.5">Marca todos los archivos como revisados</p>
              </div>
              <button onClick={toggleBrandKit} className={`w-11 h-6 rounded-full transition-colors relative ${assets?.brandKitReady ? 'bg-k-orange' : 'bg-k-surface2'}`} style={{ border: '1px solid var(--color-border)' }}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${assets?.brandKitReady ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Brief template URL */}
            <div className="mb-4">
              <label className="block text-k-muted text-sm mb-1.5">URL de plantilla de brief</label>
              <div className="flex gap-2">
                <input
                  defaultValue={assets?.briefTemplateUrl ?? ''}
                  onBlur={e => saveBriefUrl(e.target.value)}
                  placeholder="https://docs.google.com/..."
                  className={`${INP} flex-1`}
                  style={INP_S}
                />
                {assets?.briefTemplateUrl && (
                  <a href={assets.briefTemplateUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-card text-sm text-k-muted hover:text-k-text transition-colors" style={{ border: '1px solid var(--color-border)' }}>
                    <FiCheck size={14} /> Ver
                  </a>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Brand Form Data Modal */}
      {brandViewClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-k-bg rounded-card-lg w-full max-w-4xl h-[90vh] flex flex-col" style={{ border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between p-4 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="text-k-text text-lg font-semibold">Información de Marca</h2>
              <button onClick={() => setBrandViewClientId(null)} className="text-k-muted hover:text-k-text">
                <FiX size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <ClientBrandView clientId={brandViewClientId} isModal />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
