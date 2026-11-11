export interface Point { at: string; value: number }

/** Minimal dependency-free line chart. `compact` drops the axis labels (for the scan page). */
export default function LineChart({ points, unit = '', compact = false }: { points: Point[]; unit?: string; compact?: boolean }) {
  if (points.length === 0) return null
  const W = 300, H = compact ? 60 : 130, pad = 8
  const xs = points.map((p) => new Date(p.at).getTime())
  const ys = points.map((p) => p.value)
  const x0 = Math.min(...xs), x1 = Math.max(...xs)
  let y0 = Math.min(...ys), y1 = Math.max(...ys)
  if (y0 === y1) { y0 -= 1; y1 += 1 }
  const X = (t: number) => pad + (x1 === x0 ? (W - 2 * pad) / 2 : ((t - x0) / (x1 - x0)) * (W - 2 * pad))
  const Y = (v: number) => H - pad - ((v - y0) / (y1 - y0)) * (H - 2 * pad)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(p.value).toFixed(1)}`).join(' ')
  const short = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Line chart">
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
        {points.map((p, i) => <circle key={i} cx={X(xs[i])} cy={Y(p.value)} r="3" fill="var(--accent)" />)}
      </svg>
      {!compact && (
        <figcaption className="muted row between">
          <span>{short(x0)}</span>
          <span>{Math.min(...ys)}–{Math.max(...ys)}{unit}</span>
          <span>{short(x1)}</span>
        </figcaption>
      )}
    </figure>
  )
}
