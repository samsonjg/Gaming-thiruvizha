import type { QuestionComponentProps } from './types'
import { OptionCard } from './OptionCard'

export function SingleChoiceQuestion({ options, value, onChange, disabled }: QuestionComponentProps) {
  const selectedId = value?.kind === 'options' ? value.optionIds[0] : undefined

  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => (
        <OptionCard
          key={opt.id}
          label={opt.label}
          emoji={opt.emoji}
          imageUrl={opt.imageUrl}
          selected={selectedId === opt.id}
          disabled={disabled}
          onClick={() => onChange({ kind: 'options', optionIds: [opt.id] })}
        />
      ))}
    </div>
  )
}
