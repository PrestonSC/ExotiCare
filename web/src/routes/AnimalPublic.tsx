import { useParams } from 'react-router-dom'

// Phase 2: calls rpc get_animal_public(token). Placeholder for now.
export default function AnimalPublic() {
  const { token } = useParams()
  return (
    <main style={{ padding: 16, maxWidth: 640, margin: '0 auto' }}>
      <h1>Animal</h1>
      <p>Scan page coming in phase 2 (token: {token?.slice(0, 4)}…)</p>
    </main>
  )
}
