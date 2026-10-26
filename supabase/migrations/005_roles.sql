-- 005_roles: Add buyer vs seller roles with distinct privileges

-- 1. Add role column to profiles (default 'buyer')
alter table profiles add column if not exists role text not null default 'buyer';
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('buyer', 'seller'));

-- 2. Mark existing users who sell products or have seller headlines as 'seller'
update profiles p
   set role = 'seller'
 where exists (select 1 from products pr where pr.owner_id = p.id)
    or headline ilike '%seller%' or headline ilike '%artist%';

-- 3. Update the handle_new_user trigger to preserve chosen role from signup metadata
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  user_role text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'buyer');
  if user_role not in ('buyer', 'seller') then
    user_role := 'buyer';
  end if;

  insert into public.profiles (id, full_name, role, headline)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    user_role,
    case when user_role = 'seller' then 'Seller' else 'Shopper' end
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role;

  return new;
end $$;

-- 4. Products RLS: only sellers can create products
drop policy if exists "sellers insert own products" on products;
create policy "sellers insert own products" on products for insert to authenticated
  with check (
    owner_id = auth.uid() and
    exists (select 1 from profiles where id = auth.uid() and role = 'seller')
  );

notify pgrst, 'reload schema';
