import { marked } from 'marked'
import type { Guide } from './types'

export interface TocItem { id: string; text: string }
export type Part = { kind: 'html'; html: string } | { kind: 'fig'; name: string }
export interface Rendered { parts: Part[]; toc: TocItem[] }

const stripTags = (s: string) => s.replace(/<[^>]*>/g, '')
const slugify = (s: string) =>
  stripTags(s).toLowerCase().replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section'

const CALLOUT = /<blockquote>\s*<p><strong>(Tip|Warning|Vet|Safety|Note):<\/strong>/g

/** Markdown (trusted, authored in this repo) to HTML parts plus an "on this page" list. */
export function renderGuide(body: string): Rendered {
  const toc: TocItem[] = []
  const used = new Set<string>()
  const parts: Part[] = []
  const segments = body.split(/^\{\{fig:([\w-]+)\}\}[ \t]*$/m)

  segments.forEach((seg, i) => {
    if (i % 2 === 1) return void parts.push({ kind: 'fig', name: seg })
    let html = marked.parse(seg, { async: false, gfm: true }) as string
    html = html
      .replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, level: string, inner: string) => {
        let id = slugify(inner), n = 2
        while (used.has(id)) id = `${slugify(inner)}-${n++}`
        used.add(id)
        if (level === '2') toc.push({ id, text: stripTags(inner) })
        return `<h${level} id="${id}">${inner}</h${level}>`
      })
      .replace(CALLOUT, (_m, kind: string) => `<blockquote class="callout c-${kind.toLowerCase()}"><p><strong>${kind}:</strong>`)
      .replace(/<table>/g, '<div class="tbl"><table>')
      .replace(/<\/table>/g, '</table></div>')
      .replace(/href="guide:([\w-]+)"/g, 'href="#/guides/$1"')
      .replace(/href="app:(\/[\w/-]*)"/g, 'href="#$1"')
    if (html.trim()) parts.push({ kind: 'html', html })
  })
  return { parts, toc }
}

export const wordCount = (g: Guide) => g.body.replace(/\{\{[^}]*\}\}|[#>*|\-\[\]()]/g, ' ').split(/\s+/).filter(Boolean).length
export const readMinutes = (g: Guide) => Math.max(1, Math.round(wordCount(g) / 200))

/** Lower-cased plain text for the search box. */
export const searchText = (g: Guide) => `${g.title} ${g.blurb} ${stripTags(g.body)}`.toLowerCase()
