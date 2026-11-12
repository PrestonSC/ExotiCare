import type { ReactNode } from 'react'
import { SNAKES } from './snakes'

/** Diagrams for the care guides. All drawn here as SVG so they work offline and never break from a dead image link. */

function Fig({ label, caption, vb, children }: { label: string; caption?: string; vb: string; children: ReactNode }) {
  return (
    <figure className="gfig">
      <svg viewBox={vb} role="img" aria-label={label}>{children}</svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

/* ------------------------------------------------------------------ range bars (temperature, humidity) */

interface Zone { from: number; to: number; label: string; tone: 'bad' | 'warn' | 'ok' | 'good' | 'neutral' }

function RangeBar({ min, max, zones, unit, label, caption }: { min: number; max: number; zones: Zone[]; unit: string; label: string; caption?: string }) {
  const X0 = 20, W = 300
  const x = (v: number) => X0 + ((v - min) / (max - min)) * W
  const ticks = [...new Set(zones.flatMap((z) => [z.from, z.to]))].sort((a, b) => a - b)
  let row = 0
  // ticks closer than 26px would overlap: raise every other crowded one
  const raised = new Set<number>()
  ticks.forEach((t, i) => { if (i > 0 && x(t) - x(ticks[i - 1]) < 26 && !raised.has(ticks[i - 1])) raised.add(t) })
  return (
    <Fig label={label} caption={caption} vb="0 0 340 112">
      {zones.map((z, i) => <rect key={i} x={x(z.from)} y={28} width={x(z.to) - x(z.from)} height={26} className={`z-${z.tone}`} />)}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={24} y2={58} className="zline" />
          <text x={x(t)} y={raised.has(t) ? 8 : 18} textAnchor="middle" className="tick">{t}{unit}</text>
        </g>
      ))}
      {zones.map((z, i) => {
        const cx = (x(z.from) + x(z.to)) / 2
        const wide = x(z.to) - x(z.from) >= 46
        if (wide) return <text key={i} x={cx} y={45} textAnchor="middle" className="zlabel">{z.label}</text>
        const y = 72 + (row++ % 2) * 14
        return <text key={i} x={cx} y={y} textAnchor="middle" className="zlabel out">{z.label}</text>
      })}
    </Fig>
  )
}

export const TempRanges = () => (
  <RangeBar min={65} max={100} unit="°" label="Temperature ranges in degrees Fahrenheit: too cold below 75, cool side 78 to 82, warm spot 88 to 92, dangerous above 95"
    caption="Surface temperatures in °F. Aim for a warm spot of 88 to 92° and a cool side of 78 to 80°."
    zones={[
      { from: 65, to: 75, label: 'Too cold', tone: 'bad' },
      { from: 75, to: 78, label: 'Low', tone: 'warn' },
      { from: 78, to: 82, label: 'Cool side', tone: 'ok' },
      { from: 82, to: 88, label: 'Gradient', tone: 'neutral' },
      { from: 88, to: 92, label: 'Warm spot', tone: 'good' },
      { from: 92, to: 95, label: 'Hot', tone: 'warn' },
      { from: 95, to: 100, label: 'Danger', tone: 'bad' },
    ]} />
)

export const HumidityRanges = () => (
  <RangeBar min={20} max={100} unit="%" label="Humidity ranges: too dry below 45, everyday 55 to 65, shedding 65 to 75, too wet above 80"
    caption="Relative humidity. Everyday 55 to 65 %, raised to 65 to 75 % while shedding."
    zones={[
      { from: 20, to: 45, label: 'Too dry', tone: 'bad' },
      { from: 45, to: 55, label: 'Low', tone: 'warn' },
      { from: 55, to: 65, label: 'Everyday', tone: 'good' },
      { from: 65, to: 75, label: 'Shedding', tone: 'ok' },
      { from: 75, to: 80, label: 'High', tone: 'warn' },
      { from: 80, to: 100, label: 'Too wet', tone: 'bad' },
    ]} />
)

/* ------------------------------------------------------------------ enclosure layout (top view) */

