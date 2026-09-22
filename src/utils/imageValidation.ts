// Client-side image validation + compression for the Photo Challenge —
// see docs/PRD.md "Photo Challenge". No new npm dependency; uses the
// browser's native Canvas API. This is a UX/cost optimization (smaller
// uploads = fewer Storage bytes + faster for the user), not a security
// boundary — storage.rules enforces its own content-type/size ceiling
// server-side regardless of what this does client-side.

export interface ImageValidationResult {
  ok: boolean
  error?: string
}

const DEFAULT_MAX_DIMENSION = 1600 // px, longest edge
const DEFAULT_JPEG_QUALITY = 0.82

export function validateImageFile(
  file: File,
  opts: { allowedTypes: string[]; maxFileSizeBytes: number },
): ImageValidationResult {
  if (!opts.allowedTypes.includes(file.type)) {
    const friendly = opts.allowedTypes.map((t) => t.split('/')[1]?.toUpperCase()).join(', ')
    return { ok: false, error: `Please upload a ${friendly} image.` }
  }
  if (file.size > opts.maxFileSizeBytes) {
    const maxMb = (opts.maxFileSizeBytes / (1024 * 1024)).toFixed(1)
    return { ok: false, error: `That file is too large — please upload an image under ${maxMb} MB.` }
  }
  return { ok: true }
}

// Downscales images above DEFAULT_MAX_DIMENSION and re-encodes as JPEG at
// DEFAULT_JPEG_QUALITY, to keep uploads (and therefore Storage cost)
// small. Returns the original file unchanged if it's already small enough
// or if compression fails for any reason (never blocks a valid upload).
export async function compressImageIfNeeded(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, DEFAULT_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    if (scale >= 1 && file.size < 1.5 * 1024 * 1024) {
      bitmap.close()
      return file
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', DEFAULT_JPEG_QUALITY))
    if (!blob) return file

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export function fileExtension(file: File): string {
  const fromType = file.type.split('/')[1]
  if (fromType) return fromType === 'jpeg' ? 'jpg' : fromType
  return file.name.split('.').pop() || 'jpg'
}
