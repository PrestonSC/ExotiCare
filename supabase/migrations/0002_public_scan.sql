-- Phase 2: the only thing anonymous users can do is look up one animal by its token.

create function public.get_animal_public(p_token text)
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
    )
  )
  from public.animals a
  where a.public_token = p_token
$$;

revoke all on function public.get_animal_public(text) from public;
grant execute on function public.get_animal_public(text) to anon, authenticated;

-- Replace an animal's token (e.g. if a label leaks). The old QR code stops working at once.
create function public.rotate_animal_token(p_animal uuid)
returns text
language sql
security invoker
as $$
  update public.animals
     set public_token = replace(gen_random_uuid()::text, '-', '')
   where id = p_animal
  returning public_token
$$;

revoke all on function public.rotate_animal_token(uuid) from public, anon;
grant execute on function public.rotate_animal_token(uuid) to authenticated;
