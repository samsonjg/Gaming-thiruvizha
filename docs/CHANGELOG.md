# Changelog

Every meaningful product or architecture change gets an entry here — see `AI_CONTEXT.md` do-not-break rule #8. Group by date, using `### Added` / `### Changed` / `### Fixed` / `### Database` / `### Security` as needed (omit sections with nothing to say).

## 2026-09-22

### Added
- `scripts/add-admin.cjs` — creates a Firebase Auth account with a temporary password and grants the `admin` custom claim in one step, for provisioning additional admins. Deliberately kept as a local script rather than an in-app "add admin" UI: that would require a Cloud Function (custom claims and creating other users' accounts are Admin-SDK-only, server-side-only operations), which would force the project off the free Spark plan onto Blaze — not worth it for provisioning a handful of internal accounts. See `docs/ADMIN_PANEL.md`.

## 2026-09-18

### Added
- Full `docs/` system (`PRD.md`, `ARCHITECTURE.md`, `FIREBASE_SCHEMA.md`, `USER_FLOWS.md`, `ADMIN_PANEL.md`, `FEATURES.md`, `ANALYTICS.md`, `SECURITY.md`, `DEVELOPMENT.md`, `DEPLOYMENT.md`, `AI_CONTEXT.md`, this file) documenting the approved prototype as the product source of truth, with stable `GT-*` requirement IDs.
- Firebase integration: Authentication (anonymous public sessions + email/password admin), Firestore (see `FIREBASE_SCHEMA.md`), `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `.env.example`.
- Admin authentication via Firebase custom claims (`RequireAdmin`, `AdminLoginForm`) — replaces the prototype's fully-open `/admin`.
- `components/ui`'s `LoadingState`/`ErrorState`/`EmptyState` — every hook-backed admin screen now has a real loading/error/empty state instead of silently rendering nothing.
- `services/analytics/analytics.ts` abstraction (not yet wired to any call sites — see `ANALYTICS.md` "Status").

### Changed
- Refactored from a single-file `dataService.ts` (localStorage) into the layered `UI → hooks → repositories → Firebase` architecture (`ARCHITECTURE.md`).
- Public duplicate-response prevention moved from a client-side check to a Firestore document-id scheme enforced by `firestore.rules` (`SECURITY.md`).
- Public result aggregation moved from reading raw responses client-side to reading a public `questionStats` counters document, keeping raw responses admin-only (`FIREBASE_SCHEMA.md`).
- Admin Dashboard/Responses/Analytics resolve their "active poll" dynamically (`useActivePoll`, by the Gaming Thiruvizha demo slug) instead of a hardcoded prototype id, since real Firestore documents don't have predictable ids.
- Admin routes are now `React.lazy`-loaded so public poll visitors don't download the admin bundle.

### Database
- Introduced the Firestore schema in `FIREBASE_SCHEMA.md`: `events`, `polls` (+ nested `questions`, `options`, `responses`, `questionStats`), `sessions`, `adminUsers`. No prior production database existed (prototype was localStorage-only), so this is a net-new schema, not a migration.

### Security
- Replaced the prototype's fully-open admin panel with custom-claim-gated authorization enforced by `firestore.rules` (not just the UI) — see `SECURITY.md` and `ADMIN_PANEL.md`.
- Documented (not hidden) a residual risk: any signed-in user can currently write to the public `questionStats` counters doc — see `SECURITY.md` "Known residual risks."

## Earlier — Prototype

The approved prototype (localStorage-backed, no auth) predates this changelog's start; see git history (`ef95be6`, `07a9d7a`) for that baseline.
