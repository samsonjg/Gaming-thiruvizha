# Development

## Prerequisites

- Node.js (any version compatible with Vite 8 / the `package.json` devDependencies)
- A Firebase project (see "Firebase setup" below) — the app will run and show a clear setup message without one, but neither the public poll nor the admin panel are usable until it's configured.

## Install & run

```bash
npm install
npm run dev      # Vite dev server, http://localhost:5173
npm run lint      # oxlint
npm run build     # tsc -b && vite build — must pass with zero errors before merging
npm run preview   # serve the production build locally
```

## Environment variables

Copy `.env.example` to `.env.local` (already gitignored) and fill in your Firebase project's web app config:

| Variable | Where to find it |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase console → Project settings → General → Your apps → Web app |
| `VITE_FIREBASE_AUTH_DOMAIN` | same |
| `VITE_FIREBASE_PROJECT_ID` | same |
| `VITE_FIREBASE_STORAGE_BUCKET` | same |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | same |
| `VITE_FIREBASE_APP_ID` | same |
| `VITE_FIREBASE_MEASUREMENT_ID` | same, optional — only if Analytics is enabled on the project |

Without these set, `config/firebaseConfig.ts`'s `isFirebaseConfigured` is `false`, and:
- `/admin` shows "Firebase isn't configured yet" instead of the login form.
- `/poll/:slug` shows a generic "not available right now" message instead of hanging or crashing.

This is intentional — see `AI_CONTEXT.md` do-not-break rule about never shipping a fake backend silently.

## Firebase setup (once, per environment)

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Add a Web app to the project, copy its config into `.env.local` (see table above).
3. Enable **Authentication** → Sign-in method → enable **Anonymous** (public users) and **Email/Password** (admins).
4. Enable **Firestore Database** (production mode — the rules in `firestore.rules` are what actually secure it, not "test mode").
5. Install the Firebase CLI if you don't have it (`npx firebase-tools` works without a global install) and log in: `npx firebase-tools login`.
6. Set your project id in `.firebaserc` (replace the placeholder), or run `npx firebase-tools use --add` and select it interactively.
7. Deploy the security rules: `npx firebase-tools deploy --only firestore:rules,firestore:indexes`.
8. Bootstrap the first admin user — see `ADMIN_PANEL.md` "Bootstrapping the first admin." This step cannot be automated from the app itself, by design.
9. Create the Gaming Thiruvizha demo content through the admin UI itself (sign in at `/admin`, create the event, create the poll, create the 5 demo questions per `PRD.md` §3) — there is no separate seed script; the admin panel *is* the tool for this now that it's real.

## Testing

No automated test suite exists yet (`[TBD]` — not requested by the original brief for this migration pass). Manual verification checklist for any change:
- `npm run lint` and `npm run build` both pass.
- Public poll flow end-to-end at 375/390/412px: landing → 5 questions → results → completion, with the duplicate-answer guard working on a page reload.
- Admin flow: create/edit/publish a question of each of the 8 types, verify the Preview screen matches the public rendering exactly (same component, see `ARCHITECTURE.md`).
- Responses table filters + CSV export.
- Analytics numbers match what the Responses table shows for the same poll.

## Common gotchas

- **Nested interactive elements.** Never put a `Button` inside a `Link`/`<a>` — use `LinkButton` (`components/ui/Button.tsx`). This exact bug silently broke every admin navigation click during the original prototype build; it's easy to reintroduce by habit.
- **Vite dev server not reachable.** If `npm run dev` starts but `http://localhost:5173` isn't reachable from your browser, check whether the process actually bound to your machine's network stack (some sandboxed/remote dev environments run a separate network namespace per tool) — a `curl -I http://localhost:5173` from the same shell you plan to browse from is the fastest way to confirm before assuming a code bug.
- **Firestore `undefined` fields.** `services/firebase/app.ts` initializes Firestore with `ignoreUndefinedProperties: true` specifically so repository code can pass objects with optional fields (`description`, `imageUrl`, …) straight through without manually stripping `undefined` keys. Don't remove that option without auditing every repository write.
