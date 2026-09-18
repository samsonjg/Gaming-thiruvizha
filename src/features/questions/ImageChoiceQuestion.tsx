import { motion } from 'framer-motion'
import type { QuestionComponentProps } from './types'

export function ImageChoiceQuestion({ options, value, onChange, disabled }: QuestionComponentProps) {
  const selectedId = value?.kind === 'options' ? value.optionIds[0] : undefined

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt) => (
        <motion.button
          key={opt.id}
          type="button"
          disabled={disabled}
          whileTap={{ scale: disabled ? 1 : 0.96 }}
          animate={{ scale: selectedId === opt.id ? 1.03 : 1 }}
          onClick={() => onChange({ kind: 'options', optionIds: [opt.id] })}
          className={`overflow-hidden rounded-2xl border-2 text-left transition-colors ${
            selectedId === opt.id ? 'border-gt-violet-400' : 'border-white/10'
          }`}
        >
          <div className="flex aspect-square items-center justify-center bg-white/5 text-4xl">
            {opt.imageUrl ? <img src={opt.imageUrl} alt={opt.label} className="h-full w-full object-cover" /> : opt.emoji ?? '🖼️'}
          </div>
          <p className="px-2 py-2 text-sm font-medium text-white/90">{opt.label}</p>
        </motion.button>
      ))}
    </div>
  )
}