export const EnclosureLayout = () => (
  <Fig label="Top view of an enclosure: heat at the left end, a warm hide, a cool hide, a humid hide, a water bowl and the thermostat probe on the warm surface" vb="0 0 340 236"
       caption="Heat only one end, so the snake can choose. Put the thermostat probe where the snake sits on the warm side.">
    <defs>
      <linearGradient id="grad" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#e9803a" stopOpacity=".55" />
        <stop offset="1" stopColor="#4aa3b8" stopOpacity=".35" />
      </linearGradient>
    </defs>
    <text x="55" y="16" textAnchor="middle" className="tick strong">WARM 88 to 92°F</text>
    <text x="285" y="16" textAnchor="middle" className="tick strong">COOL 78 to 80°F</text>
    <rect x="16" y="24" width="308" height="160" rx="10" fill="url(#grad)" className="outline" />
    <rect x="16" y="24" width="78" height="160" rx="10" className="heatzone" />
    <text x="55" y="204" textAnchor="middle" className="tick">Heat source</text>
    <text x="55" y="217" textAnchor="middle" className="tick">(thermostat controlled)</text>
    {/* hides */}
    <rect x="28" y="40" width="58" height="36" rx="14" className="hide" />
    <text x="57" y="62" textAnchor="middle" className="onhide">Warm hide</text>
    <rect x="258" y="40" width="58" height="36" rx="14" className="hide" />
    <text x="287" y="62" textAnchor="middle" className="onhide">Cool hide</text>
    <rect x="228" y="124" width="74" height="38" rx="14" className="hide moss" />
    <text x="265" y="140" textAnchor="middle" className="onhide">Humid hide</text>
    <text x="265" y="153" textAnchor="middle" className="onhide small">damp moss</text>
    {/* water */}
    <ellipse cx="170" cy="138" rx="30" ry="21" className="water" />
    <text x="170" y="142" textAnchor="middle" className="onwater">Water</text>
    {/* clutter */}
    <circle cx="148" cy="52" r="14" className="plant" /><circle cx="168" cy="62" r="11" className="plant" /><circle cx="130" cy="72" r="9" className="plant" />
    <text x="150" y="94" textAnchor="middle" className="tick">Cover and clutter</text>
    {/* probe */}
    <circle cx="58" cy="124" r="6" className="probe" />
    <line x1="58" y1="130" x2="58" y2="150" className="zline" />
    <text x="56" y="161" textAnchor="middle" className="tick">Thermostat</text>
    <text x="56" y="172" textAnchor="middle" className="tick">probe</text>
  </Fig>
)

/* ------------------------------------------------------------------ prey size */

export const PreySize = () => (
  <Fig label="Prey should be about as wide as the widest part of the snake: a matching bar is right, a much wider bar is too big and a very narrow one is too small" vb="0 0 340 196"
       caption="Compare the prey's width with the snake's widest part. Another check: the meal should weigh about 10 to 15 % of the snake.">
    <text x="10" y="16" className="tick strong">Snake: widest part of the body</text>
    <rect x="10" y="22" width="150" height="22" rx="11" className="body" />
    <text x="10" y="64" className="tick strong">Prey</text>
    <rect x="10" y="72" width="146" height="20" rx="10" className="z-good" />
    <text x="170" y="86" className="zlabel">✓ Good: about the same width</text>
    <rect x="10" y="102" width="86" height="20" rx="10" className="z-warn" />
    <text x="110" y="116" className="zlabel">! Too small: under about 2/3 of the width</text>
    <rect x="10" y="132" width="210" height="20" rx="10" className="z-bad" />
    <text x="10" y="170" className="zlabel">✕ Too big: wider than the snake. Risk of regurgitation</text>
    <text x="10" y="186" className="tick">Weigh the rodent if you can: aim for 10 to 15 % of the snake's weight.</text>
  </Fig>
)

/* ------------------------------------------------------------------ growth bands */

const MONTHS = [0, 6, 12, 18, 24, 36, 48]
const MALE: [number, number][] = [[45, 90], [150, 300], [350, 700], [600, 1000], [800, 1300], [1000, 1600], [1100, 1800]]
const FEMALE: [number, number][] = [[45, 90], [175, 400], [450, 1000], [800, 1500], [1100, 2000], [1500, 2600], [1800, 3200]]

