# User Flows

Derived from the actual implemented behavior. Where the prototype doesn't yet handle a case explicitly, it's marked `[TBD]`.

## Flow: Public Poll Participation

**Entry:** `/poll/:slug` (e.g. from a Kyn event page CTA, `?source=kyn&utm_source=kyn_app&utm_medium=event_page`, or a shared link with no params).

1. App resolves `:slug` to a `Poll`; if not found (or not published — production only), show a not-found state and stop.
2. App loads the poll's parent `Event` and its published `Question`s (+ each question's `QuestionOption`s).
3. Landing screen renders: event name, "Be part of the celebration…" subtext, dates, venue, "Start Poll" CTA.
4. User taps **Start Poll** → flow index resets to question 0.
5. For each question in order:
   a. If this session already answered it → show "You've already responded to this question." + **Continue** button; tapping Continue advances to the next question without re-rendering the question UI.
   b. Otherwise → render `QuestionRenderer` for the question's type, progress bar updates ("Question n of total"), **Submit Vote** stays disabled until the answer is valid (or is always enabled if the question is optional).
   c. User answers, taps **Submit Vote** → answer is persisted, duplicate-guard is recorded, flow advances to the next question with an animated transition (no full page reload, per GT-QUESTION-001 flow requirements).
6. After the last question, aggregated results are computed for the headline (`resultsVisible`) question and shown as animated horizontal bars (top 5 + "Others").
7. User taps **Continue** → Completion screen: confirmation copy, "Poll completed" / "Your responses recorded" checklist, event venue/date, **Explore Gaming Thiruvizha** and **View Event Details** CTAs (currently both point back to `/`, standing in for the real Kyn app deep link — `[TBD real destination]`).

**Empty state:** Poll/Event not found → centered "This poll could not be found." message, no crash.
**Error state:** `[TBD]` — prototype's in-memory writes don't fail; production must add a visible retry-safe error state for a failed Firestore write (see `SECURITY.md`/hardening notes) without losing the user's in-progress answer.
**Auth requirement:** None visible to the user; production silently establishes a Firebase Anonymous Auth session on first load.
**Back navigation:** `[TBD]` — the flow does not currently define explicit browser-back behavior mid-flow; state lives in a single page component's React state, so a hard refresh restarts the flow from the landing screen (duplicate-guard still applies per already-answered question).
**Refresh behavior:** A refresh mid-flow returns to the landing screen; already-answered questions remain locked (guard is persisted, not just in-memory), unanswered questions are re-askable from question 1.
**Deep-link behavior:** `/poll/:slug` is a real, shareable, bookmarkable URL. Query params (`source`, `utm_*`, `campaign`, `user_id`, `event_id`) are captured into the session on load and stamped on every response submitted in that session.
**Mobile behavior:** Single-column, large tappable cards, bottom-anchored primary CTA, tuned for 375–412px widths; verified with no horizontal scroll at 375px.

## Flow: Admin — Manage a Poll's Questions

**Entry:** `/admin` (no login in the prototype; production requires an authenticated admin — see `ADMIN_PANEL.md`).

1. Admin lands on the Dashboard, sees Gaming Thiruvizha metrics.
2. Admin navigates to **Polls** → sees the poll list with question/response counts and the public link.
3. Admin clicks **Questions** on a poll → question list, ordered, with type/status/response-count badges.
4. Admin can:
   - **Drag to reorder** — persists new `order` values immediately.
   - **+ Create Question** → Question Builder: fill title/description, pick a type (options editor appears only for option-based types), toggle required, configure settings → **Save Draft** (persists as `draft`, stays off the public poll) or **Preview** (persists as draft if new, then opens the exact public-facing render) or **Publish** (persists, then opens the publish confirmation modal).
   - **Edit** an existing question → same builder, pre-filled.
   - **Duplicate** → creates a `draft` copy titled "… (Copy)", appended to the end of the question order.
   - **Publish / Unpublish** toggle from the list (publish still goes through the confirmation modal; unpublish is immediate).
   - **Delete** → confirmation prompt, then the question and its options are removed.
5. Publishing makes the question immediately visible/answerable on the public poll — this is stated explicitly in the confirmation modal copy.

**Empty state:** No questions yet → "No questions yet — create the first one."
**Error state:** `[TBD]` — production must surface a safe error state for failed Firestore writes instead of a silent no-op.
**Auth requirement:** `[Production]` Must be an authenticated admin; enforced by both the route guard and Firestore security rules.

## Flow: Admin — Review Responses & Analytics

1. Admin opens **Responses** → sees a full table (response id, question, human-readable answer, session id, timestamp, source), filterable by question / source / question type, exportable as CSV.
2. Admin opens **Analytics** → sees participation/completion metrics, Kyn-vs-external split, completion funnel, rating distribution, and per-question option distribution, all computed from the same underlying response data as the Responses table (so the two screens never disagree).

**Empty state:** Zero responses → all metrics show 0/empty, not an error.
**Auth requirement:** `[Production]` Admin-only — raw individual responses must never be readable by non-admins (see `FIREBASE_SCHEMA.md`, "Aggregated Results" rule in `PRD.md`).
