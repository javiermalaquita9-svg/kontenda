import { FiExternalLink, FiCheck } from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'
import { useMyPlan } from '../../hooks/useMyPlan'
import { usePieces } from '../../hooks/usePieces'
import { formatDate } from '../../utils/date'
import RoundIndicator from '../../components/shared/RoundIndicator'
import ProgressTracker from '../../components/shared/ProgressTracker'

const PLAN_STATUS = {
  active:    { label: 'Activo',    cls: 'bg-green-500/15 text-green-400' },
  paused:    { label: 'Pausado',   cls: 'bg-k-yellow/15 text-k-yellow' },
  cancelled: { label: 'Cancelado', cls: 'bg-red-500/15 text-red-400' },
}

const DEL_STATUS = {
  pending:   { label: 'Pendiente',   cls: 'bg-k-surface2 text-k-muted' },
  available: { label: 'Disponible',  cls: 'bg-k-orange/15 text-k-orange' },
  in_review: { label: 'En revisión', cls: 'bg-k-yellow/15 text-k-yellow' },
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-k-surface rounded-card-lg px-5 py-4" style={{ border: '1px solid var(--color-border)' }}>
      <p className="text-k-muted text-xs mb-1">{label}</p>
      <p className="text-k-text text-2xl font-semibold">{value}</p>
      {sub && <p className="text-k-muted text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

function ProgressBar({ value, max, color = 'bg-k-orange' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="w-full bg-k-surface2 rounded-full h-1.5 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function calcStep(plan, deliveries, pieces) {
  if (!plan) return 1
  if (pieces.some(p => p.status === 'aprobado' || p.status === 'publicado')) return 5
  if (deliveries.some(d => d.status === 'available' || d.status === 'in_review')) return 4
  if (pieces.some(p => p.status === 'en_revision')) return 3
  if (pieces.length > 0) return 2
  return 1
}

export default function MyPlan() {
  const { clientId } = useAuth()
  const { plan, deliveries, loading: planLoading } = useMyPlan(clientId)
  const { pieces, loading: piecesLoading }         = usePieces(clientId)

  const loading = planLoading || piecesLoading

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
        <h1 className="text-k-text text-2xl font-semibold mb-2">Mi Plan</h1>
        <div className="bg-k-surface rounded-card-lg p-10 text-center" style={{ border: '1px solid var(--color-border)' }}>
          <p className="text-k-muted text-sm">
            Tu plan aún no está configurado. Contáctanos para más información.
          </p>
        </div>
      </div>
    )
  }

  const planS = PLAN_STATUS[plan.status] ?? PLAN_STATUS.active
  const roundsUsed = deliveries.reduce((s, d) => s + (d.reviewRounds ?? 0), 0)
  const roundsMax  = deliveries.reduce((s, d) => s + (d.maxReviewRounds ?? 3), 0)
  const piecePct   = plan.totalPieces > 0
    ? Math.round((plan.producedPieces / plan.totalPieces) * 100)
    : 0
  const monthPct   = plan.minMonths > 0
    ? Math.min(100, Math.round(((plan.monthsActive ?? 0) / plan.minMonths) * 100))
    : 100
  const activeStep = calcStep(plan, deliveries, pieces)

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-k-text text-2xl font-semibold">Mi Plan</h1>
        <p className="text-k-muted text-sm mt-1">Detalles de tu suscripción y entregas</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-5">
        <StatCard
          label="Piezas producidas"
          value={`${plan.producedPieces ?? 0} / ${plan.totalPieces ?? 0}`}
          sub={`${piecePct}% completado`}
        />
        <StatCard
          label="Rondas de revisión"
          value={roundsMax > 0 ? `${roundsUsed} / ${roundsMax}` : '—'}
          sub="usadas en total"
        />
        <StatCard
          label="Próximo cobro"
          value={plan.nextBilling ? formatDate(plan.nextBilling) : '—'}
          sub={`${plan.currency ?? 'USD'} ${parseFloat(plan.planPrice ?? 0).toLocaleString('es-CL')} / mes`}
        />
      </div>

      {/* Plan header card */}
      <div className="bg-k-surface rounded-card-lg p-6 mb-5" style={{ border: '1px solid var(--color-border)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-k-muted text-xs mb-1">Plan actual</p>
            <h2 className="text-k-text text-xl font-semibold">{plan.planName}</h2>
            {plan.planTitle && (
              <p className="text-k-muted text-xs mt-0.5">{plan.planTitle}</p>
            )}
          </div>
          <span className={`text-xs px-2.5 py-1 rounded font-medium ${planS.cls}`}>
            {planS.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-5">
          <div>
            <p className="text-k-muted text-xs mb-0.5">Inicio del plan</p>
            <p className="text-k-text text-sm">{formatDate(plan.startDate)}</p>
          </div>
          <div>
            <p className="text-k-muted text-xs mb-0.5">Próximo cobro</p>
            <p className="text-k-text text-sm">{formatDate(plan.nextBilling)}</p>
          </div>
        </div>

        {/* Piezas progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-k-muted text-xs">Piezas producidas</p>
            <p className="text-k-text text-xs font-medium">
              {plan.producedPieces ?? 0} / {plan.totalPieces ?? 0} ({piecePct}%)
            </p>
          </div>
          <ProgressBar value={plan.producedPieces ?? 0} max={plan.totalPieces ?? 1} />
        </div>

        {/* Permanencia progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-k-muted text-xs">Permanencia</p>
            <p className="text-k-text text-xs font-medium">
              {plan.monthsActive ?? 0} / {plan.minMonths ?? 3} meses ({monthPct}%)
            </p>
          </div>
          <ProgressBar
            value={plan.monthsActive ?? 0}
            max={plan.minMonths ?? 3}
            color={monthPct >= 100 ? 'bg-green-500' : 'bg-k-orange'}
          />
        </div>
      </div>

      {/* Estado del mes */}
      <div className="bg-k-surface rounded-card-lg px-6 py-5 mb-5" style={{ border: '1px solid var(--color-border)' }}>
        <p className="text-k-muted text-xs mb-4">Estado del mes</p>
        <ProgressTracker step={activeStep} />
      </div>

      {/* Entregas */}
      <div className="mb-5">
        <h3 className="text-k-text font-semibold text-sm mb-3">Entregas del mes</h3>

        {deliveries.length === 0 ? (
          <div className="bg-k-surface rounded-card-lg p-8 text-center" style={{ border: '1px solid var(--color-border)' }}>
            <p className="text-k-muted text-sm">No hay entregas registradas aún.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {deliveries.map(d => {
              const s = DEL_STATUS[d.status] ?? DEL_STATUS.pending
              const isPending = d.status === 'pending'
              const borderColor = d.status === 'available'
                ? 'var(--color-orange)'
                : d.status === 'in_review'
                ? 'var(--color-yellow)'
                : 'var(--color-surface2)'
              return (
                <div
                  key={d.id}
                  className="bg-k-surface rounded-card-lg p-4"
                  style={{ border: '1px solid var(--color-border)', borderLeft: `3px solid ${borderColor}` }}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-k-muted text-xs">#{d.deliveryNumber}</span>
                        <p className="text-k-text font-medium text-sm">{d.title}</p>
                      </div>
                      {d.pieces && <p className="text-k-muted text-xs mt-0.5">{d.pieces}</p>}
                      {d.scheduledDate && (
                        <p className="text-k-muted text-xs mt-0.5">
                          Fecha: {formatDate(d.scheduledDate)}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${s.cls}`}>
                      {s.label}
                    </span>
                  </div>

                  <div className="mb-1">
                    <RoundIndicator used={d.reviewRounds ?? 0} max={d.maxReviewRounds ?? 3} size="sm" />
                  </div>
                  <p className="text-k-muted text-xs mb-3">
                    Rondas de revisión: {d.reviewRounds ?? 0} de {d.maxReviewRounds ?? 3} usadas
                  </p>

                  {/* Botones solo activos cuando no está pendiente */}
                  {(d.driveLink || d.frameLink) && (
                    <div className="flex gap-2">
                      {d.driveLink && (
                        isPending ? (
                          <span
                            className="flex items-center gap-1.5 text-xs text-k-muted/40 bg-k-surface2/50 px-3 py-1.5 rounded-card cursor-not-allowed"
                            style={{ border: '1px solid var(--color-border)' }}
                          >
                            <FiExternalLink size={12} /> Ver en Drive
                          </span>
                        ) : (
                          <a
                            href={d.driveLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs text-k-muted hover:text-k-text bg-k-surface2 px-3 py-1.5 rounded-card transition-colors"
                            style={{ border: '1px solid var(--color-border)' }}
                          >
                            <FiExternalLink size={12} /> Ver en Drive
                          </a>
                        )
                      )}
                      {d.frameLink && (
                        isPending ? (
                          <span
                            className="flex items-center gap-1.5 text-xs text-k-muted/40 bg-k-surface2/50 px-3 py-1.5 rounded-card cursor-not-allowed"
                            style={{ border: '1px solid var(--color-border)' }}
                          >
                            <FiExternalLink size={12} /> Revisar en Frame.io
                          </span>
                        ) : (
                          <a
                            href={d.frameLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs text-k-muted hover:text-k-text bg-k-surface2 px-3 py-1.5 rounded-card transition-colors"
                            style={{ border: '1px solid var(--color-border)' }}
                          >
                            <FiExternalLink size={12} /> Revisar en Frame.io
                          </a>
                        )
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Nota rondas extra */}
      <div
        className="bg-k-surface rounded-card-lg px-5 py-4"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <p className="text-k-muted text-xs leading-relaxed">
          <span className="text-k-text font-medium">¿Necesitas una ronda extra?</span>{' '}
          Las correcciones adicionales tienen un valor de $40 USD por ronda.
          Escríbenos para coordinar.
        </p>
      </div>
    </div>
  )
}
