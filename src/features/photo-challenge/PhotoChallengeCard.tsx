import { Link } from 'react-router-dom'
import type { PhotoChallenge } from '../../types/schema'

// The compact grid-cell card shown on the Kyn event page next to the Poll
// card, both equal weight, both above the fold — see docs/PRD.md "Photo
// Challenge" and the Twin Cards home page redesign (2026-09-23).
export function PhotoChallengeCard({ challenge }: { challenge: PhotoChallenge }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-3xl border border-white/10 bg-white/5 p-4">
      <span className="text-2xl">📸</span>
      <div>
        <h2 className="text-sm font-bold text-white">Snap Hunt</h2>
        <p className="mt-0.5 line-clamp-2 text-xs text-white/60">{challenge.question}</p>
      </div>
      {challenge.rewardPoints > 0 && (
        <span className="w-fit rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/60">🏆 {challenge.rewardPoints} pts</span>
      )}
      <div className="flex-1" />
      <Link
        to="/photo-challenge"
        className="w-full rounded-full bg-gradient-to-r from-gt-red-500 via-gt-magenta-500 to-gt-violet-500 px-4 py-2.5 text-center text-xs font-bold text-white"
      >
        Upload Photo
      </Link>
    </div>
  )
}
