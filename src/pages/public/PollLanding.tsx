import { motion } from 'framer-motion'
import type { EventRecord } from '../../types/schema'

export function PollLanding({ event, onStart }: { event: EventRecord; onStart: () => void }) {
  const dateRange = formatDateRange(event.startDate, event.endDate)

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-6 py-12 text-center">
      <BackgroundDecor />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex max-w-md flex-col items-center gap-5"
      >
        <span className="rounded-full border border-gt-gold-400/40 bg-gt-gold-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gt-gold-400">
          Chennai's Biggest Celebration
        </span>

        <h1 className="text-4xl font-extrabold leading-tight text-white font-[var(--font-display)]">
          {event.name}
        </h1>

        <p className="text-base text-white/70">Be part of the celebration. Tell us what you're excited about!</p>

        <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-white/60">
          <span>📅 {dateRange}</span>
          <span>📍 {event.venue}</span>
        </div>

        <motion.button
          type="button"
          onClick={onStart}
          whileTap={{ scale: 0.96 }}
          className="mt-4 w-full max-w-xs rounded-full bg-gradient-to-r from-gt-red-500 via-gt-magenta-500 to-gt-violet-500 px-8 py-4 text-lg font-bold text-white shadow-[0_8px_30px_rgba(224,57,154,0.35)]"
        >
          Start Poll
        </motion.button>

        <p className="text-xs text-white/40">Takes less than a minute · 5 quick questions</p>
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

function BackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 -left-20 h-64 w-64 rounded-full bg-gt-violet-500/30 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-gt-magenta-500/25 blur-3xl" />
      <div className="absolute top-1/3 right-4 h-32 w-32 rounded-full bg-gt-cyan-400/15 blur-2xl" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:22px_22px]" />
    </div>
  )
}
