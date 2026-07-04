-- ONLYOFFICE MVP: document metadata, saved versions, and storage bucket.

create table if not exists public.onlyoffice_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'מסמך חדש',
  file_name text not null,
  file_type text not null default 'docx',
  mime_type text not null default 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  storage_path text not null,
  document_key text not null,
  status text not null default 'draft',
  version integer not null default 1,
  size_bytes bigint not null default 0,
  client_id uuid null references public.clients(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade,
  last_opened_at timestamptz null,
  saved_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.onlyoffice_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.onlyoffice_documents(id) on delete cascade,
  version integer not null,
  storage_path text not null,
  size_bytes bigint not null default 0,
  saved_by uuid null references auth.users(id) on delete set null,
  callback_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(document_id, version)
);

create index if not exists idx_onlyoffice_documents_created_by
  on public.onlyoffice_documents(created_by, updated_at desc);

create index if not exists idx_onlyoffice_documents_client_id
  on public.onlyoffice_documents(client_id);

create index if not exists idx_onlyoffice_document_versions_document_id
  on public.onlyoffice_document_versions(document_id, version desc);

create or replace function public.touch_onlyoffice_documents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_onlyoffice_documents_updated_at on public.onlyoffice_documents;
create trigger trg_touch_onlyoffice_documents_updated_at
before update on public.onlyoffice_documents
for each row
execute function public.touch_onlyoffice_documents_updated_at();

alter table public.onlyoffice_documents enable row level security;
alter table public.onlyoffice_document_versions enable row level security;

drop policy if exists "Users can view own onlyoffice documents" on public.onlyoffice_documents;
create policy "Users can view own onlyoffice documents"
on public.onlyoffice_documents for select
using (created_by = auth.uid());

drop policy if exists "Users can insert own onlyoffice documents" on public.onlyoffice_documents;
create policy "Users can insert own onlyoffice documents"
on public.onlyoffice_documents for insert
with check (created_by = auth.uid());

drop policy if exists "Users can update own onlyoffice documents" on public.onlyoffice_documents;
create policy "Users can update own onlyoffice documents"
on public.onlyoffice_documents for update
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "Users can delete own onlyoffice documents" on public.onlyoffice_documents;
create policy "Users can delete own onlyoffice documents"
on public.onlyoffice_documents for delete
using (created_by = auth.uid());

drop policy if exists "Users can view own onlyoffice versions" on public.onlyoffice_document_versions;
create policy "Users can view own onlyoffice versions"
on public.onlyoffice_document_versions for select
using (
  exists (
    select 1
    from public.onlyoffice_documents d
    where d.id = onlyoffice_document_versions.document_id
      and d.created_by = auth.uid()
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'onlyoffice-documents',
  'onlyoffice-documents',
  false,
  52428800,
  array[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/pdf'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage writes are handled by Edge Functions with service role because the
-- project migration runner cannot own/create policies on storage.objects.
