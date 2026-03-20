create table if not exists public.research_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  tag text not null,
  read_time text not null,
  source text not null,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null default auth.uid()
);

create index if not exists research_posts_created_at_idx
  on public.research_posts (created_at desc);

alter table public.research_posts enable row level security;

create policy "public read research posts"
  on public.research_posts
  for select
  using (true);

create policy "admin insert research posts"
  on public.research_posts
  for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin update research posts"
  on public.research_posts
  for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin delete research posts"
  on public.research_posts
  for delete
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
