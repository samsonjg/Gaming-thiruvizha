# Admin Panel

## Admin login

`/admin` is guarded by `features/auth/RequireAdmin.tsx`. A visitor who isn't recognized as an admin sees `features/auth/AdminLoginForm.tsx` — email + password only. There is no signup screen and no "forgot password" flow yet (`[TBD]`; Firebase Auth supports password reset out of the box, just not wired into this UI). Use the Firebase console to reset a password for now.

## Admin authentication — exactly how it works

```
Firebase Authentication (email/password)
        ↓
Signed-in user, ID token includes custom claims
        ↓
{ admin: true } custom claim  ←  set manually, see "Bootstrapping" below
        ↓
firestore.rules' isAdmin() reads request.auth.token.admin
        ↓
Reads/writes to admin-only data succeed or are rejected
```

Two independent checks happen for every `/admin` page load:
1. **Client-side (UX only):** `AuthProvider` reads the current user's ID token and checks `claims.admin === true`, exposed as `isAdmin` from `useAuthState()`. `RequireAdmin` uses this to decide whether to show the login form or the admin UI.
2. **Server-side (the real boundary):** every Firestore read/write the admin UI makes is evaluated against `firestore.rules`' `isAdmin()`, which reads the exact same custom claim from the request's auth token — independently of what the client UI decided to show. If someone bypassed the UI entirely and called the Firestore SDK directly, step 2 is what actually stops them.

**There is no password check anywhere in the application code.** Firebase Authentication owns credential verification entirely; this app never sees or stores a password.

## Roles

Currently a single flat role: a user either has `admin: true` or doesn't. No per-event scoping, no "editor vs. viewer" tiers (`PRD.md` §6, `[TBD]`). If that's needed later, the natural extension is additional custom claims (e.g. `{ admin: true, eventIds: ['evt_123'] }`) checked in both `AuthProvider` and `firestore.rules` — don't build a Firestore-document-based role system, since documents are exactly what the custom claim approach is designed to avoid depending on for authorization (a document can be read by anyone with access to read it; a custom claim can only be set by an authenticated admin action outside the client).

## Permissions

Everything under `/admin` requires the `admin` claim: events, polls, questions, options, all CRUD, publish/unpublish, viewing raw responses, viewing analytics, exporting CSV. See `firestore.rules` for the exact per-collection rules and `FIREBASE_SCHEMA.md` for what each collection is.

## Protected routes

Every route under `/admin/*` in `app/router.tsx` is wrapped once, at the `/admin` parent route, in `<RequireAdmin>`. There is no route that's under `/admin` but intentionally public — if one is ever needed, move it *outside* the `/admin` path prefix rather than special-casing an exception inside `RequireAdmin`.

## Bootstrapping an admin (first one, or any additional one)

There is deliberately no "add admin" UI in the app — that would need a Cloud Function (the browser SDK cannot create other users' accounts or set custom claims on anyone, including itself; both require the Admin SDK, which only runs server-side), and Cloud Functions requires upgrading the Firebase project off the free Spark plan onto Blaze. For a handful of internal admin accounts, that tradeoff isn't worth it — this stays a one-off local script, run by whoever owns the Firebase project. Both scripts need a service account key (Firebase console → ⚙️ Project settings → Service accounts → **Generate new private key**), saved as `service-account.json` in the project root (already gitignored — never commit it), and `npm install --no-save firebase-admin` once.

**All-in-one (recommended for a new admin):**

```bash
node scripts/add-admin.cjs <email> <temporary-password> ["Display Name"]
```

Creates the Firebase Auth account with that temporary password *and* grants the `admin` custom claim in one step. Share the email + temporary password with them out-of-band (Slack, in person — not anything you wouldn't trust with a real password); there's no "must change password on first login" enforcement (no change-password screen exists in the app yet, `[TBD]`), so this is a trust step, not a technical guarantee. They can sign in at `/admin` immediately.

**Granting admin to an account that already exists** (e.g. created manually via Firebase Console → Authentication → Add user):

```bash
node scripts/set-admin-claim.cjs <uid>
```

Find their UID in the Firebase console's Authentication → Users tab. Pass `--revoke` instead of granting to remove admin access later.

Either way, the new admin must sign out and back in (or wait up to an hour for their existing ID token to refresh) before the claim takes effect. Optionally add a profile doc at `adminUsers/{uid}` (display name/email) via the Firebase console if you want their name to show in the UI — purely cosmetic, has no effect on authorization (see `FIREBASE_SCHEMA.md`).

Neither script nor the service account key are part of this repository's runtime — they're operational tooling, not app code.

## Revoking admin access

Same script, with `--revoke`, then have that user sign out. There's no in-app "remove admin" button for the same reason there's no "add admin" button — this is a deliberately out-of-band operation.
