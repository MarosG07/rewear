-- ════════════════════════════════════════════════════════════════════════
--  Rewear — migration 004: retention (daily check-in streak + referrals).
--  Run in Supabase → SQL Editor. Additive + idempotent.
-- ════════════════════════════════════════════════════════════════════════

alter table public.profiles add column if not exists streak int not null default 0;
alter table public.profiles add column if not exists last_checkin date;
alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id);

-- Give everyone a referral code (existing rows + a default for new ones).
update public.profiles
  set referral_code = upper(substr(md5(id::text || clock_timestamp()::text), 1, 6))
  where referral_code is null;
alter table public.profiles
  alter column referral_code set default upper(substr(md5(gen_random_uuid()::text), 1, 6));
create unique index if not exists profiles_referral_code_idx on public.profiles(referral_code);

-- Daily check-in: once per day, a bonus that grows with the streak (capped +5).
create or replace function public.daily_checkin()
returns json language plpgsql security definer set search_path = public as $$
declare p public.profiles; bonus int; newstreak int;
begin
  select * into p from public.profiles where id = auth.uid();
  if p.id is null then raise exception 'no profile'; end if;
  if p.last_checkin = current_date then
    return json_build_object('claimed', false, 'streak', p.streak, 'bonus', 0);
  end if;
  if p.last_checkin = current_date - 1 then newstreak := p.streak + 1; else newstreak := 1; end if;
  bonus := least(newstreak, 5);
  update public.profiles set credits = credits + bonus, streak = newstreak, last_checkin = current_date
    where id = auth.uid();
  return json_build_object('claimed', true, 'streak', newstreak, 'bonus', bonus);
end; $$;
grant execute on function public.daily_checkin() to authenticated;

-- Redeem a friend's referral code (once) — both get +5.
create or replace function public.redeem_referral(code text)
returns json language plpgsql security definer set search_path = public as $$
declare me public.profiles; ref public.profiles;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.referred_by is not null then return json_build_object('ok', false, 'msg', 'You already redeemed a code'); end if;
  select * into ref from public.profiles where upper(referral_code) = upper(trim(code));
  if ref.id is null then return json_build_object('ok', false, 'msg', 'That code is not valid'); end if;
  if ref.id = me.id then return json_build_object('ok', false, 'msg', 'That is your own code'); end if;
  update public.profiles set referred_by = ref.id, credits = credits + 5 where id = me.id;
  update public.profiles set credits = credits + 5 where id = ref.id;
  return json_build_object('ok', true, 'msg', 'Redeemed — you both got +5 credits!');
end; $$;
grant execute on function public.redeem_referral(text) to authenticated;
