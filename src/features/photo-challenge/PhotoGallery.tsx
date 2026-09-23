import { useEffect, useState } from 'react'
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore/lite'
import type { PhotoGalleryItem } from '../../types/schema'
import * as submissionsRepository from '../../repositories/photoSubmissions.repository'
import { analytics } from '../../services/analytics/analytics'
import { LoadingState } from '../../components/ui'

// Paginated ("Load more", not infinite scroll / no realtime listener) —
// see docs/PRD.md "Community Gallery" and "Free Firebase Tier": never
// loads every approved photo at once.
export function PhotoGallery({ challengeId }: { challengeId: string }) {
  const [items, setItems] = useState<PhotoGalleryItem[]>([])
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData>>()
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)

  async function loadPage(after?: QueryDocumentSnapshot<DocumentData>) {
    setLoading(true)
    const page = await submissionsRepository.getGalleryPage(challengeId, 12, after)
    setItems((prev) => (after ? [...prev, ...page.items] : page.items))
    setCursor(page.cursor)
    setHasMore(page.items.length === 12)
    setLoading(false)
  }

  useEffect(() => {
    analytics.track('photo_gallery_viewed')
    loadPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId])

  if (loading && items.length === 0) return <LoadingState label="Loading gallery…" />
  if (!loading && items.length === 0) {
    return <p className="py-6 text-center text-sm text-white/40">No approved photos yet — be the first!</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="aspect-square overflow-hidden rounded-2xl bg-black/30">
            <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => loadPage(cursor)}
          disabled={loading}
          className="w-full rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80"
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}
