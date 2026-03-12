-- =============================================
-- RPAS — Phase 1 Database Updates (Safe Version)
-- Run this in Supabase SQL Editor
-- =============================================

-- ============================================================
-- PHASE 1.2 — Add contact_number field to profiles
-- ============================================================
alter table public.profiles
  add column if not exists contact_number text;

-- ============================================================
-- PHASE 1.5 — Security Hardening
-- ============================================================

-- Drop old potentially recursive policies first
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Admins see all requests" on public.service_requests;
drop policy if exists "Admins can update any request" on public.service_requests;

-- Safe non-recursive helper functions
create or replace function public.get_my_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function public.is_approved_admin()
returns boolean as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$ language sql security definer stable;

-- Recreate safe policies
create policy "Admins can view all profiles"
  on public.profiles for select
  using (auth.uid() = id or public.is_approved_admin());

create policy "Admins can update any profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_approved_admin());

create policy "Admins see all requests"
  on public.service_requests for select
  using (
    researcher_id = auth.uid() or
    analyst_id = auth.uid() or
    public.is_approved_admin()
  );

create policy "Admins can update any request"
  on public.service_requests for update
  using (
    analyst_id = auth.uid() or
    public.is_approved_admin()
  );

-- ============================================================
-- REALTIME — Only add tables not already in publication
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'request_updates'
  ) then
    alter publication supabase_realtime add table public.request_updates;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'attachments'
  ) then
    alter publication supabase_realtime add table public.attachments;
  end if;
end $$;

-- ============================================================
-- AUTO-TRIGGER for new signups (ensure it exists)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role, status)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'researcher',
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Done! Phase 1 database updates complete.
-- ============================================================