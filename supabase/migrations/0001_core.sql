-- Phase 1: animals, enclosures, placements. Single-owner, RLS everywhere.
-- Run in the Supabase SQL editor (or `supabase db push`).

create table public.animals (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name          text not null,
  species       text not null default 'Python regius',
  morph         text,
  sex           text not null default 'unknown' check (sex in ('male','female','unknown')),
  hatch_date    date,
  acquired_date date,
  source        text,
  price         numeric(10,2),
  status        text not null default 'active'
                check (status in ('active','breeder','sold','deceased')),
  notes         text,
  -- Used by the QR code in phase 2. 122 bits of randomness, URL-safe.
  public_token  text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at    timestamptz not null default now()
);

create table public.enclosures (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label      text not null,
  location   text,
  type       text,
  notes      text,
  created_at timestamptz not null default now()
);

create table public.placements (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  animal_id    uuid not null references public.animals(id) on delete cascade,
  enclosure_id uuid not null references public.enclosures(id) on delete cascade,
  start_at     timestamptz not null default now(),
  end_at       timestamptz,
  created_at   timestamptz not null default now()
);

-- At most one current placement per animal and per enclosure.
create unique index placements_one_open_per_animal
  on public.placements(animal_id) where end_at is null;
create unique index placements_one_open_per_enclosure
  on public.placements(enclosure_id) where end_at is null;

-- RLS: only the owner can touch rows; anon gets nothing.
alter table public.animals    enable row level security;
alter table public.enclosures enable row level security;
alter table public.placements enable row level security;

create policy owner_all on public.animals
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all on public.enclosures
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all on public.placements
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

revoke all on public.animals, public.enclosures, public.placements from anon;

-- Move an animal to an enclosure (or out of any, when p_enclosure is null) atomically.
-- SECURITY INVOKER: RLS applies, so it only affects the caller's rows.
create function public.move_animal(p_animal uuid, p_enclosure uuid)
returns void
language plpgsql
security invoker
as $$
begin
  update public.placements
     set end_at = now()
   where animal_id = p_animal and end_at is null;
  if p_enclosure is not null then
    insert into public.placements(animal_id, enclosure_id) values (p_animal, p_enclosure);
  end if;
end;
$$;

revoke all on function public.move_animal(uuid, uuid) from public, anon;
grant execute on function public.move_animal(uuid, uuid) to authenticated;
