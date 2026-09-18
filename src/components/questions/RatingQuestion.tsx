import { motion } from 'framer-motion'
import type { QuestionComponentProps } from './types'

export function RatingQuestion({ question, value, onChange, disabled }: QuestionComponentProps) {
  const scale = question.settings.ratingScale ?? 5
  const current = value?.kind === 'rating' ? value.rating : 0

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: scale }, (_, i) => i + 1).map((n) => (
          <motion.button
            key={n}
            type="button"
            disabled={disabled}
            whileTap={{ scale: disabled ? 1 : 0.85 }}
            onClick={() => onChange({ kind: 'rating', rating: n })}
            className="flex h-12 w-12 items-center justify-center text-3xl"
          >
            <motion.span
              animate={{ scale: n <= current ? 1.15 : 1, opacity: n <= current ? 1 : 0.35 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              {scale === 5 ? '⭐' : '🔥'}
            </motion.span>
          </motion.button>
        ))}
      </div>
      <p className="text-sm text-white/60">{current > 0 ? `${current} / ${scale}` : 'Tap to rate'}</p>
    </div>
  )
}
