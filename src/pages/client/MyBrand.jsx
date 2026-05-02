import { FiExternalLink, FiCheckCircle, FiClock, FiUploadCloud, FiFolder } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { useAuth } from '../../hooks/useAuth'
import { useMyBrand } from '../../hooks/useMyBrand'

const WA_NUMBER = '56968280822'

const ASSET_SLOTS = [
  {
    key:     'briefStatus',
    linkKey: 'briefDriveLink',
    label:   'Brief completado',
    desc:    'PDF / Google Doc / Word',
  },
  {
    key:     'logoStatus',
    linkKey: 'logoDriveLink',
    label:   'Logo (AI / SVG / PNG)',
    desc:    'Archivo en alta calidad',
  },
  {
    key:     'photosStatus',
    linkKey: 'photosDriveLink',
    label:   'Fotos de la empresa',
    desc:    'JPG o PNG de producto o equipo',
  },
  {
    key:     'referencesStatus',
    linkKey: 'referencesDriveLink',
    label:   'Referencias visuales',
    desc:    'Imágenes de inspiración y estilo',
  },
]

const STATUS_CFG = {
  pending:  { label: 'Pendiente', cls: 'bg-k-surface2 text-k-muted',     icon: FiClock },
  uploaded: { label: 'Recibido',  cls: 'bg-k-orange/15 text-k-orange',   icon: FiCheckCircle },
  reviewed: { label: 'Revisado',  cls: 'bg-green-500/15 text-green-400', icon: FiCheckCircle },
}

function StepNumber({ n, active, done }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 ${
      done
        ? 'bg-k-orange border-k-orange text-white'
        : active
        ? 'bg-k-surface2 border-k-orange text-k-orange'
        : 'bg-k-surface2 border-k-surface2 text-k-muted/50'
    }`}>
      {done ? <FiCheckCircle size={13} /> : n}
    </div>
  )
}

export default function MyBrand() {
  const { clientId } = useAuth()
  const { brand, loading } = useMyBrand(clientId)

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-7 h-7 border-2 border-k-orange/30 border-t-k-orange rounded-full animate-spin" />
      </div>
    )
  }

  const allReviewed = brand?.brandKitReady

  const step1Done = Boolean(brand?.briefTemplateUrl) || Boolean(brand)
  const step2Done = ASSET_SLOTS.some(s => (brand?.[s.key] ?? 'pending') !== 'pending')
  const step3Done = allReviewed

  const activeStep = step3Done ? 4 : step2Done ? 3 : step1Done ? 2 : 1

  const confirmMsg = 'Hola Liu Creativo, ya subí todos mis archivos de marca a la carpeta Drive. Pueden revisarlos cuando estén listos.'

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-k-text text-2xl font-semibold">Mi Marca</h1>
        <p className="text-k-muted text-sm mt-1">Archivos y estado de tu brand kit</p>
      </div>

      {/* Brand kit listo banner */}
      {allReviewed && (
        <div
          className="flex items-center gap-3 bg-green-500/10 rounded-card-lg px-4 py-3.5 mb-6"
          style={{ border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <FiCheckCircle size={18} className="text-green-400 shrink-0" />
          <div>
            <p className="text-green-400 font-medium text-sm">Brand Kit listo</p>
            <p className="text-green-400/70 text-xs mt-0.5">
              Todos tus archivos están revisados y listos para producción.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">

        {/* ── PASO 1 — Descargar plantilla ── */}
        <div
          className="bg-k-surface rounded-card-lg p-5"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-start gap-4">
            <StepNumber n={1} active={activeStep === 1} done={step1Done} />
            <div className="flex-1 min-w-0">
              <p className="text-k-text font-semibold text-sm mb-0.5">Descarga la plantilla de brief</p>
              <p className="text-k-muted text-xs mb-4">
                Completa el brief para que podamos crear contenido alineado con tu marca.
              </p>
              {brand?.briefTemplateUrl ? (
                <a
                  href={brand.briefTemplateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white bg-k-orange hover:bg-k-orange/90 px-4 py-2 rounded-card transition-colors"
                >
                  <FiExternalLink size={14} />
                  Abrir plantilla de Brief
                </a>
              ) : (
                <p className="text-k-muted text-xs italic">
                  La plantilla aún no está disponible. Contáctanos para recibirla.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── PASO 2 — Subir archivos al Drive ── */}
        <div
          className="bg-k-surface rounded-card-lg p-5"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-start gap-4">
            <StepNumber n={2} active={activeStep === 2} done={step2Done} />
            <div className="flex-1 min-w-0">
              <p className="text-k-text font-semibold text-sm mb-0.5">Sube tus archivos al Drive</p>
              <p className="text-k-muted text-xs mb-4">
                Sube el brief completado, tu logo, fotos y referencias a la carpeta compartida de Drive.
              </p>

              {/* Estado de cada archivo con su carpeta de Drive */}
              <div className="flex flex-col gap-2">
                {ASSET_SLOTS.map(({ key, linkKey, label, desc }) => {
                  const status   = brand?.[key]     ?? 'pending'
                  const driveUrl = brand?.[linkKey] ?? ''
                  const cfg  = STATUS_CFG[status] ?? STATUS_CFG.pending
                  const Icon = cfg.icon

                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between px-4 py-3 rounded-card-lg"
                      style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface2)' }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon size={14} className={status === 'pending' ? 'text-k-muted' : status === 'reviewed' ? 'text-green-400' : 'text-k-orange'} />
                        <div className="min-w-0">
                          <p className="text-k-text text-sm font-medium">{label}</p>
                          <p className="text-k-muted text-xs">{desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                        {driveUrl ? (
                          <a
                            href={driveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-white bg-k-orange hover:bg-k-orange/90 px-2.5 py-1 rounded transition-colors"
                          >
                            <FiUploadCloud size={11} />
                            Subir aquí
                          </a>
                        ) : (
                          <span className="text-k-muted text-xs italic">Sin carpeta asignada</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── PASO 3 — Confirmar envío ── */}
        <div
          className="bg-k-surface rounded-card-lg p-5"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-start gap-4">
            <StepNumber n={3} active={activeStep === 3} done={step3Done} />
            <div className="flex-1 min-w-0">
              <p className="text-k-text font-semibold text-sm mb-0.5">Avísanos que ya subiste todo</p>
              <p className="text-k-muted text-xs mb-4">
                Cuando hayas subido todos los archivos a Drive, escríbenos para comenzar a revisarlos.
              </p>
              {allReviewed ? (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <FiCheckCircle size={15} />
                  Brand kit revisado y listo
                </div>
              ) : (
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(confirmMsg)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-card transition-colors"
                >
                  <FaWhatsapp size={14} />
                  Listo — ya subí todo →
                </a>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Nota al pie */}
      <p className="text-k-muted text-xs text-center mt-6 leading-relaxed">
        ¿No tienes manual de marca? Lo podemos desarrollar como servicio adicional.{' '}
        <a
          href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola, me interesa el servicio de manual de marca.')}`}
          target="_blank"
          rel="noreferrer"
          className="text-k-orange hover:underline"
        >
          Ver precio →
        </a>
      </p>
    </div>
  )
}
