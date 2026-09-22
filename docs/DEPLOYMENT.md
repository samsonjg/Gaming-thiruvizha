# Deployment

## Hosting target

`firebase.json` configures **Firebase Hosting** serving the Vite `dist/` output, with a catch-all rewrite to `index.html` (required for `react-router-dom` client-side routing — without it, a hard refresh on `/poll/gaming-thiruvizha-2026` or any `/admin/*` route would 404). This is an assumption based on the project already being Firebase-centric for Auth/Firestore — if the team deploys elsewhere (Vercel, Netlify, Cloudflare Pages), the app itself doesn't care (it's a static SPA build), but you'd replace `firebase.json`'s `hosting` block with that provider's equivalent SPA-rewrite config and this doc should be updated to match reality.

## Build

```bash
npm run build
```

Produces `dist/`. `tsc -b` runs first and fails the build on any type error — there is no "build with warnings" mode; treat a build failure as blocking.

## Environment configuration for production

The production build needs the same `VITE_FIREBASE_*` variables as local development (see `DEVELOPMENT.md`), but pointed at your **production** Firebase project, injected at build time (Vite bakes `import.meta.env.VITE_*` into the bundle — there is no runtime env var loading for a static SPA). Where exactly you set these depends on your CI/hosting provider:
- Firebase Hosting via GitHub Actions or a manual `firebase deploy`: set them as build-step environment variables before `npm run build` runs.
- Any other static host: same principle — the variables must exist in the environment *that runs `npm run build`*, not just at deploy time.

Never commit a production `.env.local`. If you use a secrets manager or CI secret store, that's the right place for these (they're not secret in the security sense — see `SECURITY.md` — but keeping them out of git still avoids per-environment config drift).

## Firebase configuration for production

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes
npx firebase-tools deploy --only hosting
```

Or both together: `npx firebase-tools deploy`. Run rules/indexes and hosting as separate, deliberate steps in CI if you want to review a rules diff before it goes live — a bad security rule change is higher-stakes than a bad UI deploy.

## Billing hard cutoff (optional, off by default)

`functions/index.js` contains one Cloud Function, `stopBillingOnBudgetExceeded`, that disables billing for this GCP project entirely — Hosting, Firestore, Storage, Auth all go offline immediately, no grace period — the moment actual spend reaches or exceeds a configured budget. It only exists because the project owner explicitly asked for a hard safety net on top of the (recommended, lower-risk) email budget alerts; it is not part of the normal architecture and this app worked fine without any Cloud Functions before it. See `SECURITY.md` "Billing hard cutoff" for the tradeoffs.

**This function alone does nothing until three manual console steps are done** (all deliberately left to the project owner — they grant a genuinely sensitive billing permission, not something to automate):

1. **Create the budget** in [Google Cloud Console → Billing → Budgets & alerts](https://console.cloud.google.com/billing) for the `gaming-thiruvizha-2026` project, with whatever amount and percentage-threshold alerts you want (e.g. 50/80/100%).
2. **Connect a Pub/Sub topic** to that budget: in the budget's "Manage notifications" section, create (or select) a topic named exactly `budget-alerts` — the function is hardcoded to listen on that topic name (see `functions/index.js`'s `topic: 'budget-alerts'`). Every budget update (any threshold crossing, not just 100%) publishes a message here; the function itself is what decides to actually act only once `costAmount > budgetAmount`.
3. **Grant the function's runtime service account the "Billing Account Administrator" role** on the billing account (Billing → Account Management → Permissions → Add principal). After first deploy, the relevant service account is the project's default compute service account, `<PROJECT_NUMBER>-compute@developer.gserviceaccount.com` (find `PROJECT_NUMBER` in Project Settings). Without this role the function's billing-disable call fails silently — the budget will still email you, but the site will NOT go offline, so verify this step actually took effect (see "Testing" below).

**Deploy the function:**

```bash
cd functions && npm install && cd ..
npx firebase-tools deploy --only functions
```

**Testing:** Google Cloud Billing does not offer a "send a test notification" button — the only reliable way to verify the full chain (budget → Pub/Sub → function → billing API call) works is to temporarily set the budget amount below current month-to-date spend, confirm a Cloud Functions log line appears for `stopBillingOnBudgetExceeded` within a few minutes, then immediately restore the real budget amount and manually re-check that billing is still enabled (`gcloud billing projects describe` or the Console) before moving on — do this test only when you're prepared for the project to actually go offline as a result.

**Re-enabling after a cutoff:** Cloud Console → Billing → link a billing account to the project again (My Projects → select project → "Link a billing account"). Nothing about the app code needs to change; Hosting/Firestore/Storage/Auth resume working as soon as billing is relinked.

## Domain configuration

`[TBD]` — no custom domain is configured in this repository. Firebase Hosting's default `<project-id>.web.app` / `<project-id>.firebaseapp.com` domains work out of the box; adding a custom domain is a Firebase console step (Hosting → Add custom domain) with no code changes required.

## Production checks (do these after every deploy)

- Load `/` and `/poll/<your-demo-slug>` — confirm the poll flow works against the real Firestore project, not a cached build.
- Load `/admin`, confirm the login screen appears (not a crash, not the dashboard for a non-admin).
- Sign in as the bootstrapped admin, confirm the dashboard shows real numbers.
- Open Firestore console → Rules tab, confirm the deployed rules match `firestore.rules` in the repo (rules can silently drift if someone edits them in the console directly — treat the console as read-only outside of an emergency).

## Rollback

Git is the source of truth for code history — never delete git history to "roll back."

- **Bad app code:** `git log` to find the last known-good commit, then either `git revert <bad-commit>` (preferred — keeps history honest) and redeploy, or redeploy an older build artifact if your CI keeps them. Do not `git reset --hard` and force-push on a shared branch.
- **Bad security rules:** roll back `firestore.rules` to the previous commit and re-run `firebase deploy --only firestore:rules` — this takes effect within seconds, no rebuild needed.
- **Database changes:** this app has made no destructive migrations (see `AI_CONTEXT.md` "Database Migrations" guidance for future changes — never delete collections/fields without a documented migration plan and explicit approval). A code rollback does not, by itself, undo any data that was already written by the bad version — check whether the bad release wrote anything that needs manual cleanup before considering an incident closed.
