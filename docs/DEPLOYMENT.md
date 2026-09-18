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
