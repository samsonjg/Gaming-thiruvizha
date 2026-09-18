# Analytics

## Status: instrumentation not yet wired

The events below are the catalogue implied by the approved product flows (`USER_FLOWS.md`, `PRD.md` §3 "Analytics Requirements" column) — **none of them are actually calling Firebase Analytics yet**. `services/analytics/analytics.ts` exists as the single abstraction every future `track()` call must go through (see `AI_CONTEXT.md` — never call the Firebase Analytics SDK directly from a component), but nothing in `pages/` or `features/` calls it yet. This is deliberate: event *names* are marked `[TBD]` in `PRD.md` §6 pending marketing/analytics stakeholder input, and wiring up placeholder names now would risk shipping a taxonomy nobody agreed to.

Treat this file as the plan for when that input arrives — update it and `services/analytics/analytics.ts`'s call sites together, per the "Future Requirement Change Protocol" in `AI_CONTEXT.md`.

## The abstraction

```ts
// services/analytics/analytics.ts
analytics.track('poll_started', { pollId, source })
```

Wraps `firebase/analytics`'s `logEvent`. No-ops safely (never throws) when `isFirebaseConfigured` is false or the browser doesn't support Analytics (`isSupported()`), so it's always safe to call from anywhere without a guard at the call site.

## Planned event catalogue

| Event Name `[TBD final naming]` | Trigger | Platform | Parameters | Purpose |
|---|---|---|---|---|
| `poll_started` | User taps "Start Poll" on the landing screen | Web/MWeb | `pollId`, `source` | Funnel entry point |
| `question_viewed` | A question becomes the active screen in the flow | Web/MWeb | `pollId`, `questionId`, `questionType`, `position` | Per-question funnel drop-off |
| `question_answered` | A question is successfully submitted | Web/MWeb | `pollId`, `questionId`, `questionType` | Completion signal per question — never the answer value itself (see "What not to send" below) |
| `poll_completed` | The completion screen renders | Web/MWeb | `pollId`, `source` | Funnel end point, matches `completionRate` shown in admin Analytics |
| `results_viewed` | The aggregated results screen renders | Web/MWeb | `pollId`, `questionId` | Engagement signal |

Admin-side screens (Dashboard, Question Builder, Responses, Analytics) are internal tooling — no analytics events are planned for them; they're for the team's own admin session, not a growth metric.

## What NOT to send

Per `PRD.md`'s "Aggregated Results" product rule and general privacy hygiene:
- Never send a user's actual answer (`optionIds`, `textValue`, `ratingValue`, `rankingOrder`) as an event parameter — that would leak individual response content into Firebase Analytics / any downstream BigQuery export, defeating the "public users never see another individual's answer" guarantee documented in `SECURITY.md` for a different but related reason (analytics exports are a real, easy-to-forget leak vector).
- Never send `sessionId`/uid as a raw analytics parameter beyond what Firebase Analytics itself already associates with the device/app-instance id.
- Never send free-text (the `text` question type's answer) to analytics under any circumstance.
