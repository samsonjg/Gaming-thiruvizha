import { Link } from 'react-router-dom'
import type { PhotoChallenge } from '../../types/schema'

// The card shown on the Kyn event page alongside "Participate in Poll" —
// same visual language (rounded-3xl card, white/5 background, gradient
// CTA), a second independent engagement activity, not a replacement for
// the poll card next to it. See docs/PRD.md "Photo Challenge".
export function PhotoChallengeCard({ challenge }: { challenge: PhotoChallenge }) {
  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📸</span>
          <p className="text-xs font-bold uppercase tracking-widest text-gt-gold-400">Photo Challenge</p>
        </div>
        <h2 className="text-xl font-bold text-white">{challenge.title}</h2>
        <p className="text-sm text-white/70">{challenge.question}</p>
        {challenge.rewardPoints > 0 && (
          <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">🏆 {challenge.rewardPoints} Points</span>
        )}
        <Link
          to="/photo-challenge"
          className="mt-1 w-full rounded-full bg-gradient-to-r from-gt-red-500 via-gt-magenta-500 to-gt-violet-500 px-6 py-3 text-center font-bold text-white"
        >
          Upload Photo
        </Link>
      </div>
    </div>
  )
}
