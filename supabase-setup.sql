-- =============================================
-- RPAS — ACI Supabase Database Setup
-- Run this entire script in Supabase SQL Editor
-- =============================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'researcher' check (role in ('admin','analyst','researcher')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);

-- 2. SERVICE REQUESTS TABLE
create table if not exists public.service_requests (
  id uuid default gen_random_uuid() primary key,
  researcher_id uuid references public.profiles(id) on delete cascade not null,
  analyst_id uuid references public.profiles(id) on delete set null,
  service_type text not null check (service_type in (
    'Quantitative Data Analysis',
    'Qualitative Data Analysis',
    'Questionnaire Validation',
    'Reliability Test',
    'Manuscript Review',
    'Research Consultation'
  )),
  title text,
  notes text,
  status text not null default 'submitted' check (status in (
    'submitted','under_review','in_progress','for_revision','completed','cancelled'
  )),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. REQUEST UPDATES (status history)
create table if not exists public.request_updates (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references public.service_requests(id) on delete cascade not null,
  status text not null,
  notes text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- 4. MESSAGES
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references public.service_requests(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  created_at timestamptz default now()
);

-- 5. ATTACHMENTS
create table if not exists public.attachments (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references public.service_requests(id) on delete cascade not null,
  filename text not null,
  url text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  is_result boolean default false,
  created_at timestamptz default now()
);

-- 6. NOTIFICATIONS
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  type text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table public.profiles enable row level security;
alter table public.service_requests enable row level security;
alter table public.request_updates enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;
alter table public.notifications enable row level security;

-- PROFILES policies
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'approved')
  );

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Admins can update any profile" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'approved')
  );

create policy "Allow insert on signup" on public.profiles
  for insert with check (auth.uid() = id);

-- SERVICE REQUESTS policies
create policy "Researchers see their own requests" on public.service_requests
  for select using (researcher_id = auth.uid());

create policy "Analysts see assigned requests" on public.service_requests
  for select using (analyst_id = auth.uid());

create policy "Admins see all requests" on public.service_requests
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'approved')
  );

create policy "Researchers can create requests" on public.service_requests
  for insert with check (
    researcher_id = auth.uid() and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'researcher' and status = 'approved')
  );

create policy "Analysts can update assigned requests" on public.service_requests
  for update using (
    analyst_id = auth.uid() and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'analyst' and status = 'approved')
  );

create policy "Admins can update any request" on public.service_requests
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'approved')
  );

-- REQUEST UPDATES policies
create policy "View updates for accessible requests" on public.request_updates
  for select using (
    exists (
      select 1 from public.service_requests sr
      where sr.id = request_id and (
        sr.researcher_id = auth.uid() or
        sr.analyst_id = auth.uid() or
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'approved')
      )
    )
  );

create policy "Analysts and admins can insert updates" on public.request_updates
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('analyst','admin') and status = 'approved')
    or updated_by is null
  );

-- MESSAGES policies
create policy "View messages for accessible requests" on public.messages
  for select using (
    exists (
      select 1 from public.service_requests sr
      where sr.id = request_id and (
        sr.researcher_id = auth.uid() or
        sr.analyst_id = auth.uid() or
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'approved')
      )
    )
  );

create policy "Send messages for accessible requests" on public.messages
  for insert with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.service_requests sr
      where sr.id = request_id and (
        sr.researcher_id = auth.uid() or
        sr.analyst_id = auth.uid()
      )
    )
  );

-- ATTACHMENTS policies
create policy "View attachments for accessible requests" on public.attachments
  for select using (
    exists (
      select 1 from public.service_requests sr
      where sr.id = request_id and (
        sr.researcher_id = auth.uid() or
        sr.analyst_id = auth.uid() or
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'approved')
      )
    )
  );

create policy "Upload attachments for accessible requests" on public.attachments
  for insert with check (
    uploaded_by = auth.uid() and
    exists (
      select 1 from public.service_requests sr
      where sr.id = request_id and (
        sr.researcher_id = auth.uid() or
        sr.analyst_id = auth.uid()
      )
    )
  );

-- NOTIFICATIONS policies
create policy "Users see their own notifications" on public.notifications
  for select using (user_id = auth.uid());

create policy "Users can mark notifications read" on public.notifications
  for update using (user_id = auth.uid());

create policy "Anyone authenticated can insert notifications" on public.notifications
  for insert with check (auth.role() = 'authenticated');

-- =============================================
-- STORAGE BUCKET
-- =============================================
-- Run in Supabase Dashboard > Storage > New Bucket
-- Name: attachments
-- Public: true (for easy file access)
-- OR run:
-- insert into storage.buckets (id, name, public) values ('attachments', 'attachments', true);

-- =============================================
-- REALTIME
-- =============================================
-- Enable realtime for these tables in Supabase Dashboard > Database > Replication
-- or run:
alter publication supabase_realtime add table public.service_requests;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.messages;

-- =============================================
-- FIRST ADMIN SETUP
-- After a user signs in with Google for the first time:
-- Run this to make them admin (replace with their actual UUID from auth.users)
-- =============================================
-- update public.profiles set role = 'admin', status = 'approved' where email = 'your-admin@email.com';
