# Gaming Thiruvizha

The Kyn Event Poll & Engagement Platform. Gaming Thiruvizha 2026 is the first event running on it — the platform itself is reusable across any future Kyn event (see `docs/AI_CONTEXT.md`).

## Overview

Public poll experience at `/poll/:slug` (mobile-first: landing → sequential one-question-at-a-time flow → aggregated results → completion) plus a separate admin portal at `/admin` for managing events, polls and questions (8 reusable question types), viewing responses, and reading analytics. Backed by Firebase (Authentication + Firestore).

## Features

See `docs/PRD.md` §3 for the full feature inventory with requirement IDs, and `docs/FEATURES.md` for detailed functional/business/security requirements per feature.

## Architecture

`UI → hooks → repositories → Firebase`, feature-based folder structure, one reusable question-rendering engine shared by the public flow and the admin preview. Full breakdown in `docs/ARCHITECTURE.md`.

## Tech stack

React 19 + TypeScript + Vite, Tailwind CSS v4, React Router, Framer Motion (animation), `@dnd-kit` (drag-and-drop reordering + the ranking question type), Firebase (Auth + Firestore + Analytics). No Redux/Zustand, no data-fetching library beyond a small in-house `useAsync` hook — see `docs/ARCHITECTURE.md` "State management" for why.

## Project structure

```
src/
├── app/            App shell, router, AuthProvider
├── components/     ui/ (design system) · common/ (shared product visuals) · layout/
├── features/       questions/ (the question engine) · auth/ · admin/
├── pages/          public/ · admin/
├── hooks/          Domain hooks wrapping repositories
├── repositories/   Firestore-backed data access, one file per entity
├── services/       firebase/ (SDK init) · analytics/
├── types/          schema.ts — every domain type
├── constants/      Question-type registry, demo ids, routes
└── config/         firebaseConfig.ts

docs/               Product & technical source of truth — read AI_CONTEXT.md first
firestore.rules, firestore.indexes.json, firebase.json, .firebaserc
```

Full explanation: `docs/ARCHITECTURE.md`.

## Local development

```bash
npm install
npm run dev
```

Needs a `.env.local` with Firebase config (copy `.env.example`) to actually load data — without it, the app shows a clear setup message instead of crashing. Full setup steps, including creating the Firebase project and bootstrapping the first admin: **`docs/DEVELOPMENT.md`**.

## Environment variables

See `.env.example` and `docs/DEVELOPMENT.md`.

## Firebase setup

See `docs/DEVELOPMENT.md` "Firebase setup" and `docs/FIREBASE_SCHEMA.md` for the data model.

## Admin setup

See `docs/ADMIN_PANEL.md` — admin authorization is a Firebase custom claim, bootstrapped manually once per project; there is no in-app "become admin" flow, by design (see `docs/SECURITY.md`).

## Testing

```bash
npm run lint
npm run build
```

No automated test suite yet — see `docs/DEVELOPMENT.md` "Testing" for the manual verification checklist to run before merging a change.

## Build

```bash
npm run build
```

## Deployment

See `docs/DEPLOYMENT.md` — Firebase Hosting, with the SPA rewrite already configured in `firebase.json`.

## Future development

Read `docs/AI_CONTEXT.md` → `docs/PRD.md` → `docs/ARCHITECTURE.md`, in that order, before making a change — especially if you're an AI coding agent picking this up cold. `docs/AI_CONTEXT.md` "Future Requirement Change Protocol" describes the process for any new requirement: understand → identify the affected requirement ID → impact analysis → update docs → implement → test → changelog.

## Documentation

| File | What it's for |
|---|---|
| `docs/PRD.md` | Product source of truth — features, user types, requirement IDs |
| `docs/ARCHITECTURE.md` | Technical source of truth — folder structure, layering, patterns |
| `docs/FIREBASE_SCHEMA.md` | Database source of truth — every collection, field, and access rule |
| `docs/USER_FLOWS.md` | Step-by-step user journeys, including edge cases |
| `docs/FEATURES.md` | Per-feature functional/business/UI/data/validation/security requirements |
| `docs/ADMIN_PANEL.md` | How admin auth works, how to bootstrap/revoke an admin |
| `docs/ANALYTICS.md` | Analytics event catalogue (planned — not yet wired up) |
| `docs/SECURITY.md` | The authorization model, known residual risks, error-copy rules |
| `docs/DEVELOPMENT.md` | Local setup, environment variables, Firebase setup, common gotchas |
| `docs/DEPLOYMENT.md` | Build, deploy, rollback |
| `docs/CHANGELOG.md` | History of product and architecture changes |
| `docs/AI_CONTEXT.md` | Start here — onboarding for a human or an AI agent picking this up cold |
