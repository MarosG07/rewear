-- ════════════════════════════════════════════════════════════════════════
--  Rewear — migration 006: listing reservations, swap-completion → swapped,
--  meetup proposer tracking, and listings in the realtime publication.
--  Paste into Supabase → SQL Editor → Run. Additive + idempotent.
--
--  What this adds:
--   • listings.reserved — an item tied to a live swap is locked so it can't be
--     requested or offered to someone else (it stays visible, badged "Reserved").
--   • A trigger that keeps reservations in sync with a conversation's status and
--     flips both items to status='swapped' when a swap completes.
--   • conversations.meetup_by — who proposed the current meetup, so the OTHER
--     side is the one who confirms it.
--   • Adds public.listings to the realtime publication so Browse + wishlist
--     match notifications update live.
-- ════════════════════════════════════════════════════════════════════════

-- ── Reservation flag ─────────────────────────────────────────────────────
alter table public.listings add column if not exists reserved boolean not null default false;

-- ── Who proposed the current meetup ──────────────────────────────────────
alter table public.conversations
  add column if not exists meetup_by uuid references public.profiles(id) on delete set null;

-- ── Keep listing reservation/status in sync with the swap thread ─────────
-- Runs as the table owner (security definer) so it can touch BOTH participants'
-- listings regardless of who triggered the conversation change.
create or replace function public.sync_listing_reservation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    -- A brand-new request: lock the item the requester offered (if any) so it
    -- can't be offered to multiple people at once.
    if new.offered_listing_id is not null then
      update public.listings set reserved = true
        where id = new.offered_listing_id and status = 'active';
    end if;

  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    if new.status = 'pending' then
      -- A free inquiry was upgraded into a real request: lock the offered item.
      if new.offered_listing_id is not null then
        update public.listings set reserved = true
          where id = new.offered_listing_id and status = 'active';
      end if;

    elsif new.status = 'accepted' then
      -- Lock both sides of the agreed swap.
      update public.listings set reserved = true
        where id = new.listing_id and status = 'active';
      if new.offered_listing_id is not null then
        update public.listings set reserved = true
          where id = new.offered_listing_id and status = 'active';
      end if;

    elsif new.status = 'declined' then
      -- Swap fell through: free both items back to the marketplace.
      update public.listings set reserved = false
        where id = new.listing_id and status = 'active';
      if new.offered_listing_id is not null then
        update public.listings set reserved = false
          where id = new.offered_listing_id and status = 'active';
      end if;

    elsif new.status = 'completed' then
      -- Done for good: both items are now swapped and no longer reservable.
      update public.listings set status = 'swapped', reserved = false
        where id = new.listing_id;
      if new.offered_listing_id is not null then
        update public.listings set status = 'swapped', reserved = false
          where id = new.offered_listing_id;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_listing_reservation on public.conversations;
create trigger trg_sync_listing_reservation
  after insert or update on public.conversations
  for each row execute function public.sync_listing_reservation();

-- ── Backfill: lock items already tied to a live (accepted/confirmed) swap ─
update public.listings l set reserved = true
  where l.status = 'active'
    and exists (
      select 1 from public.conversations c
      where c.status in ('accepted', 'confirmed')
        and (c.listing_id = l.id or c.offered_listing_id = l.id)
    );

-- ── Realtime: Browse + wishlist match toasts react to new/changed listings ─
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.listings'; exception when duplicate_object then null; end;
end $$;
