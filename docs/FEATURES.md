# Feature Requirements

Detailed requirements per feature. See `PRD.md` §3 for the feature inventory table and §5 for stable requirement IDs referenced below. Update the matching section in place when a requirement changes.

## Public Poll Flow (GT-POLL-001, GT-POLL-002, GT-QUESTION-001..003, GT-RESPONSE-001..002, GT-RESULTS-001)

**Functional Requirements**
- Resolve a poll by its public slug; load its parent event and published questions/options.
- Render one published question per screen, in `order`, with a progress indicator.
- Accept an answer per the question's type-specific shape (see below), validate it, allow submission, persist it, advance.
- Show aggregated results for the `resultsVisible` question(s) after the last question.
- Show a completion screen with CTAs back to the event.

**Business Rules**
- Only `published` polls/questions are shown; only `published` + `active` options are offered.
- A question marked `required: false` can be submitted with no answer.
- A session may answer a given question at most once (GT-RESPONSE-001).
- Every response records `source` (`kyn`/`external`) from the session (GT-RESPONSE-002).

**UI Requirements**
- Mobile-first, verified at 375/390/412px, no horizontal scroll.
- Large tappable option cards, animated selection state, animated progress bar, animated result bars, animated completion screen.
- No full-page reload between questions.

**Data Requirements** — see `FIREBASE_SCHEMA.md` for the `Question`/`QuestionOption`/`Response`/`ResponseAnswer` shapes per type:
- `single_choice`/`emoji`/`image_choice`/`yes_no` → exactly one `optionId`.
- `multiple_choice` → one or more `optionId`s.
- `rating` → an integer 1..`ratingScale` (5 or 10).
- `text` → a string (trimmed, non-empty if required).
- `ranking` → an ordered list of all option ids.

**Validation Rules**
- Required question: answer must satisfy the type's "valid" predicate (`isAnswerValid`, see `components/questions/QuestionRenderer.tsx` equivalent in the new architecture) before Submit is enabled.
- Optional question: any answer state is acceptable, including none.

**Error Handling**
- Poll/event not found → not-found message, no crash.
- `[Production]` Failed write (network/permission) → inline retry-safe error, answer state preserved client-side until it succeeds.

**Analytics Requirements** — `[TBD names, see PRD §6]`: poll started, question viewed, question answered (type), poll completed.

**Admin Requirements** — none (this is the public-facing feature); its content is entirely admin-authored (see Question Management below).

**Security Requirements**
- Prototype: none (localStorage, single browser).
- Production: anonymous users can only `create` their own response document, never read others' raw responses, never modify/delete any response (see `SECURITY.md`).

## Admin — Event / Poll / Question Management (GT-ADMIN-001..004)

**Functional Requirements**
- CRUD `Event`, `Poll`, `Question`, `QuestionOption`.
- Reorder questions within a poll (drag-and-drop, persists `order`).
- Duplicate a poll (with its questions/options) or a question (with its options).
- Publish/unpublish a poll or question; publishing a question requires confirming a modal.
- Preview a question using the exact public-rendering component (GT-ADMIN-003) — never a separate mock.

**Business Rules**
- Publishing a question makes it immediately live on the public poll (stated in the confirm-modal copy — this is intentional, not a bug).
- Duplicating resets status to `draft` so a copy never accidentally goes live.

**UI Requirements**
- Desktop-first (1280px+), clean/neutral styling (deliberately not festival-themed — admin ≠ public).
- Every navigation control is a single interactive element (no `<button>` nested inside `<a>`/`<Link>` — this caused real click-handling bugs during prototype QA; keep using `LinkButton`/`Link`, never wrap a `Button` in a `Link`).

**Data Requirements** — see `FIREBASE_SCHEMA.md`.

**Validation Rules**
- Question title required to save/preview/publish.
- `[Production hardening]` add max-length limits, required-field messaging, and option-count minimums per type (e.g. at least 2 options for choice-based types) — not enforced yet, tracked as `[TBD]` until confirmed with product.

**Error Handling**
- `[Production]` Failed writes must show a toast/inline error and not silently discard the admin's edits.
- Never surface a raw Firebase error string to the admin (see `SECURITY.md` §"User-facing error copy").

**Analytics Requirements** — none (internal tool).

**Admin Requirements** — this *is* the admin surface.

**Security Requirements**
- `[Production]` Every admin route and every admin write must be gated by an authenticated user with the `admin` custom claim, enforced by Firestore security rules — the UI hiding the `/admin` nav is not itself a security control.

## Admin — Responses & Analytics (GT-ADMIN-005, GT-ANALYTICS-001)

**Functional Requirements**
- Tabular view of individual responses with human-readable answers (option labels resolved, not raw ids), filterable by question/source/question type, CSV-exportable.
- Aggregate dashboard: participants, total responses, completion rate, active questions, response trend, completion funnel, question performance, top answers, Kyn-vs-external split, rating distribution, option distribution.

**Business Rules**
- Individual responses are visible to admins only (GT-RESULTS-001's flip side) — the public results screen and the admin Responses table read from different data (public: aggregate counters; admin: raw responses) once on Firestore, see `FIREBASE_SCHEMA.md`.

**Data Requirements** — reads across `Response`, `ResponseAnswer`, `Question`, `QuestionOption`.

**Error Handling** — empty state (zeros), not an error, when no responses exist yet.

**Analytics Requirements** — this feature *reports* analytics; it does not itself emit tracking events.

**Security Requirements** — admin-only, same as above.
