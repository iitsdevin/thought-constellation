-- Thought Constellation database schema
-- Run this in the Supabase SQL editor before starting the app.

create extension if not exists vector;
create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  title text,
  original_text text not null,
  user_expansion text default '',
  ai_summary text,
  ai_context text,
  reflective_questions text[] default '{}',
  themes text[] default '{}',
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  ai_synthesis text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists app_settings (
  id boolean primary key default true check (id = true),
  openai_api_key text,
  openai_model text default 'gpt-4.1-mini',
  openai_embedding_model text default 'text-embedding-3-small',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists note_categories (
  note_id uuid not null references notes(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  confidence double precision default 1,
  added_by text not null default 'user' check (added_by in ('user', 'ai')),
  created_at timestamptz not null default now(),
  primary key (note_id, category_id)
);

create table if not exists note_tags (
  note_id uuid not null references notes(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (note_id, tag_id)
);

create table if not exists note_links (
  id uuid primary key default gen_random_uuid(),
  source_note_id uuid not null,
  target_note_id uuid not null,
  relationship_type text not null default 'related',
  reason text,
  confidence double precision,
  created_at timestamptz not null default now(),
  constraint note_links_source_note_id_fkey foreign key (source_note_id) references notes(id) on delete cascade,
  constraint note_links_target_note_id_fkey foreign key (target_note_id) references notes(id) on delete cascade,
  constraint note_links_not_self check (source_note_id <> target_note_id),
  constraint note_links_unique_direction unique (source_note_id, target_note_id)
);

create index if not exists notes_embedding_idx on notes using hnsw (embedding vector_cosine_ops);
create index if not exists note_links_source_idx on note_links(source_note_id);
create index if not exists note_links_target_idx on note_links(target_note_id);
create index if not exists note_categories_note_idx on note_categories(note_id);
create index if not exists note_categories_category_idx on note_categories(category_id);

do $$
begin
  if to_regclass('public.notes') is not null and not exists (
    select 1 from pg_trigger where tgname = 'notes_set_updated_at'
  ) then
    create trigger notes_set_updated_at
    before update on notes
    for each row execute function set_updated_at();
  end if;

  if to_regclass('public.categories') is not null and not exists (
    select 1 from pg_trigger where tgname = 'categories_set_updated_at'
  ) then
    create trigger categories_set_updated_at
    before update on categories
    for each row execute function set_updated_at();
  end if;

  if to_regclass('public.app_settings') is not null and not exists (
    select 1 from pg_trigger where tgname = 'app_settings_set_updated_at'
  ) then
    create trigger app_settings_set_updated_at
    before update on app_settings
    for each row execute function set_updated_at();
  end if;
end;
$$;

create or replace function match_notes(
  query_embedding vector(1536),
  match_count int default 6
)
returns table (
  id uuid,
  title text,
  ai_summary text,
  similarity double precision
)
language sql stable
as $$
  select
    notes.id,
    notes.title,
    notes.ai_summary,
    1 - (notes.embedding <=> query_embedding) as similarity
  from notes
  where notes.embedding is not null
  order by notes.embedding <=> query_embedding
  limit match_count;
$$;
