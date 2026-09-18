# Product Requirements Document — Gaming Thiruvizha Event Engagement Platform

Status: Living document. Source of truth for product behavior. Update this file — do not create a duplicate — whenever a requirement changes.

## 1. Product Overview

- **Product name:** Kyn Event Poll & Engagement Platform (internally: "Gaming Thiruvizha Poll")
- **Product purpose:** Let Kyn event attendees answer a short, branded poll about an event (starting with Gaming Thiruvizha 2026) from the Kyn event page, and let the Kyn events/marketing team create, publish and analyze that poll without engineering involvement.
- **Target platforms:** Web, Mobile Web. Architecture is kept platform-agnostic (business logic outside UI components) so a native Android/iOS wrapper can reuse it later — no native app exists yet. `[TBD]`
- **Primary user types:** Public Kyn user (poll respondent), Admin (event/marketing team member).
- **Core user experience:** A public user taps "Participate in Poll" from the Kyn event page → answers a short sequence of questions, one per screen, with a progress bar → sees aggregated results → sees a branded completion screen. An admin manages events, polls, questions (of several types) and views responses/analytics from a separate `/admin` portal.
- **Core business objective:** Increase event engagement and collect structured audience sentiment/interest data ahead of and during Kyn events, attributable to Kyn traffic vs. external traffic.
- **Major product areas:**
  1. Public poll experience (`/poll/:slug`)
  2. Reusable question engine (8 question types)
  3. Admin portal (`/admin`) — event, poll and question management
  4. Response collection and duplicate-prevention
  5. Analytics (participation, completion funnel, option distribution, Kyn vs external source)

## 2. User Types

### Public User
- Who: Anyone who opens a poll link, typically from the Kyn app/event page (`source=kyn`) or a shared link (`source=external`).
- Sees: The poll landing screen, one question at a time, aggregated results after completing the poll, a branded completion screen.
- Can do: Answer each published question once, view aggregate results, navigate to "Explore Gaming Thiruvizha" / "View Event Details" from the completion screen.
- Data access: Can only write their own answers. Cannot read other users' individual answers — only aggregate counts/percentages per question.
- Identity: Anonymous. Identified by a per-browser session id (prototype: localStorage; production: Firebase Anonymous Auth UID — see `ARCHITECTURE.md`).

### Admin
- Who: A member of the Kyn events/marketing/product team managing poll content.
- Sees: `/admin` dashboard, full event/poll/question management UI, the raw response table, full analytics.
- Can do: Create/edit/delete events, polls and questions; reorder questions; publish/unpublish questions and polls; preview a question exactly as the public will see it; export responses as CSV; view analytics.
- Data access: Can read all events/polls/questions/options/responses for events they administer. `[TBD: multiple admin roles / per-event admin scoping — current prototype has a single flat admin role.]`
- Identity: Authenticated (production: Firebase Auth + `admin` custom claim; prototype: no login, `/admin` is open).

## 3. Feature Inventory

