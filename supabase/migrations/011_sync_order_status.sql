-- 011_sync_order_status: keep orders.status in sync when sellers update order_items.status.

create or replace function public.compute_order_status(oid bigint) returns text
language sql security definer stable set search_path = public as $$
  select case
    when count(*) = 0 then 'Pending'
    when count(*) filter (where status <> 'Cancelled') = 0 then 'Cancelled'
    when count(*) filter (where status not in ('Delivered', 'Cancelled')) = 0 then 'Delivered'
    else 'Pending'
  end
  from order_items
  where order_id = oid;
$$;

create or replace function public.sync_order_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  oid bigint := coalesce(new.order_id, old.order_id);
begin
  update orders set status = public.compute_order_status(oid) where id = oid;
  return coalesce(new, old);
end $$;

drop trigger if exists sync_order_status on order_items;
create trigger sync_order_status
  after insert or update of status or delete on order_items
  for each row execute function public.sync_order_status();

-- Backfill existing orders so any order already marked Delivered/Cancelled by a seller reflects immediately
update orders o set status = public.compute_order_status(o.id);

notify pgrst, 'reload schema';

