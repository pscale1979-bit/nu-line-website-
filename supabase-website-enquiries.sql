-- NÜ-LINE Website Enquiries — run once in Supabase SQL Editor
create extension if not exists pgcrypto;

create table if not exists public.website_enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  status text not null default 'new' check (status in ('new','reviewing','converted','closed','spam')),
  source text not null default 'website',
  name text not null,
  company text,
  email text not null,
  phone text not null,
  project_location text,
  project_type text,
  budget text,
  timescale text,
  systems text[] not null default '{}',
  project_details text not null,
  consent boolean not null default false,
  page_url text,
  user_agent text,
  crm_contact_id text,
  crm_opportunity_id text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists website_enquiries_submitted_at_idx on public.website_enquiries (submitted_at desc);
create index if not exists website_enquiries_status_idx on public.website_enquiries (status);

alter table public.website_enquiries enable row level security;

-- Public visitors may submit a new enquiry, but cannot read, update or delete anything.
drop policy if exists "Public can submit website enquiries" on public.website_enquiries;
create policy "Public can submit website enquiries"
on public.website_enquiries for insert
to anon
with check (
  status = 'new'
  and source = 'website'
  and consent = true
  and length(name) between 2 and 120
  and length(email) between 5 and 180
  and length(phone) between 5 and 50
  and length(project_details) between 10 and 4000
);

-- Signed-in CRM users can read and manage enquiries.
drop policy if exists "Authenticated users manage website enquiries" on public.website_enquiries;
create policy "Authenticated users manage website enquiries"
on public.website_enquiries for all
to authenticated
using (true)
with check (true);

revoke all on public.website_enquiries from anon;
grant insert on public.website_enquiries to anon;
grant select, insert, update, delete on public.website_enquiries to authenticated;