| Feature | Purpose | User | Entry Point | Expected Behaviour | Data Required | Success Condition | Failure Condition | Admin Dependency | Analytics Events | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| Event Discovery (stand-in Kyn event page) | Let a user reach the poll from an event context | Public | `/` (stand-in for the real Kyn event page) | Shows event summary + "Participate in Poll" CTA | Published `Event` | User reaches poll landing | Event not found → not-found state | Event must exist and be `published` | `poll_cta_clicked` `[TBD name]` | Production-track (real entry point is inside the Kyn app, out of this repo's scope) |
| Poll Landing | Introduce the poll before committing | Public | `/poll/:slug` | Shows event name, dates, venue, "Start Poll" CTA | Published `Poll` + parent `Event` | User taps Start Poll | Poll not found / unpublished → not-found state | Poll + Event must both be `published` | `poll_started` | Implemented |
| Question Flow | Collect one answer per published question, sequentially, one per screen | Public | Inside `/poll/:slug` after Start | Shows question `n` of `total` with progress bar; submit enabled once answer is valid; advances without full page reload; already-answered questions show a locked message + Continue | Published `Question`s ordered by `order`, their `QuestionOption`s | All required questions answered or explicitly skippable (`required: false`) | Network/write failure → inline error, answer not lost | Admin controls which questions are published, their order, and per-question required/results-visible settings | `question_viewed`, `question_answered` (with `questionId`, `type`) | Implemented |
| Duplicate Response Prevention | One answer per question per user | Public / System | Automatic, on every submit | A user who already answered a question cannot submit again for it | `sessionId`/`uid` + `pollId` + `questionId` | Second submit attempt is rejected/blocked before it reaches storage | N/A | None | None | Implemented (client-enforced in prototype; **must** become server-enforced in production — see `SECURITY.md`) |
| Aggregated Results | Show poll sentiment without exposing individual answers | Public | End of question flow | Animated horizontal bars, top options + "Others" bucket | Per-option counts for the headline question | Bars render with correct percentages | No responses yet → empty/zero state `[TBD exact copy]` | Admin sets which question's results are shown here (`resultsVisible`) | `results_viewed` `[TBD]` | Implemented |
| Poll Completion | Confirm participation, drive back to the event | Public | After results, "Continue" | Success illustration, "poll completed / responses recorded" confirmation, CTAs back to the event | None beyond the `Event` for venue/date | User sees the screen | N/A | None | `poll_completed` | Implemented |
| Admin Dashboard | At-a-glance poll health | Admin | `/admin` | Metric cards (participants, responses, completion rate, active questions), response trend, funnel, question performance, top answers | Aggregated `Response`/`ResponseAnswer` data for the poll | Numbers match underlying data | No data yet → zeros, not an error | N/A | None (internal view) | Implemented |
| Event Management | CRUD Kyn events that have a poll attached | Admin | `/admin/events` | List, create, edit event fields (name, description, dates, venue, location, image, Kyn event id, poll id, status) | `Event` | Saved event reflected everywhere it's read | Invalid/missing required fields → inline validation `[hardened in production pass]` | N/A | None | Implemented |
| Poll Management | CRUD polls under an event, publish control, shareable link | Admin | `/admin/polls` | List with question/response counts, Edit/Duplicate/Publish/Unpublish/Delete, copy public link, open preview | `Poll` | Poll status change reflected instantly for public users | N/A | N/A | None | Implemented |
| Question Management | CRUD questions under a poll, reordering | Admin | `/admin/polls/:pollId/questions` | List with type/status/response count, drag-to-reorder, Edit/Preview/Duplicate/Unpublish/Delete | `Question` + `QuestionOption`s | Reorder/status changes persist and reflect publicly once published | N/A | N/A | None | Implemented |
| Question Builder | Create/edit a question of any of the 8 types | Admin | `/admin/polls/:pollId/questions/new` or `/:questionId` | Title/description, type dropdown, required toggle, options editor (label/emoji/image/active) for option-based types, settings (results visibility, randomize), Save Draft / Preview / Publish | `Question`, `QuestionOption[]` | Question persists with correct shape for its type | Empty title blocks save `[hardened validation TBD in production pass]` | N/A | None | Implemented |
| Question Preview | See the exact public rendering before publishing | Admin | "Preview" from builder or list | Renders the same `QuestionRenderer` component used publicly, read-only | The question + its options | Visual match with public poll guaranteed by shared component | N/A | N/A | None | Implemented |
| Publish Confirmation | Prevent accidental publish of a question | Admin | Publish action | Modal: "Publish this question? Users will be able to see and respond to this question immediately." Cancel / Publish | N/A | Status becomes `published` | N/A | N/A | None | Implemented |
| Responses Table | Inspect individual responses for QA/support | Admin | `/admin/responses` | Table with filters (question, source, question type), human-readable answers, CSV export | `Response` + `ResponseAnswer` + `Question`/`QuestionOption` for label lookup | Table and CSV match filters | No responses → empty state | N/A | None | Implemented |
| Analytics | Understand poll performance and traffic source mix | Admin | `/admin/analytics` | Participants, unique respondents, total responses, completion rate, average rating, most selected option, Kyn vs external split, completion funnel, rating distribution, per-question option distribution | Aggregated `Response`/`ResponseAnswer` data | Numbers match underlying data | No data yet → zeros | N/A | None | Implemented |
| Kyn Traffic Attribution | Distinguish Kyn app traffic from externally shared links | System | Poll URL query params | `?source=kyn` (or `external`), plus `utm_source`/`utm_medium`/`utm_campaign`/`campaign`/`user_id`/`event_id` captured into the session and stamped on every response | URL query params | `source` correctly recorded on every response from that session | Missing params → defaults to `external` | Visible in admin Analytics as Kyn vs External % | None (attribution is passive) | Implemented |

## 4. Product Rules vs Technical Implementation

Kept separate deliberately — see each feature's rule below, and `ARCHITECTURE.md` / `FIREBASE_SCHEMA.md` for the corresponding technical implementation, so the technical implementation can change without silently changing product behavior.

- **Product Rule:** Only published events/polls/questions are visible to public users.
  **Technical Implementation:** prototype — `dataService` filters by `status`; production — Firestore query/security rule filters by `status == 'published'`.
- **Product Rule:** A user can answer a given question at most once.
  **Technical Implementation:** prototype — `dataService.hasResponded()` check before write; production — deterministic Firestore document id + security rule, see `SECURITY.md`.
- **Product Rule:** Public users never see another individual's answer, only aggregates.
  **Technical Implementation:** prototype — aggregation computed client-side over all local responses (acceptable only because there is no other real user); production — a separate public-readable counters document, raw responses admin-only. See `FIREBASE_SCHEMA.md`.
- **Product Rule:** Admin actions require authentication; only admins can manage content.
  **Technical Implementation:** prototype — none (explicitly open, prototype-only); production — Firebase Auth + `admin` custom claim enforced by security rules, not just UI hiding. See `ADMIN_PANEL.md`.

## 5. Requirement IDs

Stable IDs for future reference. Update the matching entry in place when a requirement changes — never duplicate an ID.

| ID | Requirement |
|---|---|
| GT-EVENT-001 | Public users can view a published event's summary (name, dates, venue, description) and reach its poll. |
| GT-POLL-001 | A poll belongs to exactly one event and has a unique public slug used at `/poll/:slug`. |
| GT-POLL-002 | Only `published` polls (with a `published` parent event) are reachable/answerable by public users. |
| GT-QUESTION-001 | A poll is an ordered sequence of questions; only `published` questions appear in the public flow. |
| GT-QUESTION-002 | Supported question types: single choice, multiple choice, rating (1–5 or 1–10), emoji reaction, yes/no, text, image choice, ranking. |
| GT-QUESTION-003 | A question may be marked `required` (must be answered to proceed) or optional (may be skipped). |
| GT-RESPONSE-001 | A given anonymous user (session/uid) may submit at most one response per question. |
| GT-RESPONSE-002 | Every response is stamped with its traffic `source` (`kyn` or `external`) captured from the entry URL. |
| GT-RESULTS-001 | Aggregated results (percent + count per option) are shown after the flow completes, for the question(s) the admin marks `resultsVisible`. Individual responses are never exposed to public users. |
| GT-ADMIN-001 | Admin users can create, edit, publish/unpublish and delete events, polls and questions. |
| GT-ADMIN-002 | Admin users can reorder questions within a poll. |
| GT-ADMIN-003 | Admin users can preview a question using the exact component the public poll renders. |
| GT-ADMIN-004 | Publishing a question requires an explicit confirmation step. |
| GT-ADMIN-005 | Admin users can view individual responses (filterable) and export them as CSV. |
| GT-ANALYTICS-001 | Admin users can view participation, completion-funnel and option-distribution analytics, including a Kyn-vs-external traffic breakdown. |
| GT-AUTH-001 | `[Production]` Admin routes and admin-only data require Firebase Authentication plus an `admin` custom claim, enforced server-side by Firestore security rules — never by frontend checks alone. |
| GT-AUTH-002 | `[Production]` Public users are identified by a Firebase Anonymous Auth UID, created transparently on first visit. |

## 6. Open Questions (`[TBD]`)

- Multiple admin roles / per-event admin scoping — currently a single flat "admin" role.
- Exact analytics event names/taxonomy beyond what's inferable from the UI (marked `[TBD]` above) — needs input from marketing/analytics stakeholders before `ANALYTICS.md` event names are finalized as tracking is actually wired to Firebase Analytics.
- Whether/how a native Android/iOS shell will be built, and on what timeline.
- Real Kyn event-page integration point (this repo only ships a stand-in event page to demonstrate the `Participate in Poll` deep link contract).
- Exact validation copy/rules for admin forms beyond "required fields must be non-empty" (e.g. max lengths, allowed characters) — currently minimal in the prototype, to be tightened in the hardening pass without inventing business rules.
