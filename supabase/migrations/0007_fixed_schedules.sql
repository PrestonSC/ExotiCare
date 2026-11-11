-- Fixed planned schedules.
-- Each schedule has an "anchor" date: planned days fall on the anchor plus whole intervals. Doing something
-- late no longer shifts the following planned days (a feeding done a day late on a 7-day schedule is followed
-- by one 6 days later). Existing rows start their grid at their most recent completion, so nothing jumps.

alter table public.animals
  add column feed_anchor_date date not null default current_date;
alter table public.enclosures
  add column spot_anchor_date date not null default current_date,
  add column full_anchor_date date not null default current_date;

update public.animals a
   set feed_anchor_date = coalesce(
     (select (max(f.fed_at) at time zone 'UTC')::date
        from public.feedings f where f.animal_id = a.id and f.outcome = 'ate'),
     current_date);

update public.enclosures e
   set spot_anchor_date = coalesce(
         (select (max(c.cleaned_at) at time zone 'UTC')::date
            from public.cleanings c where c.enclosure_id = e.id), current_date),
       full_anchor_date = coalesce(
         (select (max(c.cleaned_at) at time zone 'UTC')::date
            from public.cleanings c
           where c.enclosure_id = e.id and c.kind in ('full', 'substrate', 'disinfect')), current_date);

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
    'feed_anchor_date', a.feed_anchor_date,
    'last_shed',  (
      select jsonb_build_object('at', s.shed_at, 'complete', s.complete)
        from public.sheds s where s.animal_id = a.id order by s.shed_at desc limit 1
    ),
    -- Cleaning is tracked on two schedules. A full-level clean (full / substrate / disinfect)
    -- also counts as a spot clean; a spot clean never counts as a full clean.
    'last_spot_clean', (
      select max(c.cleaned_at)
        from public.cleanings c
        join public.placements p on p.enclosure_id = c.enclosure_id
       where p.animal_id = a.id and p.end_at is null
    ),
    'last_full_clean', (
      select max(c.cleaned_at)
        from public.cleanings c
        join public.placements p on p.enclosure_id = c.enclosure_id
       where p.animal_id = a.id and p.end_at is null
         and c.kind in ('full', 'substrate', 'disinfect')
    ),
    'spot_anchor_date', (
      select e.spot_anchor_date
        from public.placements p join public.enclosures e on e.id = p.enclosure_id
       where p.animal_id = a.id and p.end_at is null
    ),
    'full_anchor_date', (
      select e.full_anchor_date
        from public.placements p join public.enclosures e on e.id = p.enclosure_id
       where p.animal_id = a.id and p.end_at is null
    ),
    'spot_clean_interval_days', (
      select e.spot_clean_interval_days
        from public.placements p join public.enclosures e on e.id = p.enclosure_id
       where p.animal_id = a.id and p.end_at is null
    ),
    'full_clean_interval_days', (
      select e.full_clean_interval_days
        from public.placements p join public.enclosures e on e.id = p.enclosure_id
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
