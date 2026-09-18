import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export function QuestionCard({
  title,
  description,
  required,
  children,
}: {
  title: string
  description?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col gap-5"
    >
      <div>
        <h2 className="text-xl font-bold leading-snug text-white">
          {title}
          {required && <span className="ml-1 text-gt-orange-500">*</span>}
        </h2>
        {description && <p className="mt-1 text-sm text-white/60">{description}</p>}
      </div>
      {children}
    </motion.div>
  )
}
