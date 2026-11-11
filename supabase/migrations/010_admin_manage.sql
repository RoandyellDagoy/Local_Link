-- 010_admin_manage: admin tools (remove users, reset data) + sellers can see delivery details of their orders.

-- Helper for policies (security definer avoids recursive RLS between orders <-> order_items)
create or replace function public.seller_has_item(oid bigint) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from order_items where order_id = oid and seller_id = auth.uid());
$$;

drop policy if exists "sellers read orders of their items" on orders;
create policy "sellers read orders of their items" on orders for select to authenticated
  using (public.seller_has_item(id));

-- Admin: permanently remove a seller or customer (and everything tied to them)
create or replace function public.admin_delete_user(target uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if target = auth.uid() then raise exception 'You cannot remove your own account'; end if;
  if exists (select 1 from profiles where id = target and role = 'admin') then
    raise exception 'Admin accounts cannot be removed here';
  end if;
  delete from order_items where seller_id = target;
  delete from auth.users where id = target; -- cascades: profile, products, their orders
end $$;

-- Admin: wipe orders, sales and products; optionally every seller/customer account too (admins are kept)
create or replace function public.admin_reset_data(include_users boolean default false) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  delete from order_items where true;
  delete from orders where true;
  delete from products where true;
  if include_users then
    delete from auth.users where id in (select id from profiles where role <> 'admin');
  end if;
end $$;

revoke all on function public.admin_delete_user(uuid) from public, anon;
revoke all on function public.admin_reset_data(boolean) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;
grant execute on function public.admin_reset_data(boolean) to authenticated;

notify pgrst, 'reload schema';

