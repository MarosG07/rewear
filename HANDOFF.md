# Rewear — handoff notes

Continuation brief for picking this project up on another machine (or a fresh
Claude Code session). For the user-facing app it's a clothes-swapping PWA for
Valencia: list items, request swaps, chat, earn credits, leave reviews.

## Stack
- React 18 + TypeScript + Vite 6, Tailwind v4 (`@tailwindcss/vite`)
- react-router 7 (`createBrowserRouter` + `RouterProvider`; routes in `src/app/routes.ts`)
- Supabase: auth (email/password), Postgres + RLS, Realtime, Storage bucket `listing-photos`,
  SECURITY DEFINER RPCs (`mark_swap_complete`, `delete_my_account`, `daily_checkin`,
  `redeem_referral`, `report_listing`)
- PWA via `vite-plugin-pwa` (manifest + Workbox SW; icons in `public/`)
- Deployed on Vercel (auto-deploys on push to `main`)

## Run it
```bash
npm install
npm run dev      # localhost:5173
npm run build    # production build (also the type/compile check)
```
Requires Node 22. Create `.env` in the repo root (it's gitignored):
```
VITE_SUPABASE_URL=https://ijkmrgxctheslpzjxqoi.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_OmAcPPu3FQCz9GwGkVwMmg_ijQMxwwG
```
The anon key is the public client key (already in the shipped bundle). No service-role
key is stored anywhere in this project.

## Deploy
`git push origin main` → Vercel builds and deploys to production automatically.
CLI (optional): `npm i -g vercel && vercel login`, then `vercel ls rewear`.

## Database
Cloud-hosted Supabase — nothing to run locally. Schema lives in `supabase/`:
`schema.sql` then `migration-002..005.sql`, applied in order via the Supabase
dashboard → SQL Editor.

> **PENDING: run `supabase/migration-005.sql`.** It adds the `reports` table,
> the `report_listing` RPC, and the `hidden` column. Until it's run, the in-app
> Report button just shows an error toast (the rest of the app is fine — the
> client filters `hidden` defensively so it's a no-op on older DBs).

## Internationalisation
Custom lightweight engine in `src/app/lib/i18n.tsx` — `useI18n()` / `t("key")`,
with full `en` / `es` / `hu` dictionaries and English fallback. Language picker is
in Settings; choice persists in `localStorage` (`rewear-lang`) and auto-detects
from the browser on first load. All user-facing strings (screens + toasts) are
wired. Auto-generated chat message bodies (e.g. "Accepted the swap…") are left in
English on purpose — they're stored in the DB and shared between both participants.

## Demo / presentation data
`scripts/seed-listings.mjs` creates 6 demo personas (`seed.*@rewear.app`,
password `rewear-demo-2026`) with 18 listings. Reverse with
`scripts/unseed-listings.mjs`. Both need `.env`.

> **Before real testers:** run `node scripts/unseed-listings.mjs` to wipe the demo
> accounts and their listings (real users are untouched).

## Recently shipped (latest first)
- i18n full coverage (toasts, profile-edit sheet, settings dialogs, meetup form)
- Quick wins: route code-splitting (initial JS 922KB→690KB, MapView 156KB deferred),
  community reporting + auto-hide, reversible presentation seed
- Language setting (en/es/hu)
- New spiral logo + PWA icons; splash-screen hang fix; dark mode; retention (streak,
  referrals); mutual swap completion

## Suggested next (agreed direction)
**Web push notifications** — new messages + swap requests. The pieces that exist:
the Settings `notificationsEnabled` toggle, a Workbox service worker, and a
realtime message listener in `src/app/store/AppStore.tsx` that currently fires a
local `Notification` only while the tab is open. Next step is real push: store push
subscriptions in Supabase and trigger them server-side on insert so users are
reached when the app is closed.

## Gotchas
- Windows + PowerShell is the primary shell. `npm --prefix <abspath> run build` if
  the cwd is ambiguous.
- Routes are lazy-loaded except Home; `MapView` is `React.lazy` behind a Suspense
  fallback in `src/app/screens/Home.tsx`.
- `npm run build` is the compile check — run it after edits before pushing.

## Key file map
- `src/app/App.tsx` — providers + splash/onboarding shell
- `src/app/routes.ts` — lazy route table
- `src/app/store/AppStore.tsx` — data layer (listings, swaps, credits, reporting)
- `src/app/store/AuthContext.tsx` — auth/session/profile
- `src/app/lib/i18n.tsx` — translation engine + dictionaries
- `src/app/screens/*` — one file per screen
- `supabase/*.sql` — schema + migrations
- `scripts/*` — icon generation + demo seed/unseed
