import { useState } from 'react'
import { FiCheck, FiChevronDown, FiChevronUp, FiExternalLink } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { useAuth } from '../../hooks/useAuth'
import { useMyPlan } from '../../hooks/useMyPlan'
import { formatDate } from '../../utils/date'

const WA_NUMBER   = '56968280822'
const MEJORA_URL  = 'https://liucreativo.cl/servicios'

const PLAN_STATUS = {
  active:    { label: 'Activo',    cls: 'bg-green-500/15 text-green-400' },
  paused:    { label: 'Pausado',   cls: 'bg-k-yellow/15 text-k-yellow' },
  cancelled: { label: 'Cancelado', cls: 'bg-red-500/15 text-red-400' },
}

function waLink(phone, text) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

function getCancellationDate(startDate, minMonths) {
  if (!startDate) return null
  const d = startDate.toDate ? startDate.toDate() : new Date(startDate)
  const result = new Date(d)
  result.setMonth(result.getMonth() + (minMonths ?? 3))
  return result
}

function InfoRow({ label, value, highlight }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <span className="text-k-muted text-sm">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-green-400' : 'text-k-text'}`}>
        {value}
      </span>
    </div>
  )
}

export default function Subscription() {
  const { clientId } = useAuth()
  const { plan, loading } = useMyPlan(clientId)

  const [showCancel, setShowCancel] = useState(false)

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-7 h-7 border-2 border-k-orange/30 border-t-k-orange rounded-full animate-spin" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-k-text text-2xl font-semibold mb-6">Suscripción</h1>
        <div
          className="bg-k-surface rounded-card-lg p-10 text-center"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <p className="text-k-muted text-sm">
            No tienes un plan activo en este momento. Contáctanos para más información.
          </p>
        </div>
      </div>
    )
  }

  const planS       = PLAN_STATUS[plan.status] ?? PLAN_STATUS.active
  const monthsLeft  = Math.max(0, (plan.minMonths ?? 3) - (plan.monthsActive ?? 0))
  const cancelDate  = getCancellationDate(plan.startDate, plan.minMonths)
  const today       = new Date()
  const canCancelNow = cancelDate && today >= cancelDate

  const cancelMsg = `Hola Liu Creativo, quiero cancelar mi suscripción al plan ${plan.planName}. Por favor indíquenme los próximos pasos.`

  const payments = plan.payments ?? []

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-k-text text-2xl font-semibold">Suscripción</h1>
        <p className="text-k-muted text-sm mt-1">Información de tu plan y facturación</p>
      </div>

      {/* Plan card */}
      <div
        className="bg-k-surface rounded-card-lg p-6 mb-5"
        style={{ border: '1px solid var(--color-border)' }}
      >
        {/* Plan name + status */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-k-muted text-xs mb-1">Plan</p>
            <h2 className="text-k-text text-2xl font-bold">{plan.planName}</h2>
            {plan.planTitle && (
              <p className="text-k-muted text-xs mt-0.5">{plan.planTitle}</p>
            )}
          </div>
          <span className={`text-xs px-2.5 py-1 rounded font-medium ${planS.cls}`}>
            {planS.label}
          </span>
        </div>

        {/* Price */}
        <div className="mb-5">
          <span className="text-k-text text-3xl font-bold">
            {plan.currency ?? 'USD'} {parseFloat(plan.planPrice ?? 0).toLocaleString('es-CL')}
          </span>
          <span className="text-k-muted text-sm ml-1">/ mes</span>
        </div>

        {/* Info rows */}
        <div>
          <InfoRow label="Fecha de inicio"         value={formatDate(plan.startDate)} />
          <InfoRow label="Próximo cobro"            value={formatDate(plan.nextBilling)} />
          <InfoRow label="Meses activos"            value={`${plan.monthsActive ?? 0} meses`} />
          <InfoRow label="Permanencia mínima"       value={`${plan.minMonths ?? 3} meses`} />
          <div className="flex items-center justify-between py-3">
            <span className="text-k-muted text-sm">Meses restantes de permanencia</span>
            <span className={`text-sm font-medium ${monthsLeft === 0 ? 'text-green-400' : 'text-k-text'}`}>
              {monthsLeft === 0 ? 'Permanencia cumplida ✓' : `${monthsLeft} mes${monthsLeft !== 1 ? 'es' : ''}`}
            </span>
          </div>
        </div>

        {/* Nota de permanencia */}
        <p className="text-k-muted text-xs mt-3 leading-relaxed">
          Llevas <span className="text-k-text font-medium">{plan.monthsActive ?? 0} meses</span> activo
          de <span className="text-k-text font-medium">{plan.minMonths ?? 3}</span> comprometidos.
          {cancelDate && (
            <> Puedes cancelar sin costo adicional desde el{' '}
              <span className={`font-medium ${canCancelNow ? 'text-green-400' : 'text-k-text'}`}>
                {cancelDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>.
            </>
          )}
        </p>
      </div>

      {/* Plan includes */}
      {plan.includes && plan.includes.length > 0 && (
        <div
          className="bg-k-surface rounded-card-lg p-6 mb-5"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-k-text font-semibold text-sm mb-4">Tu plan incluye</h3>
          <div className="flex flex-col gap-2.5">
            {plan.includes.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-k-orange/15 flex items-center justify-center shrink-0">
                  <FiCheck size={11} className="text-k-orange" />
                </div>
                <span className="text-k-text text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div
        className="bg-k-surface rounded-card-lg p-6 mb-5"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <h3 className="text-k-text font-semibold text-sm mb-4">Gestión del plan</h3>

        <div className="flex flex-col gap-3">
          {/* Mejorar plan */}
          <a
            href={MEJORA_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-4 py-3 rounded-card bg-k-orange hover:bg-k-orange/90 text-white transition-colors"
          >
            <span className="text-sm font-medium">Mejorar plan</span>
            <FiExternalLink size={15} />
          </a>

          {/* Cancelar */}
          <div>
            <button
              onClick={() => setShowCancel(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-card text-k-muted hover:text-red-400 transition-colors"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <span className="text-sm">Cancelar suscripción</span>
              {showCancel ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
            </button>
            {showCancel && (
              <div
                className="mt-1 px-4 py-3 rounded-card bg-k-surface2 flex flex-col gap-3"
                style={{ border: '1px solid var(--color-border)' }}
              >
                {canCancelNow ? (
                  <p className="text-k-muted text-sm">
                    Ya puedes cancelar tu suscripción sin costo adicional.
                    Escríbenos por WhatsApp para coordinar.
                  </p>
                ) : (
                  <p className="text-k-muted text-sm">
                    Puedes cancelar sin costo adicional a partir del{' '}
                    <span className="text-k-text font-medium">
                      {cancelDate?.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>.
                    Si cancelas antes, se cobrará el período restante de permanencia.
                  </p>
                )}
                <a
                  href={waLink(WA_NUMBER, cancelMsg)}
                  target="_blank"
                  rel="noreferrer"
                  className="self-start flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 bg-green-500/10 px-3 py-1.5 rounded-card transition-colors"
                >
                  <FaWhatsapp size={13} /> Escribir a WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historial de pagos */}
      {payments.length > 0 && (
        <div
          className="bg-k-surface rounded-card-lg p-6 mb-5"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-k-text font-semibold text-sm mb-4">Historial de pagos</h3>
          <div className="rounded-card overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface2)' }}>
                  {['Fecha', 'Plan', 'Monto', 'Estado'].map(h => (
                    <th key={h} className="text-left text-xs text-k-muted font-medium px-4 py-2.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: i < payments.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                  >
                    <td className="px-4 py-3 text-k-muted text-sm">{p.date}</td>
                    <td className="px-4 py-3 text-k-text text-sm">{p.planName}</td>
                    <td className="px-4 py-3 text-k-text text-sm font-medium">
                      {p.currency ?? plan.currency ?? 'USD'} {parseFloat(p.amount ?? 0).toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded font-medium bg-green-500/15 text-green-400">
                        Pagado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-k-muted text-xs text-center mt-2">
        Para cualquier consulta sobre tu suscripción, contáctanos directamente.
      </p>
    </div>
  )
}
