import { OptionCard } from './OptionCard'
import type { QuestionComponentProps } from './types'

export function YesNoQuestion({ value, onChange, disabled }: QuestionComponentProps) {
  const selected = value?.kind === 'options' ? value.optionIds[0] : undefined

  return (
    <div className="flex flex-col gap-3">
      <OptionCard label="Yes" emoji="✅" selected={selected === 'yes'} disabled={disabled} onClick={() => onChange({ kind: 'options', optionIds: ['yes'] })} />
      <OptionCard label="No" emoji="❌" selected={selected === 'no'} disabled={disabled} onClick={() => onChange({ kind: 'options', optionIds: ['no'] })} />
    </div>
  )
}
