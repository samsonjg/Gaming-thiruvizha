import { useState } from 'react'
import { useParams } from 'react-router-dom'
import type { AnswerValue } from '../../types/schema'
import { useQuestion } from '../../hooks/useQuestions'
import { useOptions } from '../../hooks/useOptions'
import { PageHeader, LinkButton } from '../../components/ui'
import { QuestionCard } from '../../components/common/QuestionCard'
import { QuestionRenderer } from '../../features/questions/QuestionRenderer'

export function QuestionPreview() {
  const { pollId, questionId } = useParams<{ pollId: string; questionId: string }>()
  const { data: question } = useQuestion(questionId)
  const { data: options } = useOptions(questionId)
  const [value, setValue] = useState<AnswerValue | null>(null)

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Preview"
        subtitle="This is the exact component rendered on the public poll — not a mock"
        actions={
          <LinkButton to={`/admin/polls/${pollId}/questions/${questionId}`} variant="secondary">
            Back to Edit
          </LinkButton>
        }
      />

      <div className="flex justify-center px-8 py-10">
        {question ? (
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-admin-border shadow-xl">
            <div className="bg-gt-purple-950 px-5 py-8 [background:radial-gradient(120%_120%_at_50%_0%,#2a1458_0%,#150a2e_55%,#0d0620_100%)]">
              <QuestionCard title={question.title} description={question.description} required={question.required}>
                <QuestionRenderer question={question} options={options ?? []} value={value} onChange={setValue} />
              </QuestionCard>
              <button
                className="mt-6 w-full rounded-full bg-gradient-to-r from-gt-red-500 via-gt-magenta-500 to-gt-violet-500 px-8 py-4 text-lg font-bold text-white"
                disabled
              >
                Submit Vote
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-admin-muted">Loading…</p>
        )}
      </div>
    </div>
  )
}
