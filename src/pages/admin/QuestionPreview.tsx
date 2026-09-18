import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import * as dataService from '../../services/dataService'
import type { AnswerValue, Question, QuestionOption } from '../../types/schema'
import { PageHeader, LinkButton } from '../../components/admin/ui'
import { QuestionCard } from '../../components/shared/QuestionCard'
import { QuestionRenderer } from '../../components/questions/QuestionRenderer'

export function QuestionPreview() {
  const { pollId, questionId } = useParams<{ pollId: string; questionId: string }>()
  const [question, setQuestion] = useState<Question | null>(null)
  const [options, setOptions] = useState<QuestionOption[]>([])
  const [value, setValue] = useState<AnswerValue | null>(null)

  useEffect(() => {
    if (!questionId) return
    dataService.getQuestion(questionId).then((q) => setQuestion(q ?? null))
    dataService.getOptions(questionId).then(setOptions)
  }, [questionId])

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
                <QuestionRenderer question={question} options={options} value={value} onChange={setValue} />
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
