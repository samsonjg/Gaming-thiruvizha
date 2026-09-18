import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as questionsRepository from '../../repositories/questions.repository'
import * as optionsRepository from '../../repositories/options.repository'
import type { Question, QuestionType } from '../../types/schema'
import { QUESTION_TYPE_LIST, QUESTION_TYPE_META } from '../../constants/questionTypeMeta'
import { PageHeader, Card, Input, Textarea, Select, Button, Toggle, IconButton } from '../../components/ui'
import { PublishModal } from '../../features/admin/PublishModal'

type DraftOption = { id: string; label: string; emoji: string; imageUrl: string; active: boolean }

function emptyOption(): DraftOption {
  return { id: `draft-${Math.random().toString(36).slice(2)}`, label: '', emoji: '', imageUrl: '', active: true }
}

export function QuestionBuilder() {
  const { pollId, questionId } = useParams<{ pollId: string; questionId: string }>()
  const isNew = !questionId || questionId === 'new'
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<QuestionType>('single_choice')
  const [required, setRequired] = useState(true)
  const [resultsVisible, setResultsVisible] = useState(true)
  const [randomizeOptions, setRandomizeOptions] = useState(false)
  const [ratingScale, setRatingScale] = useState<5 | 10>(5)
  const [options, setOptions] = useState<DraftOption[]>([emptyOption(), emptyOption()])
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(questionId && !isNew ? questionId : null)
  const [showPublish, setShowPublish] = useState(false)

  useEffect(() => {
    if (isNew || !questionId) return
    questionsRepository.getQuestion(questionId).then(async (q) => {
      if (!q) return
      setTitle(q.title)
      setDescription(q.description ?? '')
      setType(q.type)
      setRequired(q.required)
      setResultsVisible(q.settings.resultsVisible)
      setRandomizeOptions(q.settings.randomizeOptions)
      setRatingScale(q.settings.ratingScale ?? 5)
      const opts = await optionsRepository.getOptions(questionId)
      if (opts.length) {
        setOptions(
          opts.map((o) => ({ id: o.id, label: o.label, emoji: o.emoji ?? '', imageUrl: o.imageUrl ?? '', active: o.active })),
        )
      }
    })
  }, [questionId, isNew])

  const meta = QUESTION_TYPE_META[type]

  function updateOption(id: string, patch: Partial<DraftOption>) {
    setOptions((opts) => opts.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }

  function addOption() {
    setOptions((opts) => [...opts, emptyOption()])
  }

  function removeOption(id: string) {
    setOptions((opts) => opts.filter((o) => o.id !== id))
  }

  async function persist(explicitStatus?: Question['status']): Promise<string | null> {
    setSaving(true)
    const questions = pollId ? await questionsRepository.getQuestions(pollId) : []
    const existing = savedId ? questions.find((q) => q.id === savedId) : undefined
    const status: Question['status'] = explicitStatus ?? existing?.status ?? 'draft'
    const payload: Omit<Question, 'id'> = {
      pollId: pollId!,
      type,
      title,
      description: description || undefined,
      required,
      order: existing?.order ?? questions.length + 1,
      status,
      settings: {
        resultsVisible,
        randomizeOptions,
        ratingScale: type === 'rating' ? ratingScale : undefined,
      },
    }

    let id = savedId
    if (id) {
      await questionsRepository.updateQuestion(id, payload)
    } else {
      const created = await questionsRepository.createQuestion(payload)
      id = created.id
      setSavedId(id)
    }

    if (meta.hasOptions) {
      await optionsRepository.setOptions(
        id!,
        options
          .filter((o) => o.label.trim().length > 0)
          .map((o, idx) => ({ label: o.label, emoji: o.emoji || undefined, imageUrl: o.imageUrl || undefined, active: o.active, order: idx + 1 })),
      )
    }

    setSaving(false)
    return id
  }

  async function handleSaveDraft() {
    await persist('draft')
    navigate(`/admin/polls/${pollId}/questions`)
  }

  async function handlePreview() {
    const id = await persist()
    if (id) navigate(`/admin/polls/${pollId}/questions/${id}/preview`)
  }

  async function handlePublishClick() {
    await persist()
    setShowPublish(true)
  }

  async function confirmPublish() {
    if (savedId) await questionsRepository.updateQuestion(savedId, { status: 'published' })
    setShowPublish(false)
    navigate(`/admin/polls/${pollId}/questions`)
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={isNew ? 'Create Question' : 'Edit Question'} subtitle="Configure the question exactly as it will appear to users" />

      <div className="grid max-w-4xl grid-cols-1 gap-6 px-8 py-6">
        <Card className="flex flex-col gap-4">
          <Field label="Question">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Question title" />
          </Field>
          <Field label="Description (optional)">
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional supporting text" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Question Type">
              <Select value={type} onChange={(e) => setType(e.target.value as QuestionType)}>
                {QUESTION_TYPE_LIST.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Required">
              <div className="flex h-9 items-center">
                <Toggle checked={required} onChange={setRequired} label={required ? 'Required' : 'Optional'} />
              </div>
            </Field>
          </div>

          {type === 'rating' && (
            <Field label="Rating Scale">
              <Select value={ratingScale} onChange={(e) => setRatingScale(Number(e.target.value) as 5 | 10)}>
                <option value={5}>1–5</option>
                <option value={10}>1–10</option>
              </Select>
            </Field>
          )}
        </Card>

        {meta.hasOptions && (
          <Card className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-admin-text">Options</p>
            {options.map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <Input
                  value={opt.emoji}
                  onChange={(e) => updateOption(opt.id, { emoji: e.target.value })}
                  placeholder="🎮"
                  className="w-14 text-center"
                />
                <Input
                  value={opt.label}
                  onChange={(e) => updateOption(opt.id, { label: e.target.value })}
                  placeholder="Option label"
                  className="flex-1"
                />
                {type === 'image_choice' && (
                  <Input
                    value={opt.imageUrl}
                    onChange={(e) => updateOption(opt.id, { imageUrl: e.target.value })}
                    placeholder="Image URL"
                    className="w-40"
                  />
                )}
                <Toggle checked={opt.active} onChange={(v) => updateOption(opt.id, { active: v })} />
                <IconButton onClick={() => removeOption(opt.id)} title="Remove option">
                  ✕
                </IconButton>
              </div>
            ))}
            <Button variant="secondary" className="self-start" onClick={addOption}>
              + Add Option
            </Button>
          </Card>
        )}

        <Card className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-admin-text">Settings</p>
          <Toggle checked={resultsVisible} onChange={setResultsVisible} label="Show results to users after voting" />
          {meta.hasOptions && <Toggle checked={randomizeOptions} onChange={setRandomizeOptions} label="Randomize option order" />}
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(`/admin/polls/${pollId}/questions`)}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleSaveDraft} disabled={saving || !title}>
            Save Draft
          </Button>
          <Button variant="secondary" onClick={handlePreview} disabled={saving || !title}>
            Preview
          </Button>
          <Button onClick={handlePublishClick} disabled={saving || !title}>
            Publish
          </Button>
        </div>
      </div>

      <PublishModal open={showPublish} onCancel={() => setShowPublish(false)} onConfirm={confirmPublish} />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-admin-muted">{label}</span>
      {children}
    </label>
  )
}
