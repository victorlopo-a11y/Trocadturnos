alter table public.events
  add column if not exists priority text,
  add column if not exists status text,
  add column if not exists "lostPieces" integer,
  add column if not exists "reworkCount" integer,
  add column if not exists "downtimeMinutes" integer;

update public.events
set
  priority = coalesce(priority, 'Media'),
  status = coalesce(status, 'Aberto')
where priority is null or status is null;
