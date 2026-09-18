import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { KynEventPage } from './pages/public/KynEventPage'
import { PollPage } from './pages/public/PollPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { Dashboard } from './pages/admin/Dashboard'
import { Events } from './pages/admin/Events'
import { EventForm } from './pages/admin/EventForm'
import { Polls } from './pages/admin/Polls'
import { Questions } from './pages/admin/Questions'
import { QuestionBuilder } from './pages/admin/QuestionBuilder'
import { QuestionPreview } from './pages/admin/QuestionPreview'
import { Responses } from './pages/admin/Responses'
import { Analytics } from './pages/admin/Analytics'
import { Settings } from './pages/admin/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<KynEventPage />} />
        <Route path="/poll/:slug" element={<PollPage />} />

        <Route path="/admin" element={<AdminLayout />}>
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
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
