import { motion } from 'framer-motion'
import clsx from 'clsx'

interface OptionCardProps {
  label: string
  emoji?: string
  imageUrl?: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
}

export function OptionCard({ label, emoji, imageUrl, selected, onClick, disabled }: OptionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      animate={{ scale: selected ? 1.015 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={clsx(
        'relative w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-colors',
        'min-h-[60px]',
        selected
          ? 'border-gt-violet-400 bg-gt-violet-500/20 shadow-[0_0_0_3px_rgba(167,104,255,0.25)]'
          : 'border-white/10 bg-white/5 hover:bg-white/10',
        disabled && 'opacity-60',
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0" />
      ) : emoji ? (
        <span className="text-2xl shrink-0">{emoji}</span>
      ) : null}
      <span className="flex-1 font-medium text-white/90">{label}</span>
      <motion.span
        initial={false}
        animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gt-violet-400 text-xs text-white"
      >
        ✓
      </motion.span>
    </motion.button>
  )
}
