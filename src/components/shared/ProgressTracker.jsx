import { Fragment } from 'react'
import { FiCheck } from 'react-icons/fi'

const STEPS = [
  'Ficha recibida',
  'Calendario aprobado',
  'En producción',
  'Revisión',
  'Entrega final',
]

export default function ProgressTracker({ step = 1 }) {
  return (
    <div className="flex items-start">
      {STEPS.map((label, i) => {
        const n = i + 1
        const done = n < step
        const active = n === step
        const isLast = i === STEPS.length - 1
        return (
          <Fragment key={n}>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                done
                  ? 'bg-k-orange border-k-orange text-white'
                  : active
                  ? 'bg-k-surface2 border-k-orange text-k-orange'
                  : 'bg-k-surface2 border-k-surface2 text-k-muted/50'
              }`}>
                {done ? <FiCheck size={12} /> : n}
              </div>
              <span className={`text-[11px] text-center leading-tight w-16 ${
                active ? 'text-k-text font-medium' : done ? 'text-k-muted' : 'text-k-muted/40'
              }`}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mt-[13px] transition-colors ${
                step > n ? 'bg-k-orange' : 'bg-k-surface2'
              }`} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
