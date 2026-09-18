import type { QuestionComponentProps } from './types'
import { OptionCard } from './OptionCard'

export function MultipleChoiceQuestion({ options, value, onChange, disabled }: QuestionComponentProps) {
  const selectedIds = value?.kind === 'options' ? value.optionIds : []

  function toggle(optionId: string) {
    const next = selectedIds.includes(optionId)
      ? selectedIds.filter((id) => id !== optionId)
      : [...selectedIds, optionId]
    onChange({ kind: 'options', optionIds: next })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs uppercase tracking-wide text-white/50">Select all that apply</p>
      {options.map((opt) => (
        <OptionCard
          key={opt.id}
          label={opt.label}
          emoji={opt.emoji}
          imageUrl={opt.imageUrl}
          selected={selectedIds.includes(opt.id)}
          disabled={disabled}
          onClick={() => toggle(opt.id)}
        />
      ))}
    </div>
  )
}