export const WeightBands = () => {
  const L = 44, R = 322, T = 14, B = 164
  const x = (m: number) => L + (m / 48) * (R - L)
  const y = (g: number) => B - (g / 3500) * (B - T)
  const band = (d: [number, number][]) =>
    [...d.map(([lo], i) => `${i ? 'L' : 'M'}${x(MONTHS[i]).toFixed(1)},${y(lo).toFixed(1)}`),
     ...d.map(([, hi], i) => `L${x(MONTHS[d.length - 1 - i]).toFixed(1)},${y(d[d.length - 1 - i][1]).toFixed(1)}`), 'Z'].join(' ')
  return (
    <Fig label="Approximate weight ranges by age for male and female ball pythons, from hatchling to four years" vb="0 0 340 214"
         caption="Rough ranges only. Lines, feeding and genetics vary a lot, so watch your snake's own trend.">
      {[0, 1000, 2000, 3000].map((g) => (
        <g key={g}>
          <line x1={L} x2={R} y1={y(g)} y2={y(g)} className="grid" />
          <text x={L - 6} y={y(g) + 3} textAnchor="end" className="tick">{g.toLocaleString()}</text>
        </g>
      ))}
      <text x="10" y={T + 4} className="tick">grams</text>
      <path d={band(FEMALE)} className="band-f" />
      <path d={band(MALE)} className="band-m" />
      {[0, 12, 24, 36, 48].map((m) => (
        <text key={m} x={x(m)} y={B + 14} textAnchor="middle" className="tick">{m === 0 ? 'Hatch' : `${m / 12} yr`}</text>
      ))}
      <text x={x(36) + 4} y={y(2250)} className="zlabel strong">Female</text>
      <text x={x(38)} y={y(1250)} className="zlabel strong">Male</text>
      <g transform="translate(60 196)">
        <rect width="12" height="8" className="band-f" /><text x="18" y="8" className="tick">Female range</text>
        <rect x="110" width="12" height="8" className="band-m" /><text x="128" y="8" className="tick">Male range</text>
      </g>
    </Fig>
  )
}

/* ------------------------------------------------------------------ body condition cross-sections */

function Panel({ ox, title, sub, children, gap }: { ox: number; title: string; sub: string[]; children: ReactNode; gap: number }) {
  return (
    <g transform={`translate(${ox} 0)`}>
      {children}
      <text x="55" y="106" textAnchor="middle" className="zlabel strong">{title}</text>
      {sub.map((s, i) => <text key={i} x="55" y={120 + i * 12} textAnchor="middle" className="tick">{s}</text>)}
      <g transform="translate(14 160)">
        <rect x={-4} y={-3} width={6 * (12 + gap) + 4} height={16} rx="4" className={gap > 3 ? 'skin' : 'noskin'} />
        {Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x={i * (12 + gap)} width="12" height="10" rx="3" className="scale" />
        ))}
      </g>
    </g>
  )
}

export const BodyCondition = () => (
  <Fig label="Cross-sections of an underweight, a healthy and an overweight snake, with the scales below showing skin gaps only on the overweight one" vb="0 0 360 192"
       caption="Imagine slicing the snake through the middle. Also look at the scales: in an overweight snake, skin shows between them.">
    <Panel ox={0} title="Underweight" sub={['Triangular, spine ridge', 'Loose, wrinkled skin']} gap={0}>
      <path d="M55 14 C61 14 64 24 71 40 C80 60 84 72 68 78 L42 78 C26 72 30 60 39 40 C46 24 49 14 55 14 Z" className="body" />
      <path d="M55 20 L55 74" className="spine" />
      <path d="M44 56 L36 60 M45 66 L38 70 M66 56 L74 60 M65 66 L72 70" className="spine" />
    </Panel>
    <Panel ox={120} title="Healthy" sub={['Rounded, slightly oval', 'Scales touching']} gap={1}>
      <path d="M55 24 C80 24 88 42 86 56 C84 72 70 80 55 80 C40 80 26 72 24 56 C22 42 30 24 55 24 Z" className="body" />
      <path d="M55 30 L55 32" className="spine" />
    </Panel>
    <Panel ox={240} title="Overweight" sub={['Wide, bulging, flat top', 'Skin shows between scales']} gap={4}>
      <path d="M55 32 C61 26 70 24 78 30 C97 38 102 64 88 78 C77 88 33 88 22 78 C8 64 13 38 32 30 C40 24 49 26 55 32 Z" className="body" />
      <path d="M55 32 L55 44" className="spine" />
      <path d="M20 60 C30 66 34 68 40 68 M90 60 C80 66 76 68 70 68" className="spine" />
    </Panel>
  </Fig>
)

