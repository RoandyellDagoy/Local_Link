-- 008_profiles_created_at: track when each account registered (used by the admin dashboard).
alter table profiles add column if not exists created_at timestamptz default now();
update profiles set created_at = coalesce(updated_at, now()) where created_at is null;

notify pgrst, 'reload schema';

