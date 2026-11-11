export type Sex = 'male' | 'female' | 'unknown'
export type AnimalStatus = 'active' | 'breeder' | 'sold' | 'deceased'

export interface Animal {
  id: string
  name: string
  species: string
  morph: string | null
  sex: Sex
  hatch_date: string | null
  acquired_date: string | null
  source: string | null
  price: number | null
  status: AnimalStatus
  notes: string | null
  public_token: string
  feed_interval_days: number
}

export interface Enclosure {
  id: string
  label: string
  location: string | null
  type: string | null
  notes: string | null
  clean_interval_days: number
}

export interface Placement {
  id: string
  animal_id: string
  enclosure_id: string
  start_at: string
  end_at: string | null
}

export interface Weight { id: string; animal_id: string; measured_at: string; grams: number; notes: string | null }
export interface Feeding {
  id: string; animal_id: string; fed_at: string
  prey_type: 'mouse' | 'rat' | 'asf' | 'chick' | 'other'
  prey_stage: string | null; prey_weight_g: number | null
  prep: 'frozen_thawed' | 'pre_killed' | 'live'
  outcome: 'ate' | 'refused' | 'regurgitated'; notes: string | null
}
export interface Shed { id: string; animal_id: string; shed_at: string; complete: boolean; notes: string | null }
export interface Cleaning { id: string; enclosure_id: string; cleaned_at: string; kind: 'spot' | 'full' | 'substrate' | 'disinfect'; notes: string | null }
export interface HealthEvent {
  id: string; animal_id: string; occurred_at: string
  kind: 'vet_visit' | 'mites' | 'respiratory' | 'retained_shed' | 'injury' | 'medication' | 'other'
  description: string; treatment: string | null; vet: string | null; cost: number | null
  resolved_at: string | null
}
