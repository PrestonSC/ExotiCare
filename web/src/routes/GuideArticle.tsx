import { Fragment, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GUIDES, guideBySlug } from '../guides'
import { FIGURES } from '../guides/figures'
import { readMinutes, renderGuide } from '../guides/render'

export default function GuideArticle() {
  const { slug = '' } = useParams()
  const guide = guideBySlug(slug)
  const rendered = useMemo(() => (guide ? renderGuide(guide.body) : null), [guide])
  useEffect(() => { window.scrollTo(0, 0) }, [slug])

  if (!guide || !rendered) {
    return (
      <>
        <p><Link to="/guides">← Care guide</Link></p>
        <h1>Guide not found</h1>
        <p>That guide does not exist. <Link to="/guides">See all guides</Link>.</p>
      </>
    )
  }
  const i = GUIDES.indexOf(guide)
  const prev = GUIDES[i - 1], next = GUIDES[i + 1]
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <article className="guide">
      <p><Link to="/guides">← Care guide</Link></p>
      <h1><span aria-hidden>{guide.emoji}</span> {guide.title}</h1>
      <p className="muted">{guide.blurb} · {readMinutes(guide)} min read</p>

      {rendered.toc.length > 1 && (
        <details className="toc">
          <summary>On this page</summary>
          <ul>{rendered.toc.map((t) => (
            <li key={t.id}><button className="link" onClick={() => jump(t.id)}>{t.text}</button></li>
          ))}</ul>
        </details>
      )}

      {rendered.parts.map((p, n) => {
        if (p.kind === 'html') return <div key={n} className="prose" dangerouslySetInnerHTML={{ __html: p.html }} />
        const Fig = FIGURES[p.name]
        return Fig ? <Fragment key={n}><Fig /></Fragment> : null
      })}

      <nav className="guide-nav">
        {prev ? <Link to={`/guides/${prev.slug}`}>← {prev.title}</Link> : <span />}
        {next ? <Link to={`/guides/${next.slug}`}>{next.title} →</Link> : <span />}
      </nav>
      <p className="muted small disclaimer">
        General care information, not veterinary advice. If your snake seems unwell, contact an exotic-animal vet.
      </p>
    </article>
  )
}
