import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { animalUrl, qrDataUrl } from '../lib/qr'
import type { Animal } from '../lib/types'

export default function Labels() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['labels'],
    queryFn: async () => {
      const { data, error } = await supabase!
        .from('animals')
        .select('id, name, public_token')
        .neq('status', 'sold')
        .neq('status', 'deceased')
        .order('name')
      if (error) throw error
      const rows = data as Pick<Animal, 'id' | 'name' | 'public_token'>[]
      return Promise.all(
        rows.map(async (a) => ({ ...a, url: animalUrl(a.public_token), qr: await qrDataUrl(animalUrl(a.public_token)) })),
      )
    },
  })

  return (
    <>
      <div className="row between no-print">
        <h1>QR labels</h1>
        <button onClick={() => window.print()}>Print</button>
      </div>
      <p className="muted no-print">
        One label per active animal. Scanning opens a public, read-only page for that animal.
        If a label leaks, rotate that animal's code on its edit page.
      </p>
      {isLoading && <p>Loading…</p>}
      {error && <p className="error">{(error as Error).message}</p>}
      <div className="labels">
        {data?.map((a) => (
          <figure key={a.id} className="label">
            <figcaption>{a.name}</figcaption>
            <img src={a.qr} alt={`QR code for ${a.name}`} />
          </figure>
        ))}
      </div>
    </>
  )
}
