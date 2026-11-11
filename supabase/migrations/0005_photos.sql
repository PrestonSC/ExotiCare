-- Phase 5: photos. Originals live in a private bucket (owner only). A small profile
-- copy lives in a public bucket under an unguessable name; only the scan lookup reveals it.

alter table public.animals add column public_photo_path text;

create table public.photos (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  animal_id    uuid not null references public.animals(id) on delete cascade,
  storage_path text not null,
  caption      text,
  taken_at     timestamptz not null default now()
);
create index on public.photos (animal_id, taken_at desc);

alter table public.photos enable row level security;
create policy owner_all on public.photos for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
revoke all on public.photos from anon;

insert into storage.buckets (id, name, public) values
  ('animal-photos', 'animal-photos', false),
  ('animal-public', 'animal-public', true)
on conflict (id) do nothing;

-- Object paths are "<owner uid>/…". Only that owner can read or write the private bucket.
-- The public bucket serves files by URL, so it has no read policy: nobody can list it.
create policy "photos: owner read" on storage.objects for select to authenticated
  using (bucket_id = 'animal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos: owner insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('animal-photos', 'animal-public') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos: owner delete" on storage.objects for delete to authenticated
  using (bucket_id in ('animal-photos', 'animal-public') and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.get_animal_public(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'name',       a.name,
    'photo_path', a.public_photo_path,
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
    'last_ate_at', (
      select max(f.fed_at) from public.feedings f where f.animal_id = a.id and f.outcome = 'ate'
    ),
    'feed_interval_days', a.feed_interval_days,
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
    'clean_interval_days', (
      select e.clean_interval_days
        from public.placements p
        join public.enclosures e on e.id = p.enclosure_id
       where p.animal_id = a.id and p.end_at is null
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
