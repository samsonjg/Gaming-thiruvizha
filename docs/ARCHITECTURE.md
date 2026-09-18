# Architecture

Technical source of truth. See `PRD.md` for *what* the product does; this file is *how* it's built. Read `AI_CONTEXT.md` first if you haven't.

## Layering

```
UI (pages/, components/)
  ↓
hooks (hooks/, features/*/hooks)
  ↓
repositories (repositories/*.repository.ts)
  ↓
Firebase (services/firebase/app.ts)
```

A component never imports `firebase/*` directly, and never imports a `repositories/*` module for a **read** — it calls a hook, which calls a repository. Imperative **writes** triggered by a user action (submit an answer, save a form, publish a question) are called directly from an event handler via the repository module — that's the normal pattern here, not a violation of the layering (see `pages/public/PollPage.tsx`'s `handleSubmit`, `pages/admin/QuestionBuilder.tsx`'s `persist`).

## Folder structure

```
src/
├── app/
│   ├── App.tsx              Provider shell (Router, AuthProvider) — no route knowledge
│   ├── router.tsx            The single route tree; admin pages are React.lazy-loaded
│   └── providers/
│       └── AuthProvider.tsx  Firebase auth state, anonymous session bootstrap, admin sign-in
│
├── components/
│   ├── ui/                   Generic design-system primitives (Button, Input, Modal, Badge,
│   │                         LoadingState/ErrorState/EmptyState, …) — no business logic
│   ├── common/                Shared but product-specific visuals (ProgressIndicator, ResultBar,
│   │                         AnimatedCounter, QuestionCard) used by both public and admin
│   └── layout/                 AdminLayout (sidebar shell)
│
├── features/
│   ├── questions/              The reusable question engine — see "Question engine" below
│   ├── auth/                   RequireAdmin route guard, AdminLoginForm
│   └── admin/                  PublishModal (shared across admin question screens)
│
├── pages/
│   ├── public/                 KynEventPage, PollPage (+ PollLanding/Flow/Results/Complete)
│   └── admin/                  One file per admin route (Dashboard, Events, EventForm, Polls,
│                               Questions, QuestionBuilder, QuestionPreview, Responses,
│                               Analytics, Settings)
│
├── hooks/                       Domain hooks wrapping repositories: useAsync (shared primitive),
│                               useEvents, usePolls (+ useActivePoll), useQuestions, useOptions,
│                               useAnalytics, useSession, usePollBundle
│
├── repositories/                One file per entity (events/polls/questions/options/responses/
│                               stats), all Firestore-backed, all async, all returning plain
│                               TypeScript types from types/schema.ts — never a Firestore
│                               DocumentSnapshot leaking upward. _firestore.ts holds the shared
│                               requireDb()/withId() helpers.
│
├── services/
│   └── firebase/app.ts          The ONLY initializeApp() call — exports auth/db singletons
│
├── types/schema.ts               Every domain type (Event, Poll, Question, QuestionOption,
│                               Response, ResponseAnswer, UserSession, AnswerValue), platform-
│                               and backend-agnostic
│
├── constants/                    questionTypeMeta.ts (the question-type registry), demoIds.ts,
│                               routes.ts
│
├── config/firebaseConfig.ts       Reads VITE_FIREBASE_* env vars; exposes isFirebaseConfigured
│
└── utils/                        Small pure helpers (csv export, date formatting, validation)
```

## Question engine

The single most important reusable asset in this codebase. `features/questions/QuestionRenderer.tsx` dispatches on `question.type` to one of eight components (`SingleChoiceQuestion`, `MultipleChoiceQuestion`, `RatingQuestion`, `EmojiQuestion`, `YesNoQuestion`, `TextQuestion`, `ImageChoiceQuestion`, `RankingQuestion`). Every one of them is a **controlled component** sharing the exact same prop contract (`features/questions/types.ts`):

```ts
{ question: Question; options: QuestionOption[]; value: AnswerValue | null; onChange: (v: AnswerValue) => void; disabled?: boolean }
```

Two places render this: the public poll flow (`pages/public/PollFlow.tsx`) and the admin "Preview" screen (`pages/admin/QuestionPreview.tsx`) — **the same component**, not a lookalike. If they ever diverge, that's a bug (see `AI_CONTEXT.md` do-not-break rule #2), not a feature.

Adding a ninth question type: one new component in `features/questions/`, one `case` in `QuestionRenderer`, one entry in `constants/questionTypeMeta.ts` (`QUESTION_TYPE_META`, which also drives the admin's type dropdown and the "does this type have options" branching). Nothing else in the app needs to change.

## Routing

`app/router.tsx` is the single route tree. Public routes (`/`, `/poll/:slug`) are eagerly loaded — they're what a first-time visitor from a Kyn event page hits, so they should be fast. Every `/admin/*` route is behind `React.lazy` + `RequireAdmin`, so a public poll visitor's bundle never includes the admin UI, drag-and-drop reordering, or chart code (see "Performance" below).

`RequireAdmin` (`features/auth/RequireAdmin.tsx`) is a **UX** guard: it shows a login form if the current Firebase user doesn't carry the `admin` custom claim. It is not the security boundary — `firestore.rules` is (see `SECURITY.md`). Don't ever reason "the route is protected, so the data is safe."

## State management

Deliberately minimal, matching the approved prototype:
- **Server state** (events/polls/questions/responses/analytics): `hooks/useAsync.ts` — a tiny `{data, loading, error, reload}` wrapper around a repository call. No react-query/SWR; the app's read patterns are simple enough not to need one (see `PRD.md` for why this hasn't been revisited).
- **Auth state**: one `AuthProvider` (`app/providers/AuthProvider.tsx`) via React Context, consumed through `useAuthState()`.
- **UI state / form state**: local `useState` in the owning component. No Redux/Zustand — nothing in this app is shared across enough of the tree to need it.

## Performance

- Admin routes are code-split (see Routing above).
- Firestore reads are scoped to what's needed: the public poll flow only ever reads the `questionStats` counters doc for aggregates, never the raw `responses` collection (see `FIREBASE_SCHEMA.md`) — this is a security requirement that happens to also be a performance win (O(1) doc read instead of scanning every response).
- No realtime listeners (`onSnapshot`) are used anywhere yet — every read is a one-shot `getDocs`/`getDoc`. `[TBD]` if a future requirement needs live-updating admin views (e.g. a live results screen during an event), that would be the first place to introduce `onSnapshot`, scoped narrowly.
- Known bundle-size note: the Firebase SDK (`auth` + `firestore` + `analytics`) is in the main chunk because `AuthProvider` wraps the entire app (public users need anonymous auth too). This is expected, not a regression to "fix" — don't remove Firebase from the public bundle without changing how public duplicate-response prevention and result aggregation work.

## Platform support

Web and mobile web are implemented and tested (375–412px mobile widths, 1280px+ admin desktop). No native Android/iOS app exists. The layering above (UI never touches Firebase directly, all business logic in repositories/hooks) is what would let a Capacitor or React Native shell reuse `repositories/` and `hooks/` largely as-is later — but that has not been built or verified, and shouldn't be assumed to work without dedicated testing when it's actually attempted.
