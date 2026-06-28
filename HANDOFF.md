# Rewear — engineering handoff & improvement guide

This document is a cold-start brief for an engineer or AI agent picking up the
project on a new machine. It explains **what Rewear is, how it's built, how every
subsystem works, the conventions to follow, and a prioritised roadmap of concrete
improvements** with implementation notes. Read it top to bottom once; after that
use it as a map.

---

## 1. What Rewear is

A mobile-first **clothes-swapping PWA** scoped to Valencia, Spain. Users list
clothes they no longer wear, browse what neighbours have posted (grid or map),
request a swap (optionally offering one of their own items in return), chat live,
arrange a meetup, mark the swap complete, and rate each other. A light gamified
credit economy and "eco impact" stats drive engagement, plus retention hooks
(daily streak, referrals, achievements). Three UI languages: English, Spanish,
Hungarian.

It is a real, working multi-user app backed by Supabase and deployed on Vercel —
not a mock. Listing/avatar imagery for demo data comes from Unsplash/pravatar.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| UI | React 18 + TypeScript, Vite 6 |
| Styling | Tailwind v4 (`@tailwindcss/vite`), CSS variables for theming |
| Routing | react-router 7 — `createBrowserRouter` + `RouterProvider`, lazy routes |
| Animation | `motion` (Framer Motion) for page transitions; `canvas-confetti` for swap completion |
| Backend | Supabase — Postgres + RLS, Auth (email/password), Realtime, Storage |
| Maps | `leaflet` + `react-leaflet` (lazy-loaded chunk) |
| Toasts | `sonner` |
| PWA | `vite-plugin-pwa` (Workbox service worker + manifest) |
| Icons | `lucide-react`; app/PWA icons generated with `sharp` |
| Deploy | Vercel (auto-deploy on push to `main`) |

> Note: `package.json` carries a large pile of dependencies inherited from the
> Figma Make scaffold (MUI, react-slick, react-dnd, recharts, embla, vaul,
> react-hook-form, cmdk, many Radix packages, …). **Most are unused.** See the
> roadmap — pruning these is low-risk, high-value.

---

## 3. Quick start (new machine)

Prereqs: **Node 22**, **Git** (and Claude Code if you want an agent here).

```bash
git clone https://github.com/MarosG07/rewear.git
cd rewear
npm install
```

