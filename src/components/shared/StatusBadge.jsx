const STATUS_MAP = {
  en_revision: { label: 'En revisión', cls: 'bg-k-yellow/15 text-k-yellow' },
  aprobado:    { label: 'Aprobado',    cls: 'bg-k-lila/15 text-k-lila' },
  publicado:   { label: 'Publicado',   cls: 'bg-green-500/15 text-green-400' },
  archivado:   { label: 'Archivado',   cls: 'bg-k-muted/15 text-k-muted' },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] ?? { label: status, cls: 'bg-k-surface2 text-k-muted' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}
