-- =============================================
-- RPAS — Phase 1 Database Updates
-- Run this in Supabase SQL Editor
-- =============================================

-- ============================================================
-- PHASE 1.2 — Add contact_number field to profiles
-- ============================================================
alter table public.profiles
  add column if not exists contact_number text;

-- ============================================================
-- PHASE 1.3 — Email Notifications via Supabase Edge Functions
-- The notifications table already exists.
-- To enable actual EMAIL delivery, set up Supabase Edge Functions:
--
-- Option A (Recommended — Free):
--   Use Supabase Database Webhooks + Resend.com free tier (3000 emails/month)
--   1. Create account at resend.com, get API key
--   2. Supabase Dashboard → Edge Functions → New Function "send-email"
--   3. Set webhook trigger on notifications table INSERT
--
-- Option B (Supabase built-in):
--   Supabase Dashboard → Authentication → Email Templates
--   Customize the "Confirm signup" and "Magic Link" templates
-- ============================================================

-- ============================================================
-- PHASE 1.4 — Email Verification
-- Enable in Supabase Dashboard:
--   Authentication → Settings → Enable email confirmations = ON
--   Authentication → Email Templates → Confirm signup → customize message
--
-- The auth.js requireAuth() function now checks email_confirmed_at
-- and redirects unverified users back to login with ?msg=verify
-- ============================================================

-- ============================================================
-- PHASE 1.5 — Security Hardening
-- ============================================================

-- Drop old potentially recursive policies and replace with safe ones
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Admins see all requests" on public.service_requests;
drop policy if exists "Admins can update any request" on public.service_requests;

-- Safe non-recursive role helper (idempotent)
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

-- Profiles: safe admin policies using helper function
create policy "Admins can view all profiles"
  on public.profiles for select
  using (auth.uid() = id or public.is_approved_admin());

create policy "Admins can update any profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_approved_admin());

-- Service requests: safe admin policies
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

-- Enable realtime on notifications, profiles, request_updates, attachments
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.request_updates;
alter publication supabase_realtime add table public.attachments;

-- ============================================================
-- PHASE 1.4 — Auto-trigger for new signups (ensure it exists)
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
