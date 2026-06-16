-- ════════════════════════════════════════════════════════════════════════
--  Rewear — migration 002: reviews, richer swaps (offer + meetup),
--  multiple listing photos. Paste into Supabase → SQL Editor → Run.
--  Additive + idempotent — safe to run once on top of schema.sql.
-- ════════════════════════════════════════════════════════════════════════

-- ── REVIEWS (real ratings + written feedback) ───────────────────────────
create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  reviewer_id     uuid not null references public.profiles(id) on delete cascade,
  reviewee_id     uuid not null references public.profiles(id) on delete cascade,
  rating          int not null check (rating between 1 and 5),
  comment         text,
  created_at      timestamptz not null default now(),
  unique (conversation_id, reviewer_id)
);
alter table public.reviews enable row level security;

drop policy if exists "Reviews are public" on public.reviews;
create policy "Reviews are public" on public.reviews for select using (true);

drop policy if exists "Users write own reviews" on public.reviews;
create policy "Users write own reviews" on public.reviews
  for insert with check (reviewer_id = auth.uid());

create index if not exists reviews_reviewee_idx on public.reviews(reviewee_id);

-- ── CONVERSATIONS: offered item + meetup scheduling ─────────────────────
alter table public.conversations
  add column if not exists offered_listing_id uuid references public.listings(id) on delete set null;
alter table public.conversations add column if not exists meetup_at timestamptz;
alter table public.conversations add column if not exists meetup_place text;
alter table public.conversations add column if not exists meetup_confirmed boolean not null default false;

-- ── LISTINGS: multiple photos (image_url stays as the cover = images[0]) ─
alter table public.listings add column if not exists images text[] not null default '{}';
