import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GUIDES } from '../guides'
import { readMinutes, searchText } from '../guides/render'

export default function Guides() {
  const [q, setQ] = useState('')
  const index = useMemo(() => GUIDES.map((g) => ({ g, text: searchText(g) })), [])
  const query = q.trim().toLowerCase()
  const words = query.split(/\s+/).filter(Boolean)
  const score = (g: (typeof GUIDES)[number], text: string) =>
    words.reduce((n, w) => n + (g.title.toLowerCase().includes(w) ? 4 : 0) + (g.blurb.toLowerCase().includes(w) ? 2 : 0) + (text.includes(w) ? 1 : 0), 0)
  const shown = words.length
    ? index.filter(({ text }) => words.every((w) => text.includes(w)))
        .sort((a, b) => score(b.g, b.text) - score(a.g, a.text)).map(({ g }) => g)
    : GUIDES
  const quick = GUIDES.find((g) => g.slug === 'cheat-sheet')!

  return (
    <>
      <h1>Care guide</h1>
      <p className="muted">Everything about keeping a ball python, in short sections. Search or pick a topic.</p>
      <input type="search" placeholder="Search: mites, humidity, bites, feeding…" value={q} onChange={(e) => setQ(e.target.value)}
             aria-label="Search the care guide" />

      {!words.length && (
        <Link to={`/guides/${quick.slug}`} className="guide-hero">
          <span className="emoji" aria-hidden>{quick.emoji}</span>
          <span><strong>{quick.title}</strong><br /><span className="muted">{quick.blurb}</span></span>
        </Link>
      )}

      {words.length > 0 && <p className="muted">{shown.length} result{shown.length === 1 ? '' : 's'}</p>}
      <ul className="cards guide-list">
        {shown.filter((g) => words.length || g.slug !== 'cheat-sheet').map((g) => (
          <li key={g.slug}>
            <Link to={`/guides/${g.slug}`}>
              <span className="emoji" aria-hidden>{g.emoji}</span>
              <span className="grow">
                <strong>{g.title}</strong>
                <span className="muted">{g.blurb}</span>
                <span className="muted small">{readMinutes(g)} min read</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {words.length > 0 && shown.length === 0 && <p>No guide matches that. Try a simpler word, like "feeding" or "shed".</p>}

      <p className="muted small disclaimer">
        General care information gathered from common keeper and veterinary practice. It is not veterinary advice.
        If your snake seems unwell, contact an exotic-animal vet.
      </p>
    </>
  )
}
