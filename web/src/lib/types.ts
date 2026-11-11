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
}

export interface Enclosure {
  id: string
  label: string
  location: string | null
  type: string | null
  notes: string | null
}

export interface Placement {
  id: string
  animal_id: string
  enclosure_id: string
  start_at: string
  end_at: string | null
}
