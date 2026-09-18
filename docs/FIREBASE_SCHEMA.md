# Firestore Schema

Database source of truth. Every collection actually used by the app is documented here — nothing speculative. See `firestore.rules` for the authorization that matches this schema, and `ARCHITECTURE.md` for how repositories map to these paths.

## Collection tree

```
events/{eventId}
polls/{pollId}
  questions/{questionId}
    options/{optionId}
  responses/{uid}_{questionId}
  questionStats/{questionId}
sessions/{uid}
adminUsers/{uid}
```

---

### `events/{eventId}`

**Purpose:** A Kyn event that has a poll attached (GT-EVENT-001).
**Document ID:** Firestore auto-id.

| Field | Type | Required | Nullable | Default | Notes |
|---|---|---|---|---|---|
| name | string | yes | no | — | |
| description | string | yes | no | — | |
| startDate | string (ISO date) | yes | no | — | |
| endDate | string (ISO date) | yes | no | — | |
| venue | string | yes | no | — | |
| location | string | yes | no | — | |
| categories | string[] | yes | no | `[]` | |
| imageUrl | string | no | yes | — | |
| kynEventId | string | yes | no | — | The real Kyn platform's event id, for cross-referencing |
| pollId | string | yes | no | — | Convenience pointer to the primary poll's doc id |
| status | `'draft' \| 'published' \| 'closed'` | yes | no | `'draft'` | |

**Who can read:** Anyone, if `status == 'published'`; admins, always.
**Who can write/update/delete:** Admins only.

---

### `polls/{pollId}`

**Purpose:** One poll under an event (GT-POLL-001).
**Document ID:** Firestore auto-id.

| Field | Type | Required | Notes |
|---|---|---|---|
| eventId | string | yes | FK to `events/{eventId}` |
| name | string | yes | |
| status | `'draft' \| 'published' \| 'closed'` | yes | |
| publicSlug | string | yes | Unique; used for `/poll/:slug` lookup (`where('publicSlug','==',slug)`) |
| flowMode | `'sequential' \| 'randomized'` | yes | Only `sequential` is implemented in the UI today |
| questionsPerScreen | number | yes | Only `1` is implemented in the UI today |

**Who can read:** Anyone, if `status == 'published'`; admins, always (including to preview a draft — see `ARCHITECTURE.md` "Routing" and `usePollBundle`'s comment on why status isn't re-checked client-side).
**Who can write:** Admins only.

---

### `polls/{pollId}/questions/{questionId}`

**Purpose:** One question in a poll's flow (GT-QUESTION-001..003).
**Document ID:** Firestore auto-id.

| Field | Type | Required | Notes |
|---|---|---|---|
| pollId | string | yes | Redundant with the path, kept so `Question` objects are self-contained once read |
| type | `QuestionType` (8 values — see `types/schema.ts`) | yes | |
| title | string | yes | |
| description | string | no | |
| required | boolean | yes | |
| order | number | yes | 1-based; drives both admin reorder and public flow sequence |
| status | `'draft' \| 'published' \| 'unpublished'` | yes | |
| settings.resultsVisible | boolean | yes | Whether this question's aggregate is the one shown on the public results screen |
| settings.randomizeOptions | boolean | yes | Not yet implemented in the public renderer — `[TBD]` |
| settings.ratingScale | `5 \| 10` | no | Only for `type: 'rating'` |

**Who can read:** Anyone, if `status == 'published'`; admins, always.
**Who can write:** Admins only.

---

### `polls/{pollId}/questions/{questionId}/options/{optionId}`

**Purpose:** One selectable option for an option-based question type.
**Document ID:** Firestore auto-id.

| Field | Type | Required | Notes |
|---|---|---|---|
| questionId | string | yes | Redundant with the path, same reasoning as above |
| label | string | yes | |
| emoji | string | no | |
| imageUrl | string | no | A URL string, not a Storage upload — see `SECURITY.md`/`ARCHITECTURE.md` on why Storage isn't used yet |
| order | number | yes | |
| active | boolean | yes | Inactive options are kept (not deleted) but excluded from the public renderer — `[TBD: is this actually filtered in the UI today? verify before relying on it]` |

**Who can read:** Anyone, if the parent question is `published` (one extra `get()` in the rule); admins, always.
**Who can write:** Admins only. Always written as a full replace (`setOptions`) — see `repositories/options.repository.ts`.

---

### `polls/{pollId}/responses/{uid}_{questionId}`

**Purpose:** One user's answer to one question (GT-RESPONSE-001..002). **Admin-only to read** — see `PRD.md`'s "Aggregated Results" product rule.
**Document ID:** `{uid}_{questionId}` — deterministic on purpose. This is the entire mechanism behind "one response per user per question": a second `submitAnswer` for the same (uid, questionId) targets the same document id, which Firestore evaluates as an `update` (not a `create`) once the doc exists, and `firestore.rules` disallows `update` entirely on this collection. See `SECURITY.md`.

