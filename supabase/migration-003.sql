-- ════════════════════════════════════════════════════════════════════════
--  Rewear — migration 003: mutual swap completion (+ server-side credits),
--  delete-account, and the wishlist ("Looking for"). Run in SQL Editor.
--  Additive + idempotent.
-- ════════════════════════════════════════════════════════════════════════

-- ── Mutual completion flags ─────────────────────────────────────────────
alter table public.conversations add column if not exists requester_completed boolean not null default false;
alter table public.conversations add column if not exists owner_completed boolean not null default false;

-- Marks the caller's side complete. When BOTH sides are complete, finalizes
-- the swap and awards +5 credits to both participants (server-side, so credits
-- can't be fudged from the client).
create or replace function public.mark_swap_complete(conv_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  c public.conversations;
begin
  select * into c from public.conversations where id = conv_id;
  if c.id is null then raise exception 'conversation not found'; end if;
  if auth.uid() <> c.requester_id and auth.uid() <> c.owner_id then
    raise exception 'not a participant';
  end if;
  if c.status = 'completed' then return 'completed'; end if;

  if auth.uid() = c.requester_id then
    update public.conversations set requester_completed = true where id = conv_id;
  else
    update public.conversations set owner_completed = true where id = conv_id;
  end if;

  select * into c from public.conversations where id = conv_id;
  if c.requester_completed and c.owner_completed then
    update public.conversations set status = 'completed' where id = conv_id;
    update public.profiles set credits = credits + 5 where id in (c.requester_id, c.owner_id);
    return 'completed';
  end if;
  return 'waiting';
end;
$$;
grant execute on function public.mark_swap_complete(uuid) to authenticated;

-- ── Delete account (removes the caller's auth user → cascades all data) ──
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;
grant execute on function public.delete_my_account() to authenticated;

-- ── Wishlist ("Looking for") ────────────────────────────────────────────
create table if not exists public.wishlist (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  category     text,
  size         text,
  neighborhood text,
  note         text,
  created_at   timestamptz not null default now()
);
alter table public.wishlist enable row level security;

drop policy if exists "Wishlist is public" on public.wishlist;
create policy "Wishlist is public" on public.wishlist for select using (true);

drop policy if exists "Users manage own wishlist" on public.wishlist;
create policy "Users manage own wishlist" on public.wishlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists wishlist_created_idx on public.wishlist(created_at desc);
