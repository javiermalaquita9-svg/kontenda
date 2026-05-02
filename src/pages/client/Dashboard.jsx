import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import {
  FiExternalLink, FiAlertCircle, FiFileText, FiCreditCard,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import { useMyPlan } from '../../hooks/useMyPlan'
import { usePieces } from '../../hooks/usePieces'
import { formatDate, getMonthLabel } from '../../utils/date'
import StatusBadge from '../../components/shared/StatusBadge'
import RoundIndicator from '../../components/shared/RoundIndicator'
import ProgressTracker from '../../components/shared/ProgressTracker'

const WA_NUMBER = '56968280822'

const PLAN_STATUS_LABELS = { active: 'Activo', paused: 'Pausado', cancelled: 'Cancelado' }

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

function calcStep(plan, deliveries, pieces) {
  if (!plan) return 1
  if (pieces.some(p => p.status === 'aprobado' || p.status === 'publicado')) return 5
  if (deliveries.some(d => d.status === 'available' || d.status === 'in_review')) return 4
  if (pieces.some(p => p.status === 'en_revision')) return 3
  if (pieces.length > 0) return 2
  return 1
}

export default function Dashboard() {
  const { clientId } = useAuth()
  const navigate = useNavigate()
  const [clientData, setClientData] = useState(null)
  const { plan, deliveries, loading: planLoading } = useMyPlan(clientId)
  const { pieces, loading: piecesLoading } = usePieces(clientId)

  useEffect(() => {
    if (!clientId) return
    getDoc(doc(db, 'clients', clientId)).then(snap => {
      if (snap.exists()) setClientData(snap.data())
    })
  }, [clientId])

  const loading = planLoading || piecesLoading

  const pendingDeliveries = deliveries.filter(d => d.status === 'available' || d.status === 'in_review')
  const recentPieces = pieces
    .filter(p => p.status === 'en_revision' || p.status === 'aprobado')
    .slice(0, 3)
  const displayDeliveries = deliveries.filter(d => d.status !== 'pending').slice(0, 3).length > 0
    ? deliveries.filter(d => d.status !== 'pending').slice(0, 3)
    : deliveries.slice(0, 3)

  const roundsUsed = deliveries.reduce((s, d) => s + (d.reviewRounds ?? 0), 0)
  const roundsMax  = deliveries.reduce((s, d) => s + (d.maxReviewRounds ?? 3), 0)
  const activeStep = calcStep(plan, deliveries, pieces)
  const monthLabel = getMonthLabel(new Date())

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-7 h-7 border-2 border-k-orange/30 border-t-k-orange rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-k-text text-2xl font-semibold">
          Hola{clientData?.name ? `, ${clientData.name}` : ''} 👋
        </h1>
        <p className="text-k-muted text-sm mt-1">Resumen de {monthLabel}</p>
      </div>

      {/* Alerta dinámica */}
      {pendingDeliveries.length > 0 && (
        <div
          className="flex items-center justify-between bg-k-orange/10 rounded-card-lg px-4 py-3 mb-6"
          style={{ border: '1px solid rgba(232,106,26,0.25)' }}
        >
          <div className="flex items-center gap-2.5">
            <FiAlertCircle size={16} className="text-k-orange shrink-0" />
            <p className="text-k-orange text-sm font-medium">
              Tienes {pendingDeliveries.length} entrega{pendingDeliveries.length !== 1 ? 's' : ''}{' '}
              lista{pendingDeliveries.length !== 1 ? 's' : ''} para revisar.
            </p>
          </div>
          <button
            onClick={() => navigate('/portal/contenido')}
            className="text-k-orange text-sm hover:underline shrink-0 ml-4"
          >
            Ir a Mi contenido →
          </button>
        </div>
      )}

      {/* Métricas */}
      {plan ? (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Piezas producidas"
            value={`${plan.producedPieces ?? 0} / ${plan.totalPieces ?? 0}`}
            sub="del total contratado"
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
      ) : (
        <div
          className="bg-k-surface rounded-card-lg p-6 mb-6 text-center"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <p className="text-k-muted text-sm">
            Tu plan aún no está configurado. Contáctanos si tienes dudas.
          </p>
        </div>
      )}

      {/* ProgressTracker */}
      {plan && (
        <div
          className="bg-k-surface rounded-card-lg px-6 py-5 mb-6"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <p className="text-k-muted text-xs mb-4">Estado del mes</p>
          <ProgressTracker step={activeStep} />
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {/* Mi contenido */}
        <button
          onClick={() => navigate('/portal/contenido')}
          className="bg-k-surface rounded-card-lg p-4 text-left hover:bg-k-surface2/50 transition-colors"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <FiFileText size={16} className="text-k-orange" />
            {pendingDeliveries.length > 0 && (
              <span className="bg-k-orange text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingDeliveries.length}
              </span>
            )}
          </div>
          <p className="text-k-text text-sm font-medium">Mi contenido</p>
          <p className="text-k-muted text-xs mt-0.5">
            {pendingDeliveries.length > 0
              ? `${pendingDeliveries.length} entrega${pendingDeliveries.length !== 1 ? 's' : ''} disponible${pendingDeliveries.length !== 1 ? 's' : ''}`
              : 'Ver tu contenido'}
          </p>
        </button>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/${WA_NUMBER}`}
          target="_blank"
          rel="noreferrer"
          className="bg-k-surface rounded-card-lg p-4 text-left hover:bg-k-surface2/50 transition-colors"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div className="mb-2">
            <FaWhatsapp size={16} className="text-green-400" />
          </div>
          <p className="text-k-text text-sm font-medium">WhatsApp</p>
          <p className="text-k-muted text-xs mt-0.5">Contactar a Liu Creativo</p>
        </a>

        {/* Mi suscripción */}
        <button
          onClick={() => navigate('/portal/suscripcion')}
          className="bg-k-surface rounded-card-lg p-4 text-left hover:bg-k-surface2/50 transition-colors"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div className="mb-2">
            <FiCreditCard size={16} className="text-k-lila" />
          </div>
          <p className="text-k-text text-sm font-medium">Mi suscripción</p>
          <p className="text-k-muted text-xs mt-0.5">
            {plan
              ? `${plan.planName} · ${PLAN_STATUS_LABELS[plan.status] ?? plan.status}`
              : 'Ver tu plan'}
          </p>
        </button>
      </div>

      {/* Entregas + contenido reciente */}
      <div className="grid grid-cols-5 gap-5">
        {/* Entregas del mes */}
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-k-text font-semibold text-sm">Entregas del mes</h2>
            <button
              onClick={() => navigate('/portal/plan')}
              className="text-k-muted text-xs hover:text-k-text transition-colors"
            >
              Ver todo →
            </button>
          </div>

          {deliveries.length === 0 ? (
            <div
              className="bg-k-surface rounded-card-lg p-8 text-center"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <p className="text-k-muted text-sm">No hay entregas configuradas aún.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {displayDeliveries.map(d => {
                const s = DEL_STATUS[d.status] ?? DEL_STATUS.pending
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
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-k-text font-medium text-sm">{d.title}</p>
                        {d.pieces && <p className="text-k-muted text-xs mt-0.5">{d.pieces}</p>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${s.cls}`}>
                        {s.label}
                      </span>
                    </div>

                    <RoundIndicator used={d.reviewRounds ?? 0} max={d.maxReviewRounds ?? 3} size="sm" />
                    <p className="text-k-muted text-xs mt-1.5">
                      {d.reviewRounds ?? 0} de {d.maxReviewRounds ?? 3} rondas de revisión usadas
                    </p>

                    {d.status !== 'pending' && (d.driveLink || d.frameLink) && (
                      <div className="flex gap-2 mt-2.5">
                        {d.driveLink && (
                          <a
                            href={d.driveLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-k-muted hover:text-k-text bg-k-surface2 px-2.5 py-1.5 rounded-card transition-colors"
                            style={{ border: '1px solid var(--color-border)' }}
                          >
                            <FiExternalLink size={11} /> Drive
                          </a>
                        )}
                        {d.frameLink && (
                          <a
                            href={d.frameLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-k-muted hover:text-k-text bg-k-surface2 px-2.5 py-1.5 rounded-card transition-colors"
                            style={{ border: '1px solid var(--color-border)' }}
                          >
                            <FiExternalLink size={11} /> Frame.io
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Contenido en proceso */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-k-text font-semibold text-sm">Contenido en proceso</h2>
            <button
              onClick={() => navigate('/portal/contenido')}
              className="text-k-muted text-xs hover:text-k-text transition-colors"
            >
              Ver todo →
            </button>
          </div>

          {recentPieces.length === 0 ? (
            <div
              className="bg-k-surface rounded-card-lg p-8 text-center"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <p className="text-k-muted text-sm">Sin piezas activas.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentPieces.map(p => (
                <button
                  key={p.id}
                  onClick={() => navigate('/portal/contenido')}
                  className="bg-k-surface rounded-card-lg p-3.5 text-left hover:bg-k-surface2/50 transition-colors w-full"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-k-text text-sm font-medium leading-snug line-clamp-2">
                      {p.title}
                    </p>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-k-muted text-xs">{formatDate(p.publishDate)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
