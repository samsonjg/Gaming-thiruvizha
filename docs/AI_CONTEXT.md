# AI Context — Read This First

Read in this order before touching code: `AI_CONTEXT.md` (this file) → `PRD.md` → `ARCHITECTURE.md`. Then find the relevant requirement ID and feature section in `PRD.md`/`FEATURES.md` before changing anything.

## Project purpose

Gaming Thiruvizha Poll is a **reusable** Kyn event poll/engagement platform. Gaming Thiruvizha 2026 is the first event using it, not a special case hardcoded into the app — the data model has no Gaming-Thiruvizha-specific fields anywhere (see `types/schema.ts`); all event-specific content is data (Firestore documents / prototype seed data), never code.

## Architecture (summary — full detail in `ARCHITECTURE.md`)

```
UI (pages/components) → hooks (features/*) → repositories (repositories/*) → Firebase (services/firebase)
```

- **Never call Firebase directly from a component.** Every read/write goes through a `repositories/*.repository.ts` function with a stable signature; components call a `hooks/*` wrapper, never `firestore` APIs directly.
- **The question engine is the core reusable asset.** `features/questions/` has one component per question type (`SingleChoiceQuestion`, `MultipleChoiceQuestion`, `RatingQuestion`, `EmojiQuestion`, `YesNoQuestion`, `TextQuestion`, `ImageChoiceQuestion`, `RankingQuestion`) behind `QuestionRenderer`, dispatching on `question.type`. The **same components** render in the public poll flow and in the admin "Preview" screen — never duplicate this rendering logic into a second "admin preview" implementation.
- Adding a new question type = one new component + one switch case in `QuestionRenderer` + one entry in `QUESTION_TYPE_META` (`constants/questionTypeMeta.ts`). Nothing else changes.

## Important business rules (see `PRD.md` §5 for the full requirement-ID list)

- Only `published` events/polls/questions are visible to public users (GT-POLL-002, GT-QUESTION-001).
- One response per (user, question) — enforced **server-side**, not just in the UI (GT-RESPONSE-001; see `SECURITY.md`).
- Public users never read another user's individual response, only aggregate counts (GT-RESULTS-001). Public reads hit a `questionStats` counters document; raw `responses` are admin-only.
- Admin authorization is a Firebase custom claim (`admin: true`) checked by Firestore security rules — the `/admin` route guard in the app is a UX nicety, **not** the actual security boundary. Never add a frontend-only admin check (no hardcoded password, ever).

## Firebase architecture

- **Auth:** Anonymous auth for public users (identifies a session/uid without a login screen); email/password for admins.
- **Firestore:** see `FIREBASE_SCHEMA.md` for the full collection list and field-level schema.
- **Storage:** not used yet — question options use plain image URL strings, not uploads. `[TBD]` if that changes.
- **Analytics:** `services/analytics/analytics.ts` wraps Firebase Analytics `logEvent`; nothing calls the SDK directly outside that file. Event catalogue in `ANALYTICS.md`.
- **Cloud Functions:** none deployed. Not needed for the current feature set — don't add one without updating this file and `SECURITY.md` to explain why.

## Data model quick reference

`events` → `polls` (subcollection or top-level with `eventId` FK, see `FIREBASE_SCHEMA.md` for the final decision) → `questions` → `options`; plus `responses` (admin-only, immutable) and `questionStats` (public-readable counters). Full field list: `FIREBASE_SCHEMA.md`.

## Important dependencies

- `firebase` — the only backend SDK. Don't add `firebase-admin` to the frontend bundle.
- `react-router-dom` — routing, including the admin route guard.
- `framer-motion` — all animation (progress bar, option selection, transitions, result bars, counters). Don't add a second animation library.
- `@dnd-kit/*` — drag-and-drop question reordering (admin) and the ranking question type (public).
- Deliberately **not** used: Redux/Zustand (React Context + hooks is enough for this app's state), a data-fetching library like react-query (Firestore's own listeners/hooks cover it), a UI kit (the design system in `components/ui` is small and bespoke on purpose).

## Development commands

See `DEVELOPMENT.md` for full setup. Short version: `npm install`, `npm run dev`, `npm run lint`, `npm run build`.

## Deployment

See `DEPLOYMENT.md`. Firebase Hosting is the assumed target unless the project's actual hosting configuration says otherwise — check before assuming.

## Known limitations (as of this migration)

- No native Android/iOS app exists yet; the architecture is structured to allow one later without duplicating business logic, but nothing native has been built or tested.
- No Cloud Functions, Storage, or App Check — intentionally out of scope until a real need appears (see `SECURITY.md`).
- Admin roles are flat (`admin: true`/absent) — no per-event scoping or role tiers yet (`PRD.md` §6).
- Analytics event names are provisional (`[TBD]` in `PRD.md`/`ANALYTICS.md`) pending stakeholder input.

## Do-not-break rules

1. Don't call Firestore/Auth SDK functions from inside a component or page — always go through a repository + hook.
2. Don't duplicate the question-rendering logic for admin preview — it must render through the same `QuestionRenderer` used publicly.
3. Don't add a frontend-only admin check of any kind. Admin authorization is a custom claim checked by security rules.
4. Don't let public clients read the raw `responses` collection — only the `questionStats` aggregate.
5. Don't wrap a `Button` inside a `Link`/`<a>` — use `LinkButton` (a single interactive element). This exact bug broke admin navigation once already.
6. Don't invent product behavior. If a requirement is ambiguous, mark it `[TBD]` in `PRD.md` rather than guessing.
7. When a requirement changes, update the existing entry in `PRD.md`/`FEATURES.md` (by its ID) — never create a duplicate requirement.
8. Every meaningful change gets a `docs/CHANGELOG.md` entry.
