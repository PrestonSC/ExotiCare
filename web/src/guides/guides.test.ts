import { describe, expect, it } from 'vitest'
import { GUIDES } from './index'
import { FIGURES } from './figures'
import { renderGuide, readMinutes } from './render'
import { SHOPPING, TIER_LABEL, allItems } from './shopping'

const APP_PATHS = new Set(['/dashboard', '/animals', '/enclosures', '/trends', '/settings', '/labels', '/guides'])

describe('care guides', () => {
  it('have unique slugs and real content', () => {
    const slugs = GUIDES.map((g) => g.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const g of GUIDES) {
      expect(g.title.length).toBeGreaterThan(3)
      expect(g.blurb.length).toBeGreaterThan(20)
      expect(g.body.length, g.slug).toBeGreaterThan(400)
      expect(readMinutes(g)).toBeGreaterThanOrEqual(1)
    }
  })

  it('only use figures that exist', () => {
    for (const g of GUIDES) {
      for (const m of g.body.matchAll(/^\{\{fig:([\w-]+)\}\}/gm)) expect(FIGURES[m[1]], `${g.slug}: ${m[1]}`).toBeTruthy()
    }
  })

  it('only link to guides and app pages that exist', () => {
    const slugs = new Set(GUIDES.map((g) => g.slug))
    for (const g of GUIDES) {
      for (const m of g.body.matchAll(/\]\(guide:([\w-]+)\)/g)) expect(slugs.has(m[1]), `${g.slug} -> guide:${m[1]}`).toBe(true)
      for (const m of g.body.matchAll(/\]\(app:(\/[\w/-]*)\)/g)) expect(APP_PATHS.has(m[1]), `${g.slug} -> app:${m[1]}`).toBe(true)
    }
  })

  it('render to unique section ids and leave no raw markers behind', () => {
    for (const g of GUIDES) {
      const { parts, toc } = renderGuide(g.body)
      const html = parts.filter((p) => p.kind === 'html').map((p) => (p as { html: string }).html).join('')
      expect(new Set(toc.map((t) => t.id)).size, g.slug).toBe(toc.length)
      expect(html, g.slug).not.toContain('{{')
      expect(html, g.slug).not.toContain('guide:')
      expect(toc.length, g.slug).toBeGreaterThan(0)
    }
  })

  it('turn callouts and tables into styled blocks', () => {
    const { parts } = renderGuide('> **Warning:** careful\n\n| a | b |\n|---|---|\n| 1 | 2 |\n')
    const html = (parts[0] as { html: string }).html
    expect(html).toContain('class="callout c-warning"')
    expect(html).toContain('class="tbl"')
  })

  it('has a shopping list with unique ids, valid tiers and the essentials', () => {
    const items = allItems()
    const ids = items.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const g of SHOPPING) expect(g.items.length, g.id).toBeGreaterThan(0)
    for (const i of items) {
      expect(Object.keys(TIER_LABEL), i.id).toContain(i.tier)
      expect(i.name.length, i.id).toBeGreaterThan(3)
      expect(i.note.length, i.id).toBeGreaterThan(3)
    }
    const names = items.filter((i) => i.tier === 'essential').map((i) => i.name.toLowerCase()).join(' | ')
    for (const must of ['thermostat', 'hygrometer', 'temperature gun', 'tongs', 'scale', 'vet', 'hides']) expect(names, must).toContain(must)
  })
})
