import { motion } from 'framer-motion'

export function ResultBar({
  label,
  emoji,
  pct,
  count,
  highlight,
  theme = 'dark',
}: {
  label: string
  emoji?: string
  pct: number
  count?: number
  highlight?: boolean
  theme?: 'dark' | 'light'
}) {
  const isDark = theme === 'dark'
  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-center justify-between text-sm font-medium ${isDark ? 'text-white/85' : 'text-admin-text'}`}>
        <span className="flex items-center gap-1.5">
          {emoji && <span>{emoji}</span>}
          {label}
        </span>
        <span className={isDark ? 'text-white/60' : 'text-admin-muted'}>
          {pct}% {count !== undefined && <span className="ml-1">({count})</span>}
        </span>
      </div>
      <div className={`h-3 w-full overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-admin-border'}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            highlight
              ? 'bg-gradient-to-r from-gt-violet-400 to-gt-magenta-500'
              : isDark
                ? 'bg-white/30'
                : 'bg-admin-primary/60'
          }`}
        />
      </div>
    </div>
  )
}
