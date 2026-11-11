-- 006_admin: Admin role that can see/manage every seller and customer.

-- 1. Allow the 'admin' role
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('buyer', 'seller', 'admin'));

-- 2. Secret signup codes for creating admin accounts.
--    RLS is on with NO policies, so the client can never read this table.
--    Add a code in the SQL Editor:  insert into admin_codes (code) values ('your-secret-code');
create table if not exists admin_codes (code text primary key);
alter table admin_codes enable row level security;

-- 3. Helper used by policies (security definer avoids recursive RLS on profiles)
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- 4. Signup trigger: 'admin' is only granted when the supplied admin_code is valid
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  user_role text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'buyer');
  if user_role = 'admin' then
    if not exists (select 1 from admin_codes where code = new.raw_user_meta_data->>'admin_code') then
      user_role := 'buyer';
    end if;
  elsif user_role not in ('buyer', 'seller') then
    user_role := 'buyer';
  end if;

  insert into public.profiles (id, full_name, role, headline)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    user_role,
    case user_role when 'seller' then 'Seller' when 'admin' then 'Administrator' else 'Shopper' end
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role;

  return new;
end $$;

-- 5. Nobody can make themselves admin (or change an admin's role) through the API
create or replace function public.guard_admin_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  if tg_op = 'INSERT' and new.role = 'admin' then
    raise exception 'Not allowed to create an admin';
  end if;
  if tg_op = 'UPDATE' and new.role is distinct from old.role and 'admin' in (new.role, old.role) then
    raise exception 'Not allowed to change admin role';
  end if;
  return new;
end $$;

drop trigger if exists guard_admin_role on profiles;
create trigger guard_admin_role before insert or update on profiles
  for each row execute function public.guard_admin_role();

-- 6. Admin read access to all orders, and moderation of profiles/products
drop policy if exists "admin read orders" on orders;
create policy "admin read orders" on orders for select to authenticated using (public.is_admin());

drop policy if exists "admin read order items" on order_items;
create policy "admin read order items" on order_items for select to authenticated using (public.is_admin());

drop policy if exists "admin update profiles" on profiles;
create policy "admin update profiles" on profiles for update to authenticated using (public.is_admin());

drop policy if exists "admin delete products" on products;
create policy "admin delete products" on products for delete to authenticated using (public.is_admin());

notify pgrst, 'reload schema';

