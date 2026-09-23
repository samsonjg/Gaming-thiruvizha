import { Link } from 'react-router-dom'
import { GT_POLL_SLUG } from '../../constants/demoIds'
import { useActiveChallenge } from '../../hooks/usePhotoChallenge'
import { PhotoChallengeCard } from '../../features/photo-challenge/PhotoChallengeCard'

// Stand-in for the real Kyn event detail page, just enough to demonstrate
// the "Participate in Poll" integration hook (section 18/29 of the brief).
//
// Twin Cards layout (2026-09-23): a compact single-row header replaces the
// old tall hero, and Poll + Snap Hunt render as two equal-weight cards so
// both are visible without scrolling — fixes user-reported friction where
// Snap Hunt was pushed below the fold. See the plan/mockups referenced in
// docs/CHANGELOG.md for the rejected alternatives (segmented tabs, icon hub).
export function KynEventPage() {
  const { data: challenge } = useActiveChallenge()

  return (
    <div className="min-h-screen bg-gt-purple-950 text-white [background:radial-gradient(120%_120%_at_50%_0%,#2a1458_0%,#150a2e_55%,#0d0620_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-5 py-8">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gt-violet-500 to-gt-magenta-500 text-lg">
            🎮
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">Gaming Thiruvizha 2026</p>
            <p className="mt-0.5 truncate text-[11px] text-white/55">Sept 26–27 · Chennai Trade Centre, Nandambakkam</p>
          </div>
        </div>

        <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">Choose how you want to join in</p>

        <div className={challenge ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 gap-3'}>
          <div className="flex flex-col gap-2.5 rounded-3xl border border-white/10 bg-white/5 p-4">
            <span className="text-2xl">📊</span>
            <div>
              <h2 className="text-sm font-bold text-white">Quick Poll</h2>
              <p className="mt-0.5 text-xs text-white/60">5 questions · takes under a minute</p>
            </div>
            <div className="flex-1" />
            <Link
              to={`/poll/${GT_POLL_SLUG}?source=kyn&utm_source=kyn_app&utm_medium=event_page`}
              className="w-full rounded-full bg-gradient-to-r from-gt-red-500 via-gt-magenta-500 to-gt-violet-500 px-4 py-2.5 text-center text-xs font-bold text-white"
            >
              Start Poll
            </Link>
          </div>

          {challenge && <PhotoChallengeCard challenge={challenge} />}
        </div>

        <p className="mt-2 text-center text-xs text-white/30">Kyn Event Poll & Engagement Platform — demo entry point</p>
      </div>
    </div>
  )
}
