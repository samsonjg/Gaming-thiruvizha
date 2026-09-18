# Security

## The authorization boundary is `firestore.rules` — nowhere else

Every screen in this app that looks "protected" (the `/admin` route guard, a disabled button, a hidden nav item) is a UX convenience. The actual enforcement is entirely in `firestore.rules`, evaluated by Firestore itself on every read and write, independent of what the client-side JavaScript does or doesn't check. This is a hard rule, not a preference — see `AI_CONTEXT.md` do-not-break rule #3.

Concretely:
- `features/auth/RequireAdmin.tsx` hides `/admin` from non-admins. If someone opened the browser console and called the Firestore SDK directly, bypassing the React app entirely, `firestore.rules`' `isAdmin()` check is what would still stop them from reading `polls/{pollId}/responses`.
- The public poll's "already answered" guard (`hasResponded` check before submit) is a fast client-side UX short-circuit. The actual guarantee — one response per user per question — comes from the Firestore document id scheme (`{uid}_{questionId}`) plus a rule that disallows `update` on that collection, so a *second* write to the same id (a duplicate vote) is rejected by Firestore regardless of what the client attempted. See `FIREBASE_SCHEMA.md`.

## Admin authorization: custom claims, not passwords or documents

See `ADMIN_PANEL.md` for the full mechanism. Two things this app will **never** do:
- Check a password against a hardcoded value or an environment variable anywhere in the frontend bundle.
- Decide "is this user an admin?" by reading a Firestore document (e.g. "does a doc exist at `admins/{uid}`?") — a document's existence is data, readable by design in ways that are hard to fully lock down, and far too easy to accidentally make self-service. Authorization is always the `admin` custom claim on the Firebase Auth ID token, set only by a script run with the Admin SDK outside the app.

## Public user identity

Public users are Firebase Anonymous Auth sessions, created transparently on first visit (`app/providers/AuthProvider.tsx`). This uid is what `firestore.rules` uses to enforce "one response per question" — it is not a real account, carries no password, and a user who clears their browser storage gets a new uid (and can re-answer questions the old session already answered — the current product accepts this; `[TBD]` if that's undesirable, the fix is a real login for public users, which is a bigger product change, not a bug fix).

## Known residual risks (not hidden)

- **`questionStats` counters can be written by any signed-in user, not just via the intended `submitAnswer` flow.** Firestore rules can't cheaply verify "this write is exactly `increment(1))` on the right field" without a Cloud Function owning the write. A malicious anonymous client could in principle call the Firestore SDK directly and corrupt a poll's displayed percentages. Accepted for now because the blast radius is a display-only aggregate (no financial, PII, or security impact) — revisit with a Cloud Function that owns all writes to this collection if that risk profile changes (e.g. Gaming Thiruvizha results start being used for a public leaderboard or prize).
- **No rate limiting.** Nothing stops a script from creating many anonymous sessions and submitting many responses. Firebase App Check (mentioned in the task brief) would mitigate this but hasn't been enabled — see `ARCHITECTURE.md`/`AI_CONTEXT.md` "No Cloud Functions, no Storage, no App Check in this pass." Add if abuse is actually observed.
- **No password reset flow in the admin login UI.** Use the Firebase console to reset an admin's password today (`ADMIN_PANEL.md`).
- **Responses are immutable, including for admins, via the client.** There's no "correct a bad response" or "delete a spam response" admin tool yet. If that's needed, it should go through a Cloud Function (for an audit trail) rather than opening `update`/`delete` to the client — don't "fix" this by loosening `firestore.rules`.

## User-facing error copy

Never show a raw Firebase/SDK error to a user — no `FirebaseError: permission-denied` in any UI. Two patterns already in the codebase to follow:
- `components/ui/Feedback.tsx`'s `ErrorState` takes a generic, user-safe `message` prop — pass a short plain-English sentence, not `error.message`.
- `features/auth/AdminLoginForm.tsx` catches the Firebase Auth error and always shows "Invalid email or password." regardless of the actual failure reason (wrong password, user not found, etc.) — this also avoids leaking whether a given email has an account, a minor but real information-disclosure concern.

Log the real error for debugging (console in dev; see `DEVELOPMENT.md`) but never a password, token, or other credential — see `AI_CONTEXT.md` "Observability."

## Input validation

Admin forms validate required fields today (a question needs a title to save). Length limits, character restrictions, and option-count minimums are `[TBD]` — see `FEATURES.md` "Question Builder" validation rules and `PRD.md` §6. Client-side validation is a UX nicety; it is never a substitute for what `firestore.rules` allows to be written, and rules should eventually validate document shape too (`[TBD]`, not yet implemented — rules today check *who* can write, not *what* they write, beyond the response doc's id/field-matching checks in `firestore.rules`).

## Firebase web config is not a secret

The `VITE_FIREBASE_*` values in `.env.local` (API key, project id, etc.) are safe to ship to the browser — this is standard for Firebase web apps and is explicitly by design; real authorization is `firestore.rules`, not obscurity of this config. Do not confuse this with the Admin SDK service account key used once in `ADMIN_PANEL.md`'s bootstrap script, which **is** a real secret and must never be committed.
