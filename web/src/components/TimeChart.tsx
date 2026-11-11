import { useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react'

export interface Series { id: string; name: string; color: string; points: { t: number; v: number }[] }
export interface Marker { t: number; kind: 'ate' | 'refused' | 'regurgitated'; label: string }

const W = 360, ML = 46, MR = 14, MT = 10
const MARKER_NAME = { ate: 'Ate', refused: 'Refused', regurgitated: 'Regurgitated' } as const

function niceTicks(lo: number, hi: number, n = 4): number[] {
  if (lo === hi) { lo -= 1; hi += 1 }
  const raw = (hi - lo) / n
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = ([1, 2, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag
  const out: number[] = []
  let v = Math.floor(lo / step) * step
  out.push(+v.toFixed(6))
  while (v < hi - step * 0.001) { v += step; out.push(+v.toFixed(6)) } // last tick must cover the max
  return out
}

const fmtNum = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 1 })

/**
 * Line chart over time: 1 or more series on ONE axis, optional event markers along the bottom
 * (distinguished by shape, not colour), crosshair + tooltip on hover/keyboard, and a table view.
 */
export default function TimeChart({
  series, markers = [], unit = '', title,
}: { series: Series[]; markers?: Marker[]; unit?: string; title: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const H = markers.length ? 230 : 200
  const MB = markers.length ? 48 : 28
  const plotW = W - ML - MR, plotH = H - MT - MB

  const geo = useMemo(() => {
    const pts = series.flatMap((s) => s.points)
    if (pts.length === 0) return null
    const times = [...new Set([...pts.map((p) => p.t), ...markers.map((m) => m.t)])].sort((a, b) => a - b)
    let t0 = times[0], t1 = times[times.length - 1]
    if (t0 === t1) { t0 -= 86_400_000; t1 += 86_400_000 }
    const vs = pts.map((p) => p.v)
    const ticks = niceTicks(Math.min(...vs), Math.max(...vs))
    const y0 = ticks[0], y1 = ticks[ticks.length - 1]
    const X = (t: number) => ML + ((t - t0) / (t1 - t0)) * plotW
    const Y = (v: number) => MT + plotH - ((v - y0) / (y1 - y0)) * plotH
    const dataTimes = [...new Set(pts.map((p) => p.t))].sort((a, b) => a - b)
    return { t0, t1, ticks, X, Y, dataTimes }
  }, [series, markers, plotW, plotH])

  if (!geo) return <p className="muted">No data yet.</p>
  const { t0, t1, ticks, X, Y, dataTimes } = geo
  const multiYear = t1 - t0 > 330 * 86_400_000
  const fmtT = (t: number, long = false) =>
    new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(multiYear || long ? { year: 'numeric' } : {}) })
  const xTicks = [0, 1, 2, 3].map((i) => t0 + ((t1 - t0) * i) / 3)

  const nearestTime = (t: number) => dataTimes.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a))
  function onMove(e: PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * W
    setHover(nearestTime(t0 + ((x - ML) / plotW) * (t1 - t0)))
  }
  function onKey(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const i = hover === null ? dataTimes.length - 1 : dataTimes.indexOf(hover) + (e.key === 'ArrowRight' ? 1 : -1)
    setHover(dataTimes[Math.max(0, Math.min(dataTimes.length - 1, i))])
  }

  const readout = hover === null ? [] : series.flatMap((s) => {
    if (s.points.length === 0) return []
    const p = s.points.reduce((a, b) => (Math.abs(b.t - hover) < Math.abs(a.t - hover) ? b : a))
    return [{ s, p }]
  })
  const flip = hover !== null && X(hover) > W * 0.6
  const markerKinds = [...new Set(markers.map((m) => m.kind))]

  return (
    <figure className="tchart">
      <div className="tchart-frame" onPointerLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} tabIndex={0}
             onPointerMove={onMove} onPointerDown={onMove} onKeyDown={onKey} onBlur={() => setHover(null)}>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={ML} x2={W - MR} y1={Y(v)} y2={Y(v)} className="grid" />
              <text x={ML - 6} y={Y(v)} textAnchor="end" dominantBaseline="middle" className="axis">{fmtNum(v)}</text>
            </g>
          ))}
          {xTicks.map((t, i) => (
            <text key={i} x={X(t)} y={MT + plotH + 14} className="axis"
                  textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}>{fmtT(t)}</text>
          ))}
          {hover !== null && <line x1={X(hover)} x2={X(hover)} y1={MT} y2={MT + plotH} className="cross" />}
          {series.map((s) => (
            <g key={s.id}>
              <path d={s.points.map((p, i) => `${i ? 'L' : 'M'}${X(p.t).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ')}
                    fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {s.points.map((p, i) => (
                <circle key={i} cx={X(p.t)} cy={Y(p.v)} r={4} fill={s.color} className="ring" />
              ))}
            </g>
          ))}
          {markers.map((m, i) => {
            const x = X(m.t), y = MT + plotH + 34
            return m.kind === 'ate' ? <circle key={i} cx={x} cy={y} r="4" className="mk-fill" />
              : m.kind === 'refused' ? <circle key={i} cx={x} cy={y} r="4" className="mk-hollow" />
              : <path key={i} d={`M${x},${y - 5} L${x + 5},${y} L${x},${y + 5} L${x - 5},${y} Z`} className="mk-fill" />
          })}
        </svg>
        {hover !== null && (
          <div className="tip" style={{ left: `${(X(hover) / W) * 100}%`, transform: flip ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)' }}>
            <div className="muted">{fmtT(hover, true)}</div>
            {readout.map(({ s, p }) => (
              <div key={s.id} className="tip-row">
                <span className="key" style={{ background: s.color }} />
                <strong>{fmtNum(p.v)}{unit}</strong>
                <span className="muted">{series.length > 1 ? s.name : ''}{p.t !== hover ? ` · ${fmtT(p.t)}` : ''}</span>
              </div>
            ))}
            {markers.filter((m) => m.t === hover).map((m, i) => (
              <div key={i} className="muted">{MARKER_NAME[m.kind]}{m.label ? `: ${m.label}` : ''}</div>
            ))}
          </div>
        )}
      </div>
      {(series.length > 1 || markerKinds.length > 0) && (
        <figcaption className="legend">
          {series.length > 1 && series.map((s) => (
            <span key={s.id}><i className="key" style={{ background: s.color }} /> {s.name}</span>
          ))}
          {markerKinds.map((k) => (
            <span key={k}>
              <svg width="12" height="12" viewBox="-6 -6 12 12" aria-hidden>
                {k === 'ate' ? <circle r="4" className="mk-fill" /> : k === 'refused' ? <circle r="4" className="mk-hollow" />
                  : <path d="M0,-5 L5,0 L0,5 L-5,0 Z" className="mk-fill" />}
              </svg> {MARKER_NAME[k]}
            </span>
          ))}
        </figcaption>
      )}
      <details className="muted">
        <summary>Table view</summary>
        <table className="data">
          <thead><tr><th>Date</th>{series.length > 1 && <th>Series</th>}<th>Value</th></tr></thead>
          <tbody>
            {series.flatMap((s) => s.points.map((p) => ({ s, p })))
              .sort((a, b) => b.p.t - a.p.t).slice(0, 60)
              .map(({ s, p }, i) => (
                <tr key={i}><td>{fmtT(p.t, true)}</td>{series.length > 1 && <td>{s.name}</td>}<td>{fmtNum(p.v)}{unit}</td></tr>
              ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