| Field | Type | Required | Notes |
|---|---|---|---|
| pollId | string | yes | Must match the path's `{pollId}` (enforced by the rule) |
| questionId | string | yes | Must match the id-segment after `_` (enforced by the rule) |
| sessionId | string | yes | Equals the Firebase Anonymous Auth uid; must match `request.auth.uid` (enforced by the rule) |
| userId | string | no | Reserved for a future authenticated (non-anonymous) public user — not populated today |
| source | `'kyn' \| 'external'` | yes | Captured from the entry URL, see `PRD.md` "Kyn Traffic Attribution" |
| createdAt | string (ISO datetime) | yes | |
| answer.optionIds | string[] | no | For option-based types |
| answer.textValue | string | no | For `text` |
| answer.ratingValue | number | no | For `rating` |
| answer.rankingOrder | string[] | no | For `ranking` |

**Who can read:** Admins only (`get`/`list`).
**Who can create:** A signed-in user, writing only their own doc id, only for the `pollId` in the path. See `firestore.rules` for the exact condition.
**Who can update/delete:** Nobody — not even admins, via the client. See `firestore.rules` comment for why (no audit trail yet).

---

### `polls/{pollId}/questionStats/{questionId}`

**Purpose:** Public-readable aggregate counters — the ONLY response-derived data a public client ever reads. Written atomically in the same batch as a `responses` document `create` (see `repositories/responses.repository.ts`).
**Document ID:** same as the question id.

| Field | Type | Notes |
|---|---|---|
| optionCounts | `Record<optionId, number>` | Incremented via `increment(1)` on the dotted path `optionCounts.{optionId}` |
| ratingSum | number | Sum of all rating answers |
| ratingCount | number | Count of rating answers |
| totalResponses | number | Total answers to this question, any type |
| textCount | number | Count of text answers (the text itself is never in this doc) |

**Who can read:** Anyone.
**Who can write:** Any signed-in user (see the known-limitation note in `firestore.rules` and `SECURITY.md` — this is intentionally permissive for now, revisit if it becomes a real abuse vector).

---

### `sessions/{uid}`

**Purpose:** Optional lightweight capture of a public session's attribution (source/campaign/UTM params) for future cross-poll analytics. Not currently read by any admin screen (each response already carries its own `source`) — kept minimal, `[TBD]` whether this collection is worth its own admin UI later.
**Document ID:** the Firebase Anonymous Auth uid.

| Field | Type |
|---|---|
| source | `'kyn' \| 'external'` |
| campaign, utmSource, utmMedium, utmCampaign | string, optional |

**Who can read/write:** The owning uid only; admins can read.

---

### `adminUsers/{uid}`

**Purpose:** Display-only profile (name/email) for an admin user. **Never consulted by security rules** to decide who is an admin — that is always the `admin` custom claim (see `ADMIN_PANEL.md`). This collection existing or not existing has zero effect on authorization.
**Document ID:** the admin's Firebase Auth uid.

**Who can read:** The admin themselves, or another admin.
**Who can write:** Nobody via the app — set up manually alongside the custom-claim bootstrap.

---

## Indexes

`firestore.indexes.json` defines one composite index today: `questions` on `(status ASC, order ASC)`, required by `getPublishedQuestions()` (`repositories/questions.repository.ts`) — it combines an equality filter (`status == 'published'`) with an `orderBy('order')` on a different field, which Firestore does not auto-index. This surfaced as a real production bug (the public poll returned "not found" with no error surfaced to the user) before the index was deployed — see `git log` around 2026-09-18 and `docs/CHANGELOG.md`.

Every other query this app issues is either a single-field equality filter, a single `orderBy`, or multiple independent equality filters on a small subcollection — none of which need an explicit composite index. If you add a new query that combines `orderBy` with an equality or range filter on a *different* field, Firestore will refuse it at runtime with `failed-precondition` and a console link to the exact index to create — add it there, then copy the same field list into `firestore.indexes.json` (`npx firebase-tools firestore:indexes` prints the current deployed set) and `firebase deploy --only firestore:indexes` so it's captured for every future deploy, not just fixed once by hand in the console.

**Also note:** a `list`/query request (not a single `get`) is rejected outright unless Firestore can prove every possible result satisfies the security rule *from the query's own `where` clauses* — it does not re-check each rule branch against the live data the way a `get` does. If a rule is `resource.data.status == 'published' || isAdmin()`, a non-admin's query MUST include an explicit `where('status', '==', 'published')` (an admin's query is fine without it, since `isAdmin()` is request-scoped, not resource-scoped, and evaluates the same for every potential result). See `repositories/polls.repository.ts`'s `getPollBySlug` for the pattern.
