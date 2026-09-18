import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import * as pollsRepository from '../../repositories/polls.repository'
import * as questionsRepository from '../../repositories/questions.repository'
import * as responsesRepository from '../../repositories/responses.repository'
import type { Question, Poll } from '../../types/schema'
import { QUESTION_TYPE_META } from '../../constants/questionTypeMeta'
import { PageHeader, Card, Badge, Button, LinkButton, IconButton } from '../../components/ui'
import { PublishModal } from '../../features/admin/PublishModal'

export function Questions() {
  const { pollId } = useParams<{ pollId: string }>()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({})
  const [publishTarget, setPublishTarget] = useState<Question | null>(null)

  async function load() {
    if (!pollId) return
    const [p, qs, rows] = await Promise.all([
      pollsRepository.getPoll(pollId),
      questionsRepository.getQuestions(pollId),
      responsesRepository.getResponseRows({ pollId }),
    ])
    setPoll(p ?? null)
    setQuestions(qs)
    const counts: Record<string, number> = {}
    rows.forEach((r) => {
      counts[r.response.questionId] = (counts[r.response.questionId] ?? 0) + 1
    })
    setResponseCounts(counts)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !pollId) return
    const oldIndex = questions.findIndex((q) => q.id === active.id)
    const newIndex = questions.findIndex((q) => q.id === over.id)
    const reordered = arrayMove(questions, oldIndex, newIndex)
    setQuestions(reordered)
    await questionsRepository.reorderQuestions(
      pollId,
      reordered.map((q) => q.id),
    )
  }

  async function duplicate(id: string) {
    if (!pollId) return
    await questionsRepository.duplicateQuestion(pollId, id)
    load()
  }

  async function remove(id: string) {
    if (!pollId) return
    if (!confirm('Delete this question? This cannot be undone.')) return
    await questionsRepository.deleteQuestion(pollId, id)
    load()
  }

  async function toggleStatus(q: Question) {
    if (!pollId) return
    if (q.status === 'published') {
      await questionsRepository.updateQuestion(pollId, q.id, { status: 'unpublished' })
      load()
    } else {
      setPublishTarget(q)
    }
  }

  async function confirmPublish() {
    if (!publishTarget || !pollId) return
    await questionsRepository.updateQuestion(pollId, publishTarget.id, { status: 'published' })
    setPublishTarget(null)
    load()
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title={poll ? `Questions — ${poll.name}` : 'Questions'}
        subtitle="Drag to reorder. These questions power the public poll flow."
        actions={pollId && <LinkButton to={`/admin/polls/${pollId}/questions/new`}>+ Create Question</LinkButton>}
      />

      <div className="flex flex-col gap-3 px-8 py-6">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            {questions.map((q, idx) => (
              <QuestionRow
                key={q.id}
                question={q}
                index={idx}
                pollId={pollId!}
                responseCount={responseCounts[q.id] ?? 0}
                onDuplicate={() => duplicate(q.id)}
                onDelete={() => remove(q.id)}
                onToggleStatus={() => toggleStatus(q)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {questions.length === 0 && <p className="text-sm text-admin-muted">No questions yet — create the first one.</p>}
      </div>

      <PublishModal
        open={!!publishTarget}
        onCancel={() => setPublishTarget(null)}
        onConfirm={confirmPublish}
      />
    </div>
  )
}

function QuestionRow({
  question,
  index,
  pollId,
  responseCount,
  onDuplicate,
  onDelete,
  onToggleStatus,
}: {
  question: Question
  index: number
  pollId: string
  responseCount: number
  onDuplicate: () => void
  onDelete: () => void
  onToggleStatus: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id })
  const meta = QUESTION_TYPE_META[question.type]

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-wrap items-center justify-between gap-3 ${isDragging ? 'opacity-70' : ''}`}
    >
      <div className="flex items-center gap-3">
        <span {...attributes} {...listeners} className="cursor-grab text-admin-muted">
          ⠿
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-admin-muted">Q{index + 1}</span>
            <p className="font-semibold text-admin-text">{question.title}</p>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-admin-muted">
            <span>
              {meta.icon} {meta.label}
            </span>
            <Badge tone={question.status === 'published' ? 'success' : 'muted'}>{question.status}</Badge>
            <span>{responseCount} responses</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <LinkButton to={`/admin/polls/${pollId}/questions/${question.id}`} variant="secondary">
          Edit
        </LinkButton>
        <LinkButton to={`/admin/polls/${pollId}/questions/${question.id}/preview`} variant="secondary">
          Preview
        </LinkButton>
        <Button variant="secondary" onClick={onDuplicate}>
          Duplicate
        </Button>
        <Button variant="secondary" onClick={onToggleStatus}>
          {question.status === 'published' ? 'Unpublish' : 'Publish'}
        </Button>
        <IconButton onClick={onDelete} title="Delete question">
          🗑️
        </IconButton>
      </div>
    </Card>
  )
}
