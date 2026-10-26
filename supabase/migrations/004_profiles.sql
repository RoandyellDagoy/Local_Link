-- 004_profiles: seller profiles + avatars, and per-item order status for the dashboard.

-- Drop legacy/empty profiles table if id was created as bigint
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'id' and data_type = 'bigint'
  ) then
    drop table public.profiles cascade;
  end if;
end $$;

-- ===== Profiles =====
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  headline text default 'Seller',
  location text,
  address text,
  contact_number text,
  avatar_url text,
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles are public" on profiles;
drop policy if exists "users insert own profile" on profiles;
drop policy if exists "users update own profile" on profiles;
create policy "profiles are public" on profiles for select using (true);
create policy "users insert own profile" on profiles for insert to authenticated with check (id = auth.uid());
create policy "users update own profile" on profiles for update to authenticated using (id = auth.uid());

-- Create a profile row automatically for every new account
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill accounts that already exist
insert into profiles (id, full_name)
select id, coalesce(raw_user_meta_data->>'full_name', '') from auth.users
on conflict (id) do nothing;

-- ===== Avatar storage =====
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "public read avatars" on storage.objects;
drop policy if exists "users upload own avatar" on storage.objects;
drop policy if exists "users update own avatar" on storage.objects;
drop policy if exists "users delete own avatar" on storage.objects;
create policy "public read avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "users upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users update own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own avatar" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ===== Seller-facing order data =====
alter table order_items add column if not exists buyer_name text;
alter table order_items add column if not exists status text not null default 'Pending';
alter table order_items add column if not exists created_at timestamptz default now();

update order_items oi
   set buyer_name = o.full_name, created_at = o.created_at
  from orders o
 where o.id = oi.order_id and oi.buyer_name is null;

drop policy if exists "sellers update own order items" on order_items;
create policy "sellers update own order items" on order_items for update to authenticated
  using (seller_id = auth.uid()) with check (seller_id = auth.uid());

notify pgrst, 'reload schema';
