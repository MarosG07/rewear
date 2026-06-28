-- ════════════════════════════════════════════════════════════════════════
--  Rewear — migration 005: community reporting + hide-able listings.
--  Paste into Supabase → SQL Editor → Run. Additive + idempotent.
--
--  Lets any signed-in user flag a listing. Once REPORT_THRESHOLD distinct
--  users have flagged the same listing it is hidden from Browse automatically.
--  A moderator can also hide anything by hand:
--      update public.listings set hidden = true where name ilike '%amsteel%';
-- ════════════════════════════════════════════════════════════════════════

-- Soft-hide flag (kept off the normal insert path; defaults to visible).
alter table public.listings add column if not exists hidden boolean not null default false;
create index if not exists listings_visible_idx on public.listings(created_at desc) where hidden = false;

-- ── REPORTS ─────────────────────────────────────────────────────────────
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason      text,
  created_at  timestamptz not null default now(),
  unique (listing_id, reporter_id)   -- one report per user per listing
);
alter table public.reports enable row level security;

-- Users can see (and thus avoid duplicating) only their own reports.
drop policy if exists "Users see own reports" on public.reports;
create policy "Users see own reports" on public.reports
  for select using (reporter_id = auth.uid());

-- Inserts go exclusively through the RPC below (security definer), so no
-- direct insert policy is granted.

-- ── report_listing(): flag a listing, auto-hide past the threshold ──────
create or replace function public.report_listing(target uuid, why text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  threshold constant int := 3;
  total int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'msg', 'Not signed in');
  end if;

  insert into public.reports (listing_id, reporter_id, reason)
  values (target, auth.uid(), nullif(btrim(why), ''))
  on conflict (listing_id, reporter_id) do nothing;

  select count(*) into total from public.reports where listing_id = target;

  if total >= threshold then
    update public.listings set hidden = true where id = target;
  end if;

  return jsonb_build_object('ok', true, 'reports', total, 'hidden', total >= threshold);
end;
$$;

grant execute on function public.report_listing(uuid, text) to authenticated;
