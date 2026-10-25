create table if not exists categories (
  id bigint generated always as identity primary key,
  slug text unique not null,
  name text not null,
  image_url text,
  sort_order int default 0
);

create table if not exists products (
  id bigint generated always as identity primary key,
  name text not null,
  price numeric(10,2) not null,
  image_url text,
  seller text,
  category_slug text references categories(slug),
  created_at timestamptz default now()
);

alter table categories enable row level security;
alter table products enable row level security;

create policy "public read categories" on categories for select using (true);
create policy "public read products" on products for select using (true);

insert into categories (slug, name, sort_order) values
  ('fresh-produce', 'Fresh Produce', 1),
  ('food-beverages', 'Food and Beverages', 2),
  ('handmade-crafts', 'Handmade Crafts', 3),
  ('home-living', 'Home and Living', 4),
  ('fashion-accessories', 'Fashion and Accessories', 5),
  ('other', 'Other Products', 6)
on conflict (slug) do nothing;
