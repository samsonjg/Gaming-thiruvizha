import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { KynEventPage } from '../pages/public/KynEventPage'
import { PollPage } from '../pages/public/PollPage'
import { PhotoChallengePage } from '../pages/public/PhotoChallengePage'
import { RequireAdmin } from '../features/auth/RequireAdmin'
import { LoadingState } from '../components/ui'

// Admin is a large, separate audience (internal team, not public poll
// visitors) — lazy-loaded so public poll visitors never download the
// admin UI, drag-and-drop reordering, or chart code. See docs/ARCHITECTURE.md
// "Performance".
const AdminLayout = lazy(() => import('../components/layout/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const Dashboard = lazy(() => import('../pages/admin/Dashboard').then((m) => ({ default: m.Dashboard })))
const Events = lazy(() => import('../pages/admin/Events').then((m) => ({ default: m.Events })))
const EventForm = lazy(() => import('../pages/admin/EventForm').then((m) => ({ default: m.EventForm })))
const Polls = lazy(() => import('../pages/admin/Polls').then((m) => ({ default: m.Polls })))
const Questions = lazy(() => import('../pages/admin/Questions').then((m) => ({ default: m.Questions })))
const QuestionBuilder = lazy(() => import('../pages/admin/QuestionBuilder').then((m) => ({ default: m.QuestionBuilder })))
const QuestionPreview = lazy(() => import('../pages/admin/QuestionPreview').then((m) => ({ default: m.QuestionPreview })))
const Responses = lazy(() => import('../pages/admin/Responses').then((m) => ({ default: m.Responses })))
const Analytics = lazy(() => import('../pages/admin/Analytics').then((m) => ({ default: m.Analytics })))
const Settings = lazy(() => import('../pages/admin/Settings').then((m) => ({ default: m.Settings })))
const PhotoChallengeConfig = lazy(() =>
  import('../pages/admin/PhotoChallengeConfig').then((m) => ({ default: m.PhotoChallengeConfig })),
)
const PhotoChallengeSubmissions = lazy(() =>
  import('../pages/admin/PhotoChallengeSubmissions').then((m) => ({ default: m.PhotoChallengeSubmissions })),
)
const PhotoChallengeAnalytics = lazy(() =>
  import('../pages/admin/PhotoChallengeAnalytics').then((m) => ({ default: m.PhotoChallengeAnalytics })),
)

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-admin-bg">
      <LoadingState />
    </div>
  )
}

// Central route tree — see docs/ARCHITECTURE.md "Routing". Public routes
// need no auth; every /admin/* route is wrapped in RequireAdmin, which
// checks Firebase auth state + the admin custom claim client-side for UX
// only — the real authorization boundary is firestore.rules (see
// docs/SECURITY.md). Never rely on this route guard alone.
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<KynEventPage />} />
      <Route path="/poll/:slug" element={<PollPage />} />
      <Route path="/photo-challenge" element={<PhotoChallengePage />} />

      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <Suspense fallback={<AdminFallback />}>
              <AdminLayout />
            </Suspense>
          </RequireAdmin>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="events" element={<Events />} />
        <Route path="events/new" element={<EventForm />} />
        <Route path="events/:id" element={<EventForm />} />
        <Route path="polls" element={<Polls />} />
        <Route path="polls/:pollId/questions" element={<Questions />} />
        <Route path="polls/:pollId/questions/new" element={<QuestionBuilder />} />
        <Route path="polls/:pollId/questions/:questionId" element={<QuestionBuilder />} />
        <Route path="polls/:pollId/questions/:questionId/preview" element={<QuestionPreview />} />
        <Route path="responses" element={<Responses />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="photo-challenge/config" element={<PhotoChallengeConfig />} />
        <Route path="photo-challenge/submissions" element={<PhotoChallengeSubmissions />} />
        <Route path="photo-challenge/analytics" element={<PhotoChallengeAnalytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
