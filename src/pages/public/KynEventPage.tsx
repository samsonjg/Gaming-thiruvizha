import { Link } from 'react-router-dom'
import { GT_POLL_SLUG } from '../../constants/demoIds'
import { useActiveChallenge } from '../../hooks/usePhotoChallenge'
import { PhotoChallengeCard } from '../../features/photo-challenge/PhotoChallengeCard'

// Stand-in for the real Kyn event detail page, just enough to demonstrate
// the "Participate in Poll" integration hook (section 18/29 of the brief).
export function KynEventPage() {
  const { data: challenge } = useActiveChallenge()

  return (
    <div className="min-h-screen bg-gt-purple-950 text-white [background:radial-gradient(120%_120%_at_50%_0%,#2a1458_0%,#150a2e_55%,#0d0620_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="flex h-40 items-center justify-center bg-gradient-to-br from-gt-purple-700 via-gt-violet-500 to-gt-magenta-500 text-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gt-gold-400">Gaming Thiruvizha</p>
              <p className="mt-1 text-2xl font-extrabold">Chennai's Biggest Celebration</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 p-5">
            <h1 className="text-2xl font-bold">Gaming Thiruvizha 2026</h1>
            <div className="flex flex-wrap gap-2 text-xs text-white/60">
              <span className="rounded-full bg-white/10 px-3 py-1">📅 Sat, 26 Sep – Sun, 27 Sep</span>
              <span className="rounded-full bg-white/10 px-3 py-1">📍 Ramapuram</span>
            </div>
            <p className="text-sm text-white/70">
              Gaming Thiruvizha is a flagship Pop Culture, Animation Visual Effects, Gaming and Comics IP and esports
              festival celebrating Indian gamers, cosplayers, anime enthusiasts, creators and digital youth.
            </p>
            <p className="text-sm text-white/50">Chennai Trade Centre, Nandambakkam</p>

            <Link
              to={`/poll/${GT_POLL_SLUG}?source=kyn&utm_source=kyn_app&utm_medium=event_page`}
              className="mt-3 w-full rounded-full bg-gradient-to-r from-gt-red-500 via-gt-magenta-500 to-gt-violet-500 px-6 py-3 text-center font-bold text-white"
            >
              Participate in Poll
            </Link>
          </div>
        </div>

        {challenge && <PhotoChallengeCard challenge={challenge} />}

        <p className="mt-6 text-center text-xs text-white/30">Kyn Event Poll & Engagement Platform — demo entry point</p>
      </div>
    </div>
  )
}
