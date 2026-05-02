export default function RoundIndicator({ used = 0, max = 3, size = 'md' }) {
  const h = size === 'sm' ? 'h-1' : 'h-1.5'
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`${h} flex-1 rounded-full ${
            i < used
              ? i === used - 1 ? 'bg-k-yellow' : 'bg-k-orange'
              : 'bg-k-surface2'
          }`}
        />
      ))}
    </div>
  )
}
