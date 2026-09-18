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

## Bootstrapping the first admin

There is deliberately no "create the first admin" button anywhere in the app — that would be a backdoor. Do this once, manually, after creating your Firebase project:

1. Have the person who should be an admin sign in once. The simplest way: temporarily add a throwaway "create account" call, or use the Firebase console's Authentication tab → **Add user** → set an email + password directly. Either way, you end up with a normal (non-admin) Firebase Auth user.
2. Find that user's UID in the Firebase console (Authentication → Users tab).
3. Custom claims can't be set from the `firebase` CLI directly — they require the Admin SDK (server-side only; the web SDK used by this app's frontend cannot set its own claims, by design). The simplest path that needs no Cloud Function deployment is a short one-off Node script using the Admin SDK:

   ```js
   // scripts/set-admin-claim.js — run once, locally, with a service account key
   // (Firebase console → Project settings → Service accounts → Generate new private key).
   // Never commit the key file.
   const admin = require('firebase-admin')
   admin.initializeApp({ credential: admin.credential.cert(require('./service-account.json')) })

   const uid = process.argv[2]
   admin.auth().setCustomUserClaims(uid, { admin: true }).then(() => {
     console.log(`Granted admin to ${uid}`)
     process.exit(0)
   })
   ```

   ```bash
   npm install --no-save firebase-admin
   node scripts/set-admin-claim.js <uid>
   ```

4. Have the admin sign out and back in (or wait up to an hour for the existing ID token to refresh) so the new claim is picked up. `[TBD]` a "force refresh" button in the UI would improve this — not built yet.
5. Add a profile doc at `adminUsers/{uid}` (display name/email) via the Firebase console if you want their name to show in the UI — this is optional and has no effect on authorization (see `FIREBASE_SCHEMA.md`).

This script and the service account key are intentionally **not** part of this repository's runtime — they're a one-time operational step, not app code. Keep the service account key out of version control (it's a real secret, unlike the `VITE_FIREBASE_*` web config).

## Revoking admin access

Same script, with `{ admin: false }` (or omit the claim key entirely) instead of `{ admin: true }`, then have that user sign out. There's no in-app "remove admin" button for the same reason there's no "add admin" button — this is a deliberately out-of-band operation.
