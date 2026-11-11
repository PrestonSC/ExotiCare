-- Phase 3: care logs. Weights, feedings, sheds, health per animal; cleanings per enclosure.

create table public.weights (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  animal_id   uuid not null references public.animals(id) on delete cascade,
  measured_at timestamptz not null default now(),
  grams       numeric(7,1) not null check (grams > 0),
  notes       text
);

create table public.feedings (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  animal_id    uuid not null references public.animals(id) on delete cascade,
  fed_at       timestamptz not null default now(),
  prey_type    text not null default 'mouse' check (prey_type in ('mouse','rat','asf','chick','other')),
  prey_stage   text,
  prey_weight_g numeric(7,1) check (prey_weight_g is null or prey_weight_g > 0),
  prep         text not null default 'frozen_thawed' check (prep in ('frozen_thawed','pre_killed','live')),
  outcome      text not null default 'ate' check (outcome in ('ate','refused','regurgitated')),
  notes        text
);

create table public.sheds (
  id        uuid primary key default gen_random_uuid(),
  owner_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  shed_at   timestamptz not null default now(),
  complete  boolean not null default true,
  notes     text
);

create table public.cleanings (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  enclosure_id uuid not null references public.enclosures(id) on delete cascade,
  cleaned_at   timestamptz not null default now(),
  kind         text not null default 'spot' check (kind in ('spot','full','substrate','disinfect')),
  notes        text
);

create table public.health_events (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  animal_id   uuid not null references public.animals(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  kind        text not null default 'other'
              check (kind in ('vet_visit','mites','respiratory','retained_shed','injury','medication','other')),
  description text not null,
  treatment   text,
  vet         text,
  cost        numeric(10,2),
  resolved_at timestamptz
);

create index on public.weights (animal_id, measured_at desc);
create index on public.feedings (animal_id, fed_at desc);
create index on public.sheds (animal_id, shed_at desc);
create index on public.cleanings (enclosure_id, cleaned_at desc);
create index on public.health_events (animal_id, occurred_at desc);

do $$
declare t text;
begin
  foreach t in array array['weights','feedings','sheds','cleanings','health_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy owner_all on public.%I for all to authenticated
                      using (owner_id = auth.uid()) with check (owner_id = auth.uid())$p$, t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- Extend the public scan lookup. Still a whitelist: no notes, vet, cost, price or source.
create or replace function public.get_animal_public(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'name',       a.name,
    'species',    a.species,
    'morph',      a.morph,
    'sex',        a.sex,
    'hatch_date', a.hatch_date,
    'status',     a.status,
    'enclosure',  (
      select jsonb_build_object('label', e.label, 'location', e.location)
        from public.placements p
        join public.enclosures e on e.id = p.enclosure_id
       where p.animal_id = a.id and p.end_at is null
    ),
    'weights',    (
      select coalesce(jsonb_agg(jsonb_build_object('at', w.measured_at, 'grams', w.grams)
                                order by w.measured_at), '[]'::jsonb)
        from (select * from public.weights
               where animal_id = a.id order by measured_at desc limit 12) w
    ),
    'last_fed',   (
      select jsonb_build_object('at', f.fed_at, 'prey_type', f.prey_type,
                                'prey_stage', f.prey_stage, 'outcome', f.outcome)
        from public.feedings f where f.animal_id = a.id order by f.fed_at desc limit 1
    ),
    'last_shed',  (
      select jsonb_build_object('at', s.shed_at, 'complete', s.complete)
        from public.sheds s where s.animal_id = a.id order by s.shed_at desc limit 1
    ),
    'last_cleaned', (
      select jsonb_build_object('at', c.cleaned_at, 'kind', c.kind)
        from public.cleanings c
        join public.placements p on p.enclosure_id = c.enclosure_id
       where p.animal_id = a.id and p.end_at is null
       order by c.cleaned_at desc limit 1
    ),
    'health_open', (
      select coalesce(jsonb_agg(jsonb_build_object('kind', h.kind, 'description', h.description,
                                                   'since', h.occurred_at)
                                order by h.occurred_at), '[]'::jsonb)
        from public.health_events h where h.animal_id = a.id and h.resolved_at is null
    )
  )
  from public.animals a
  where a.public_token = p_token
$$;

revoke all on function public.get_animal_public(text) from public;
grant execute on function public.get_animal_public(text) to anon, authenticated;