/* ------------------------------------------------------------------ shed timeline */

const STAGES: { name: string; days: string; eye: string; extra?: string }[] = [
  { name: 'Dull', days: '1 to 3 d', eye: '#b9b4a0' },
  { name: 'In blue', days: '2 to 5 d', eye: '#7fb2d9' },
  { name: 'Clearing', days: '1 to 3 d', eye: '#2b2b2b' },
  { name: 'Shed', days: '1 to 2 d', eye: '#f3efe0' },
  { name: 'Done', days: 'normal', eye: '#2f7d4f' },
]

export const ShedTimeline = () => (
  <Fig label="The shed cycle: dull skin, blue eyes, clearing, shedding, done. No handling or feeding while dull or blue, and raise humidity throughout" vb="0 0 340 150"
       caption="Raise humidity for the whole cycle. Leave the snake alone, with no food, while it is dull or in blue.">
    <line x1="30" x2="310" y1="78" y2="78" className="zline" />
    {STAGES.map((s, i) => {
      const cx = 30 + i * 70
      return (
        <g key={s.name}>
          <circle cx={cx} cy={78} r="16" className="stage" />
          <ellipse cx={cx} cy={78} rx="10" ry="7" fill={s.eye} className="eyeoutline" />
          {i !== 3 && <circle cx={cx} cy={78} r="2.6" fill="#101010" fillOpacity={i === 0 || i === 1 ? 0.25 : 0.9} />}
          <text x={cx} y={110} textAnchor="middle" className="zlabel strong">{s.name}</text>
          <text x={cx} y={123} textAnchor="middle" className="tick">{s.days}</text>
        </g>
      )
    })}
    <text x="170" y="142" textAnchor="middle" className="tick">The whole cycle takes about 10 to 14 days.</text>
    <path d="M14 56 H100" className="bracket" /><text x="57" y="50" textAnchor="middle" className="tick strong">No handling or food</text>
    <path d="M14 36 H310" className="bracket" /><text x="162" y="30" textAnchor="middle" className="tick strong">Humidity 65 to 75 %</text>
  </Fig>
)

/* ------------------------------------------------------------------ body language and the curled-up ball */

function SnakeHead({ shape, tongue, mouth, tucked }: { shape: string; tongue?: boolean; mouth?: boolean; tucked?: boolean }) {
  const h = SNAKES[shape].head
  return (
    <g transform={`translate(${h.x} ${h.y}) rotate(${h.angle})`}>
      {mouth ? (
        <>
          <path d="M10 -2 L46 -15 L46 15 L10 2 Z" className="mouth" />
          <ellipse cx="4" rx="16" ry="14" className="snake" />
          <ellipse cx="22" cy="-8" rx="24" ry="8" transform="rotate(-10 22 -8)" className="snake" />
          <ellipse cx="22" cy="8" rx="24" ry="8" transform="rotate(10 22 8)" className="snake" />
          <circle cx="14" cy="-10" r="3.4" className="eye" />
        </>
      ) : (
        <>
          <ellipse cx={tucked ? 4 : 10} rx={tucked ? 15 : 27} ry={tucked ? 11 : 18} className="snake" />
          {!tucked && <><circle cx="16" cy="-9" r="3.6" className="eye" /><circle cx="16" cy="9" r="3.6" className="eye" /></>}
        </>
      )}
      {tongue && <path d="M36 0 H56 M56 0 L65 -7 M56 0 L65 7" className="tongue" />}
    </g>
  )
}

