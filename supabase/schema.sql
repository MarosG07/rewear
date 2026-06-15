-- ════════════════════════════════════════════════════════════════════════
--  Rewear — database schema, security rules, realtime + photo storage
--  Paste this whole file into Supabase → SQL Editor → New query → Run.
--  Safe to run more than once.
-- ════════════════════════════════════════════════════════════════════════

-- ── PROFILES ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default 'Rewearer',
  location   text not null default 'Valencia, Spain',
  avatar_url text,
  credits    integer not null default 12,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── LISTINGS ────────────────────────────────────────────────────────────
create table if not exists public.listings (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  category     text,
  condition    text,
  size         text,
  neighborhood text,
  description  text,
  image_url    text,
  status       text not null default 'active',  -- active | swapped
  boosted      boolean not null default false,
  created_at   timestamptz not null default now()
);
alter table public.listings enable row level security;

drop policy if exists "Listings are viewable by everyone" on public.listings;
create policy "Listings are viewable by everyone"
  on public.listings for select using (true);

drop policy if exists "Users can insert own listings" on public.listings;
create policy "Users can insert own listings"
  on public.listings for insert with check (auth.uid() = owner_id);

drop policy if exists "Users can update own listings" on public.listings;
create policy "Users can update own listings"
  on public.listings for update using (auth.uid() = owner_id);

drop policy if exists "Users can delete own listings" on public.listings;
create policy "Users can delete own listings"
  on public.listings for delete using (auth.uid() = owner_id);

create index if not exists listings_created_idx on public.listings(created_at desc);

-- ── SAVED ITEMS ─────────────────────────────────────────────────────────
create table if not exists public.saved (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
alter table public.saved enable row level security;

drop policy if exists "Users manage own saved" on public.saved;
create policy "Users manage own saved" on public.saved
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── CONVERSATIONS (a swap thread between two users) ─────────────────────
create table if not exists public.conversations (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid references public.listings(id) on delete set null,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending',  -- pending | confirmed | completed
  rated        boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (listing_id, requester_id)
);
alter table public.conversations enable row level security;

drop policy if exists "Participants can view conversations" on public.conversations;
create policy "Participants can view conversations" on public.conversations
  for select using (auth.uid() = requester_id or auth.uid() = owner_id);

drop policy if exists "Requester can create conversation" on public.conversations;
create policy "Requester can create conversation" on public.conversations
  for insert with check (auth.uid() = requester_id);

drop policy if exists "Participants can update conversation" on public.conversations;
create policy "Participants can update conversation" on public.conversations
  for update using (auth.uid() = requester_id or auth.uid() = owner_id);

-- ── MESSAGES (live chat) ────────────────────────────────────────────────
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);
alter table public.messages enable row level security;

drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.requester_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.requester_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

create index if not exists messages_conv_idx on public.messages(conversation_id, created_at);

-- ── REALTIME (so new messages/threads push instantly) ───────────────────
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.messages'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.conversations'; exception when duplicate_object then null; end;
end $$;

-- ── STORAGE (listing photos) ────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

drop policy if exists "Listing photos are public" on storage.objects;
create policy "Listing photos are public" on storage.objects
  for select using (bucket_id = 'listing-photos');

drop policy if exists "Users upload own listing photos" on storage.objects;
create policy "Users upload own listing photos" on storage.objects
  for insert with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
