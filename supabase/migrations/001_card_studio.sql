begin;

create extension if not exists pgcrypto;

create table if not exists public.card_projects (
  id uuid primary key default gen_random_uuid(),
  order_index integer not null,
  country text not null,
  country_code text not null,
  city text not null,
  slug text not null unique,
  topic text not null,
  status text not null default 'queued' check (status in (
    'queued', 'researching', 'needs_review', 'needs_asset', 'revision_requested',
    'approved', 'rendering', 'completed', 'failed'
  )),
  run_date timestamptz,
  current_version integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.card_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.card_projects(id) on delete cascade,
  version integer not null,
  status text not null default 'draft' check (status in ('draft', 'needs_review', 'revision_requested', 'approved', 'superseded')),
  card_data jsonb not null default '{}'::jsonb,
  research jsonb not null default '{}'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  qa_report jsonb not null default '{}'::jsonb,
  caption text not null default '',
  text_version text not null default '',
  created_at timestamptz not null default now(),
  unique(project_id, version)
);

create table if not exists public.card_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.card_projects(id) on delete cascade,
  version_id uuid references public.card_versions(id) on delete set null,
  category text not null,
  local_product_name text,
  korean_product_name text,
  source_url text not null,
  source_type text not null default 'manufacturer',
  usage_note text,
  storage_path text,
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected', 'downloaded')),
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.card_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.card_projects(id) on delete cascade,
  version_id uuid not null references public.card_versions(id) on delete cascade,
  card_number integer check (card_number between 1 and 7),
  action text not null check (action in ('comment', 'revision_request', 'approve_asset', 'reject_asset', 'approve_version')),
  prompt text,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.card_generation_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.card_projects(id) on delete set null,
  trigger_type text not null default 'cron' check (trigger_type in ('cron', 'manual', 'revision')),
  provider text not null default 'groq',
  status text not null default 'started' check (status in ('started', 'completed', 'failed', 'skipped')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.automation_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  timezone text not null default 'Asia/Seoul',
  display_time time not null default '06:00',
  prompt text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists card_projects_queue_idx on public.card_projects(status, order_index);
create index if not exists card_versions_project_idx on public.card_versions(project_id, version desc);
create index if not exists card_assets_project_idx on public.card_assets(project_id, approval_status);
create index if not exists card_reviews_version_idx on public.card_reviews(version_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists card_projects_set_updated_at on public.card_projects;
create trigger card_projects_set_updated_at before update on public.card_projects
for each row execute function public.set_updated_at();

drop trigger if exists automation_settings_set_updated_at on public.automation_settings;
create trigger automation_settings_set_updated_at before update on public.automation_settings
for each row execute function public.set_updated_at();

alter table public.card_projects enable row level security;
alter table public.card_versions enable row level security;
alter table public.card_assets enable row level security;
alter table public.card_reviews enable row level security;
alter table public.card_generation_runs enable row level security;
alter table public.automation_settings enable row level security;

insert into public.card_projects (order_index, country, country_code, city, slug, topic)
values
  (1, '일본', 'japan', '오사카', 'osaka', '여행 중 갑자기 아프거나 다쳤을 때'),
  (2, '베트남', 'vietnam', '다낭', 'danang', '여행 중 갑자기 아프거나 다쳤을 때'),
  (3, '베트남', 'vietnam', '나트랑', 'nhatrang', '여행 중 갑자기 아프거나 다쳤을 때'),
  (4, '필리핀', 'philippines', '세부', 'cebu', '여행 중 갑자기 아프거나 다쳤을 때'),
  (5, '일본', 'japan', '도쿄', 'tokyo', '여행 중 갑자기 아프거나 다쳤을 때')
on conflict (slug) do update set
  order_index = excluded.order_index,
  country = excluded.country,
  country_code = excluded.country_code,
  city = excluded.city,
  topic = excluded.topic;

insert into public.automation_settings (id, enabled, timezone, display_time, prompt)
values (true, true, 'Asia/Seoul', '06:00', '공식 출처를 우선해 대기 중인 첫 도시의 위급정보 카드 초안을 생성한다. 확인되지 않은 정보와 승인되지 않은 약품 이미지는 발행하지 않는다.')
on conflict (id) do nothing;

commit;