Create `.env` in the repo root (it's gitignored — only `.env.example` is tracked):

```
VITE_SUPABASE_URL=https://ijkmrgxctheslpzjxqoi.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_OmAcPPu3FQCz9GwGkVwMmg_ijQMxwwG
```

The anon/publishable key is the **public client key** (already shipped in the
deployed bundle); it is safe in source. No service-role key or DB password lives
anywhere in this repo — privileged operations are done by hand in the Supabase
dashboard.

```bash
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the built bundle
npm run icons    # regenerate PWA icons from scripts/logo-icon-master.png
```

---

## 4. Architecture

### Provider tree (`src/app/App.tsx`)
```
<I18nProvider>
  <AuthProvider>
    <Shell>                       // splash + onboarding gating
      <StoreProvider>             // only mounted once a session exists
        <RouterProvider/>
```
- `App` also runs a `visualViewport` effect that sets `--app-h` so the layout
  shrinks above the mobile keyboard.
- `Shell` shows the splash until auth resolves (min 2.2s, hard cap 7s), then
  renders `<Auth/>` (logged out) or the router (logged in), and overlays
  `<Onboarding/>` on first run (`localStorage rewear-onboarded`).

### Routing (`src/app/routes.ts`)
`createBrowserRouter` with a single layout route `RouteTransition` (page
animations) wrapping all screens. **Home is eager; every other route is lazy**
(`lazy: () => import(...)`), so each screen is its own chunk fetched on
navigation. Add new screens here.

### State / data layer
Two React contexts, no external state lib:
- **`src/app/store/AuthContext.tsx`** — session + profile. Initialises from
  `onAuthStateChange` (`INITIAL_SESSION`) with a 5s failsafe; exposes
  `signIn/signUp/signOut`, `updateProfile/patchProfile/refreshProfile`,
  `changeEmail/changePassword/deleteAccount`. Re-syncs on tab focus.
- **`src/app/store/AppStore.tsx`** — the marketplace: listings, saved items,
  conversations, wishlist, credits, eco stats, plus all mutations
  (`requestSwap`, `acceptSwap`, `markComplete`, `submitReview`, `proposeMeetup`,
  `listItem`, `boostListing`, `reportListing`, `dailyCheckin`, …). All
  user-facing toasts live here and are translated via `useI18n()`.

### Realtime
`AppStore` subscribes to two Supabase channels: `conversations` (refresh inbox on
any change) and `messages` INSERT (refresh + notify). Per-message chat history is
loaded and live-subscribed inside `SwapInbox`'s `ChatView`.

---

## 5. Directory map

```
src/app/
  App.tsx                 providers, splash/onboarding shell, viewport sizing
  routes.ts               lazy route table
  components/
    BottomNav, Logo, SplashScreen, Onboarding, RouteTransition,
    SmartImage, MapView (lazy), AnimatedNumber, ProfileEditSheet
    ui/                   shadcn-style primitives (mostly UNUSED — scaffold)
  screens/
    Home, ItemDetail, ListItem, EditListing, SwapInbox, Saved,
    Profile, UserProfile, RateSwap, Credits, Settings, Wishlist, Rewards, Auth
  store/  AuthContext.tsx, AppStore.tsx
  lib/
    supabase.ts           client (reads VITE_ env)
    i18n.tsx              translation engine + en/es/hu dictionaries
    types.ts              DB row types
    images.ts             listingImage()/avatarFor() helpers + fallbacks
    upload.ts             fileToDataUrl() + uploadImage() (Storage)
    theme.ts              light/dark/system controller (CSS vars)
    haptics.ts            navigator.vibrate wrapper
  data/items.ts           neighbourhoods list + original mock catalogue
  styles/globals.css      Tailwind + CSS theme variables (.dark overrides)
supabase/                 schema.sql + migration-002..005.sql
scripts/                  generate-icons.mjs, seed-data/-listings/unseed
public/                   generated icons, manifest assets
```

---

## 6. Data model (Supabase)

Schema is in `supabase/schema.sql`, then `migration-002..005.sql`, applied **in
order** via the Supabase dashboard → SQL Editor. All additive + idempotent.

Tables (all RLS-enabled):
- **profiles** — `id` (=auth.users.id), `name`, `location`, `avatar_url`,
  `credits` (default **12**), `streak`, `last_checkin`, `referral_code`,
  `referred_by`. Auto-created on signup by the `handle_new_user` trigger.
- **listings** — `owner_id`, `name`, `category`, `condition`, `size`,
  `neighborhood`, `description`, `image_url` (cover), `images text[]`, `status`
  (`active`|`swapped`), `boosted`, `hidden` (migration-005). Public read;
  owner-only write.
- **saved** — (user_id, listing_id) bookmarks.
- **conversations** — a swap thread: `listing_id`, `requester_id`, `owner_id`,
  `status` (`pending`|`accepted`|`declined`|`confirmed`|`completed`),
  `offered_listing_id`, `meetup_at/place/confirmed`, `requester_completed`,
  `owner_completed`, `rated`. Visible only to participants.
- **messages** — chat; participant-only read/write; in the realtime publication.
- **reviews** — 1–5 rating + comment, public read, one per (conversation, reviewer).
- **wishlist** — "Looking for" posts; public read, owner write.
- **reports** (migration-005) — one per (listing, reporter); feeds auto-hide.

RPCs (SECURITY DEFINER):
- `handle_new_user()` (trigger) — seeds a profile row on signup.
- `mark_swap_complete(conv_id)` — mutual completion; awards **+5** to both only
  when both sides have confirmed (credits granted server-side, can't be faked).
- `delete_my_account()` — deletes the caller's auth user → cascades all rows.
- `daily_checkin()` — once/day; bonus `min(streak, 5)`; resets streak if a day missed.
- `redeem_referral(code)` — once per user; **+5** to both parties.
- `report_listing(target, why)` — records a report; auto-sets `hidden=true` at a
  threshold of **3** distinct reporters. Returns `{ok, reports, hidden}`.

Storage: bucket **`listing-photos`** (public). Uploads namespaced by `auth.uid()`.

> ⚠️ **PENDING: run `supabase/migration-005.sql`.** Until then the in-app Report
> button errors (toast only) and the `hidden` column doesn't exist. The client
> filters `hidden` defensively, so it's a no-op on an un-migrated DB — nothing
> else breaks. To hide the lingering joke listing immediately, after running 005:
> `update public.listings set hidden = true where name ilike '%amsteel%';`
> (or `delete from public.listings where name ilike '%amsteel%';` from the SQL
> editor, which bypasses RLS).

---

## 7. The credit & eco economy

Rules in `AppStore.tsx` (`CREDIT_RULES`, `ECO`):
- List an item **+2**, complete a swap **+5** (server-side), leave a review **+1**,
  request a swap **−3**, boost a listing **−4**. New users start with **12**.
- Daily check-in bonus = `min(streak, 5)`; referral = **+5** each.
- Eco stats are derived from completed swaps: **2.5 kg CO₂** and **3 km** saved per swap.
- `Credits.tsx` has a **simulated** purchase flow (no real payment).

---

## 8. Internationalisation

Engine: `src/app/lib/i18n.tsx`. `useI18n()` returns `{ lang, setLang, t }`.
`t("key", { var })` does `dicts[lang][key] ?? en[key] ?? key` with `{var}`
interpolation. English is the source of truth and the fallback; `es`/`hu` override
where present. Language persists in `localStorage` (`rewear-lang`) and
auto-detects from `navigator.language` on first load; the picker is in Settings.

**To add a string:** add the key to the `en`, `es`, and `hu` objects, then use
`t("your.key")` in the component (call `const { t } = useI18n()`). **To add a
language:** add it to the `Lang` type + `LANGS` array and supply a dictionary.

Coverage is complete for all screens and toasts. Intentionally **not** translated:
auto-generated chat message bodies (e.g. "Accepted the swap…") — they're stored in
the DB and shared between both participants, so per-viewer translation would be
wrong. (A proper fix is structured/typed system messages — see roadmap.)

---

## 9. PWA, styling, conventions

- **PWA** (`vite.config.ts`): `autoUpdate` SW; manifest themed `#231e18`; Workbox
  precaches build assets and runtime-caches Unsplash/pravatar images + Google
  Fonts. Icons generated by `scripts/generate-icons.mjs` from
  `scripts/logo-icon-master.png` (`npm run icons`).
- **Theming**: CSS variables `--rw-bg / --rw-bg2 / --rw-ink / --rw-card` in
  `styles/globals.css`, with a `.dark` override. Controller in `lib/theme.ts`
  (light/dark/system), applied at boot in `main.tsx`. **Always use the CSS vars**,
  never hardcode background/text colors, or dark mode breaks. Brand accents
  `#C2794A` (terracotta) and `#6B7A5C` (sage) are used as literals.
- **Conventions**: functional components; mutations live in the stores, screens
  stay declarative; toasts via `sonner` and always through `t()`; haptics via
  `haptic()` on tactile actions. Match the surrounding file's style.

---

## 10. Demo / presentation data

`scripts/seed-listings.mjs` signs up **6 personas** (`seed.*@rewear.app`, password
`rewear-demo-2026`), sets their profiles, and inserts **18 listings** (data in
`scripts/seed-data.mjs`). Idempotent. Reverse with `scripts/unseed-listings.mjs`
(signs in as each persona and calls `delete_my_account`). Both need `.env`.

> **Before real testers:** `node scripts/unseed-listings.mjs` to wipe the demo
> accounts + their listings (real users untouched).

---

## 11. Deploy & infra

- Push to `main` → Vercel builds and deploys to production automatically.
- Vercel CLI (optional): `npm i -g vercel && vercel login`, then `vercel ls rewear`.
- Supabase project ref: `ijkmrgxctheslpzjxqoi` (dashboard for SQL/Storage/Auth).
- End commit messages with the Co-Authored-By trailer if committing as the agent.

---

## 12. Gotchas / sharp edges

- **`npm run build` is NOT a full type-check.** Vite/esbuild strips types and only
  catches syntax/import/parse errors. There is no `tsc` step and no lint in the
  pipeline — a genuine type error can ship. (Roadmap item: add `tsc --noEmit`.)
- **Windows + PowerShell** is the primary shell. If the working dir is ambiguous,
  use `npm --prefix C:\...\rewear run build`.
- Lazy routes mean a screen won't error until you navigate to it — exercise new
  screens in the browser/preview.
- `MapView` is `React.lazy` behind a Suspense fallback in `Home.tsx`; its leaflet
  chunk (~156 KB) loads only on the map tab.
- The realtime message-notify handler captures `t` without it in the effect deps,
  so a notification fired right after a language switch may use the previous
  language (cosmetic, rare).
- Supabase data is **not** cached by the SW, so offline currently shows empty lists.

---

## 13. Improvement roadmap

Ordered roughly by value-to-effort. Each item notes where to start.

### Tier 0 — engineering hygiene (do first, cheap)
1. **Add a real type-check + lint gate.** Add `"typecheck": "tsc --noEmit"` and
   ESLint, then a GitHub Actions workflow running `typecheck` + `build` on PRs.
   Prevents type regressions the current build silently allows.
2. **Prune unused dependencies.** MUI, react-slick, react-dnd(+backend), recharts,
   embla-carousel, vaul, react-hook-form, cmdk, react-popper, input-otp,
   react-responsive-masonry, react-resizable-panels, most `components/ui/*` and
   likely `@emotion/*` appear unused. Remove deps + dead files; re-run build.
   Shrinks `node_modules`, install time, and audit surface.
3. **Vendor chunk splitting.** The main chunk is ~690 KB. Add
   `build.rollupOptions.output.manualChunks` to split `react`/`react-dom`,
   `@supabase/supabase-js`, and `motion` into cacheable vendor chunks; lazy-load
   `canvas-confetti` (only needed on swap completion).
4. **Tests.** None exist. Add Vitest for the credit/eco math and i18n fallback,
   and a Playwright happy-path (sign in → list → request → chat → complete → rate).

### Tier 1 — retention & growth (highest product value)
5. **Web push notifications** (agreed next step). Today the message listener in
   `AppStore.tsx` only fires a local `Notification` while the tab is open. Build
   real push: a `push_subscriptions` table, subscribe via the existing service
   worker (`pushManager.subscribe` with a VAPID key), and send from a Supabase
   Edge Function triggered on `messages`/`conversations` insert. Wire it to the
   existing Settings notification toggle + per-type prefs.
6. **Wishlist → listing matching.** `wishlist` exists but is passive. On new
   listing insert, match against open wishes (category/keyword/neighbourhood) and
   notify the wisher (pairs naturally with #5). Turns a dead feature into a draw.
7. **Invite loop.** Referral codes + credits already work (`redeem_referral`).
   Add a proper share sheet (`navigator.share`) and surface the invite CTA at
   high-intent moments (after a completed swap) to drive the cold-start.

### Tier 2 — trust, content quality, reach
8. **Image pipeline.** Listings are photo-first but uploads are raw. Add
   client-side compression + EXIF auto-rotation in `lib/upload.ts`, and
   multi-photo reordering in `ListItem`/`EditListing`. Improves load speed *and*
   listing quality.
9. **Trust layer.** Build on reporting (migration-005): a moderator view, block/
   mute, and profile verification badges. Marketplaces live or die on trust.
   Consider basic rate-limiting on `report_listing`/messages to prevent abuse.
10. **Real location instead of hardcoded Valencia.** Neighbourhoods are a fixed
    list in `data/items.ts` and the city is hardcoded. Add geolocation +
    neighbourhood selection at onboarding, distance sorting, and a map meetup-
    point picker. Unlocks expansion beyond one city.
11. **Offline support.** Cache the last listings/conversations (SW or IndexedDB)
    and make chat sends optimistic so the PWA is usable on flaky mobile networks.

### Tier 3 — polish & insight
12. **Accessibility pass.** Audit focus rings, `aria-label`s on icon-only buttons,
    color contrast (especially dark mode), and keyboard nav.
13. **Analytics.** There's zero usage visibility. Add privacy-friendly analytics
    (Plausible/PostHog) to inform everything above.
14. **Typed system messages.** Replace English-baked auto chat messages with
    structured events rendered client-side, so they localise per viewer.
15. **Monetisation (optional).** `Credits.tsx` is a simulated purchase — wire real
    Stripe checkout + a server-verified credit grant if/when monetising.

---

## 14. Working in this repo as an agent

- Read this file and skim `AppStore.tsx` + `i18n.tsx` first — they're the spine.
- After edits, run `npm run build` (catches syntax/import errors) and, when adding
  a screen or flow, verify it in a browser/preview rather than trusting the build.
- Keep all new user-facing text behind `t()` with en/es/hu entries.
- Don't hardcode theme colors; use the `--rw-*` CSS variables.
- DB changes ship as a new `supabase/migration-00X.sql` (additive + idempotent)
  that the user runs in the dashboard — never assume you can run it yourself.
- Commit only when asked; push to `main` deploys to production.
```
