-- Run in Supabase → SQL Editor (safe to run more than once).

create table if not exists orders (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  full_name text not null,
  address text not null,
  contact_number text not null,
  payment_method text not null,
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) not null default 50,
  total numeric(10,2) not null,
  status text not null default 'Pending',
  created_at timestamptz default now()
);

create table if not exists order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  product_id bigint,
  seller_id uuid,
  name text not null,
  price numeric(10,2) not null,
  unit text,
  image_url text,
  qty int not null check (qty > 0)
);

alter table orders enable row level security;
alter table order_items enable row level security;

drop policy if exists "buyers insert orders" on orders;
drop policy if exists "buyers read own orders" on orders;
drop policy if exists "buyers insert order items" on order_items;
drop policy if exists "read own or sold order items" on order_items;

create policy "buyers insert orders" on orders for insert to authenticated with check (user_id = auth.uid());
create policy "buyers read own orders" on orders for select to authenticated using (user_id = auth.uid());

create policy "buyers insert order items" on order_items for insert to authenticated
  with check (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

-- Buyers see their own items; sellers see items for products they sell.
create policy "read own or sold order items" on order_items for select to authenticated
  using (seller_id = auth.uid() or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

notify pgrst, 'reload schema';
