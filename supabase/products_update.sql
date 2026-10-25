-- Run this in Supabase → SQL Editor (safe to run more than once).

-- 1. Extra product columns
alter table products add column if not exists owner_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table products add column if not exists location text;
alter table products add column if not exists unit text;
alter table products drop constraint if exists products_category_slug_fkey;

-- 2. Sellers can manage their own products
drop policy if exists "sellers insert own products" on products;
drop policy if exists "sellers update own products" on products;
drop policy if exists "sellers delete own products" on products;

create policy "sellers insert own products" on products for insert to authenticated with check (owner_id = auth.uid());
create policy "sellers update own products" on products for update to authenticated using (owner_id = auth.uid());
create policy "sellers delete own products" on products for delete to authenticated using (owner_id = auth.uid());

-- 3. Storage bucket for product photos
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public read product images" on storage.objects;
drop policy if exists "sellers upload product images" on storage.objects;
drop policy if exists "sellers delete product images" on storage.objects;

create policy "public read product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "sellers upload product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "sellers delete product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Refresh the API schema cache so new columns are recognised immediately
notify pgrst, 'reload schema';
