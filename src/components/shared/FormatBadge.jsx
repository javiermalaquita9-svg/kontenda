const FORMAT_MAP = {
  'Reels/TikTok': 'bg-k-orange/15 text-k-orange',
  'Post':         'bg-k-lila/15 text-k-lila',
  'Carrusel':     'bg-blue-500/15 text-blue-400',
  'Story':        'bg-pink-500/15 text-pink-400',
  'Meta Ads':     'bg-red-500/15 text-red-400',
}

export default function FormatBadge({ format }) {
  const cls = FORMAT_MAP[format] ?? 'bg-k-surface2 text-k-muted'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {format ?? '—'}
    </span>
  )
}
