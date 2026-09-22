import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { PhotoChallenge } from '../../types/schema'
import { validateImageFile, compressImageIfNeeded } from '../../utils/imageValidation'
import { analytics } from '../../services/analytics/analytics'

interface PhotoUploadFlowProps {
  challenge: PhotoChallenge
  mode: 'submit' | 'change'
  submitting: boolean
  onSubmit: (file: File) => Promise<void>
  onCancel?: () => void
}

// Select -> preview -> terms -> real-photo confirmation -> submit. See
// docs/PRD.md "User Photo Submission" and "AI-Generated Images". No
// external AI-detection API — just the user's declaration + terms +
// admin moderation, as specified.
export function PhotoUploadFlow({ challenge, mode, submitting, onSubmit, onCancel }: PhotoUploadFlowProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [realPhotoConfirmed, setRealPhotoConfirmed] = useState(false)
  const [preparing, setPreparing] = useState(false)

  async function handleFileSelect(selected: File | undefined) {
    setError(null)
    if (!selected) return

    analytics.track('photo_upload_started')

    const validation = validateImageFile(selected, {
      allowedTypes: challenge.allowedFileTypes,
      maxFileSizeBytes: challenge.maxFileSizeBytes,
    })
    if (!validation.ok) {
      setError(validation.error ?? 'That file could not be used.')
      return
    }

    setPreparing(true)
    const prepared = await compressImageIfNeeded(selected)
    setPreparing(false)

    setFile(prepared)
    setPreviewUrl(URL.createObjectURL(prepared))
    analytics.track('photo_selected')
  }

  function removePhoto() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setTermsAccepted(false)
    setRealPhotoConfirmed(false)
  }

  async function handleSubmit() {
    if (!file) return
    analytics.track(mode === 'change' ? 'photo_change_started' : 'photo_submission_started')
    try {
      await onSubmit(file)
      analytics.track(mode === 'change' ? 'photo_change_completed' : 'photo_submission_success')
    } catch (err) {
      analytics.track('photo_submission_failed')
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  const canSubmit = !!file && termsAccepted && realPhotoConfirmed && !submitting

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
      {!file ? (
        <>
          <input
            ref={cameraInputRef}
            type="file"
            accept={challenge.allowedFileTypes.join(',')}
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept={challenge.allowedFileTypes.join(',')}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => cameraInputRef.current?.click()}
              disabled={preparing}
              className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 text-white/60"
            >
              <span className="text-3xl">📷</span>
              <span className="text-sm font-medium">{preparing ? 'Preparing…' : 'Take Photo'}</span>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => galleryInputRef.current?.click()}
              disabled={preparing}
              className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 text-white/60"
            >
              <span className="text-3xl">🖼️</span>
              <span className="text-sm font-medium">{preparing ? 'Preparing…' : 'Choose from Gallery'}</span>
            </motion.button>
          </div>
        </>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-2xl">
            <img src={previewUrl ?? undefined} alt="Preview" className="max-h-80 w-full object-contain bg-black/30" />
            <button
              type="button"
              onClick={removePhoto}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="Remove photo"
            >
              ✕
            </button>
          </div>

          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            🚫 AI-generated images are not allowed. Please upload a real photograph.
          </div>

          <label className="flex items-start gap-2.5 text-sm text-white/80">
            <input
              type="checkbox"
              checked={realPhotoConfirmed}
              onChange={(e) => setRealPhotoConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            I confirm that this is a real photograph and is not AI-generated.
          </label>

          <label className="flex items-start gap-2.5 text-sm text-white/80">
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              I accept the{' '}
              <details className="inline">
                <summary className="inline cursor-pointer underline">Terms & Conditions</summary>
                <p className="mt-2 whitespace-pre-line text-xs text-white/60">{challenge.termsContent}</p>
              </details>
            </span>
          </label>
        </>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80">
            Cancel
          </button>
        )}
        {file && (
          <motion.button
            type="button"
            whileTap={{ scale: canSubmit ? 0.97 : 1 }}
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={`flex-1 rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity ${
              canSubmit ? 'bg-gradient-to-r from-gt-red-500 via-gt-magenta-500 to-gt-violet-500' : 'bg-white/10 opacity-50'
            }`}
          >
            {submitting ? 'Submitting…' : mode === 'change' ? 'Submit New Photo' : 'Submit'}
          </motion.button>
        )}
      </div>
    </div>
  )
}
