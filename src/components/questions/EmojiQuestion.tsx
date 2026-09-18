import { motion } from 'framer-motion'
import type { QuestionComponentProps } from './types'

export function EmojiQuestion({ options, value, onChange, disabled }: QuestionComponentProps) {
  const selectedId = value?.kind === 'options' ? value.optionIds[0] : undefined

  return (
    <div className="flex flex-wrap justify-center gap-3 py-2">
      {options.map((opt) => (
        <motion.button
          key={opt.id}
          type="button"
          disabled={disabled}
          whileTap={{ scale: disabled ? 1 : 0.85 }}
          animate={{ scale: selectedId === opt.id ? 1.2 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          onClick={() => onChange({ kind: 'options', optionIds: [opt.id] })}
          className={`flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 text-3xl transition-colors ${
            selectedId === opt.id ? 'border-gt-violet-400 bg-gt-violet-500/20' : 'border-white/10 bg-white/5'
          }`}
        >
          {opt.emoji}
        </motion.button>
      ))}
    </div>
  )
}
