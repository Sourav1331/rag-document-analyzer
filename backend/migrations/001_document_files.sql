create table if not exists public.document_files (
    id uuid primary key,
    user_id uuid null,
    session_id text not null,
    analyzer_type text not null,
    original_filename text not null,
    storage_path text null,
    mime_type text null,
    file_size bigint not null default 0,
    status text not null check (status in ('uploaded', 'processing', 'ready', 'failed', 'deleting', 'deleted')),
    chunk_count integer not null default 0,
    error_message text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    last_accessed_at timestamptz not null default now()
);

create index if not exists document_files_lookup_idx
    on public.document_files (session_id, analyzer_type, id);

create index if not exists document_files_status_idx
    on public.document_files (status, updated_at);

create index if not exists document_files_user_idx
    on public.document_files (user_id, updated_at)
    where user_id is not null;
