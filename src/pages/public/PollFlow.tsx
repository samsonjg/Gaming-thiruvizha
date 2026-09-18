import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AnswerValue, Question, QuestionOption } from '../../types/schema'
import { QuestionCard } from '../../components/common/QuestionCard'
import { QuestionRenderer, isAnswerValid } from '../../features/questions/QuestionRenderer'
import { ProgressIndicator } from '../../components/common/ProgressIndicator'

interface PollFlowProps {
  questions: Question[]
  optionsByQuestion: Map<string, QuestionOption[]>
  currentIndex: number
  alreadyAnswered: boolean
  onSubmit: (questionId: string, value: AnswerValue) => Promise<void> | void
  onSkip: () => void
}

export function PollFlow({ questions, optionsByQuestion, currentIndex, alreadyAnswered, onSubmit, onSkip }: PollFlowProps) {
  const question = questions[currentIndex]
  const [value, setValue] = useState<AnswerValue | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!question) return null

  const valid = isAnswerValid(question.type, value) || !question.required

  async function handleSubmit() {
    if (!value && question.required) return
    setSubmitting(true)
    await onSubmit(question.id, value ?? { kind: 'text', text: '' })
    setSubmitting(false)
    setValue(null)
  }

  return (
    <div className="flex min-h-full flex-col px-5 pb-8 pt-6">
      <ProgressIndicator current={currentIndex + 1} total={questions.length} />

      <div className="mt-6 flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={question.id}>
            <QuestionCard title={question.title} description={question.description} required={question.required}>
              {alreadyAnswered ? (
                <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
                  You've already responded to this question.
                </p>
              ) : (
                <QuestionRenderer
                  question={question}
                  options={optionsByQuestion.get(question.id) ?? []}
                  value={value}
                  onChange={setValue}
                  disabled={submitting}
                />
              )}
            </QuestionCard>
          </motion.div>
        </AnimatePresence>
      </div>

      {alreadyAnswered ? (
        <motion.button
          type="button"
          onClick={onSkip}
          whileTap={{ scale: 0.97 }}
          className="mt-6 w-full rounded-full bg-gradient-to-r from-gt-red-500 via-gt-magenta-500 to-gt-violet-500 px-8 py-4 text-lg font-bold text-white"
        >
          Continue
        </motion.button>
      ) : (
        <motion.button
          type="button"
          disabled={!valid || submitting}
          onClick={handleSubmit}
          whileTap={{ scale: valid ? 0.97 : 1 }}
          className={`mt-6 w-full rounded-full px-8 py-4 text-lg font-bold text-white transition-opacity ${
            valid ? 'bg-gradient-to-r from-gt-red-500 via-gt-magenta-500 to-gt-violet-500' : 'bg-white/10 opacity-50'
          }`}
        >
          {submitting ? 'Submitting…' : 'Submit Vote'}
        </motion.button>
      )}
    </div>
  )
}
