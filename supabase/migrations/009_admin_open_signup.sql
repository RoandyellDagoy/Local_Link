-- 009_admin_open_signup: anyone can register as admin (no access code).
-- (007 was empty, so this migration carries the real change.)
-- WARNING: this lets any visitor create an admin account who can see all sellers, customers and orders.

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  user_role text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'buyer');
  if user_role not in ('buyer', 'seller', 'admin') then
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

drop table if exists admin_codes;

notify pgrst, 'reload schema';
