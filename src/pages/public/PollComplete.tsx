import { motion } from 'framer-motion'
import type { EventRecord } from '../../types/schema'

export function PollComplete({ event }: { event: EventRecord }) {
  const dateRange = formatDateRange(event.startDate, event.endDate)

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-6 py-12 text-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gt-violet-500/30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        className="relative z-10 flex max-w-sm flex-col items-center gap-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 14 }}
          className="text-6xl"
        >
          🎮
        </motion.div>

        <h1 className="text-2xl font-extrabold text-white">You're officially part of Gaming Thiruvizha!</h1>
        <p className="text-sm text-white/70">Thanks for sharing your opinion.</p>

        <div className="mt-2 flex flex-col gap-2 self-stretch rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left text-sm text-white/80">
          <span className="flex items-center gap-2">
            <span className="text-gt-cyan-400">✓</span> Poll completed
          </span>
          <span className="flex items-center gap-2">
            <span className="text-gt-cyan-400">✓</span> Your responses recorded
          </span>
        </div>

        <div className="mt-3 text-sm text-white/60">
          <p>See you at {event.venue}</p>
          <p className="font-semibold text-white/80">{dateRange}</p>
        </div>

        <div className="mt-4 flex w-full flex-col gap-3">
          <a
            href="/"
            className="w-full rounded-full bg-gradient-to-r from-gt-red-500 via-gt-magenta-500 to-gt-violet-500 px-8 py-4 text-center text-lg font-bold text-white"
          >
            Explore Gaming Thiruvizha
          </a>
          <a
            href="/"
            className="w-full rounded-full border border-white/20 px-8 py-3 text-center text-sm font-semibold text-white/80"
          >
            View Event Details
          </a>
        </div>
      </motion.div>
    </div>
  )
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${s.toLocaleDateString('en-IN', opts)} – ${e.toLocaleDateString('en-IN', opts)}, ${e.getFullYear()}`
}