function Panel3({ shape, title, note, tongue, mouth, tucked }: { shape: string; title: string; note: string; tongue?: boolean; mouth?: boolean; tucked?: boolean }) {
  return (
    <figure className="gfig gpanel">
      <svg viewBox="0 0 260 190" role="img" aria-label={`${title}: ${note}`}>
        <rect width="260" height="190" rx="16" className="tile" />
        <path d={SNAKES[shape].d} className="snake" />
        <SnakeHead shape={shape} tongue={tongue} mouth={mouth} tucked={tucked} />
      </svg>
      <figcaption><strong>{title}</strong><br />{note}</figcaption>
    </figure>
  )
}

export const BodyLanguage = () => (
  <div className="gfig-grid">
    <Panel3 shape="explore" title="Relaxed and curious" note="Head up, loose body, slow tongue flicks." tongue />
    <Panel3 shape="ball" title="Balled up" note="Head tucked in the middle: scared, not angry. Leave it or hold gently." tucked />
    <Panel3 shape="strike" title="S-curve, ready to strike" note="Neck pulled back and tense. Back away slowly." mouth />
  </div>
)

export const BallUp = () => (
  <div className="gfig-grid single">
    <Panel3 shape="ball" title="The ball python's defence" note="When frightened it curls into a ball with its head tucked in. That is where the name comes from." tucked />
  </div>
)

/* ------------------------------------------------------------------ mite hotspots */

export const MiteHotspots = () => (
  <Fig label="Top view of a snake's head and neck showing where mites gather: along the lips and heat pits, around the eyes and in the neck skin folds" vb="0 0 340 226"
       caption="Check these spots first. Also look under the chin and jaw, around the vent, in belly folds and in the water bowl.">
    {/* neck, then head */}
    <path d="M70 148 C66 176 60 200 58 218 L142 218 C140 200 134 176 130 148 Z" className="snake headdraw" />
    <path d="M64 172 C82 182 118 182 136 172 M60 192 C82 206 118 206 140 192" className="foldline" />
    <path d="M100 12 C112 12 118 26 122 44 C134 62 146 78 146 106 C146 136 126 154 100 154 C74 154 54 136 54 106 C54 78 66 62 78 44 C82 26 88 12 100 12 Z" className="snake headdraw" />
    <circle cx="94" cy="22" r="1.8" className="eye" /><circle cx="106" cy="22" r="1.8" className="eye" />
    <circle cx="72" cy="72" r="5" className="eye" /><circle cx="128" cy="72" r="5" className="eye" />
    <path d="M85 36 L82 54 M115 36 L118 54" className="pit" />
    {/* hotspots */}
    <ellipse cx="84" cy="45" rx="9" ry="17" className="hot" transform="rotate(-10 84 45)" />
    <ellipse cx="116" cy="45" rx="9" ry="17" className="hot" transform="rotate(10 116 45)" />
    <circle cx="72" cy="72" r="15" className="hot" /><circle cx="128" cy="72" r="15" className="hot" />
    <ellipse cx="100" cy="188" rx="46" ry="19" className="hot" />
    {/* labels */}
    <line x1="124" x2="168" y1="42" y2="38" className="zline" />
    <text x="172" y="42" className="zlabel">1 Lips and heat pits</text>
    <line x1="142" x2="168" y1="74" y2="82" className="zline" />
    <text x="172" y="86" className="zlabel">2 Around the eyes</text>
    <line x1="146" x2="168" y1="188" y2="188" className="zline" />
    <text x="172" y="192" className="zlabel">3 Neck skin folds</text>
    <text x="172" y="124" className="tick">Also check under the</text>
    <text x="172" y="136" className="tick">chin and jaw.</text>
  </Fig>
)

export const FIGURES: Record<string, () => JSX.Element> = {
  'ball-up': BallUp,
  'enclosure-layout': EnclosureLayout,
  'temp-ranges': TempRanges,
  'humidity-ranges': HumidityRanges,
  'prey-size': PreySize,
  'weight-bands': WeightBands,
  'body-condition': BodyCondition,
  'shed-timeline': ShedTimeline,
  'body-language': BodyLanguage,
  'mite-hotspots': MiteHotspots,
}
