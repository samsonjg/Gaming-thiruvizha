import type { QuestionComponentProps } from './types'

export function TextQuestion({ value, onChange, disabled }: QuestionComponentProps) {
  const text = value?.kind === 'text' ? value.text : ''

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        disabled={disabled}
        onChange={(e) => onChange({ kind: 'text', text: e.target.value })}
        placeholder="Type your answer here..."
        rows={4}
        maxLength={500}
        className="w-full resize-none rounded-2xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-gt-violet-400"
      />
      <p className="text-right text-xs text-white/40">{text.length}/500</p>
    </div>
  )
}
