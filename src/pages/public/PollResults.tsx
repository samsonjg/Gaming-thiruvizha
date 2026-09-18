import { motion } from 'framer-motion'
import type { OptionResult } from '../../services/dataService'
import { ResultBar } from '../../components/shared/ResultBar'

export function PollResults({
  results,
  questionTitle,
  onContinue,
}: {
  results: OptionResult[]
  questionTitle: string
  onContinue: () => void
}) {
  const top = results.slice(0, 5)
  const others = results.slice(5)
  const othersPct = Math.round(others.reduce((s, r) => s + r.pct, 0) * 10) / 10
  const othersCount = others.reduce((s, r) => s + r.count, 0)

  return (
    <div className="flex min-h-full flex-col px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <p className="text-3xl">🎉</p>
        <h2 className="mt-2 text-2xl font-bold text-white">Vote submitted!</h2>
        <p className="mt-1 text-sm text-white/60">Thanks for being part of Gaming Thiruvizha.</p>
      </motion.div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="mb-4 text-sm font-semibold text-white/80">{questionTitle}</p>
        <div className="flex flex-col gap-4">
          {top.map((r, i) => (
            <ResultBar key={r.optionId} label={r.label} emoji={r.emoji} pct={r.pct} highlight={i === 0} />
          ))}
          {others.length > 0 && <ResultBar label="Others" pct={othersPct} count={othersCount} />}
        </div>
      </div>

      <motion.button
        type="button"
        onClick={onContinue}
        whileTap={{ scale: 0.97 }}
        className="mt-8 w-full rounded-full bg-gradient-to-r from-gt-red-500 via-gt-magenta-500 to-gt-violet-500 px-8 py-4 text-lg font-bold text-white"
      >
        Continue
      </motion.button>
    </div>
  )
}
