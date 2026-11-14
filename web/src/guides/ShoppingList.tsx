import { useEffect, useState } from 'react'
import { SHOPPING, TIER_LABEL } from './shopping'

const KEY = 'exoticare.shopping.v1'

function load(): Set<string> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return new Set<string>(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

/** Interactive checklist. Ticks are remembered on this device only. */
export default function ShoppingList() {
  const [checked, setChecked] = useState<Set<string>>(load)
  const [essentialsOnly, setEssentialsOnly] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify([...checked])) } catch { /* storage unavailable */ }
  }, [checked])

  const groups = SHOPPING
    .map((g) => ({ ...g, items: g.items.filter((i) => !essentialsOnly || i.tier === 'essential') }))
    .filter((g) => g.items.length > 0)
  const visible = groups.flatMap((g) => g.items)
  const done = visible.filter((i) => checked.has(i.id)).length
  const pct = visible.length ? Math.round((done / visible.length) * 100) : 0

  const toggle = (id: string) =>
    setChecked((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })

  async function copy() {
    const lines = ['ExotiCare: ball python shopping list', '']
    for (const g of groups) {
      const left = g.items.filter((i) => !checked.has(i.id))
      if (!left.length) continue
      lines.push(g.title.toUpperCase())
      for (const i of left) lines.push(`[ ] ${i.name}${i.tier === 'essential' ? '' : ` (${TIER_LABEL[i.tier].toLowerCase()})`}`)
      lines.push('')
    }
    if (lines.length === 2) lines.push('Everything is ticked off.')
    try {
      await navigator.clipboard.writeText(lines.join('\n').trim())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy your list:', lines.join('\n'))
    }
  }

  return (
    <div className="shop">
      <div className="shop-controls no-print">
        <label className="check shop-toggle">
          <input type="checkbox" checked={essentialsOnly} onChange={(e) => setEssentialsOnly(e.target.checked)} />
          Essentials only
        </label>
        <div className="row">
          <button className="secondary" onClick={copy}>{copied ? 'Copied' : 'Copy what is left'}</button>
          <button className="secondary" onClick={() => window.print()}>Print</button>
          <button className="secondary" onClick={() => { if (checked.size === 0 || confirm('Clear all ticks?')) setChecked(new Set()) }}>Clear ticks</button>
        </div>
      </div>
      <div className="shop-sticky no-print">
        <div className="shop-count"><strong>{done} of {visible.length}</strong> ticked</div>
        <div className="shop-track" role="progressbar" aria-valuemin={0} aria-valuemax={visible.length} aria-valuenow={done} aria-label="Shopping list progress">
          <div className="shop-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {groups.map((g) => {
        const gdone = g.items.filter((i) => checked.has(i.id)).length
        return (
          <section key={g.id} className="shop-group">
            <h3>{g.title} <span className="muted small">{gdone}/{g.items.length}</span></h3>
            <ul>
              {g.items.map((i) => (
                <li key={i.id}>
                  <label className={`shop-item${checked.has(i.id) ? ' done' : ''}`}>
                    <input type="checkbox" checked={checked.has(i.id)} onChange={() => toggle(i.id)} />
                    <span className="shop-text">
                      <span className="shop-name">{i.name} <span className={`shop-tier tier-${i.tier}`}>{TIER_LABEL[i.tier]}</span></span>
                      <span className="shop-note">{i.note}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
