import { useEffect, useState } from 'react'
import * as challengesRepository from '../../repositories/photoChallenges.repository'
import { useCurrentChallenge } from '../../hooks/usePhotoChallenge'
import type { PhotoChallenge, PhotoChallengeStatus } from '../../types/schema'
import { PageHeader, Card, Input, Textarea, Select, Button, LoadingState } from '../../components/ui'
import { PhotoChallengeTabs } from '../../features/admin/PhotoChallengeTabs'

const ALL_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const EMPTY: Omit<PhotoChallenge, 'id'> = {
  title: '',
  question: '',
  description: '',
  rewardPoints: 0,
  status: 'draft',
  startAt: '',
  endAt: '',
  maxPhotos: 1,
  allowedPhotoChanges: 1,
  maxFileSizeBytes: 5 * 1024 * 1024,
  allowedFileTypes: ALL_FILE_TYPES,
  termsContent: '',
  termsVersion: '1.0',
  aiDeclarationText: 'I confirm that this is a real photograph and is not AI-generated.',
  createdAt: '',
  updatedAt: '',
}

export function PhotoChallengeConfig() {
  const { data: existing, loading } = useCurrentChallenge()
  const [id, setId] = useState<string>()
  const [form, setForm] = useState<Omit<PhotoChallenge, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (existing) {
      const { id: existingId, ...rest } = existing
      setId(existingId)
      setForm(rest)
    }
  }, [existing])

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  function toggleFileType(type: string) {
    update('allowedFileTypes', form.allowedFileTypes.includes(type) ? form.allowedFileTypes.filter((t) => t !== type) : [...form.allowedFileTypes, type])
  }

  async function handleSave() {
    setSaving(true)
    const now = new Date().toISOString()
    if (id) {
      await challengesRepository.updateChallenge(id, { ...form, updatedAt: now })
    } else {
      const created = await challengesRepository.createChallenge({ ...form, createdAt: now, updatedAt: now })
      setId(created.id)
    }
    setSaving(false)
    setSaved(true)
  }

  const canSave = form.title.trim() && form.question.trim() && form.allowedFileTypes.length > 0

  if (loading) return <LoadingState />

  return (
    <div className="flex flex-col">
      <PageHeader title="Photo Challenge" subtitle="Configure the current challenge" />
      <PhotoChallengeTabs />

      <div className="max-w-2xl px-8 py-6">
        <Card className="flex flex-col gap-4">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Cosplay Photo Challenge" />
          </Field>

          <Field label="Challenge Question">
            <Input value={form.question} onChange={(e) => update('question', e.target.value)} placeholder="Show us your best cosplay look!" />
          </Field>

          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Reward Points">
              <Input type="number" min={0} value={form.rewardPoints} onChange={(e) => update('rewardPoints', Number(e.target.value))} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => update('status', e.target.value as PhotoChallengeStatus)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date">
              <Input type="date" value={form.startAt} onChange={(e) => update('startAt', e.target.value)} />
            </Field>
            <Field label="End Date">
              <Input type="date" value={form.endAt} onChange={(e) => update('endAt', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Max Photos">
              <Input type="number" min={1} value={form.maxPhotos} onChange={(e) => update('maxPhotos', Number(e.target.value))} />
            </Field>
            <Field label="Photo Changes Allowed">
              <Input
                type="number"
                min={0}
                value={form.allowedPhotoChanges}
                onChange={(e) => update('allowedPhotoChanges', Number(e.target.value))}
              />
            </Field>
          </div>

          <Field label="Max File Size (MB)">
            <Input
              type="number"
              min={1}
              value={Math.round(form.maxFileSizeBytes / (1024 * 1024))}
              onChange={(e) => update('maxFileSizeBytes', Number(e.target.value) * 1024 * 1024)}
            />
          </Field>

          <Field label="Allowed File Types">
            <div className="flex gap-3">
              {ALL_FILE_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-1.5 text-sm text-admin-text">
                  <input type="checkbox" checked={form.allowedFileTypes.includes(type)} onChange={() => toggleFileType(type)} />
                  {type.replace('image/', '').toUpperCase()}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Terms & Conditions">
            <Textarea rows={4} value={form.termsContent} onChange={(e) => update('termsContent', e.target.value)} />
          </Field>

          <Field label="Terms Version">
            <Input value={form.termsVersion} onChange={(e) => update('termsVersion', e.target.value)} />
          </Field>

          <Field label="AI Declaration Text">
            <Textarea rows={2} value={form.aiDeclarationText} onChange={(e) => update('aiDeclarationText', e.target.value)} />
          </Field>

          <div className="mt-2 flex items-center justify-end gap-2">
            {saved && <span className="text-sm text-emerald-600">Saved</span>}
            <Button onClick={handleSave} disabled={saving || !canSave}>
              {saving ? 'Saving…' : 'Save Configuration'}
            </Button>
          </div>
        </Card>
      </div>
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
