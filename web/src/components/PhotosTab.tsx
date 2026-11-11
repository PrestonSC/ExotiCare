import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { resizeImage } from '../lib/image'
import { fmtDate } from '../lib/format'
import type { Animal } from '../lib/types'

interface Photo { id: string; storage_path: string; caption: string | null; taken_at: string }

export default function PhotosTab({ animal }: { animal: Animal }) {
  const { session } = useAuth()
  const uid = session!.user.id
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const photos = useQuery({
    queryKey: ['photos', animal.id],
    queryFn: async () => {
      const { data, error } = await supabase!.from('photos').select('*').eq('animal_id', animal.id).order('taken_at', { ascending: false })
      if (error) throw error
      const rows = data as Photo[]
      const urls: Record<string, string> = {}
      if (rows.length) {
        const { data: signed, error: e2 } = await supabase!.storage.from('animal-photos')
          .createSignedUrls(rows.map((r) => r.storage_path), 3600)
        if (e2) throw e2
        signed.forEach((s) => { if (s.path && s.signedUrl) urls[s.path] = s.signedUrl })
      }
      return { rows, urls }
    },
  })
  const refresh = () => qc.invalidateQueries({ queryKey: ['photos', animal.id] })

  async function run(name: string, fn: () => Promise<void>) {
    setBusy(name); setError(null)
    try { await fn() } catch (e) { setError((e as Error).message) }
    setBusy(null)
  }

  const upload = (file: File) => run('upload', async () => {
    const blob = await resizeImage(file, 1600, 0.85)
    const path = `${uid}/${animal.id}/${crypto.randomUUID()}.jpg`
    const up = await supabase!.storage.from('animal-photos').upload(path, blob, { contentType: 'image/jpeg' })
    if (up.error) throw up.error
    const ins = await supabase!.from('photos').insert({ animal_id: animal.id, storage_path: path })
    if (ins.error) { await supabase!.storage.from('animal-photos').remove([path]); throw ins.error }
    refresh()
  })

  const remove = (p: Photo) => run(p.id, async () => {
    if (!confirm('Delete this photo?')) return
    const { error } = await supabase!.from('photos').delete().eq('id', p.id)
    if (error) throw error
    await supabase!.storage.from('animal-photos').remove([p.storage_path])
    refresh()
  })

  /** Copy a small version into the public bucket and point the scan page at it. */
  const setProfile = (p: Photo) => run(`profile-${p.id}`, async () => {
    const url = photos.data?.urls[p.storage_path]
    if (!url) throw new Error('Photo not loaded yet')
    const small = await resizeImage(await (await fetch(url)).blob(), 480, 0.8)
    const path = `${uid}/${crypto.randomUUID()}.jpg`
    const up = await supabase!.storage.from('animal-public').upload(path, small, { contentType: 'image/jpeg' })
    if (up.error) throw up.error
    const upd = await supabase!.from('animals').update({ public_photo_path: path }).eq('id', animal.id)
    if (upd.error) throw upd.error
    if (animal.public_photo_path) await supabase!.storage.from('animal-public').remove([animal.public_photo_path])
    qc.invalidateQueries({ queryKey: ['animal', animal.id] })
  })

  const clearProfile = () => run('clear', async () => {
    const { error } = await supabase!.from('animals').update({ public_photo_path: null }).eq('id', animal.id)
    if (error) throw error
    if (animal.public_photo_path) await supabase!.storage.from('animal-public').remove([animal.public_photo_path])
    qc.invalidateQueries({ queryKey: ['animal', animal.id] })
  })

  return (
    <>
      <div className="stack card">
        <input ref={fileRef} type="file" accept="image/*" hidden
               onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
        <button disabled={busy !== null} onClick={() => fileRef.current?.click()}>
          {busy === 'upload' ? 'Uploading…' : 'Add photo'}
        </button>
        <p className="muted">
          Photos are private. "Use on QR page" makes a small copy that anyone who scans the code can see.
          {animal.public_photo_path && <> A profile photo is currently shown on the QR page. <button className="link" onClick={clearProfile}>Remove it</button></>}
        </p>
        {error && <p className="error">{error}</p>}
      </div>
      {photos.data?.rows.length === 0 && <p className="muted">No photos yet.</p>}
      <div className="photos">
        {photos.data?.rows.map((p) => (
          <figure key={p.id}>
            <img src={photos.data.urls[p.storage_path]} alt={`${animal.name}, ${fmtDate(p.taken_at)}`} loading="lazy" />
            <figcaption className="muted">{fmtDate(p.taken_at)}</figcaption>
            <div className="row">
              <button className="secondary" disabled={busy !== null} onClick={() => setProfile(p)}>
                {busy === `profile-${p.id}` ? '…' : 'Use on QR page'}
              </button>
              <button className="link" disabled={busy !== null} onClick={() => remove(p)}>Delete</button>
            </div>
          </figure>
        ))}
      </div>
    </>
  )
}
